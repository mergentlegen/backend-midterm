const {
  PledgeServiceError,
  createPledge: createPledgeService,
  finalizeProject: finalizeProjectService,
} = require('../services/pledgeService');

function handleError(res, error) {
  if (error instanceof PledgeServiceError) {
    return res.status(error.statusCode).json({
      message: error.message,
    });
  }

  console.error(error);

  return res.status(500).json({
    message: 'Internal server error',
  });
}

async function createPledge(req, res) {
  try {
    const projectId = Number(req.params.id);
    const { backer_id: backerId, tier_id: tierId = null, amount } = req.body;

    const pledge = await createPledgeService(projectId, backerId, tierId, amount);

    return res.status(201).json({
      message: 'Pledge created successfully',
      data: pledge,
    });
  } catch (error) {
    return handleError(res, error);
  }
}

async function finalizeProject(req, res) {
  try {
    const projectId = Number(req.params.id);
    const result = await finalizeProjectService(projectId);

    return res.status(200).json({
      message: 'Project finalized successfully',
      data: result,
    });
  } catch (error) {
    return handleError(res, error);
  }
}

module.exports = {
  createPledge,
  finalizeProject,
};
