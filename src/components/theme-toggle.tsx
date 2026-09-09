"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type ThemeChoice = "system" | "light" | "dark";

const OPTIONS: { value: ThemeChoice; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

// next-themes doesn't know the resolved theme until after mount — this reports "not
// mounted yet" during SSR/first paint so we render a stable "system" selection then,
// avoiding a hydration mismatch flash (no useEffect-driven setState needed).
function useHasMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useHasMounted();
  const choice: ThemeChoice = mounted && (theme === "light" || theme === "dark") ? theme : "system";

  return (
    <ToggleGroup
      value={[choice]}
      onValueChange={(values) => setTheme((values[0] as ThemeChoice) ?? "system")}
      className="rounded-full bg-muted p-1"
    >
      {OPTIONS.map((opt) => (
        <ToggleGroupItem
          key={opt.value}
          value={opt.value}
          className="rounded-full px-3 py-1.5 text-xs font-semibold text-secondary/70 data-[state=on]:bg-surface data-[state=on]:text-ink data-[state=on]:shadow-sm"
        >
          {opt.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
