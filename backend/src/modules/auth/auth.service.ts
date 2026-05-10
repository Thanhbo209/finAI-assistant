import { AppError } from "../../common/error/app.error.js";
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
    throw new AppError("Email already exists!", 401);
  }

  const passwordHash = await hashPassword(password);

  const user = await authRepository.createUser(email, passwordHash);

  return {
    userId: user.id,
    email: user.email,
  };
};

export const login = async ({ email, password }: LoginBody) => {
  const user = await authRepository.findUserByEmail(email);
  if (!user) {
    throw new AppError("Invalid credentials");
  }
  const isPasswordValid = await comparePassword(password, user.passwordHash);

  if (!isPasswordValid) {
    throw new AppError("Invalid credentials", 401);
  }

  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id);

  return {
    accessToken,
    refreshToken,
  };
};

export const getMe = async (userId: string) => {
  const user = await authRepository.findUserById(userId);
  if (!user) {
    throw new AppError("User not found", 400);
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
};
