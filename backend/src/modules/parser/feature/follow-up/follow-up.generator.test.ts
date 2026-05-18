import { describe, expect, it } from "vitest";
import { generateFollowUp } from "./follow-up.generator.js";

// ─────────────────────────────────────────────────────────────────────────────
// Spec-required single-field cases
// ─────────────────────────────────────────────────────────────────────────────

describe("generateFollowUp() — single missing field", () => {
  it('["amount"] → asks how much', () => {
    const q = generateFollowUp({ missingFields: ["amount"] });
    expect(q).toBe("How much did you spend?");
  });

  it('["merchant"] → asks which merchant', () => {
    const q = generateFollowUp({ missingFields: ["merchant"] });
    expect(q).toBe("Which merchant was this transaction for?");
  });

  it('["date"] → asks when', () => {
    const q = generateFollowUp({ missingFields: ["date"] });
    expect(q).toBe("When did this transaction happen?");
  });

  it('["category"] → null (suppressed by default)', () => {
    const q = generateFollowUp({ missingFields: ["category"] });
    expect(q).toBeNull();
  });

  it("[] → null (nothing missing)", () => {
    const q = generateFollowUp({ missingFields: [] });
    expect(q).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Spec-required combined cases
// ─────────────────────────────────────────────────────────────────────────────

describe("generateFollowUp() — combined missing fields", () => {
  it('["amount", "date"] → combines both naturally', () => {
    const q = generateFollowUp({ missingFields: ["amount", "date"] });
    expect(q).not.toBeNull();
    // Should start with the amount question (higher priority)
    expect(q).toMatch(/how much/i);
    // Should include the date question
    expect(q).toMatch(/when/i);
    // Should be one sentence joined with ", and"
    expect(q).toMatch(/, and /i);
  });

  it('["amount", "merchant"] → combines both naturally', () => {
    const q = generateFollowUp({ missingFields: ["amount", "merchant"] });
    expect(q).toMatch(/how much/i);
    expect(q).toMatch(/merchant/i);
    expect(q).toMatch(/, and /i);
  });

  it('["merchant", "amount"] → amount still asked first (priority ordering)', () => {
    // Order of input array must not affect priority
    const q = generateFollowUp({ missingFields: ["merchant", "amount"] });
    expect(q).toMatch(/^How much/);
  });

  it('["date", "merchant"] → merchant asked first (higher priority)', () => {
    const q = generateFollowUp({ missingFields: ["date", "merchant"] });
    expect(q).toMatch(/^Which merchant/i);
    expect(q).toMatch(/when/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// More than two missing fields — only top 2 asked
// ─────────────────────────────────────────────────────────────────────────────

describe("generateFollowUp() — more than 2 missing fields", () => {
  it('["amount", "merchant", "date"] → asks only about amount + merchant', () => {
    const q = generateFollowUp({
      missingFields: ["amount", "merchant", "date"],
    });
    expect(q).toMatch(/how much/i);
    expect(q).toMatch(/merchant/i);
    // Date should NOT appear — it's the 3rd priority field
    expect(q).not.toMatch(/when/i);
  });

  it('["amount", "merchant", "date", "category"] → asks only about amount + merchant', () => {
    const q = generateFollowUp({
      missingFields: ["amount", "merchant", "date", "category"],
    });
    expect(q).toMatch(/how much/i);
    expect(q).toMatch(/merchant/i);
    expect(q).not.toMatch(/when/i);
    expect(q).not.toMatch(/category/i);
  });

  it('["category", "date", "merchant"] → asks merchant + date (category suppressed)', () => {
    const q = generateFollowUp({
      missingFields: ["category", "date", "merchant"],
    });
    // category is suppressed → top 2 become merchant + date
    expect(q).toMatch(/merchant/i);
    expect(q).toMatch(/when/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Context-aware phrasing
// ─────────────────────────────────────────────────────────────────────────────

describe("generateFollowUp() — context-aware amount questions", () => {
  it('Netflix → "How much was the Netflix subscription?"', () => {
    const q = generateFollowUp({
      missingFields: ["amount"],
      context: { merchantName: "Netflix" },
    });
    expect(q).toBe("How much was the Netflix subscription?");
  });

  it('Uber → "How much was the Uber ride?"', () => {
    const q = generateFollowUp({
      missingFields: ["amount"],
      context: { merchantName: "Uber" },
    });
    expect(q).toBe("How much was the Uber ride?");
  });

  it('Starbucks → "How much was the Starbucks order?"', () => {
    const q = generateFollowUp({
      missingFields: ["amount"],
      context: { merchantName: "Starbucks" },
    });
    expect(q).toBe("How much was the Starbucks order?");
  });

  it('Amazon → "How much was the Amazon order?"', () => {
    const q = generateFollowUp({
      missingFields: ["amount"],
      context: { merchantName: "Amazon" },
    });
    expect(q).toBe("How much was the Amazon order?");
  });

  it('unknown merchant → falls back to "<name> charge"', () => {
    const q = generateFollowUp({
      missingFields: ["amount"],
      context: { merchantName: "PhoBoRestaurant" },
    });
    expect(q).toBe("How much was the PhoBoRestaurant charge?");
  });

  it("null merchant → generic question", () => {
    const q = generateFollowUp({
      missingFields: ["amount"],
      context: { merchantName: null },
    });
    expect(q).toBe("How much did you spend?");
  });

  it("no context at all → generic question", () => {
    const q = generateFollowUp({ missingFields: ["amount"] });
    expect(q).toBe("How much did you spend?");
  });

  it("context-aware amount + date combined", () => {
    const q = generateFollowUp({
      missingFields: ["amount", "date"],
      context: { merchantName: "Spotify" },
    });
    // Amount question is context-aware; date question is generic
    expect(q).toMatch(/Spotify subscription/i);
    expect(q).toMatch(/when/i);
    expect(q).toMatch(/, and /i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Category suppression
// ─────────────────────────────────────────────────────────────────────────────

describe("generateFollowUp() — category suppression", () => {
  it("only category missing → null", () => {
    expect(generateFollowUp({ missingFields: ["category"] })).toBeNull();
  });

  it("category + amount missing → only asks amount", () => {
    const q = generateFollowUp({ missingFields: ["category", "amount"] });
    // category is suppressed → only amount remains
    expect(q).toBe("How much did you spend?");
  });

  it("category + date missing → only asks date", () => {
    const q = generateFollowUp({ missingFields: ["category", "date"] });
    expect(q).toBe("When did this transaction happen?");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Null return cases
// ─────────────────────────────────────────────────────────────────────────────

describe("generateFollowUp() — null return cases", () => {
  it("empty missing fields → null", () => {
    expect(generateFollowUp({ missingFields: [] })).toBeNull();
  });

  it("only suppressed fields → null", () => {
    expect(generateFollowUp({ missingFields: ["category"] })).toBeNull();
  });

  it("returns non-null for any actionable missing field", () => {
    expect(generateFollowUp({ missingFields: ["amount"] })).not.toBeNull();
    expect(generateFollowUp({ missingFields: ["merchant"] })).not.toBeNull();
    expect(generateFollowUp({ missingFields: ["date"] })).not.toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Output format sanity
// ─────────────────────────────────────────────────────────────────────────────

describe("generateFollowUp() — output format", () => {
  it('single-field question ends with "?"', () => {
    const q = generateFollowUp({ missingFields: ["amount"] });
    expect(q).toMatch(/\?$/);
  });

  it('combined question ends with "?"', () => {
    const q = generateFollowUp({ missingFields: ["amount", "date"] });
    expect(q).toMatch(/\?$/);
  });

  it('single-field question does not contain ", and"', () => {
    const q = generateFollowUp({ missingFields: ["amount"] });
    expect(q).not.toContain(", and");
  });

  it('combined question contains exactly one ", and"', () => {
    const q = generateFollowUp({ missingFields: ["amount", "date"] }) ?? "";
    const occurrences = (q.match(/, and /g) ?? []).length;
    expect(occurrences).toBe(1);
  });
});
