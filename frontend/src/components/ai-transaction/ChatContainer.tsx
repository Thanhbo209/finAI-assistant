import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AIBubble } from "./AIBubble";
import { UserBubble } from "./UserBubble";
import { AIThinkingBubble } from "./AIThinkingBubble";
import { TransactionPreviewCard } from "./TransactionPreviewCard";
import { TransactionSuccess } from "./TransactionSuccess";
import type { ChatMessage, OverrideValues } from "@/types/chat";
import type { TransactionCategory } from "@/types/category";

interface ChatContainerProps {
  messages: ChatMessage[];
  isSaving: boolean;
  onConfirm: () => void;
  onUpdatePreviewOverrides: (
    messageId: string,
    overrides: OverrideValues,
  ) => void;
}

export function ChatContainer({
  messages,
  isSaving,
  onConfirm,
  onUpdatePreviewOverrides,
}: ChatContainerProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 scrollbar-thin">
      <AnimatePresence initial={false}>
        {messages.map((msg) => {
          switch (msg.type) {
            case "user":
              return (
                <motion.div key={msg.id} layout>
                  <UserBubble text={msg.text} />
                </motion.div>
              );

            case "ai":
              return (
                <motion.div key={msg.id} layout>
                  <AIBubble>
                    <span className="text-foreground">{msg.text}</span>
                  </AIBubble>
                </motion.div>
              );

            case "thinking":
              return (
                <motion.div key={msg.id} layout>
                  <AIThinkingBubble />
                </motion.div>
              );

            case "preview":
              return (
                <motion.div
                  key={msg.id}
                  layout
                  className="flex items-start gap-2.5"
                >
                  {/* AI avatar placeholder to align card with bubbles */}
                  <div className="h-7 w-7 shrink-0" />
                  <div className="flex-1 max-w-sm">
                    <TransactionPreviewCard
                      parseResult={msg.parseResult}
                      overrides={msg.overrides}
                      onConfirm={onConfirm}
                      onUpdateOverrides={(overrides) =>
                        onUpdatePreviewOverrides(msg.id, overrides)
                      }
                      isSaving={isSaving}
                    />
                  </div>
                </motion.div>
              );

            case "success": {
              const s = msg as Extract<ChatMessage, { type: "success" }>;
              return (
                <motion.div key={msg.id} layout>
                  <TransactionSuccess
                    amount={s.amount}
                    currency={s.currency}
                    merchant={s.merchant}
                    category={s.category as TransactionCategory | null}
                  />
                </motion.div>
              );
            }

            case "error":
              return (
                <motion.div key={msg.id} layout>
                  <AIBubble className="border-destructive/30 bg-destructive/10">
                    <span className="text-destructive text-sm">{msg.text}</span>
                  </AIBubble>
                </motion.div>
              );

            default:
              return null;
          }
        })}
      </AnimatePresence>
      <div ref={bottomRef} />
    </div>
  );
}
