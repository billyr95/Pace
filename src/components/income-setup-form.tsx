"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PAY_FREQUENCIES, PAY_FREQUENCY_LABELS, type PayFrequency } from "@/lib/income";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type IncomeProfileData = { frequency: PayFrequency; amount: number | null; variable: boolean } | null;

const schema = z
  .object({
    frequency: z.enum(PAY_FREQUENCIES),
    amount: z.string(),
    variable: z.boolean(),
  })
  .refine((v) => v.frequency === "irregular" || v.amount.trim() === "" || Number(v.amount) >= 0, {
    message: "Enter a valid amount",
    path: ["amount"],
  });
type FormValues = z.infer<typeof schema>;

export function IncomeSetupForm({ profile }: { profile: IncomeProfileData }) {
  const router = useRouter();
  const [editing, setEditing] = useState(!profile);
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      frequency: profile?.frequency ?? "biweekly",
      amount: profile?.amount != null ? String(profile.amount) : "",
      variable: profile?.variable ?? false,
    },
  });
  const frequency = useWatch({ control, name: "frequency" });
  const variable = useWatch({ control, name: "variable" });

  async function onSubmit(values: FormValues) {
    await fetch("/api/income-profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        frequency: values.frequency,
        amount: values.amount.trim() === "" ? null : Number(values.amount),
        variable: values.variable,
      }),
    });
    setEditing(false);
    router.refresh();
  }

  if (!editing && profile) {
    return (
      <div className="flex items-center justify-between text-sm">
        <p className="text-secondary/70">
          {PAY_FREQUENCY_LABELS[profile.frequency]}
          {profile.amount != null && (
            <>
              {" "}
              · {profile.variable ? "~" : ""}$
              {profile.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })} per paycheck
            </>
          )}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setEditing(true)}
          className="text-xs text-secondary/60 underline"
        >
          Edit
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="pay-frequency" className="text-xs font-medium text-secondary/70">
          How often do you get paid?
        </Label>
        <Select value={frequency} onValueChange={(value) => setValue("frequency", value as PayFrequency)}>
          <SelectTrigger id="pay-frequency" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAY_FREQUENCIES.map((f) => (
              <SelectItem key={f} value={f}>
                {PAY_FREQUENCY_LABELS[f]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {frequency !== "irregular" && (
        <>
          <div className="space-y-1">
            <Label htmlFor="pay-amount" className="text-xs font-medium text-secondary/70">
              {variable ? "Average take-home per paycheck" : "Take-home per paycheck"}
            </Label>
            <Input id="pay-amount" type="number" min={0} step="0.01" placeholder="0.00" {...register("amount")} />
            {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
          </div>
          <Label className="flex items-center gap-2 text-xs font-normal text-secondary/70">
            <Switch checked={variable} onCheckedChange={(checked) => setValue("variable", checked)} />
            My paycheck amount varies (this is just a typical average)
          </Label>
        </>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting} className="bg-brand-dark text-brand-paper hover:bg-brand-dark/90">
          {isSubmitting ? "Saving…" : "Save"}
        </Button>
        {profile && (
          <Button type="button" variant="ghost" onClick={() => setEditing(false)} className="text-secondary/60">
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
