"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

export type GoalRow = {
  categoryId: string;
  name: string;
  icon: string;
  goalId: string | null;
  targetAmount: number | null;
  targetDate: string | null; // ISO date
  totalContributed: number;
  monthlyRate: number; // avg $ contributed per month over the last 3 months
};

function projectedCompletion(row: GoalRow): string | null {
  if (!row.targetAmount) return null;
  const remaining = row.targetAmount - row.totalContributed;
  if (remaining <= 0) return "Goal reached";
  if (row.monthlyRate <= 0) return null;
  const monthsNeeded = Math.ceil(remaining / row.monthlyRate);
  const date = new Date();
  date.setMonth(date.getMonth() + monthsNeeded);
  return `On track for ${date.toLocaleDateString(undefined, { month: "long", year: "numeric" })}`;
}

export function GoalList({ goals }: { goals: GoalRow[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [amountDraft, setAmountDraft] = useState("");
  const [dateDraft, setDateDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [suggestions, setSuggestions] = useState<Record<string, string>>({});
  const [loadingSuggestionFor, setLoadingSuggestionFor] = useState<string | null>(null);
  const [suggestionErrors, setSuggestionErrors] = useState<Record<string, string>>({});

  function startEdit(row: GoalRow) {
    setEditingId(row.categoryId);
    setAmountDraft(row.targetAmount ? String(row.targetAmount) : "");
    setDateDraft(row.targetDate ? row.targetDate.slice(0, 10) : "");
  }

  async function save(categoryId: string) {
    const amount = Number(amountDraft);
    if (!Number.isFinite(amount) || amount <= 0) return;
    setSaving(true);
    await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId, targetAmount: amount, targetDate: dateDraft || null }),
    });
    setSaving(false);
    setEditingId(null);
    router.refresh();
  }

  async function remove(goalId: string) {
    await fetch(`/api/goals/${goalId}`, { method: "DELETE" });
    router.refresh();
  }

  async function getSuggestion(categoryId: string) {
    setLoadingSuggestionFor(categoryId);
    setSuggestionErrors((prev) => ({ ...prev, [categoryId]: "" }));
    const res = await fetch("/api/gemini/goal-suggestion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId }),
    });
    const body = await res.json().catch(() => ({}));
    setLoadingSuggestionFor(null);
    if (!res.ok) {
      setSuggestionErrors((prev) => ({ ...prev, [categoryId]: body.error ?? "Couldn't get a suggestion right now." }));
      return;
    }
    setSuggestions((prev) => ({ ...prev, [categoryId]: body.suggestion }));
  }

  if (goals.length === 0) {
    return <p className="text-sm text-secondary/60">No goals yet — add one below.</p>;
  }

  return (
    <ul className="space-y-4">
      {goals.map((row) => {
        const hasGoal = row.targetAmount !== null;
        const pct = hasGoal ? Math.min(100, Math.round((row.totalContributed / row.targetAmount!) * 100)) : 0;
        const projection = hasGoal ? projectedCompletion(row) : null;

        return (
          <li key={row.categoryId}>
            <div className="mb-1 flex items-center gap-2">
              <span className="text-sm leading-none">{row.icon}</span>
              <span className="flex-1 text-sm font-medium">{row.name}</span>
              {editingId !== row.categoryId &&
                (hasGoal ? (
                  <button
                    onClick={() => startEdit(row)}
                    className="text-xs font-medium text-secondary/60 underline"
                  >
                    Edit goal
                  </button>
                ) : (
                  <button
                    onClick={() => startEdit(row)}
                    className="text-xs font-medium text-secondary/60 underline"
                  >
                    Set a goal
                  </button>
                ))}
            </div>

            {editingId === row.categoryId ? (
              <div className="flex flex-wrap items-center gap-2 rounded-xl bg-muted p-2.5">
                <label className="flex items-center gap-1 text-sm">
                  <span className="text-xs text-secondary/50">Target $</span>
                  <input
                    autoFocus
                    type="number"
                    min={1}
                    value={amountDraft}
                    onChange={(e) => setAmountDraft(e.target.value)}
                    className="w-24 rounded border border-divider bg-surface px-1.5 py-0.5"
                  />
                </label>
                <label className="flex items-center gap-1 text-sm">
                  <span className="text-xs text-secondary/50">By</span>
                  <input
                    type="date"
                    value={dateDraft}
                    onChange={(e) => setDateDraft(e.target.value)}
                    className="rounded border border-divider bg-surface px-1.5 py-0.5 text-xs"
                  />
                </label>
                <button
                  onClick={() => save(row.categoryId)}
                  disabled={saving}
                  className="font-semibold text-brand-green"
                >
                  Save
                </button>
                {row.goalId && (
                  <button
                    onClick={() => {
                      remove(row.goalId!);
                      setEditingId(null);
                    }}
                    className="text-xs text-secondary/50 underline"
                  >
                    Remove goal
                  </button>
                )}
                <button onClick={() => setEditingId(null)} className="text-xs text-secondary/50">
                  Cancel
                </button>
              </div>
            ) : (
              hasGoal && (
                <>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-brand-green" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-secondary/60">
                    ${row.totalContributed.toLocaleString(undefined, { maximumFractionDigits: 0 })} of $
                    {row.targetAmount!.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    {row.targetDate && ` by ${new Date(row.targetDate).toLocaleDateString(undefined, { month: "long", year: "numeric" })}`}
                  </p>
                  {projection && <p className="mt-0.5 text-[11px] text-secondary/40">{projection}</p>}

                  {suggestions[row.categoryId] ? (
                    <p className="mt-2 rounded-lg bg-muted p-2 text-xs leading-relaxed text-secondary/80">
                      {suggestions[row.categoryId]}
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => getSuggestion(row.categoryId)}
                      disabled={loadingSuggestionFor === row.categoryId}
                      className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-brand-green disabled:opacity-50"
                    >
                      <Sparkles size={11} />
                      {loadingSuggestionFor === row.categoryId ? "Thinking…" : "How can I save for this?"}
                    </button>
                  )}
                  {suggestionErrors[row.categoryId] && (
                    <p className="mt-1 text-[11px] text-red-500">{suggestionErrors[row.categoryId]}</p>
                  )}
                </>
              )
            )}
          </li>
        );
      })}
    </ul>
  );
}
