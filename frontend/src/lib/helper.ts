import {
  CURRENCY_META,
  isSupportedCurrency,
  type CurrencyCode,
} from "@/types/currency.types";

export function formatCurrency(
  amount: number | string,
  currency = "USD",
): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  const code: CurrencyCode = isSupportedCurrency(currency) ? currency : "USD";
  const meta = CURRENCY_META[code];

  return new Intl.NumberFormat(meta.locale, {
    style: "currency",
    currency: code,
    maximumFractionDigits: code === "VND" || code === "JPY" ? 0 : 2,
  }).format(num);
}

export function formatCompactCurrency(
  amount: number | string,
  currency = "USD",
): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  const code: CurrencyCode = isSupportedCurrency(currency) ? currency : "USD";
  const meta = CURRENCY_META[code];

  return new Intl.NumberFormat(meta.locale, {
    style: "currency",
    currency: code,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(num);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateInput(dateStr: string): string {
  return new Date(dateStr).toISOString().split("T")[0];
}

export function toISODate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function getMonthName(monthStr: string): string {
  const [year, month] = monthStr.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

export function confidenceColor(score: number): string {
  if (score >= 0.7) return "text-emerald-500";
  if (score >= 0.4) return "text-amber-500";
  return "text-rose-500";
}

export function confidenceLabel(score: number): string {
  if (score >= 0.7) return "High";
  if (score >= 0.4) return "Medium";
  return "Low";
}
