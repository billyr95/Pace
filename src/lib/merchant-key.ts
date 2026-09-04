export function merchantKey(input: { merchantName?: string | null; name: string }): string {
  const raw = input.merchantName?.trim() || input.name.trim();
  return raw.toLowerCase().replace(/\s+/g, " ");
}
