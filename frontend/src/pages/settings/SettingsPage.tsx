import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings2, Check, Loader2 } from "lucide-react";
import { CurrencyPicker } from "@/components/ui/CurrencyPicker";
import { useCurrency } from "@/hooks/useCurrency";
import { type CurrencyCode, CURRENCY_META } from "@/types/currency.types";

export default function SettingsPage() {
  const { currency, setCurrency, isSaving } = useCurrency();
  const [localSelected, setLocalSelected] = useState<CurrencyCode>(currency);
  const [saved, setSaved] = useState(false);

  const hasChanged = localSelected !== currency;

  const handleSave = async () => {
    if (!hasChanged || isSaving) return;
    await setCurrency(localSelected);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const currentMeta = CURRENCY_META[currency];
  const selectedMeta = CURRENCY_META[localSelected];

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
          <Settings2 className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Settings</h1>
          <p className="text-xs text-muted-foreground">
            Manage your account preferences
          </p>
        </div>
      </div>

      {/* Currency section */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
        {/* Section header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-base">Default Currency</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Used for all bare-number amounts (e.g.{" "}
              <code className="bg-muted px-1 py-0.5 rounded text-[10px] font-mono">
                coffee 50
              </code>
              )
            </p>
          </div>

          {/* Current badge */}
          <div className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5">
            <span className="text-sm">{currentMeta.flag}</span>
            <span className="text-xs font-semibold text-primary">
              {currency}
            </span>
          </div>
        </div>

        <CurrencyPicker
          value={localSelected}
          onChange={setLocalSelected}
          variant="grid"
        />

        {/* Impact note */}
        <AnimatePresence>
          {hasChanged && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-700 dark:text-amber-300">
                <span className="font-semibold">Heads up:</span> Changing to{" "}
                <span className="font-mono font-bold">
                  {selectedMeta.flag} {localSelected}
                </span>{" "}
                will convert dashboard totals and transaction display amounts.
                Original transaction amounts remain stored in their original
                currency.
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Save button */}
        <div className="flex items-center justify-end gap-3 pt-1">
          <AnimatePresence>
            {saved && (
              <motion.p
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium"
              >
                <Check className="h-3.5 w-3.5" />
                Saved!
              </motion.p>
            )}
          </AnimatePresence>

          <button
            id="save-currency-btn"
            onClick={() => void handleSave()}
            disabled={!hasChanged || isSaving}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 active:scale-95"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Saving...
              </>
            ) : (
              "Save changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
