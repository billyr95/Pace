"use client";

import { useEffect, useRef, useState } from "react";
import { CATEGORY_EMOJI } from "@/lib/category-emoji";

export function EmojiPickerButton({ value, onChange }: { value: string; onChange: (emoji: string) => void }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-divider bg-surface text-lg leading-none"
      >
        {value || "🏷️"}
      </button>

      {open && (
        <div className="absolute left-0 z-20 mt-1 grid w-56 grid-cols-8 gap-1 rounded-xl border border-divider bg-surface p-2 shadow-lg">
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
        </div>
      )}
    </div>
  );
}
