import { useMemo, useState } from "react";
import {
  AlertCircle,
  BrainCircuit,
  CalendarClock,
  Loader2,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { intelligenceApi } from "@/api/intelligence.api";
import { useIntelligence } from "@/hooks/useIntelligence";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORY_LABELS } from "@/types/category";
import type { TransactionCategory } from "@/types/category";
import type { SmartRule } from "@/types/intelligence";
import { formatCurrency, formatDate } from "@/lib/helper";
import { cn } from "@/lib/utils";

const ALL_CATEGORIES = Object.entries(CATEGORY_LABELS) as [
  TransactionCategory,
  string,
][];

export default function IntelligencePage() {
  const {
    merchantInsights,
    subscriptions,
    rules,
    isLoading,
    error,
    refresh,
  } = useIntelligence();
  const [merchantName, setMerchantName] = useState("");
  const [category, setCategory] = useState<TransactionCategory>("FOOD_DRINK");
  const [isSavingRule, setIsSavingRule] = useState(false);

  const activeRules = useMemo(
    () => rules.filter((rule) => rule.isActive).length,
    [rules],
  );

  const handleCreateRule = async () => {
    const trimmedMerchant = merchantName.trim();
    if (!trimmedMerchant) return;

    setIsSavingRule(true);
    try {
      await intelligenceApi.createRule({
        merchantName: trimmedMerchant,
        category,
        priority: 50,
      });
      setMerchantName("");
      await refresh();
    } finally {
      setIsSavingRule(false);
    }
  };

  const handleToggleRule = async (rule: SmartRule) => {
    await intelligenceApi.updateRule(rule.id, { isActive: !rule.isActive });
    await refresh();
  };

  const handleDeleteRule = async (ruleId: string) => {
    await intelligenceApi.deleteRule(ruleId);
    await refresh();
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
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
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Financial Intelligence
          </h1>
          <p className="text-sm text-muted-foreground">
            Merchant learning, recurring charges, and personalized rules
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void refresh()}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <IntelligenceStat
          icon={BrainCircuit}
          label="Merchants analyzed"
          value={merchantInsights.length}
        />
        <IntelligenceStat
          icon={CalendarClock}
          label="Recurring detected"
          value={subscriptions.length}
        />
        <IntelligenceStat icon={Sparkles} label="Active rules" value={activeRules} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Merchant Insights</CardTitle>
          </CardHeader>
          <CardContent>
            {merchantInsights.length === 0 ? (
              <EmptyIntelligence message="No merchant intelligence yet" />
            ) : (
              <div className="space-y-2">
                {merchantInsights.map((insight) => (
                  <div
                    key={`${insight.merchant.id ?? insight.merchant.name}-${insight.latestTransactionDate}`}
                    className="grid gap-3 rounded-lg border border-border/70 p-3 sm:grid-cols-[minmax(0,1fr)_auto]"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold">
                          {insight.merchant.name}
                        </p>
                        {insight.confidenceInsights.personalized && (
                          <Badge variant="secondary">personalized</Badge>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>{insight.frequency} transactions</span>
                        <span>Avg {formatCurrency(insight.averageSpend)}</span>
                        <span>
                          Confidence{" "}
                          {formatPercent(
                            insight.confidenceInsights.averageParserConfidence,
                          )}
                        </span>
                        <span>
                          {insight.confidenceInsights.correctionCount} corrections
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 sm:justify-end">
                      <TrendBadge value={insight.monthlyChangePercent} />
                      <p className="text-sm font-bold">
                        {formatCurrency(insight.totalSpend)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recurring Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            {subscriptions.length === 0 ? (
              <EmptyIntelligence message="No recurring charges detected" />
            ) : (
              <div className="space-y-2">
                {subscriptions.slice(0, 6).map((subscription) => (
                  <div
                    key={`${subscription.merchant.id ?? subscription.merchant.name}-${subscription.currency}`}
                    className="rounded-lg border border-border/70 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {subscription.merchant.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Next {formatDate(subscription.nextExpectedCharge)}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {Math.round(subscription.recurrenceConfidence * 100)}%
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{subscription.cadenceDays} day cadence</span>
                      <span className="font-semibold text-foreground">
                        {formatCurrency(
                          subscription.estimatedMonthlyCost,
                          subscription.currency,
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Smart Auto-Rules</CardTitle>
          <CardAction>
            <Badge variant="outline">{rules.length} total</Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_220px_auto]">
            <Input
              value={merchantName}
              onChange={(event) => setMerchantName(event.target.value)}
              placeholder="Merchant, e.g. Starbucks"
            />
            <Select
              value={category}
              onValueChange={(value) => setCategory(value as TransactionCategory)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_CATEGORIES.map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => void handleCreateRule()}
              disabled={!merchantName.trim() || isSavingRule}
              className="gap-2"
            >
              {isSavingRule ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Add rule
            </Button>
          </div>

          {rules.length === 0 ? (
            <EmptyIntelligence message="Create a rule to override future merchant categories" />
          ) : (
            <div className="divide-y divide-border rounded-lg border border-border/70">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className="grid gap-3 p-3 md:grid-cols-[minmax(0,1fr)_180px_auto]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {rule.merchant?.canonicalName ??
                        rule.merchantNamePattern ??
                        "Merchant rule"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Priority {rule.priority} - confidence{" "}
                      {Math.round(rule.confidence * 100)}%
                    </p>
                  </div>
                  <div className="flex items-center">
                    <Badge variant={rule.isActive ? "secondary" : "outline"}>
                      {CATEGORY_LABELS[rule.category] ?? rule.category}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 md:justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void handleToggleRule(rule)}
                    >
                      {rule.isActive ? "Disable" : "Enable"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void handleDeleteRule(rule.id)}
                      aria-label="Delete rule"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function IntelligenceStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function TrendBadge({ value }: { value: number | null }) {
  if (value === null) {
    return <Badge variant="outline">new</Badge>;
  }

  const isUp = value >= 0;
  const Icon = isUp ? TrendingUp : TrendingDown;

  return (
    <Badge
      variant="outline"
      className={cn(
        isUp
          ? "border-amber-500/30 text-amber-600"
          : "border-emerald-500/30 text-emerald-600",
      )}
    >
      <Icon className="h-3 w-3" />
      {Math.abs(value)}%
    </Badge>
  );
}

function EmptyIntelligence({ message }: { message: string }) {
  return (
    <div className="flex min-h-32 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border text-center text-sm text-muted-foreground">
      <BrainCircuit className="h-5 w-5" />
      <p>{message}</p>
    </div>
  );
}

function formatPercent(value: number | null): string {
  if (value === null) return "-";
  return `${Math.round(value * 100)}%`;
}
