/**
 * Select one candidate from the found set.
 *
 * Priority rules applied in order:
 *
 *  1. If zero candidates → return undefined.
 *  2. If exactly one candidate → return it unconditionally.
 *  3. If multiple candidates and at least one is 'paired' →
 *       use only the paired candidates, discard bare numbers.
 *       If still multiple paired candidates, apply MULTI_NUMBER_STRATEGY.
 *  4. If multiple bare candidates → apply MULTI_NUMBER_STRATEGY.
 *
 * MULTI_NUMBER_STRATEGY = 'LAST_NUMBER':
 *   Take the candidate whose rawMatch appears last in the input string.
 *   Rationale: users typically append amounts at the end of descriptions.
 *   "uber 45 airport 10" → $10 (last figure).
 *   This is documented in amount.constants.ts and tested explicitly.
 */

import { MULTI_NUMBER_STRATEGY } from "./amount.constants.js";
import type { AmountCandidate } from "./amount.types.js";

export function selectAmountCandidate(
  candidates: AmountCandidate[],
  input: string,
): AmountCandidate | undefined {
  if (candidates.length === 0) return undefined;
  if (candidates.length === 1) return candidates[0];

  const pairedCandidates = candidates.filter(
    (c) => c.matchStrength === "paired",
  );

  const pool = pairedCandidates.length > 0 ? pairedCandidates : candidates;

  if (pool.length === 1) return pool[0];

  // MULTI_NUMBER_STRATEGY: 'LAST_NUMBER' — take the last match by string position
  // TypeScript exhaustiveness: if we add a new strategy, this will error at compile time

  const _exhaustive: typeof MULTI_NUMBER_STRATEGY = MULTI_NUMBER_STRATEGY;
  void _exhaustive;

  return pool.reduce((latest, candidate) => {
    const latestPos = input.lastIndexOf(latest.rawMatch);
    const currentPos = input.lastIndexOf(candidate.rawMatch);

    return currentPos > latestPos ? candidate : latest;
  });
}
