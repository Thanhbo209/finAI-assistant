import { Router } from "express";

import { transactionController } from "./transaction.controller.js";
import { middleware } from "../../common/middleware/auth.middleware.js";

export const transactionRouter = Router();

// parser
transactionRouter.post(
  "/parse",
  middleware,
  transactionController.parseTransaction,
);

// analytics
transactionRouter.get(
  "/summary/monthly",
  middleware,
  transactionController.getMonthlySummary,
);

transactionRouter.get(
  "/summary/category",
  middleware,
  transactionController.getCategorySummary,
);

transactionRouter.get(
  "/summary/merchant",
  middleware,
  transactionController.getMerchantSummary,
);

// crud
transactionRouter.post(
  "/",
  middleware,
  transactionController.createTransaction,
);

transactionRouter.get("/", middleware, transactionController.getTransactions);

transactionRouter.get(
  "/:id",
  middleware,
  transactionController.getTransactionById,
);

transactionRouter.patch(
  "/:id",
  middleware,
  transactionController.updateTransaction,
);

transactionRouter.delete(
  "/:id",
  middleware,
  transactionController.deleteTransaction,
);
