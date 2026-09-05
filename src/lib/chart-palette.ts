/**
 * Fixed 8-hue categorical order, validated for adjacent-pair colorblind separation
 * (dataviz skill default palette). Order matters — it's the CVD-safety mechanism —
 * so slots are always assigned in this sequence, never re-ordered per chart.
 */
export const CATEGORICAL_PALETTE = [
  "#2a78d6", // blue
  "#eb6834", // orange
  "#1baf7a", // aqua
  "#eda100", // yellow
  "#e87ba4", // magenta
  "#008300", // green
  "#4a3aa7", // violet
  "#e34948", // red
];

/** Reserved for the folded "Other" bucket — never used as an identity hue. */
export const OTHER_COLOR = "#898781";

export type ColoredAmount = { name: string; amount: number; color: string; isOther: boolean };

/**
 * Ranks items by amount, keeps the top (maxSlots - 1) as their own categorical
 * color, and folds everything past that into a single gray "Other" slice — a
 * palette only has 8 safe identity hues, so a 9th+ series must never get a
 * generated color.
 *
 * `startIndex` rotates which palette slot comes first — pass the index a parent
 * category was assigned in a higher-level chart (e.g. the pie above) so a child
 * breakdown's dominant color agrees with it instead of every chart restarting at
 * blue.
 */
export function topNWithOther(
  items: { name: string; amount: number }[],
  maxSlots = 8,
  startIndex = 0,
): ColoredAmount[] {
  const sorted = [...items].filter((i) => i.amount > 0).sort((a, b) => b.amount - a.amount);
  const colorAt = (i: number) => CATEGORICAL_PALETTE[(startIndex + i) % CATEGORICAL_PALETTE.length];
  if (sorted.length <= maxSlots) {
    return sorted.map((item, i) => ({ ...item, color: colorAt(i), isOther: false }));
  }
  const top = sorted.slice(0, maxSlots - 1);
  const rest = sorted.slice(maxSlots - 1);
  const otherAmount = rest.reduce((sum, r) => sum + r.amount, 0);
  return [
    ...top.map((item, i) => ({ ...item, color: colorAt(i), isOther: false })),
    { name: "Other", amount: otherAmount, color: OTHER_COLOR, isOther: true },
  ];
}
