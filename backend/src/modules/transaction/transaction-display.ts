import type { TransactionCategory } from "../../generated/prisma/index.js";
import {
  assertCurrencyCode,
  convertAmount,
  getExchangeRate,
} from "../../common/currency/currency-converter.js";
import type { CurrencyCode } from "../../common/constants/currency.constants.js";

export interface TransactionDisplaySource {
  amount: unknown;
  currency: string;
  category: TransactionCategory | null;
  merchantName: string | null;
  transactionDate: Date | string;
}

export interface DisplayAmountFields {
  originalAmount: number;
  originalCurrency: CurrencyCode;
  displayAmount: number;
  displayCurrency: CurrencyCode;
  exchangeRate: number;
}

export interface MonthlyDisplaySummary {
  year: number;
  month: number;
  totalAmount: number;
  transactionCount: number;
  avgAmount: number;
  currency: CurrencyCode;
}

export interface CategoryDisplaySummary {
  category: TransactionCategory;
  totalAmount: number;
  transactionCount: number;
  percentage: number;
  currency: CurrencyCode;
}

export interface MerchantDisplaySummary {
  merchantName: string;
  totalAmount: number;
  transactionCount: number;
  currency: CurrencyCode;
}

function toNumber(value: unknown): number {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : 0;
}

function monthKey(dateValue: Date | string): string {
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

export function withDisplayAmount<T extends TransactionDisplaySource>(
  transaction: T,
  displayCurrency: CurrencyCode,
): T & DisplayAmountFields {
  const originalAmount = toNumber(transaction.amount);
  const originalCurrency = assertCurrencyCode(transaction.currency);

  return {
    ...transaction,
    originalAmount,
    originalCurrency,
    displayAmount: convertAmount(
      originalAmount,
      originalCurrency,
      displayCurrency,
    ),
    displayCurrency,
    exchangeRate: getExchangeRate(originalCurrency, displayCurrency),
  };
}

export function buildMonthlyDisplaySummary(
  transactions: TransactionDisplaySource[],
  displayCurrency: CurrencyCode,
): MonthlyDisplaySummary[] {
  const byMonth = new Map<string, { totalAmount: number; count: number }>();

  for (const transaction of transactions) {
    const key = monthKey(transaction.transactionDate);
    const existing = byMonth.get(key) ?? { totalAmount: 0, count: 0 };
    const originalCurrency = assertCurrencyCode(transaction.currency);
    const displayAmount = convertAmount(
      toNumber(transaction.amount),
      originalCurrency,
      displayCurrency,
    );

    existing.totalAmount += displayAmount;
    existing.count += 1;
    byMonth.set(key, existing);
  }

  return Array.from(byMonth.entries())
    .map(([key, item]) => {
      const [yearRaw, monthRaw] = key.split("-");
      const year = Number(yearRaw);
      const month = Number(monthRaw);

      return {
        year,
        month,
        totalAmount: convertAmount(item.totalAmount, displayCurrency, displayCurrency),
        transactionCount: item.count,
        avgAmount:
          item.count === 0
            ? 0
            : convertAmount(item.totalAmount / item.count, displayCurrency, displayCurrency),
        currency: displayCurrency,
      };
    })
    .sort((a, b) => b.year - a.year || b.month - a.month);
}

export function buildCategoryDisplaySummary(
  transactions: TransactionDisplaySource[],
  displayCurrency: CurrencyCode,
): CategoryDisplaySummary[] {
  const byCategory = new Map<
    TransactionCategory,
    { totalAmount: number; count: number }
  >();

  for (const transaction of transactions) {
    if (!transaction.category) continue;

    const existing = byCategory.get(transaction.category) ?? {
      totalAmount: 0,
      count: 0,
    };
    const displayAmount = convertAmount(
      toNumber(transaction.amount),
      assertCurrencyCode(transaction.currency),
      displayCurrency,
    );

    existing.totalAmount += displayAmount;
    existing.count += 1;
    byCategory.set(transaction.category, existing);
  }

  const total = Array.from(byCategory.values()).reduce(
    (sum, item) => sum + item.totalAmount,
    0,
  );

  return Array.from(byCategory.entries())
    .map(([category, item]) => ({
      category,
      totalAmount: convertAmount(item.totalAmount, displayCurrency, displayCurrency),
      transactionCount: item.count,
      percentage: total === 0 ? 0 : (item.totalAmount / total) * 100,
      currency: displayCurrency,
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);
}

export function buildMerchantDisplaySummary(
  transactions: TransactionDisplaySource[],
  displayCurrency: CurrencyCode,
  limit: number,
): MerchantDisplaySummary[] {
  const byMerchant = new Map<string, { totalAmount: number; count: number }>();

  for (const transaction of transactions) {
    const merchantName = transaction.merchantName || "Unknown";
    const existing = byMerchant.get(merchantName) ?? {
      totalAmount: 0,
      count: 0,
    };
    const displayAmount = convertAmount(
      toNumber(transaction.amount),
      assertCurrencyCode(transaction.currency),
      displayCurrency,
    );

    existing.totalAmount += displayAmount;
    existing.count += 1;
    byMerchant.set(merchantName, existing);
  }

  return Array.from(byMerchant.entries())
    .map(([merchantName, item]) => ({
      merchantName,
      totalAmount: convertAmount(item.totalAmount, displayCurrency, displayCurrency),
      transactionCount: item.count,
      currency: displayCurrency,
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, limit);
}
