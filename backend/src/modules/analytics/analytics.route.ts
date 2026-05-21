import { Router } from "express";
import { middleware } from "../../common/middleware/auth.middleware.js";
import { merchantInsightsController } from "./merchant-insights.controller.js";

export const analyticsRouter = Router();

analyticsRouter.get(
  "/merchant-insights",
  middleware,
  merchantInsightsController.getMerchantInsights,
);
