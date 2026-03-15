const AppError = require("../utils/AppError");

const allowedStatuses = ["draft", "active", "closed", "cancelled"];

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
  const { title, description, goal, deadline, status, creator_id } = req.body;

  if (!title || typeof title !== "string" || !title.trim()) {
    return next(new AppError("Title is required.", 400));
  }

  if (description !== undefined && (typeof description !== "string" || !description.trim())) {
    return next(new AppError("Description must be a non-empty string when provided.", 400));
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

  if (status && !allowedStatuses.includes(status)) {
    return next(new AppError("Status is invalid.", 400));
  }

  if (!Number.isInteger(creator_id) || creator_id <= 0) {
    return next(new AppError("creator_id must be a positive integer.", 400));
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

module.exports = {
  validateProjectPayload,
  validateRewardTierPayload,
  validateNumericIdParam,
};
