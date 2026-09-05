function withYearIfNeeded(d: Date, now: Date, opts: Intl.DateTimeFormatOptions) {
  const includeYear = d.getFullYear() !== now.getFullYear();
  return d.toLocaleDateString(undefined, includeYear ? { ...opts, year: "numeric" } : opts);
}

function monthName(d: Date, now: Date) {
  return withYearIfNeeded(d, now, { month: "long" });
}

function shortDate(d: Date, now: Date) {
  return withYearIfNeeded(d, now, { month: "short", day: "numeric" });
}

function dateSpan(since: Date, now: Date) {
  return `${shortDate(since, now)} – ${shortDate(now, now)}`;
}

type RangeConfig = {
  since: (now: Date) => Date;
  until: (now: Date) => Date;
  label: (now: Date) => string;
  phrase: (now: Date) => string;
};

export const DATE_RANGES: Record<string, RangeConfig> = {
  this_month: {
    since: (now) => new Date(now.getFullYear(), now.getMonth(), 1),
    until: (now) => new Date(now.getFullYear(), now.getMonth() + 1, 1),
    label: () => "This month",
    phrase: () => "this month",
  },
  "1m": {
    // The actual prior calendar month (e.g. August), not a rolling 30 days.
    since: (now) => new Date(now.getFullYear(), now.getMonth() - 1, 1),
    until: (now) => new Date(now.getFullYear(), now.getMonth(), 1),
    label: (now) => monthName(new Date(now.getFullYear(), now.getMonth() - 1, 1), now),
    phrase: (now) => `in ${monthName(new Date(now.getFullYear(), now.getMonth() - 1, 1), now)}`,
  },
  "3m": {
    since: (now) => new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
    until: (now) => new Date(now.getTime() + 24 * 60 * 60 * 1000),
    label: (now) => dateSpan(new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), now),
    phrase: (now) => `from ${dateSpan(new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), now)}`,
  },
  "6m": {
    since: (now) => new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000),
    until: (now) => new Date(now.getTime() + 24 * 60 * 60 * 1000),
    label: (now) => dateSpan(new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000), now),
    phrase: (now) => `from ${dateSpan(new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000), now)}`,
  },
  "1y": {
    since: (now) => new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
    until: (now) => new Date(now.getTime() + 24 * 60 * 60 * 1000),
    label: (now) => dateSpan(new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000), now),
    phrase: (now) => `from ${dateSpan(new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000), now)}`,
  },
};

export type DateRangeKey = keyof typeof DATE_RANGES;

export function isDateRangeKey(value: string | undefined): value is DateRangeKey {
  return !!value && value in DATE_RANGES;
}
