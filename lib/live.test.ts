/**
 * The front page's ticker cards always carry a price. getSpots
 * feeds tickerCardView, and with the API empty, down or broken the cards are priced from the chain, so the card's
 * not-ready branch is not reached. The chain is stubbed; nothing here touches the network.
 */
import assert from "node:assert/strict";
import test from "node:test";

import type { ChainPrice } from "./chainPrice.ts";
import { tickerCardView } from "./frontPage.ts";
import { LIVE_MARKETS } from "./markets.generated.ts";
import { resetSpotCache, type Readers } from "./spotFallback.ts";

process.env.NEXT_PUBLIC_API_URL = "https://api.example.test";
const { getSpots } = await import("./live.ts");

const NOW = 1_790_000_000;
const json = (value: unknown) => new Response(JSON.stringify(value), { status: 200, headers: { "content-type": "application/json" } });
const PRICES: Record<string, bigint> = { NVDA: 225_550_000n, SPCX: 148_770_000n };
const feedOnly: Readers = {
  chainlink: async (source) => {
    const ticker = source.feed === "0x379EC4f7C378F34a1B47E4F3cbeBCbAC3E8E9F15" ? "NVDA" : "SPCX";
    return { raw: PRICES[ticker]!, updatedAt: NOW - 120 } satisfies ChainPrice;
  },
  pool: async () => null,
  now: () => NOW,
};

for (const [name, answer] of [
  ["the API answers an empty list", () => json([])],
  ["the API is down", () => new Response("down", { status: 503 })],
  ["the API is unreachable", () => { throw new Error("offline"); }],
  ["the API sends null spots", () => json(LIVE_MARKETS.map((ticker) => ({ ticker, name: ticker, spot: null, spotUpdatedAt: null })))],
] as const) {
  test(`${name}: every launch market is still priced, from the Chainlink feed`, async (t) => {
    resetSpotCache();
    t.mock.method(globalThis, "fetch", async () => answer());
    const spots = await getSpots(0, feedOnly);
    assert.deepEqual(spots.map((s) => s.ticker), [...LIVE_MARKETS]);
    for (const s of spots) {
      assert.equal(s.source, "chainlink");
      assert.equal(s.spot?.raw, PRICES[s.ticker]!.toString());
      assert.equal(s.spotUpdatedAt, NOW - 120);
      const card = tickerCardView(s);
      assert.ok(card.price !== null, `${s.ticker} card has a price`);
    }
    assert.equal(tickerCardView(spots.find((s) => s.ticker === "NVDA")!).price, "$225.55");
  });
}

test("the API's own spot wins when it is present and fresh", async (t) => {
  resetSpotCache();
  const money = { raw: "229030000", decimals: 6, formatted: "229.03" };
  t.mock.method(globalThis, "fetch", async () =>
    json(LIVE_MARKETS.map((ticker) => ({ ticker, name: `${ticker} name`, spot: money, spotUpdatedAt: NOW - 60 }))));
  const spots = await getSpots(0, feedOnly);
  for (const s of spots) {
    assert.equal(s.source, "api");
    assert.deepEqual(s.spot, money);
    assert.equal(s.name, `${s.ticker} name`);
  }
});

test("with the API and the chain both down, the last good price is shown with its own time", async (t) => {
  resetSpotCache();
  t.mock.method(globalThis, "fetch", async () => json([]));
  await getSpots(0, feedOnly);
  const down: Readers = { chainlink: async () => null, pool: async () => null, now: () => NOW + 3_600 };
  const spots = await getSpots(0, down);
  for (const s of spots) {
    assert.equal(s.source, "cached");
    assert.equal(s.spot?.raw, PRICES[s.ticker]!.toString());
    assert.equal(s.spotUpdatedAt, NOW - 120);
  }
});
