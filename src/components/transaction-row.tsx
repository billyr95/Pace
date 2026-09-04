"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
}: {
  transaction: TransactionRowData;
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [categoryId, setCategoryId] = useState(transaction.categoryId ?? "");
  const isInflow = transaction.amount < 0;

  async function onChange(value: string) {
    setCategoryId(value);
    await fetch(`/api/transactions/${transaction.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId: value || null }),
    });
    router.refresh();
  }

  return (
    <li className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
      <span className="flex-1 min-w-0">
        <p className="truncate text-sm font-semibold">{transaction.merchantName ?? transaction.name}</p>
        <select
          value={categoryId}
          onChange={(e) => onChange(e.target.value)}
          className="mt-0.5 rounded-md border-0 bg-transparent text-xs text-brand-forest/60 outline-none"
        >
          <option value="">Uncategorized</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </span>
      <span className={`font-semibold ${isInflow ? "text-brand-green" : "text-brand-dark"}`}>
        {isInflow ? "+" : "-"}${Math.abs(transaction.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        {transaction.pending && <span className="ml-1 text-[10px] font-normal text-brand-forest/50">pending</span>}
      </span>
    </li>
  );
}
