import { describe, expect, it } from "vitest";
import {
  FIELD_WEIGHTS,
  MISSING_FIELD_PENALTIES,
  SCORE_BOUNDS,
} from "./confidence.constants.js";
import { composeConfidence } from "./confidence.composer.js";
import type { ComposeConfidenceInput } from "./confidence.types.js";
import type {
  AmountResult,
  CategoryResult,
  DateResult,
  MerchantResult,
} from "../../../types/extractor.types.js";

// ─────────────────────────────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────────────────────────────

function amount(value: number | null, confidence: number): AmountResult {
  return {
    value,
    currency: "USD",
    confidence,
    rawMatch: value !== null ? String(value) : null,
  };
}
function merchant(name: string | null, confidence: number): MerchantResult {
  return {
    canonicalName: name,
    confidence,
    rawMatch: name?.toLowerCase() ?? null,
  };
}
function category(
  value: string,
  confidence: number,
  source: CategoryResult["source"] = "merchant",
): CategoryResult {
  return { value: value as CategoryResult["value"], confidence, source };
}
function date(source: DateResult["source"], confidence: number): DateResult {
  return { value: new Date("2025-05-14"), confidence, source };
}

// "Perfect parse" — every field extracted with highest confidence
const PERFECT: ComposeConfidenceInput = {
  amountResult: amount(45, 0.95),
  merchantResult: merchant("Uber", 0.95),
  categoryResult: category("Transportation", 0.9),
  missingFields: [],
};

// ─────────────────────────────────────────────────────────────────────────────
// Spec scenarios
// ─────────────────────────────────────────────────────────────────────────────

describe("composeConfidence() — spec scenarios", () => {
  it("perfect parse → high score matches weighted sum", () => {
    const { score } = composeConfidence(PERFECT);

    // Dynamic calculation based on current weights (Amount, Merchant, Category)
    const expectedScore =
      0.95 * FIELD_WEIGHTS.amount +
      0.95 * FIELD_WEIGHTS.merchant +
      0.9 * FIELD_WEIGHTS.category;

    expect(score).toBeCloseTo(expectedScore, 3);
  });

  it("missing amount → severe penalty applied", () => {
    const { score, breakdown } = composeConfidence({
      ...PERFECT,
      amountResult: amount(null, 0.1), // NO_NUMBER floor
      missingFields: ["amount"],
    });
    expect(breakdown.totalPenalty).toBe(MISSING_FIELD_PENALTIES.MISSING_AMOUNT);
    // Score should drop significantly due to missing amount penalty
    expect(score).toBeLessThan(0.4);
  });

  it("missing merchant → mild penalty only", () => {
    const { score, breakdown } = composeConfidence({
      ...PERFECT,
      merchantResult: merchant(null, 0.1),
      missingFields: ["merchant"],
    });
    expect(breakdown.totalPenalty).toBe(
      MISSING_FIELD_PENALTIES.MISSING_MERCHANT,
    );
    // Score remains relatively healthy despite missing merchant
    expect(score).toBeGreaterThan(0.55);
  });

  it("missing merchant → mild penalty only", () => {
    const { score, breakdown } = composeConfidence({
      ...PERFECT,
      merchantResult: merchant(null, 0.1),
      missingFields: ["merchant"],
    });
    expect(breakdown.totalPenalty).toBe(
      MISSING_FIELD_PENALTIES.MISSING_MERCHANT,
    );
    // rawWeightedScore ≈ 0.380 + 0.10×0.35 + 0.1425 + 0.090 = 0.6475
    // minus 0.05 → 0.5975
    expect(score).toBeGreaterThan(0.55);
  });

  it("unknown category → negligible penalty", () => {
    const { score, breakdown } = composeConfidence({
      ...PERFECT,
      categoryResult: category("Unknown", 0.2, "default"),
      missingFields: [],
    });
    expect(breakdown.totalPenalty).toBe(
      MISSING_FIELD_PENALTIES.UNKNOWN_CATEGORY,
    );
    // Score should still be high — unknown category barely moves it
    expect(score).toBeGreaterThan(0.8);
  });

  it("low-confidence merchant → naturally lower score without extra penalty", () => {
    const highConf = composeConfidence(PERFECT).score;
    const lowMerch = composeConfidence({
      ...PERFECT,
      merchantResult: merchant("Uber", 0.7), // ambiguity-penalised
      missingFields: [],
    }).score;
    // Lower merchant confidence reduces score, but no additional penalty fires
    expect(lowMerch).toBeLessThan(highConf);
    // Difference should be ~0.0875 (0.25 conf drop × 0.35 weight)
    expect(highConf - lowMerch).toBeCloseTo(0.0875, 3);
  });

  it("ambiguous amount (0.10) → low weighted contribution", () => {
    const { breakdown } = composeConfidence({
      ...PERFECT,
      amountResult: amount(10, 0.1), // ambiguous multi-number
      missingFields: [],
    });
    // Amount contribution: 0.10 × 0.50 = 0.05
    expect(breakdown.weightedAmount).toBeCloseTo(0.05, 3);
  });

  it("all defaults (date=default, category=Unknown, no merchant) → below medium threshold", () => {
    const { score } = composeConfidence({
      amountResult: amount(45, 0.4), // bare number
      merchantResult: merchant(null, 0.1), // no match
      categoryResult: category("Unknown", 0.2, "default"),
      missingFields: ["merchant"],
    });
    // Still has a good amount — should be moderate, not catastrophically low
    expect(score).toBeGreaterThan(0.15);
    expect(score).toBeLessThan(0.65);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Math verification — explicit arithmetic
// ─────────────────────────────────────────────────────────────────────────────

describe("composeConfidence() — math verification", () => {
  it("rawWeightedScore equals sum of three weighted contributions", () => {
    const { breakdown } = composeConfidence(PERFECT);
    const expectedRaw =
      breakdown.weightedAmount +
      breakdown.weightedMerchant +
      breakdown.weightedCategory;
    expect(breakdown.rawWeightedScore).toBeCloseTo(expectedRaw, 10);
  });

  it("finalScore equals rawWeightedScore minus totalPenalty (when no clamping needed)", () => {
    const { breakdown } = composeConfidence(PERFECT);
    expect(breakdown.finalScore).toBeCloseTo(
      breakdown.rawWeightedScore - breakdown.totalPenalty,
      10,
    );
  });

  it("each weighted contribution equals field_confidence × field_weight", () => {
    const { breakdown } = composeConfidence(PERFECT);
    expect(breakdown.weightedAmount).toBeCloseTo(
      0.95 * FIELD_WEIGHTS.amount,
      10,
    );
    expect(breakdown.weightedMerchant).toBeCloseTo(
      0.95 * FIELD_WEIGHTS.merchant,
      10,
    );
    expect(breakdown.weightedCategory).toBeCloseTo(
      0.9 * FIELD_WEIGHTS.category,
      10,
    );
  });

  it("missing amount + missing merchant → both penalties deducted", () => {
    const { breakdown } = composeConfidence({
      ...PERFECT,
      amountResult: amount(null, 0.1),
      merchantResult: merchant(null, 0.1),
      missingFields: ["amount", "merchant"],
    });
    const expectedPenalty =
      MISSING_FIELD_PENALTIES.MISSING_AMOUNT +
      MISSING_FIELD_PENALTIES.MISSING_MERCHANT;
    expect(breakdown.totalPenalty).toBeCloseTo(expectedPenalty, 10);
  });

  it("unknown category penalty adds UNKNOWN_CATEGORY on top of other penalties", () => {
    const { breakdown } = composeConfidence({
      ...PERFECT,
      merchantResult: merchant(null, 0.1),
      categoryResult: category("Unknown", 0.2, "default"),
      missingFields: ["merchant"],
    });
    const expectedPenalty =
      MISSING_FIELD_PENALTIES.MISSING_MERCHANT +
      MISSING_FIELD_PENALTIES.UNKNOWN_CATEGORY;
    expect(breakdown.totalPenalty).toBeCloseTo(expectedPenalty, 10);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Bounds enforcement
// ─────────────────────────────────────────────────────────────────────────────

describe("composeConfidence() — score bounds", () => {
  it("score never exceeds 1.0", () => {
    const { score } = composeConfidence(PERFECT);
    expect(score).toBeLessThanOrEqual(SCORE_BOUNDS.MAX);
  });

  it("score never drops below 0.0", () => {
    // Worst possible input: everything at minimum confidence, everything missing
    const { score } = composeConfidence({
      amountResult: amount(null, 0.1),
      merchantResult: merchant(null, 0.1),
      categoryResult: category("Unknown", 0.2, "default"),
      missingFields: ["amount", "merchant", "date", "category"],
    });
    expect(score).toBeGreaterThanOrEqual(SCORE_BOUNDS.MIN);
  });

  it("all fields at 1.0 confidence with no penalties → score = 1.0", () => {
    const { score } = composeConfidence({
      amountResult: amount(45, 1.0),
      merchantResult: merchant("Uber", 1.0),
      categoryResult: category("Transportation", 1.0),
      missingFields: [],
    });
    expect(score).toBe(1.0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Weight dominance — amount must have most impact
// ─────────────────────────────────────────────────────────────────────────────

describe("composeConfidence() — field weight dominance", () => {
  const BASE = {
    amountResult: amount(45, 1.0),
    merchantResult: merchant("Uber", 1.0),
    categoryResult: category("Transportation", 1.0),
    missingFields: [] as never[],
  };

  it("dropping amount confidence has greater impact than dropping merchant", () => {
    const dropAmount = composeConfidence({
      ...BASE,
      amountResult: amount(45, 0),
    }).score;
    const dropMerchant = composeConfidence({
      ...BASE,
      merchantResult: merchant("Uber", 0),
    }).score;
    expect(dropAmount).toBeLessThan(dropMerchant);
  });

  it("dropping merchant confidence has greater impact than dropping category", () => {
    const dropMerchant = composeConfidence({
      ...BASE,
      merchantResult: merchant("Uber", 0),
    }).score;
    const dropCategory = composeConfidence({
      ...BASE,
      categoryResult: category("Transportation", 0),
    }).score;
    expect(dropMerchant).toBeLessThan(dropCategory);
  });

  it("amount weight contribution alone = FIELD_WEIGHTS.amount when amount confidence is 1.0", () => {
    const { breakdown } = composeConfidence(BASE);
    expect(breakdown.weightedAmount).toBe(FIELD_WEIGHTS.amount);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Breakdown explainability
// ─────────────────────────────────────────────────────────────────────────────

describe("composeConfidence() — breakdown completeness", () => {
  it("breakdown contains all expected fields", () => {
    const { breakdown } = composeConfidence(PERFECT);
    expect(breakdown).toHaveProperty("weightedAmount");
    expect(breakdown).toHaveProperty("weightedMerchant");
    expect(breakdown).toHaveProperty("weightedCategory");
    expect(breakdown).toHaveProperty("rawWeightedScore");
    expect(breakdown).toHaveProperty("totalPenalty");
    expect(breakdown).toHaveProperty("finalScore");
  });

  it("breakdown.finalScore matches returned score", () => {
    const result = composeConfidence(PERFECT);
    expect(result.score).toBe(result.breakdown.finalScore);
  });

  it("zero penalties when no fields are missing and category is not Unknown", () => {
    const { breakdown } = composeConfidence(PERFECT);
    expect(breakdown.totalPenalty).toBe(0);
  });
});
