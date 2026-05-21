import type { SmartRule, TransactionCategory } from "../../generated/prisma/index.js";
import { normalizeMerchantName } from "../merchants/merchant-normalizer.js";

export interface RuleEvaluationContext {
  merchantId: string | null;
  merchantName: string | null;
  normalizedInput?: string;
}

export interface RuleEvaluationResult {
  category: TransactionCategory;
  ruleId: string;
  merchantId: string | null;
  merchantName: string | null;
  confidence: number;
  priority: number;
}

function containsNormalizedPhrase(text: string, phrase: string): boolean {
  return (
    text === phrase ||
    text.startsWith(`${phrase} `) ||
    text.endsWith(` ${phrase}`) ||
    text.includes(` ${phrase} `)
  );
}

export function evaluateSmartRules(
  rules: SmartRule[],
  context: RuleEvaluationContext,
): RuleEvaluationResult | null {
  const normalizedMerchant = context.merchantName
    ? normalizeMerchantName(context.merchantName)
    : null;
  const normalizedInput = context.normalizedInput
    ? normalizeMerchantName(context.normalizedInput).normalized
    : null;

  for (const rule of rules) {
    if (rule.merchantId && context.merchantId === rule.merchantId) {
      return {
        category: rule.category,
        ruleId: rule.id,
        merchantId: rule.merchantId,
        merchantName: rule.merchantNamePattern,
        confidence: rule.confidence,
        priority: rule.priority,
      };
    }

    if (
      normalizedMerchant &&
      rule.normalizedMerchantName &&
      normalizedMerchant.normalized === rule.normalizedMerchantName
    ) {
      return {
        category: rule.category,
        ruleId: rule.id,
        merchantId: rule.merchantId,
        merchantName: rule.merchantNamePattern,
        confidence: rule.confidence,
        priority: rule.priority,
      };
    }

    if (
      normalizedInput &&
      rule.normalizedMerchantName &&
      containsNormalizedPhrase(normalizedInput, rule.normalizedMerchantName)
    ) {
      return {
        category: rule.category,
        ruleId: rule.id,
        merchantId: rule.merchantId,
        merchantName: rule.merchantNamePattern,
        confidence: rule.confidence,
        priority: rule.priority,
      };
    }
  }

  return null;
}
