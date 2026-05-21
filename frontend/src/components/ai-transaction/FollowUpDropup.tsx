import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORY_LABELS } from "@/types/category";
import type { TransactionCategory } from "@/types/category";
import { getFollowUpPlaceholder } from "@/types/chat";
import type { MissingField } from "@/types/chat";

const ALL_CATEGORIES = Object.entries(CATEGORY_LABELS) as [
  TransactionCategory,
  string,
][];

interface FollowUpDropupProps {
  field: MissingField;
  question: string;
  questionIndex: number;
  totalQuestions: number;
  onAnswer: (value: string) => void;
  onSkip: () => void;
}

export function FollowUpDropup({
  field,
  question,
  questionIndex,
  totalQuestions,
  onAnswer,
  onSkip,
}: FollowUpDropupProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValue("");
    // Slight delay to let animation settle
    setTimeout(() => inputRef.current?.focus(), 200);
  }, [field]);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      onSkip();
      return;
    }
    onAnswer(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape") onSkip();
  };

  return (
    <AnimatePresence>
      <motion.div
        key={field}
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.97 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className="mx-4 mb-3 rounded-2xl border border-primary/20 bg-card/95 backdrop-blur-sm shadow-xl shadow-black/10 overflow-hidden"
      >
        {/* Header bar */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-primary/5 border-b border-primary/10">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs text-primary font-semibold">{question}</span>
          <span className="ml-auto text-[10px] text-muted-foreground">
            {questionIndex + 1} of {totalQuestions}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 bg-border/40">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: `${(questionIndex / totalQuestions) * 100}%` }}
            animate={{
              width: `${((questionIndex + 1) / totalQuestions) * 100}%`,
            }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>

        {/* Input area */}
        <div className="p-3">
          {field === "category" ? (
            <Select
              onValueChange={(v) => {
                setValue(v);
                setTimeout(() => onAnswer(v), 80);
              }}
            >
              <SelectTrigger className="border-0 bg-muted/40 focus:ring-1 focus:ring-primary/40 rounded-xl h-10">
                <SelectValue placeholder={getFollowUpPlaceholder(field)} />
              </SelectTrigger>
              <SelectContent>
                {ALL_CATEGORIES.map(([val, label]) => (
                  <SelectItem key={val} value={val}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type={field === "amount" ? "number" : "text"}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={getFollowUpPlaceholder(field)}
                className="flex-1 bg-muted/40 rounded-xl px-3.5 py-2 text-sm border-0 outline-none focus:ring-1 focus:ring-primary/40 placeholder:text-muted-foreground/60 transition-shadow"
                step={field === "amount" ? "0.01" : undefined}
                min={field === "amount" ? "0" : undefined}
              />
              <button
                onClick={handleSubmit}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between mt-2 px-0.5">
            <span className="text-[10px] text-muted-foreground">
              Press Enter to confirm. Esc to skip.
            </span>
            <button
              onClick={onSkip}
              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
            >
              Skip
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
