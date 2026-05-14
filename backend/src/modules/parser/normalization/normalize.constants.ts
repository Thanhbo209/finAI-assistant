/**
 * All normalization rules live here.
 * Extractors import patterns from this file — never define inline regex.
 *
 * Naming convention: PATTERN_<WHAT_IT_MATCHES>, REPLACEMENT_<WHAT_IT_PRODUCES>
 */

/**
 * Unicode whitespace characters beyond the standard \s set.
 * Covers non-breaking space (U+00A0), thin space (U+2009), etc.
 */

// mobile apps
// PDFs
// banking apps
// messaging apps
// OCR
// email

export const PATTERN_UNICODE_WHITESPACE =
  /[\u00A0\u2009\u200A\u202F\u205F\u3000]/g;

/**
 * Tab and newline characters (\t, \r, \n) that appear in copy-pasted or
 * voice-transcribed input. Replaced with a space so collapseWhitespace
 * consolidates them in the final step.
 * Must run before collapseWhitespace, after unicodeWhitespace.
 */
export const PATTERN_TAB_NEWLINE = /[\t\r\n]+/g;

/**
 * Word separators that carry no semantic meaning in financial descriptions.
 * Hyphens and underscores become spaces: "lunch-team" → "lunch team"
 */
export const PATTERN_WORD_SEPARATORS = /[-_]+/g;
export const REPLACEMENT_WORD_SEPARATOR = " ";

/**
 * Punctuation that should be removed outright.
 * Explicitly excludes: '.' (decimal), '$' (currency symbol), '%'
 * Comma is included — it carries no semantic meaning in financial descriptions.
 * Matches: ! ? , ; : @ # & * ( ) [ ] { } \ / | ^ ~ ` ' "
 */
export const PATTERN_NOISE_PUNCTUATION = /[!?,;:@#&*()\[\]{}\\/|^~`'"]+/g;

/**
 * Runs of two or more whitespace characters — collapsed to a single space.
 * Applied after all other transforms so we only need one pass.
 */
export const PATTERN_REPEATED_WHITESPACE = /\s{2,}/g;
export const REPLACEMENT_SINGLE_SPACE = " ";

/**
 * Currency keyword aliases → canonical symbol.
 * "dollars" / "dollar" / "usd" all become "usd" so the amount extractor
 * only needs to handle one form.
 *
 * Each entry: [pattern, canonical]
 * Order matters: longer/more-specific patterns first.
 */
export const CURRENCY_KEYWORD_NORMALIZATIONS: ReadonlyArray<[RegExp, string]> =
  [
    [/\bdollars?\b/gi, "usd"],
    [/\beuros?\b/gi, "eur"],
    [/\bpounds?\b/gi, "gbp"],
    [/\bvnd\b/gi, "vnd"],
    [/\byens?\b/gi, "jpy"],
  ];
