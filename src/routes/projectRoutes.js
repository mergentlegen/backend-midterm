const express = require("express");
const projectController = require("../controllers/projectController");
const { authenticate } = require("../middlewares/authMiddleware");
const {
  validateProjectPayload,
  validateRewardTierPayload,
  validateNumericIdParam,
} = require("../middlewares/validators");

const router = express.Router();

router.post("/", authenticate, validateProjectPayload, projectController.createProject);
router.get("/", projectController.getAllProjects);
router.get("/:id/progress", validateNumericIdParam("id"), projectController.getProjectProgress);
router.get("/:id", validateNumericIdParam("id"), projectController.getProjectById);
router.post(
  "/:id/tiers",
  authenticate,
  validateNumericIdParam("id"),
  validateRewardTierPayload,
  projectController.addRewardTier
);

module.exports = router;
