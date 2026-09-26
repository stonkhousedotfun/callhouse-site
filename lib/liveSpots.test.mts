/**
 * The front page's ticker cards read /v2/markets through getSpots, validated.
 * Where the API gives no usable spot -- a missing row, a
 * null spot, a broken row, an error -- getSpots no longer returns a not-ready card or null; it prices the card from the
 * chain (lib/spotFallback.ts). The cases below were "not ready" / null before; they now pin the fallback. The chain is
 * stubbed, so nothing here touches the network.
 */
import assert from "node:assert/strict";
import test from "node:test";

import { LIVE_MARKETS } from "./markets.generated.ts";
import { resetSpotCache, type Readers } from "./spotFallback.ts";

process.env.NEXT_PUBLIC_API_URL = "https://api.example.test";
const { getSpots } = await import("./live.ts");

const NOW = 1_790_000_000;
/** The chain prices every market at $225.55 (Chainlink), so a fallback card is recognisable. */
const chain: Readers = {
  chainlink: async () => ({ raw: 225_550_000n, updatedAt: NOW - 120 }),
  pool: async () => null,
  now: () => NOW,
};
/** The chain is down too. */
const noChain: Readers = { chainlink: async () => null, pool: async () => null, now: () => NOW };
const fromChain = (s: { spot: { raw: string } | null; spotUpdatedAt: number | null; source?: string }) =>
  s.spot?.raw === "225550000" && s.spotUpdatedAt === NOW - 120 && s.source === "chainlink";

const money = (raw: string) => ({ raw, decimals: 6 as const, formatted: (Number(raw) / 1e6).toFixed(2) });
const row = (ticker: string, over: Record<string, unknown> = {}) =>
  ({ ticker, name: `${ticker} name`, spot: money("229030000"), spotUpdatedAt: NOW - 60, ...over });
const json = (value: unknown) => new Response(JSON.stringify(value), { status: 200, headers: { "content-type": "application/json" } });
const live = LIVE_MARKETS as readonly string[];

test("one card per generated live market, in that order, from the response", async (t) => {
  resetSpotCache();
  t.mock.method(globalThis, "fetch", async () => json([...live].reverse().map((ticker) => row(ticker))));
  const spots = await getSpots(0, chain);
  assert.deepEqual(spots.map((s) => s.ticker), [...live]);
  assert.equal(spots[0]?.spot?.raw, "229030000");
  assert.equal(spots[0]?.name, `${live[0]} name`);
  assert.equal(spots[0]?.source, "api");
});

test("a market outside the live projection is ignored, and a missing live market is priced from the chain", async (t) => {
  resetSpotCache();
  t.mock.method(globalThis, "fetch", async () => json([row("ZZZZ"), row(live[0]!)]));
  const spots = await getSpots(0, chain);
  assert.equal(spots.length, live.length);
  assert.ok(!spots.some((s) => s.ticker === "ZZZZ"));
  assert.equal(spots[0]?.source, "api");
  for (const missing of spots.slice(1)) assert.ok(fromChain(missing), JSON.stringify(missing));
});

test("a null spot (the oracle read failed) is priced from the chain, never a zero", async (t) => {
  resetSpotCache();
  t.mock.method(globalThis, "fetch", async () => json(live.map((ticker) => row(ticker, { spot: null, spotUpdatedAt: null }))));
  const spots = await getSpots(0, chain);
  assert.ok(spots.every(fromChain));
});

test("with nothing able to price a market, its card has no price (null, never zero), and the list is never null", async (t) => {
  resetSpotCache();
  t.mock.method(globalThis, "fetch", async () => json(live.map((ticker) => row(ticker, { spot: null, spotUpdatedAt: null }))));
  const spots = await getSpots(0, noChain);
  assert.equal(spots.length, live.length);
  assert.ok(spots.every((s) => s.spot === null && s.spotUpdatedAt === null));
});

test("a broken live row voids the whole API read -- half a pair, a bad money object, no name -- and every card comes from the chain", async (t) => {
  for (const bad of [
    { spotUpdatedAt: null },
    { spot: null },
    { spot: { raw: "abc", decimals: 6, formatted: "x" } },
    { name: "" },
    { spotUpdatedAt: -1 },
  ]) {
    resetSpotCache();
    // The other live rows are well formed and priced: the broken one still voids them all.
    t.mock.method(globalThis, "fetch", async () => json(live.map((ticker, i) => row(ticker, i === 0 ? bad : {}))));
    const spots = await getSpots(0, chain);
    assert.ok(spots.every(fromChain), JSON.stringify(bad));
    assert.ok(spots.every((s) => s.name === s.ticker), "no name is taken from a voided read");
    t.mock.restoreAll();
  }
});

test("a non-array body, an HTTP error or a network failure: every card is priced from the chain", async (t) => {
  for (const answer of [
    async () => json({ items: [] }),
    async () => new Response("nope", { status: 503 }),
    async () => { throw new Error("offline"); },
  ]) {
    resetSpotCache();
    t.mock.method(globalThis, "fetch", answer);
    const spots = await getSpots(0, chain);
    assert.equal(spots.length, live.length);
    assert.ok(spots.every(fromChain));
    t.mock.restoreAll();
  }
});
