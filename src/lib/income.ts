export const PAY_FREQUENCIES = ["weekly", "biweekly", "semimonthly", "monthly", "irregular"] as const;
export type PayFrequency = (typeof PAY_FREQUENCIES)[number];

export const PAY_FREQUENCY_LABELS: Record<PayFrequency, string> = {
  weekly: "Weekly",
  biweekly: "Every 2 weeks",
  semimonthly: "Twice a month",
  monthly: "Monthly",
  irregular: "It varies / no fixed schedule",
};

const PAY_PERIODS_PER_YEAR: Record<Exclude<PayFrequency, "irregular">, number> = {
  weekly: 52,
  biweekly: 26,
  semimonthly: 24,
  monthly: 12,
};

/**
 * A declared paycheck schedule converts cleanly to a monthly figure; "irregular"
 * (or no profile at all) has nothing to convert, so callers fall back to a
 * trailing-average of actual income instead.
 */
export function expectedMonthlyIncome(
  profile: { frequency: string; amount: number | null } | null,
  fallbackMonthlyAverage: number,
): number {
  if (!profile || profile.amount == null || profile.frequency === "irregular") {
    return fallbackMonthlyAverage;
  }
  const periods = PAY_PERIODS_PER_YEAR[profile.frequency as Exclude<PayFrequency, "irregular">];
  if (!periods) return fallbackMonthlyAverage;
  return (profile.amount * periods) / 12;
}
