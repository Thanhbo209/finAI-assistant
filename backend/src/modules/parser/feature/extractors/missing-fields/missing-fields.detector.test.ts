import { describe, expect, it } from "vitest";
import {
  detectMissingFields,
  isAmountMissing,
  isCategoryMissing,
  isDateMissing,
  isMerchantMissing,
} from "./missing-fields.detector.js";
import { MIN_CONFIDENCE } from "./missing-fields.constants.js";
import type {
  AmountResult,
  CategoryResult,
  DateResult,
  MerchantResult,
} from "../../../types/extractor.types.js";

// ─────────────────────────────────────────────────────────────────────────────
// Test fixtures — build realistic extractor outputs without running the pipeline
// ─────────────────────────────────────────────────────────────────────────────

function makeAmount(value: number | null, confidence: number): AmountResult {
  return {
    value,
    currency: "USD",
    confidence,
    rawMatch: value !== null ? String(value) : null,
  };
}

function makeMerchant(name: string | null, confidence: number): MerchantResult {
  return {
    canonicalName: name,
    confidence,
    rawMatch: name?.toLowerCase() ?? null,
  };
}

function makeCategory(
  value: "Unknown" | string,
  confidence: number,
): CategoryResult {
  return {
    value: value as CategoryResult["value"],
    confidence,
    source: value === "Unknown" ? "default" : "merchant",
  };
}

function makeDate(
  source: "explicit" | "relative" | "default",
  confidence: number,
): DateResult {
  return { value: new Date("2025-05-14"), confidence, source };
}

// Convenience: "good enough" results for fields not under test
const GOOD_AMOUNT = makeAmount(45, 0.95);
const GOOD_MERCHANT = makeMerchant("Uber", 0.95);
const GOOD_CATEGORY = makeCategory("Transportation", 0.9);
const GOOD_DATE = makeDate("explicit", 0.95);
const NO_MERCHANT = makeMerchant(null, 0.1); // NO_MATCH floor
const DEFAULT_DATE = makeDate("default", 0.4);

// ─────────────────────────────────────────────────────────────────────────────
// Spec-required scenarios
// ─────────────────────────────────────────────────────────────────────────────

describe("detectMissingFields() — spec scenarios", () => {
  it('"netflix" — amount missing, merchant found, no date', () => {
    // netflix: no amount extracted
    const missing = detectMissingFields({
      amountResult: makeAmount(null, 0.1), // NO_NUMBER score
      merchantResult: makeMerchant("Netflix", 0.95),
      categoryResult: makeCategory("Subscriptions", 0.9),
      dateResult: DEFAULT_DATE,
    });
    expect(missing).toContain("amount");
    expect(missing).not.toContain("merchant");
  });

  it('"coffee 5" — amount present, merchant absent (generic), category UNKNOWN', () => {
    const missing = detectMissingFields({
      amountResult: makeAmount(5, 0.4), // bare number — above threshold
      merchantResult: NO_MERCHANT, // 0.10 — below MIN_CONFIDENCE.MERCHANT
      categoryResult: makeCategory("Food & Drink", 0.6), // keyword hit
      dateResult: DEFAULT_DATE,
    });
    // Amount is present (0.40 >= 0.30)
    expect(missing).not.toContain("amount");
    // Merchant confidence 0.10 < 0.20 → missing
    expect(missing).toContain("merchant");
    // Category is not Unknown → not missing regardless of flag
    expect(missing).not.toContain("category");
    // Default date is not missing (product decision)
    expect(missing).not.toContain("date");
  });

  it('"uber airport 45" — all fields present, no missing', () => {
    const missing = detectMissingFields({
      amountResult: makeAmount(45, 0.8),
      merchantResult: makeMerchant("Uber", 0.95),
      categoryResult: makeCategory("Transportation", 0.9),
      dateResult: makeDate("relative", 0.8),
    });
    expect(missing).toHaveLength(0);
  });

  it('"unknown thing" — amount missing, no merchant', () => {
    const missing = detectMissingFields({
      amountResult: makeAmount(null, 0.1),
      merchantResult: NO_MERCHANT,
      categoryResult: makeCategory("Unknown", 0.2),
      dateResult: DEFAULT_DATE,
    });
    expect(missing).toContain("amount");
    expect(missing).toContain("merchant");
    // Category UNKNOWN is NOT flagged (product decision: UNKNOWN_CATEGORY_IS_MISSING = false)
    expect(missing).not.toContain("category");
  });

  it('"restaurant yesterday" — amount missing, no merchant, valid date', () => {
    const missing = detectMissingFields({
      amountResult: makeAmount(null, 0.1),
      merchantResult: NO_MERCHANT,
      categoryResult: makeCategory("Food & Drink", 0.6),
      dateResult: makeDate("relative", 0.8),
    });
    expect(missing).toContain("amount");
    expect(missing).toContain("merchant");
    expect(missing).not.toContain("category");
    expect(missing).not.toContain("date");
  });

  it('"amazon" — amount missing, merchant found', () => {
    const missing = detectMissingFields({
      amountResult: makeAmount(null, 0.1),
      merchantResult: makeMerchant("Amazon", 0.95),
      categoryResult: makeCategory("Shopping", 0.9),
      dateResult: DEFAULT_DATE,
    });
    expect(missing).toContain("amount");
    expect(missing).not.toContain("merchant");
    expect(missing).not.toContain("category");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// isAmountMissing() — unit tests
// ─────────────────────────────────────────────────────────────────────────────

describe("isAmountMissing()", () => {
  it("null value → missing regardless of confidence", () => {
    expect(isAmountMissing(makeAmount(null, 0.9))).toBe(true);
  });

  it("null value with 0.10 confidence → missing", () => {
    expect(isAmountMissing(makeAmount(null, 0.1))).toBe(true);
  });

  it("value present, confidence below threshold → missing", () => {
    // Confidence 0.10 (ambiguous multi-number penalty applied) — below 0.30
    expect(isAmountMissing(makeAmount(45, 0.1))).toBe(true);
  });

  it("value present, confidence exactly at threshold → NOT missing", () => {
    expect(isAmountMissing(makeAmount(45, MIN_CONFIDENCE.AMOUNT))).toBe(false);
  });

  it("value present, confidence above threshold → NOT missing", () => {
    expect(isAmountMissing(makeAmount(45, 0.8))).toBe(false);
  });

  it("bare number (0.40 confidence) → NOT missing", () => {
    // 0.40 = NUMBER_FOUND base — above 0.30 threshold
    expect(isAmountMissing(makeAmount(5, 0.4))).toBe(false);
  });
});

// // ─────────────────────────────────────────────────────────────────────────────
// // isMerchantMissing() — unit tests
// // ─────────────────────────────────────────────────────────────────────────────

describe("isMerchantMissing()", () => {
  it("null merchant at NO_MATCH confidence (0.10) → missing", () => {
    expect(isMerchantMissing(makeMerchant(null, 0.1))).toBe(true);
  });

  it("null merchant at confidence exactly at threshold (0.20) → NOT missing", () => {
    // Boundary: 0.20 >= 0.20 → not missing
    expect(isMerchantMissing(makeMerchant(null, MIN_CONFIDENCE.MERCHANT))).toBe(
      false,
    );
  });

  it("partial match merchant (0.70) → NOT missing", () => {
    expect(isMerchantMissing(makeMerchant(null, 0.7))).toBe(false);
  });

  it("exact match merchant (0.95) → NOT missing", () => {
    expect(isMerchantMissing(makeMerchant("Netflix", 0.95))).toBe(false);
  });

  it("known merchant with ambiguity penalty (0.80) → NOT missing", () => {
    expect(isMerchantMissing(makeMerchant("Uber", 0.8))).toBe(false);
  });
});

// // ─────────────────────────────────────────────────────────────────────────────
// // isCategoryMissing() — product decision: UNKNOWN is NOT missing
// // ─────────────────────────────────────────────────────────────────────────────

describe("isCategoryMissing()", () => {
  it("UNKNOWN category → NOT missing (product decision)", () => {
    expect(isCategoryMissing(makeCategory("Unknown", 0.2))).toBe(false);
  });

  it("known category → NOT missing", () => {
    expect(isCategoryMissing(makeCategory("Transportation", 0.9))).toBe(false);
  });

  it("keyword-inferred category → NOT missing", () => {
    expect(isCategoryMissing(makeCategory("Food & Drink", 0.6))).toBe(false);
  });
});

// // ─────────────────────────────────────────────────────────────────────────────
// // isDateMissing() — product decision: default date is NOT missing
// // ─────────────────────────────────────────────────────────────────────────────

describe("isDateMissing()", () => {
  it("default date source → NOT missing (product decision)", () => {
    expect(isDateMissing(DEFAULT_DATE)).toBe(false);
  });

  it("relative date source → NOT missing", () => {
    expect(isDateMissing(makeDate("relative", 0.8))).toBe(false);
  });

  it("explicit date source → NOT missing", () => {
    expect(isDateMissing(makeDate("explicit", 0.95))).toBe(false);
  });
});

// // ─────────────────────────────────────────────────────────────────────────────
// // Stable output ordering
// // ─────────────────────────────────────────────────────────────────────────────

describe("detectMissingFields() — output ordering", () => {
  it("returns missing fields in stable order: amount → merchant → category → date", () => {
    const missing = detectMissingFields({
      amountResult: makeAmount(null, 0.1),
      merchantResult: NO_MERCHANT,
      categoryResult: makeCategory("Unknown", 0.2),
      dateResult: DEFAULT_DATE,
    });
    // Both amount and merchant are missing
    expect(missing[0]).toBe("amount");
    expect(missing[1]).toBe("merchant");
  });

  it("returns empty array when all fields are present", () => {
    const missing = detectMissingFields({
      amountResult: GOOD_AMOUNT,
      merchantResult: GOOD_MERCHANT,
      categoryResult: GOOD_CATEGORY,
      dateResult: GOOD_DATE,
    });
    expect(missing).toHaveLength(0);
  });

  it("returns only amount when only amount is missing", () => {
    const missing = detectMissingFields({
      amountResult: makeAmount(null, 0.1),
      merchantResult: GOOD_MERCHANT,
      categoryResult: GOOD_CATEGORY,
      dateResult: GOOD_DATE,
    });
    expect(missing).toEqual(["amount"]);
  });
});

// // ─────────────────────────────────────────────────────────────────────────────
// // Threshold boundary tests
// // ─────────────────────────────────────────────────────────────────────────────

describe("detectMissingFields() — confidence boundary conditions", () => {
  it("amount at exactly MIN_CONFIDENCE.AMOUNT → NOT missing", () => {
    const missing = detectMissingFields({
      amountResult: makeAmount(45, MIN_CONFIDENCE.AMOUNT), // 0.30
      merchantResult: GOOD_MERCHANT,
      categoryResult: GOOD_CATEGORY,
      dateResult: GOOD_DATE,
    });
    expect(missing).not.toContain("amount");
  });

  it("amount one step below MIN_CONFIDENCE.AMOUNT → missing", () => {
    const missing = detectMissingFields({
      amountResult: makeAmount(45, MIN_CONFIDENCE.AMOUNT - 0.01),
      merchantResult: GOOD_MERCHANT,
      categoryResult: GOOD_CATEGORY,
      dateResult: GOOD_DATE,
    });
    expect(missing).toContain("amount");
  });

  it("merchant at exactly MIN_CONFIDENCE.MERCHANT → NOT missing", () => {
    const missing = detectMissingFields({
      amountResult: GOOD_AMOUNT,
      merchantResult: makeMerchant(null, MIN_CONFIDENCE.MERCHANT), // 0.20
      categoryResult: GOOD_CATEGORY,
      dateResult: GOOD_DATE,
    });
    expect(missing).not.toContain("merchant");
  });

  it("merchant one step below MIN_CONFIDENCE.MERCHANT → missing", () => {
    const missing = detectMissingFields({
      amountResult: GOOD_AMOUNT,
      merchantResult: makeMerchant(null, MIN_CONFIDENCE.MERCHANT - 0.01),
      categoryResult: GOOD_CATEGORY,
      dateResult: GOOD_DATE,
    });
    expect(missing).toContain("merchant");
  });
});
