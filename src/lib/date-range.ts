export const DATE_RANGES = {
  "1m": { label: "Past month", days: 30 },
  "3m": { label: "Past 3 months", days: 90 },
  "6m": { label: "Past 6 months", days: 180 },
  "1y": { label: "Past year", days: 365 },
} as const;

export type DateRangeKey = keyof typeof DATE_RANGES;

export function isDateRangeKey(value: string | undefined): value is DateRangeKey {
  return !!value && value in DATE_RANGES;
}
