import type { Category } from "../../../constants/parser.constants.js";

/**
 * One keyword entry: a token to scan for and the category it signals.
 */
export interface KeywordEntry {
  keyword: string;
  category: Category;
  wholeWord?: boolean; // Added to prevent substring false positives
}

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
  { keyword: "bar", category: "FOOD_DRINK", wholeWord: true },

  // ── Transportation ────────────────────────────────────────────────────────
  { keyword: "taxi", category: "TRANSPORTATION" },
  { keyword: "bus", category: "TRANSPORTATION", wholeWord: true },
  { keyword: "train", category: "TRANSPORTATION" },
  { keyword: "metro", category: "TRANSPORTATION" },
  { keyword: "parking", category: "TRANSPORTATION" },
  { keyword: "gas", category: "TRANSPORTATION", wholeWord: true },
  { keyword: "fuel", category: "TRANSPORTATION" },
  { keyword: "toll", category: "TRANSPORTATION" },

  // ── Travel ────────────────────────────────────────────────────────────────
  { keyword: "flight", category: "TRAVEL" },
  { keyword: "airport", category: "TRAVEL" },
  { keyword: "hotel", category: "TRAVEL" },
  { keyword: "airbnb", category: "TRAVEL" },
  { keyword: "hostel", category: "TRAVEL" },
  { keyword: "visa", category: "TRAVEL", wholeWord: true },

  // ── Groceries ─────────────────────────────────────────────────────────────
  { keyword: "groceries", category: "GROCERIES" },
  { keyword: "grocery", category: "GROCERIES" },
  { keyword: "supermarket", category: "GROCERIES" },
  { keyword: "market", category: "GROCERIES" },

  // ── Subscriptions ─────────────────────────────────────────────────────────
  { keyword: "subscription", category: "SUBSCRIPTIONS" },
  { keyword: "premium", category: "SUBSCRIPTIONS" },
  { keyword: "membership", category: "SUBSCRIPTIONS" },
  { keyword: "plan", category: "SUBSCRIPTIONS", wholeWord: true },

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
  { keyword: "electricity", category: "UTILITIES" },
  { keyword: "electric", category: "UTILITIES" },
  { keyword: "water bill", category: "UTILITIES" },
  { keyword: "internet", category: "UTILITIES" },
  { keyword: "wifi", category: "UTILITIES" },
  { keyword: "phone bill", category: "UTILITIES" },
  { keyword: "cigarettes", category: "UTILITIES" },
] as const;
