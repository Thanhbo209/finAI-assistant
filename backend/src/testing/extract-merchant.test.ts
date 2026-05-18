import { describe, expect, it } from "vitest";
import { extractMerchant } from "../modules/parser/feature/extractors/merchant/extract-merchant.js";
import { MERCHANT_CONFIDENCE } from "../modules/parser/feature/extractors/merchant/merchant.constants.js";
import {
  scanExactAliases,
  scanMerchantCandidates,
  scanPartialTokens,
} from "../modules/parser/feature/extractors/merchant/merchant.scanner.js";
import { selectMerchantCandidate } from "../modules/parser/feature/extractors/merchant/merchant.selector.js";
import { computeMerchantConfidence } from "../modules/parser/feature/extractors/merchant/merchant.confidence.js";

// ─────────────────────────────────────────────────────────────────────────────
// Spec-required test cases — extractMerchant()
// ─────────────────────────────────────────────────────────────────────────────

describe("extractMerchant() — spec examples", () => {
  it('"uber 45" → Uber, exact match, high confidence', () => {
    const result = extractMerchant("uber 45");
    expect(result.canonicalName).toBe("Uber");
    expect(result.rawMatch).toBe("uber");
    expect(result.confidence).toBe(MERCHANT_CONFIDENCE.EXACT_MATCH);
  });

  it('"uber eats 20" → Uber via longer alias, exact match', () => {
    const result = extractMerchant("uber eats 20");
    expect(result.canonicalName).toBe("Uber");
    expect(result.rawMatch).toBe("uber eats");
    // "uber eats" (longer) selected over "uber" (shorter) — Rule 4 of selector
    expect(result.confidence).toBe(
      MERCHANT_CONFIDENCE.EXACT_MATCH - MERCHANT_CONFIDENCE.AMBIGUOUS,
    );
    // Two candidates found ("uber eats" AND "uber") → ambiguity penalty
  });

  it('"netflix 15 usd" → Netflix, exact match, high confidence', () => {
    const result = extractMerchant("netflix 15 usd");
    expect(result.canonicalName).toBe("Netflix");
    expect(result.rawMatch).toBe("netflix");
    expect(result.confidence).toBe(MERCHANT_CONFIDENCE.EXACT_MATCH);
  });

  it('"starbucks coffee 6" → Starbucks via "starbucks coffee" alias', () => {
    const result = extractMerchant("starbucks coffee 6");
    expect(result.canonicalName).toBe("Starbucks");
    expect(result.rawMatch).toBe("starbucks coffee");
    // Two candidates: "starbucks coffee" and "starbucks" → ambiguity penalty
    expect(result.confidence).toBe(
      MERCHANT_CONFIDENCE.EXACT_MATCH - MERCHANT_CONFIDENCE.AMBIGUOUS,
    );
  });

  it('"amazon prime 12" → Amazon via "amazon prime" alias', () => {
    const result = extractMerchant("amazon prime 12");
    expect(result.canonicalName).toBe("Amazon");
    expect(result.rawMatch).toBe("amazon prime");
  });

  it('"mcd lunch 10" → McDonald\'s via "mcd" alias', () => {
    const result = extractMerchant("mcd lunch 10");
    expect(result.canonicalName).toBe("McDonald's");
    expect(result.rawMatch).toBe("mcd");
    expect(result.confidence).toBe(MERCHANT_CONFIDENCE.EXACT_MATCH);
  });

  it('"grab airport 30" → Grab, exact match', () => {
    const result = extractMerchant("grab airport 30");
    expect(result.canonicalName).toBe("Grab");
    expect(result.rawMatch).toBe("grab");
  });

  it('"unknown merchant 40" → null, no match, low confidence', () => {
    const result = extractMerchant("unknown merchant 40");
    expect(result.canonicalName).toBeNull();
    expect(result.rawMatch).toBeNull();
    expect(result.confidence).toBe(MERCHANT_CONFIDENCE.NO_MATCH);
  });
});

// // ─────────────────────────────────────────────────────────────────────────────
// // Alias coverage — all dictionary aliases exercised
// // ─────────────────────────────────────────────────────────────────────────────

describe("extractMerchant() — alias coverage", () => {
  it('"uber trip 45" → Uber via "uber trip"', () => {
    expect(extractMerchant("uber trip 45").canonicalName).toBe("Uber");
  });

  it('"mcdonalds 10" → McDonald\'s via "mcdonalds"', () => {
    expect(extractMerchant("mcdonalds 10").canonicalName).toBe("McDonald's");
  });

  it('"mcdonald breakfast 8" → McDonald\'s via "mcdonald"', () => {
    expect(extractMerchant("mcdonald breakfast 8").canonicalName).toBe(
      "McDonald's",
    );
  });

  it('"spotify premium 9" → Spotify via "spotify premium"', () => {
    expect(extractMerchant("spotify premium 9").canonicalName).toBe("Spotify");
  });

  it('"walmart groceries 120" → Walmart via "walmart groceries"', () => {
    expect(extractMerchant("walmart groceries 120").canonicalName).toBe(
      "Walmart",
    );
  });

  it('"walmart grocery 90" → Walmart via "walmart grocery"', () => {
    expect(extractMerchant("walmart grocery 90").canonicalName).toBe("Walmart");
  });

  it('"grabfood order 25" → Grab via "grabfood"', () => {
    expect(extractMerchant("grabfood order 25").canonicalName).toBe("Grab");
  });

  it('"apple music 3" → Apple via "apple music"', () => {
    expect(extractMerchant("apple music 3").canonicalName).toBe("Apple");
  });

  it('"google play 5" → Google via "google play"', () => {
    expect(extractMerchant("google play 5").canonicalName).toBe("Google");
  });
});

// // ─────────────────────────────────────────────────────────────────────────────
// // Null / unknown merchant cases
// // ─────────────────────────────────────────────────────────────────────────────

describe("extractMerchant() — unknown merchants", () => {
  it("returns null for a generic food description", () => {
    const result = extractMerchant("lunch team 24");
    expect(result.canonicalName).toBeNull();
    expect(result.confidence).toBe(MERCHANT_CONFIDENCE.NO_MATCH);
  });

  it("returns null for an empty string", () => {
    const result = extractMerchant("");
    expect(result.canonicalName).toBeNull();
  });

  it("returns null for a number-only input", () => {
    const result = extractMerchant("45 usd");
    expect(result.canonicalName).toBeNull();
  });

  it("returns null for a completely unknown merchant name", () => {
    expect(extractMerchant("phobo restaurant 15").canonicalName).toBeNull();
  });
});

// // ─────────────────────────────────────────────────────────────────────────────
// // Longer alias wins over shorter alias (selector Rule 4)
// // ─────────────────────────────────────────────────────────────────────────────

describe("extractMerchant() — longer alias preference", () => {
  it('"starbucks coffee" raw match chosen over "starbucks" when both present', () => {
    const result = extractMerchant("starbucks coffee 6");
    expect(result.canonicalName).toBe("Starbucks");
    expect(result.rawMatch).toBe("starbucks coffee");
  });

  it('"amazon prime" raw match chosen over "amazon" when both present', () => {
    const result = extractMerchant("amazon prime 12");
    expect(result.canonicalName).toBe("Amazon");
    expect(result.rawMatch).toBe("amazon prime");
  });

  it('"uber eats" chosen over "uber"', () => {
    const result = extractMerchant("uber eats 20");
    expect(result.canonicalName).toBe("Uber");
    expect(result.rawMatch).toBe("uber eats");
  });

  it('"spotify premium" chosen over "spotify"', () => {
    const result = extractMerchant("spotify premium 9");
    expect(result.canonicalName).toBe("Spotify");
    expect(result.rawMatch).toBe("spotify premium");
  });
});

// // ─────────────────────────────────────────────────────────────────────────────
// // Confidence scoring — direct cases
// // ─────────────────────────────────────────────────────────────────────────────

describe("extractMerchant() — confidence scores", () => {
  it("single exact match → EXACT_MATCH score (0.95)", () => {
    // "netflix" has only one alias → no ambiguity penalty
    const result = extractMerchant("netflix 15");
    expect(result.confidence).toBe(MERCHANT_CONFIDENCE.EXACT_MATCH);
  });

  it("multiple exact matches (alias overlap) → EXACT_MATCH - AMBIGUOUS", () => {
    // "uber eats" AND "uber" both match → penalty applied
    const result = extractMerchant("uber eats 20");
    expect(result.confidence).toBe(
      MERCHANT_CONFIDENCE.EXACT_MATCH - MERCHANT_CONFIDENCE.AMBIGUOUS,
    );
  });

  it("no match → NO_MATCH score (0.10)", () => {
    expect(extractMerchant("coffee 5").confidence).toBe(
      MERCHANT_CONFIDENCE.NO_MATCH,
    );
  });
});

// // ─────────────────────────────────────────────────────────────────────────────
// // scanExactAliases() — unit tests
// // ─────────────────────────────────────────────────────────────────────────────

describe("scanExactAliases()", () => {
  it("finds single-alias merchant", () => {
    const candidates = scanExactAliases("netflix 15 usd");
    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.canonicalName).toBe("Netflix");
    expect(candidates[0]?.matchType).toBe("exact");
    expect(candidates[0]?.matchedAlias).toBe("netflix");
  });

  it("finds multiple aliases for same merchant (uber + uber eats)", () => {
    const candidates = scanExactAliases("uber eats 20");
    const names = candidates.map((c) => c.matchedAlias);
    expect(names).toContain("uber");
    expect(names).toContain("uber eats");
  });

  it("returns empty array when no alias matches", () => {
    expect(scanExactAliases("lunch with team 24")).toHaveLength(0);
  });

  it("does not cross-match different merchants", () => {
    const candidates = scanExactAliases("netflix 15");
    const names = candidates.map((c) => c.canonicalName);
    expect(names.every((n) => n === "Netflix")).toBe(true);
  });

  it('all returned candidates have matchType "exact"', () => {
    const candidates = scanExactAliases("uber eats 20");
    expect(candidates.every((c) => c.matchType === "exact")).toBe(true);
  });
});

// // ─────────────────────────────────────────────────────────────────────────────
// // scanPartialTokens() — unit tests
// // ─────────────────────────────────────────────────────────────────────────────

describe("scanPartialTokens()", () => {
  it("finds partial match for token that starts with alias", () => {
    // "netflixx" starts with "netflix" → partial
    const candidates = scanPartialTokens("netflixx subscription");
    expect(candidates.some((c) => c.canonicalName === "Netflix")).toBe(true);
    expect(candidates[0]?.matchType).toBe("partial");
  });

  // it("does not match tokens shorter than 3 characters", () => {
  //   const candidates = scanPartialTokens("ub 45");
  //   // "ub" is 2 chars — below minimum — should not partial-match "uber"
  //   expect(
  //     candidates.find((c) => c.canonicalName === "Uber"),
  //   ).toBeUndefined();
  // });

  it("does not attempt partial match on multi-token aliases", () => {
    // "uber eats" is multi-token — partial scan skips it
    const candidates = scanPartialTokens("uber 45");
    const aliasMatches = candidates.map((c) => c.matchedAlias);
    expect(aliasMatches).not.toContain("uber eats");
  });

  it("returns empty when exact aliases already matched (scanMerchantCandidates fallback)", () => {
    // scanMerchantCandidates only calls partial if exact returns nothing
    const result = scanMerchantCandidates("netflix 15");
    expect(result.every((c) => c.matchType === "exact")).toBe(true);
  });
});

// // ─────────────────────────────────────────────────────────────────────────────
// // selectMerchantCandidate() — unit tests
// // ─────────────────────────────────────────────────────────────────────────────

describe("selectMerchantCandidate()", () => {
  it("returns null for empty array", () => {
    expect(selectMerchantCandidate([])).toBeNull();
  });

  it("returns the only candidate immediately", () => {
    const c = {
      canonicalName: "Netflix",
      matchedAlias: "netflix",
      confidence: 0.95,
      matchType: "exact" as const,
    };
    expect(selectMerchantCandidate([c])).toBe(c);
  });

  it("exact beats partial when both present", () => {
    const partial = {
      canonicalName: "Uber",
      matchedAlias: "uber",
      confidence: 0.7,
      matchType: "partial" as const,
    };
    const exact = {
      canonicalName: "Netflix",
      matchedAlias: "netflix",
      confidence: 0.95,
      matchType: "exact" as const,
    };
    expect(selectMerchantCandidate([partial, exact])).toBe(exact);
  });

  it("longer alias beats shorter alias of same type", () => {
    const short = {
      canonicalName: "Uber",
      matchedAlias: "uber",
      confidence: 0.95,
      matchType: "exact" as const,
    };
    const long = {
      canonicalName: "Uber",
      matchedAlias: "uber eats",
      confidence: 0.95,
      matchType: "exact" as const,
    };
    expect(selectMerchantCandidate([short, long])).toBe(long);
  });

  it("higher confidence breaks tie when aliases are equal length", () => {
    const lower = {
      canonicalName: "Grab",
      matchedAlias: "grab",
      confidence: 0.7,
      matchType: "exact" as const,
    };
    const higher = {
      canonicalName: "Uber",
      matchedAlias: "uber",
      confidence: 0.95,
      matchType: "exact" as const,
    };
    expect(selectMerchantCandidate([lower, higher])).toBe(higher);
  });

  it("alphabetical tie-break on equal confidence and equal alias length", () => {
    const amazon = {
      canonicalName: "Amazon",
      matchedAlias: "amzn",
      confidence: 0.7,
      matchType: "partial" as const,
    };
    const apple = {
      canonicalName: "Apple",
      matchedAlias: "appl",
      confidence: 0.7,
      matchType: "partial" as const,
    };
    // "Amazon" < "Apple" alphabetically → Amazon wins
    const winner = selectMerchantCandidate([apple, amazon]);
    expect(winner?.canonicalName).toBe("Amazon");
  });
});

// // ─────────────────────────────────────────────────────────────────────────────
// // computeMerchantConfidence() — unit tests
// // ─────────────────────────────────────────────────────────────────────────────

describe("computeMerchantConfidence()", () => {
  const exactCandidate = {
    canonicalName: "Netflix",
    matchedAlias: "netflix",
    confidence: 0.95,
    matchType: "exact" as const,
  };
  const partialCandidate = {
    canonicalName: "Uber",
    matchedAlias: "uber",
    confidence: 0.7,
    matchType: "partial" as const,
  };

  it("null candidate → NO_MATCH (0.10)", () => {
    expect(
      computeMerchantConfidence({ chosen: null, totalCandidates: 0 }),
    ).toBe(MERCHANT_CONFIDENCE.NO_MATCH);
  });

  it("single exact candidate → EXACT_MATCH (0.95)", () => {
    expect(
      computeMerchantConfidence({ chosen: exactCandidate, totalCandidates: 1 }),
    ).toBe(MERCHANT_CONFIDENCE.EXACT_MATCH);
  });

  it("single partial candidate → PARTIAL_MATCH (0.70)", () => {
    expect(
      computeMerchantConfidence({
        chosen: partialCandidate,
        totalCandidates: 1,
      }),
    ).toBe(MERCHANT_CONFIDENCE.PARTIAL_MATCH);
  });

  it("exact candidate with ambiguity → EXACT_MATCH - AMBIGUOUS (0.80)", () => {
    expect(
      computeMerchantConfidence({ chosen: exactCandidate, totalCandidates: 2 }),
    ).toBe(MERCHANT_CONFIDENCE.EXACT_MATCH - MERCHANT_CONFIDENCE.AMBIGUOUS);
  });

  it("partial candidate with ambiguity → PARTIAL_MATCH - AMBIGUOUS (0.55)", () => {
    expect(
      computeMerchantConfidence({
        chosen: partialCandidate,
        totalCandidates: 2,
      }),
    ).toBe(MERCHANT_CONFIDENCE.PARTIAL_MATCH - MERCHANT_CONFIDENCE.AMBIGUOUS);
  });

  it("score is capped at 1.0", () => {
    expect(
      computeMerchantConfidence({ chosen: exactCandidate, totalCandidates: 1 }),
    ).toBeLessThanOrEqual(1.0);
  });
});
