"use client";

import { useState } from "react";
import { HelpCircle } from "lucide-react";

type WhatIfResult = {
  label: string;
  category: string;
  currentAmount: number;
  newAmount: number;
  difference: number;
  currentSavings: number;
  newSavings: number;
};

const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`;

export function WhatIfCard() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<WhatIfResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!question.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    const res = await fetch("/api/gemini/what-if", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    const body = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(body.error ?? "Couldn't run that scenario.");
      return;
    }
    setResult(body);
  }

  return (
    <div className="rounded-2xl bg-surface p-4 shadow-sm">
      <div className="flex items-center gap-1.5">
        <HelpCircle size={15} className="text-brand-green" />
        <h2 className="text-sm font-semibold text-secondary/70">What if?</h2>
      </div>
      <p className="mt-1 mb-3 text-sm text-secondary/60">
        Ask about a change to your spending and see the impact on your savings.
      </p>
      <div className="flex items-center gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder="What if I move to a $2,000 apartment?"
          className="w-full rounded-lg border border-divider bg-muted px-3 py-2 text-sm outline-none focus:border-brand-green"
        />
        <button
          type="button"
          onClick={submit}
          disabled={loading || !question.trim()}
          className="shrink-0 rounded-lg bg-brand-green px-3 py-2 text-xs font-semibold text-brand-dark disabled:opacity-50"
        >
          {loading ? "…" : "Ask"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

      {result && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-muted p-3">
            <p className="mb-2 text-xs font-semibold text-secondary/50 uppercase">Current</p>
            <p className="text-sm">
              {result.category}: <span className="font-semibold">{fmt(result.currentAmount)}</span>
            </p>
            <p className="text-sm">
              Savings: <span className="font-semibold">{fmt(result.currentSavings)}/mo</span>
            </p>
          </div>
          <div className="rounded-xl bg-muted p-3">
            <p className="mb-2 text-xs font-semibold text-secondary/50 uppercase">{result.label}</p>
            <p className="text-sm">
              {result.category}: <span className="font-semibold">{fmt(result.newAmount)}</span>
            </p>
            <p className="text-sm">
              Savings: <span className="font-semibold">{fmt(result.newSavings)}/mo</span>
            </p>
          </div>
          <p
            className={`col-span-2 text-sm font-semibold ${result.difference > 0 ? "text-red-500" : "text-brand-green"}`}
          >
            Difference: {result.difference > 0 ? "-" : "+"}
            {fmt(Math.abs(result.difference))}/mo
          </p>
        </div>
      )}
    </div>
  );
}
