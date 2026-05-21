import { prisma } from "../../config/prisma.js";
import { Prisma } from "../../generated/prisma/index.js";

export interface MerchantInsightRow {
  merchantId: string | null;
  merchantName: string;
  totalSpend: string;
  averageSpend: string;
  frequency: number;
  latestTransactionDate: Date;
  averageParserConfidence: number | null;
  correctionCount: number;
  personalized: boolean;
  currentMonthSpend: string;
  previousMonthSpend: string;
}

export class MerchantInsightsRepository {
  async getMerchantInsights(params: {
    userId: string;
    months: number;
    limit: number;
  }) {
    const since = new Date();
    since.setUTCMonth(since.getUTCMonth() - params.months);

    return prisma.$queryRaw<MerchantInsightRow[]>`
      WITH scoped_transactions AS (
        SELECT
          t."merchantId",
          COALESCE(t."merchantName", 'Unknown merchant') AS "merchantName",
          t."amount",
          t."transactionDate",
          t."confidenceScore"
        FROM "transactions" t
        WHERE t."userId" = ${params.userId}
          AND t."deletedAt" IS NULL
          AND t."transactionDate" >= ${since}
      ),
      merchant_rollup AS (
        SELECT
          "merchantId",
          "merchantName",
          SUM("amount")::text AS "totalSpend",
          AVG("amount")::text AS "averageSpend",
          COUNT(*)::int AS "frequency",
          MAX("transactionDate") AS "latestTransactionDate",
          AVG("confidenceScore")::float AS "averageParserConfidence",
          SUM(
            CASE
              WHEN "transactionDate" >= date_trunc('month', now()) THEN "amount"
              ELSE 0
            END
          )::text AS "currentMonthSpend",
          SUM(
            CASE
              WHEN "transactionDate" >= date_trunc('month', now()) - interval '1 month'
               AND "transactionDate" < date_trunc('month', now()) THEN "amount"
              ELSE 0
            END
          )::text AS "previousMonthSpend"
        FROM scoped_transactions
        GROUP BY "merchantId", "merchantName"
      )
      SELECT
        r."merchantId",
        r."merchantName",
        r."totalSpend",
        r."averageSpend",
        r."frequency",
        r."latestTransactionDate",
        r."averageParserConfidence",
        COALESCE(c."correctionCount", 0)::int AS "correctionCount",
        (p."id" IS NOT NULL) AS "personalized",
        r."currentMonthSpend",
        r."previousMonthSpend"
      FROM merchant_rollup r
      LEFT JOIN (
        SELECT "merchantId", COUNT(*)::int AS "correctionCount"
        FROM "transaction_corrections"
        WHERE "userId" = ${params.userId}
        GROUP BY "merchantId"
      ) c ON c."merchantId" IS NOT DISTINCT FROM r."merchantId"
      LEFT JOIN "user_merchant_preferences" p
        ON p."userId" = ${params.userId}
       AND p."merchantId" IS NOT DISTINCT FROM r."merchantId"
      ORDER BY r."totalSpend"::numeric DESC
      LIMIT ${Prisma.raw(String(params.limit))}
    `;
  }
}

export const merchantInsightsRepository = new MerchantInsightsRepository();
