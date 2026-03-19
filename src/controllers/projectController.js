const projectService = require("../services/projectService");

async function createProject(req, res, next) {
  try {
    const project = await projectService.createProject(req.body, req.user.id);
    res.status(201).json({
      message: "Project created successfully.",
      data: project,
    });
  } catch (error) {
    next(error);
  }
}

async function getAllProjects(req, res, next) {
  try {
    const projects = await projectService.getAllProjects(req.query);
    res.status(200).json({
      message: "Projects fetched successfully.",
      data: projects,
    });
  } catch (error) {
    next(error);
  }
}

async function getProjectById(req, res, next) {
  try {
    const project = await projectService.getProjectById(Number(req.params.id));
    res.status(200).json({
      message: "Project fetched successfully.",
      data: project,
    });
  } catch (error) {
    next(error);
  }
}

async function addRewardTier(req, res, next) {
  try {
    const rewardTier = await projectService.addRewardTier(Number(req.params.id), req.body, req.user.id);
    res.status(201).json({
      message: "Reward tier added successfully.",
      data: rewardTier,
    });
  } catch (error) {
    next(error);
  }
}

async function getProjectProgress(req, res, next) {
  try {
    const progress = await projectService.getProjectProgress(Number(req.params.id));
    res.status(200).json({
      message: "Project progress fetched successfully.",
      data: progress,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createProject,
  getAllProjects,
  getProjectById,
  addRewardTier,
  getProjectProgress,
};
