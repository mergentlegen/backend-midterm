const prisma = require("../db/prisma");
const AppError = require("../utils/AppError");
const { toNumber, serializePledge } = require("../utils/serialize");

async function createPledge(projectId, pledgeData, backerId) {
  const { tier_id = null, amount } = pledgeData;

  return prisma.$transaction(async (tx) => {
    const project = await tx.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new AppError("Project not found.", 404);
    }

    if (new Date(project.deadline) <= new Date()) {
      throw new AppError("Cannot pledge to a project whose deadline has passed.", 400);
    }

    if (["closed", "cancelled", "successful", "failed"].includes(project.status)) {
      throw new AppError("Cannot pledge to a project that is not open for funding.", 400);
    }

    const backer = await tx.user.findUnique({
      where: { id: backerId },
    });

    if (!backer) {
      throw new AppError("Backer user not found.", 404);
    }

    if (tier_id) {
      const tier = await tx.rewardTier.findFirst({
        where: {
          id: tier_id,
          projectId,
        },
      });

      if (!tier) {
        throw new AppError("Reward tier not found for this project.", 404);
      }

      if (tier.quantityRemaining <= 0) {
        throw new AppError("Reward tier is no longer available.", 400);
      }

      const updatedTier = await tx.rewardTier.updateMany({
        where: {
          id: tier_id,
          projectId,
          quantityRemaining: {
            gt: 0,
          },
        },
        data: {
          quantityRemaining: {
            decrement: 1,
          },
        },
      });

      if (updatedTier.count === 0) {
        throw new AppError("Reward tier is no longer available.", 400);
      }
    }

    const pledge = await tx.pledge.create({
      data: {
        projectId,
        backerId,
        tierId: tier_id,
        amount,
        status: "pending",
      },
    });

    return serializePledge(pledge);
  });
}

async function finalizeProject(projectId, userId) {
  return prisma.$transaction(async (tx) => {
    const project = await tx.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new AppError("Project not found.", 404);
    }

    if (project.creatorId !== userId) {
      throw new AppError("Only the project creator can finalize the project.", 403);
    }

    if (project.status === "successful" || project.status === "failed") {
      throw new AppError("Project has already been finalized.", 400);
    }

    const total = await tx.pledge.aggregate({
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

    const totalPledged = toNumber(total._sum.amount || 0);
    const goal = toNumber(project.goal);

    if (totalPledged >= goal) {
      await tx.project.update({
        where: { id: projectId },
        data: { status: "successful" },
      });

      await tx.pledge.updateMany({
        where: { projectId },
        data: { status: "confirmed" },
      });

      return {
        project_id: projectId,
        total_pledged: totalPledged,
        goal,
        status: "successful",
      };
    }

    await tx.project.update({
      where: { id: projectId },
      data: { status: "failed" },
    });

    const tierCounts = await tx.pledge.groupBy({
      by: ["tierId"],
      where: {
        projectId,
        tierId: {
          not: null,
        },
        status: {
          not: "refunded",
        },
      },
      _count: {
        tierId: true,
      },
    });

    for (const row of tierCounts) {
      await tx.rewardTier.update({
        where: { id: row.tierId },
        data: {
          quantityRemaining: {
            increment: row._count.tierId,
          },
        },
      });
    }

    const pledgesToRefund = await tx.pledge.findMany({
      where: {
        projectId,
        status: {
          not: "refunded",
        },
      },
      select: {
        id: true,
        amount: true,
      },
    });

    if (pledgesToRefund.length > 0) {
      await tx.refund.createMany({
        data: pledgesToRefund.map((pledge) => ({
          pledgeId: pledge.id,
          amount: pledge.amount,
          status: "pending",
        })),
        skipDuplicates: true,
      });
    }

    await tx.pledge.updateMany({
      where: {
        projectId,
        status: {
          not: "refunded",
        },
      },
      data: { status: "refunded" },
    });

    return {
      project_id: projectId,
      total_pledged: totalPledged,
      goal,
      status: "failed",
      refunds_created: pledgesToRefund.length,
    };
  });
}

module.exports = {
  createPledge,
  finalizeProject,
};
