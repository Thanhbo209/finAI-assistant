import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type CurrencyCode,
  CURRENCY_META,
  SUPPORTED_CURRENCIES,
} from "@/types/currency.types";

interface CurrencyPickerProps {
  value: CurrencyCode | null;
  onChange: (code: CurrencyCode) => void;
  /** Layout variant — 'grid' for settings, 'large' for onboarding */
  variant?: "grid" | "large";
}

export function CurrencyPicker({
  value,
  onChange,
  variant = "grid",
}: CurrencyPickerProps) {
  return (
    <div
      className={cn(
        "grid gap-3",
        variant === "large"
          ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
      )}
    >
      {SUPPORTED_CURRENCIES.map((code, i) => {
        const meta = CURRENCY_META[code];
        const isSelected = value === code;

        return (
          <motion.button
            key={code}
            id={`currency-option-${code}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.3 }}
            onClick={() => onChange(code)}
            className={cn(
              "relative flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all duration-200 cursor-pointer",
              "hover:border-primary/60 hover:bg-primary/5 hover:scale-[1.02]",
              isSelected
                ? "border-primary bg-primary/10 shadow-lg shadow-primary/20 scale-[1.02]"
                : "border-border bg-card/60",
              variant === "large" && "p-6 gap-3",
            )}
          >
            {/* Selected indicator */}
            {isSelected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-2.5 right-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary"
              >
                <Check className="h-3 w-3 text-white" />
              </motion.div>
            )}

            {/* Flag */}
            <span
              className={cn(
                "select-none",
                variant === "large" ? "text-4xl" : "text-2xl",
              )}
            >
              {meta.flag}
            </span>

            {/* Symbol */}
            <span
              className={cn(
                "font-bold tabular-nums",
                variant === "large" ? "text-2xl" : "text-lg",
                isSelected ? "text-primary" : "text-foreground",
              )}
            >
              {meta.symbol}
            </span>

            {/* Code + Name */}
            <div className="text-center">
              <p
                className={cn(
                  "font-semibold text-sm",
                  isSelected ? "text-primary" : "text-foreground",
                )}
              >
                {code}
              </p>
              {variant === "large" && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {meta.name}
                </p>
              )}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
