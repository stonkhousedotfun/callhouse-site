/**
 * Times are shown in the reader's zone, named; market deadlines also show New York time. Every
 * case pins its zone, so the result does not depend on the machine running the test.
 */
import assert from "node:assert/strict";
import test from "node:test";

import { MARKET_ZONE, marketAt, viewerAt } from "./clock.ts";

// Friday 2026-09-25 16:00 New York (EDT) = 20:00 UTC.
const CLOSE = 1_790_366_400;

test("the server string is New York time with the zone named", () => {
  assert.equal(MARKET_ZONE, "America/New_York");
  assert.equal(marketAt(CLOSE), "Sep 25, 4:00 PM EDT");
  assert.equal(marketAt(CLOSE, true), "4:00 PM EDT");
});

test("a reader outside New York sees their own zone, named", () => {
  assert.equal(viewerAt(CLOSE, { timeZone: "America/Los_Angeles" }), "Sep 25, 1:00 PM PDT");
  assert.equal(viewerAt(CLOSE, { timeZone: "America/Los_Angeles", dateless: true }), "1:00 PM PDT");
});

test("a market deadline keeps New York time beside the reader's", () => {
  assert.equal(viewerAt(CLOSE, { timeZone: "America/Los_Angeles", market: true }), "Sep 25, 1:00 PM PDT (4:00 PM ET)");
  assert.equal(viewerAt(CLOSE, { timeZone: "Asia/Tokyo", market: true }), "Sep 26, 5:00 AM GMT+9 (4:00 PM ET)");
});

test("a reader on New York time sees the deadline once", () => {
  assert.equal(viewerAt(CLOSE, { timeZone: "America/New_York", market: true }), "Sep 25, 4:00 PM EDT");
  assert.equal(viewerAt(CLOSE, { timeZone: "America/Toronto", market: true }), "Sep 25, 4:00 PM EDT");
});

test("no UTC line survives", () => {
  for (const s of [marketAt(CLOSE), viewerAt(CLOSE, { timeZone: "Europe/London", market: true })]) {
    assert.doesNotMatch(s, /UTC/);
  }
});
