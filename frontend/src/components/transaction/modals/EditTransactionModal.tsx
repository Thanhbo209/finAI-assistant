import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { transactionApi } from "@/api/transaction.api";
import { CATEGORY_LABELS } from "@/types/category";
import type { TransactionCategory } from "@/types/category";
import type { Transaction } from "@/types/transaction";
import { formatDateInput } from "@/lib/helper";

const ALL_CATEGORIES = Object.entries(CATEGORY_LABELS) as [
  TransactionCategory,
  string,
][];

interface EditTransactionModalProps {
  transaction: Transaction | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function EditTransactionModal({
  transaction,
  open,
  onClose,
  onSaved,
}: EditTransactionModalProps) {
  const [amount, setAmount] = useState("");
  const [merchantName, setMerchantName] = useState("");
  const [category, setCategory] = useState<TransactionCategory | "">("");
  const [date, setDate] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (transaction) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAmount(transaction.amount);
      setMerchantName(transaction.merchantName ?? "");
      setCategory(transaction.category ?? "");
      setDate(formatDateInput(transaction.transactionDate));
    }
  }, [transaction]);

  const handleSave = async () => {
    if (!transaction) return;
    setIsSaving(true);
    setError(null);
    try {
      await transactionApi.update(transaction.id, {
        amount: parseFloat(amount),
        merchantName: merchantName || null,
        category: category || null,
        transactionDate: date,
      });
      onSaved();
      onClose();
    } catch {
      setError("Failed to update transaction");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="space-y-1.5">
            <Label>Amount</Label>
            <Input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Merchant</Label>
            <Input
              value={merchantName}
              onChange={(e) => setMerchantName(e.target.value)}
              placeholder="e.g. Starbucks"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as TransactionCategory)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {ALL_CATEGORIES.map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={() => void handleSave()} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
