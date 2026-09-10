"use client";

import { TrendingUp } from "lucide-react";
import { useAsyncInsight } from "@/hooks/use-async-insight";
import { AiLoading } from "@/components/ai-loading";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function TrendsForecastCard() {
  const { data, loading, error, run } = useAsyncInsight<{ feedback: string }>();

  function getAnalysis() {
    run("/api/gemini/trends-forecast", { method: "POST" });
  }

  return (
    <Card>
      <CardContent>
        <div className="flex items-center gap-1.5">
          <TrendingUp size={15} className="text-brand-green" />
          <h2 className="text-sm font-semibold text-secondary">Spending trends &amp; cash-flow forecast</h2>
        </div>

        {loading && !data ? (
          <AiLoading label="Analyzing…" className="mt-3" />
        ) : data ? (
          <>
            <p className="mt-2 text-sm leading-relaxed">{data.feedback}</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={getAnalysis}
              disabled={loading}
              className="mt-1 px-0 text-xs text-secondary underline"
            >
              {loading ? "Refreshing…" : "Refresh"}
            </Button>
          </>
        ) : (
          <>
            <p className="mt-1 mb-3 text-sm text-secondary">
              See where your spending is trending and what next month might look like.
            </p>
            <Button type="button" onClick={getAnalysis} disabled={loading} size="sm">
              Analyze
            </Button>
          </>
        )}
        {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
