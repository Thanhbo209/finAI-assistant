export const SUPPORTED_CURRENCIES = ["USD", "VND", "EUR", "GBP", "JPY"] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number];

export const CURRENCY_ONBOARDING_SENTINEL = "UNSET" as const;

export function normalizeCurrencyCode(value: string): string {
  return value.trim().toUpperCase();
}

export function isSupportedCurrency(value: string): value is CurrencyCode {
  return SUPPORTED_CURRENCIES.includes(value as CurrencyCode);
}
