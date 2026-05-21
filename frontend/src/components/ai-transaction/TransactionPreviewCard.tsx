import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Store, Tag, DollarSign, Pencil } from "lucide-react";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "@/types/category";
import { formatCurrency, formatDate, formatDateInput } from "@/lib/helper";
import { cn } from "@/lib/utils";
import type { ParseResult } from "@/types/transaction";
import type { OverrideValues } from "@/types/chat";
import type { TransactionCategory } from "@/types/category";

const ALL_CATEGORIES = Object.entries(CATEGORY_LABELS) as [
  TransactionCategory,
  string,
][];

interface TransactionPreviewCardProps {
  parseResult: ParseResult;
  overrides: OverrideValues;
  onConfirm: () => void;
  onUpdateOverrides: (overrides: OverrideValues) => void;
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
  onUpdateOverrides,
  isSaving,
}: TransactionPreviewCardProps) {
  const finalAmount = overrides.amount ?? parseResult.amount;
  const finalMerchant = overrides.merchant ?? parseResult.merchantName;
  const finalCategory = overrides.category ?? parseResult.category;
  const finalDate = overrides.date ?? new Date().toISOString();
  const [isEditing, setIsEditing] = useState(false);
  const [draftAmount, setDraftAmount] = useState("");
  const [draftMerchant, setDraftMerchant] = useState("");
  const [draftCategory, setDraftCategory] = useState<TransactionCategory | "">(
    "",
  );
  const [draftDate, setDraftDate] = useState("");

  const categoryColor = finalCategory
    ? CATEGORY_COLORS[finalCategory]
    : undefined;
  const categoryLabel = finalCategory
    ? (CATEGORY_LABELS[finalCategory] ?? finalCategory)
    : null;
  const categorySuggestion = parseResult.intelligence?.categorySuggestion;
  const aiSuggestion = parseResult.intelligence?.aiSuggestion;
  const merchantResolved = Boolean(parseResult.intelligence?.merchantId);

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
        overrides.merchant !== undefined &&
        overrides.merchant !== parseResult.merchantName,
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
      overridden: overrides.date !== undefined,
    },
  ];

  const amountValue = parseFloat(draftAmount);
  const hasInvalidAmount =
    draftAmount.trim() !== "" && Number.isNaN(amountValue);

  const handleStartEdit = () => {
    setDraftAmount(finalAmount !== null ? String(finalAmount) : "");
    setDraftMerchant(finalMerchant ?? "");
    setDraftCategory(finalCategory ?? "");
    setDraftDate(formatDateInput(finalDate));
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setDraftAmount(finalAmount !== null ? String(finalAmount) : "");
    setDraftMerchant(finalMerchant ?? "");
    setDraftCategory(finalCategory ?? "");
    setDraftDate(formatDateInput(finalDate));
    setIsEditing(false);
  };

  const handleSaveEdit = () => {
    if (hasInvalidAmount) return;

    const nextOverrides: OverrideValues = {};
    if (draftAmount.trim() !== "") {
      nextOverrides.amount = amountValue;
    }
    nextOverrides.merchant = draftMerchant.trim();
    if (draftCategory) {
      nextOverrides.category = draftCategory;
    }
    if (draftDate) {
      nextOverrides.date = draftDate;
    }

    onUpdateOverrides(nextOverrides);
    setIsEditing(false);
  };

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

      {(categorySuggestion || aiSuggestion || merchantResolved) && (
        <div className="flex flex-wrap gap-1.5 border-b border-border/40 px-4 py-2">
          {merchantResolved && <Badge variant="outline">merchant resolved</Badge>}
          {categorySuggestion && (
            <Badge variant="secondary">
              {formatSuggestionSource(categorySuggestion.source)}
            </Badge>
          )}
          {aiSuggestion && (
            <Badge variant="outline">
              AI assisted {Math.round(aiSuggestion.confidence * 100)}%
            </Badge>
          )}
        </div>
      )}

      {/* Fields */}
      <div className="px-4 py-1">
        {isEditing ? (
          <motion.div
            className="space-y-3 py-3"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="grid gap-1.5">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                Amount
              </label>
              <Input
                type="number"
                step="0.01"
                inputMode="decimal"
                value={draftAmount}
                onChange={(event) => setDraftAmount(event.target.value)}
                placeholder="0.00"
                aria-invalid={hasInvalidAmount}
              />
            </div>

            <div className="grid gap-1.5">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                Merchant
              </label>
              <Input
                value={draftMerchant}
                onChange={(event) => setDraftMerchant(event.target.value)}
                placeholder="e.g. Starbucks"
              />
            </div>

            <div className="grid gap-1.5">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                Category
              </label>
              <Select
                value={draftCategory}
                onValueChange={(value) =>
                  setDraftCategory(value as TransactionCategory)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {ALL_CATEGORIES.map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                Date
              </label>
              <Input
                type="date"
                value={draftDate}
                onChange={(event) => setDraftDate(event.target.value)}
              />
            </div>
          </motion.div>
        ) : (
          rows.map((row, i) => (
            <motion.div
              key={row.label}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06, duration: 0.25 }}
            >
              <FieldRow {...row} />
            </motion.div>
          ))
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 px-4 pb-4 pt-3">
        {isEditing ? (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancelEdit}
              disabled={isSaving}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveEdit}
              disabled={isSaving || hasInvalidAmount}
              className="flex-[2]"
            >
              Save changes
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleStartEdit}
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
          </>
        )}
      </div>
    </motion.div>
  );
}

function formatSuggestionSource(source: string): string {
  switch (source) {
    case "SMART_RULE":
      return "smart rule";
    case "USER_PREFERENCE":
      return "personalized";
    case "MERCHANT_TENDENCY":
      return "merchant tendency";
    default:
      return "suggested";
  }
}
