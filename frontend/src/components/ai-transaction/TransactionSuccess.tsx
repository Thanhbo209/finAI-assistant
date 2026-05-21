import { formatCurrency } from "@/lib/helper";
import { CATEGORY_LABELS } from "@/types/category";
import type { TransactionCategory } from "@/types/category";
import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface TransactionSuccessProps {
  amount: number;
  currency: string;
  merchant: string | null;
  category: TransactionCategory | null;
}

export function TransactionSuccess({
  amount,
  currency,
  merchant,
  category,
}: TransactionSuccessProps) {
  return (
    <motion.div
      className="flex items-start gap-2.5 max-w-[90%]"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/30 mt-0.5">
        <CheckCircle2 className="h-3.5 w-3.5 text-white" />
      </div>
      <div className="space-y-2">
        <div className="rounded-2xl rounded-tl-sm bg-emerald-500/10 border border-emerald-500/20 px-4 py-3">
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-0.5">
            Transaction saved!
          </p>
          <p className="text-xs text-emerald-600/80 dark:text-emerald-500/80">
            {formatCurrency(amount, currency)}
            {merchant && ` at ${merchant}`}
            {category && ` - ${CATEGORY_LABELS[category] ?? category}`}
          </p>
        </div>
        <Link
          to="/dashboard/transactions"
          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium pl-1"
        >
          View all transactions
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </motion.div>
  );
}
