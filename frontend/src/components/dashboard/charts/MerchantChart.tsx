import { formatCurrency } from "@/lib/helper";
import { useCurrency } from "@/hooks/useCurrency";
import type { MerchantSummary } from "@/types/summary";

interface MerchantChartProps {
  data: MerchantSummary[];
}

const BAR_COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe"];

export function MerchantChart({ data }: MerchantChartProps) {
  const { currency } = useCurrency();
  const top5 = [...data].sort((a, b) => b.total - a.total).slice(0, 5);

  if (top5.length === 0) return null;

  const maxTotal = top5[0].total;

  return (
    <div className="space-y-3 py-2">
      {top5.map((d, i) => {
        const pct = maxTotal > 0 ? (d.total / maxTotal) * 100 : 0;
        const name = d.merchantName ?? "Unknown";
        return (
          <div key={i} className="flex items-center gap-3">
            {/* Rank */}
            <span className="text-xs font-bold text-muted-foreground/60 w-4 shrink-0 text-right">
              {i + 1}
            </span>
            {/* Name + bar */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium truncate">{name}</span>
                <span className="text-xs font-bold text-foreground ml-2 shrink-0">
                  {formatCurrency(d.total, currency)}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    background: BAR_COLORS[i],
                  }}
                />
              </div>
            </div>
            {/* Tx count */}
            <span className="text-[10px] text-muted-foreground shrink-0 w-12 text-right">
              {d.count} tx
            </span>
          </div>
        );
      })}
    </div>
  );
}
