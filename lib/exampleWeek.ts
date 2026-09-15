/**
 * Week 2 of the keeper's fork rehearsal of the redesigned vault (2026-09-15T03:44Z UTC run,
 * keeper/run-final/report.md). Every public figure that quotes this week should import from here
 * so the landing card, the fee slips and the how-it-works notes cannot drift.
 *
 * Raw units in the report: strikeUsdg6 223000000, spotAtArmUsdg6 211927750, unitPrice6 856189,
 * fills of 2 then 3, listedDeposit.checkpointHarvest gross 4280945 / fee 214047 / net 4066898,
 * per share 0.271126 USDG, two calls exercised at 223 → 446 USDG strike proceeds.
 */

import { clockAt } from "./clock";
import { fmtCount, fmtUsdg } from "./format";

export const EXAMPLE_WEEK = {
  n: 2,
  strike: 223,
  spot: 211.93,
  ask: 0.856189,
  floor: 0.847711,
  offered: 14,
  sold: 5,
  fills: [2, 3] as const,
  shares: 15,
  gross: 4.280945,
  fee: 0.214047,
  net: 4.066898,
  perShare: 0.271126,
  assigned: 2,
  strikeProceeds: 446,
  refuseSpot: 214.05,
  bandSpot: 216.5,
  firstFillGas: 462_677,
  laterFillGas: 289_157,
  exerciseTs: 1_790_366_400,
  expiryTs: 1_790_452_800,
} as const;

const exercise = clockAt(EXAMPLE_WEEK.exerciseTs);
const expiry = clockAt(EXAMPLE_WEEK.expiryTs);

/** Preformatted strings for the example week, so call sites do not re-round. */
export const EXAMPLE = {
  week: fmtCount(EXAMPLE_WEEK.n),
  strike: fmtUsdg(EXAMPLE_WEEK.strike),
  spot: fmtUsdg(EXAMPLE_WEEK.spot),
  ask: fmtUsdg(EXAMPLE_WEEK.ask, 3),
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
  perShare: fmtUsdg(EXAMPLE_WEEK.perShare, 3),
  assigned: fmtCount(EXAMPLE_WEEK.assigned),
  strikeProceeds: fmtUsdg(EXAMPLE_WEEK.strikeProceeds),
  refuseSpot: fmtUsdg(EXAMPLE_WEEK.refuseSpot),
  bandSpot: fmtUsdg(EXAMPLE_WEEK.bandSpot),
  firstFillGas: fmtCount(EXAMPLE_WEEK.firstFillGas),
  laterFillGas: fmtCount(EXAMPLE_WEEK.laterFillGas),
  exercise,
  expiry,
} as const;
