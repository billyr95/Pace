"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { DATE_RANGES, type DateRangeKey } from "@/lib/date-range";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function DateRangeSelect({ value, now }: { value: DateRangeKey; now: Date }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function onChange(range: string | null) {
    if (!range) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", range);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger size="sm" className="rounded-full text-xs font-medium text-secondary">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(DATE_RANGES).map(([key, { label }]) => (
          <SelectItem key={key} value={key}>
            {label(now)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
