const pool = require("../db");
const AppError = require("../utils/AppError");

function isPositiveInteger(value) {
  return Number.isInteger(Number(value)) && Number(value) > 0;
}

function isPositiveNumber(value) {
  return Number.isFinite(Number(value)) && Number(value) > 0;
}

async function createPledge(projectId, backerId, tierId, amount) {
  if (!isPositiveInteger(projectId)) {
    throw new AppError("Invalid project id.", 400);
  }

  if (!isPositiveInteger(backerId)) {
    throw new AppError("Invalid backer_id.", 400);
  }

  if (tierId !== null && tierId !== undefined && !isPositiveInteger(tierId)) {
    throw new AppError("Invalid tier_id.", 400);
  }

  if (!isPositiveNumber(amount)) {
    throw new AppError("Invalid amount.", 400);
  }

  const client = await pool.connect();

  try {
    // Keep validation, stock update, and pledge creation in one transaction.
    await client.query("BEGIN");

    const projectResult = await client.query(
      `
        SELECT id, goal, deadline, status
        FROM projects
        WHERE id = $1
        FOR UPDATE
      `,
      [projectId]
    );

    if (projectResult.rowCount === 0) {
      throw new AppError("Project not found.", 404);
    }

    const project = projectResult.rows[0];

    if (project.status !== "active") {
      throw new AppError("Project is not active.", 409);
    }

    if (new Date(project.deadline) <= new Date()) {
      throw new AppError("Cannot pledge after the project deadline.", 409);
    }

    const backerResult = await client.query("SELECT id FROM users WHERE id = $1", [backerId]);

    if (backerResult.rowCount === 0) {
      throw new AppError("Backer not found.", 404);
    }

    let tier = null;

    if (tierId !== null && tierId !== undefined) {
      const tierResult = await client.query(
        `
          SELECT id, project_id, title, amount, quantity_total, quantity_remaining
          FROM reward_tiers
          WHERE id = $1 AND project_id = $2
          FOR UPDATE
        `,
        [tierId, projectId]
      );

      if (tierResult.rowCount === 0) {
        throw new AppError("Reward tier not found for this project.", 404);
      }

      tier = tierResult.rows[0];

      if (Number(tier.quantity_remaining) <= 0) {
        throw new AppError("Selected reward tier is sold out.", 409);
      }

      if (Number(amount) < Number(tier.amount)) {
        throw new AppError("Pledge amount must be greater than or equal to the tier amount.", 400);
      }
    }

    const pledgeResult = await client.query(
      `
        INSERT INTO pledges (project_id, backer_id, tier_id, amount, status)
        VALUES ($1, $2, $3, $4, 'confirmed')
        RETURNING id, project_id, backer_id, tier_id, amount, status, created_at
      `,
      [projectId, backerId, tierId ?? null, amount]
    );

    if (tier) {
      await client.query(
        `
          UPDATE reward_tiers
          SET quantity_remaining = quantity_remaining - 1
          WHERE id = $1
        `,
        [tier.id]
      );
    }

    await client.query("COMMIT");
    return pledgeResult.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function finalizeProject(projectId) {
  if (!isPositiveInteger(projectId)) {
    throw new AppError("Invalid project id.", 400);
  }

  const client = await pool.connect();

  try {
    // Lock the project so finalization and pledging cannot race each other.
    await client.query("BEGIN");

    const projectResult = await client.query(
      `
        SELECT id, creator_id, title, description, goal, deadline, status, created_at
        FROM projects
        WHERE id = $1
        FOR UPDATE
      `,
      [projectId]
    );

    if (projectResult.rowCount === 0) {
      throw new AppError("Project not found.", 404);
    }

    const project = projectResult.rows[0];

    if (project.status !== "active") {
      throw new AppError("Only active projects can be finalized.", 409);
    }

    const totalResult = await client.query(
      `
        SELECT COALESCE(SUM(amount), 0) AS total_pledged
        FROM pledges
        WHERE project_id = $1 AND status = 'confirmed'
      `,
      [projectId]
    );

    const totalPledged = Number(totalResult.rows[0].total_pledged);
    const nextStatus = totalPledged >= Number(project.goal) ? "successful" : "failed";

    const updatedProjectResult = await client.query(
      `
        UPDATE projects
        SET status = $2
        WHERE id = $1
        RETURNING id, creator_id, title, description, goal, deadline, status, created_at
      `,
      [projectId, nextStatus]
    );

    let refundsCreated = 0;

    if (nextStatus === "failed") {
      const pledgeResult = await client.query(
        `
          SELECT id, tier_id, amount
          FROM pledges
          WHERE project_id = $1 AND status = 'confirmed'
          FOR UPDATE
        `,
        [projectId]
      );

      for (const pledge of pledgeResult.rows) {
        await client.query(
          `
            INSERT INTO refunds (pledge_id, amount, status)
            VALUES ($1, $2, 'pending')
          `,
          [pledge.id, pledge.amount]
        );

        refundsCreated += 1;

        if (pledge.tier_id) {
          await client.query(
            `
              UPDATE reward_tiers
              SET quantity_remaining = quantity_remaining + 1
              WHERE id = $1
            `,
            [pledge.tier_id]
          );
        }
      }

      await client.query(
        `
          UPDATE pledges
          SET status = 'refunded'
          WHERE project_id = $1 AND status = 'confirmed'
        `,
        [projectId]
      );
    }

    await client.query("COMMIT");

    return {
      project: updatedProjectResult.rows[0],
      total_pledged: totalPledged,
      refunds_created: refundsCreated,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  createPledge,
  finalizeProject,
};
