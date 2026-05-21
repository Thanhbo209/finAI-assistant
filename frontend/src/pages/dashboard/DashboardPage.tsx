import { useMemo } from "react";
import { Link } from "react-router-dom";
import { PlusCircle, Loader2, AlertCircle } from "lucide-react";
import { useSummary } from "@/hooks/useSummary";
import { useAuth } from "@/hooks/useAuth";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { TransactionCategory } from "@/types/category";
import { StatCards } from "@/components/dashboard/cards/StatCards";
import { MonthlyChart } from "@/components/dashboard/charts/MonthlyChart";
import { CategoryChart } from "@/components/dashboard/charts/CategoryChart";
import { MerchantChart } from "@/components/dashboard/charts/MerchantChart";
import { IntelligenceCards } from "@/components/dashboard/cards/IntelligenceCards";

export default function DashboardPage() {
  const { user } = useAuth();
  const { monthly, category, merchant, isLoading, error } = useSummary();

  const stats = useMemo(() => {
    const totalSpending = monthly.reduce((sum, m) => sum + m.total, 0);
    const now = new Date();
    const thisMonth = monthly.find(
      (m) =>
        String(m.month) === String(now.getMonth() + 1) &&
        m.year === now.getFullYear(),
    );
    const monthlySpending = thisMonth?.total ?? 0;
    const transactionCount = monthly.reduce((sum, m) => sum + m.count, 0);
    const topCategory =
      category.length > 0
        ? ([...category].sort((a, b) => b.total - a.total)[0]
            .category as TransactionCategory)
        : null;

    return { totalSpending, monthlySpending, transactionCount, topCategory };
  }, [monthly, category]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        <AlertCircle className="h-4 w-4 shrink-0" />
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Good {getGreeting()}, {user?.email?.split(" ")[0] ?? "there"}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Here's your spending overview
          </p>
        </div>
        <Button asChild size="sm">
          <Link to="/dashboard/add">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add transaction
          </Link>
        </Button>
      </div>

      {/* Stat Cards */}
      <StatCards {...stats} />

      <IntelligenceCards />

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base  font-bold">
              Monthly Spending
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthly.length === 0 ? (
              <EmptyState message="No monthly data yet" />
            ) : (
              <MonthlyChart data={monthly} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">By Category</CardTitle>
          </CardHeader>
          <CardContent>
            {category.length === 0 ? (
              <EmptyState message="No category data yet" />
            ) : (
              <CategoryChart data={category} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold">Top Merchants</CardTitle>
        </CardHeader>
        <CardContent>
          {merchant.length === 0 ? (
            <EmptyState message="No merchant data yet" />
          ) : (
            <MerchantChart data={merchant} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-55 text-muted-foreground gap-2">
      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
        <AlertCircle className="h-4 w-4" />
      </div>
      <p className="text-sm">{message}</p>
      <Link
        to="/dashboard/add"
        className="text-xs text-primary hover:underline"
      >
        Add your first transaction
      </Link>
    </div>
  );
}
