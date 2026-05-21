import type { TransactionCategory } from "@/types/category";
import type { ParseResult } from "@/types/transaction";

// ── Message union type ────────────────────────────────────────────────────────

export type ChatMessage =
  | { id: string; type: "user"; text: string; timestamp: Date }
  | { id: string; type: "ai"; text: string; timestamp: Date }
  | { id: string; type: "thinking"; timestamp: Date }
  | {
      id: string;
      type: "preview";
      parseResult: ParseResult;
      overrides: OverrideValues;
      timestamp: Date;
    }
  | {
      id: string;
      type: "followup";
      question: string;
      field: MissingField;
      questionIndex: number;
      totalQuestions: number;
      timestamp: Date;
    }
  | {
      id: string;
      type: "success";
      amount: number;
      currency: string;
      merchant: string | null;
      category: TransactionCategory | null;
      timestamp: Date;
    }
  | { id: string; type: "error"; text: string; timestamp: Date };

export type MissingField = "amount" | "merchant" | "category" | "date";

export interface OverrideValues {
  amount?: number;
  merchant?: string;
  category?: TransactionCategory;
  date?: string;
}

// ── FSM States ────────────────────────────────────────────────────────────────

export type ChatState =
  | { status: "idle" }
  | { status: "parsing"; inputText: string }
  | {
      status: "followup";
      parseResult: ParseResult;
      overrides: OverrideValues;
      pendingFields: MissingField[];
      currentFieldIndex: number;
    }
  | {
      status: "confirming";
      parseResult: ParseResult;
      overrides: OverrideValues;
    }
  | { status: "saving"; parseResult: ParseResult; overrides: OverrideValues }
  | { status: "success" }
  | { status: "error"; message: string };

// ── Actions ───────────────────────────────────────────────────────────────────

export type ChatAction =
  | { type: "USER_SEND"; text: string }
  | { type: "PARSING_START" }
  | { type: "PARSING_DONE"; parseResult: ParseResult }
  | { type: "PARSING_ERROR"; message: string }
  | { type: "FOLLOWUP_ANSWER"; value: string }
  | { type: "FOLLOWUP_SKIP" }
  | { type: "CONFIRM" }
  | { type: "SAVE_DONE" }
  | { type: "SAVE_ERROR"; message: string }
  | { type: "RESET" }
  | { type: "EDIT" };

// ── Confidence helpers ────────────────────────────────────────────────────────

export type ConfidenceTier = "high" | "medium" | "low";

export function getConfidenceTier(score: number): ConfidenceTier {
  if (score >= 0.75) return "high";
  if (score >= 0.5) return "medium";
  return "low";
}

export const CONFIDENCE_CONFIG: Record<
  ConfidenceTier,
  {
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
    aiMessage: string;
    subtext: string;
  }
> = {
  high: {
    label: "Looks accurate",
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    aiMessage: "I'm confident this transaction was parsed correctly.",
    subtext: "All fields detected with high accuracy.",
  },
  medium: {
    label: "Needs review",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    aiMessage: "I parsed most fields, but please review before saving.",
    subtext: "Some fields may need your confirmation.",
  },
  low: {
    label: "Needs more info",
    color: "text-rose-600 dark:text-rose-400",
    bgColor: "bg-rose-500/10",
    borderColor: "border-rose-500/30",
    aiMessage: "I need a bit more information to create this transaction.",
    subtext: "Let me ask you a few quick questions.",
  },
};

// ── Missing field detection ───────────────────────────────────────────────────

export function getMissingFields(parseResult: ParseResult): MissingField[] {
  const fields: MissingField[] = [];
  if (!parseResult.amount) fields.push("amount");
  if (!parseResult.merchantName) fields.push("merchant");
  if (!parseResult.category) fields.push("category");
  return fields;
}

export function getFollowUpQuestion(field: MissingField): string {
  switch (field) {
    case "amount":
      return "How much was this expense?";
    case "merchant":
      return "Which merchant or place was this for?";
    case "category":
      return "What category does this fall under?";
    case "date":
      return "When did this transaction happen?";
  }
}

export function getFollowUpPlaceholder(field: MissingField): string {
  switch (field) {
    case "amount":
      return "e.g. 45 or 12.50";
    case "merchant":
      return "e.g. Starbucks, Grab, Netflix";
    case "category":
      return "Food & Drink, Transportation, Shopping...";
    case "date":
      return "e.g. today, yesterday, May 15";
  }
}

// ── ID generator ──────────────────────────────────────────────────────────────

export function genId(): string {
  return Math.random().toString(36).slice(2, 9);
}

// ── Artificial delay ──────────────────────────────────────────────────────────

export function artificialDelay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
