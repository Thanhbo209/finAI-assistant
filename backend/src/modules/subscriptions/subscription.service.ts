import { subscriptionRepository } from "./subscription.repository.js";
import type { SubscriptionInsightDTO } from "./subscription.dto.js";

interface CandidateTransaction {
  merchantId: string | null;
  merchantName: string | null;
  amount: { toString(): string };
  currency: string;
  transactionDate: Date;
}

function daysBetween(a: Date, b: Date): number {
  const msPerDay = 86_400_000;
  return Math.round((b.getTime() - a.getTime()) / msPerDay);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values: number[]): number {
  if (values.length <= 1) return 0;
  const avg = average(values);
  const variance = average(values.map((value) => (value - avg) ** 2));
  return Math.sqrt(variance);
}

export class SubscriptionService {
  async getSubscriptions(
    userId: string,
    minConfidence: number,
  ): Promise<SubscriptionInsightDTO[]> {
    const transactions = await subscriptionRepository.findSubscriptionCandidates(
      userId,
    );

    const groups = new Map<string, CandidateTransaction[]>();
    for (const transaction of transactions) {
      if (!transaction.merchantName) continue;
      const key = `${transaction.merchantId ?? transaction.merchantName}:${transaction.currency}`;
      const existing = groups.get(key) ?? [];
      existing.push(transaction);
      groups.set(key, existing);
    }

    const insights: SubscriptionInsightDTO[] = [];

    for (const group of groups.values()) {
      if (group.length < 3) continue;

      const intervals = group
        .slice(1)
        .map((transaction, index) =>
          daysBetween(group[index]!.transactionDate, transaction.transactionDate),
        );
      const cadenceDays = Math.round(average(intervals));
      const cadenceStdDev = standardDeviation(intervals);
      const isMonthlyCadence = cadenceDays >= 25 && cadenceDays <= 35;
      if (!isMonthlyCadence) continue;

      const amounts = group.map((transaction) =>
        Number(transaction.amount.toString()),
      );
      const amountStdDev = standardDeviation(amounts);
      const amountAvg = average(amounts);
      const amountStability =
        amountAvg > 0 ? Math.max(0, 1 - amountStdDev / amountAvg) : 0;
      const cadenceStability = Math.max(0, 1 - cadenceStdDev / 10);
      const confidence = Number(
        Math.min(0.98, 0.35 + cadenceStability * 0.4 + amountStability * 0.23).toFixed(2),
      );

      if (confidence < minConfidence) continue;

      const latest = group[group.length - 1]!;
      insights.push({
        merchant: {
          id: latest.merchantId,
          name: latest.merchantName ?? "Unknown merchant",
        },
        currency: latest.currency,
        estimatedMonthlyCost: Number(amountAvg.toFixed(2)),
        nextExpectedCharge: addDays(
          latest.transactionDate,
          cadenceDays,
        ).toISOString(),
        recurrenceConfidence: confidence,
        cadenceDays,
        transactionCount: group.length,
        lastSeenAt: latest.transactionDate.toISOString(),
      });
    }

    return insights.sort(
      (a, b) => b.recurrenceConfidence - a.recurrenceConfidence,
    );
  }
}

export const subscriptionService = new SubscriptionService();
