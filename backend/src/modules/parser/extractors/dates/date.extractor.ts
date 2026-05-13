import {
  DATE_CONFIDENCE,
  DAY_NAME_TO_INDEX,
  MONTH_NAME_TO_INDEX,
} from "./date.constants.js";
import {
  PATTERN_ISO_DATE,
  PATTERN_LAST_WEEKDAY,
  PATTERN_NAMED_MONTH_DATE,
  PATTERN_SIMPLE_RELATIVE,
  PATTERN_US_DATE,
} from "./date.patterns.js";
import type { DateResult, ExtractDateOptions } from "./date.types.js";

// ─────────────────────────────────────────────────────────────────────────────
// Safe date construction helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a Date at midnight local time from year/month/day components.
 * Uses Date.UTC to avoid the JS Date constructor's timezone shift on
 * date-only strings, then offsets back to local midnight.
 *
 * Why not `new Date(year, month, day)`?
 *   That constructor is fine for local time but is inconsistent across
 *   environments when dates are serialised to ISO strings (UTC midnight
 *   can roll back one day). We standardise on local midnight throughout.
 */
function buildLocalDate(year: number, month: number, day: number): Date {
  const d = new Date(year, month, day, 0, 0, 0, 0);
  return d;
}

/**
 * Validate numeric date components before constructing a Date.
 * The JS Date constructor silently accepts "2025-13-99" and rolls over
 * to a valid (but wrong) date. We reject instead.
 *
 * Returns true when the triple represents a calendar-valid date.
 */
function isValidDateComponents(
  year: number,
  month: number,
  day: number,
): boolean {
  if (year < 1900 || year > 2100) return false;
  if (month < 0 || month > 11) return false;
  if (day < 1 || day > 31) return false;

  // Build the date and verify JS didn't roll it over
  const d = buildLocalDate(year, month, day);
  return (
    d.getFullYear() === year && d.getMonth() === month && d.getDate() === day
  );
}

/**
 * Midnight copy of a Date — strips the time component without mutating the original.
 * All DateResults carry midnight-local values for consistency.
 */
function atMidnight(d: Date): Date {
  return buildLocalDate(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Add a signed number of days to a date, returning a new Date.
 * Pure — never mutates its argument.
 */
function addDays(base: Date, days: number): Date {
  const result = new Date(base.getTime());
  result.setDate(result.getDate() + days);
  return atMidnight(result);
}

// ─────────────────────────────────────────────────────────────────────────────
// Explicit date resolvers — each returns DateResult | null
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Try to extract an ISO date: YYYY-MM-DD
 * Example: "netflix 2025-05-01 15 usd"
 */
function tryIsoDate(input: string, _ref: Date): DateResult | null {
  const match = PATTERN_ISO_DATE.exec(input);
  if (!match) return null;

  const yearStr = match[1];
  const monthStr = match[2];
  const dayStr = match[3];

  if (yearStr === undefined || monthStr === undefined || dayStr === undefined)
    return null;

  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1; // JS months are 0-based
  const day = parseInt(dayStr, 10);

  if (!isValidDateComponents(year, month, day)) return null;

  return {
    value: buildLocalDate(year, month, day),
    confidence: DATE_CONFIDENCE.EXPLICIT,
    source: "explicit",
  };
}

/**
 * Try to extract a US-format date: MM/DD/YYYY
 * See DESIGN_NOTE_DATE_FORMAT_AMBIGUITY in date.patterns.ts.
 * Example: "restaurant 05/12/2025 40"
 */
function tryUsDate(input: string, _ref: Date): DateResult | null {
  const match = PATTERN_US_DATE.exec(input);
  if (!match) return null;

  const monthStr = match[1];
  const dayStr = match[2];
  const yearStr = match[3];

  if (monthStr === undefined || dayStr === undefined || yearStr === undefined)
    return null;

  const month = parseInt(monthStr, 10) - 1; // 0-based
  const day = parseInt(dayStr, 10);
  const year = parseInt(yearStr, 10);

  if (!isValidDateComponents(year, month, day)) return null;

  return {
    value: buildLocalDate(year, month, day),
    confidence: DATE_CONFIDENCE.EXPLICIT,
    source: "explicit",
  };
}

/**
 * Try to extract a named-month date: "jan 12 2025", "may 5", "january 15 2024"
 * Year is optional — when absent, the reference year is used.
 * Example: "movie jan 15 2025 25 usd"
 */
function tryNamedMonthDate(input: string, ref: Date): DateResult | null {
  const match = PATTERN_NAMED_MONTH_DATE.exec(input);
  if (!match) return null;

  // Under strict TS, RegExpExecArray capture groups may be possibly undefined.
  const monthName = match[1];
  const dayStr = match[2];
  const yearStr = match[3];

  if (monthName === undefined || dayStr === undefined) return null;

  const monthIndex = MONTH_NAME_TO_INDEX[monthName.toLowerCase()];
  if (monthIndex === undefined) return null;

  const day = parseInt(dayStr, 10);
  const year =
    yearStr !== undefined ? parseInt(yearStr, 10) : ref.getFullYear();

  if (!isValidDateComponents(year, monthIndex, day)) return null;

  return {
    value: buildLocalDate(year, monthIndex, day),
    confidence: DATE_CONFIDENCE.EXPLICIT,
    source: "explicit",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Relative date resolvers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Try to extract simple relative keywords: today, yesterday, tomorrow.
 * MULTI_DATE_STRATEGY = FIRST: only the first match is used.
 * "yesterday yesterday" → yesterday (first occurrence), no penalty.
 */
function trySimpleRelative(input: string, ref: Date): DateResult | null {
  const match = PATTERN_SIMPLE_RELATIVE.exec(input);
  if (!match) return null;

  const keyword = match[1];
  const offsets: Record<string, number> = {
    today: 0,
    yesterday: -1,
    tomorrow: +1,
  };

  if (keyword === undefined) return null;

  const offset = offsets[keyword];
  if (offset === undefined) return null;

  return {
    value: addDays(ref, offset),
    confidence: DATE_CONFIDENCE.RELATIVE,
    source: "relative",
  };
}

/**
 * Try to extract "last <weekday>" expressions.
 * "last monday" when today is Wednesday → 9 days ago.
 *
 * Algorithm:
 *   1. Get target weekday index from the day name.
 *   2. Compute days-since-last-occurrence of that weekday relative to ref.
 *   3. "last X" always refers to the PREVIOUS week's occurrence,
 *      never today even if today IS that weekday.
 *      e.g. "last monday" on a Monday → 7 days ago, not 0.
 *
 * "last pizza friday" does NOT match — PATTERN_LAST_WEEKDAY requires
 * "last" to be immediately followed by the weekday name.
 */
function tryLastWeekday(input: string, ref: Date): DateResult | null {
  const match = PATTERN_LAST_WEEKDAY.exec(input);
  if (!match) return null;

  const dayName = match[1];
  if (dayName === undefined) return null;

  const targetDay = DAY_NAME_TO_INDEX[dayName.toLowerCase()];
  if (targetDay === undefined) return null;

  const refDay = ref.getDay(); // 0=Sun … 6=Sat
  // Days since that weekday last occurred, always 1–7
  const daysSince = (refDay - targetDay + 7) % 7 || 7;

  return {
    value: addDays(ref, -daysSince),
    confidence: DATE_CONFIDENCE.RELATIVE,
    source: "relative",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Default fallback
// ─────────────────────────────────────────────────────────────────────────────

function resolveDefault(ref: Date): DateResult {
  return {
    value: atMidnight(ref),
    confidence: DATE_CONFIDENCE.DEFAULT,
    source: "default",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Public entry point
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extract a transaction date from a normalized input string.
 *
 * Resolution order (first match wins):
 *   1. ISO date          YYYY-MM-DD          → explicit, 0.95
 *   2. US date           MM/DD/YYYY          → explicit, 0.95
 *   3. Named-month date  "jan 15 2025"       → explicit, 0.95
 *   4. Simple relative   today/yesterday/…   → relative, 0.80
 *   5. Last weekday      "last monday"       → relative, 0.80
 *   6. Default fallback  referenceDate       → default,  0.40
 *
 * @param normalizedInput - output of normalizeInput().normalized
 * @param options.referenceDate - anchor for relative date resolution.
 *   Inject a fixed date in tests so results are deterministic regardless
 *   of when the test suite runs. Defaults to new Date() when omitted.
 */
export function extractDate(
  normalizedInput: string,
  options: ExtractDateOptions = {},
): DateResult {
  const ref = atMidnight(options.referenceDate ?? new Date());

  return (
    tryIsoDate(normalizedInput, ref) ??
    tryUsDate(normalizedInput, ref) ??
    tryNamedMonthDate(normalizedInput, ref) ??
    trySimpleRelative(normalizedInput, ref) ??
    tryLastWeekday(normalizedInput, ref) ??
    resolveDefault(ref)
  );
}
