"use client";

import { useCallback, useEffect, useState } from "react";
import { usePlaidLink } from "react-plaid-link";
import { useRouter } from "next/navigation";
import { Landmark } from "lucide-react";

export function ConnectBankButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/plaid/create-link-token", { method: "POST" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Could not reach Plaid");
        setLinkToken(data.linkToken ?? null);
      })
      .catch((err) => setError(err.message));
  }, []);

  const onSuccess = useCallback(
    async (publicToken: string | null) => {
      if (!publicToken) return;
      setLoading(true);
      await fetch("/api/plaid/exchange-public-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicToken }),
      });
      await fetch("/api/plaid/sync-transactions", { method: "POST" });
      setLoading(false);
      router.refresh();
    },
    [router],
  );

  const { open, ready } = usePlaidLink({ token: linkToken ?? "", onSuccess });

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => open()}
        disabled={!ready || !linkToken || loading}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-dark px-5 py-3 font-semibold text-brand-paper transition hover:opacity-90 disabled:opacity-50"
      >
        <Landmark size={18} />
        {loading ? "Connecting…" : "Connect a bank account"}
      </button>
      {error && <p className="mt-2 text-center text-xs text-red-500">{error}</p>}
    </div>
  );
}
