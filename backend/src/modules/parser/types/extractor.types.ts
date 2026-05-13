// AmountResult, MerchantResult, CategoryResult, DateResult

import type { Category } from "../constants/parser.constants.js";

/**
 * Every extractor returns a typed result carrying both the extracted value
 * and a per-field confidence score (0–1).
 * Keeping confidence at the field level means the confidence engine can
 * weight each field independently important for future ML integration.
 */

export interface AmountResult {
  value: number | null;
  currency: string;
  /* 0–1 confidence that the extracted value is correct */
  confidence: number;
  /* The raw substring that matched, for debugging/auditing */
  rawMatch: string | null;
}

export interface MerchantResult {
  /** Canonical merchant name (e.g. "Uber" not "uber") */
  canonicalName: string | null;
  /** The token that triggered the match */
  rawMatch: string | null;
  confidence: number;
}

export interface CategoryResult {
  value: Category;
  confidence: number;
  /** 'merchant' = derived from merchant dict; 'keyword' = keyword fallback; 'default' = Unknown */
  source: "merchant" | "keyword" | "default";
}

export interface DateResult {
  value: Date;
  confidence: number;
  /** 'explicit' | 'relative' (today/yesterday) | 'default' (now) */
  source: "explicit" | "relative" | "default";
}
