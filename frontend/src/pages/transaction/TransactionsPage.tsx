import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Filter,
  Pencil,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  AlertCircle,
} from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";
import { transactionApi } from "@/api/transaction.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORY_LABELS } from "@/types/category";
import type { TransactionCategory } from "@/types/category";
import type { Transaction, TransactionFilters } from "@/types/transaction";
import { formatCurrency, formatDate } from "@/lib/helper";
import { CategoryBadge } from "@/components/dashboard/badge/CategoryBadge";
import { EditTransactionModal } from "@/components/transaction/modals/EditTransactionModal";
import { useCurrency } from "@/hooks/useCurrency";

const ALL_CATEGORIES = Object.entries(CATEGORY_LABELS) as [
  TransactionCategory,
  string,
][];
const PAGE_SIZE = 10;

export default function TransactionsPage() {
  const { currency } = useCurrency();
  const {
    transactions,
    total,
    totalPages,
    isLoading,
    error,
    fetchTransactions,
  } = useTransactions();

  const [filters, setFilters] = useState<TransactionFilters>({
    page: 1,
    limit: PAGE_SIZE,
  });
  const [search, setSearch] = useState("");
  const [editTarget, setEditTarget] = useState<Transaction | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(() => {
    void fetchTransactions({
      ...filters,
      displayCurrency: currency,
      merchantName: search || undefined,
    });
  }, [currency, fetchTransactions, filters, search]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this transaction?")) return;
    setDeletingId(id);
    try {
      await transactionApi.delete(id);
      load();
    } finally {
      setDeletingId(null);
    }
  };

  const handleCategoryFilter = (val: string) => {
    setFilters((f) => ({
      ...f,
      page: 1,
      category: val === "ALL" ? undefined : (val as TransactionCategory),
    }));
  };

  const handleDateFilter = (key: "dateFrom" | "dateTo", val: string) => {
    setFilters((f) => ({ ...f, page: 1, [key]: val || undefined }));
  };

  const handleSearch = (val: string) => {
    setSearch(val);
    setFilters((f) => ({ ...f, page: 1 }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {total} total entries
          </p>
        </div>
        <Button asChild size="sm">
          <Link to="/dashboard/add">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground font-medium">
            <Filter className="h-3.5 w-3.5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search merchant..."
                className="pl-8 h-9 text-sm"
              />
            </div>

            <Select onValueChange={handleCategoryFilter} defaultValue="ALL">
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All categories</SelectItem>
                {ALL_CATEGORIES.map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              className="h-9 text-sm"
              onChange={(e) => handleDateFilter("dateFrom", e.target.value)}
              placeholder="Start date"
            />
            <Input
              type="date"
              className="h-9 text-sm"
              onChange={(e) => handleDateFilter("dateTo", e.target.value)}
              placeholder="End date"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {error && (
            <div className="flex items-center gap-2 p-4 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground">
              <p className="text-sm">No transactions found</p>
              <Link
                to="/dashboard/add"
                className="text-xs text-primary hover:underline"
              >
                Add your first transaction
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Date
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Description
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Category
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="py-3 px-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {transactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="hover:bg-muted/20 transition-colors group"
                    >
                      <td className="py-3 px-4 text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(tx.transactionDate)}
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm font-medium">
                          {tx.merchantName ?? (
                            <span className="text-muted-foreground italic">
                              Unknown merchant
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono truncate max-w-[160px]">
                          {tx.descriptionRaw}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <CategoryBadge category={tx.category} />
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-sm">
                        <div className="flex flex-col items-end gap-0.5">
                          <span>
                            {formatCurrency(
                              tx.displayAmount ?? tx.amount,
                              tx.displayCurrency ?? tx.currency,
                            )}
                          </span>
                          {tx.displayCurrency &&
                            tx.originalCurrency &&
                            tx.displayCurrency !== tx.originalCurrency && (
                              <span className="text-[10px] font-medium text-muted-foreground">
                                Original:{" "}
                                {formatCurrency(
                                  tx.originalAmount ?? tx.amount,
                                  tx.originalCurrency,
                                )}
                              </span>
                            )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {tx.isConfirmed ? (
                          <Badge variant="default" className="text-xs">
                            Confirmed
                          </Badge>
                        ) : (
                          <Badge variant="default" className="text-xs">
                            Pending
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditTarget(tx)}
                            className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => void handleDelete(tx.id)}
                            disabled={deletingId === tx.id}
                            className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            {deletingId === tx.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-xs text-muted-foreground">
                Page {filters.page ?? 1} of {totalPages}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0"
                  disabled={(filters.page ?? 1) <= 1}
                  onClick={() =>
                    setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))
                  }
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0"
                  disabled={(filters.page ?? 1) >= totalPages}
                  onClick={() =>
                    setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))
                  }
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <EditTransactionModal
        transaction={editTarget}
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        onSaved={load}
      />
    </div>
  );
}
