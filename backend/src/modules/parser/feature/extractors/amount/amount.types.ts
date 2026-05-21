import type { CurrencyCode } from "./amount.constants.js";

/**
 * An internal candidate found during pattern scanning.
 * Multiple candidates may be found; the selector picks one.
 *
 * Not exported — internal to the extractor module.
 */
export interface AmountCandidate {
  value: number;
  /**
   * Currency detected by the scanner.
   * undefined for bare candidates (no explicit currency in input) —
   * the final currency is resolved via CurrencyContext in extractAmount().
   */
  currency: CurrencyCode | undefined;
  /** Substring that triggered the match, for rawMatch on the final result */
  rawMatch: string;
  /**
   * How strong is this candidate's evidence?
   * 'paired'  = number + currency found together (strongest)
   * 'bare'    = number found, no accompanying currency
   */
  matchStrength: "paired" | "bare";
}
