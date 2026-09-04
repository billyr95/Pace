"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogoWordmark } from "@/components/logo";

export default function SignUpPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const payload = {
      name: form.get("name"),
      email: form.get("email"),
      password: form.get("password"),
    };

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Something went wrong.");
      setLoading(false);
      return;
    }

    const result = await signIn("credentials", {
      email: payload.email,
      password: payload.password,
      redirect: false,
    });

    setLoading(false);
    if (result?.error) {
      setError("Account created, but sign-in failed. Try signing in.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-brand-paper px-6">
      <LogoWordmark className="mb-8" />
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-lg font-bold">Create your account</h1>
        <div className="space-y-1">
          <label className="text-sm font-medium text-brand-forest" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="w-full rounded-lg border border-brand-mist bg-brand-paper px-3 py-2 outline-none focus:border-brand-green"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-brand-forest" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-lg border border-brand-mist bg-brand-paper px-3 py-2 outline-none focus:border-brand-green"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-brand-forest" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            className="w-full rounded-lg border border-brand-mist bg-brand-paper px-3 py-2 outline-none focus:border-brand-green"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-brand-green py-2.5 font-semibold text-brand-dark transition hover:brightness-95 disabled:opacity-60"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
        <p className="text-center text-sm text-brand-forest">
          Already have an account?{" "}
          <Link href="/sign-in" className="font-semibold text-brand-dark underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
