"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wand2 } from "lucide-react";

export function AutoAllocateButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setMessage(null);
    const res = await fetch("/api/budgets/auto-allocate", { method: "POST" });
    const body = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setMessage(body.error ?? "Couldn't set budgets automatically.");
      return;
    }
    setMessage(
      `Set budgets for ${body.categoriesUpdated} categories based on $${Math.round(body.income).toLocaleString()} of income over the last 30 days.`,
    );
    router.refresh();
  }

  return (
    <div>
      <button
        type="button"
        onClick={run}
        disabled={loading}
        className="flex items-center gap-1.5 text-xs font-semibold text-brand-forest/70 underline disabled:opacity-50"
      >
        <Wand2 size={13} />
        {loading ? "Setting budgets…" : "Auto-set budgets from income"}
      </button>
      {message && <p className="mt-1 text-xs text-brand-forest/60">{message}</p>}
    </div>
  );
}
