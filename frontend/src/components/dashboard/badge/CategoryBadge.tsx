import { Badge } from "@/components/ui/badge";
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
} from "@/types/category";
import type { TransactionCategory } from "@/types/category";

interface CategoryBadgeProps {
  category: TransactionCategory | null;
}

export function CategoryBadge({ category }: CategoryBadgeProps) {
  if (!category) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Uncategorized
      </Badge>
    );
  }

  const color = CATEGORY_COLORS[category];
  const label = CATEGORY_LABELS[category] ?? category;

  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{
        background: `${color}18`,
        color,
        border: `1px solid ${color}40`,
      }}
    >
      {label}
    </span>
  );
}
