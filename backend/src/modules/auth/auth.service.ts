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
    throw new Error("Email already exists!");
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
    throw new Error("Invalid credentials");
  }
  const isPasswordValid = await comparePassword(password, user.passwordHash);

  if (!isPasswordValid) {
    throw new Error("Invalid credentials");
  }

  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id);

  return {
    accessToken,
    refreshToken,
  };
};
