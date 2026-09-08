"use client";

import { useState } from "react";
import { TrendingUp } from "lucide-react";

export function TrendsForecastCard() {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function getAnalysis() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/gemini/trends-forecast", { method: "POST" });
    const body = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(body.error ?? "Couldn't get an analysis right now.");
      return;
    }
    setFeedback(body.feedback);
  }

  return (
    <div className="rounded-2xl bg-surface p-4 shadow-sm">
      <div className="flex items-center gap-1.5">
        <TrendingUp size={15} className="text-brand-green" />
        <h2 className="text-sm font-semibold text-secondary/70">Spending trends &amp; cash-flow forecast</h2>
      </div>

      {feedback ? (
        <>
          <p className="mt-2 text-sm leading-relaxed">{feedback}</p>
          <button
            type="button"
            onClick={getAnalysis}
            disabled={loading}
            className="mt-3 text-xs font-medium text-secondary/60 underline disabled:opacity-50"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </>
      ) : (
        <>
          <p className="mt-1 mb-3 text-sm text-secondary/60">
            See where your spending is trending and what next month might look like.
          </p>
          <button
            type="button"
            onClick={getAnalysis}
            disabled={loading}
            className="rounded-lg bg-brand-green px-4 py-2 text-xs font-semibold text-brand-dark disabled:opacity-50"
          >
            {loading ? "Analyzing…" : "Analyze"}
          </button>
        </>
      )}
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  );
}
