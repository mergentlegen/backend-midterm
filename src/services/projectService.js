const pool = require("../db");
const AppError = require("../utils/AppError");

async function createProject(projectData) {
  const { title, description, goal, deadline, status = "draft", creator_id } = projectData;

  const userCheckResult = await pool.query("SELECT id FROM users WHERE id = $1", [creator_id]);

  if (userCheckResult.rowCount === 0) {
    throw new AppError("Creator user not found.", 404);
  }

  const query = `
    INSERT INTO projects (title, description, goal, deadline, status, creator_id)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, creator_id, title, description, goal, deadline, status, created_at
  `;

  const values = [title.trim(), description.trim(), goal, deadline, status, creator_id];
  const result = await pool.query(query, values);

  return result.rows[0];
}

async function getAllProjects() {
  const query = `
    SELECT
      p.id,
      p.creator_id,
      p.title,
      p.description,
      p.goal,
      p.deadline,
      p.status,
      p.created_at,
      COALESCE(COUNT(rt.id), 0)::INTEGER AS reward_tiers_count
    FROM projects p
    LEFT JOIN reward_tiers rt ON rt.project_id = p.id
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `;

  const result = await pool.query(query);
  return result.rows;
}

async function getProjectById(projectId) {
  const projectQuery = `
    SELECT
      id,
      creator_id,
      title,
      description,
      goal,
      deadline,
      status,
      created_at
    FROM projects
    WHERE id = $1
  `;

  const projectResult = await pool.query(projectQuery, [projectId]);

  if (projectResult.rowCount === 0) {
    throw new AppError("Project not found.", 404);
  }

  const rewardTiersQuery = `
    SELECT
      id,
      project_id,
      title,
      amount,
      quantity_total,
      quantity_remaining,
      created_at
    FROM reward_tiers
    WHERE project_id = $1
    ORDER BY amount ASC, id ASC
  `;

  const rewardTiersResult = await pool.query(rewardTiersQuery, [projectId]);

  return {
    ...projectResult.rows[0],
    reward_tiers: rewardTiersResult.rows,
  };
}

async function addRewardTier(projectId, rewardTierData) {
  const { title, amount, quantity_total } = rewardTierData;

  const projectCheckResult = await pool.query("SELECT id, status FROM projects WHERE id = $1", [projectId]);

  if (projectCheckResult.rowCount === 0) {
    throw new AppError("Project not found.", 404);
  }

  if (projectCheckResult.rows[0].status !== "draft" && projectCheckResult.rows[0].status !== "active") {
    throw new AppError("Cannot add reward tiers to a finalized project.", 409);
  }

  const query = `
    INSERT INTO reward_tiers (
      project_id,
      title,
      amount,
      quantity_total,
      quantity_remaining
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, project_id, title, amount, quantity_total, quantity_remaining, created_at
  `;

  const values = [projectId, title.trim(), amount, quantity_total, quantity_total];
  const result = await pool.query(query, values);

  return result.rows[0];
}

module.exports = {
  createProject,
  getAllProjects,
  getProjectById,
  addRewardTier,
};
