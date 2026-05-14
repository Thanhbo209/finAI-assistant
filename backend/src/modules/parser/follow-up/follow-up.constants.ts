/**
 * Priority order when multiple fields are missing and we must
 * pick the most important one to ask about first.
 *
 * Rationale:
 *   amount   — without an amount there is no transaction; highest priority
 *   merchant — useful context, but optional; ask second if needed
 *   date     — defaults to today which is usually correct; ask third
 *   category — almost never worth asking; handled by SUPPRESS_CATEGORY_QUESTION
 */

import type { MissingField } from "../constants/parser.constants.js";

export const MISSING_FIELD_PRIORITY: ReadonlyArray<MissingField> = [
  "amount",
  "merchant",
  "date",
  "category",
] as const;

/**
 * Maximum number of missing fields to combine into one question.
 * Beyond this limit the generator picks only the highest-priority fields.
 *
 * Why 2?
 *   A combined "How much did you spend, and when?" is natural.
 *   A three-part question ("How much, which merchant, and when?") is
 *   overwhelming and resembles a form, defeating the conversational goal.
 */

export const MAX_COMBINED_FIELDS = 2 as const;

/**
 * Whether to generate a follow-up question for a missing category.
 *
 * DECISION: false — suppress category questions entirely.
 *
 * Rationale:
 *   Category is inferred context, not user identity. UNKNOWN is an
 *   acceptable DB value that users can correct after saving. Asking
 *   "What category is this?" adds a question to the majority of
 *   unrecognised merchants — exactly the inputs that already have the
 *   most friction. The human-in-the-loop preview lets users set category
 *   before confirming, so a forced question is redundant.
 */

export const SUPPRESS_CATEGORY_QUESTION = true as const;

/**
 * Merchant type hints — maps canonical merchant names to a short
 * descriptor used in context-aware amount questions.
 *
 * Examples:
 *   "Netflix"   → "Netflix subscription"
 *   "Uber"      → "Uber ride"
 *   "Starbucks" → "Starbucks order"
 *
 * Merchants NOT in this map use a generic fallback: "<MerchantName> charge".
 * New merchants can be added here without changing any template logic.
 */

export const MERCHANT_TYPE_HINT: Readonly<Record<string, string>> = {
  Uber: "Uber ride",
  Grab: "Grab ride",
  "McDonald's": "McDonald's order",
  Starbucks: "Starbucks order",
  Netflix: "Netflix subscription",
  Spotify: "Spotify subscription",
  Amazon: "Amazon order",
  Walmart: "Walmart shop",
  Apple: "Apple charge",
  Google: "Google charge",
} as const;
