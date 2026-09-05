function withYearIfNeeded(d: Date, now: Date, opts: Intl.DateTimeFormatOptions) {
  const includeYear = d.getFullYear() !== now.getFullYear();
  return d.toLocaleDateString(undefined, includeYear ? { ...opts, year: "numeric" } : opts);
}

function monthName(d: Date, now: Date) {
  return withYearIfNeeded(d, now, { month: "long" });
}

/** The 1st of the month `n` months before `now`'s month (n=0 is this month, n=-1 is next month). */
function monthsAgo(now: Date, n: number) {
  return new Date(now.getFullYear(), now.getMonth() - n, 1);
}

type RangeConfig = {
  since: (now: Date) => Date;
  until: (now: Date) => Date;
  label: (now: Date) => string;
  phrase: (now: Date) => string;
};

export const DATE_RANGES: Record<string, RangeConfig> = {
  this_month: {
    since: (now) => monthsAgo(now, 0),
    until: (now) => monthsAgo(now, -1),
    label: () => "This month",
    phrase: () => "this month",
  },
  "1m": {
    // The full previous calendar month (e.g. August 1 – August 31), not a rolling 30 days.
    since: (now) => monthsAgo(now, 1),
    until: (now) => monthsAgo(now, 0),
    label: () => "Last month",
    phrase: (now) => `in ${monthName(monthsAgo(now, 1), now)}`,
  },
  "3m": {
    // The 3 full calendar months before this one — first-of-month to last-of-month, not
    // "this day, 90 days ago."
    since: (now) => monthsAgo(now, 3),
    until: (now) => monthsAgo(now, 0),
    label: () => "Past 3 months",
    phrase: (now) => `from ${monthName(monthsAgo(now, 3), now)} to ${monthName(monthsAgo(now, 1), now)}`,
  },
  "6m": {
    since: (now) => monthsAgo(now, 6),
    until: (now) => monthsAgo(now, 0),
    label: () => "Past 6 months",
    phrase: (now) => `from ${monthName(monthsAgo(now, 6), now)} to ${monthName(monthsAgo(now, 1), now)}`,
  },
  "1y": {
    since: (now) => monthsAgo(now, 12),
    until: (now) => monthsAgo(now, 0),
    label: () => "Past year",
    phrase: (now) => `from ${monthName(monthsAgo(now, 12), now)} to ${monthName(monthsAgo(now, 1), now)}`,
  },
};

export type DateRangeKey = keyof typeof DATE_RANGES;

export function isDateRangeKey(value: string | undefined): value is DateRangeKey {
  return !!value && value in DATE_RANGES;
}
