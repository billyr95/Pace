"use client";

import { useState } from "react";
import { Sparkles, Send } from "lucide-react";

type Message = { role: "user" | "assistant"; text: string };

export function GoalChat({ categoryId }: { categoryId: string }) {
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(userMessage?: string) {
    setLoading(true);
    setError(null);
    const history = messages;
    const res = await fetch("/api/gemini/goal-suggestion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId, history, message: userMessage }),
    });
    const body = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(body.error ?? "Couldn't get a response right now.");
      return;
    }
    setMessages((prev) => [
      ...prev,
      ...(userMessage ? [{ role: "user" as const, text: userMessage }] : []),
      { role: "assistant" as const, text: body.reply },
    ]);
  }

  function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    setInput("");
    send(trimmed);
  }

  if (!started) {
    return (
      <button
        type="button"
        onClick={() => {
          setStarted(true);
          send();
        }}
        className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-brand-green"
      >
        <Sparkles size={11} />
        How can I save for this?
      </button>
    );
  }

  return (
    <div className="mt-2 space-y-1.5">
      {messages.map((m, i) => (
        <p
          key={i}
          className={`rounded-lg p-2 text-xs leading-relaxed ${
            m.role === "assistant" ? "bg-muted text-secondary/80" : "ml-4 bg-brand-green/10 text-ink"
          }`}
        >
          {m.text}
        </p>
      ))}
      {loading && <p className="px-1 text-xs text-secondary/50">Thinking…</p>}
      {error && <p className="px-1 text-xs text-red-500">{error}</p>}
      <div className="flex items-center gap-1.5">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
          placeholder="Ask a follow-up…"
          className="w-full rounded-lg border border-divider bg-surface px-2 py-1.5 text-xs outline-none focus:border-brand-green"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={loading || !input.trim()}
          aria-label="Send"
          className="shrink-0 rounded-lg bg-brand-green p-2 text-brand-dark disabled:opacity-50"
        >
          <Send size={13} />
        </button>
      </div>
    </div>
  );
}
