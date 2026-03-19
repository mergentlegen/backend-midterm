const AppError = require("../utils/AppError");

const allowedProjectCreationStatuses = ["draft", "active", "closed", "cancelled"];

function validateNumericIdParam(paramName) {
  return (req, res, next) => {
    const value = Number(req.params[paramName]);

    if (!Number.isInteger(value) || value <= 0) {
      return next(new AppError(`${paramName} must be a positive integer.`, 400));
    }

    next();
  };
}

function validateProjectPayload(req, res, next) {
  const { title, description, goal, deadline, status } = req.body;

  if (!title || typeof title !== "string" || !title.trim()) {
    return next(new AppError("Title is required.", 400));
  }

  if (!description || typeof description !== "string" || !description.trim()) {
    return next(new AppError("Description is required.", 400));
  }

  if (typeof goal !== "number" || Number.isNaN(goal) || goal <= 0) {
    return next(new AppError("Goal must be a number greater than 0.", 400));
  }

  if (!deadline || Number.isNaN(Date.parse(deadline))) {
    return next(new AppError("Deadline must be a valid date.", 400));
  }

  if (new Date(deadline) <= new Date()) {
    return next(new AppError("Deadline must be in the future.", 400));
  }

  if (status && !allowedProjectCreationStatuses.includes(status)) {
    return next(new AppError("Status is invalid.", 400));
  }

  next();
}

function validateRewardTierPayload(req, res, next) {
  const { title, amount, quantity_total } = req.body;

  if (!title || typeof title !== "string" || !title.trim()) {
    return next(new AppError("Reward tier title is required.", 400));
  }

  if (typeof amount !== "number" || Number.isNaN(amount) || amount <= 0) {
    return next(new AppError("Amount must be a number greater than 0.", 400));
  }

  if (!Number.isInteger(quantity_total) || quantity_total < 0) {
    return next(new AppError("quantity_total must be an integer greater than or equal to 0.", 400));
  }

  next();
}

function validatePledgePayload(req, res, next) {
  const { tier_id, amount } = req.body;

  if (tier_id !== undefined && tier_id !== null && (!Number.isInteger(tier_id) || tier_id <= 0)) {
    return next(new AppError("tier_id must be a positive integer when provided.", 400));
  }

  if (typeof amount !== "number" || Number.isNaN(amount) || amount <= 0) {
    return next(new AppError("Amount must be a number greater than 0.", 400));
  }

  next();
}

function validateRegisterPayload(req, res, next) {
  const { full_name, email, password } = req.body;

  if (!full_name || typeof full_name !== "string" || !full_name.trim()) {
    return next(new AppError("full_name is required.", 400));
  }

  if (!email || typeof email !== "string" || !email.trim()) {
    return next(new AppError("Email is required.", 400));
  }

  if (!password || typeof password !== "string" || password.length < 6) {
    return next(new AppError("Password must be at least 6 characters long.", 400));
  }

  next();
}

function validateLoginPayload(req, res, next) {
  const { email, password } = req.body;

  if (!email || typeof email !== "string" || !email.trim()) {
    return next(new AppError("Email is required.", 400));
  }

  if (!password || typeof password !== "string") {
    return next(new AppError("Password is required.", 400));
  }

  next();
}

module.exports = {
  validateProjectPayload,
  validateRewardTierPayload,
  validatePledgePayload,
  validateRegisterPayload,
  validateLoginPayload,
  validateNumericIdParam,
};
