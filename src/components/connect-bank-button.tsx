"use client";

import { useCallback, useEffect, useState } from "react";
import { usePlaidLink } from "react-plaid-link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ConnectBankButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/plaid/create-link-token", { method: "POST" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Could not reach Plaid");
        setLinkToken(data.linkToken ?? null);
      })
      .catch((err) => toast.error(err.message));
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
    <Button
      type="button"
      onClick={() => open()}
      disabled={!ready || !linkToken || loading}
      className={`w-full gap-2 bg-brand-dark py-3 text-brand-paper hover:bg-brand-dark/90 ${className}`}
    >
      <Landmark size={18} />
      {loading ? "Connecting…" : "Connect a bank account"}
    </Button>
  );
}
