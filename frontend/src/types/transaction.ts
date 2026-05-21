import type {
  ProcessingStatus,
  SourceType,
  TransactionCategory,
} from "./category";

export interface Transaction {
  id: string;
  userId: string;
  amount: string;
  currency: string;
  originalAmount?: number;
  originalCurrency?: string;
  displayAmount?: number;
  displayCurrency?: string;
  exchangeRate?: number;
  confidenceScore: number;
  aiProcessed: boolean;
  processingStatus: ProcessingStatus;
  isConfirmed: boolean;
  sourceType: SourceType;
  parserVersion: string;
  descriptionRaw: string;
  descriptionNormalized: string;
  merchantName: string | null;
  category: TransactionCategory | null;
  transactionDate: string;
  createdAt: string;
  deletedAt: string | null;
}

export interface ParseResult {
  amount: number | null;
  currency: string;
  merchantName: string | null;
  category: TransactionCategory | null;
  confidenceScore: number;
  missingFields: string[];
  followUpQuestions: string | null;
  parserVersion: string;
  aiProcessed: boolean;
  descriptionRaw: string;
  descriptionNormalized: string;
}

export interface FinalTransactionValues {
  amount: number;
  currency: string;
  merchantName: string | null;
  category: TransactionCategory | null;
  isConfirmed: boolean;
  transactionDate?: string;
}

export interface CreateTransactionPayload {
  parserResult: ParseResult;
  finalValues: FinalTransactionValues;
}

export interface TransactionFilters {
  dateFrom?: string;
  dateTo?: string;
  category?: TransactionCategory;
  merchantName?: string;
  displayCurrency?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedTransactions {
  data: Transaction[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
