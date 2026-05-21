export type TransactionCategory =
  | "FOOD_DRINK"
  | "TRANSPORTATION"
  | "GROCERIES"
  | "SUBSCRIPTIONS"
  | "ENTERTAINMENT"
  | "SHOPPING"
  | "HEALTH"
  | "UTILITIES"
  | "TRAVEL"
  | "UNKNOWN";

export const CATEGORY_LABELS: Record<TransactionCategory, string> = {
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
};

export const CATEGORY_COLORS: Record<TransactionCategory, string> = {
  FOOD_DRINK: "#f97316",
  TRANSPORTATION: "#3b82f6",
  GROCERIES: "#22c55e",
  SUBSCRIPTIONS: "#6366f1",
  ENTERTAINMENT: "#ec4899",
  SHOPPING: "#8b5cf6",
  HEALTH: "#10b981",
  UTILITIES: "#14b8a6",
  TRAVEL: "#0ea5e9",
  UNKNOWN: "#94a3b8",
};

export type ProcessingStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED";

export type SourceType = "AI_PARSER" | "MANUAL" | "IMPORT";
