import { AppError } from "../../common/error/app.error.js";
import {
  isSupportedCurrency,
  normalizeCurrencyCode,
} from "../../common/constants/currency.constants.js";
import { comparePassword, hashPassword } from "../../common/util/bcrypt.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../common/util/jwt.js";
import * as authRepository from "./auth.repository.js";

type RegisterBody = {
  email: string;
  password: string;
};

type LoginBody = {
  email: string;
  password: string;
};

export const register = async ({ email, password }: RegisterBody) => {
  const existingUser = await authRepository.findUserByEmail(email);

  if (existingUser) {
    throw new AppError(400, "BAD_REQUEST", "Email already exists!");
  }

  const passwordHash = await hashPassword(password);

  const user = await authRepository.createUser(email, passwordHash);

  return {
    userId: user.id,
    email: user.email,
    preferredCurrency: user.preferredCurrency,
  };
};

export const login = async ({ email, password }: LoginBody) => {
  const user = await authRepository.findUserByEmail(email);
  if (!user) {
    throw new AppError(401, "UNAUTHORIZED", "Invalid credentials");
  }
  const isPasswordValid = await comparePassword(password, user.passwordHash);

  if (!isPasswordValid) {
    throw new AppError(401, "UNAUTHORIZED", "Invalid credentials");
  }

  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id);

  return {
    accessToken,
    refreshToken,

    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      preferredCurrency: user.preferredCurrency, // included so frontend can skip onboarding
    },
  };
};

export const getMe = async (userId: string) => {
  const user = await authRepository.findUserById(userId);
  if (!user) {
    throw new AppError(404, "NOT_FOUND", "User not found");
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    preferredCurrency: user.preferredCurrency,
    createdAt: user.createdAt,
  };
};

export const updatePreferredCurrency = async (
  userId: string,
  currency: string,
) => {
  const normalizedCurrency = normalizeCurrencyCode(currency);

  if (!isSupportedCurrency(normalizedCurrency)) {
    throw new AppError(
      400,
      "VALIDATION_ERROR",
      `Unsupported currency: ${currency}`,
    );
  }

  const user = await authRepository.updatePreferredCurrency(
    userId,
    normalizedCurrency,
  );

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    preferredCurrency: user.preferredCurrency,
    createdAt: user.createdAt,
  };
};
