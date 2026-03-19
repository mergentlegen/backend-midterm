const express = require("express");
const pledgeController = require("../controllers/pledgeController");
const { authenticate } = require("../middlewares/authMiddleware");
const {
  validateNumericIdParam,
  validatePledgePayload,
} = require("../middlewares/validators");

const router = express.Router();

router.post(
  "/:id/pledges",
  authenticate,
  validateNumericIdParam("id"),
  validatePledgePayload,
  pledgeController.createPledge
);

router.post(
  "/:id/finalize",
  authenticate,
  validateNumericIdParam("id"),
  pledgeController.finalizeProject
);

module.exports = router;
