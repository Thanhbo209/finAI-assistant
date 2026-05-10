import type { NextFunction, Request, Response } from "express";

export const errorMiddeware = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.log(error);
  return res
    .status(500)
    .json({ message: error.message || "Internal server error" });
};
