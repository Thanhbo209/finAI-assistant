import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { CurrencyPicker } from "@/components/ui/CurrencyPicker";
import { useCurrency } from "@/hooks/useCurrency";
import { type CurrencyCode, CURRENCY_META } from "@/types/currency.types";

export default function CurrencyOnboardingPage() {
  const navigate = useNavigate();
  const { setCurrency, isSaving } = useCurrency();
  const [selected, setSelected] = useState<CurrencyCode | null>(null);

  const handleConfirm = async () => {
    if (!selected || isSaving) return;
    await setCurrency(selected);
    navigate("/dashboard", { replace: true });
  };

  const selectedMeta = selected ? CURRENCY_META[selected] : null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-violet-500/8 blur-3xl" />
      </div>

      <motion.div
        className="relative z-10 w-full max-w-2xl px-6 py-12"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo + heading */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 mb-5 mx-auto">
            <Wallet className="h-8 w-8 text-primary" />
          </div>

          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-primary uppercase tracking-widest">
              One-time setup
            </span>
            <Sparkles className="h-4 w-4 text-primary" />
          </div>

          <h1 className="text-3xl font-bold tracking-tight mb-3">
            Choose your currency
          </h1>
          <p className="text-muted-foreground max-w-sm mx-auto text-sm leading-relaxed">
            All expenses without an explicit currency will use this as the
            default. You can change it anytime in{" "}
            <span className="text-foreground font-medium">Settings</span>.
          </p>
        </div>

        {/* Picker */}
        <div className="mb-8">
          <CurrencyPicker
            value={selected}
            onChange={setSelected}
            variant="large"
          />
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center gap-3">
          <AnimatePresence>
            {selected && (
              <motion.p
                key="hint"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="text-sm text-muted-foreground"
              >
                Bare amounts like{" "}
                <code className="text-foreground font-mono bg-muted px-1.5 py-0.5 rounded text-xs">
                  coffee 50
                </code>{" "}
                will be tracked as{" "}
                <span className="text-foreground font-semibold">
                  {selectedMeta?.symbol}50 {selected}
                </span>
              </motion.p>
            )}
          </AnimatePresence>

          <motion.button
            id="confirm-currency-btn"
            whileHover={{ scale: selected ? 1.02 : 1 }}
            whileTap={{ scale: selected ? 0.98 : 1 }}
            onClick={() => void handleConfirm()}
            disabled={!selected || isSaving}
            className="flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Let&apos;s go
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
