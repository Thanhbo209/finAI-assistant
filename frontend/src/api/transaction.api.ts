import type { ApiResponse } from "@/types/api";
import type { TransactionCategory } from "../types/category";
import type {
  CategorySummary,
  MerchantSummary,
  MonthlySummary,
} from "../types/summary";
import type {
  CreateTransactionPayload,
  PaginatedTransactions,
  ParseResult,
  Transaction,
  TransactionFilters,
} from "../types/transaction";
import { api } from "./axios";

export interface ParseCurrencyContext {
  activeCurrency?: string;
  userPreferredCurrency?: string;
  localeCurrency?: string;
}

export const transactionApi = {
  parse: async (
    input: string,
    currencyContext?: ParseCurrencyContext,
  ): Promise<ParseResult> => {
    const { data } = await api.post<ApiResponse<ParseResult>>(
      "/transactions/parse",
      { input, currencyContext },
    );

    return data.data;
  },

  create: async (payload: CreateTransactionPayload): Promise<Transaction> => {
    const { data } = await api.post<ApiResponse<Transaction>>(
      "/transactions",
      payload,
    );
    return data.data;
  },

  list: async (
    filters?: TransactionFilters,
  ): Promise<PaginatedTransactions | Transaction[]> => {
    const params: Record<string, string | number> = {};

    if (filters?.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters?.dateTo) params.dateTo = filters.dateTo;
    if (filters?.category) params.category = filters.category;
    if (filters?.merchantName) params.merchantName = filters.merchantName;
    if (filters?.displayCurrency) {
      params.displayCurrency = filters.displayCurrency;
    }
    if (filters?.page) params.page = filters.page;
    if (filters?.limit) params.limit = filters.limit;

    const { data } = await api.get<
      ApiResponse<PaginatedTransactions | Transaction[]>
    >("/transactions", { params });
    return data.data;
  },

  getById: async (id: string): Promise<Transaction> => {
    const { data } = await api.get<ApiResponse<Transaction>>(
      `/transactions/${id}`,
    );
    return data.data;
  },

  update: async (
    id: string,
    payload: Partial<{
      amount: number;
      currency: string;
      merchantName: string | null;
      category: TransactionCategory | null;
      descriptionRaw: string;
      transactionDate: string;
    }>,
  ): Promise<Transaction> => {
    const { data } = await api.patch<ApiResponse<Transaction>>(
      `/transactions/${id}`,
      payload,
    );
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/transactions/${id}`);
  },

  // ── Summaries ──────────────────────────────────────────────────────────────
  monthlySummary: async (displayCurrency?: string): Promise<MonthlySummary[]> => {
    const { data } = await api.get<ApiResponse<MonthlySummary[]>>(
      "/transactions/summary/monthly",
      { params: displayCurrency ? { displayCurrency } : undefined },
    );
    return data.data;
  },

  categorySummary: async (displayCurrency?: string): Promise<CategorySummary[]> => {
    const { data } = await api.get<ApiResponse<CategorySummary[]>>(
      "/transactions/summary/category",
      { params: displayCurrency ? { displayCurrency } : undefined },
    );
    return data.data;
  },

  merchantSummary: async (displayCurrency?: string): Promise<MerchantSummary[]> => {
    const { data } = await api.get<ApiResponse<MerchantSummary[]>>(
      "/transactions/summary/merchant",
      { params: displayCurrency ? { displayCurrency } : undefined },
    );
    return data.data;
  },
};
