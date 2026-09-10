"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GoalChat } from "@/components/goal-chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
    setEditingId(null);
    router.refresh();
  }

  if (goals.length === 0) {
    return <p className="text-sm text-secondary">No goals yet — add one below.</p>;
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
              {editingId !== row.categoryId && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => startEdit(row)}
                  className="text-xs font-medium text-secondary underline"
                >
                  {hasGoal ? "Edit goal" : "Set a goal"}
                </Button>
              )}
            </div>

            {editingId === row.categoryId ? (
              <div className="flex flex-wrap items-center gap-2 rounded-xl bg-muted p-2.5">
                <div className="flex items-center gap-1">
                  <Label htmlFor={`goal-amount-${row.categoryId}`} className="text-xs text-secondary">
                    Target $
                  </Label>
                  <Input
                    id={`goal-amount-${row.categoryId}`}
                    autoFocus
                    type="number"
                    min={1}
                    value={amountDraft}
                    onChange={(e) => setAmountDraft(e.target.value)}
                    className="h-7 w-24 px-1.5"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <Label htmlFor={`goal-date-${row.categoryId}`} className="text-xs text-secondary">
                    By
                  </Label>
                  <Input
                    id={`goal-date-${row.categoryId}`}
                    type="date"
                    value={dateDraft}
                    onChange={(e) => setDateDraft(e.target.value)}
                    className="h-7 px-1.5 text-xs"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => save(row.categoryId)}
                  disabled={saving}
                  className="font-semibold text-brand-green"
                >
                  Save
                </Button>
                {row.goalId && (
                  <AlertDialog>
                    <AlertDialogTrigger className="text-xs text-secondary underline">
                      Remove goal
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove this goal?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This deletes the savings target for &ldquo;{row.name}&rdquo;. Past transactions stay
                          categorized here, but progress and pace tracking stop.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          variant="destructive"
                          onClick={() => remove(row.goalId!)}
                        >
                          Remove goal
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingId(null)}
                  className="text-xs text-secondary"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              hasGoal && (
                <>
                  <Progress value={pct} />
                  <p className="mt-1 text-xs text-secondary">
                    ${row.totalContributed.toLocaleString(undefined, { maximumFractionDigits: 0 })} of $
                    {row.targetAmount!.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    {row.targetDate && ` by ${new Date(row.targetDate).toLocaleDateString(undefined, { month: "long", year: "numeric" })}`}
                  </p>
                  {projection && <p className="mt-0.5 text-[11px] text-secondary">{projection}</p>}

                  <GoalChat categoryId={row.categoryId} />
                </>
              )
            )}
          </li>
        );
      })}
    </ul>
  );
}
