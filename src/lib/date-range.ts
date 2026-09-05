export const DATE_RANGES = {
  this_month: { label: "This month", since: (now: Date) => new Date(now.getFullYear(), now.getMonth(), 1) },
  "1m": { label: "Past month", since: (now: Date) => new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
  "3m": { label: "Past 3 months", since: (now: Date) => new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) },
  "6m": { label: "Past 6 months", since: (now: Date) => new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000) },
  "1y": { label: "Past year", since: (now: Date) => new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) },
} as const;

export type DateRangeKey = keyof typeof DATE_RANGES;

export function isDateRangeKey(value: string | undefined): value is DateRangeKey {
  return !!value && value in DATE_RANGES;
}
