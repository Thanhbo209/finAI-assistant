/**
 * Extract merchant information from a normalized input string.
 *
 * Pipeline:
 *   1. Scan — find all matching merchant candidates (exact, then partial)
 *   2. Select — pick the single best candidate via documented tie-breaking rules
 *   3. Score — compute confidence given the chosen candidate and pool size
 *   4. Return — typed MerchantResult
 *
 * This function is pure:
 *   - No DB, no API, no side effects
 *   - Same input always produces same output
 *   - Expects pre-normalized input (output of normalizeInput().normalized)
 *
 * @param normalizedInput - post-normalization string; never raw user input
 */

import type { MerchantResult } from "../../types/extractor.types.js";
import { computeMerchantConfidence } from "./merchant.confidence.js";
import { scanMerchantCandidates } from "./merchant.scanner.js";
import { selectMerchantCandidate } from "./merchant.selector.js";

export function extractMerchant(normalizaInput: string): MerchantResult {
  // step 1
  const candidates = scanMerchantCandidates(normalizaInput);

  // step 2
  const chosen = selectMerchantCandidate(candidates);

  // step 3
  const confidence = computeMerchantConfidence({
    chosen,
    totalCandidates: candidates.length,
  });

  return {
    canonicalName: chosen?.canonicalName ?? null,
    rawMatch: chosen?.matchedAlias ?? null,
    confidence,
  };
}
