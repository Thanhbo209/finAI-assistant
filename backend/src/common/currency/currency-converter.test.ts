import { describe, expect, it } from "vitest";

import { convertAmount } from "./currency-converter.js";

describe("currency converter", () => {
  it("displays 25,000 VND as about 1 USD", () => {
    expect(convertAmount(25_000, "VND", "USD")).toBeCloseTo(0.95, 2);
  });

  it("displays USD transactions as VND", () => {
    expect(convertAmount(1, "USD", "VND")).toBe(26_316);
  });

  it("converts across all supported display currencies", () => {
    expect(convertAmount(10, "GBP", "EUR")).toBeGreaterThan(11);
    expect(convertAmount(10, "EUR", "JPY")).toBeGreaterThan(1_800);
  });
});
