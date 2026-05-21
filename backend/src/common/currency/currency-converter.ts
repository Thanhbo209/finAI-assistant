import {
  isSupportedCurrency,
  type CurrencyCode,
} from "../constants/currency.constants.js";
import { USD_BASE_EXCHANGE_RATES } from "./currency-rates.js";

const DISPLAY_DECIMALS: Readonly<Record<CurrencyCode, number>> = {
  USD: 2,
  VND: 0,
  EUR: 2,
  GBP: 2,
  JPY: 0,
};

export function assertCurrencyCode(value: string): CurrencyCode {
  const normalized = value.trim().toUpperCase();

  if (!isSupportedCurrency(normalized)) {
    throw new Error(`Unsupported currency: ${value}`);
  }

  return normalized;
}

export function getExchangeRate(
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode,
): number {
  return USD_BASE_EXCHANGE_RATES[toCurrency] / USD_BASE_EXCHANGE_RATES[fromCurrency];
}

export function roundCurrencyAmount(
  amount: number,
  currency: CurrencyCode,
): number {
  const decimals = DISPLAY_DECIMALS[currency];
  const factor = 10 ** decimals;

  return Math.round((amount + Number.EPSILON) * factor) / factor;
}

export function convertAmount(
  amount: number,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode,
): number {
  if (fromCurrency === toCurrency) {
    return roundCurrencyAmount(amount, toCurrency);
  }

  const converted = amount * getExchangeRate(fromCurrency, toCurrency);

  return roundCurrencyAmount(converted, toCurrency);
}
