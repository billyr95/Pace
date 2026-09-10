"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { TransactionRow, type TransactionRowData } from "@/components/transaction-row";
import type { CategoryNode } from "@/components/category-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

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

  const activeFilterCount = [minAmount !== "", maxAmount !== "", categoryId !== ""].filter(Boolean).length;
  const hasActiveFilters = search !== "" || activeFilterCount > 0;

  function clearFilters() {
    setSearch("");
    setMinAmount("");
    setMaxAmount("");
    setCategoryId("");
  }

  const grouped = groupByDay(filtered);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-full border border-divider bg-surface px-3 py-2">
          <Search size={15} className="shrink-0 text-secondary" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transactions…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-secondary"
          />
        </div>

        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
          <SheetTrigger
            aria-label="Filters"
            className={`relative flex shrink-0 items-center justify-center rounded-full border p-2.5 transition ${
              activeFilterCount > 0 ? "border-brand-green bg-brand-green/10 text-brand-green" : "border-divider text-secondary"
            }`}
          >
            <SlidersHorizontal size={15} />
            {activeFilterCount > 0 && (
              <Badge className="absolute -top-1.5 -right-1.5 h-4 min-w-4 justify-center rounded-full px-1 text-[10px]">
                {activeFilterCount}
              </Badge>
            )}
          </SheetTrigger>
          <SheetContent side="bottom">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="space-y-3 px-4">
              <div className="flex items-center gap-2">
                <div className="flex-1 space-y-1">
                  <Label htmlFor="min-amount" className="text-xs text-secondary">
                    Min $
                  </Label>
                  <Input
                    id="min-amount"
                    type="number"
                    inputMode="decimal"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <Label htmlFor="max-amount" className="text-xs text-secondary">
                    Max $
                  </Label>
                  <Input
                    id="max-amount"
                    type="number"
                    inputMode="decimal"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                    placeholder="No limit"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="category-filter" className="text-xs text-secondary">
                  Category
                </Label>
                <Select value={categoryId || "all"} onValueChange={(v) => setCategoryId(v && v !== "all" ? v : "")}>
                  <SelectTrigger id="category-filter" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {flatCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {"— ".repeat(c.depth)}
                        {c.icon} {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {activeFilterCount > 0 && (
              <SheetFooter>
                <Button type="button" variant="ghost" onClick={clearFilters} className="gap-1 text-secondary">
                  <X size={12} />
                  Clear filters
                </Button>
              </SheetFooter>
            )}
          </SheetContent>
        </Sheet>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-secondary">
          {hasActiveFilters ? "No transactions match your filters." : "No transactions yet."}
        </p>
      ) : (
        Array.from(grouped.entries()).map(([day, rows]) => (
          <div key={day}>
            <h2 className="mb-2 text-xs font-semibold text-secondary">
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
