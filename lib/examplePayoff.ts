/** Labelled illustration, never a live quote or a forecast. */
import { conversionFloorBps } from "./fees.ts";
import { costToBuy, multipleAt, payoutAt } from "./payoff.ts";
import type { ChartInput } from "./payoffChart.ts";
import { FEES_V2 } from "./site.ts";

export const EXAMPLE_PAYOFF = {
  label: "Example",
  ticker: "NVDA",
  spot: 212_380_000n,
  strike: 223_000_000n,
  target: 240_000_000n,
  askPerShare: 1_000_000n,
  units: 100n, // one share, in 0.01-share contracts
  exerciseFeeBps: FEES_V2.exerciseBps,
} as const;

export const EXAMPLE_POSITION = {
  isPut: false,
  strike: EXAMPLE_PAYOFF.strike,
  units: EXAMPLE_PAYOFF.units,
  exerciseFeeBps: EXAMPLE_PAYOFF.exerciseFeeBps,
  // Worst permitted conversion loss, conditional on a successful route; not a live quote.
  conversionFloorBps: conversionFloorBps(300, 100),
};

export const EXAMPLE_TAKE = costToBuy(
  [{ orderId: "1", price: EXAMPLE_PAYOFF.askPerShare, units: EXAMPLE_PAYOFF.units }],
  EXAMPLE_PAYOFF.units,
  { takerFeeFlat: FEES_V2.takerFlatRaw, takerFeeCapBps: FEES_V2.takerCapBps, discountBps: 0 },
);
export const EXAMPLE_PAYOUT = payoutAt(EXAMPLE_PAYOFF.target, EXAMPLE_POSITION);

/** One day, in seconds: the example's time to expiry. */
export const EXAMPLE_SECONDS_LEFT = 86_400;

/**
 * The front-page PayoffChart input: the same labelled example, one day before expiry. `now` and
 * `expiry` are a fixed pair rather than the clock, so the prerendered page and every visitor draw the same curve. The
 * chart backs its implied vol out of the example ask (`premium`), so the curve passes through that ask at spot. It is
 * never a live quote, and the page says so.
 */
export const EXAMPLE_CHART: ChartInput = {
  ticker: EXAMPLE_PAYOFF.ticker,
  isPut: EXAMPLE_POSITION.isPut,
  strike: EXAMPLE_PAYOFF.strike,
  units: EXAMPLE_PAYOFF.units,
  spot: EXAMPLE_PAYOFF.spot,
  cost: EXAMPLE_TAKE.cost,
  premium: EXAMPLE_TAKE.premium,
  exerciseFeeBps: EXAMPLE_PAYOFF.exerciseFeeBps,
  // The call's payout is valued at the same conversion floor as EXAMPLE_POSITION (lib/payoff.test.ts pins that every
  // call the site builds names it), and the captions say "example ask", not "live ask".
  conversionFloorBps: EXAMPLE_POSITION.conversionFloorBps,
  quote: "example",
  expiry: EXAMPLE_SECONDS_LEFT,
  now: 0,
};
export const EXAMPLE_MULTIPLE = multipleAt(EXAMPLE_PAYOFF.target, EXAMPLE_POSITION, EXAMPLE_TAKE.cost);

export function formatUsdg(raw: bigint, decimals = 2): string {
  const scale = 10n ** BigInt(6 - decimals);
  const rounded = (raw + scale / 2n) / scale;
  const divisor = 10n ** BigInt(decimals);
  return `${(rounded / divisor).toString()}.${(rounded % divisor).toString().padStart(decimals, "0")}`;
}
