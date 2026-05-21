import { formatCurrency } from "@/lib/helper";
import { useCurrency } from "@/hooks/useCurrency";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "@/types/category";
import type { CategorySummary } from "@/types/summary";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface CategoryChartProps {
  data: CategorySummary[];
}

interface TooltipProps {
  currency: string;
  active?: boolean;
  payload?: {
    payload: {
      label: string;
      value: number;
      percentage: number;
      color: string;
    };
  }[];
}

function CustomTooltip({ active, payload, currency }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-xl border border-border bg-card px-3.5 py-2.5 shadow-lg text-xs">
      <div className="flex items-center gap-2 mb-1">
        <span
          className="h-2 w-2 rounded-full"
          style={{ background: d.color }}
        />
        <span className="font-semibold text-foreground">{d.label}</span>
      </div>
      <p className="font-bold text-foreground">
        {formatCurrency(d.value, currency)}
      </p>
      <p className="text-muted-foreground">
        {d.percentage.toFixed(1)}% of total
      </p>
    </div>
  );
}

interface LegendItemProps {
  currency: string;
  label: string;
  color: string;
  value: number;
  percentage: number;
}

function LegendItem({
  label,
  color,
  value,
  percentage,
  currency,
}: LegendItemProps) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-1.5 min-w-0">
        <span
          className="h-2 w-2 rounded-full shrink-0"
          style={{ background: color }}
        />
        <span className="text-muted-foreground truncate">{label}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="font-medium text-foreground">
          {formatCurrency(value, currency)}
        </span>
        <span className="text-muted-foreground/60 w-10 text-right">
          {percentage.toFixed(0)}%
        </span>
      </div>
    </div>
  );
}

export function CategoryChart({ data }: CategoryChartProps) {
  const { currency } = useCurrency();
  const sorted = [...data].sort((a, b) => b.total - a.total);

  const chartData = sorted.map((d) => ({
    label: CATEGORY_LABELS[d.category] ?? d.category,
    value: d.total,
    percentage: d.percentage,
    color: CATEGORY_COLORS[d.category] ?? "#94a3b8",
  }));

  // Show top 5 in pie, rest as "Other"
  const top5 = chartData.slice(0, 5);
  const rest = chartData.slice(5);
  const restTotal = rest.reduce((s, d) => s + d.value, 0);
  const restPct = rest.reduce((s, d) => s + d.percentage, 0);
  const pieData =
    restTotal > 0
      ? [
          ...top5,
          {
            label: "Other",
            value: restTotal,
            percentage: restPct,
            color: "#94a3b8",
          },
        ]
      : top5;

  return (
    <div className="space-y-3">
      <ResponsiveContainer width="100%" height={160}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={48}
            outerRadius={72}
            paddingAngle={2}
            dataKey="value"
            strokeWidth={0}
          >
            {pieData.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip currency={currency} />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Custom legend below */}
      <div className="space-y-1.5 px-1">
        {pieData.map((d) => (
          <LegendItem
            key={d.label}
            currency={currency}
            label={d.label}
            color={d.color}
            value={d.value}
            percentage={d.percentage}
          />
        ))}
      </div>
    </div>
  );
}
