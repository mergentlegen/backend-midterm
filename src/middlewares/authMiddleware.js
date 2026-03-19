const jwt = require("jsonwebtoken");
const prisma = require("../db/prisma");
const AppError = require("../utils/AppError");

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("Authorization token is required.", 401);
    }

    const token = authHeader.split(" ")[1];
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new AppError("JWT_SECRET is not configured.", 500);
    }

    const payload = jwt.verify(token, jwtSecret);
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
    });

    if (!user) {
      throw new AppError("User not found for this token.", 401);
    }

    req.user = {
      id: user.id,
      full_name: user.fullName,
      email: user.email,
    };

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return next(new AppError("Invalid or expired token.", 401));
    }

    next(error);
  }
}

module.exports = {
  authenticate,
};
