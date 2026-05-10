import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { healthRouter } from "./modules/health/health.route.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { errorMiddeware } from "./common/middleware/error.middleware.js";

export const app = express();
// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(errorMiddeware);

// Allow cors
app.use(cors({ origin: true, credentials: true }));

// routes
app.use("/health", healthRouter);
app.use("/auth", authRouter);
