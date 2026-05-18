/**
 * All extractor outputs plus the missing-field list.
 * The composer never re-runs extraction — it only reads these results.
 */

import type { MissingField } from "../../../constants/parser.constants.js";
import type {
  AmountResult,
  CategoryResult,
  DateResult,
  MerchantResult,
} from "../../../types/extractor.types.js";

export interface ComposeConfidenceInput {
  amountResult: AmountResult;
  merchantResult: MerchantResult;
  categoryResult: CategoryResult;
  missingFields: MissingField[];
}

/**
 * Breakdown of how the final score was computed.
 * Returned alongside the score so callers can log, debug, or
 * surface explainability data to users without re-deriving the math.
 */
export interface ConfidenceBreakdown {
  /** Weighted contribution of each field before penalties */
  weightedAmount: number;
  weightedMerchant: number;
  weightedCategory: number;
  /** Sum of weighted contributions before any penalty */
  rawWeightedScore: number;
  /** Total penalty deducted */
  totalPenalty: number;
  /** Final clamped score */
  finalScore: number;
}

export interface ConfidenceResult {
  score: number;
  breakdown: ConfidenceBreakdown;
}
