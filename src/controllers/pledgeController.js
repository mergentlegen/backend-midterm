const pledgeService = require("../services/pledgeService");

async function createPledge(req, res, next) {
  try {
    const pledge = await pledgeService.createPledge(Number(req.params.id), req.body);
    res.status(201).json({
      message: "Pledge created successfully.",
      data: pledge,
    });
  } catch (error) {
    next(error);
  }
}

async function finalizeProject(req, res, next) {
  try {
    const result = await pledgeService.finalizeProject(Number(req.params.id));
    res.status(200).json({
      message: "Project finalized successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createPledge,
  finalizeProject,
};
