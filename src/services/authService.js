const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../db/prisma");
const AppError = require("../utils/AppError");

function buildToken(user) {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new AppError("JWT_SECRET is not configured.", 500);
  }

  return jwt.sign({ id: user.id, email: user.email }, jwtSecret, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

async function registerUser(userData) {
  const { full_name, email, password } = userData;

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError("User with this email already exists.", 409);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      fullName: full_name,
      email,
      passwordHash,
    },
  });

  return {
    user: {
      id: user.id,
      full_name: user.fullName,
      email: user.email,
      created_at: user.createdAt,
    },
    token: buildToken(user),
  };
}

async function loginUser(credentials) {
  const { email, password } = credentials;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AppError("Invalid email or password.", 401);
  }

  const isBcryptHash = typeof user.passwordHash === "string" && user.passwordHash.startsWith("$2");
  const passwordMatches = isBcryptHash
    ? await bcrypt.compare(password, user.passwordHash)
    : password === user.passwordHash;

  if (!passwordMatches) {
    throw new AppError("Invalid email or password.", 401);
  }

  return {
    user: {
      id: user.id,
      full_name: user.fullName,
      email: user.email,
      created_at: user.createdAt,
    },
    token: buildToken(user),
  };
}

module.exports = {
  registerUser,
  loginUser,
};
