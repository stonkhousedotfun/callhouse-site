/**
 * Display formatting for the marketing site. Every figure here is a labelled example or a
 * fixed policy parameter — this file never reads a chain.
 *
 * House rules:
 *   - USDG is dollar-like. Totals show two decimals; whole amounts drop the fraction;
 *     unit prices under 1 USDG keep three.
 *   - Counts and gas get thousands separators.
 *   - Percents drop trailing zeros (5%, 3%) and keep two decimals when they are not whole (0.40%).
 */

export function fmtNumber(value: number, minFrac = 0, maxFrac = minFrac): string {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: minFrac,
    maximumFractionDigits: maxFrac,
    useGrouping: true,
  }).format(value);
}

/** Whole counts: 5, 14, 462,677. */
export function fmtCount(value: number): string {
  return fmtNumber(value, 0, 0);
}

/**
 * USDG on the page. Matches the dapp's default (two decimals for a dollar-like unit) without
 * dragging viem into this package. Pass `frac` to pin the decimals: receipts use 2, unit prices
 * under a dollar use 3.
 */
export function fmtUsdg(value: number, frac?: number): string {
  if (!Number.isFinite(value)) return "—";
  if (frac !== undefined) return fmtNumber(value, frac, frac);
  if (Number.isInteger(value)) return fmtNumber(value, 0, 0);
  if (Math.abs(value) >= 1) return fmtNumber(value, 2, 2);
  return fmtNumber(value, 2, 3);
}

/** `5` → "5%", `0.4` → "0.40%", `99.85` → "99.85%". */
export function fmtPct(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const frac = Number.isInteger(value) ? 0 : 2;
  return `${fmtNumber(value, frac, 2)}%`;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/** `2026-09-12` → `12 September 2026`. Full month names; the three-letter fourth month is a forbidden token. */
export function fmtDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day || month < 1 || month > 12) return iso;
  return `${day} ${MONTHS[month - 1]} ${year}`;
}
