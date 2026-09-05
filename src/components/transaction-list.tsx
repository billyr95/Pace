"use client";

import { useState } from "react";
import { TransactionRow, type TransactionRowData } from "@/components/transaction-row";
import type { CategoryNode } from "@/components/category-picker";

type Row = TransactionRowData & { date: Date };

function groupByDay(transactions: Row[]) {
  const groups = new Map<string, Row[]>();
  for (const t of transactions) {
    const key = t.date.toISOString().slice(0, 10);
    const list = groups.get(key) ?? [];
    list.push(t);
    groups.set(key, list);
  }
  return groups;
}

export function TransactionList({
  initialTransactions,
  categories,
}: {
  initialTransactions: Row[];
  categories: CategoryNode[];
}) {
  const [transactions, setTransactions] = useState(initialTransactions);

  function handleCategorized(targetId: string, categoryId: string | null, autoAppliedIds: string[]) {
    // Update local state only — no page refetch, so nothing else on the list shifts around.
    setTransactions((prev) =>
      prev.map((t) => (t.id === targetId || autoAppliedIds.includes(t.id) ? { ...t, categoryId } : t)),
    );
  }

  const grouped = groupByDay(transactions);

  return (
    <>
      {Array.from(grouped.entries()).map(([day, rows]) => (
        <div key={day}>
          <h2 className="mb-2 text-xs font-semibold text-secondary/50">
            {new Date(day).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
          </h2>
          <ul className="space-y-2">
            {rows.map((t) => (
              <TransactionRow
                key={t.id}
                transaction={t}
                categories={categories}
                onCategorized={(categoryId, autoAppliedIds) => handleCategorized(t.id, categoryId, autoAppliedIds)}
              />
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}
