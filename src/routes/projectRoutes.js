const express = require("express");
const projectController = require("../controllers/projectController");
const {
  validateProjectPayload,
  validateRewardTierPayload,
  validateNumericIdParam,
} = require("../middlewares/validators");

const router = express.Router();

router.post("/", validateProjectPayload, projectController.createProject);
router.get("/", projectController.getAllProjects);
router.get("/:id", validateNumericIdParam("id"), projectController.getProjectById);
router.post(
  "/:id/tiers",
  validateNumericIdParam("id"),
  validateRewardTierPayload,
  projectController.addRewardTier
);

module.exports = router;
