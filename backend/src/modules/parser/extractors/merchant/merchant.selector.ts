import type { MerchantCandidate } from "./merchant.types.js";

/**
 * Select the single best merchant candidate from the scanner's output.
 *
 * Tie-breaking rules applied in strict priority order:
 *
 *  Rule 1 — No candidates → return undefined.
 *  Rule 2 — Single candidate → return it immediately.
 *  Rule 3 — Exact beats partial.
 *            If any candidate is `matchType: 'exact'`, discard all partials.
 *  Rule 4 — Longer alias beats shorter alias.
 *            "uber eats" (9 chars) beats "uber" (4 chars).
 *            Rationale: a longer matching alias is more specific evidence.
 *  Rule 5 — Higher confidence breaks remaining ties.
 *  Rule 6 — Alphabetical by canonicalName breaks final ties deterministically.
 *            (Edge case: two different merchants with equally-long aliases at
 *            equal confidence. Should not occur in practice but the rule
 *            ensures the output is always the same for the same input.)
 *
 * These rules are ordered so the most impactful signal is evaluated first.
 * The comparator chain is a direct encoding of the priority list — no hidden logic.
 */

export function selectMerchantCandidate(
  candidates: MerchantCandidate[],
): MerchantCandidate | null {
  // Rule 1
  if (candidates.length === 0) return null;

  // Rule 2
  if (candidates.length === 1) return candidates[0]!;

  // Rule 3:
  const exactCandidates = candidates.filter((c) => c.matchType === "exact");
  const pool = exactCandidates.length > 0 ? exactCandidates : candidates;

  // Rule 4, 5, 6:
  const sorted = [...pool].sort((a, b) => {
    // Rule 4: take longer alias matched
    const aliasDiff = b.matchedAlias.length - a.matchedAlias.length;
    if (aliasDiff !== 0) return aliasDiff;

    // Rule 5: take higher confidence score
    const conDiff = b.confidence - a.confidence;
    if (conDiff !== 0) return conDiff;

    // Rule 6:
    return a.canonicalName.localeCompare(b.canonicalName);
  });

  return sorted[0] ?? null;
}
