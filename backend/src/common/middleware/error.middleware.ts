import type { NextFunction, Request, Response } from "express";
import { AppError } from "../error/app.error.js";

export const errorMiddeware = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.log(error);

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }

  return res.status(500).json({
    success: false,
    message: error.message || "Internal server error",
  });
};
