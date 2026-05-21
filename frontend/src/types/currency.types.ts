export const SUPPORTED_CURRENCIES = ["USD", "VND", "EUR", "GBP", "JPY"] as const;
export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number];

export const CURRENCY_ONBOARDING_SENTINEL = "UNSET" as const;

export interface CurrencyMeta {
  symbol: string;
  name: string;
  flag: string;
  locale: string;
}

export const CURRENCY_META: Record<CurrencyCode, CurrencyMeta> = {
  USD: {
    symbol: "$",
    name: "US Dollar",
    flag: "\uD83C\uDDFA\uD83C\uDDF8",
    locale: "en-US",
  },
  VND: {
    symbol: "\u20AB",
    name: "Vietnamese Dong",
    flag: "\uD83C\uDDFB\uD83C\uDDF3",
    locale: "vi-VN",
  },
  EUR: {
    symbol: "\u20AC",
    name: "Euro",
    flag: "\uD83C\uDDEA\uD83C\uDDFA",
    locale: "de-DE",
  },
  GBP: {
    symbol: "\u00A3",
    name: "British Pound",
    flag: "\uD83C\uDDEC\uD83C\uDDE7",
    locale: "en-GB",
  },
  JPY: {
    symbol: "\u00A5",
    name: "Japanese Yen",
    flag: "\uD83C\uDDEF\uD83C\uDDF5",
    locale: "ja-JP",
  },
};

export function isSupportedCurrency(
  value: string | null | undefined,
): value is CurrencyCode {
  return SUPPORTED_CURRENCIES.includes(value as CurrencyCode);
}

export function getLocaleCurrency(): CurrencyCode {
  if (typeof navigator === "undefined") return "USD";

  const locale = navigator.language;
  if (locale.startsWith("vi")) return "VND";
  if (locale.startsWith("ja")) return "JPY";
  if (locale.startsWith("de") || locale.startsWith("fr")) return "EUR";
  if (locale.startsWith("en-GB")) return "GBP";
  return "USD";
}
