import { Router } from "express";

import * as authController from "./auth.controller.js";
import { middleware } from "../../common/middleware/auth.middleware.js";

export const authRouter = Router();

authRouter.post("/register", authController.register);
authRouter.post("/login", authController.login);
authRouter.get("/me", middleware, authController.getMe);
