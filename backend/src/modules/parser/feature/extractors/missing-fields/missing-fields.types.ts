import type {
  AmountResult,
  MerchantResult,
  CategoryResult,
  DateResult,
} from "../../../types/extractor.types.js";

/**
 * The inputs to the missing-field detector.
 * Each field is the typed output of its dedicated extractor.
 * The detector never re-runs extraction — it only inspects these results.
 */
export interface DetectMissingFieldsInput {
  amountResult: AmountResult;
  merchantResult: MerchantResult;
  categoryResult: CategoryResult;
}
