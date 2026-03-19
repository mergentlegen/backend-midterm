const authService = require("../services/authService");

async function registerUser(req, res, next) {
  try {
    const result = await authService.registerUser(req.body);
    res.status(201).json({
      message: "User registered successfully.",
      data: result.user,
      token: result.token,
    });
  } catch (error) {
    next(error);
  }
}

async function loginUser(req, res, next) {
  try {
    const result = await authService.loginUser(req.body);
    res.status(200).json({
      message: "Login successful.",
      data: result.user,
      token: result.token,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  registerUser,
  loginUser,
};
