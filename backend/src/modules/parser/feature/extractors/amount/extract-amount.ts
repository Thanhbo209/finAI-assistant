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
import {
  type CurrencyCode,
  type CurrencyContext,
  resolveCurrency,
} from "./amount.constants.js";
import type { AmountResult } from "../../../types/extractor.types.js";

/**
 * Options for extractAmount — replaces the old single-string signature.
 * Passing currencyContext enables context-aware bare-number resolution.
 */
export interface ExtractAmountOptions {
  normalizedInput: string;
  currencyContext?: CurrencyContext;
}

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
 *   4. Resolve currency via 5-tier priority chain
 *   5. Compute confidence score
 *   6. Return typed AmountResult
 *
 * Currency resolution priority (highest → lowest):
 *   1. Explicit currency in input ("45 usd") — paired scanner match
 *   2. currencyContext.activeCurrency — current session currency
 *   3. currencyContext.userPreferredCurrency — persisted user preference
 *   4. currencyContext.localeCurrency — browser locale derived
 *   5. USD — absolute last-resort fallback
 *
 * This function is pure:
 *   - No DB, no API, no side effects
 *   - Same input + context always produces same output
 *   - Does not call normalizeInput — expects pre-normalized string
 *
 * @param opts.normalizedInput - output of normalizeInput().normalized
 * @param opts.currencyContext - optional session/profile currency context
 */

export function extractAmount(opts: ExtractAmountOptions): AmountResult {
  const { normalizedInput, currencyContext } = opts;

  // ── Step 1: run all scanners ──────────────────────────────────────────────
  // Paired scanners run first so they populate the candidate pool before bare numbers.
  const allCandidates: AmountCandidate[] = [
    ...scanCurrencyPrefix(normalizedInput),
    ...scanCurrencySuffix(normalizedInput),
    ...scanNumberThenCurrency(normalizedInput),
    ...scanCurrencyThenNumber(normalizedInput),
    ...scanBareNumbers(normalizedInput),
  ];

  // ── Step 2: deduplicate ───────────────────────────────────────────────────
  const deduplicated = deduplicateByValue(allCandidates);

  // ── Step 3: select one candidate ─────────────────────────────────────────
  const chosen = selectAmountCandidate(deduplicated, normalizedInput);

  // ── Step 4: resolve currency via priority chain ───────────────────────────
  // explicitCurrency is defined only when the chosen candidate came from a
  // paired scanner (explicit currency in input). Bare candidates have undefined.
  const explicitCurrency: CurrencyCode | undefined =
    chosen?.matchStrength === "paired" ? (chosen.currency as CurrencyCode) : undefined;

  const resolvedCurrency = resolveCurrency(explicitCurrency, currencyContext);

  // ── Step 5: score ─────────────────────────────────────────────────────────
  const confidence = computeAmountConfidence({
    chosen,
    totalCandidates: deduplicated.length,
  });

  // ── Step 6: build result ──────────────────────────────────────────────────
  return {
    value: chosen?.value ?? null,
    currency: resolvedCurrency,
    confidence,
    rawMatch: chosen?.rawMatch ?? null,
  };
}
