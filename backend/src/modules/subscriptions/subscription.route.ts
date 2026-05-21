import { Router } from "express";
import { middleware } from "../../common/middleware/auth.middleware.js";
import { subscriptionController } from "./subscription.controller.js";

export const subscriptionRouter = Router();

subscriptionRouter.get("/", middleware, subscriptionController.list);
