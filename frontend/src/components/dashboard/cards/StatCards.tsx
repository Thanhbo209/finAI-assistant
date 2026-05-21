import { Card, CardContent } from "@/components/ui/card";
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
} from "@/types/category";
import type { TransactionCategory } from "@/types/category";
import { formatCurrency } from "@/lib/helper";
import { Calendar, Receipt, Tag, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/hooks/useCurrency";

interface StatCardsProps {
  totalSpending: number;
  monthlySpending: number;
  transactionCount: number;
  topCategory: TransactionCategory | null;
}

export function StatCards({
  totalSpending,
  monthlySpending,
  transactionCount,
  topCategory,
}: StatCardsProps) {
  const { currency } = useCurrency();
  const cards = [
    {
      label: "Total Spending",
      value: formatCurrency(totalSpending, currency),
      icon: TrendingUp,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "This Month",
      value: formatCurrency(monthlySpending, currency),
      icon: Calendar,
      color: "text-violet-500",
      bg: "bg-violet-500/10",
    },
    {
      label: "Transactions",
      value: transactionCount.toString(),
      icon: Receipt,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Top Category",
      value: topCategory ? (CATEGORY_LABELS[topCategory] ?? topCategory) : "-",
      icon: Tag,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      dot: topCategory ? CATEGORY_COLORS[topCategory] : undefined,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.label} className="hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                  {card.label}
                </p>
                <div className="flex items-center gap-2">
                  {card.dot && (
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ background: card.dot }}
                    />
                  )}
                  <p className="text-xl font-bold truncate">{card.value}</p>
                </div>
              </div>
              <div className={cn("rounded-lg p-2 shrink-0 ml-2", card.bg)}>
                <card.icon className={cn("h-4 w-4", card.color)} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
