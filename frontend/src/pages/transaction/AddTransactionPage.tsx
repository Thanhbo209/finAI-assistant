import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, RotateCcw } from "lucide-react";
import { ChatContainer } from "@/components/ai-transaction/ChatContainer";
import { ChatComposer } from "@/components/ai-transaction/ChatComposer";
import { FollowUpDropup } from "@/components/ai-transaction/FollowUpDropup";
import { useChatOrchestrator } from "@/hooks/useChatOrchestrator";
import { CURRENCY_META } from "@/types/currency.types";

export default function AddTransactionPage() {
  const {
    messages,
    chatState,
    activeFollowUp,
    handleUserSend,
    handleFollowUpAnswer,
    handleFollowUpSkip,
    handleConfirm,
    handleUpdatePreviewOverrides,
    handleReset,
    sessionCurrency,
  } = useChatOrchestrator();

  const isParsing = chatState.status === "parsing";
  const isSaving = chatState.status === "saving";
  const isSuccess = chatState.status === "success";
  const isFollowup = chatState.status === "followup";
  const composerDisabled = isParsing || isSaving || isFollowup;
  const sessionMeta = CURRENCY_META[sessionCurrency];

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] -mt-2 max-w-full mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight">
              AI Transaction Assistant
            </h1>
            <p className="text-xs text-muted-foreground">
              {isParsing && "Analyzing..."}
              {isFollowup && "Gathering details..."}
              {isSaving && "Saving transaction..."}
              {isSuccess && "Transaction saved"}
              {!isParsing && !isFollowup && !isSaving && !isSuccess && "Ready"}
            </p>
          </div>
          <div
            className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary"
            title={`Session currency: ${sessionMeta.name}`}
          >
            <span>{sessionMeta.flag}</span>
            <span>{sessionCurrency}</span>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
        >
          <RotateCcw className="h-3 w-3" />
          New
        </button>
      </div>

      {/* Chat area */}
      <div className="flex-1 rounded-2xl border border-border/50 bg-muted/20 backdrop-blur-sm overflow-hidden flex flex-col shadow-sm">
        <ChatContainer
          messages={messages}
          isSaving={isSaving}
          onConfirm={() => void handleConfirm()}
          onUpdatePreviewOverrides={handleUpdatePreviewOverrides}
        />

        <AnimatePresence>
          {activeFollowUp && (
            <FollowUpDropup
              key={activeFollowUp.field}
              field={activeFollowUp.field}
              question={activeFollowUp.question}
              questionIndex={activeFollowUp.questionIndex}
              totalQuestions={activeFollowUp.totalQuestions}
              onAnswer={handleFollowUpAnswer}
              onSkip={handleFollowUpSkip}
            />
          )}
        </AnimatePresence>

        <div className="shrink-0 border-t border-border/40 bg-card/60 backdrop-blur-sm">
          <ChatComposer
            onSend={(text) => void handleUserSend(text)}
            disabled={composerDisabled}
            isLoading={isParsing}
            showNewButton={isSuccess}
            onNewConversation={handleReset}
          />
        </div>
      </div>

      <AnimatePresence>
        {messages.length <= 1 && !isParsing && (
          <motion.div
            className="flex flex-wrap font-bold justify-center gap-2 pt-3 shrink-0"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            {[
              "Starbucks coffee 5",
              "Grab airport 250000 vnd",
              "Netflix 15.99",
              "Lunch with team 120",
            ].map((ex) => (
              <button
                key={ex}
                onClick={() => void handleUserSend(ex)}
                className="rounded-full border border-border bg-card/80 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition-all font-mono"
              >
                {ex}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
