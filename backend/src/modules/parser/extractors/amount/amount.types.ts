import type { CurrencyCode } from "./amount.constants.js";

/**
 * An internal candidate found during pattern scanning.
 * Multiple candidates may be found; the selector picks one.
 *
 * Not exported — internal to the extractor module.
 */
export interface AmountCandidate {
  value: number;
  currency: CurrencyCode;
  /** Substring that triggered the match, for rawMatch on the final result */
  rawMatch: string;
  /**
   * How strong is this candidate's evidence?
   * 'paired'  = number + currency found together (strongest)
   * 'bare'    = number found, no accompanying currency
   */
  matchStrength: "paired" | "bare";
}
