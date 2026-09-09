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
  name: z.string().trim().min(1, "Category name is required"),
});
type FormValues = z.infer<typeof schema>;

export function AddCategoryForm({ parentId, label }: { parentId: string | null; label: string }) {
  const router = useRouter();
  const formId = useId();
  const [open, setOpen] = useState(false);
  const [emoji, setEmoji] = useState("🏷️");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { name: "" } });

  function closeAndReset() {
    setOpen(false);
    setEmoji("🏷️");
    setSubmitError(null);
    reset();
  }

  async function onSubmit(values: FormValues) {
    setSubmitError(null);
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: values.name, icon: emoji, parentId }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setSubmitError(body.error ?? "Couldn't create category");
      return;
    }
    closeAndReset();
    router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={(next) => (next ? setOpen(true) : closeAndReset())}>
      <SheetTrigger className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-divider py-2.5 text-sm font-medium text-secondary/60">
        <Plus size={15} />
        {label}
      </SheetTrigger>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>{label}</SheetTitle>
        </SheetHeader>
        <form id={formId} onSubmit={handleSubmit(onSubmit)} className="space-y-2 px-4">
          <div className="flex items-center gap-2">
            <EmojiPickerButton value={emoji} onChange={setEmoji} />
            <div className="flex-1">
              <Label htmlFor={`${formId}-name`} className="sr-only">
                Category name
              </Label>
              <Input id={`${formId}-name`} autoFocus placeholder="Category name" {...register("name")} />
            </div>
          </div>
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          {submitError && <p className="text-xs text-destructive">{submitError}</p>}
        </form>
        <SheetFooter className="flex-row">
          <Button type="submit" form={formId} disabled={isSubmitting} className="flex-1">
            Save
          </Button>
          <Button type="button" variant="ghost" onClick={closeAndReset} className="text-secondary/60">
            Cancel
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
