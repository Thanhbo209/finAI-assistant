import {
  collapseWhitespace,
  lowercaseInput,
  normalizeCurrencyKeywords,
  normalizeTabsAndNewlines,
  normalizeUnicodeWhitespace,
  removeNoisePunctuation,
  replaceWordSeparators,
} from "./normalize.steps.js";
import type {
  NormalizationResult,
  NormalizationStep,
} from "./normalize.types.js";

/**
 * Ordered normalization pipeline.
 *
 * The order is intentional and must not be changed without updating tests:
 * 1. Unicode whitespace — standardize exotic space characters first
 * 2. Tabs and newlines — convert \t \r \n to spaces before collapse
 * 3. Lowercase — needed before keyword matching (step 5)
 * 4. Word separators — expand "lunch-team" before punctuation removal
 * 5. Currency keywords — match before noise punctuation removes surrounding chars
 * 6. Noise punctuation — remove after currency keywords are already replaced
 * 7. Collapse whitespace — final pass; absorbs gaps left by all prior replacements
 *
 * To add a future rule: append a NormalizationStep to this array.
 * Do not inline logic directly here — keep steps in normalization.steps.ts.
 */
const NORMALIZATION_PIPELINE: ReadonlyArray<NormalizationStep> = [
  normalizeUnicodeWhitespace,
  normalizeTabsAndNewlines,
  lowercaseInput,
  replaceWordSeparators,
  normalizeCurrencyKeywords,
  removeNoisePunctuation,
  collapseWhitespace,
];

/**
 * Run a string through each normalization step in order.
 * Pure function — never mutates input.
 */
function applyPipeline(raw: string): string {
  return NORMALIZATION_PIPELINE.reduce((current, step) => step(current), raw);
}

/**
 * Primary entry point for the normalization layer.
 *
 * Returns both `raw` (stored verbatim) and `normalized` (used by extractors).
 * Callers should never throw away `raw` — it is the audit record.
 *
 * Empty / whitespace-only input is valid: it surfaces as an empty `normalized`
 * string, which the missing-field detector will flag later.
 */
export function normalizeInput(raw: string): NormalizationResult {
  return {
    raw,
    normalized: applyPipeline(raw),
  };
}
