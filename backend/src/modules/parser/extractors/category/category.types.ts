import type { MerchantResult } from "../../types/extractor.types.js";

/**
 * Input contract for the category resolver.
 * The resolver needs both the normalized string (for keyword scanning)
 * and the MerchantResult (for merchant-priority lookup).
 *
 * Keeping this as a named interface makes test setup explicit
 * and documents the dependency on MerchantResult clearly.
 */
export interface ResolveCategoryInput {
  normalizedInput: string;
  merchantResult: MerchantResult;
}
