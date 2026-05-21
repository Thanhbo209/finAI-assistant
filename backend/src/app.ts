import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { healthRouter } from "./modules/health/health.route.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { transactionRouter } from "./modules/transaction/transaction.route.js";
import { analyticsRouter } from "./modules/analytics/analytics.route.js";
import { merchantRouter } from "./modules/merchants/merchant.route.js";
import { ruleRouter } from "./modules/rules/rule.route.js";
import { subscriptionRouter } from "./modules/subscriptions/subscription.route.js";
import { errorMiddeware } from "./common/middleware/error.middleware.js";

export const app = express();
// Middlewares

app.use(express.json());
app.use(cookieParser());

// Allow cors
app.use(cors({ origin: true, credentials: true }));

// routes
app.use("/api/v1/transactions", transactionRouter);
app.use("/api/v1/merchants", merchantRouter);
app.use("/api/v1/rules", ruleRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/analytics", analyticsRouter);
app.use("/api/v1/health", healthRouter);
app.use("/api/v1/auth", authRouter);

app.use(errorMiddeware);
