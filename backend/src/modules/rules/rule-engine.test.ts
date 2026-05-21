import { describe, expect, it } from "vitest";
import { TransactionCategory, type SmartRule } from "../../generated/prisma/index.js";
import { evaluateSmartRules } from "./rule-engine.js";

function smartRule(overrides: Partial<SmartRule> = {}): SmartRule {
  return {
    id: "rule-1",
    userId: "user-1",
    merchantId: "merchant-1",
    merchantNamePattern: "Phuc Long",
    normalizedMerchantName: "phuc long",
    category: TransactionCategory.FOOD_DRINK,
    priority: 50,
    isActive: true,
    confidence: 1,
    metadata: {},
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

describe("evaluateSmartRules", () => {
  it("matches a merchant phrase in normalized parser input", () => {
    const result = evaluateSmartRules([smartRule()], {
      merchantId: null,
      merchantName: null,
      normalizedInput: "phuc long 50",
    });

    expect(result).toEqual({
      category: TransactionCategory.FOOD_DRINK,
      ruleId: "rule-1",
      merchantId: "merchant-1",
      merchantName: "Phuc Long",
      confidence: 1,
      priority: 50,
    });
  });

  it("does not match partial words", () => {
    const result = evaluateSmartRules([smartRule()], {
      merchantId: null,
      merchantName: null,
      normalizedInput: "phuc longitude 50",
    });

    expect(result).toBeNull();
  });
});
