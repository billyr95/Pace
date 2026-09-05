"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { PAY_FREQUENCIES, PAY_FREQUENCY_LABELS, type PayFrequency } from "@/lib/income";

export type IncomeProfileData = { frequency: PayFrequency; amount: number | null; variable: boolean } | null;

export function IncomeSetupForm({ profile }: { profile: IncomeProfileData }) {
  const router = useRouter();
  const [editing, setEditing] = useState(!profile);
  const [frequency, setFrequency] = useState<PayFrequency>(profile?.frequency ?? "biweekly");
  const [amount, setAmount] = useState(profile?.amount != null ? String(profile.amount) : "");
  const [variable, setVariable] = useState(profile?.variable ?? false);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/income-profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        frequency,
        amount: amount.trim() === "" ? null : Number(amount),
        variable,
      }),
    });
    setSaving(false);
    setEditing(false);
    router.refresh();
  }

  if (!editing && profile) {
    return (
      <div className="flex items-center justify-between text-sm">
        <p className="text-secondary/70">
          {PAY_FREQUENCY_LABELS[profile.frequency]}
          {profile.amount != null && (
            <>
              {" "}
              · {profile.variable ? "~" : ""}$
              {profile.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })} per paycheck
            </>
          )}
        </p>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-xs font-medium text-secondary/60 underline"
        >
          Edit
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-1">
        <label className="text-xs font-medium text-secondary/70">How often do you get paid?</label>
        <select
          value={frequency}
          onChange={(e) => setFrequency(e.target.value as PayFrequency)}
          className="w-full rounded-lg border border-divider bg-muted px-3 py-2 text-sm outline-none focus:border-brand-green"
        >
          {PAY_FREQUENCIES.map((f) => (
            <option key={f} value={f}>
              {PAY_FREQUENCY_LABELS[f]}
            </option>
          ))}
        </select>
      </div>

      {frequency !== "irregular" && (
        <>
          <div className="space-y-1">
            <label className="text-xs font-medium text-secondary/70">
              {variable ? "Average take-home per paycheck" : "Take-home per paycheck"}
            </label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-lg border border-divider bg-muted px-3 py-2 text-sm outline-none focus:border-brand-green"
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-secondary/70">
            <input type="checkbox" checked={variable} onChange={(e) => setVariable(e.target.checked)} />
            My paycheck amount varies (this is just a typical average)
          </label>
        </>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-brand-dark px-4 py-1.5 text-xs font-semibold text-brand-paper disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        {profile && (
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-full px-4 py-1.5 text-xs font-semibold text-secondary/60"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
