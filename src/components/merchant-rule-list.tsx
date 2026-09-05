"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { CategoryPicker, type CategoryNode } from "@/components/category-picker";

export type MerchantRuleData = {
  id: string;
  merchant: string;
  direction: "in" | "out";
  categoryId: string;
};

export function MerchantRuleList({
  rules,
  categories,
}: {
  rules: MerchantRuleData[];
  categories: CategoryNode[];
}) {
  const [items, setItems] = useState(rules);

  async function updateCategory(id: string, categoryId: string | null) {
    if (!categoryId) return;
    setItems((prev) => prev.map((r) => (r.id === id ? { ...r, categoryId } : r)));
    await fetch(`/api/merchant-rules/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId }),
    });
  }

  async function remove(id: string) {
    setItems((prev) => prev.filter((r) => r.id !== id));
    await fetch(`/api/merchant-rules/${id}`, { method: "DELETE" });
  }

  if (items.length === 0) {
    return <p className="text-sm text-secondary/60">No auto-categorization rules yet.</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((rule) => (
        <li key={rule.id} className="flex items-center gap-2 rounded-2xl bg-surface p-3 shadow-sm">
          <span className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold capitalize">{rule.merchant}</p>
            <p className="text-xs text-secondary/50">{rule.direction === "in" ? "Money in" : "Money out"}</p>
          </span>
          <CategoryPicker
            categories={categories}
            value={rule.categoryId}
            onChange={(categoryId) => updateCategory(rule.id, categoryId)}
          />
          <button
            type="button"
            onClick={() => remove(rule.id)}
            aria-label="Delete rule"
            className="shrink-0 rounded-full p-1.5 text-secondary/50 hover:bg-muted hover:text-secondary"
          >
            <X size={14} />
          </button>
        </li>
      ))}
    </ul>
  );
}
