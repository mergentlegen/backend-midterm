const express = require("express");
const authController = require("../controllers/authController");
const { validateRegisterPayload, validateLoginPayload } = require("../middlewares/validators");

const router = express.Router();

router.post("/register", validateRegisterPayload, authController.registerUser);
router.post("/login", validateLoginPayload, authController.loginUser);

module.exports = router;
