import { useState, useEffect } from "react";
import { transactionApi } from "@/api/transaction.api";
import { useCurrency } from "@/hooks/useCurrency";
import type {
  MonthlySummary,
  CategorySummary,
  MerchantSummary,
} from "@/types/summary";

// Backend returns totals as strings (same as Transaction.amount).
// Normalize everything to numbers here so all consumers are safe.

function toNum(v: unknown): number {
  const n = typeof v === "string" ? parseFloat(v) : Number(v);
  return isNaN(n) ? 0 : n;
}

function normalizeMonthly(raw: unknown[]): MonthlySummary[] {
  return raw.map((r) => {
    const d = r as Record<string, unknown>;
    return {
      // month may come as number or string; year too
      month: String(d.month ?? d.monthNumber ?? ""),
      year: toNum(d.year),
      total: toNum(
        d.total ??
          d.totalAmount ??
          (d._sum as Record<string, unknown> | undefined)?.amount,
      ),
      currency: String(d.currency ?? d.displayCurrency ?? ""),
      count: toNum(
        d.count ??
          (d._count as Record<string, unknown> | undefined)?.id ??
          d.transactionCount,
      ),
    };
  });
}

function normalizeCategory(raw: unknown[]): CategorySummary[] {
  return raw.map((r) => {
    const d = r as Record<string, unknown>;
    return {
      category: d.category as CategorySummary["category"],
      total: toNum(
        d.total ??
          d.totalAmount ??
          (d._sum as Record<string, unknown> | undefined)?.amount,
      ),
      count: toNum(
        d.count ?? (d._count as Record<string, unknown> | undefined)?.id,
      ),
      percentage: toNum(d.percentage),
      currency: String(d.currency ?? d.displayCurrency ?? ""),
    };
  });
}

function normalizeMerchant(raw: unknown[]): MerchantSummary[] {
  return raw.map((r) => {
    const d = r as Record<string, unknown>;
    return {
      merchantName: String(d.merchantName ?? d.merchant ?? "Unknown"),
      total: toNum(
        d.total ??
          d.totalAmount ??
          (d._sum as Record<string, unknown> | undefined)?.amount,
      ),
      count: toNum(
        d.count ?? (d._count as Record<string, unknown> | undefined)?.id,
      ),
      currency: String(d.currency ?? d.displayCurrency ?? ""),
    };
  });
}

export function useSummary() {
  const { currency } = useCurrency();
  const [monthly, setMonthly] = useState<MonthlySummary[]>([]);
  const [category, setCategory] = useState<CategorySummary[]>([]);
  const [merchant, setMerchant] = useState<MerchantSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [m, c, mer] = await Promise.all([
          transactionApi.monthlySummary(currency),
          transactionApi.categorySummary(currency),
          transactionApi.merchantSummary(currency),
        ]);
        setMonthly(normalizeMonthly(m as unknown[]));
        setCategory(normalizeCategory(c as unknown[]));
        setMerchant(normalizeMerchant(mer as unknown[]));
      } catch (err) {
        setError("Failed to load summary data");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    void fetchAll();
  }, [currency]);

  return { monthly, category, merchant, isLoading, error };
}
