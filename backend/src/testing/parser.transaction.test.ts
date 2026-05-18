import { describe, expect, it } from "vitest";

import { parseTransaction } from "../modules/parser/service/parse.service.js";
import { PARSER_VERSION } from "../modules/parser/index.js";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const FIXED_DATE = new Date(Date.UTC(2025, 4, 14));

function parse(input: string) {
  return parseTransaction(input, {
    transactionDate: FIXED_DATE,
  });
}

function isoDate(d: Date) {
  // Use getUTC* methods instead of local getters
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");

  return `${y}-${m}-${day}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Core integration scenarios
// ─────────────────────────────────────────────────────────────────────────────

describe("parseTransaction() — core scenarios", () => {
  it('"uber airport 45"', () => {
    const r = parse("uber airport 45");

    expect(r.amount).toBe(45);
    expect(r.currency).toBe("USD");
    expect(r.merchantName).toBe("Uber");
    expect(r.category).toBe("Transportation");

    expect(isoDate(r.transactionDate)).toBe("2025-05-14");

    expect(r.missingFields).toHaveLength(0);
    expect(r.followUpQuestion).toBeNull();

    expect(r.confidenceScore).toBeGreaterThan(0.65);

    expect(r.descriptionRaw).toBe("uber airport 45");
    expect(r.descriptionNormalized).toBe("uber airport 45");

    expect(r.parserVersion).toBe(PARSER_VERSION);
    expect(r.aiProcessed).toBe(false);
  });

  it('"netflix 15 usd"', () => {
    const r = parse("netflix 15 usd");

    expect(r.amount).toBe(15);
    expect(r.currency).toBe("USD");
    expect(r.merchantName).toBe("Netflix");
    expect(r.category).toBe("Subscriptions");

    expect(r.missingFields).toHaveLength(0);
    expect(r.followUpQuestion).toBeNull();

    expect(r.confidenceScore).toBeGreaterThan(0.75);
  });

  it('"coffee 5"', () => {
    const r = parse("coffee 5");

    expect(r.amount).toBe(5);

    expect(r.merchantName).toBeNull();

    expect(r.category).toBe("Food & Drink");

    expect(r.missingFields).toContain("merchant");
    expect(r.missingFields).not.toContain("amount");

    expect(r.followUpQuestion).toMatch(/merchant/i);
  });

  it('"amazon" — missing amount', () => {
    const r = parse("amazon");

    expect(r.amount).toBeNull();

    expect(r.merchantName).toBe("Amazon");

    expect(r.missingFields).toContain("amount");

    expect(r.followUpQuestion).toMatch(/amazon order/i);

    expect(r.confidenceScore).toBeLessThan(0.55);
  });

  it('"random unknown thing"', () => {
    const r = parse("random unknown thing");

    expect(r.amount).toBeNull();

    expect(r.merchantName).toBeNull();

    expect(r.category).toBe("Unknown");

    expect(r.missingFields).toContain("amount");
    expect(r.missingFields).toContain("merchant");

    expect(r.followUpQuestion).toMatch(/how much/i);

    expect(r.confidenceScore).toBeLessThan(0.35);
  });

  it('"flight 300"', () => {
    const r = parse("flight 300");

    expect(r.amount).toBe(300);

    expect(r.category).toBe("Travel");

    expect(r.missingFields).toContain("merchant");

    expect(r.followUpQuestion).toMatch(/merchant/i);
  });

  it('"movie tickets"', () => {
    const r = parse("movie tickets");

    expect(r.amount).toBeNull();

    expect(r.category).toBe("Entertainment");

    expect(r.missingFields).toContain("amount");

    expect(r.followUpQuestion).toMatch(/how much/i);
  });

  it('"restaurant"', () => {
    const r = parse("restaurant");

    expect(r.amount).toBeNull();

    expect(r.merchantName).toBeNull();

    expect(r.category).toBe("Food & Drink");

    expect(r.missingFields).toContain("amount");
    expect(r.missingFields).toContain("merchant");

    expect(r.followUpQuestion).toMatch(/, and /i);
  });

  it('"" — empty string', () => {
    const r = parse("");

    expect(r.amount).toBeNull();

    expect(r.merchantName).toBeNull();

    expect(r.category).toBe("Unknown");

    expect(r.descriptionRaw).toBe("");
    expect(r.descriptionNormalized).toBe("");

    expect(r.missingFields).toContain("amount");
    expect(r.missingFields).toContain("merchant");

    expect(r.followUpQuestion).toMatch(/how much/i);

    expect(r.confidenceScore).toBeGreaterThanOrEqual(0);
    expect(r.confidenceScore).toBeLessThanOrEqual(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ParseResult contract
// ─────────────────────────────────────────────────────────────────────────────

describe("parseTransaction() — ParseResult contract", () => {
  it("always returns all required fields", () => {
    const r = parse("uber 45");

    expect(r).toHaveProperty("amount");
    expect(r).toHaveProperty("currency");
    expect(r).toHaveProperty("merchantName");
    expect(r).toHaveProperty("category");
    expect(r).toHaveProperty("transactionDate");
    expect(r).toHaveProperty("descriptionRaw");
    expect(r).toHaveProperty("descriptionNormalized");
    expect(r).toHaveProperty("confidenceScore");
    expect(r).toHaveProperty("missingFields");
    expect(r).toHaveProperty("followUpQuestion");
    expect(r).toHaveProperty("parserVersion");
    expect(r).toHaveProperty("aiProcessed");
  });

  it("transactionDate is always a valid Date", () => {
    const r = parse("coffee 5");

    expect(r.transactionDate).toBeInstanceOf(Date);

    expect(isNaN(r.transactionDate.getTime())).toBe(false);
  });

  it("transactionDate uses injected transactionDate option", () => {
    const customDate = new Date(Date.UTC(2024, 0, 1));

    const r = parseTransaction("uber 45", {
      transactionDate: customDate,
    });

    expect(isoDate(r.transactionDate)).toBe("2024-01-01");
  });

  it("confidenceScore always stays between 0 and 1", () => {
    const inputs = ["uber 45", "netflix", "", "random", "coffee 5"];

    for (const input of inputs) {
      const { confidenceScore } = parse(input);

      expect(confidenceScore).toBeGreaterThanOrEqual(0);
      expect(confidenceScore).toBeLessThanOrEqual(1);
    }
  });

  it("missingFields is always an array", () => {
    expect(Array.isArray(parse("uber 45").missingFields)).toBe(true);

    expect(Array.isArray(parse("").missingFields)).toBe(true);
  });

  it("aiProcessed is always false", () => {
    expect(parse("netflix 15").aiProcessed).toBe(false);

    expect(parse("coffee 5").aiProcessed).toBe(false);

    expect(parse("").aiProcessed).toBe(false);
  });

  it("parserVersion is always current", () => {
    expect(parse("uber 45").parserVersion).toBe(PARSER_VERSION);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Normalization integration
// ─────────────────────────────────────────────────────────────────────────────

describe("parseTransaction() — normalization integration", () => {
  it("uppercased input normalizes correctly", () => {
    const r = parse("NETFLIX 15 USD");

    expect(r.merchantName).toBe("Netflix");

    expect(r.amount).toBe(15);

    expect(r.descriptionNormalized).toBe("netflix 15 usd");
  });

  it("hyphenated input separates correctly", () => {
    const r = parse("lunch-team 24 dollars");

    expect(r.amount).toBe(24);

    expect(r.descriptionNormalized).toBe("lunch team 24 usd");
  });

  it('"dollars" normalizes to usd', () => {
    const r = parse("groceries walmart 120 dollars");

    expect(r.amount).toBe(120);

    expect(r.currency).toBe("USD");

    expect(r.merchantName).toBe("Walmart");
  });

  it("punctuation stripped cleanly", () => {
    const r = parse("coffee 5!!!");

    expect(r.amount).toBe(5);

    expect(r.descriptionNormalized).toBe("coffee 5");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Merchant integration
// ─────────────────────────────────────────────────────────────────────────────

describe("parseTransaction() — merchant integration", () => {
  it('"mcd lunch 10"', () => {
    const r = parse("mcd lunch 10");

    expect(r.merchantName).toBe("McDonald's");

    expect(r.category).toBe("Food & Drink");
  });

  it('"spotify premium 9"', () => {
    const r = parse("spotify premium 9");

    expect(r.merchantName).toBe("Spotify");

    expect(r.category).toBe("Subscriptions");
  });

  it('"grab airport 30"', () => {
    const r = parse("grab airport 30");

    expect(r.merchantName).toBe("Grab");

    expect(r.category).toBe("Transportation");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Category integration
// ─────────────────────────────────────────────────────────────────────────────

describe("parseTransaction() — category integration", () => {
  it("merchant category overrides keyword category", () => {
    const r = parse("uber food 20");

    expect(r.category).toBe("Transportation");
  });

  it("keyword fallback works without merchant", () => {
    const r = parse("hospital visit 100");

    expect(r.merchantName).toBeNull();

    expect(r.category).toBe("Health");
  });

  it("unknown merchant + no keywords → Unknown", () => {
    const r = parse("xyzco 50");

    expect(r.category).toBe("Unknown");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Confidence integration
// ─────────────────────────────────────────────────────────────────────────────

describe("parseTransaction() — confidence integration", () => {
  it("complete parse scores higher than partial parse", () => {
    const full = parse("uber 45");

    const partial = parse("coffee 5");

    expect(full.confidenceScore).toBeGreaterThan(partial.confidenceScore);
  });

  it("missing amount reduces confidence", () => {
    const withAmount = parse("netflix 15");

    const withoutAmount = parse("netflix");

    expect(withAmount.confidenceScore).toBeGreaterThan(
      withoutAmount.confidenceScore + 0.2,
    );
  });

  it("missing merchant causes moderate penalty", () => {
    const withMerchant = parse("uber 45");

    const withoutMerchant = parse("taxi 45");

    const diff = withMerchant.confidenceScore - withoutMerchant.confidenceScore;

    expect(diff).toBeGreaterThan(0);

    expect(diff).toBeLessThan(0.45);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Follow-up integration
// ─────────────────────────────────────────────────────────────────────────────

describe("parseTransaction() — follow-up integration", () => {
  it("merchant-aware question when amount missing", () => {
    const r = parse("netflix");

    expect(r.followUpQuestion).toMatch(/netflix subscription/i);
  });

  it("uber-specific follow-up when amount missing", () => {
    const r = parse("uber");

    expect(r.followUpQuestion).toMatch(/uber ride/i);
  });

  it("combined question when amount + merchant missing", () => {
    const r = parse("restaurant");

    expect(r.followUpQuestion).toMatch(/how much/i);

    expect(r.followUpQuestion).toMatch(/merchant/i);

    expect(r.followUpQuestion).toMatch(/, and /i);
  });

  it("null follow-up when parse complete", () => {
    const r = parse("netflix 15 usd");

    expect(r.followUpQuestion).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Determinism
// ─────────────────────────────────────────────────────────────────────────────

describe("parseTransaction() — determinism", () => {
  it("same input produces same output", () => {
    const input = "uber airport 45";

    const r1 = parseTransaction(input, {
      transactionDate: FIXED_DATE,
    });

    const r2 = parseTransaction(input, {
      transactionDate: FIXED_DATE,
    });

    expect(r1.amount).toBe(r2.amount);

    expect(r1.merchantName).toBe(r2.merchantName);

    expect(r1.category).toBe(r2.category);

    expect(isoDate(r1.transactionDate)).toBe(isoDate(r2.transactionDate));

    expect(r1.confidenceScore).toBe(r2.confidenceScore);

    expect(r1.followUpQuestion).toBe(r2.followUpQuestion);
  });
});
