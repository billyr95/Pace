"use client";

import { useState } from "react";
import { CategoryPicker, type CategoryNode } from "@/components/category-picker";

export type TransactionRowData = {
  id: string;
  name: string;
  merchantName: string | null;
  amount: number;
  pending: boolean;
  categoryId: string | null;
};

export function TransactionRow({
  transaction,
  categories,
  onCategorized,
}: {
  transaction: TransactionRowData;
  categories: CategoryNode[];
  onCategorized: (categoryId: string | null, autoAppliedIds: string[]) => void;
}) {
  const [autoAppliedCount, setAutoAppliedCount] = useState(0);
  const isInflow = transaction.amount < 0;

  async function onChange(categoryId: string | null) {
    const res = await fetch(`/api/transactions/${transaction.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId }),
    });
    const body = await res.json().catch(() => ({}));
    const autoAppliedIds: string[] = body.autoAppliedIds ?? [];
    setAutoAppliedCount(autoAppliedIds.length);
    onCategorized(categoryId, autoAppliedIds);
  }

  return (
    <li className="flex items-center gap-3 rounded-2xl bg-surface p-3 shadow-sm">
      <span className="flex-1 min-w-0">
        <p className="truncate text-sm font-semibold">{transaction.merchantName ?? transaction.name}</p>
        <div className="mt-1">
          <CategoryPicker categories={categories} value={transaction.categoryId} onChange={onChange} />
        </div>
        {autoAppliedCount > 0 && (
          <p className="mt-1 text-[11px] text-brand-green">
            Also applied to {autoAppliedCount} other matching transaction{autoAppliedCount === 1 ? "" : "s"}
          </p>
        )}
      </span>
      <span className="shrink-0 text-right">
        <p className={`font-semibold ${isInflow ? "text-brand-green" : "text-ink"}`}>
          {isInflow ? "+" : "-"}${Math.abs(transaction.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </p>
        {transaction.pending && <p className="text-[10px] font-normal text-secondary/50">pending</p>}
      </span>
    </li>
  );
}
