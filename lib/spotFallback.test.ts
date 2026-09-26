/** The ticker price chain runs in order -- API, Chainlink, pool, last good -- with the chain stubbed. */
import assert from "node:assert/strict";
import test from "node:test";

import type { ChainPrice } from "./chainPrice.ts";
import { MAX_API_AGE_S, MEMO_S, resetSpotCache, resolveSpot, usdgMoney, type Readers } from "./spotFallback.ts";

const NOW = 1_790_000_000;

/** Readers that answer as told and count their calls. `null` fails; a thrown error also fails. */
function readers(feed: ChainPrice | null | Error, pool: ChainPrice | null | Error, now = () => NOW) {
  const calls = { chainlink: 0, pool: 0 };
  const answer = async (value: ChainPrice | null | Error) => {
    if (value instanceof Error) throw value;
    return value;
  };
  const r: Readers = {
    chainlink: async () => (calls.chainlink++, answer(feed)),
    pool: async () => (calls.pool++, answer(pool)),
    now,
  };
  return { r, calls };
}

test("1. the API's fresh spot is used as is, and the chain is not read", async () => {
  resetSpotCache();
  const { r, calls } = readers({ raw: 1n, updatedAt: NOW }, { raw: 2n, updatedAt: NOW });
  const got = await resolveSpot("NVDA", { raw: 229_030_000n, updatedAt: NOW - 60 }, r);
  assert.deepEqual(got, { raw: 229_030_000n, updatedAt: NOW - 60, source: "api" });
  assert.deepEqual(calls, { chainlink: 0, pool: 0 });
});

test("2. no API spot: the Chainlink feed", async () => {
  resetSpotCache();
  const { r, calls } = readers({ raw: 225_550_000n, updatedAt: NOW - 30 }, { raw: 225_570_000n, updatedAt: NOW });
  assert.deepEqual(await resolveSpot("NVDA", null, r), { raw: 225_550_000n, updatedAt: NOW - 30, source: "chainlink" });
  assert.deepEqual(calls, { chainlink: 1, pool: 0 });
});

test("2b. a stale or zero API spot also falls through to Chainlink", async () => {
  for (const api of [{ raw: 229_030_000n, updatedAt: NOW - MAX_API_AGE_S - 1 }, { raw: 0n, updatedAt: NOW }]) {
    resetSpotCache();
    const { r } = readers({ raw: 225_550_000n, updatedAt: NOW - 30 }, null);
    assert.equal((await resolveSpot("NVDA", api, r))?.source, "chainlink", JSON.stringify(api, (_k, v) => typeof v === "bigint" ? `${v}` : v));
  }
});

test("3. Chainlink stale or failing: the pool", async () => {
  for (const feed of [null, new Error("rpc down")]) {
    resetSpotCache();
    const { r, calls } = readers(feed, { raw: 149_070_000n, updatedAt: NOW });
    assert.deepEqual(await resolveSpot("SPCX", null, r), { raw: 149_070_000n, updatedAt: NOW, source: "pool" });
    assert.deepEqual(calls, { chainlink: 1, pool: 1 });
  }
});

test("4. everything failing: the last good price, with the time it was true", async () => {
  resetSpotCache();
  const up = readers({ raw: 225_550_000n, updatedAt: NOW - 30 }, null);
  await resolveSpot("NVDA", null, up.r);
  const later = NOW + MEMO_S + 1;
  const down = readers(null, new Error("rpc down"), () => later);
  assert.deepEqual(await resolveSpot("NVDA", null, down.r), { raw: 225_550_000n, updatedAt: NOW - 30, source: "cached" });
  assert.deepEqual(down.calls, { chainlink: 1, pool: 1 }, "the chain was asked again after the reuse window");
});

test("4b. an API price is remembered too, and serves when the API and the chain are both gone", async () => {
  resetSpotCache();
  await resolveSpot("SPCX", { raw: 150_000_000n, updatedAt: NOW - 10 }, readers(null, null).r);
  assert.deepEqual(await resolveSpot("SPCX", null, readers(null, null).r), { raw: 150_000_000n, updatedAt: NOW - 10, source: "cached" });
});

test("nothing has ever priced the market: null, never zero", async () => {
  resetSpotCache();
  assert.equal(await resolveSpot("NVDA", null, readers(null, null).r), null);
  assert.equal(await resolveSpot("ZZZZ", null, readers({ raw: 1n, updatedAt: NOW }, null).r), null, "no chain source for it");
});

test("chain reads are reused for MEMO_S seconds, then asked again", async () => {
  resetSpotCache();
  let now = NOW;
  const { r, calls } = readers({ raw: 225_550_000n, updatedAt: NOW - 30 }, null, () => now);
  await resolveSpot("NVDA", null, r);
  now = NOW + MEMO_S - 1;
  await resolveSpot("NVDA", null, r);
  assert.equal(calls.chainlink, 1, "reused inside the window");
  now = NOW + MEMO_S;
  await resolveSpot("NVDA", null, r);
  assert.equal(calls.chainlink, 2, "asked again after it");
});

test("usdgMoney: 6 dp base units as dollars and cents, floored", () => {
  assert.deepEqual(usdgMoney(229_030_000n), { raw: "229030000", decimals: 6, formatted: "229.03" });
  assert.equal(usdgMoney(225_549_999n).formatted, "225.54");
  assert.equal(usdgMoney(5n).formatted, "0.00");
  assert.equal(usdgMoney(1_234_500_000_000n).formatted, "1234500.00");
});
