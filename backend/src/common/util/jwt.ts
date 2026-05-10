import jwt from "jsonwebtoken";
import "dotenv/config";

const accessSecret = process.env.JWT_ACCESS_SECRET;

const refreshSecret = process.env.JWT_REFRESH_SECRET!;

if (!accessSecret || !refreshSecret) {
  throw new Error("ACCESS_SECRET and REFRESH_SECRET must be defined");
}

export const generateAccessToken = (userId: string, role: string) => {
  return jwt.sign({ sub: userId, role }, accessSecret as jwt.Secret, {
    expiresIn: "30m",
  });
};

export const generateRefreshToken = (userId: string) => {
  return jwt.sign({ sub: userId }, refreshSecret as jwt.Secret, {
    expiresIn: "7d",
  });
};
