import { Router } from "express";
import { middleware } from "../../common/middleware/auth.middleware.js";
import { merchantController } from "./merchant.controller.js";

export const merchantRouter = Router();

merchantRouter.get("/", middleware, merchantController.list);
merchantRouter.get("/lookup", middleware, merchantController.lookup);
