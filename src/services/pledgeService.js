const pool = require('../db');

class PledgeServiceError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = 'PledgeServiceError';
    this.statusCode = statusCode;
  }
}

function isPositiveInteger(value) {
  return Number.isInteger(Number(value)) && Number(value) > 0;
}

function isPositiveNumber(value) {
  return Number.isFinite(Number(value)) && Number(value) > 0;
}

async function createPledge(projectId, backerId, tierId, amount) {
  if (!isPositiveInteger(projectId)) {
    throw new PledgeServiceError('Invalid project id', 400);
  }

  if (!isPositiveInteger(backerId)) {
    throw new PledgeServiceError('Invalid backer_id', 400);
  }

  if (tierId !== undefined && tierId !== null && !isPositiveInteger(tierId)) {
    throw new PledgeServiceError('Invalid tier_id', 400);
  }

  if (!isPositiveNumber(amount)) {
    throw new PledgeServiceError('Invalid amount', 400);
  }

  const client = await pool.connect();

  try {
    // One transaction keeps validation, inventory changes, and pledge creation atomic.
    await client.query('BEGIN');

    const projectResult = await client.query(
      `SELECT id, status, deadline
       FROM projects
       WHERE id = $1
       FOR UPDATE`,
      [projectId]
    );

    if (projectResult.rows.length === 0) {
      throw new PledgeServiceError('Project not found', 404);
    }

    const project = projectResult.rows[0];

    if (project.status !== 'active') {
      throw new PledgeServiceError('Project is not active', 409);
    }

    if (new Date(project.deadline) <= new Date()) {
      throw new PledgeServiceError('Project deadline has passed', 409);
    }

    const backerResult = await client.query(
      `SELECT id
       FROM users
       WHERE id = $1`,
      [backerId]
    );

    if (backerResult.rows.length === 0) {
      throw new PledgeServiceError('Backer not found', 404);
    }

    let selectedTier = null;

    if (tierId !== undefined && tierId !== null) {
      const tierResult = await client.query(
        `SELECT id, amount, quantity_remaining
         FROM reward_tiers
         WHERE id = $1 AND project_id = $2
         FOR UPDATE`,
        [tierId, projectId]
      );

      if (tierResult.rows.length === 0) {
        throw new PledgeServiceError('Reward tier not found', 404);
      }

      selectedTier = tierResult.rows[0];

      if (Number(selectedTier.quantity_remaining) <= 0) {
        throw new PledgeServiceError('Reward tier is sold out', 409);
      }

      if (Number(amount) < Number(selectedTier.amount)) {
        throw new PledgeServiceError(
          'Amount must be greater than or equal to the reward tier amount',
          400
        );
      }
    }

    const pledgeResult = await client.query(
      `INSERT INTO pledges (project_id, backer_id, tier_id, amount, status)
       VALUES ($1, $2, $3, $4, 'confirmed')
       RETURNING id, project_id, backer_id, tier_id, amount, status, created_at`,
      [projectId, backerId, tierId ?? null, amount]
    );

    if (selectedTier) {
      await client.query(
        `UPDATE reward_tiers
         SET quantity_remaining = quantity_remaining - 1
         WHERE id = $1`,
        [selectedTier.id]
      );
    }

    await client.query('COMMIT');
    return pledgeResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function finalizeProject(projectId) {
  if (!isPositiveInteger(projectId)) {
    throw new PledgeServiceError('Invalid project id', 400);
  }

  const client = await pool.connect();

  try {
    // Locking the project row serializes finalization against concurrent pledges.
    await client.query('BEGIN');

    const projectResult = await client.query(
      `SELECT id, goal, status
       FROM projects
       WHERE id = $1
       FOR UPDATE`,
      [projectId]
    );

    if (projectResult.rows.length === 0) {
      throw new PledgeServiceError('Project not found', 404);
    }

    const project = projectResult.rows[0];

    if (project.status !== 'active') {
      throw new PledgeServiceError('Project is already finalized', 409);
    }

    const totalResult = await client.query(
      `SELECT COALESCE(SUM(amount), 0) AS total
       FROM pledges
       WHERE project_id = $1 AND status = 'confirmed'`,
      [projectId]
    );

    const totalPledged = Number(totalResult.rows[0].total);
    const nextStatus = totalPledged >= Number(project.goal) ? 'successful' : 'failed';

    const projectUpdateResult = await client.query(
      `UPDATE projects
       SET status = $2
       WHERE id = $1
       RETURNING id, creator_id, title, description, goal, deadline, status, created_at`,
      [projectId, nextStatus]
    );

    let refundsCreated = 0;

    if (nextStatus === 'failed') {
      const pledgesResult = await client.query(
        `SELECT id, tier_id, amount
         FROM pledges
         WHERE project_id = $1 AND status = 'confirmed'
         FOR UPDATE`,
        [projectId]
      );

      for (const pledge of pledgesResult.rows) {
        await client.query(
          `INSERT INTO refunds (pledge_id, amount, status)
           VALUES ($1, $2, 'pending')`,
          [pledge.id, pledge.amount]
        );

        refundsCreated += 1;

        if (pledge.tier_id) {
          await client.query(
            `UPDATE reward_tiers
             SET quantity_remaining = quantity_remaining + 1
             WHERE id = $1`,
            [pledge.tier_id]
          );
        }
      }

      await client.query(
        `UPDATE pledges
         SET status = 'refunded'
         WHERE project_id = $1 AND status = 'confirmed'`,
        [projectId]
      );
    }

    await client.query('COMMIT');

    return {
      project: projectUpdateResult.rows[0],
      total_pledged: totalPledged,
      refunds_created: refundsCreated,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  PledgeServiceError,
  createPledge,
  finalizeProject,
};
