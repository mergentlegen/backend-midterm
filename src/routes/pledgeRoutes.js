const express = require("express");
const pledgeController = require("../controllers/pledgeController");
const {
  validateNumericIdParam,
  validatePledgePayload,
} = require("../middlewares/validators");

const router = express.Router();

router.post(
  "/:id/pledges",
  validateNumericIdParam("id"),
  validatePledgePayload,
  pledgeController.createPledge
);

router.post(
  "/:id/finalize",
  validateNumericIdParam("id"),
  pledgeController.finalizeProject
);

module.exports = router;
