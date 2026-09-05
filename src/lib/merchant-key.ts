/**
 * Same merchant, different direction, different rule — e.g. Venmo cashing you out
 * (expense) is unrelated to a friend paying you back on Venmo (income), so direction
 * is baked into the key rather than just the merchant name.
 */
export function merchantKey(input: { merchantName?: string | null; name: string; amount: number }): string {
  const raw = input.merchantName?.trim() || input.name.trim();
  const normalized = raw.toLowerCase().replace(/\s+/g, " ");
  const direction = input.amount < 0 ? "in" : "out";
  return `${normalized}::${direction}`;
}
