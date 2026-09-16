/**
 * Labelled example for the landing fee slip. Uses live week 1 terms (strike 223 USDG, ask 1 USDG)
 * with a 5-lot fill so the 5% Seaport fee is obvious. Not a live week and not a forecast.
 *
 *   5 × 1.000000 = 5.000000 gross
 *   floor(5e6 × 500 / 10000) = 250000 fee → 0.25 USDG
 *   net to writer wallet = 4.75 USDG, 0.95 per lot
 */

import { clockAt } from "./clock";
import { fmtCount, fmtUsdg } from "./format";

export const EXAMPLE_WEEK = {
  n: 1,
  strike: 223,
  spot: 212.38,
  ask: 1,
  floor: 0.84952,
  offered: 5,
  sold: 5,
  fills: [2, 3] as const,
  shares: 5,
  gross: 5,
  fee: 0.25,
  net: 4.75,
  perShare: 0.95,
  assigned: 2,
  strikeProceeds: 446,
  refuseSpot: 216.5,
  bandSpot: 216.5,
  firstFillGas: 0,
  laterFillGas: 0,
  exerciseTs: 1_789_761_600,
  expiryTs: 1_789_848_000,
} as const;

const exercise = clockAt(EXAMPLE_WEEK.exerciseTs);
const expiry = clockAt(EXAMPLE_WEEK.expiryTs);

/** Preformatted strings for the example week, so call sites do not re-round. */
export const EXAMPLE = {
  week: fmtCount(EXAMPLE_WEEK.n),
  strike: fmtUsdg(EXAMPLE_WEEK.strike),
  spot: fmtUsdg(EXAMPLE_WEEK.spot),
  ask: fmtUsdg(EXAMPLE_WEEK.ask, 2),
  floor: fmtUsdg(EXAMPLE_WEEK.floor, 3),
  offered: fmtCount(EXAMPLE_WEEK.offered),
  sold: fmtCount(EXAMPLE_WEEK.sold),
  fillA: fmtCount(EXAMPLE_WEEK.fills[0]),
  fillB: fmtCount(EXAMPLE_WEEK.fills[1]),
  unfilled: fmtCount(EXAMPLE_WEEK.offered - EXAMPLE_WEEK.sold),
  shares: fmtCount(EXAMPLE_WEEK.shares),
  gross: fmtUsdg(EXAMPLE_WEEK.gross, 2),
  fee: fmtUsdg(EXAMPLE_WEEK.fee, 2),
  net: fmtUsdg(EXAMPLE_WEEK.net, 2),
  perShare: fmtUsdg(EXAMPLE_WEEK.perShare, 2),
  assigned: fmtCount(EXAMPLE_WEEK.assigned),
  strikeProceeds: fmtUsdg(EXAMPLE_WEEK.strikeProceeds),
  refuseSpot: fmtUsdg(EXAMPLE_WEEK.refuseSpot),
  bandSpot: fmtUsdg(EXAMPLE_WEEK.bandSpot),
  firstFillGas: fmtCount(EXAMPLE_WEEK.firstFillGas),
  laterFillGas: fmtCount(EXAMPLE_WEEK.laterFillGas),
  exercise,
  expiry,
} as const;
