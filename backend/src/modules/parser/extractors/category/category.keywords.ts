import type { Category } from "../../constants/parser.constants.js";

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
  { keyword: "coffee", category: "Food & Drink" },
  { keyword: "cafe", category: "Food & Drink" },
  { keyword: "restaurant", category: "Food & Drink" },
  { keyword: "lunch", category: "Food & Drink" },
  { keyword: "dinner", category: "Food & Drink" },
  { keyword: "breakfast", category: "Food & Drink" },
  { keyword: "food", category: "Food & Drink" },
  { keyword: "drink", category: "Food & Drink" },
  { keyword: "pizza", category: "Food & Drink" },
  { keyword: "burger", category: "Food & Drink" },
  { keyword: "sushi", category: "Food & Drink" },
  { keyword: "bar", category: "Food & Drink" }, // risk: "bar" can appear in other contexts

  // ── Transportation ────────────────────────────────────────────────────────
  { keyword: "taxi", category: "Transportation" },
  { keyword: "bus", category: "Transportation" },
  { keyword: "train", category: "Transportation" },
  { keyword: "metro", category: "Transportation" },
  { keyword: "parking", category: "Transportation" },
  { keyword: "gas", category: "Transportation" }, // risk: "gas" could be utilities
  { keyword: "fuel", category: "Transportation" },
  { keyword: "toll", category: "Transportation" },

  // ── Travel ────────────────────────────────────────────────────────────────
  { keyword: "flight", category: "Travel" },
  { keyword: "airport", category: "Travel" },
  { keyword: "hotel", category: "Travel" },
  { keyword: "airbnb", category: "Travel" },
  { keyword: "hostel", category: "Travel" },
  { keyword: "visa", category: "Travel" }, // risk: "visa" could be a payment card

  // ── Groceries ─────────────────────────────────────────────────────────────
  { keyword: "groceries", category: "Groceries" },
  { keyword: "grocery", category: "Groceries" },
  { keyword: "supermarket", category: "Groceries" },
  { keyword: "market", category: "Groceries" },

  // ── Subscriptions ─────────────────────────────────────────────────────────
  { keyword: "subscription", category: "Subscriptions" },
  { keyword: "premium", category: "Subscriptions" },
  { keyword: "membership", category: "Subscriptions" },
  { keyword: "plan", category: "Subscriptions" },

  // ── Entertainment ─────────────────────────────────────────────────────────
  { keyword: "movie", category: "Entertainment" },
  { keyword: "cinema", category: "Entertainment" },
  { keyword: "concert", category: "Entertainment" },
  { keyword: "game", category: "Entertainment" },
  { keyword: "ticket", category: "Entertainment" },
  { keyword: "festival", category: "Entertainment" },

  // ── Shopping ──────────────────────────────────────────────────────────────
  { keyword: "shopping", category: "Shopping" },
  { keyword: "clothes", category: "Shopping" },
  { keyword: "shoes", category: "Shopping" },
  { keyword: "shirt", category: "Shopping" },
  { keyword: "jacket", category: "Shopping" },

  // ── Health ────────────────────────────────────────────────────────────────
  { keyword: "hospital", category: "Health" },
  { keyword: "clinic", category: "Health" },
  { keyword: "pharmacy", category: "Health" },
  { keyword: "medicine", category: "Health" },
  { keyword: "doctor", category: "Health" },
  { keyword: "dental", category: "Health" },
  { keyword: "gym", category: "Health" },

  // ── Utilities ─────────────────────────────────────────────────────────────
  // Note: "bill" alone is intentionally excluded — too generic.
  { keyword: "electricity", category: "Utilities" },
  { keyword: "electric", category: "Utilities" },
  { keyword: "water bill", category: "Utilities" },
  { keyword: "internet", category: "Utilities" },
  { keyword: "wifi", category: "Utilities" },
  { keyword: "phone bill", category: "Utilities" },
] as const;
