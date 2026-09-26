/**
 * The Neon front page's figures, as pure
 * functions so node:test can check every number the page prints.
 *
 * The owner card's fee table is the product's own fee terms (FEES_V2) on a 1.00 ask (lib/examplePayoff.ts). The hero's
 * example ticket was removed with every "example" label. The ticker cards print only a
 * spot that came from /v2/markets (lib/live.ts getSpots). The API publishes no day change, so the cards carry no
 * "+1.51%": they say when the price last printed instead, or that there is no price yet. `updatedAt` is that print in
 * unix seconds; the page shows it with <LocalTime>, in the reader's own zone, never in UTC.
 */
import { EXAMPLE_TAKE, formatUsdg } from "./examplePayoff.ts";
import type { LiveSpot } from "./live.ts";
import { FEES_V2 } from "./site.ts";

export type TickerCardView = { ticker: string; name: string; price: string | null; note: string; updatedAt: number | null };

/** One ticker card: the oracle spot and when it printed, or the designed not-ready state. Never a zero price. */
export function tickerCardView(spot: LiveSpot): TickerCardView {
  const raw = spot.spot ? BigInt(spot.spot.raw) : 0n;
  if (!spot.spot || raw === 0n || spot.spotUpdatedAt === null) {
    return { ticker: spot.ticker, name: spot.name, price: null, note: "No price yet", updatedAt: null };
  }
  return {
    ticker: spot.ticker,
    name: spot.name,
    price: `$${formatUsdg(raw, 2)}`,
    note: "Oracle spot",
    updatedAt: spot.spotUpdatedAt,
  };
}

/** The ticker cards when /v2/markets did not answer: every launch market, not ready. */
export function notReadyTickers(tickers: readonly string[]): TickerCardView[] {
  return tickers.map((ticker) => ({ ticker, name: ticker, price: null, note: "No price yet", updatedAt: null }));
}

export type FeeRow = { label: string; value: string };

/**
 * The owner card's fee mini-table on the example's 1.00 ask: the buyer's capped taker fee and max
 * loss, the first-sale premium fee, the maker rebate and what the writer receives, from FEES_V2. The writer is the
 * maker of the filled ask, so the book credits it `premium - premium fee + rebate` (OrderBook.sol _credit on an ask
 * hit), the rebate being FEES_V2.makerRebateBps of the take's taker fee, never more than that fee.
 */
export function ownerFeeRows(): { ask: string; rows: FeeRow[]; writerReceives: string } {
  const premiumFee = (EXAMPLE_TAKE.premium * BigInt(FEES_V2.premiumBps)) / 10_000n;
  const rebate = (EXAMPLE_TAKE.fee * BigInt(FEES_V2.makerRebateBps)) / 10_000n;
  return {
    ask: formatUsdg(EXAMPLE_TAKE.premium),
    rows: [
      { label: "Buyer taker fee (capped)", value: formatUsdg(EXAMPLE_TAKE.fee) },
      { label: "Buyer max loss", value: formatUsdg(EXAMPLE_TAKE.cost) },
      { label: "First-sale premium fee", value: formatUsdg(premiumFee) },
      { label: "Maker rebate (from the taker fee)", value: formatUsdg(rebate) },
    ],
    writerReceives: formatUsdg(EXAMPLE_TAKE.premium - premiumFee + rebate),
  };
}
