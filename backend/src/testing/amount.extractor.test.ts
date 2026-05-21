import { describe, expect, it } from "vitest";

import { extractAmount } from "../modules/parser/index.js";

/**
 * Helper to call extractAmount with just a normalizedInput string.
 * Wraps the new options-object signature for concise test authoring.
 */
const extract = (normalizedInput: string) =>
  extractAmount({ normalizedInput });

describe("extractAmount", () => {
  // ─────────────────────────────────────────────────────────────
  // Basic extraction
  // ─────────────────────────────────────────────────────────────

  it("extracts bare integer amount", () => {
    const result = extract("coffee 5 ");

    expect(result.value).toBe(5);
    expect(result.currency).toBe("USD"); // fallback — no context
    expect(result.confidence).toBeLessThan(0.41);
  });

  it("extracts decimal amount", () => {
    const result = extract("coffee 15.50");

    expect(result.value).toBe(15.5);
    expect(result.currency).toBe("USD");
  });

  //   // ─────────────────────────────────────────────────────────────
  //   // Currency patterns
  //   // ─────────────────────────────────────────────────────────────

  it("extracts currency prefix pattern", () => {
    const result = extract("$45 uber");

    expect(result.value).toBe(45);
    expect(result.currency).toBe("USD");
    expect(result.rawMatch).toContain("$45");
  });

  it("extracts currency suffix pattern", () => {
    const result = extract("45$ uber");

    expect(result.value).toBe(45);
    expect(result.currency).toBe("USD");
  });

  it("extracts number then currency pattern", () => {
    const result = extract("uber 45 usd");

    expect(result.value).toBe(45);
    expect(result.currency).toBe("USD");
  });

  it("extracts currency then number pattern", () => {
    const result = extract("usd 45 uber");

    expect(result.value).toBe(45);
    expect(result.currency).toBe("USD");
  });

  it("extracts non-usd currency", () => {
    const result = extract("grab 500000 vnd");

    expect(result.value).toBe(500000);
    expect(result.currency).toBe("VND");
  });

  //   // ─────────────────────────────────────────────────────────────
  //   // Missing amount
  //   // ─────────────────────────────────────────────────────────────

  it("returns null when no amount exists", () => {
    const result = extract("netflix");

    expect(result.value).toBeNull();
    expect(result.rawMatch).toBeNull();
    expect(result.confidence).toBeLessThan(0.11);
  });

  //   // ─────────────────────────────────────────────────────────────
  //   // Ambiguous inputs
  //   // ─────────────────────────────────────────────────────────────

  it("prefers paired candidate over bare number", () => {
    const result = extract("uber 45 usd airport 10");

    expect(result.value).toBe(45);
    expect(result.currency).toBe("USD");
  });

  it("handles multiple bare numbers deterministically", () => {
    const result = extract("spent 20 30 yesterday");

    // document your rule:
    // either last number wins OR highest wins
    expect(result.value).toBe(30);
  });

  it("reduces confidence for ambiguous inputs", () => {
    const result = extract("uber 45 10 15");

    expect(result.confidence).toBeLessThan(0.6);
  });

  //   // ─────────────────────────────────────────────────────────────
  //   // Deduplication behavior
  //   // ─────────────────────────────────────────────────────────────

  it("deduplicates equivalent amount candidates", () => {
    const result = extract("$45 45 usd");

    expect(result.value).toBe(45);

    // confidence should not be heavily penalized
    // because both represent same numeric amount
    expect(result.confidence).toBeGreaterThan(0.7);
  });

  //   // ─────────────────────────────────────────────────────────────
  //   // Confidence comparisons
  //   // ─────────────────────────────────────────────────────────────

  it("gives higher confidence to paired matches than bare matches", () => {
    const paired = extract("uber 45 usd");
    const bare = extract("uber 45");

    expect(paired.confidence).toBeGreaterThan(bare.confidence);
  });

  //   // ─────────────────────────────────────────────────────────────
  //   // Real-world noisy inputs
  //   // ─────────────────────────────────────────────────────────────

  it("handles conversational phrasing", () => {
    const result = extract("coffee maybe 5 ish");

    expect(result.value).toBe(5);
    expect(result.currency).toBe("USD");
  });

  it("handles transaction-like sentences", () => {
    const result = extract(
      "paid uber ride to airport for 32 usd yesterday",
    );

    expect(result.value).toBe(32);
    expect(result.currency).toBe("USD");
  });

  //   // ─────────────────────────────────────────────────────────────
  //   // Edge cases
  //   // ─────────────────────────────────────────────────────────────

  it("does not crash on empty input", () => {
    const result = extract("");

    expect(result.value).toBeNull();
  });

  it("does not crash on whitespace input", () => {
    const result = extract("   ");

    expect(result.value).toBeNull();
  });

  it("handles zero amount", () => {
    const result = extract("refund 0 usd");

    expect(result.value).toBe(0);
  });

  // ─────────────────────────────────────────────────────────────
  // CurrencyContext resolution
  // ─────────────────────────────────────────────────────────────

  it("bare number inherits userPreferredCurrency when no explicit currency", () => {
    const result = extractAmount({
      normalizedInput: "coffee 50",
      currencyContext: { userPreferredCurrency: "VND" },
    });

    expect(result.value).toBe(50);
    expect(result.currency).toBe("VND");
  });

  it("bare number inherits activeCurrency over userPreferredCurrency", () => {
    const result = extractAmount({
      normalizedInput: "lunch 120",
      currencyContext: { activeCurrency: "VND", userPreferredCurrency: "EUR" },
    });

    expect(result.value).toBe(120);
    expect(result.currency).toBe("VND"); // activeCurrency wins
  });

  it("explicit currency always wins over context", () => {
    const result = extractAmount({
      normalizedInput: "15 usd",
      currencyContext: { activeCurrency: "VND", userPreferredCurrency: "VND" },
    });

    expect(result.value).toBe(15);
    expect(result.currency).toBe("USD"); // explicit in input wins
  });

  it("falls back to USD when no context and no explicit currency", () => {
    const result = extractAmount({ normalizedInput: "coffee 50" });

    expect(result.currency).toBe("USD");
  });
});
