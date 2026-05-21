import { z } from "zod";

export const MerchantInsightsQuerySchema = z.object({
  months: z.coerce.number().int().min(1).max(24).default(6),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type MerchantInsightsQuery = z.infer<typeof MerchantInsightsQuerySchema>;

export interface MerchantInsightDTO {
  merchant: {
    id: string | null;
    name: string;
  };
  totalSpend: number;
  averageSpend: number;
  frequency: number;
  latestTransactionDate: string;
  monthlyChangePercent: number | null;
  confidenceInsights: {
    averageParserConfidence: number | null;
    correctionCount: number;
    personalized: boolean;
  };
}
