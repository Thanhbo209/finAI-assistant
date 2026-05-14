import type { Category, MissingField } from "../constants/parser.constants.js";

/**
 * The complete, typed output of the parser pipeline.
 * This is the contract between the parser and the API/service layer.
 * Nothing in the parser leaks raw internals beyond this interface.
 */

export interface ParseResult {
  // ── Extracted fields ──────────────────────────────────────────────
  amount: number | null;
  currency: string;
  merchantName: string | null;
  category: Category;
  transactionDate: Date | null;

  // ── Input representation ──────────────────────────────────────────
  /** Exactly what the user typed — stored verbatim in DB */
  descriptionRaw: string;

  // ── Confidence ────────────────────────────────────────────────────
  /** Composite 0–1 score; see CONFIDENCE_WEIGHTS */
  confidenceScore: number;

  // ── Conversation state ────────────────────────────────────────────
  /** Fields the parser could not confidently extract */
  missingFields: MissingField[];
  /**
   * Plain-English question to show the user when missingFields is non-empty.
   * null when all fields were extracted successfully.
   */
  followUpQuestion: string | null;

  parserDurationMs: number;

  // ── Metadata ──────────────────────────────────────────────────────
  parserVersion: string;
  /** Always false at this phase — set by AI enrichment layer later */
  aiProcessed: false;

  /** After normalisation — used for consistent analytics/search */
  descriptionNormalized: string;
}

/**
 * Convenience type for callers that only need to know whether the parse
 * was complete or needs a follow-up.
 */
export type ParseOutcome = "complete" | "needs_followup";

export function getParseOutcome(result: ParseResult): ParseOutcome {
  return result.missingFields.length === 0 ? "complete" : "needs_followup";
}
