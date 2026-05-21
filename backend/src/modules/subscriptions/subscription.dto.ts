import { z } from "zod";

export const SubscriptionQuerySchema = z.object({
  minConfidence: z.coerce.number().min(0).max(1).default(0.55),
});

export type SubscriptionQuery = z.infer<typeof SubscriptionQuerySchema>;

export interface SubscriptionInsightDTO {
  merchant: {
    id: string | null;
    name: string;
  };
  currency: string;
  estimatedMonthlyCost: number;
  nextExpectedCharge: string;
  recurrenceConfidence: number;
  cadenceDays: number;
  transactionCount: number;
  lastSeenAt: string;
}
