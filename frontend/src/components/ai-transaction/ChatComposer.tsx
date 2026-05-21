import { useState, useRef, type KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { Send, Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatComposerProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
  onNewConversation?: () => void;
  showNewButton?: boolean;
}

export function ChatComposer({
  onSend,
  disabled,
  isLoading,
  onNewConversation,
  showNewButton,
}: ChatComposerProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled || isLoading) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  return (
    <div className="px-4 pb-4 pt-2">
      <motion.div
        className={cn(
          "flex items-end gap-2 rounded-2xl border bg-card shadow-lg shadow-black/5 transition-all",
          disabled
            ? "opacity-60"
            : "border-border/70 focus-within:border-primary/40 focus-within:shadow-primary/10 focus-within:shadow-lg",
        )}
        layout
      >
        {showNewButton && (
          <button
            onClick={onNewConversation}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl m-1.5 bg-muted hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            title="New transaction"
          >
            <Plus className="h-4 w-4" />
          </button>
        )}

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            handleInput();
          }}
          onKeyDown={handleKeyDown}
          placeholder="Describe your expense… e.g. 'Starbucks coffee 5'"
          rows={1}
          disabled={disabled}
          className={cn(
            "flex-1 resize-none bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground/60",
            !showNewButton && "pl-4",
            "min-h-[44px] max-h-[120px]",
          )}
        />

        <button
          onClick={handleSend}
          disabled={!value.trim() || disabled || isLoading}
          className={cn(
            "flex h-9 w-9 shrink-0 m-1.5 items-center justify-center rounded-xl transition-all",
            value.trim() && !disabled && !isLoading
              ? "bg-primary text-white hover:bg-primary/90 shadow-sm"
              : "bg-muted text-muted-foreground cursor-not-allowed",
          )}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </motion.div>

      {/* Hint */}
      <p className="text-center text-[10px] text-muted-foreground/60 mt-2">
        Enter to send · Shift+Enter for newline
      </p>
    </div>
  );
}
