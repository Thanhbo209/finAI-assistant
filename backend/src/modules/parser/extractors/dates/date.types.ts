/**
 * The typed output of the date extractor.
 * Matches the DateResult interface already declared in extractor.types.ts —
 * re-declared here so this module is self-contained and testable in isolation.
 */

export interface DateResult {
  value: Date;
  confidence: number;
  /** How the date was determined — consumers can use this to decide confidence */
  source: "explicit" | "relative" | "default";
}

/**
 * Options for extractDate().
 *
 * referenceDate: the "now" anchor for relative expressions.
 *   - Must be injected — never call Date.now() inside extraction logic.
 *   - Allows tests to run at a fixed point in time without mocking globals.
 *   - Defaults to new Date() at call time when omitted.
 *
 * Why an options object instead of a positional arg?
 *   We may add more options later (e.g. preferredLocale, timezone).
 *   An object avoids a breaking signature change.
 */

export interface ExtractDateOptions {
  referenceDate?: Date;
}
