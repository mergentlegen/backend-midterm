const prisma = require("../db/prisma");
const AppError = require("../utils/AppError");
const { toNumber, serializeProject, serializeRewardTier } = require("../utils/serialize");

async function createProject(projectData, creatorId) {
  const { title, description, goal, deadline, status = "draft" } = projectData;

  const user = await prisma.user.findUnique({
    where: { id: creatorId },
  });

  if (!user) {
    throw new AppError("Creator user not found.", 404);
  }

  const project = await prisma.project.create({
    data: {
      title,
      description,
      goal,
      deadline: new Date(deadline),
      status,
      creatorId,
    },
  });

  return serializeProject(project);
}

async function getAllProjects(filters = {}) {
  const where = {};

  if (filters.finalized === "true") {
    where.status = {
      in: ["successful", "failed"],
    };
  }

  if (filters.status) {
    where.status = filters.status;
  }

  const projects = await prisma.project.findMany({
    where,
    include: {
      _count: {
        select: {
          rewardTiers: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return projects.map((project) => ({
    ...serializeProject(project),
    reward_tiers_count: project._count.rewardTiers,
  }));
}

async function getProjectById(projectId) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      rewardTiers: {
        orderBy: [{ amount: "asc" }, { id: "asc" }],
      },
    },
  });

  if (!project) {
    throw new AppError("Project not found.", 404);
  }

  return {
    ...serializeProject(project),
    reward_tiers: project.rewardTiers.map(serializeRewardTier),
  };
}

async function addRewardTier(projectId, rewardTierData, userId) {
  const { title, amount, quantity_total } = rewardTierData;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new AppError("Project not found.", 404);
  }

  if (project.creatorId !== userId) {
    throw new AppError("Only the project creator can add reward tiers.", 403);
  }

  const rewardTier = await prisma.rewardTier.create({
    data: {
      projectId,
      title,
      amount,
      quantityTotal: quantity_total,
      quantityRemaining: quantity_total,
    },
  });

  return serializeRewardTier(rewardTier);
}

async function getProjectProgress(projectId) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new AppError("Project not found.", 404);
  }

  const total = await prisma.pledge.aggregate({
    where: {
      projectId,
      status: {
        not: "refunded",
      },
    },
    _sum: {
      amount: true,
    },
  });

  const pledgedAmount = toNumber(total._sum.amount || 0);
  const goal = toNumber(project.goal);

  return {
    project_id: project.id,
    goal,
    pledged_amount: pledgedAmount,
    remaining_amount: Math.max(goal - pledgedAmount, 0),
    status: project.status,
    is_finalized: ["successful", "failed"].includes(project.status),
  };
}

module.exports = {
  createProject,
  getAllProjects,
  getProjectById,
  addRewardTier,
  getProjectProgress,
};
