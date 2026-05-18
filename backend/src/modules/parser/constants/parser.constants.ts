/**
 * Parser versioning — bump when extraction logic changes materially.
 * Stored on every transaction so historical records can be re-parsed.
 */

export const PARSER_VERSION = "1.0.0" as const;
/**
 * Confidence thresholds that drive downstream behaviour.
 * Centralised so callers never hard-code magic numbers.
 */

export const CONFIDENCE = {
  HIGH: 0.85,
  MEDIUM: 0.65,
  LOW: 0.4,
} as const;

/**
 * Weights used when composing per-field confidences into a single score.
 * Calculate the confidence score by multiplying with weights Not all fields are equally important
 * Must sum to 1.0.
 */

// Missing date is acceptable.

// Missing amount is not.

// So amount gets higher weight.

export const CONFIDENCE_WEIGHTS = {
  amount: 0.4,
  merchant: 0.35,
  date: 0.15,
  category: 0.1,
};

/**
 * Supported transaction categories.
 * Single source of truth — used by merchant dictionary and category resolver.
 */

export const CATEGORY = {
  FOOD_DRINK: "FOOD_DRINK",
  TRANSPORTATION: "TRANSPORTATION",
  GROCERIES: "GROCERIES",
  SUBSCRIPTIONS: "SUBSCRIPTIONS",
  ENTERTAINMENT: "ENTERTAINMENT",
  SHOPPING: "SHOPPING",
  HEALTH: "HEALTH",
  UTILITIES: "UTILITIES",
  TRAVEL: "TRAVEL",
  UNKNOWN: "UNKNOWN",
} as const;

export const CATEGORY_DISPLAY_NAMES = {
  FOOD_DRINK: "Food & Drink",
  TRANSPORTATION: "Transportation",
  GROCERIES: "Groceries",
  SUBSCRIPTIONS: "Subscriptions",
  ENTERTAINMENT: "Entertainment",
  SHOPPING: "Shopping",
  HEALTH: "Health",
  UTILITIES: "Utilities",
  TRAVEL: "Travel",
  UNKNOWN: "Unknown",
} as const satisfies Record<Category, string>;

export type Category = (typeof CATEGORY)[keyof typeof CATEGORY];

// parser.constants.ts
export type CategoryDisplayName =
  (typeof CATEGORY_DISPLAY_NAMES)[keyof typeof CATEGORY_DISPLAY_NAMES];

/**
 * Named missing-field identifiers — never use raw strings at call sites.
 * Standardized missing-data tracking.
 */

export const MISSING_FIELD = {
  AMOUNT: "amount",
  MERCHANT: "merchant",
  DATE: "date",
  CATEGORY: "category",
} as const;

export type MissingField = (typeof MISSING_FIELD)[keyof typeof MISSING_FIELD];
