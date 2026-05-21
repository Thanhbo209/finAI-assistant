import type { CurrencyCode } from "../constants/currency.constants.js";

/**
 * Static mid-market-ish rates expressed as "currency units per 1 USD".
 * Replace this table with an FX provider later without changing callers.
 */
export const USD_BASE_EXCHANGE_RATES: Readonly<Record<CurrencyCode, number>> = {
  USD: 1,
  VND: 26315.789473684,
  EUR: 0.8620689655,
  GBP: 0.7461637931,
  JPY: 159.0344828,
};

export const RATE_SOURCE = {
  provider: "static",
  asOf: "2026-05-21",
} as const;
