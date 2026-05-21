// JSONB shape contracts
// These describe the structured data inside parserMetadata and parserOutput.

export interface ParseMetadata {
  parserVersion: string;
  confidence: number;
  aiProcessed: boolean;
  normalizedInput: string;
  missingFields: string[];
}

export interface ParserOutPut {
  amount: number | null;
  merchantName: string | null;
  category: string | null;
}

// API-layer transaction shape (what the service returns, not the raw DB row)

export interface TransactionRecord {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  originalAmount?: number;
  originalCurrency?: string;
  displayAmount?: number;
  displayCurrency?: string;
  exchangeRate?: number;
  merchantName: string | null;
  category: string;
  transactionDate: string;
  notes: string | null;
  parserMetadata: ParseMetadata;
  parserOutput: ParserOutPut;
  createdAt: string;
  // add only if model persists it
  // updatedAt?: string;
}

// Parser module result (returned from parseTransaction())
export interface ParseResult {
  amount: number | null;
  currency: string | null;
  merchantName: string | null;
  category: string | null;
  confidenceScore: number; // Overall confidence score (0-1)
  missingFields: string[]; // List of fields that were not confidently extracted
  followUpQuestions: string | null; // Optional follow-up questions for the user to clarify missing info
  parserVersion: string; // Version of the parser that produced this result
  aiProcessed: boolean; // Whether AI was used in the parsing process
  descriptionRaw: string; // The original transaction description that was parsed
  descriptionNormalized: string; // The normalized transaction description used for parsing
}

// Pagination
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: PaginationMeta;
}

// ─────────────────────────────────────────────────────────────────────────────
// Analytics shapes
// ─────────────────────────────────────────────────────────────────────────────
export interface MonthlySummary {
  year: number;
  month: number;
  totalAmount: number;
  transactionCount: number;
  avgAmount: number;
  currency: string;
}

export interface CategorySummary {
  category: string;
  totalAmount: number;
  transactionCount: number;
  percentage: number;
  currency: string;
}

export interface MerchantSummary {
  merchantName: string;
  totalAmount: number;
  transactionCount: number;
  currency: string;
}
