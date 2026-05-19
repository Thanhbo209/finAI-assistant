import { AppError } from "../../common/error/app.error.js";
import type { Prisma, Transaction } from "../../generated/prisma/index.js";
import { parseTransaction } from "../parser/service/parse.service.js";
import type {
  CategorySummaryQuery,
  CreateTransactionDTO,
  ListTransactionsQuery,
  MerchantSummaryQuery,
  MonthlySummaryQuery,
  UpdateTransactionDTO,
} from "./transaction.dto.js";
import {
  transactionRepository,
  type SummaryDateFilter,
} from "./transaction.repository.js";

export class TransactionService {
  private toStartOfDay(date: string): Date {
    return new Date(`${date}T00:00:00.000Z`);
  }

  private toEndOfDay(date: string): Date {
    return new Date(`${date}T23:59:59.999Z`);
  }
  async parseTransactionInput(input: string) {
    const parsed = await parseTransaction(input);

    return {
      amount: parsed.amount,
      currency: parsed.currency,
      merchantName: parsed.merchantName,
      category: parsed.category,
      confidenceScore: parsed.confidenceScore,
      missingFields: parsed.missingFields,
      followUpQuestions: parsed.followUpQuestion,
      parserVersion: parsed.parserVersion,
      aiProcessed: parsed.aiProcessed,
      descriptionRaw: parsed.descriptionRaw,
      descriptionNormalized: parsed.descriptionNormalized,
    };
  }

  async createTransaction(
    userId: string,
    dto: CreateTransactionDTO,
  ): Promise<Transaction> {
    const { parserResult, finalValues } = dto;

    const transaction = await transactionRepository.create({
      user: {
        connect: {
          id: userId,
        },
      },

      // Final user-confirmed values
      amount: finalValues.amount,
      currency: finalValues.currency,
      merchantName: finalValues.merchantName,
      category: finalValues.category,
      transactionDate: this.toStartOfDay(finalValues.transactionDate),

      // Parser metadata
      confidenceScore: parserResult.confidenceScore,
      aiProcessed: parserResult.aiProcessed,
      parserVersion: parserResult.parserVersion,
      descriptionRaw: parserResult.descriptionRaw,
      descriptionNormalized: parserResult.descriptionNormalized,

      // System fields
      processingStatus: "COMPLETED",
      isConfirmed: true,

      // optional source classification
      sourceType: "AI_PARSER",
    });

    return transaction;
  }

  async getTransactionById(userId: string, transactionId: string) {
    if (!transactionId) {
      throw new AppError(400, "VALIDATION_ERROR", "Malformed transaction id");
    }

    const transaction = await transactionRepository.findById(
      userId,
      transactionId,
    );

    if (!transaction) {
      throw new AppError(404, "NOT_FOUND", "Transaction not found");
    }

    return transaction;
  }

  async getTransactions(userId: string, query: ListTransactionsQuery) {
    const {
      page,
      limit,
      sortBy,
      sortOrder,

      category,
      merchantName,

      amountMin,
      amountMax,

      dateFrom,
      dateTo,

      confidenceMin,
      currency,
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.TransactionWhereInput = {};

    if (category) {
      where.category = category;
    }

    if (merchantName) {
      where.merchantName = {
        contains: merchantName,
        mode: "insensitive",
      };
    }

    if (amountMin !== undefined || amountMax !== undefined) {
      where.amount = {};

      if (amountMin !== undefined) {
        where.amount.gte = amountMin;
      }

      if (amountMax !== undefined) {
        where.amount.lte = amountMax;
      }
    }

    if (dateFrom || dateTo) {
      where.transactionDate = {};

      if (dateFrom) {
        where.transactionDate.gte = this.toStartOfDay(dateFrom);
      }

      if (dateTo) {
        where.transactionDate.lte = this.toEndOfDay(dateTo);
      }
    }

    if (confidenceMin !== undefined) {
      where.confidenceScore = {
        gte: confidenceMin,
      };
    }

    if (currency) {
      where.currency = currency;
    }

    const orderBy: Prisma.TransactionOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const result = await transactionRepository.findMany({
      userId,
      skip,
      take: limit,
      orderBy,
      where,
    });

    return {
      data: result.transactions,

      meta: {
        page,
        limit,
        total: result.total,

        totalPages: Math.ceil(result.total / limit),
      },
    };
  }

  async updateTransaction(
    userId: string,
    transactionId: string,
    dto: UpdateTransactionDTO,
  ) {
    const existing = await transactionRepository.findById(
      userId,
      transactionId,
    );

    if (!existing) {
      throw new AppError(404, "NOT_FOUND", "Transaction not found");
    }

    const updateData: Prisma.TransactionUpdateInput = {};

    if (dto.amount !== undefined) {
      updateData.amount = dto.amount;
    }

    if (dto.merchantName !== undefined) {
      updateData.merchantName = dto.merchantName;
    }

    if (dto.category !== undefined) {
      updateData.category = dto.category;
    }

    if (dto.transactionDate !== undefined) {
      updateData.transactionDate = this.toStartOfDay(dto.transactionDate);
    }

    return transactionRepository.update(userId, transactionId, updateData);
  }

  async deleteTransaction(userId: string, transactionId: string) {
    const existing = await transactionRepository.findById(
      userId,
      transactionId,
    );

    if (!existing) {
      throw new AppError(404, "NOT_FOUND", "Transaction not found");
    }

    return transactionRepository.softDelete(userId, transactionId);
  }

  async getMonthlySummary(userId: string, query: MonthlySummaryQuery) {
    const result = await transactionRepository.monthlySummary(userId, {
      currency: query.currency,
    });

    return result.map((item) => {
      const [year, month] = item.month.split("-");

      return {
        year: Number(year),
        month: Number(month),

        totalAmount: Number(item.totalSpending),

        transactionCount: item.transactionCount,

        avgAmount: Number(item.averageAmount),

        currency: query.currency,
      };
    });
  }

  async getCategorySummary(userId: string, query: CategorySummaryQuery) {
    const filters: SummaryDateFilter = {
      currency: query.currency,
    };

    if (query.dateFrom) {
      filters.dateFrom = this.toStartOfDay(query.dateFrom);
    }

    if (query.dateTo) {
      filters.dateTo = this.toEndOfDay(query.dateTo);
    }
    const result = await transactionRepository.categorySummary(userId, filters);

    const totalAmount = result.reduce(
      (sum, item) => sum + Number(item._sum.amount || 0),
      0,
    );

    return result.map((item) => ({
      category: item.category,

      totalAmount: Number(item._sum.amount || 0),

      transactionCount: item._count.category,

      percentage:
        totalAmount === 0
          ? 0
          : (Number(item._sum.amount || 0) / totalAmount) * 100,
    }));
  }

  async getMerchantSummary(userId: string, query: MerchantSummaryQuery) {
    const filters: SummaryDateFilter = {
      currency: query.currency,
    };

    if (query.dateFrom) {
      filters.dateFrom = this.toStartOfDay(query.dateFrom);
    }

    if (query.dateTo) {
      filters.dateTo = this.toEndOfDay(query.dateTo);
    }
    const result = await transactionRepository.merchantSummary(
      userId,
      filters,
      query.limit,
    );

    return result.map((item) => ({
      merchantName: item.merchantName || "Unknown",

      totalAmount: Number(item._sum.amount || 0),

      transactionCount: item._count.merchantName,
    }));
  }
}

export const transactionService = new TransactionService();
