"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { LogoWordmark } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
type FormValues = z.infer<typeof schema>;

// This form is intentionally theme-independent (always the white brand-paper card, never
// dark mode) — shadcn Input's default border/text colors are theme tokens, so they need an
// explicit override here rather than inheriting whatever the ambient page theme resolves to.
const authInputClassName =
  "border-brand-mist bg-brand-paper text-brand-dark placeholder:text-brand-forest/40 focus-visible:border-brand-green focus-visible:ring-brand-green/20";

export default function SignInPage() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setSubmitError(null);
    const result = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });
    if (result?.error) {
      setSubmitError("Invalid email or password.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-brand-dark px-6">
      <LogoWordmark
        height={56}
        className="mb-4"
        gapClassName="gap-4"
        titleStyle={{ filter: "brightness(0) invert(1)" }}
      />
      <p className="mb-8 text-center text-sm">
        <span className="text-brand-paper/80">Finance that moves with you.</span>{" "}
        <span className="font-medium text-brand-green">Not against you.</span>
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-lg font-bold text-brand-dark">Sign in</h1>
        <div className="space-y-1">
          <Label htmlFor="email" className="text-sm font-medium text-brand-forest">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            className={authInputClassName}
            {...register("email")}
          />
          {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="password" className="text-sm font-medium text-brand-forest">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            className={authInputClassName}
            {...register("password")}
          />
          {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
        </div>
        {submitError && <p className="text-sm text-red-600">{submitError}</p>}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-brand-green py-2.5 font-semibold text-brand-dark hover:bg-brand-green/90"
        >
          {isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
        <p className="text-center text-sm text-brand-forest">
          No account yet?{" "}
          <Link href="/sign-up" className="font-semibold text-brand-dark underline">
            Create one
          </Link>
        </p>
      </form>
    </div>
  );
}
