"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { EmojiPickerButton } from "@/components/emoji-picker-button";

export function AddGoalForm({ parentId }: { parentId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [emoji, setEmoji] = useState("🌱");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setOpen(false);
    setEmoji("🌱");
    setName("");
    setAmount("");
    setDate("");
    setError(null);
  }

  async function save() {
    const trimmedName = name.trim();
    const targetAmount = Number(amount);
    if (!trimmedName || !Number.isFinite(targetAmount) || targetAmount <= 0) return;

    setSaving(true);
    setError(null);

    const categoryRes = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmedName, icon: emoji, parentId }),
    });
    const categoryBody = await categoryRes.json().catch(() => ({}));
    if (!categoryRes.ok) {
      setSaving(false);
      setError(categoryBody.error ?? "Couldn't create that goal");
      return;
    }

    const goalRes = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId: categoryBody.category.id, targetAmount, targetDate: date || null }),
    });
    setSaving(false);
    if (!goalRes.ok) {
      const goalBody = await goalRes.json().catch(() => ({}));
      setError(goalBody.error ?? "Couldn't set that goal's target");
      return;
    }

    reset();
    router.refresh();
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-divider py-2.5 text-sm font-medium text-secondary/60"
      >
        <Plus size={15} />
        Add a goal
      </button>
    );
  }

  return (
    <div className="space-y-2 rounded-2xl bg-muted p-3">
      <div className="flex items-center gap-2">
        <EmojiPickerButton value={emoji} onChange={setEmoji} />
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="What are you saving for?"
          className="w-full rounded-lg border border-divider bg-surface px-3 py-2 text-sm outline-none focus:border-brand-green"
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="flex flex-1 items-center gap-1 text-sm">
          <span className="text-xs text-secondary/50">Target $</span>
          <input
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") save();
            }}
            className="w-full rounded-lg border border-divider bg-surface px-2 py-1.5 text-sm outline-none focus:border-brand-green"
          />
        </label>
        <label className="flex items-center gap-1 text-sm">
          <span className="text-xs text-secondary/50">By</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-divider bg-surface px-2 py-1.5 text-xs outline-none focus:border-brand-green"
          />
        </label>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving || !name.trim() || !amount}
          className="rounded-full bg-brand-green px-4 py-1.5 text-xs font-semibold text-brand-dark disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button type="button" onClick={reset} className="text-xs font-medium text-secondary/60">
          Cancel
        </button>
      </div>
    </div>
  );
}
