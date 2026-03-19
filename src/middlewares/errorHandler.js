const AppError = require("../utils/AppError");

function notFoundHandler(req, res, next) {
  next(new AppError(`Route ${req.originalUrl} not found.`, 404));
}

function errorHandler(err, req, res, next) {
  console.error("Request failed:", {
    message: err.message,
    code: err.code,
    detail: err.detail,
    table: err.table,
    constraint: err.constraint,
  });

  if (err.code === "P2002") {
    return res.status(409).json({
      message: "Unique constraint failed.",
      error: err.message,
    });
  }

  if (err.code === "P2025") {
    return res.status(404).json({
      message: "Requested record was not found.",
      error: err.message,
    });
  }

  if (err.code === "23505") {
    return res.status(409).json({
      message: "Duplicate value violates a unique constraint.",
      error: err.detail || err.message,
    });
  }

  if (err.code === "23514" || err.code === "22P02" || err.code === "23502") {
    return res.status(400).json({
      message: "Database validation failed.",
      error: err.detail || err.message,
    });
  }

  if (err.code === "23503") {
    return res.status(400).json({
      message: "Foreign key validation failed.",
      error: err.detail || err.message,
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      message: err.message,
    });
  }

  return res.status(500).json({
    message: "Internal server error.",
    error: err.detail || err.message,
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
