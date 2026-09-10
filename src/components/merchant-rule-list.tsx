"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { CategoryPicker, type CategoryNode } from "@/components/category-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export type MerchantRuleData = {
  id: string;
  merchant: string;
  direction: "in" | "out";
  categoryId: string;
};

function buildTopLevelIndex(categories: CategoryNode[]): Map<string, { name: string; icon: string }> {
  const index = new Map<string, { name: string; icon: string }>();
  function walk(node: CategoryNode, top: { name: string; icon: string }) {
    index.set(node.id, top);
    for (const child of node.children) walk(child, top);
  }
  for (const root of categories) walk(root, { name: root.name, icon: root.icon });
  return index;
}

export function MerchantRuleList({
  rules,
  categories,
}: {
  rules: MerchantRuleData[];
  categories: CategoryNode[];
}) {
  const [items, setItems] = useState(rules);
  const topLevelIndex = useMemo(() => buildTopLevelIndex(categories), [categories]);

  const groups = useMemo(() => {
    const byGroup = new Map<string, { icon: string; rules: MerchantRuleData[] }>();
    for (const rule of items) {
      const top = topLevelIndex.get(rule.categoryId) ?? { name: "Other", icon: "" };
      const group = byGroup.get(top.name) ?? { icon: top.icon, rules: [] };
      group.rules.push(rule);
      byGroup.set(top.name, group);
    }
    for (const group of byGroup.values()) {
      group.rules.sort((a, b) => a.merchant.localeCompare(b.merchant));
    }
    return Array.from(byGroup.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [items, topLevelIndex]);

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
    <div className="space-y-5">
      {groups.map(([groupName, group]) => (
        <div key={groupName}>
          <h2 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-secondary/50">
            <span className="text-sm leading-none">{group.icon}</span>
            {groupName}
          </h2>
          <ul className="space-y-2">
            {group.rules.map((rule) => (
              <li key={rule.id}>
                <Card>
                  <CardContent className="flex items-center gap-2">
                    <span className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold capitalize">{rule.merchant}</p>
                      <p className="text-xs text-secondary/50">{rule.direction === "in" ? "Money in" : "Money out"}</p>
                    </span>
                    <CategoryPicker
                      categories={categories}
                      value={rule.categoryId}
                      onChange={(categoryId) => updateCategory(rule.id, categoryId)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => remove(rule.id)}
                      aria-label="Delete rule"
                      className="shrink-0 text-secondary/50"
                    >
                      <X size={14} />
                    </Button>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
