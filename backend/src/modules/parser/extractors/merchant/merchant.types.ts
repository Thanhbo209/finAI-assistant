/**
 * Internal candidate produced by the scanner.
 * Multiple candidates may be found; the selector picks one.
 * Not exported from the module barrel — callers only see MerchantResult.
 */

export interface MerchantCandidate {
  /** Canonical name as defined in the dictionary, e.g. "Uber" */
  canonicalName: string;
  /** The alias string that triggered the match, e.g. "uber eats" */
  matchedAlias: string;
  confidence: number;
  matchType: "exact" | "partial";
}
