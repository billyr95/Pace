/**
 * Rough starting allocation of income across top-level expense groups, as a fraction
 * of trailing-30-day income. A first-pass default meant to be hand-tuned afterward —
 * not a real budgeting methodology. Excludes "Money In" (that's income, not a spend
 * target). Weights sum to 1.0.
 */
export const BUDGET_ALLOCATION_WEIGHTS: Record<string, number> = {
  Home: 0.3,
  Food: 0.15,
  Transportation: 0.1,
  Financial: 0.1,
  Shopping: 0.08,
  "Health & Wellness": 0.05,
  Personal: 0.05,
  Entertainment: 0.05,
  Travel: 0.05,
  "Family & Giving": 0.04,
  Goals: 0.03,
};
