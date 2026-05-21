import { useReducer, useCallback, useRef, useState } from "react";
import { transactionApi } from "@/api/transaction.api";
import {
  artificialDelay,
  CONFIDENCE_CONFIG,
  genId,
  getConfidenceTier,
  getFollowUpQuestion,
  getMissingFields,
} from "@/types/chat";
import type { ChatMessage, ChatState, OverrideValues } from "@/types/chat";
import type { TransactionCategory } from "@/types/category";
import { useCurrency } from "@/hooks/useCurrency";
import { type CurrencyCode, SUPPORTED_CURRENCIES } from "@/types/currency.types";

// ── State ─────────────────────────────────────────────────────────────────────

interface OrchestratorState {
  messages: ChatMessage[];
  chatState: ChatState;
}

type Action =
  | { type: "ADD_MSG"; msg: ChatMessage }
  | { type: "REMOVE_MSG"; id: string }
  | { type: "SET_CHAT_STATE"; state: ChatState }
  | {
      type: "UPDATE_PREVIEW_OVERRIDES";
      messageId: string;
      overrides: OverrideValues;
    }
  | { type: "RESET" };

function reducer(state: OrchestratorState, action: Action): OrchestratorState {
  switch (action.type) {
    case "ADD_MSG":
      return { ...state, messages: [...state.messages, action.msg] };
    case "REMOVE_MSG":
      return {
        ...state,
        messages: state.messages.filter((m) => m.id !== action.id),
      };
    case "SET_CHAT_STATE":
      return { ...state, chatState: action.state };
    case "UPDATE_PREVIEW_OVERRIDES": {
      const messages = state.messages.map((message) =>
        message.type === "preview" && message.id === action.messageId
          ? { ...message, overrides: action.overrides }
          : message,
      );

      if (
        state.chatState.status === "confirming" ||
        state.chatState.status === "saving"
      ) {
        return {
          messages,
          chatState: { ...state.chatState, overrides: action.overrides },
        };
      }

      return { ...state, messages };
    }
    case "RESET":
      return { messages: [], chatState: { status: "idle" } };
    default:
      return state;
  }
}

const INITIAL: OrchestratorState = {
  messages: [
    {
      id: "welcome",
      type: "ai",
      text: 'Hi! I\'m your AI expense assistant. Describe a transaction and I\'ll parse it for you. Try something like "Starbucks coffee 5" or "Grab airport 250000 vnd".',
      timestamp: new Date(),
    },
  ],
  chatState: { status: "idle" },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function isValidCurrencyCode(value: string): value is CurrencyCode {
  return SUPPORTED_CURRENCIES.includes(value as CurrencyCode);
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useChatOrchestrator() {
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const abortRef = useRef<AbortController | null>(null);

  // Profile-level preferred currency (persisted in DB)
  const { currency: preferredCurrency } = useCurrency();

  /**
   * Session currency — starts at the user's preferred currency.
   * Gets updated each time the parser returns an explicit currency,
   * so subsequent bare-number messages inherit the last detected currency.
   *
   * Example:
   *   "grab 25000 vnd"  → session = VND
   *   "coffee 50"       → resolved as 50 VND (no explicit currency → session)
   *   "15 usd"          → resolved as 15 USD (explicit wins, session stays VND)
   */
  const [sessionCurrency, setSessionCurrency] = useState<CurrencyCode>(preferredCurrency);

  const addMsg = useCallback(
    (msg: ChatMessage) => dispatch({ type: "ADD_MSG", msg }),
    [],
  );
  const removeMsg = useCallback(
    (id: string) => dispatch({ type: "REMOVE_MSG", id }),
    [],
  );
  const setChatState = useCallback(
    (s: ChatState) => dispatch({ type: "SET_CHAT_STATE", state: s }),
    [],
  );

  // ── Send user message + trigger parse ──────────────────────────────────────
  const handleUserSend = useCallback(
    async (text: string) => {
      if (state.chatState.status === "parsing") return;

      // Cancel any in-flight request
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      // 1. Add user bubble
      addMsg({ id: genId(), type: "user", text, timestamp: new Date() });

      // 2. Show thinking bubble
      const thinkingId = genId();
      addMsg({ id: thinkingId, type: "thinking", timestamp: new Date() });
      setChatState({ status: "parsing", inputText: text });

      try {
        // 3. Parse + minimum 3s delay in parallel
        // Pass the full currency context so the backend can resolve bare numbers
        const [parseResult] = await Promise.all([
          transactionApi.parse(text, {
            activeCurrency: sessionCurrency,
            userPreferredCurrency: preferredCurrency,
          }),
          artificialDelay(3000),
        ]);

        // 4. Remove thinking bubble
        removeMsg(thinkingId);

        // 5. Update session currency from the parse result
        // If the user typed an explicit currency it wins; otherwise the result
        // currency equals whatever the context resolved to.
        if (parseResult.currency && isValidCurrencyCode(parseResult.currency)) {
          setSessionCurrency(parseResult.currency as CurrencyCode);
        }

        const tier = getConfidenceTier(parseResult.confidenceScore);
        const config = CONFIDENCE_CONFIG[tier];
        const missing = getMissingFields(parseResult);

        // 6. AI confidence message
        addMsg({
          id: genId(),
          type: "ai",
          text: config.aiMessage,
          timestamp: new Date(),
        });

        if (missing.length > 0 && tier === "low") {
          // Go into follow-up flow immediately for low confidence
          addMsg({
            id: genId(),
            type: "ai",
            text: `Let me ask you ${missing.length} quick question${missing.length > 1 ? "s" : ""} to fill in the missing details.`,
            timestamp: new Date(),
          });
          addMsg({
            id: genId(),
            type: "followup",
            question: getFollowUpQuestion(missing[0]),
            field: missing[0],
            questionIndex: 0,
            totalQuestions: missing.length,
            timestamp: new Date(),
          });
          setChatState({
            status: "followup",
            parseResult,
            overrides: {},
            pendingFields: missing,
            currentFieldIndex: 0,
          });
        } else {
          // Show preview card directly
          const overrides: OverrideValues = {};
          addMsg({
            id: genId(),
            type: "preview",
            parseResult,
            overrides,
            timestamp: new Date(),
          });

          if (missing.length > 0) {
            addMsg({
              id: genId(),
              type: "ai",
              text: `Some fields were not detected. You can edit them in the card above or save as-is.`,
              timestamp: new Date(),
            });
          }

          setChatState({ status: "confirming", parseResult, overrides });
        }
      } catch (err) {
        removeMsg(thinkingId);
        const msg =
          err instanceof Error ? err.message : "Failed to parse transaction";
        addMsg({
          id: genId(),
          type: "error",
          text: `${msg}. Please try rephrasing.`,
          timestamp: new Date(),
        });
        setChatState({ status: "idle" });
      }
    },
    [
      state.chatState.status,
      sessionCurrency,
      preferredCurrency,
      addMsg,
      removeMsg,
      setChatState,
    ],
  );

  // ── Handle follow-up answer ─────────────────────────────────────────────────
  const handleFollowUpAnswer = useCallback(
    (rawValue: string) => {
      if (state.chatState.status !== "followup") return;
      const { parseResult, overrides, pendingFields, currentFieldIndex } =
        state.chatState;
      const currentField = pendingFields[currentFieldIndex];

      // Add user bubble for the answer
      addMsg({
        id: genId(),
        type: "user",
        text: rawValue,
        timestamp: new Date(),
      });

      // Update overrides
      const newOverrides: OverrideValues = { ...overrides };
      if (currentField === "amount") {
        const parsed = parseFloat(rawValue);
        if (!isNaN(parsed)) newOverrides.amount = parsed;
      } else if (currentField === "merchant") {
        newOverrides.merchant = rawValue;
      } else if (currentField === "category") {
        newOverrides.category = rawValue as TransactionCategory;
      } else if (currentField === "date") {
        newOverrides.date = rawValue;
      }

      const nextIndex = currentFieldIndex + 1;

      if (nextIndex < pendingFields.length) {
        // Ask next question
        const nextField = pendingFields[nextIndex];
        addMsg({
          id: genId(),
          type: "followup",
          question: getFollowUpQuestion(nextField),
          field: nextField,
          questionIndex: nextIndex,
          totalQuestions: pendingFields.length,
          timestamp: new Date(),
        });
        setChatState({
          status: "followup",
          parseResult,
          overrides: newOverrides,
          pendingFields,
          currentFieldIndex: nextIndex,
        });
      } else {
        // All answered — show preview
        addMsg({
          id: genId(),
          type: "ai",
          text: "Got it. Here is the transaction summary. Ready to save?",
          timestamp: new Date(),
        });
        addMsg({
          id: genId(),
          type: "preview",
          parseResult,
          overrides: newOverrides,
          timestamp: new Date(),
        });
        setChatState({
          status: "confirming",
          parseResult,
          overrides: newOverrides,
        });
      }
    },
    [state.chatState, addMsg, setChatState],
  );

  const handleFollowUpSkip = useCallback(() => {
    if (state.chatState.status !== "followup") return;
    const { parseResult, overrides, pendingFields, currentFieldIndex } =
      state.chatState;
    const nextIndex = currentFieldIndex + 1;

    if (nextIndex < pendingFields.length) {
      const nextField = pendingFields[nextIndex];
      addMsg({
        id: genId(),
        type: "followup",
        question: getFollowUpQuestion(nextField),
        field: nextField,
        questionIndex: nextIndex,
        totalQuestions: pendingFields.length,
        timestamp: new Date(),
      });
      setChatState({
        status: "followup",
        parseResult,
        overrides,
        pendingFields,
        currentFieldIndex: nextIndex,
      });
    } else {
      addMsg({
        id: genId(),
        type: "ai",
        text: "Okay, I'll use what I have. Review and confirm when ready.",
        timestamp: new Date(),
      });
      addMsg({
        id: genId(),
        type: "preview",
        parseResult,
        overrides,
        timestamp: new Date(),
      });
      setChatState({ status: "confirming", parseResult, overrides });
    }
  }, [state.chatState, addMsg, setChatState]);

  // ── Confirm + save ──────────────────────────────────────────────────────────
  const handleConfirm = useCallback(async () => {
    if (state.chatState.status !== "confirming") return;
    const { parseResult, overrides } = state.chatState;

    setChatState({ status: "saving", parseResult, overrides });

    try {
      const finalAmount = overrides.amount ?? parseResult.amount ?? 0;
      const finalMerchant =
        (overrides.merchant ?? parseResult.merchantName)?.trim() || null;
      const finalCategory = overrides.category ?? parseResult.category ?? null;
      const finalDate =
        overrides.date ?? new Date().toISOString().split("T")[0];

      await transactionApi.create({
        parserResult: {
          amount: parseResult.amount,
          currency: parseResult.currency,
          merchantName: parseResult.merchantName,
          category: parseResult.category,
          confidenceScore: parseResult.confidenceScore,
          aiProcessed: parseResult.aiProcessed,
          parserVersion: parseResult.parserVersion,
          descriptionRaw: parseResult.descriptionRaw,
          descriptionNormalized: parseResult.descriptionNormalized,
          missingFields: parseResult.missingFields,
          followUpQuestions: parseResult.followUpQuestions,
        },
        finalValues: {
          amount: finalAmount,
          currency: parseResult.currency,
          merchantName: finalMerchant,
          category: finalCategory,
          isConfirmed: true,
          transactionDate: finalDate,
        },
      });

      addMsg({
        id: genId(),
        type: "success",
        amount: finalAmount,
        currency: parseResult.currency,
        merchant: finalMerchant,
        category: finalCategory,
        timestamp: new Date(),
      });

      setChatState({ status: "success" });
    } catch {
      addMsg({
        id: genId(),
        type: "error",
        text: " Failed to save. Please try again.",
        timestamp: new Date(),
      });
      setChatState({ status: "confirming", parseResult, overrides });
    }
  }, [state.chatState, addMsg, setChatState]);

  const handleUpdatePreviewOverrides = useCallback(
    (messageId: string, overrides: OverrideValues) => {
      dispatch({ type: "UPDATE_PREVIEW_OVERRIDES", messageId, overrides });
    },
    [],
  );

  const handleReset = useCallback(() => {
    dispatch({ type: "RESET" });
    // Reset session currency back to preferred
    setSessionCurrency(preferredCurrency);
    setTimeout(() => {
      addMsg({
        id: genId(),
        type: "ai",
        text: "New conversation started! Describe your next transaction.",
        timestamp: new Date(),
      });
    }, 50);
  }, [addMsg, preferredCurrency]);

  // ── Determine active follow-up ──────────────────────────────────────────────
  const activeFollowUp =
    state.chatState.status === "followup"
      ? {
          field:
            state.chatState.pendingFields[state.chatState.currentFieldIndex],
          question: getFollowUpQuestion(
            state.chatState.pendingFields[state.chatState.currentFieldIndex],
          ),
          questionIndex: state.chatState.currentFieldIndex,
          totalQuestions: state.chatState.pendingFields.length,
        }
      : null;

  return {
    messages: state.messages,
    chatState: state.chatState,
    activeFollowUp,
    /** Current session currency — updates after each parse */
    sessionCurrency,
    setSessionCurrency,
    handleUserSend,
    handleFollowUpAnswer,
    handleFollowUpSkip,
    handleConfirm,
    handleUpdatePreviewOverrides,
    handleReset,
  };
}
