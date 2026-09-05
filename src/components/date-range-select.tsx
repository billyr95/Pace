"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { DATE_RANGES, type DateRangeKey } from "@/lib/date-range";

export function DateRangeSelect({ value, now }: { value: DateRangeKey; now: Date }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function onChange(range: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", range);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-full border border-divider bg-surface px-3 py-1.5 text-xs font-medium text-secondary outline-none focus:border-brand-green"
    >
      {Object.entries(DATE_RANGES).map(([key, { label }]) => (
        <option key={key} value={key}>
          {label(now)}
        </option>
      ))}
    </select>
  );
}
