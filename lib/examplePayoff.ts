/** Labelled illustration, never a live quote or a forecast. */
import { conversionFloorBps } from "./fees.ts";
import { costToBuy, multipleAt, payoutAt } from "./payoff.ts";
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
export const EXAMPLE_MULTIPLE = multipleAt(EXAMPLE_PAYOFF.target, EXAMPLE_POSITION, EXAMPLE_TAKE.cost);

export function formatUsdg(raw: bigint, decimals = 2): string {
  const scale = 10n ** BigInt(6 - decimals);
  const rounded = (raw + scale / 2n) / scale;
  const divisor = 10n ** BigInt(decimals);
  return `${(rounded / divisor).toString()}.${(rounded % divisor).toString().padStart(decimals, "0")}`;
}
