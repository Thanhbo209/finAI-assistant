import { formatCompactCurrency, formatCurrency } from "@/lib/helper";
import { useCurrency } from "@/hooks/useCurrency";
import type { MonthlySummary } from "@/types/summary";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface MonthlyChartProps {
  data: MonthlySummary[];
}

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function labelMonth(monthRaw: string | number, year: number): string {
  const m = Number(monthRaw);
  if (m >= 1 && m <= 12)
    return `${MONTH_NAMES[m - 1]} '${String(year).slice(2)}`;
  // fallback: already a "YYYY-MM" string
  const parts = String(monthRaw).split("-");
  if (parts.length === 2) {
    const idx = parseInt(parts[1]) - 1;
    return `${MONTH_NAMES[idx] ?? parts[1]} '${String(year).slice(2)}`;
  }
  return String(monthRaw);
}

interface TooltipProps {
  currency: string;
  active?: boolean;
  payload?: { value: number; payload: { count: number } }[];
  label?: string;
}

function CustomTooltip({ active, payload, label, currency }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card px-3.5 py-2.5 shadow-lg text-xs">
      <p className=" mb-1 font-bold">{label}</p>
      <p className="text-primary font-bold">
        {formatCurrency(payload[0].value, currency)}
      </p>
      <p className="text-muted-primary">
        {payload[0].payload.count} transactions
      </p>
    </div>
  );
}

export function MonthlyChart({ data }: MonthlyChartProps) {
  const { currency } = useCurrency();
  const sorted = [...data].sort((a, b) => {
    const diff = Number(a.year) - Number(b.year);
    return diff !== 0 ? diff : Number(a.month) - Number(b.month);
  });

  const chartData = sorted.map((d) => ({
    label: labelMonth(d.month, d.year),
    total: d.total,
    count: d.count,
  }));

  const max = Math.max(...chartData.map((d) => d.total), 1);
  const yMax = Math.ceil(max * 1.2);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart
        data={chartData}
        margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
      >
        <defs>
          <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5ee5bc" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#5ee5bc" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="hsl(var(--border))"
          vertical={false}
        />
        <XAxis
          dataKey="label"
          tick={{
            fontSize: 11,
            fill: "hsl(var(--primary))",
            fontFamily: "inherit",
          }}
          axisLine={false}
          tickLine={false}
          dy={4}
        />

        <YAxis
          domain={[0, yMax]}
          tick={{
            fontSize: 11,
            fill: "hsl(var(--primary))",
            fontFamily: "inherit",
          }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => formatCompactCurrency(v, currency)}
          width={48}
        />
        <Tooltip
          content={<CustomTooltip currency={currency} />}
          cursor={{ stroke: "#5ee5bc", strokeWidth: 1, strokeDasharray: "4 4" }}
        />
        <Area
          type="monotone"
          dataKey="total"
          stroke="#5ee5bc"
          strokeWidth={2.5}
          fill="url(#spendGradient)"
          dot={{ fill: "#5ee5bc", r: 3.5, strokeWidth: 0 }}
          activeDot={{
            r: 5.5,
            fill: "#5ee5bc",
            stroke: "#fff",
            strokeWidth: 2,
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
