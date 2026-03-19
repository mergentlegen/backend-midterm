function toNumber(value) {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === "object" && typeof value.toNumber === "function") {
    return value.toNumber();
  }

  return Number(value);
}

function serializeRewardTier(tier) {
  return {
    id: tier.id,
    project_id: tier.projectId,
    title: tier.title,
    amount: toNumber(tier.amount),
    quantity_total: tier.quantityTotal,
    quantity_remaining: tier.quantityRemaining,
  };
}

function serializeProject(project) {
  return {
    id: project.id,
    title: project.title,
    description: project.description,
    goal: toNumber(project.goal),
    deadline: project.deadline,
    status: project.status,
    creator_id: project.creatorId,
    created_at: project.createdAt,
  };
}

function serializePledge(pledge) {
  return {
    id: pledge.id,
    project_id: pledge.projectId,
    backer_id: pledge.backerId,
    tier_id: pledge.tierId,
    amount: toNumber(pledge.amount),
    status: pledge.status,
    created_at: pledge.createdAt,
  };
}

function serializeRefund(refund) {
  return {
    id: refund.id,
    pledge_id: refund.pledgeId,
    amount: toNumber(refund.amount),
    status: refund.status,
    created_at: refund.createdAt,
  };
}

module.exports = {
  toNumber,
  serializeProject,
  serializeRewardTier,
  serializePledge,
  serializeRefund,
};
