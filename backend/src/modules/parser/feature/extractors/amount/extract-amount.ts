import {
  scanBareNumbers,
  scanCurrencyPrefix,
  scanCurrencySuffix,
  scanCurrencyThenNumber,
  scanNumberThenCurrency,
} from "./amount.scanners.js";
import type { AmountCandidate } from "./amount.types.js";
import { selectAmountCandidate } from "./amount.selector.js";
import { computeAmountConfidence } from "./amount.confidence.js";
import { DEFAULT_CURRENCY } from "./amount.constants.js";
import type { AmountResult } from "../../../types/extractor.types.js";

/**
 * Deduplicate candidates that resolved to the same numeric value.
 *
 * Why: "$45" and "45 usd" in the same string both produce value=45.
 * After deduplication we have one candidate instead of two, so the
 * ambiguity penalty is not incorrectly applied.
 *
 * Dedup rule: keep only one candidate per unique value.
 * Prefer 'paired' strength over 'bare' when deduplicating.
 */
function deduplicateByValue(candidates: AmountCandidate[]): AmountCandidate[] {
  const seen = new Map<number, AmountCandidate>();
  for (const candidate of candidates) {
    const existing = seen.get(candidate.value);
    if (!existing || candidate.matchStrength === "paired") {
      seen.set(candidate.value, candidate);
    }
  }
  return Array.from(seen.values());
}

/**
 * Extract the transaction amount from a normalized input string.
 *
 * Pipeline:
 *   1. Run all scanners in priority order (paired scanners first)
 *   2. Collect and deduplicate candidates
 *   3. Select one candidate via selectCandidate()
 *   4. Compute confidence score
 *   5. Return typed AmountResult
 *
 * This function is pure:
 *   - No DB, no API, no side effects
 *   - Same input always produces same output
 *   - Does not call normalizeInput — expects pre-normalized string
 *
 * @param normalizedInput - output of normalizeInput().normalized, never raw user input
 */

export function extractAmount(normalizedInput: string): AmountResult {
  // ── Step 1: run all scanners ────────────────────────────────────────────────
  // Paired scanners run first so they populate the candidate pool before bare numbers.
  // Order does not affect correctness (dedup + select handle priority) but
  // starting with paired scanners keeps the pool cleaner before dedup.

  const allCandidates: AmountCandidate[] = [
    ...scanCurrencyPrefix(normalizedInput),
    ...scanCurrencySuffix(normalizedInput),
    ...scanNumberThenCurrency(normalizedInput),
    ...scanCurrencyThenNumber(normalizedInput),
    ...scanBareNumbers(normalizedInput),
  ];

  // ── Step 2: deduplicate ─────────────────────────────────────────────────────
  const deduplicated = deduplicateByValue(allCandidates);

  // ── Step 3: select one candidate ───────────────────────────────────────────
  const chosen = selectAmountCandidate(deduplicated, normalizedInput);

  // ── Step 4: score ───────────────────────────────────────────────────────────
  const confidence = computeAmountConfidence({
    chosen,
    totalCandidates: deduplicated.length,
  });

  // ── Step 5: build result ────────────────────────────────────────────────────
  return {
    value: chosen?.value ?? null,
    currency: chosen?.currency ?? DEFAULT_CURRENCY,
    confidence,
    rawMatch: chosen?.rawMatch ?? null,
  };
}
