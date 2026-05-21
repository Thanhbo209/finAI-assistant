import { describe, expect, it } from "vitest";

import { TransactionCategory } from "../../generated/prisma/index.js";
import {
  buildCategoryDisplaySummary,
  buildMerchantDisplaySummary,
  buildMonthlyDisplaySummary,
  withDisplayAmount,
  type TransactionDisplaySource,
} from "./transaction-display.js";

let nextId = 0;

function tx(
  overrides: Partial<TransactionDisplaySource> & { id?: string } = {},
): TransactionDisplaySource & { id: string } {
  const { id, ...transactionOverrides } = overrides;

  return {
    id: id ?? `tx-${nextId++}`,
    amount: 1,
    currency: "USD",
    category: TransactionCategory.FOOD_DRINK,
    merchantName: "Coffee",
    transactionDate: new Date(Date.UTC(2026, 4, 21)),
    ...transactionOverrides,
  };
}

describe("transaction display conversion", () => {
  it("adds virtual display fields without mutating the stored amount/currency", () => {
    const original = tx({ amount: 25_000, currency: "VND" });
    const displayed = withDisplayAmount(original, "USD");

    expect(displayed.id).toBe(original.id);
    expect(displayed.amount).toBe(25_000);
    expect(displayed.currency).toBe("VND");
    expect(displayed.originalAmount).toBe(25_000);
    expect(displayed.originalCurrency).toBe("VND");
    expect(displayed.displayAmount).toBeCloseTo(0.95, 2);
    expect(displayed.displayCurrency).toBe("USD");
  });

  it("does not hide or duplicate mixed-currency transactions when display currency changes", () => {
    const rows = [
      tx({ id: "vnd", amount: 25_000, currency: "VND" }),
      tx({ id: "usd", amount: 1, currency: "USD" }),
    ];

    const displayedAsUsd = rows.map((row) => withDisplayAmount(row, "USD"));
    const displayedAsVnd = rows.map((row) => withDisplayAmount(row, "VND"));

    expect(displayedAsUsd).toHaveLength(rows.length);
    expect(displayedAsVnd).toHaveLength(rows.length);
    expect(displayedAsUsd.map((row) => row.id).sort()).toEqual(["usd", "vnd"]);
    expect(displayedAsVnd.map((row) => row.id).sort()).toEqual(["usd", "vnd"]);
  });

  it("sums mixed-currency monthly totals in the selected display currency", () => {
    const rows = [
      tx({ amount: 25_000, currency: "VND" }),
      tx({ amount: 1, currency: "USD" }),
      tx({ amount: 158, currency: "JPY" }),
    ];

    const [summary] = buildMonthlyDisplaySummary(rows, "USD");

    expect(summary?.month).toBe(5);
    expect(summary?.year).toBe(2026);
    expect(summary?.transactionCount).toBe(3);
    expect(summary?.totalAmount).toBeCloseTo(2.94, 2);
    expect(summary?.currency).toBe("USD");
  });

  it("sums category totals after conversion", () => {
    const rows = [
      tx({ amount: 25_000, currency: "VND", category: TransactionCategory.FOOD_DRINK }),
      tx({ amount: 1, currency: "USD", category: TransactionCategory.FOOD_DRINK }),
      tx({ amount: 158, currency: "JPY", category: TransactionCategory.TRAVEL }),
    ];

    const summary = buildCategoryDisplaySummary(rows, "USD");
    const food = summary.find((item) => item.category === TransactionCategory.FOOD_DRINK);
    const travel = summary.find((item) => item.category === TransactionCategory.TRAVEL);

    expect(food?.totalAmount).toBeCloseTo(1.95, 2);
    expect(travel?.totalAmount).toBeCloseTo(1, 1);
    expect(food?.transactionCount).toBe(2);
    expect(travel?.transactionCount).toBe(1);
  });

  it("keeps all merchants visible after conversion and applies the requested limit", () => {
    const rows = [
      tx({ merchantName: "Coffee", amount: 25_000, currency: "VND" }),
      tx({ merchantName: "Train", amount: 1, currency: "USD" }),
      tx({ merchantName: "Books", amount: 1, currency: "EUR" }),
    ];

    const summary = buildMerchantDisplaySummary(rows, "USD", 2);

    expect(summary).toHaveLength(2);
    expect(summary[0]?.totalAmount).toBeGreaterThanOrEqual(
      summary[1]?.totalAmount ?? 0,
    );
  });
});
