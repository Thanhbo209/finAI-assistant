import { motion } from "framer-motion";
import { Calendar, Store, Tag, DollarSign, Pencil } from "lucide-react";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { Button } from "@/components/ui/button";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "@/types/category";
import { formatCurrency, formatDate } from "@/lib/helper";
import { cn } from "@/lib/utils";
import type { ParseResult } from "@/types/transaction";
import type { OverrideValues } from "@/types/chat";

interface TransactionPreviewCardProps {
  parseResult: ParseResult;
  overrides: OverrideValues;
  onConfirm: () => void;
  onEdit: () => void;
  isSaving: boolean;
}

interface FieldRowProps {
  icon: React.ElementType;
  label: string;
  value: string | null;
  overridden?: boolean;
  original?: string | null;
  color?: string;
}

function FieldRow({
  icon: Icon,
  label,
  value,
  overridden,
  original,
  color,
}: FieldRowProps) {
  return (
    <motion.div
      className="flex items-start gap-3 py-2.5 border-b border-border/40 last:border-0"
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted/60 mt-0.5">
        <Icon className="h-3 w-3 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-0.5">
          {label}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          {value ? (
            <span
              className="text-sm font-semibold"
              style={color ? { color } : {}}
            >
              {value}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground italic">
              Not detected
            </span>
          )}
          {overridden && original && (
            <span className="text-[10px] text-muted-foreground line-through opacity-60">
              {original}
            </span>
          )}
          {overridden && (
            <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 rounded-full px-1.5 py-0.5 font-medium">
              edited
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function TransactionPreviewCard({
  parseResult,
  overrides,
  onConfirm,
  onEdit,
  isSaving,
}: TransactionPreviewCardProps) {
  const finalAmount = overrides.amount ?? parseResult.amount;
  const finalMerchant = overrides.merchant ?? parseResult.merchantName;
  const finalCategory = overrides.category ?? parseResult.category;
  const finalDate = overrides.date ?? new Date().toISOString();

  const categoryColor = finalCategory
    ? CATEGORY_COLORS[finalCategory]
    : undefined;
  const categoryLabel = finalCategory
    ? (CATEGORY_LABELS[finalCategory] ?? finalCategory)
    : null;

  const rows: FieldRowProps[] = [
    {
      icon: DollarSign,
      label: "Amount",
      value:
        finalAmount !== null
          ? formatCurrency(finalAmount, parseResult.currency)
          : null,
      overridden:
        overrides.amount !== undefined &&
        overrides.amount !== parseResult.amount,
      original:
        parseResult.amount !== null
          ? formatCurrency(parseResult.amount, parseResult.currency)
          : null,
    },
    {
      icon: Store,
      label: "Merchant",
      value: finalMerchant ?? null,
      overridden:
        !!overrides.merchant && overrides.merchant !== parseResult.merchantName,
      original: parseResult.merchantName,
    },
    {
      icon: Tag,
      label: "Category",
      value: categoryLabel,
      overridden:
        !!overrides.category && overrides.category !== parseResult.category,
      original: parseResult.category
        ? (CATEGORY_LABELS[parseResult.category] ?? parseResult.category)
        : null,
      color: categoryColor,
    },
    {
      icon: Calendar,
      label: "Date",
      value: formatDate(finalDate),
    },
  ];

  return (
    <motion.div
      className="rounded-2xl border border-border/70 bg-card shadow-md overflow-hidden"
      initial={{ opacity: 0, scale: 0.97, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border/40">
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">
            Transaction
          </p>
          <p className="text-xl font-bold">
            {finalAmount !== null
              ? formatCurrency(finalAmount, parseResult.currency)
              : "-"}
          </p>
        </div>
        <ConfidenceBadge score={parseResult.confidenceScore} showScore />
      </div>

      {/* Fields */}
      <div className="px-4 py-1">
        {rows.map((row, i) => (
          <motion.div
            key={row.label}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06, duration: 0.25 }}
          >
            <FieldRow {...row} />
          </motion.div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2 px-4 pb-4 pt-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          disabled={isSaving}
          className="flex-1 gap-1.5"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Button>
        <Button
          size="sm"
          onClick={onConfirm}
          disabled={isSaving}
          className={cn("flex-[2] gap-1.5", isSaving && "animate-pulse")}
        >
          {isSaving ? "Saving..." : "Confirm & Save"}
        </Button>
      </div>
    </motion.div>
  );
}
