import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
interface AIBubbleProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function AIBubble({ children, className, delay = 0 }: AIBubbleProps) {
  return (
    <motion.div
      className="flex items-start gap-2.5 max-w-[85%]"
      initial={{ opacity: 0, y: 10, x: -6 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      transition={{ duration: 0.1, ease: "easeOut", delay }}
    >
      {/* Avatar */}
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary shadow-sm shadow-primary/30 mt-0.5">
        <Sparkles className="h-3.5 w-3.5 text-background" />
      </div>
      {/* Bubble */}
      <div
        className={cn(
          "rounded-2xl font-bold rounded-tl-sm bg-card border border-border/60 px-4 py-3 text-sm leading-relaxed shadow-sm",
          className,
        )}
      >
        {children}
      </div>
    </motion.div>
  );
}
