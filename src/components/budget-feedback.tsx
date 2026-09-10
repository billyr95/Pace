"use client";

import { Sparkles } from "lucide-react";
import { useAsyncInsight } from "@/hooks/use-async-insight";
import { AiLoading } from "@/components/ai-loading";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function BudgetFeedback() {
  const { data, loading, error, run } = useAsyncInsight<{ feedback: string }>();

  function getFeedback() {
    run("/api/gemini/budget-feedback", { method: "POST" });
  }

  return (
    <Card>
      <CardContent>
        <div className="flex items-center gap-1.5">
          <Sparkles size={15} className="text-brand-green" />
          <h2 className="text-sm font-semibold text-secondary/70">Budget check-in</h2>
        </div>

        {loading && !data ? (
          <AiLoading label="Thinking…" className="mt-3" />
        ) : data ? (
          <>
            <p className="mt-2 text-sm leading-relaxed">{data.feedback}</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={getFeedback}
              disabled={loading}
              className="mt-1 px-0 text-xs text-secondary/60 underline"
            >
              {loading ? "Refreshing…" : "Refresh"}
            </Button>
          </>
        ) : (
          <>
            <p className="mt-1 mb-3 text-sm text-secondary/60">
              Get a quick read on whether you&rsquo;re on track this month.
            </p>
            <Button type="button" onClick={getFeedback} disabled={loading} size="sm">
              Get feedback
            </Button>
          </>
        )}
        {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
