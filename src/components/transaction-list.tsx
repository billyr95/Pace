"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { TransactionRow, type TransactionRowData } from "@/components/transaction-row";
import type { CategoryNode } from "@/components/category-picker";

type Row = TransactionRowData & { date: Date };
type FlatCategory = { id: string; name: string; icon: string; depth: number };

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

function flattenCategories(nodes: CategoryNode[], depth = 0): FlatCategory[] {
  return nodes.flatMap((node) => [
    { id: node.id, name: node.name, icon: node.icon, depth },
    ...flattenCategories(node.children, depth + 1),
  ]);
}

export function TransactionList({
  initialTransactions,
  categories,
}: {
  initialTransactions: Row[];
  categories: CategoryNode[];
}) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const flatCategories = useMemo(() => flattenCategories(categories), [categories]);

  function handleCategorized(targetId: string, newCategoryId: string | null, autoAppliedIds: string[]) {
    // Update local state only — no page refetch, so nothing else on the list shifts around.
    setTransactions((prev) =>
      prev.map((t) => (t.id === targetId || autoAppliedIds.includes(t.id) ? { ...t, categoryId: newCategoryId } : t)),
    );
  }

  const query = search.trim().toLowerCase();
  const min = minAmount === "" ? null : Number(minAmount);
  const max = maxAmount === "" ? null : Number(maxAmount);

  const filtered = transactions.filter((t) => {
    if (query) {
      const haystack = `${t.merchantName ?? ""} ${t.name}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    const abs = Math.abs(t.amount);
    if (min !== null && Number.isFinite(min) && abs < min) return false;
    if (max !== null && Number.isFinite(max) && abs > max) return false;
    if (categoryId && t.categoryId !== categoryId) return false;
    return true;
  });

  const hasActiveFilters = search !== "" || minAmount !== "" || maxAmount !== "" || categoryId !== "";

  function clearFilters() {
    setSearch("");
    setMinAmount("");
    setMaxAmount("");
    setCategoryId("");
  }

  const grouped = groupByDay(filtered);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-full border border-divider bg-surface px-3 py-2">
            <Search size={15} className="shrink-0 text-secondary/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search transactions…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-secondary/40"
            />
          </div>
          <button
            type="button"
            onClick={() => setFiltersOpen((o) => !o)}
            aria-label="Toggle filters"
            className={`flex shrink-0 items-center justify-center rounded-full border p-2.5 transition ${
              filtersOpen || hasActiveFilters
                ? "border-brand-green bg-brand-green/10 text-brand-green"
                : "border-divider text-secondary/60"
            }`}
          >
            <SlidersHorizontal size={15} />
          </button>
        </div>

        {filtersOpen && (
          <div className="space-y-2 rounded-2xl bg-surface p-3 shadow-sm">
            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="decimal"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                placeholder="Min $"
                className="w-full rounded-lg border border-divider bg-muted px-3 py-1.5 text-sm outline-none focus:border-brand-green"
              />
              <span className="text-secondary/40">–</span>
              <input
                type="number"
                inputMode="decimal"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                placeholder="Max $"
                className="w-full rounded-lg border border-divider bg-muted px-3 py-1.5 text-sm outline-none focus:border-brand-green"
              />
            </div>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-lg border border-divider bg-muted px-3 py-1.5 text-sm outline-none focus:border-brand-green"
            >
              <option value="">All categories</option>
              {flatCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {"— ".repeat(c.depth)}
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs font-medium text-secondary/60 underline"
              >
                <X size={12} />
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-secondary/60">No transactions match your filters.</p>
      ) : (
        Array.from(grouped.entries()).map(([day, rows]) => (
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
                  onCategorized={(catId, autoAppliedIds) => handleCategorized(t.id, catId, autoAppliedIds)}
                />
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}
