/**
 * Every figure the Neon front page prints, checked against FEES_V2 and the 1.00 ask it comes from.
 * The hero's example ticket and every "example" label were removed, so the ticket test
 * went with them and the page test now checks the labels are gone.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { EXAMPLE_TAKE } from "./examplePayoff.ts";
import { notReadyTickers, ownerFeeRows, tickerCardView } from "./frontPage.ts";

const money = (raw: string) => ({ raw, decimals: 6 as const, formatted: "" });

// The card said 0.95 to the writer, but the live book (OrderBook feeParams() makerRebateBps 5000, read
// 2026-09-25) also pays the maker of the filled ask half the take's taker fee: 0.95 + 0.05. The old 0.95 was wrong.
test("the owner card's fee table on a 1.00 ask: 0.10 capped fee, 1.10 max loss, 0.05 first-sale fee, 0.05 maker rebate, 1.00 to the writer", () => {
  const f = ownerFeeRows();
  assert.equal(f.ask, "1.00");
  assert.deepEqual(f.rows, [
    { label: "Buyer taker fee (capped)", value: "0.10" },
    { label: "Buyer max loss", value: "1.10" },
    { label: "First-sale premium fee", value: "0.05" },
    { label: "Maker rebate (from the taker fee)", value: "0.05" },
  ]);
  assert.equal(f.writerReceives, "1.00");
  assert.equal(EXAMPLE_TAKE.cost, 1_100_000n);
});

test("a ticker card prints only a spot the oracle gave, with when it printed; otherwise the not-ready state", () => {
  const live = tickerCardView({ ticker: "NVDA", name: "NVIDIA", spot: money("229030000"), spotUpdatedAt: 1_790_000_000 });
  assert.equal(live.price, "$229.03");
  assert.equal(live.note, "Oracle spot");
  assert.equal(live.updatedAt, 1_790_000_000, "the print time goes to <LocalTime>, which names the reader's zone");
  for (const spot of [null, money("0")]) {
    const v = tickerCardView({ ticker: "SPCX", name: "SpaceX", spot, spotUpdatedAt: spot ? 1_790_000_000 : null });
    assert.equal(v.price, null, "never a zero or invented price");
    assert.equal(v.note, "No price yet");
    assert.equal(v.updatedAt, null);
  }
  assert.deepEqual(notReadyTickers(["NVDA", "SPCX"]).map((v) => [v.ticker, v.price]), [["NVDA", null], ["SPCX", null]]);
});

test("the page wires the figures and carries no example label or warning copy (source-level, the page is TSX)", () => {
  const page = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
  const text = page.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\{\/\*[\s\S]*?\*\/\}/g, "");
  assert.match(page, /Small bets on/);
  assert.match(page, /big stocks\./);
  for (const gone of ["Example ticket", "Example, not a live quote", "exampleTicket(", "Read the risks", "/risks", "not a typical return", "Quotes can change before checkout"]) {
    assert.equal(text.includes(gone), false, `removed on the owner's order: ${gone}`);
  }
  assert.match(page, /ownerFeeRows\(\)/);
  assert.match(page, /getSpots\(\)/);
  assert.match(page, /<PayoffDemo \/>/);
  assert.match(page, /Own the stock\? Get paid to sell calls\./);
  // The rule the test in site.test.ts pins stays: contracts render only for a non-empty validated feed.
  assert.match(page, /\{cards && cards\.length > 0 \? <Section id="contracts"/);
  // No bare multiple on the page: every "×" the page itself writes sits beside its scenario.
  assert.doesNotMatch(page, /pays up to/i);
});
