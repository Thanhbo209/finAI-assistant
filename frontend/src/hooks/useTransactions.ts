import { useCallback, useState } from "react";
import type {
  CreateTransactionPayload,
  ParseResult,
  Transaction,
  TransactionFilters,
} from "../types/transaction";
import { transactionApi } from "../api/transaction.api";
import { useCurrency } from "./useCurrency";

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(
    async (filters?: TransactionFilters) => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await transactionApi.list(filters);
        if (Array.isArray(res)) {
          setTransactions(res);
          setTotal(res.length);
          setTotalPages(1);
        } else {
          setTransactions(res.data);
          setTotal(res.meta.total);
          setTotalPages(res.meta.totalPages);
        }
      } catch (err) {
        setError("Failed to fetch transactions");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );
  return {
    transactions,
    total,
    totalPages,
    isLoading,
    error,
    fetchTransactions,
  };
}

export function useParseTransaction() {
  const { currency } = useCurrency();
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  const parse = useCallback(async (description: string) => {
    setIsParsing(true);
    setParseError(null);
    setParseResult(null);
    try {
      const result = await transactionApi.parse(description, {
        userPreferredCurrency: currency,
      });
      setParseResult(result);
      return result;
    } catch (err) {
      setParseError("Failed to parse transaction");
      console.error(err);
      return null;
    } finally {
      setIsParsing(false);
    }
  }, [currency]);

  const reset = useCallback(() => {
    setParseResult(null);
    setParseError(null);
  }, []);

  return { parseResult, isParsing, parseError, parse, reset };
}

export function useCreateTransaction() {
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const create = useCallback(
    async (payload: CreateTransactionPayload): Promise<Transaction | null> => {
      setIsCreating(true);
      setCreateError(null);
      try {
        const tx = await transactionApi.create(payload);
        return tx;
      } catch (err) {
        setCreateError("Failed to save transaction");
        console.error(err);
        return null;
      } finally {
        setIsCreating(false);
      }
    },
    [],
  );

  return { isCreating, createError, create };
}
