// Normalization

export { normalizeInput } from "./normalization/normalize.input.js";
export type { NormalizationResult } from "./normalization/normalize.types.js";

// Types

export type { ParseResult, ParseOutcome } from "./types/parse-result.types.js";
export { getParseOutcome } from "./types/parse-result.types.js";
export type {
  AmountResult,
  MerchantResult,
  CategoryResult,
  DateResult,
} from "./types/extractor.types.js";

// Constants
export {
  PARSER_VERSION,
  CONFIDENCE,
  CONFIDENCE_WEIGHTS,
  CATEGORY,
  MISSING_FIELD,
} from "./constants/parser.constants.js";
export type { Category, MissingField } from "./constants/parser.constants.js";

export { extractAmount } from "./extractors/amount/extract-amount.js";
export type { AmountCandidate } from "./extractors/amount/amount.types.js";
export { MULTI_NUMBER_STRATEGY } from "./extractors/amount/amount.constants.js";
