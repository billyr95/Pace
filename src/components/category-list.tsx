"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { LeafDisplayRow } from "@/lib/category-tree";

export function CategoryList({
  categories,
  isIncome = false,
}: {
  categories: LeafDisplayRow[];
  isIncome?: boolean;
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  async function save(id: string) {
    const value = Number(draft);
    if (!Number.isFinite(value) || value < 0) return;
    setSaving(true);
    await fetch(`/api/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ monthlyLimit: value }),
    });
    setSaving(false);
    setEditingId(null);
    router.refresh();
  }

  return (
    <ul className="space-y-4">
      {categories.map((category, index) => {
        const sectionKey = category.sectionPath.map((s) => s.name).join(" / ");
        const prevSectionKey = index > 0 ? categories[index - 1].sectionPath.map((s) => s.name).join(" / ") : "";
        const section = category.sectionPath[category.sectionPath.length - 1];
        const showSectionHeader = section && sectionKey !== prevSectionKey;

        const limit = category.monthlyLimit;
        const hasLimit = !isIncome && limit !== null && limit > 0;
        const pct = hasLimit ? Math.min(100, Math.round((category.amount / limit) * 100)) : 0;
        const over = hasLimit && category.amount > limit;
        const indent = category.sectionPath.length > 0 ? "pl-2" : "";

        return (
          <li key={category.id}>
            {showSectionHeader && (
              <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-brand-forest/50">
                <span className="text-sm leading-none">{section.icon}</span>
                {section.name}
              </div>
            )}
            <div className={indent}>
              <div className="mb-1 flex items-center gap-2">
                <span className="flex-1 text-sm font-medium">{category.name}</span>
                {isIncome ? (
                  category.amount > 0 && (
                    <span className="text-xs font-semibold text-brand-green">
                      +${category.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  )
                ) : editingId === category.id ? (
                  <span className="flex items-center gap-1 text-sm">
                    $
                    <input
                      autoFocus
                      type="number"
                      min={0}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      className="w-16 rounded border border-brand-mist px-1 py-0.5"
                    />
                    <button
                      onClick={() => save(category.id)}
                      disabled={saving}
                      className="ml-1 font-semibold text-brand-green"
                    >
                      Save
                    </button>
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      setEditingId(category.id);
                      setDraft(hasLimit ? String(limit) : "");
                    }}
                    className="text-xs font-medium text-brand-forest/60 underline"
                  >
                    {hasLimit ? "Edit" : "Set budget"}
                  </button>
                )}
              </div>
              {!isIncome &&
                (hasLimit ? (
                  <>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-brand-mist">
                      <div
                        className={`h-full rounded-full ${over ? "bg-red-400" : "bg-brand-green"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-brand-forest/60">
                      ${category.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })} / $
                      {limit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                  </>
                ) : (
                  category.amount > 0 && (
                    <p className="text-xs text-brand-forest/50">
                      ${category.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })} spent, no budget set
                    </p>
                  )
                ))}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
