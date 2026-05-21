import type { TransactionCategory } from "./category";

export interface MonthlySummary {
  month: string;
  year: number;
  total: number;
  count: number;
  currency?: string;
}

export interface CategorySummary {
  category: TransactionCategory;
  total: number;
  count: number;
  percentage: number;
  currency?: string;
}

export interface MerchantSummary {
  merchantName: string;
  total: number;
  count: number;
  currency?: string;
}
