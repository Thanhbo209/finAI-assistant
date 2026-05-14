import {
  CURRENCY_TOKEN_MAP,
  DEFAULT_CURRENCY,
  PATTERN_BARE_NUMBER,
  PATTERN_CURRENCY_PREFIX,
  PATTERN_CURRENCY_SUFFIX,
  PATTERN_CURRENCY_THEN_NUMBER,
  PATTERN_NUMBER_THEN_CURRENCY,
} from "./amount.constants.js";
import type { AmountCandidate } from "./amount.types.js";

/**
 * Scan for: $45  $12.50
 * Returns paired candidates — currency is certain.
 */
export function scanCurrencyPrefix(input: string): AmountCandidate[] {
  const candidates: AmountCandidate[] = [];
  // Reset lastIndex — regex with /g flag is stateful
  PATTERN_CURRENCY_PREFIX.lastIndex = 0;

  let match: RegExpExecArray | null;

  while ((match = PATTERN_CURRENCY_PREFIX.exec(input)) !== null) {
    const [rawMatch, symbol, rawNumber] = match;
    // Guard against undefined capture groups
    if (symbol === undefined || rawNumber === undefined) {
      continue;
    }
    const value = parseFloat(rawNumber);
    const currency = CURRENCY_TOKEN_MAP[symbol] ?? DEFAULT_CURRENCY;
    candidates.push({ value, currency, rawMatch, matchStrength: "paired" });
  }

  return candidates;
}

/**
 * Scan for: 45$  12.50$
 * Returns paired candidates — currency is certain.
 */

export function scanCurrencySuffix(input: string): AmountCandidate[] {
  const candidates: AmountCandidate[] = [];
  PATTERN_CURRENCY_SUFFIX.lastIndex = 0;

  let match: RegExpExecArray | null;

  while ((match = PATTERN_CURRENCY_SUFFIX.exec(input)) !== null) {
    const [rawMatch, rawNumber, symbol] = match;
    // Guard against undefined capture groups
    if (symbol === undefined || rawNumber === undefined) {
      continue;
    }
    const value = parseFloat(rawNumber);
    const currency = CURRENCY_TOKEN_MAP[symbol] ?? DEFAULT_CURRENCY;

    candidates.push({ value, currency, rawMatch, matchStrength: "paired" });
  }

  return candidates;
}

/**
 * Scan for: 45 usd  12.50 eur
 * Returns paired candidates — currency code is explicit.
 */

export function scanNumberThenCurrency(input: string): AmountCandidate[] {
  const candidates: AmountCandidate[] = [];
  PATTERN_NUMBER_THEN_CURRENCY.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = PATTERN_NUMBER_THEN_CURRENCY.exec(input)) !== null) {
    const [rawMatch, rawNumber, currencyToken] = match;
    // Guard against undefined capture groups
    if (currencyToken === undefined || rawNumber === undefined) {
      continue;
    }
    const value = parseFloat(rawNumber);
    const currency =
      CURRENCY_TOKEN_MAP[currencyToken.toLowerCase()] ?? DEFAULT_CURRENCY;

    candidates.push({ value, currency, rawMatch, matchStrength: "paired" });
  }

  return candidates;
}

/**
 * Scan for: usd 45  eur 12.50
 * Returns paired candidates — currency code is explicit.
 */
export function scanCurrencyThenNumber(input: string): AmountCandidate[] {
  const candidates: AmountCandidate[] = [];
  PATTERN_CURRENCY_THEN_NUMBER.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = PATTERN_CURRENCY_THEN_NUMBER.exec(input)) !== null) {
    const [rawMatch, currencyToken, rawNumber] = match;
    // Guard against undefined capture groups
    if (currencyToken === undefined || rawNumber === undefined) {
      continue;
    }
    const value = parseFloat(rawNumber);
    const currency =
      CURRENCY_TOKEN_MAP[currencyToken.toLowerCase()] ?? DEFAULT_CURRENCY;
    candidates.push({ value, currency, rawMatch, matchStrength: "paired" });
  }
  return candidates;
}

/**
 * Scan for bare numbers with no currency context: 45, 6.50
 * Lowest-priority scanner — only used when no paired candidate is found.
 * Returns bare candidates — currency defaults to USD.
 */

export function scanBareNumbers(input: string): AmountCandidate[] {
  const candidates: AmountCandidate[] = [];
  PATTERN_BARE_NUMBER.lastIndex = 0;

  let match: RegExpExecArray | null;

  while ((match = PATTERN_BARE_NUMBER.exec(input)) !== null) {
    const [rawMatch, rawNumber] = match;
    // Guard against undefined capture groups
    if (rawNumber === undefined) {
      continue;
    }
    const value = parseFloat(rawNumber);
    candidates.push({
      value,
      currency: DEFAULT_CURRENCY,
      rawMatch,
      matchStrength: "bare",
    });
  }

  return candidates;
}
