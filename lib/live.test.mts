import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { LIVE_MARKETS, REGISTRY_MARKET_COUNT, STATUS, marketAvailabilityStatus, marketAvailabilitySummary } from "./site.ts";

process.env.NEXT_PUBLIC_API_URL = "https://api.example.test";
const { getCards, getHero } = await import("./live.ts");
const listedTicker: string | undefined = (LIVE_MARKETS as readonly string[])[0];
const unlistedTicker = Array.from({ length: REGISTRY_MARKET_COUNT + 1 }, (_, i) => `X${i}`)
  .find((ticker) => !(LIVE_MARKETS as readonly string[]).includes(ticker));
assert.ok(unlistedTicker, "a ticker outside the generated live projection exists");

const money = (raw = "1000000") => ({ raw, decimals: 6 as const, formatted: "1.000000" });
function card(ticker: string) {
  return {
    series: {
      longId: "1",
      ticker,
      isPut: false,
      strike: money("200000000"),
      expiry: Math.floor(Date.now() / 1000) + 3_600,
      status: "open",
    },
    spot: money("210000000"),
    ask: money(),
    target: money("220000000"),
    perUnit: { cost: money(), payoutAtTarget: money("2000000"), multiple: 2 },
    perShare: { cost: money("100000000"), payoutAtTarget: money("200000000"), multiple: 2 },
    maxLoss: "cost",
    unitsAvailable: "100",
  };
}

function json(value: unknown): Response {
  return new Response(JSON.stringify(value), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

test("hero and cards reject a valid-shaped ticker outside generated live markets", async (t) => {
  t.mock.method(globalThis, "fetch", async (input: RequestInfo | URL) => {
    const url = String(input);
    return url.endsWith("/v2/cards/hero")
      ? json({ card: card(unlistedTicker) })
      : json({ items: [card(listedTicker ?? unlistedTicker), card(unlistedTicker)] });
  });

  assert.equal(await getHero(0), null);
  assert.equal(await getCards(), null);
});

test("hero and cards accept exactly tickers in the generated live-market projection", async (t) => {
  const ticker = listedTicker ?? unlistedTicker;
  t.mock.method(globalThis, "fetch", async (input: RequestInfo | URL) => {
    const url = String(input);
    return url.endsWith("/v2/cards/hero")
      ? json({ card: card(ticker) })
      : json({ items: [card(ticker)] });
  });

  assert.equal((await getHero(0))?.series.ticker ?? null, listedTicker ?? null);
  assert.deepEqual((await getCards())?.map((item) => item.series.ticker) ?? null,
    listedTicker ? [listedTicker] : null);
});

test("hero accepts a live-market card whose spot is null", async (t) => {
  if (!listedTicker) return t.skip("the registry has no live v2 market");
  t.mock.method(globalThis, "fetch", async () => json({ card: { ...card(listedTicker), spot: null } }));
  const hero = await getHero(0);
  assert.equal(hero?.series.ticker, listedTicker);
  assert.equal(hero?.spot, null);
});

test("cards keep a null-spot sibling instead of blanking the row", async (t) => {
  if (!listedTicker) return t.skip("the registry has no live v2 market");
  t.mock.method(globalThis, "fetch", async () => json({
    items: [{ ...card(listedTicker), spot: null }, card(listedTicker)],
  }));
  const items = await getCards();
  assert.deepEqual(items?.map((item) => item.spot === null), [true, false]);
});

test("public availability follows the generated market projection", () => {
  assert.equal(STATUS.v2, marketAvailabilityStatus(LIVE_MARKETS));
  assert.equal(marketAvailabilitySummary(LIVE_MARKETS, REGISTRY_MARKET_COUNT),
    `${LIVE_MARKETS.length} of ${REGISTRY_MARKET_COUNT} markets live`);
});

test("generated market list equals the v8 registry projection", {
  skip: !process.env.CALLHOUSE_WEB_DIR && "set CALLHOUSE_WEB_DIR for the cross-repository property",
}, async () => {
  const registry = execFileSync("git", ["-C", resolve(process.env.CALLHOUSE_WEB_DIR!, ".."),
    "show", "v8:ops/markets/tier1.json"], { encoding: "utf8" });
  const parsed = JSON.parse(registry);
  const oneRow = { ...parsed, markets: parsed.markets.slice(0, 1) };
  const stale = JSON.parse(registry);
  stale.markets[0].v2.status = "live";
  stale.markets[0].v2.registeredAt = 123;
  const { assertV8RegistrySource } = await import(new URL("../scripts/market-projection.mjs", import.meta.url).href);
  assert.doesNotThrow(() => assertV8RegistrySource(registry));
  assert.throws(() => assertV8RegistrySource(JSON.stringify(oneRow)), /not pinned v8 blob/);
  assert.throws(() => assertV8RegistrySource(JSON.stringify(stale)), /not pinned v8 blob/);
  const generator = fileURLToPath(new URL("../scripts/gen-markets.mjs", import.meta.url));
  const result = spawnSync(process.execPath, [generator, "--check", "--registry", "/dev/stdin"],
    { input: registry, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
});
