"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus } from "lucide-react";
import { EmojiPickerButton } from "@/components/emoji-picker-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const schema = z.object({
  name: z.string().trim().min(1, "Name your goal"),
  amount: z.string().refine((v) => Number.isFinite(Number(v)) && Number(v) > 0, "Enter an amount greater than 0"),
  date: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export function AddGoalForm({ parentId }: { parentId: string }) {
  const router = useRouter();
  const formId = useId();
  const [open, setOpen] = useState(false);
  const [emoji, setEmoji] = useState("🌱");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", amount: "", date: "" },
  });

  function closeAndReset() {
    setOpen(false);
    setEmoji("🌱");
    setSubmitError(null);
    reset();
  }

  async function onSubmit(values: FormValues) {
    setSubmitError(null);

    const categoryRes = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: values.name, icon: emoji, parentId }),
    });
    const categoryBody = await categoryRes.json().catch(() => ({}));
    if (!categoryRes.ok) {
      setSubmitError(categoryBody.error ?? "Couldn't create that goal");
      return;
    }

    const goalRes = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categoryId: categoryBody.category.id,
        targetAmount: Number(values.amount),
        targetDate: values.date || null,
      }),
    });
    if (!goalRes.ok) {
      const goalBody = await goalRes.json().catch(() => ({}));
      setSubmitError(goalBody.error ?? "Couldn't set that goal's target");
      return;
    }

    closeAndReset();
    router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={(next) => (next ? setOpen(true) : closeAndReset())}>
      <SheetTrigger className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-divider py-2.5 text-sm font-medium text-secondary">
        <Plus size={15} />
        Add a goal
      </SheetTrigger>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Add a goal</SheetTitle>
        </SheetHeader>
        <form id={formId} onSubmit={handleSubmit(onSubmit)} className="space-y-2 px-4">
          <div className="flex items-center gap-2">
            <EmojiPickerButton value={emoji} onChange={setEmoji} />
            <div className="flex-1">
              <Label htmlFor={`${formId}-name`} className="sr-only">
                What are you saving for?
              </Label>
              <Input
                id={`${formId}-name`}
                autoFocus
                placeholder="What are you saving for?"
                {...register("name")}
              />
            </div>
          </div>
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}

          <div className="flex items-center gap-2">
            <div className="flex-1 space-y-1">
              <Label htmlFor={`${formId}-amount`} className="text-xs text-secondary">
                Target $
              </Label>
              <Input id={`${formId}-amount`} type="number" min={1} {...register("amount")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`${formId}-date`} className="text-xs text-secondary">
                By
              </Label>
              <Input id={`${formId}-date`} type="date" {...register("date")} />
            </div>
          </div>
          {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
          {submitError && <p className="text-xs text-destructive">{submitError}</p>}
        </form>
        <SheetFooter className="flex-row">
          <Button type="submit" form={formId} disabled={isSubmitting} className="flex-1">
            {isSubmitting ? "Saving…" : "Save"}
          </Button>
          <Button type="button" variant="ghost" onClick={closeAndReset} className="text-secondary">
            Cancel
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
