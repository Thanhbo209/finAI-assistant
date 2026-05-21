import { Link } from "react-router-dom";
import { BrainCircuit, CalendarClock, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useIntelligence } from "@/hooks/useIntelligence";
import { formatCurrency, formatDate } from "@/lib/helper";

export function IntelligenceCards() {
  const { merchantInsights, subscriptions, rules, isLoading } = useIntelligence();
  const topInsight = merchantInsights[0];
  const topSubscription = subscriptions[0];
  const activeRules = rules.filter((rule) => rule.isActive).length;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-bold">
            <BrainCircuit className="h-4 w-4 text-primary" />
            Merchant Intelligence
          </CardTitle>
          <CardAction>
            <Link
              to="/dashboard/intelligence"
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Open
              <ChevronRight className="h-3 w-3" />
            </Link>
          </CardAction>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <SkeletonLine />
          ) : topInsight ? (
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {topInsight.merchant.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {topInsight.frequency} transactions - avg{" "}
                    {formatCurrency(topInsight.averageSpend)}
                  </p>
                </div>
                <p className="text-sm font-bold">
                  {formatCurrency(topInsight.totalSpend)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {topInsight.confidenceInsights.personalized && (
                  <Badge variant="secondary">personalized</Badge>
                )}
                <Badge variant="outline">
                  {topInsight.confidenceInsights.correctionCount} corrections
                </Badge>
                <Badge variant="outline">{activeRules} active rules</Badge>
              </div>
            </div>
          ) : (
            <EmptyText text="No merchant learning yet" />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-bold">
            <CalendarClock className="h-4 w-4 text-primary" />
            Subscription Signals
          </CardTitle>
          <CardAction>
            <Badge variant="outline">{subscriptions.length} detected</Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <SkeletonLine />
          ) : topSubscription ? (
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {topSubscription.merchant.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Next charge {formatDate(topSubscription.nextExpectedCharge)}
                  </p>
                </div>
                <p className="text-sm font-bold">
                  {formatCurrency(
                    topSubscription.estimatedMonthlyCost,
                    topSubscription.currency,
                  )}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  {Math.round(topSubscription.recurrenceConfidence * 100)}%
                  confidence
                </Badge>
                <Badge variant="outline">
                  {topSubscription.cadenceDays} day cadence
                </Badge>
              </div>
            </div>
          ) : (
            <EmptyText text="No recurring patterns detected" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SkeletonLine() {
  return <div className="h-16 animate-pulse rounded-lg bg-muted" />;
}

function EmptyText({ text }: { text: string }) {
  return (
    <div className="flex h-16 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
      {text}
    </div>
  );
}
