import type { Request, Response } from "express";

import { transactionService } from "./transaction.service.js";

import {
  CategorySummaryQuerySchema,
  CreateTransactionSchema,
  ListTransactionsQuerySchema,
  MerchantSummaryQuerySchema,
  MonthlySummaryQuerySchema,
  ParseInputSchema,
  UpdateTransactionSchema,
} from "./transaction.dto.js";

export class TransactionController {
  async parseTransaction(req: Request, res: Response) {
    const dto = ParseInputSchema.parse(req.body);

    const result = await transactionService.parseTransactionInput(
      dto.input,
      dto.currencyContext,
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  }

  async createTransaction(req: Request, res: Response) {
    const userId = req.user!.userId;

    const dto = CreateTransactionSchema.parse(req.body);

    const transaction = await transactionService.createTransaction(userId, dto);

    return res.status(201).json({
      success: true,
      data: transaction,
    });
  }

  async getTransactionById(req: Request, res: Response) {
    const userId = req.user!.userId;
    const transactionId = req.params.id;

    if (!transactionId || Array.isArray(transactionId)) {
      return res.status(400).json({ message: "Invalid transaction id" });
    }

    const transaction = await transactionService.getTransactionById(
      userId,
      transactionId,
    );

    return res.status(200).json({
      success: true,
      data: transaction,
    });
  }

  async getTransactions(req: Request, res: Response) {
    const userId = req.user!.userId;

    const query = ListTransactionsQuerySchema.parse(req.query);

    const result = await transactionService.getTransactions(userId, query);

    return res.status(200).json({
      success: true,
      data: result,
    });
  }

  async updateTransaction(req: Request, res: Response) {
    const userId = req.user!.userId;
    const transactionId = req.params.id;
    if (!transactionId || Array.isArray(transactionId)) {
      return res.status(400).json({ message: "Invalid transaction id" });
    }
    const dto = UpdateTransactionSchema.parse(req.body);

    const updated = await transactionService.updateTransaction(
      userId,
      transactionId,
      dto,
    );

    return res.status(200).json({
      success: true,
      data: updated,
    });
  }

  async deleteTransaction(req: Request, res: Response) {
    const userId = req.user!.userId;
    const transactionId = req.params.id;

    if (!transactionId || Array.isArray(transactionId)) {
      return res.status(400).json({ message: "Invalid transaction id" });
    }

    await transactionService.deleteTransaction(userId, transactionId);

    return res.status(204).send();
  }

  async getMonthlySummary(req: Request, res: Response) {
    const userId = req.user!.userId;

    const query = MonthlySummaryQuerySchema.parse(req.query);

    const result = await transactionService.getMonthlySummary(userId, query);

    return res.status(200).json({
      success: true,
      data: result,
    });
  }

  async getCategorySummary(req: Request, res: Response) {
    const userId = req.user!.userId;

    const query = CategorySummaryQuerySchema.parse(req.query);

    const result = await transactionService.getCategorySummary(userId, query);

    return res.status(200).json({
      success: true,
      data: result,
    });
  }

  async getMerchantSummary(req: Request, res: Response) {
    const userId = req.user!.userId;

    const query = MerchantSummaryQuerySchema.parse(req.query);

    const result = await transactionService.getMerchantSummary(userId, query);

    return res.status(200).json({
      success: true,
      data: result,
    });
  }
}

export const transactionController = new TransactionController();
