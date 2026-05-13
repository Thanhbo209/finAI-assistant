/**
 * Confidence scores for date extraction by source.
 * Explicit dates are strongest because the user stated a precise point in time.
 * Relative dates ("yesterday") are unambiguous but depend on reference date.
 * Default fallback is the weakest signal — we're guessing "today".
 */
export const DATE_CONFIDENCE = {
  EXPLICIT: 0.95,
  RELATIVE: 0.8,
  DEFAULT: 0.4,
} as const;

/**
 * Lowercase day names → offset from the current weekday.
 * Used by relative expressions like "last monday".
 * 0 = Sunday … 6 = Saturday, matching JS Date.getDay().
 */
export const DAY_NAME_TO_INDEX: Readonly<Record<string, number>> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
} as const;

/**
 * Lowercase month names and abbreviations → 0-based month index.
 * Supports both full names and standard 3-letter abbreviations.
 */
export const MONTH_NAME_TO_INDEX: Readonly<Record<string, number>> = {
  january: 0,
  jan: 0,
  february: 1,
  feb: 1,
  march: 2,
  mar: 2,
  april: 3,
  apr: 3,
  may: 4,
  june: 5,
  jun: 5,
  july: 6,
  jul: 6,
  august: 7,
  aug: 7,
  september: 8,
  sep: 8,
  sept: 8,
  october: 9,
  oct: 9,
  november: 10,
  nov: 10,
  december: 11,
  dec: 11,
} as const;

/**
 * When two relative date keywords appear in the same input (e.g. "yesterday yesterday"),
 * we apply this strategy:
 *
 *   FIRST: use the first match found, ignore subsequent ones.
 *
 * Rationale: the first date reference in a user's description is most likely
 * the intended transaction date. Subsequent occurrences are likely noise or
 * copy-paste errors. Confidence is NOT penalised because the result is still
 * deterministic — this rule is applied consistently.
 */
export const MULTI_DATE_STRATEGY = "FIRST" as const;
