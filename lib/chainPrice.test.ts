/** The chain reads behind the ticker price, with the RPC stubbed (no network). */
import assert from "node:assert/strict";
import test from "node:test";

import {
  CHAIN_SOURCES,
  MAX_FEED_AGE_S,
  chainlinkPrice,
  poolPrice,
  poolPriceUsdg6,
  toUsdg6,
  type Rpc,
} from "./chainPrice.ts";

const NOW = 1_790_000_000;
const Q192 = 1n << 192n;
const word = (v: bigint) => (v < 0n ? (1n << 256n) + v : v).toString(16).padStart(64, "0");
const hex = (...words: bigint[]) => `0x${words.map(word).join("")}`;
/** latestRoundData(): (roundId, answer, startedAt, updatedAt, answeredInRound). */
const round = (answer: bigint, updatedAt: number) => hex(1n, answer, BigInt(updatedAt), BigInt(updatedAt), 1n);
/** A stub RPC answering by selector; anything else fails. */
const rpc = (answers: Record<string, string | null>): Rpc => async (_to, data) => answers[data] ?? null;
const DECIMALS = "0x313ce567";
const ROUND = "0xfeaf968c";
const SLOT0 = "0x3850c7bd";

function isqrt(n: bigint): bigint {
  if (n < 2n) return n;
  let x = n;
  let y = (x + 1n) / 2n;
  while (y < x) {
    x = y;
    y = (x + n / x) / 2n;
  }
  return x;
}

test("USDG 6 dp maps to dollars: $229.03 is 229030000 base units at any feed decimals", () => {
  assert.equal(toUsdg6(22_903_000_000n, 8), 229_030_000n);
  assert.equal(toUsdg6(229_030_000_000_000_000_000n, 18), 229_030_000n);
  assert.equal(toUsdg6(22_903n, 2), 229_030_000n);
  assert.equal(toUsdg6(22_903_999_999n, 8), 229_039_999n, "floored, never rounded up");
  assert.equal(toUsdg6(0n, 8), null);
  assert.equal(toUsdg6(-1n, 8), null);
});

test("the Chainlink leg prices a fresh positive answer and dates it with updatedAt", async () => {
  const at = NOW - 3_600;
  const price = await chainlinkPrice("0xfeed", NOW, rpc({ [DECIMALS]: hex(8n), [ROUND]: round(22_555_000_000n, at) }));
  assert.deepEqual(price, { raw: 225_550_000n, updatedAt: at });
});

test("the Chainlink leg is null when stale, from the future, not positive or unreadable", async () => {
  const cases: Array<[string, Record<string, string | null>]> = [
    ["stale", { [DECIMALS]: hex(8n), [ROUND]: round(22_555_000_000n, NOW - MAX_FEED_AGE_S - 1) }],
    ["future", { [DECIMALS]: hex(8n), [ROUND]: round(22_555_000_000n, NOW + 3_600) }],
    ["zero", { [DECIMALS]: hex(8n), [ROUND]: round(0n, NOW) }],
    ["negative", { [DECIMALS]: hex(8n), [ROUND]: round(-5n, NOW) }],
    ["no decimals", { [DECIMALS]: null, [ROUND]: round(22_555_000_000n, NOW) }],
    ["no round", { [DECIMALS]: hex(8n), [ROUND]: null }],
    ["short round", { [DECIMALS]: hex(8n), [ROUND]: hex(1n, 22_555_000_000n) }],
  ];
  for (const [name, answers] of cases) {
    assert.equal(await chainlinkPrice("0xfeed", NOW, rpc(answers)), null, name);
  }
  // The edge of the staleness bound is still fresh.
  const edge = await chainlinkPrice("0xfeed", NOW, rpc({ [DECIMALS]: hex(8n), [ROUND]: round(1_00_000_000n, NOW - MAX_FEED_AGE_S) }));
  assert.equal(edge?.raw, 1_000_000n);
});

test("the pool leg reads slot0 in both token orders as USDG per whole share", () => {
  const want = 225_550_000n; // $225.55
  // Stock = token0 (SPCX's pool): token1 (USDG) units per stock unit = want / 1e18.
  const sqrtStock0 = isqrt((want * Q192) / 10n ** 18n);
  // Stock = token1 (NVDA's pool): stock units per USDG unit = 1e18 / want.
  const sqrtStock1 = isqrt((10n ** 18n * Q192) / want);
  for (const [sqrt, stockIsToken0] of [[sqrtStock0, true], [sqrtStock1, false]] as const) {
    const got = poolPriceUsdg6(sqrt, stockIsToken0);
    assert.ok(got !== null && got >= want - 1n && got <= want + 1n, `${stockIsToken0 ? "token0" : "token1"}: ${got}`);
  }
  // The wrong orientation is not a plausible price, which is why the orientation is pinned per market.
  const flipped = poolPriceUsdg6(sqrtStock0, false);
  assert.ok(flipped === null || flipped > 10n ** 15n || flipped < 1_000n);
  assert.equal(poolPriceUsdg6(0n, true), null);
});

test("poolPrice reads the pool named for the market and dates the price now", async () => {
  const want = 149_070_000n;
  const sqrt = isqrt((want * Q192) / 10n ** 18n);
  const seen: string[] = [];
  const stub: Rpc = async (to, data) => {
    seen.push(`${to}:${data}`);
    // slot0 returns seven words; only the first (sqrtPriceX96) is read.
    return data === SLOT0 ? hex(sqrt, 0n, 0n, 0n, 0n, 0n, 1n) : null;
  };
  const price = await poolPrice(CHAIN_SOURCES.SPCX!, NOW, stub);
  assert.ok(price && price.raw >= want - 1n && price.raw <= want + 1n);
  assert.equal(price?.updatedAt, NOW);
  assert.deepEqual(seen, [`${CHAIN_SOURCES.SPCX!.pool}:${SLOT0}`]);
  assert.equal(await poolPrice(CHAIN_SOURCES.SPCX!, NOW, async () => null), null);
});

test("each launch market has a feed, a pool and a pinned token order", () => {
  assert.deepEqual(Object.keys(CHAIN_SOURCES).sort(), ["NVDA", "SPCX"]);
  for (const s of Object.values(CHAIN_SOURCES)) {
    assert.match(s.feed, /^0x[0-9a-fA-F]{40}$/);
    assert.match(s.pool, /^0x[0-9a-fA-F]{40}$/);
  }
  assert.equal(CHAIN_SOURCES.NVDA!.stockIsToken0, false, "NVDA pool: token0 is USDG");
  assert.equal(CHAIN_SOURCES.SPCX!.stockIsToken0, true, "SPCX pool: token0 is SPCX");
});
