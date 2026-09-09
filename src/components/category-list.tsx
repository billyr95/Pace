"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { LeafDisplayRow } from "@/lib/category-tree";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";

export function CategoryList({
  categories,
  isIncome = false,
  priorMonthLabel,
}: {
  categories: LeafDisplayRow[];
  isIncome?: boolean;
  priorMonthLabel?: string;
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

  async function toggleRollover(id: string, rolloverEnabled: boolean) {
    await fetch(`/api/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rolloverEnabled }),
    });
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
        const rolloverAmount = category.rolloverAmount ?? 0;
        const effectiveLimit = (limit ?? 0) + rolloverAmount;
        const pct = hasLimit ? Math.min(100, Math.round((category.amount / effectiveLimit) * 100)) : 0;
        const over = hasLimit && category.amount > effectiveLimit;
        const indent = category.sectionPath.length > 0 ? "pl-2" : "";

        return (
          <li key={category.id}>
            {showSectionHeader && (
              <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-secondary/50">
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
                    <Label htmlFor={`budget-${category.id}`} className="text-xs text-secondary/50">
                      Proposed
                    </Label>
                    $
                    <Input
                      id={`budget-${category.id}`}
                      autoFocus
                      type="number"
                      min={0}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      className="h-7 w-16 px-1.5"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => save(category.id)}
                      disabled={saving}
                      className="text-brand-green"
                    >
                      Save
                    </Button>
                  </span>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingId(category.id);
                      setDraft(hasLimit ? String(limit) : "");
                    }}
                    className="text-xs font-medium text-secondary/60 underline"
                  >
                    {hasLimit ? "Edit proposed" : "Set proposed budget"}
                  </Button>
                )}
              </div>
              {!isIncome &&
                (hasLimit ? (
                  <>
                    <Progress value={pct} className={over ? "[&_[data-slot=progress-indicator]]:bg-destructive" : ""} />
                    <p className="mt-1 text-xs text-secondary/60">
                      ${category.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })} actual / $
                      {effectiveLimit.toLocaleString(undefined, { maximumFractionDigits: 0 })} proposed
                      {rolloverAmount > 0 && priorMonthLabel && (
                        <> (includes ${rolloverAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })} rolled over from {priorMonthLabel})</>
                      )}
                    </p>
                    <Label className="mt-1 flex items-center gap-1.5 text-[11px] font-normal text-secondary/50">
                      <Switch
                        size="sm"
                        checked={category.rolloverEnabled}
                        onCheckedChange={(checked) => toggleRollover(category.id, checked)}
                      />
                      Roll over unused budget to next month
                    </Label>
                  </>
                ) : (
                  category.amount > 0 && (
                    <p className="text-xs text-secondary/50">
                      ${category.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })} actual, no proposed budget set
                    </p>
                  )
                ))}
              {!isIncome && category.priorAmount !== undefined && priorMonthLabel && (
                <p className="mt-0.5 text-[11px] text-secondary/40">
                  ${category.priorAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })} in {priorMonthLabel}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
