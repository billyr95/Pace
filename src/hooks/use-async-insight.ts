"use client";

import { useState } from "react";

/** Shared fetch/loading/error state for the Gemini-backed insight cards (budget
 * feedback, trends forecast, what-if) — each just supplies its own endpoint/body
 * and result shape. */
export function useAsyncInsight<T>() {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(url: string, options?: RequestInit) {
    setLoading(true);
    setError(null);
    const res = await fetch(url, options);
    const body = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(body.error ?? "Something went wrong.");
      return;
    }
    setData(body as T);
  }

  return { data, loading, error, run };
}
