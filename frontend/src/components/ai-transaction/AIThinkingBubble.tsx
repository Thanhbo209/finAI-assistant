import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { TypingIndicator } from "./TypingIndicator";

export function AIThinkingBubble() {
  return (
    <motion.div
      className="flex items-start gap-2.5"
      initial={{ opacity: 0, y: 10, x: -6 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {/* Avatar with pulse */}
      <motion.div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary shadow-sm shadow-primary/30 mt-0.5"
        animate={{
          boxShadow: [
            "0 0 0 0 rgba(99,102,241,0.4)",
            "0 0 0 8px rgba(99,102,241,0)",
            "0 0 0 0 rgba(99,102,241,0)",
          ],
        }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
      >
        <Sparkles className="h-3.5 w-3.5 text-white" />
      </motion.div>
      {/* Bubble */}
      <div className="rounded-2xl rounded-tl-sm bg-card border border-border/60 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border/40">
          <motion.div
            className="h-1.5 w-1.5 rounded-full bg-primary"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
          <span className="text-xs text-muted-foreground font-bold">
            Analyzing transaction…
          </span>
        </div>
        <TypingIndicator />
      </div>
    </motion.div>
  );
}
