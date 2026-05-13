import { MERCHANT_CONFIDENCE } from "./merchant.constants.js";
import { ALIAS_TO_MERCHANT } from "./merchant.dictionary.js";
import type { MerchantCandidate } from "./merchant.types.js";

/**
 * Pass 1 — Exact alias scan.
 *
 * For every alias in the dictionary, test whether the normalized input
 * contains that alias as a contiguous substring.
 *
 * Why substring containment and not a word-boundary regex?
 *   Aliases like "uber eats" are multi-token. A word-boundary regex becomes
 *   complex and fragile for multi-word patterns. String containment is
 *   simpler, deterministic, and equally correct for our use-case because
 *   the normalization layer has already reduced input to lowercase with
 *   single spaces — there are no casing or whitespace surprises.
 *
 * Returns all matching candidates — the selector decides which one wins.
 */

export function scanExactAliases(input: string): MerchantCandidate[] {
  const candidate: MerchantCandidate[] = [];

  for (const [alias, entry] of ALIAS_TO_MERCHANT) {
    if (input.includes(alias)) {
      candidate.push({
        canonicalName: entry.canonicalName,
        matchedAlias: alias,
        confidence: MERCHANT_CONFIDENCE.EXACT_MATCH,
        matchType: "exact",
      });
    }
  }

  return candidate;
}

/**
 * Pass 2 — Partial token scan.
 *
 * Splits the input into individual word tokens and checks whether any
 * single-token alias starts with that token or vice versa.
 *
 * Only runs when Pass 1 finds zero candidates — we do not want to
 * produce partial matches that compete with exact matches and add noise
 * to the selector.
 *
 * Partial matching catches typos like "netflx" or short-form inputs like
 * "amzn".  Confidence is lower to reflect the reduced certainty.
 *
 * Note: this is intentionally conservative — only single-token aliases
 * are considered for partial matching.  Multi-token aliases ("uber eats")
 * require an exact match to avoid false positives.
 */

export function scanPartialTokens(input: string): MerchantCandidate[] {
  if (input.trim().length === 0) return [];

  const candidate: MerchantCandidate[] = [];
  const inputTokens = input.split(" ").filter(Boolean);

  for (const [alias, entry] of ALIAS_TO_MERCHANT) {
    if (alias.includes(" ")) continue;

    const isPartialMatch = inputTokens.some(
      (token) =>
        (token.length >= 3 && alias.length >= 3 && token.startsWith(alias)) ||
        alias.startsWith(token),
    );

    if (isPartialMatch) {
      candidate.push({
        canonicalName: entry.canonicalName,
        matchedAlias: alias,
        confidence: MERCHANT_CONFIDENCE.PARTIAL_MATCH,
        matchType: "partial",
      });
    }
  }

  return candidate;
}

/**
 * Combined scanner — runs exact pass first; falls back to partial only
 * when exact produces no results.
 *
 * Keeping the two passes separate (rather than one combined function)
 * means each pass is independently testable and the fallback behaviour
 * is explicit and documented.
 */

export function scanMerchantCandidates(input: string): MerchantCandidate[] {
  const exactCandidates = scanExactAliases(input);
  if (exactCandidates.length > 0) return exactCandidates;
  return scanPartialTokens(input);
}
