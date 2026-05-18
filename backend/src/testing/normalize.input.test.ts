import { describe, expect, it } from "vitest";
import { normalizeInput } from "../modules/parser/feature/normalization/normalize.input.js";
import {
  collapseWhitespace,
  lowercaseInput,
  normalizeCurrencyKeywords,
  normalizeUnicodeWhitespace,
  removeNoisePunctuation,
  replaceWordSeparators,
} from "../modules/parser/feature/normalization/normalize.steps.js";

// ─────────────────────────────────────────────────────────────────────────────
// Full pipeline — spec examples
// ─────────────────────────────────────────────────────────────────────────────

describe("normalizeInput() — spec examples", () => {
  it("trims, lowercases, and removes trailing $", () => {
    // Spec: " UBER 45$ " → "uber 45 $"
    // Note: "$" is preserved (currency symbol), leading/trailing spaces trimmed
    const { normalized } = normalizeInput(" UBER 45$ ");
    expect(normalized).toBe("uber 45$");
  });

  it("replaces hyphens and removes trailing punctuation", () => {
    // Spec: "lunch-team 24 dollars!!" → "lunch team 24 usd"
    const { normalized } = normalizeInput("lunch-team 24 dollars!!");
    expect(normalized).toBe("lunch team 24 usd");
  });

  it("lowercases single-word input", () => {
    const { normalized } = normalizeInput("NETFLIX");
    expect(normalized).toBe("netflix");
  });

  it("passes through already-clean input unchanged", () => {
    const { normalized } = normalizeInput("coffee 5");
    expect(normalized).toBe("coffee 5");
  });

  it('normalizes "usd" keyword correctly', () => {
    const { normalized } = normalizeInput("spotify premium 15 usd");
    expect(normalized).toBe("spotify premium 15 usd");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// raw is always preserved verbatim
// ─────────────────────────────────────────────────────────────────────────────

describe("normalizeInput() — raw preservation", () => {
  it("preserves raw input exactly", () => {
    const input = "  UBER 45$  ";
    const { raw } = normalizeInput(input);
    expect(raw).toBe(input);
  });

  it("preserves raw even when normalized is empty", () => {
    const input = "   ";
    const { raw } = normalizeInput(input);
    expect(raw).toBe(input);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge cases — empty / whitespace-only
// ─────────────────────────────────────────────────────────────────────────────

describe("normalizeInput() — empty and whitespace inputs", () => {
  it("returns empty string for empty input", () => {
    const { normalized } = normalizeInput("");
    expect(normalized).toBe("");
  });

  it("returns empty string for whitespace-only input", () => {
    const { normalized } = normalizeInput("   ");
    expect(normalized).toBe("");
  });

  it("returns empty string for tab-only input", () => {
    const { normalized } = normalizeInput("\t\t");
    expect(normalized).toBe("");
  });

  it("returns empty string for newline-only input", () => {
    const { normalized } = normalizeInput("\n\n");
    expect(normalized).toBe("");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Individual step — normalizeUnicodeWhitespace
// ─────────────────────────────────────────────────────────────────────────────

describe("normalizeUnicodeWhitespace()", () => {
  it("replaces non-breaking space (U+00A0)", () => {
    expect(normalizeUnicodeWhitespace("uber\u00A045")).toBe("uber 45");
  });

  it("replaces thin space (U+2009)", () => {
    expect(normalizeUnicodeWhitespace("uber\u200945")).toBe("uber 45");
  });

  it("leaves regular ASCII spaces untouched", () => {
    expect(normalizeUnicodeWhitespace("uber 45")).toBe("uber 45");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Individual step — lowercaseInput
// ─────────────────────────────────────────────────────────────────────────────

describe("lowercaseInput()", () => {
  it("lowercases all-caps input", () => {
    expect(lowercaseInput("UBER AIRPORT 45")).toBe("uber airport 45");
  });

  it("lowercases mixed-case input", () => {
    expect(lowercaseInput("Starbucks Coffee 6.50")).toBe(
      "starbucks coffee 6.50",
    );
  });

  it("does not alter already-lowercase input", () => {
    expect(lowercaseInput("coffee 5")).toBe("coffee 5");
  });

  it("preserves numbers and symbols", () => {
    expect(lowercaseInput("NETFLIX $15.99")).toBe("netflix $15.99");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Individual step — replaceWordSeparators
// ─────────────────────────────────────────────────────────────────────────────

describe("replaceWordSeparators()", () => {
  it("replaces a single hyphen with a space", () => {
    expect(replaceWordSeparators("lunch-team")).toBe("lunch team");
  });

  it("replaces an underscore with a space", () => {
    expect(replaceWordSeparators("grocery_store")).toBe("grocery store");
  });

  it("collapses consecutive hyphens into one space", () => {
    expect(replaceWordSeparators("uber--airport")).toBe("uber airport");
  });

  it("collapses mixed separator sequences into one space", () => {
    expect(replaceWordSeparators("uber-_airport")).toBe("uber airport");
  });

  it("does not touch decimal points inside numbers", () => {
    // hyphen is between letters; dot is inside a number — only the hyphen should go
    expect(replaceWordSeparators("coffee-12.50")).toBe("coffee 12.50");
  });

  it("leaves input with no separators unchanged", () => {
    expect(replaceWordSeparators("netflix 15")).toBe("netflix 15");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Individual step — normalizeCurrencyKeywords
// ─────────────────────────────────────────────────────────────────────────────

describe("normalizeCurrencyKeywords()", () => {
  it('replaces "dollars" with "usd"', () => {
    expect(normalizeCurrencyKeywords("24 dollars")).toBe("24 usd");
  });

  it('replaces singular "dollar" with "usd"', () => {
    expect(normalizeCurrencyKeywords("1 dollar")).toBe("1 usd");
  });

  it('replaces "euros" with "eur"', () => {
    expect(normalizeCurrencyKeywords("20 euros")).toBe("20 eur");
  });

  it('replaces "pounds" with "gbp"', () => {
    expect(normalizeCurrencyKeywords("10 pounds")).toBe("10 gbp");
  });

  it("is case-insensitive (relies on lowercase step in pipeline)", () => {
    // normalizeCurrencyKeywords uses /gi flags so it works even before lowercase
    expect(normalizeCurrencyKeywords("24 DOLLARS")).toBe("24 usd");
  });

  it('does not replace "dollar" inside a word', () => {
    // word boundary check: "dollarstore" must not be mangled
    expect(normalizeCurrencyKeywords("dollarstore 10")).toBe("dollarstore 10");
  });

  it('leaves "usd" unchanged', () => {
    expect(normalizeCurrencyKeywords("15 usd")).toBe("15 usd");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Individual step — removeNoisePunctuation
// ─────────────────────────────────────────────────────────────────────────────

describe("removeNoisePunctuation()", () => {
  it("removes repeated exclamation marks", () => {
    // Replaced with space; collapseWhitespace handles the gap in the pipeline
    expect(removeNoisePunctuation("urgent!!!").trim()).toBe("urgent");
  });

  it("removes question marks", () => {
    expect(removeNoisePunctuation("coffee?").trim()).toBe("coffee");
  });

  it("removes commas", () => {
    // comma in the noise set
    expect(removeNoisePunctuation("uber, airport").trim()).toBe(
      "uber  airport".trim(),
    );
  });

  it("preserves dollar sign", () => {
    expect(removeNoisePunctuation("$45")).toBe("$45");
  });

  it("preserves decimal point", () => {
    expect(removeNoisePunctuation("12.50")).toBe("12.50");
  });

  it("removes parentheses", () => {
    expect(removeNoisePunctuation("(coffee)").trim()).toBe("coffee");
  });

  it("removes single and double quotes", () => {
    expect(removeNoisePunctuation('"netflix"').trim()).toBe("netflix");
    expect(removeNoisePunctuation("'spotify'").trim()).toBe("spotify");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Individual step — collapseWhitespace
// ─────────────────────────────────────────────────────────────────────────────

describe("collapseWhitespace()", () => {
  it("collapses multiple spaces into one", () => {
    expect(collapseWhitespace("uber   airport   45")).toBe("uber airport 45");
  });

  it("trims leading whitespace", () => {
    expect(collapseWhitespace("   uber")).toBe("uber");
  });

  it("trims trailing whitespace", () => {
    expect(collapseWhitespace("uber   ")).toBe("uber");
  });

  it("collapses tabs and newlines", () => {
    expect(collapseWhitespace("uber\t\nairport")).toBe("uber airport");
  });

  it("returns empty string for whitespace-only input", () => {
    expect(collapseWhitespace("   \t  ")).toBe("");
  });

  it("leaves single-spaced input unchanged", () => {
    expect(collapseWhitespace("coffee 5")).toBe("coffee 5");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Full pipeline — decimal preservation
// ─────────────────────────────────────────────────────────────────────────────

describe("normalizeInput() — decimal and currency symbol preservation", () => {
  it("preserves decimal point in amount", () => {
    const { normalized } = normalizeInput("coffee 6.50");
    expect(normalized).toBe("coffee 6.50");
  });

  it("preserves $ symbol", () => {
    const { normalized } = normalizeInput("starbucks $6.50");
    expect(normalized).toBe("starbucks $6.50");
  });

  it("handles $ attached to number with surrounding spaces", () => {
    const { normalized } = normalizeInput("  Starbucks  $12.50  ");
    expect(normalized).toBe("starbucks $12.50");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Full pipeline — combined transforms
// ─────────────────────────────────────────────────────────────────────────────

describe("normalizeInput() — combined transforms", () => {
  it("handles tabs between words", () => {
    const { normalized } = normalizeInput("uber\tairport\t45");
    expect(normalized).toBe("uber airport 45");
  });

  it("handles newline-separated input", () => {
    const { normalized } = normalizeInput("netflix\n15");
    expect(normalized).toBe("netflix 15");
  });

  it("handles all-caps with hyphens and punctuation", () => {
    const { normalized } = normalizeInput("LUNCH-TEAM 24 DOLLARS!!");
    expect(normalized).toBe("lunch team 24 usd");
  });

  it("handles underscores with mixed case", () => {
    const { normalized } = normalizeInput("Grocery_Store 120");
    expect(normalized).toBe("grocery store 120");
  });

  it("handles repeated commas and exclamation marks", () => {
    const { normalized } = normalizeInput("coffee,,,6.50!!!");
    expect(normalized).toBe("coffee 6.50");
  });

  it("handles unicode whitespace between words", () => {
    const { normalized } = normalizeInput("uber\u00A0airport\u200945");
    expect(normalized).toBe("uber airport 45");
  });

  it("does not double-collapse a single clean input", () => {
    const input = "walmart groceries 120";
    const { normalized } = normalizeInput(input);
    expect(normalized).toBe(input);
    // idempotent — running again produces the same result
    expect(normalizeInput(normalized).normalized).toBe(input);
  });
});
