"use client";

import { useSyncExternalStore } from "react";

type ThemeChoice = "system" | "light" | "dark";

const OPTIONS: { value: ThemeChoice; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

function getSnapshot(): ThemeChoice {
  const stored = window.localStorage.getItem("pace-theme");
  return stored === "light" || stored === "dark" ? stored : "system";
}

function getServerSnapshot(): ThemeChoice {
  return "system";
}

function applyTheme(choice: ThemeChoice) {
  if (choice === "system") {
    document.documentElement.removeAttribute("data-theme");
    localStorage.removeItem("pace-theme");
  } else {
    document.documentElement.setAttribute("data-theme", choice);
    localStorage.setItem("pace-theme", choice);
  }
  listeners.forEach((l) => l());
}

export function ThemeToggle() {
  const choice = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <div className="flex items-center gap-1 rounded-full bg-muted p-1">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => applyTheme(opt.value)}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
            choice === opt.value ? "bg-surface text-ink shadow-sm" : "text-secondary/70"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
