import { describe, expect, it } from "vitest";

import { extractAmount } from "../modules/parser/index.js";

describe("extractAmount", () => {
  // ─────────────────────────────────────────────────────────────
  // Basic extraction
  // ─────────────────────────────────────────────────────────────

  it("extracts bare integer amount", () => {
    const result = extractAmount("coffee 5 ");

    expect(result.value).toBe(5);
    expect(result.currency).toBe("USD");
    expect(result.confidence).toBeLessThan(0.41);
  });

  it("extracts decimal amount", () => {
    const result = extractAmount("coffee 15.50");

    expect(result.value).toBe(15.5);
    expect(result.currency).toBe("USD");
  });

  //   // ─────────────────────────────────────────────────────────────
  //   // Currency patterns
  //   // ─────────────────────────────────────────────────────────────

  it("extracts currency prefix pattern", () => {
    const result = extractAmount("$45 uber");

    expect(result.value).toBe(45);
    expect(result.currency).toBe("USD");
    expect(result.rawMatch).toContain("$45");
  });

  it("extracts currency suffix pattern", () => {
    const result = extractAmount("45$ uber");

    expect(result.value).toBe(45);
    expect(result.currency).toBe("USD");
  });

  it("extracts number then currency pattern", () => {
    const result = extractAmount("uber 45 usd");

    expect(result.value).toBe(45);
    expect(result.currency).toBe("USD");
  });

  it("extracts currency then number pattern", () => {
    const result = extractAmount("usd 45 uber");

    expect(result.value).toBe(45);
    expect(result.currency).toBe("USD");
  });

  it("extracts non-usd currency", () => {
    const result = extractAmount("grab 500000 vnd");

    expect(result.value).toBe(500000);
    expect(result.currency).toBe("VND");
  });

  //   // ─────────────────────────────────────────────────────────────
  //   // Missing amount
  //   // ─────────────────────────────────────────────────────────────

  it("returns null when no amount exists", () => {
    const result = extractAmount("netflix");

    expect(result.value).toBeNull();
    expect(result.rawMatch).toBeNull();
    expect(result.confidence).toBeLessThan(0.11);
  });

  //   // ─────────────────────────────────────────────────────────────
  //   // Ambiguous inputs
  //   // ─────────────────────────────────────────────────────────────

  it("prefers paired candidate over bare number", () => {
    const result = extractAmount("uber 45 usd airport 10");

    expect(result.value).toBe(45);
    expect(result.currency).toBe("USD");
  });

  it("handles multiple bare numbers deterministically", () => {
    const result = extractAmount("spent 20 30 yesterday");

    // document your rule:
    // either last number wins OR highest wins
    expect(result.value).toBe(30);
  });

  it("reduces confidence for ambiguous inputs", () => {
    const result = extractAmount("uber 45 10 15");

    expect(result.confidence).toBeLessThan(0.6);
  });

  //   // ─────────────────────────────────────────────────────────────
  //   // Deduplication behavior
  //   // ─────────────────────────────────────────────────────────────

  it("deduplicates equivalent amount candidates", () => {
    const result = extractAmount("$45 45 usd");

    expect(result.value).toBe(45);

    // confidence should not be heavily penalized
    // because both represent same numeric amount
    expect(result.confidence).toBeGreaterThan(0.7);
  });

  //   // ─────────────────────────────────────────────────────────────
  //   // Confidence comparisons
  //   // ─────────────────────────────────────────────────────────────

  it("gives higher confidence to paired matches than bare matches", () => {
    const paired = extractAmount("uber 45 usd");
    const bare = extractAmount("uber 45");

    expect(paired.confidence).toBeGreaterThan(bare.confidence);
  });

  //   // ─────────────────────────────────────────────────────────────
  //   // Real-world noisy inputs
  //   // ─────────────────────────────────────────────────────────────

  it("handles conversational phrasing", () => {
    const result = extractAmount("coffee maybe 5 ish");

    expect(result.value).toBe(5);
    expect(result.currency).toBe("USD");
  });

  it("handles transaction-like sentences", () => {
    const result = extractAmount(
      "paid uber ride to airport for 32 usd yesterday",
    );

    expect(result.value).toBe(32);
    expect(result.currency).toBe("USD");
  });

  //   // ─────────────────────────────────────────────────────────────
  //   // Edge cases
  //   // ─────────────────────────────────────────────────────────────

  it("does not crash on empty input", () => {
    const result = extractAmount("");

    expect(result.value).toBeNull();
  });

  it("does not crash on whitespace input", () => {
    const result = extractAmount("   ");

    expect(result.value).toBeNull();
  });

  it("handles zero amount", () => {
    const result = extractAmount("refund 0 usd");

    expect(result.value).toBe(0);
  });
});
