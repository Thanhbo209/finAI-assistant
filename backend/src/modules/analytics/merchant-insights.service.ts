import type { MerchantInsightDTO } from "./merchant-insights.dto.js";
import { merchantInsightsRepository } from "./merchant-insights.repository.js";

function toMonthlyChangePercent(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Number((((current - previous) / previous) * 100).toFixed(2));
}

export class MerchantInsightsService {
  async getMerchantInsights(params: {
    userId: string;
    months: number;
    limit: number;
  }): Promise<MerchantInsightDTO[]> {
    const rows = await merchantInsightsRepository.getMerchantInsights(params);

    return rows.map((row) => {
      const currentMonth = Number(row.currentMonthSpend);
      const previousMonth = Number(row.previousMonthSpend);

      return {
        merchant: {
          id: row.merchantId,
          name: row.merchantName,
        },
        totalSpend: Number(Number(row.totalSpend).toFixed(2)),
        averageSpend: Number(Number(row.averageSpend).toFixed(2)),
        frequency: row.frequency,
        latestTransactionDate: row.latestTransactionDate.toISOString(),
        monthlyChangePercent: toMonthlyChangePercent(currentMonth, previousMonth),
        confidenceInsights: {
          averageParserConfidence:
            row.averageParserConfidence === null
              ? null
              : Number(row.averageParserConfidence.toFixed(2)),
          correctionCount: row.correctionCount,
          personalized: row.personalized,
        },
      };
    });
  }
}

export const merchantInsightsService = new MerchantInsightsService();
