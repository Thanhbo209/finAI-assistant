import { PARSER_VERSION } from "../constants/parser.constants.js";
import { extractAmount } from "../feature/extractors/amount/extract-amount.js";
import { resolveCategory } from "../feature/extractors/category/category.resolver.js";
import { composeConfidence } from "../feature/extractors/confidence/confidence.composer.js";
import { extractMerchant } from "../feature/extractors/merchant/extract-merchant.js";
import { detectMissingFields } from "../feature/extractors/missing-fields/missing-fields.detector.js";
import { generateFollowUp } from "../feature/follow-up/follow-up.generator.js";
import { normalizeInput } from "../feature/normalization/normalize.input.js";
import type { CurrencyContext } from "../feature/extractors/amount/amount.constants.js";
import type { ParseResult } from "../types/parse-result.types.js";

export interface ParseTransactionOptions {
  /** Inject a fixed reference date for deterministic date testing */
  transactionDate?: Date;
  /**
   * Session/profile currency context.
   * When provided, bare-number amounts ("coffee 50") inherit the currency
   * from activeCurrency → userPreferredCurrency → localeCurrency → USD.
   */
  currencyContext?: CurrencyContext;
}

/**
 * Parse a raw natural-language transaction description into a structured result.
 *
 * Pipeline (data flows forward only — no stage calls another stage internally):
 *
 *   1. normalizeInput      raw string → { raw, normalized }
 *   2. extractAmount       normalized + currencyContext → AmountResult
 *   3. extractMerchant     normalized → MerchantResult
 *   4. resolveCategory     normalized + MerchantResult → CategoryResult
 *   5. extractDate         normalized → DateResult
 *   6. detectMissingFields all results → MissingField[]
 *   7. generateFollowUp    missingFields + context → string | null
 *   8. composeConfidence   all results + missingFields → ConfidenceResult
 *   9. assemble ParseResult
 *
 * This function contains zero business logic.
 * It is the integration layer only — all logic lives in dedicated modules.
 *
 * Pure function — no DB, no API, no logging, no side effects.
 * Same input always produces same output (given same referenceDate and currencyContext).
 */

function resolveTransactionDate(transactionDate?: Date): Date {
  const d = transactionDate ?? new Date();

  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0),
  );
}

export function parseTransaction(
  rawInput: string,
  options: ParseTransactionOptions = {},
): ParseResult {
  const startedAt = performance.now();

  // stage 1: normalize
  const { raw, normalized } = normalizeInput(rawInput);

  // stage 2: extract amount (now context-aware)
  const amountResult = extractAmount({
    normalizedInput: normalized,
    ...(options.currencyContext !== undefined && {
      currencyContext: options.currencyContext,
    }),
  });

  // stage 3: extract merchant
  const merchantResult = extractMerchant(normalized);

  // stage 4: resolve category
  const categoryResult = resolveCategory({
    normalizedInput: normalized,
    merchantResult,
  });

  // stage 5: extract date
  const transactionDate = resolveTransactionDate(options.transactionDate);

  // stage 6: detect missing field
  const missingFields = detectMissingFields({
    amountResult,
    merchantResult,
    categoryResult,
  });

  // stage 7: generate follow up question
  const followUpQuestion = generateFollowUp({
    missingFields,
    context: {
      merchantName: merchantResult.canonicalName,
      category: categoryResult.value,
    },
  });

  // step 8: compose confidence
  const { score: confidenceScore } = composeConfidence({
    amountResult,
    merchantResult,
    categoryResult,
    missingFields,
  });

  const parserDurationMs = performance.now() - startedAt;

  // stage 9: assemble ParseResult
  return {
    amount: amountResult.value,
    currency: amountResult.currency,
    merchantName: merchantResult.canonicalName,
    category: categoryResult.value,
    transactionDate,
    descriptionRaw: raw,
    descriptionNormalized: normalized,
    confidenceScore,
    missingFields,
    followUpQuestion,
    parserDurationMs: parserDurationMs,
    parserVersion: PARSER_VERSION,
    aiProcessed: false,
  };
}
