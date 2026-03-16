const pool = require("../db/pool");
const AppError = require("../utils/AppError");

async function createPledge(projectId, pledgeData) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const projectResult = await client.query(
      `
        SELECT id, deadline, status
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

    if (new Date(project.deadline) <= new Date()) {
      throw new AppError("Cannot pledge to a project whose deadline has passed.", 400);
    }

    if (["closed", "cancelled", "successful", "failed"].includes(project.status)) {
      throw new AppError("Cannot pledge to a project that is not open for funding.", 400);
    }

    const { backer_id, tier_id = null, amount } = pledgeData;

    const backerResult = await client.query("SELECT id FROM users WHERE id = $1", [backer_id]);

    if (backerResult.rowCount === 0) {
      throw new AppError("Backer user not found.", 404);
    }

    if (tier_id) {
      const tierResult = await client.query(
        `
          SELECT id, project_id, quantity_remaining
          FROM reward_tiers
          WHERE id = $1 AND project_id = $2
          FOR UPDATE
        `,
        [tier_id, projectId]
      );

      if (tierResult.rowCount === 0) {
        throw new AppError("Reward tier not found for this project.", 404);
      }

      if (tierResult.rows[0].quantity_remaining <= 0) {
        throw new AppError("Reward tier is no longer available.", 400);
      }

      const updateTierResult = await client.query(
        `
          UPDATE reward_tiers
          SET quantity_remaining = quantity_remaining - 1
          WHERE id = $1 AND quantity_remaining > 0
          RETURNING id, quantity_remaining
        `,
        [tier_id]
      );

      if (updateTierResult.rowCount === 0) {
        throw new AppError("Reward tier is no longer available.", 400);
      }
    }

    const pledgeResult = await client.query(
      `
        INSERT INTO pledges (project_id, backer_id, tier_id, amount, status)
        VALUES ($1, $2, $3, $4, 'pending')
        RETURNING id, project_id, backer_id, tier_id, amount, status, created_at
      `,
      [projectId, backer_id, tier_id, amount]
    );

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
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const projectResult = await client.query(
      `
        SELECT id, goal, status
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

    if (project.status === "successful" || project.status === "failed") {
      throw new AppError("Project has already been finalized.", 400);
    }

    const totalPledgesResult = await client.query(
      `
        SELECT COALESCE(SUM(amount), 0)::NUMERIC AS total_pledged
        FROM pledges
        WHERE project_id = $1 AND status <> 'refunded'
      `,
      [projectId]
    );

    const totalPledged = Number(totalPledgesResult.rows[0].total_pledged);
    const goal = Number(project.goal);

    if (totalPledged >= goal) {
      await client.query(
        `
          UPDATE projects
          SET status = 'successful'
          WHERE id = $1
        `,
        [projectId]
      );

      await client.query(
        `
          UPDATE pledges
          SET status = 'confirmed'
          WHERE project_id = $1
        `,
        [projectId]
      );

      await client.query("COMMIT");

      return {
        project_id: projectId,
        total_pledged: totalPledged,
        goal,
        status: "successful",
      };
    }

    await client.query(
      `
        UPDATE projects
        SET status = 'failed'
        WHERE id = $1
      `,
      [projectId]
    );

    await client.query(
      `
        UPDATE reward_tiers rt
        SET quantity_remaining = rt.quantity_remaining + pledge_counts.pledge_count
        FROM (
          SELECT tier_id, COUNT(*)::INTEGER AS pledge_count
          FROM pledges
          WHERE project_id = $1
            AND tier_id IS NOT NULL
            AND status <> 'refunded'
          GROUP BY tier_id
        ) AS pledge_counts
        WHERE rt.id = pledge_counts.tier_id
      `,
      [projectId]
    );

    const refundsResult = await client.query(
      `
        INSERT INTO refunds (pledge_id, amount, status)
        SELECT p.id, p.amount, 'pending'
        FROM pledges p
        LEFT JOIN refunds r ON r.pledge_id = p.id
        WHERE p.project_id = $1
          AND p.status <> 'refunded'
          AND r.pledge_id IS NULL
        RETURNING id
      `,
      [projectId]
    );

    await client.query(
      `
        UPDATE pledges
        SET status = 'refunded'
        WHERE project_id = $1 AND status <> 'refunded'
      `,
      [projectId]
    );

    await client.query("COMMIT");

    return {
      project_id: projectId,
      total_pledged: totalPledged,
      goal,
      status: "failed",
      refunds_created: refundsResult.rowCount,
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
