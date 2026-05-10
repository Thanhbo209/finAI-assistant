import type { Request, Response } from "express";

import * as authService from "./auth.service.js";

export const register = async (req: Request, res: Response) => {
  const result = await authService.register({
    email: req.body.email,
    password: req.body.password,
  });

  return res.status(201).json({
    message: "User registered!",
    data: result,
  });
};

export const login = async (req: Request, res: Response) => {
  const result = await authService.login({
    email: req.body.email,
    password: req.body.password,
  });

  return res.status(201).json({
    message: "Login Succesful!",
    data: result,
  });
};

export const getMe = async (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const result = await authService.getMe(userId);

  return res.status(200).json({
    message: "User data retrieved successfully",
    data: result,
  });
};
