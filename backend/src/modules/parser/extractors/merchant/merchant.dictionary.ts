/**
 * One entry in the merchant dictionary.
 *
 * `aliases` are the lowercase token sequences we scan for in normalized input.
 * They must be lowercase because the normalization pipeline guarantees
 * lowercase output — we never test against mixed-case strings here.
 *
 * `defaultCategory` is a hint for the category resolver (Step 5).
 * The merchant extractor stores it here so category resolution is a O(1)
 * lookup rather than a second scan.  The category resolver may override it.
 */

import type { Category } from "../../constants/parser.constants.js";

export interface MerchantEntry {
  /** Display name stored in the DB, e.g. "McDonald's" */
  canonicalName: string;
  /**
   * All lowercase token sequences that identify this merchant.
   * Sorted longest-first within each entry so the scanner always
   * tries the most-specific alias before falling back to shorter ones.
   */
  aliases: readonly string[];
  defaultCategory: Category;
}

/**
 * The dictionary.
 *
 * Extension guide:
 *   1. Add a new entry object to MERCHANT_DICTIONARY.
 *   2. Add aliases in lowercase, longest first.
 *   3. Assign the most appropriate defaultCategory.
 *   4. Add at least one scanner test for the new merchant.
 *
 * No other files need to change.
 */

export const MERCHANT_DICTIONARY: readonly MerchantEntry[] = [
  {
    canonicalName: "Uber",
    aliases: ["uber eats", "uber trip", "uber"],
    defaultCategory: "Transportation",
  },
  {
    canonicalName: "Grab",
    aliases: ["grabfood", "grab food", "grab car", "grab"],
    defaultCategory: "Transportation",
  },
  {
    canonicalName: "Netflix",
    aliases: ["netflix"],
    defaultCategory: "Subscriptions",
  },
  {
    canonicalName: "Spotify",
    aliases: ["spotify premium", "spotify"],
    defaultCategory: "Subscriptions",
  },
  {
    canonicalName: "Amazon",
    aliases: ["amazon prime", "amazon"],
    defaultCategory: "Shopping",
  },
  {
    canonicalName: "Starbucks",
    aliases: ["starbucks coffee", "starbucks"],
    defaultCategory: "Food & Drink",
  },
  {
    canonicalName: "McDonald's",
    aliases: ["mcdonalds", "mcdonald", "mcd"],
    defaultCategory: "Food & Drink",
  },
  {
    canonicalName: "Walmart",
    aliases: ["walmart grocery", "walmart groceries", "walmart"],
    defaultCategory: "Groceries",
  },
  {
    canonicalName: "Apple",
    aliases: ["apple music", "apple tv", "apple store", "apple"],
    defaultCategory: "Subscriptions",
  },
  {
    canonicalName: "Google",
    aliases: ["google play", "google one", "google"],
    defaultCategory: "Subscriptions",
  },
] as const;

/**
 * Pre-built lookup: alias → MerchantEntry.
 * Built once at module load time — O(1) lookup during parsing.
 *
 * We build this map here (not inside the scanner) so the scanner
 * imports a ready structure rather than rebuilding it on every call.
 */
export const ALIAS_TO_MERCHANT: ReadonlyMap<string, MerchantEntry> = new Map(
  MERCHANT_DICTIONARY.flatMap((entry) =>
    entry.aliases.map((alias) => [alias, entry] as const),
  ),
);
