/**
 * All regex patterns for date extraction.
 * Every pattern has a named comment listing what it matches and what it explicitly rejects.
 *
 * Critical rule: never use these patterns with the JS Date constructor directly.
 * Always parse the capture groups manually in date.extractor.ts.
 * The JS Date constructor silently accepts "2025-13-99" — we do not.
 */

/**
 * ISO date: YYYY-MM-DD
 * Matches: "2025-05-01", "2024-12-31"
 * Rejects:  no implicit range check here — validity check done in extractor
 * Capturing groups: [1]=year [2]=month [3]=day
 */
export const PATTERN_ISO_DATE = /\b(\d{4})-(\d{2})-(\d{2})\b/;

/**
 * US date: MM/DD/YYYY
 * Matches: "05/12/2025"
 * Ambiguity: documented as MM/DD — see DESIGN_NOTE_DATE_FORMAT_AMBIGUITY below
 * Capturing groups: [1]=month [2]=day [3]=year
 */
export const PATTERN_US_DATE = /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/;

/**
 * Verbose named-month date: "jan 12 2025", "january 12 2025", "may 5 2024"
 * The year is OPTIONAL — "jan 12" alone is valid (year defaults to reference year).
 * Capturing groups: [1]=month-name [2]=day [3]=year (may be undefined)
 */
export const PATTERN_NAMED_MONTH_DATE =
  /\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\s+(\d{1,2})(?:\s+(\d{4}))?\b/;

/**
 * Plain relative keywords.
 * Matches: "today", "yesterday", "tomorrow"
 * These must be matched as whole words to avoid "yesterday" matching inside
 * a hypothetical compound word. Word boundaries handle that.
 */
export const PATTERN_SIMPLE_RELATIVE = /\b(today|yesterday|tomorrow)\b/;

/**
 * "last <weekday>" expression.
 * Matches: "last monday", "last friday"
 * Does NOT match "last pizza friday" — the word between "last" and the day name
 * must not exist. The pattern requires "last" immediately followed by a day name.
 * Capturing group: [1]=day-name
 */
export const PATTERN_LAST_WEEKDAY =
  /\blast\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/;

/**
 * DESIGN_NOTE_DATE_FORMAT_AMBIGUITY
 *
 * "05/06/2025" is ambiguous: it could be May 6 (MM/DD) or June 5 (DD/MM).
 * This system treats all slash-separated dates as MM/DD/YYYY.
 *
 * Rationale:
 *   1. The normalization pipeline guarantees lowercase ASCII input — there is no
 *      locale signal available at parse time.
 *   2. The primary user base for MVP is US-centric (USD default currency).
 *   3. ISO format (YYYY-MM-DD) is available for users who need unambiguous input.
 *   4. The ambiguity is surfaced to users via the confidence score and follow-up
 *      generation in Step 8 — it is not silently resolved.
 *
 * If international support is added later, a locale option can be threaded
 * through ExtractDateOptions without changing this file's interface.
 */
