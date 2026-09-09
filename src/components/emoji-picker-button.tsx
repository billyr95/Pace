"use client";

import { useState } from "react";
import { CATEGORY_EMOJI } from "@/lib/category-emoji";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function EmojiPickerButton({ value, onChange }: { value: string; onChange: (emoji: string) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-divider bg-surface text-lg leading-none">
        {value || "🏷️"}
      </PopoverTrigger>
      <PopoverContent align="start" className="grid w-56 grid-cols-8 gap-1 p-2">
        {CATEGORY_EMOJI.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => {
              onChange(emoji);
              setOpen(false);
            }}
            className={`flex h-7 w-7 items-center justify-center rounded-lg text-base leading-none hover:bg-muted ${
              value === emoji ? "bg-brand-green/10" : ""
            }`}
          >
            {emoji}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
