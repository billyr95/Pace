"use client";

import { useState } from "react";
import { HelpCircle } from "lucide-react";
import { useAsyncInsight } from "@/hooks/use-async-insight";
import { AiLoading } from "@/components/ai-loading";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

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
  const { data: result, loading, error, run } = useAsyncInsight<WhatIfResult>();

  function submit() {
    if (!question.trim()) return;
    run("/api/gemini/what-if", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
  }

  return (
    <Card>
      <CardContent>
        <div className="flex items-center gap-1.5">
          <HelpCircle size={15} className="text-brand-green" />
          <h2 className="text-sm font-semibold text-secondary">What if?</h2>
        </div>
        <p className="mt-1 mb-3 text-sm text-secondary">
          Ask about a change to your spending and see the impact on your savings.
        </p>
        <div className="flex items-center gap-2">
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
            placeholder="What if I move to a $2,000 apartment?"
          />
          <Button type="button" onClick={submit} disabled={loading || !question.trim()} size="sm">
            Ask
          </Button>
        </div>
        {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
        {loading && !result && <AiLoading label="Crunching the numbers…" className="mt-3" />}

        {result && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-muted p-3">
              <p className="mb-2 text-xs font-semibold text-secondary uppercase">Current</p>
              <p className="text-sm">
                {result.category}: <span className="font-semibold">{fmt(result.currentAmount)}</span>
              </p>
              <p className="text-sm">
                Savings: <span className="font-semibold">{fmt(result.currentSavings)}/mo</span>
              </p>
            </div>
            <div className="rounded-xl bg-muted p-3">
              <p className="mb-2 text-xs font-semibold text-secondary uppercase">{result.label}</p>
              <p className="text-sm">
                {result.category}: <span className="font-semibold">{fmt(result.newAmount)}</span>
              </p>
              <p className="text-sm">
                Savings: <span className="font-semibold">{fmt(result.newSavings)}/mo</span>
              </p>
            </div>
            <p
              className={`col-span-2 text-sm font-semibold ${result.difference > 0 ? "text-destructive" : "text-brand-green"}`}
            >
              Difference: {result.difference > 0 ? "-" : "+"}
              {fmt(Math.abs(result.difference))}/mo
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
