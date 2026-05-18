import type { Category } from "../../../constants/parser.constants.js";

/**
 * One keyword entry: a token to scan for and the category it signals.
 *
 * Keywords must be lowercase — they are matched against normalized input.
 * More-specific keywords should appear before generic ones in the array
 * (within the same category) to assist debugging, though match order
 * does not affect the result because ALL matches are collected first.
 */
interface KeywordEntry {
  keyword: string;
  category: Category;
}

/**
 * The keyword map.
 *
 * Extension guide:
 *   - Add entries to the relevant category block, or create a new block.
 *   - Keep keywords lowercase.
 *   - Prefer specific tokens ("electricity") over vague ones ("bill")
 *     to reduce false-positive risk.
 *   - Document any known false-positive risk in a comment above the entry.
 *
 * Grouping by category in source is cosmetic — the resolver iterates
 * the flat array and collects all matches.
 */
export const KEYWORD_MAP: readonly KeywordEntry[] = [
  // ── Food & Drink ──────────────────────────────────────────────────────────
  { keyword: "coffee", category: "FOOD_DRINK" },
  { keyword: "cafe", category: "FOOD_DRINK" },
  { keyword: "restaurant", category: "FOOD_DRINK" },
  { keyword: "lunch", category: "FOOD_DRINK" },
  { keyword: "dinner", category: "FOOD_DRINK" },
  { keyword: "breakfast", category: "FOOD_DRINK" },
  { keyword: "food", category: "FOOD_DRINK" },
  { keyword: "drink", category: "FOOD_DRINK" },
  { keyword: "pizza", category: "FOOD_DRINK" },
  { keyword: "burger", category: "FOOD_DRINK" },
  { keyword: "sushi", category: "FOOD_DRINK" },
  { keyword: "bar", category: "FOOD_DRINK" }, // risk: "bar" can appear in other contexts

  // ── Transportation ────────────────────────────────────────────────────────
  { keyword: "taxi", category: "TRANSPORTATION" },
  { keyword: "bus", category: "TRANSPORTATION" },
  { keyword: "train", category: "TRANSPORTATION" },
  { keyword: "metro", category: "TRANSPORTATION" },
  { keyword: "parking", category: "TRANSPORTATION" },
  { keyword: "gas", category: "TRANSPORTATION" }, // risk: "gas" could be utilities
  { keyword: "fuel", category: "TRANSPORTATION" },
  { keyword: "toll", category: "TRANSPORTATION" },

  // ── Travel ────────────────────────────────────────────────────────────────
  { keyword: "flight", category: "TRAVEL" },
  { keyword: "airport", category: "TRAVEL" },
  { keyword: "hotel", category: "TRAVEL" },
  { keyword: "airbnb", category: "TRAVEL" },
  { keyword: "hostel", category: "TRAVEL" },
  { keyword: "visa", category: "TRAVEL" }, // risk: "visa" could be a payment card

  // ── Groceries ─────────────────────────────────────────────────────────────
  { keyword: "groceries", category: "GROCERIES" },
  { keyword: "grocery", category: "GROCERIES" },
  { keyword: "supermarket", category: "GROCERIES" },
  { keyword: "market", category: "GROCERIES" },

  // ── Subscriptions ─────────────────────────────────────────────────────────
  { keyword: "subscription", category: "SUBSCRIPTIONS" },
  { keyword: "premium", category: "SUBSCRIPTIONS" },
  { keyword: "membership", category: "SUBSCRIPTIONS" },
  { keyword: "plan", category: "SUBSCRIPTIONS" },

  // ── Entertainment ─────────────────────────────────────────────────────────
  { keyword: "movie", category: "ENTERTAINMENT" },
  { keyword: "cinema", category: "ENTERTAINMENT" },
  { keyword: "concert", category: "ENTERTAINMENT" },
  { keyword: "game", category: "ENTERTAINMENT" },
  { keyword: "ticket", category: "ENTERTAINMENT" },
  { keyword: "festival", category: "ENTERTAINMENT" },

  // ── Shopping ──────────────────────────────────────────────────────────────
  { keyword: "shopping", category: "SHOPPING" },
  { keyword: "clothes", category: "SHOPPING" },
  { keyword: "shoes", category: "SHOPPING" },
  { keyword: "shirt", category: "SHOPPING" },
  { keyword: "jacket", category: "SHOPPING" },

  // ── Health ────────────────────────────────────────────────────────────────
  { keyword: "hospital", category: "HEALTH" },
  { keyword: "clinic", category: "HEALTH" },
  { keyword: "pharmacy", category: "HEALTH" },
  { keyword: "medicine", category: "HEALTH" },
  { keyword: "doctor", category: "HEALTH" },
  { keyword: "dental", category: "HEALTH" },
  { keyword: "gym", category: "HEALTH" },

  // ── Utilities ─────────────────────────────────────────────────────────────
  // Note: "bill" alone is intentionally excluded — too generic.
  { keyword: "electricity", category: "UTILITIES" },
  { keyword: "electric", category: "UTILITIES" },
  { keyword: "water bill", category: "UTILITIES" },
  { keyword: "internet", category: "UTILITIES" },
  { keyword: "wifi", category: "UTILITIES" },
  { keyword: "phone bill", category: "UTILITIES" },
] as const;
