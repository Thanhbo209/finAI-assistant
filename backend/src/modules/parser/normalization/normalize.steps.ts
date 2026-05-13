import {
  CURRENCY_KEYWORD_NORMALIZATIONS,
  PATTERN_NOISE_PUNCTUATION,
  PATTERN_REPEATED_WHITESPACE,
  PATTERN_TAB_NEWLINE,
  PATTERN_UNICODE_WHITESPACE,
  PATTERN_WORD_SEPARATORS,
  REPLACEMENT_SINGLE_SPACE,
  REPLACEMENT_WORD_SEPARATOR,
} from "./normalize.constants.js";
import type { NormalizationStep } from "./normalize.types.js";

/**
 * Step 1 — Replace unicode whitespace variants with a standard ASCII space.
 * Must run first so later whitespace-collapsing steps work uniformly.
 */
export const normalizeUnicodeWhitespace: NormalizationStep = (input) =>
  input.replace(PATTERN_UNICODE_WHITESPACE, " ");

/**
 * Step 2 — Replace tab and newline characters with spaces.
 * Handles copy-pasted text, voice transcription output, and multi-line input.
 * Runs before collapseWhitespace which will merge the resulting gaps.
 */
export const normalizeTabsAndNewlines: NormalizationStep = (input) =>
  input.replace(PATTERN_TAB_NEWLINE, " ");

/**
 * Step 3 — Lowercase everything.
 * Financial descriptions carry no case-sensitive meaning.
 * Merchant matching and keyword detection are both case-insensitive after this.
 */
export const lowercaseInput: NormalizationStep = (input) => input.toLowerCase();

/**
 * Step 4 — Replace word separators (hyphens, underscores) with spaces.
 * "lunch-team" → "lunch team", "grocery_store" → "grocery store"
 */
export const replaceWordSeparators: NormalizationStep = (input) =>
  input.replace(PATTERN_WORD_SEPARATORS, REPLACEMENT_WORD_SEPARATOR);

/**
 * Step 5 — Normalize currency keywords to canonical abbreviations.
 * "45 dollars" → "45 usd", "12 euros" → "12 eur"
 * Runs before punctuation removal so "dollars!" is still matched by the word boundary.
 */
export const normalizeCurrencyKeywords: NormalizationStep = (input) =>
  CURRENCY_KEYWORD_NORMALIZATIONS.reduce(
    (acc, [pattern, canonical]) => acc.replace(pattern, canonical),
    input,
  );

/**
 * Step 6 — Remove noise punctuation.
 * Removes characters with no extraction value (!, ?, ,, ;, etc.).
 * Deliberately preserves: '.' (decimals), '$' (currency symbol), '%'
 */
export const removeNoisePunctuation: NormalizationStep = (input) =>
  input.replace(PATTERN_NOISE_PUNCTUATION, " ");

/**
 * Step 7 — Collapse repeated whitespace to a single space.
 * Applied last so every previous step can produce multiple spaces freely.
 * Trim is applied here too — no separate trim step needed.
 */
export const collapseWhitespace: NormalizationStep = (input) =>
  input.replace(PATTERN_REPEATED_WHITESPACE, REPLACEMENT_SINGLE_SPACE).trim();
