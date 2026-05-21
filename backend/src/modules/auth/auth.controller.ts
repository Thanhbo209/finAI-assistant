import type { NextFunction, Request, Response } from "express";

import * as authService from "./auth.service.js";

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await authService.register({
      email: req.body.email,
      password: req.body.password,
    });

    return res.status(201).json({
      message: "User registered!",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await authService.login({
      email: req.body.email,
      password: req.body.password,
    });

    return res.status(201).json({
      message: "Login Succesful!",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.userId;
    const result = await authService.getMe(userId);

    return res.status(200).json({
      message: "User data retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCurrency = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.userId;
    const { currency } = req.body as { currency: string };

    const result = await authService.updatePreferredCurrency(userId, currency);

    return res.status(200).json({
      message: "Currency updated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
