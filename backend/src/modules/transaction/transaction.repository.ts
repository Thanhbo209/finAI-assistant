import { prisma } from "../../config/prisma.js";
import { Prisma, type Transaction } from "../../generated/prisma/index.js";

export interface FindTransactionsParams {
  userId: string;

  skip: number;
  take: number;

  orderBy: Prisma.TransactionOrderByWithRelationInput;
  where?: Prisma.TransactionWhereInput;
}

export interface SummaryDateFilter {
  dateFrom?: Date;
  dateTo?: Date;
  currency?: string;
}

export class TransactionRepository {
  private baseWhere(userId: string): Prisma.TransactionWhereInput {
    return {
      userId,
      deletedAt: null,
    };
  }

  async create(data: Prisma.TransactionCreateInput): Promise<Transaction> {
    return prisma.transaction.create({
      data,
    });
  }

  async findById(userId: string, transactionId: string) {
    return prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId,
        deletedAt: null,
      },
    });
  }

  async findMany({
    userId,
    skip,
    take,
    orderBy,
    where = {},
  }: FindTransactionsParams) {
    const finalWhere: Prisma.TransactionWhereInput = {
      AND: [this.baseWhere(userId), where],
    };

    const [transactions, total] = await prisma.$transaction([
      prisma.transaction.findMany({
        where: finalWhere,
        skip,
        take,
        orderBy: orderBy,
      }),

      prisma.transaction.count({
        where: finalWhere,
      }),
    ]);

    return {
      transactions,
      total,
    };
  }

  async update(
    userId: string,
    transactionId: string,
    data: Prisma.TransactionUpdateInput,
  ): Promise<Transaction> {
    return prisma.transaction.update({
      where: {
        id_userId: {
          id: transactionId,
          userId,
        },
      },
      data,
    });
  }

  async softDelete(
    userId: string,
    transactionId: string,
  ): Promise<Transaction> {
    return prisma.transaction.update({
      where: {
        id_userId: {
          id: transactionId,
          userId,
        },
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async monthlySummary(userId: string, filters?: SummaryDateFilter) {
    const { dateFrom, dateTo, currency } = filters || {};

    return prisma.$queryRaw<
      Array<{
        month: string;
        totalSpending: number;
        transactionCount: number;
        averageAmount: number;
      }>
    >`
      SELECT
        TO_CHAR(
          "transactionDate",
          'YYYY-MM'
        ) AS month,

        SUM("amount")::numeric
          AS "totalSpending",

        COUNT(*)::int
          AS "transactionCount",

        AVG("amount")::numeric
          AS "averageAmount"

      FROM "transactions"

      WHERE
        "deletedAt" IS NULL
        AND "userId" = ${userId}

        ${
          dateFrom
            ? Prisma.sql`
              AND "transactionDate" >= ${dateFrom}
            `
            : Prisma.empty
        }

        ${
          dateTo
            ? Prisma.sql`
              AND "transactionDate" <= ${dateTo}
            `
            : Prisma.empty
        }

        ${
          currency
            ? Prisma.sql`
              AND "currency" = ${currency}
            `
            : Prisma.empty
        }

      GROUP BY month

      ORDER BY month DESC
    `;
  }

  async categorySummary(userId: string, filters?: SummaryDateFilter) {
    const where: Prisma.TransactionWhereInput = {
      ...this.baseWhere(userId),
    };

    if (filters?.currency) {
      where.currency = filters.currency;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.transactionDate = {};

      if (filters.dateFrom) {
        where.transactionDate.gte = filters.dateFrom;
      }

      if (filters.dateTo) {
        where.transactionDate.lte = filters.dateTo;
      }
    }

    return prisma.transaction.groupBy({
      by: ["category"],

      where,

      _sum: {
        amount: true,
      },

      _count: {
        category: true,
      },

      orderBy: {
        _sum: {
          amount: "desc",
        },
      },
    });
  }

  async merchantSummary(
    userId: string,
    filters?: SummaryDateFilter,
    limit = 10,
  ) {
    const where: Prisma.TransactionWhereInput = {
      ...this.baseWhere(userId),
    };

    if (filters?.currency) {
      where.currency = filters.currency;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.transactionDate = {};

      if (filters.dateFrom) {
        where.transactionDate.gte = filters.dateFrom;
      }

      if (filters.dateTo) {
        where.transactionDate.lte = filters.dateTo;
      }
    }

    return prisma.transaction.groupBy({
      by: ["merchantName"],

      where,

      _sum: {
        amount: true,
      },

      _count: {
        merchantName: true,
      },

      orderBy: {
        _sum: {
          amount: "desc",
        },
      },

      take: limit,
    });
  }
}

export const transactionRepository = new TransactionRepository();
