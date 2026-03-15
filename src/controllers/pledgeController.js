const pledgeService = require("../services/pledgeService");

async function createPledge(req, res, next) {
  try {
    const projectId = Number(req.params.id);
    const { backer_id: backerId, tier_id: tierId = null, amount } = req.body;

    const pledge = await pledgeService.createPledge(projectId, backerId, tierId, amount);

    return res.status(201).json({
      message: "Pledge created successfully",
      data: pledge,
    });
  } catch (error) {
    return next(error);
  }
}

async function finalizeProject(req, res, next) {
  try {
    const projectId = Number(req.params.id);
    const result = await pledgeService.finalizeProject(projectId);

    return res.status(200).json({
      message: "Project finalized successfully",
      data: result,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createPledge,
  finalizeProject,
};
