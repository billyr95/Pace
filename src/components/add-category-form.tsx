"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { EmojiPickerButton } from "@/components/emoji-picker-button";

export function AddCategoryForm({ parentId, label }: { parentId: string | null; label: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [emoji, setEmoji] = useState("🏷️");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setOpen(false);
    setEmoji("🏷️");
    setName("");
    setError(null);
  }

  async function save() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    setError(null);
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed, icon: emoji, parentId }),
    });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Couldn't create category");
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
        {label}
      </button>
    );
  }

  return (
    <div className="space-y-2 rounded-2xl bg-surface p-3 shadow-sm">
      <div className="flex items-center gap-2">
        <EmojiPickerButton value={emoji} onChange={setEmoji} />
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
          }}
          placeholder="Category name"
          className="w-full rounded-lg border border-divider bg-muted px-3 py-2 text-sm outline-none focus:border-brand-green"
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving || !name.trim()}
          className="rounded-full bg-brand-green px-4 py-1.5 text-xs font-semibold text-brand-dark disabled:opacity-50"
        >
          Save
        </button>
        <button type="button" onClick={reset} className="text-xs font-medium text-secondary/60">
          Cancel
        </button>
      </div>
    </div>
  );
}
