import assert from "node:assert/strict";
import test from "node:test";

import { requireExampleMultiple, requireNonBlankHref } from "./siteGuards.ts";

test("configured links reject blank URLs", () => {
  assert.equal(requireNonBlankHref("https://app.stonkhouse.fun"), "https://app.stonkhouse.fun");
  assert.throws(() => requireNonBlankHref(""), /must not be blank/);
  assert.throws(() => requireNonBlankHref("  "), /must not be blank/);
});

test("share examples reject vanished costs and multiples", () => {
  assert.equal(requireExampleMultiple(1_100_000n, 14.9), 14.9);
  assert.throws(() => requireExampleMultiple(0n, null), /positive cost/);
  assert.throws(() => requireExampleMultiple(1n, Number.NaN), /finite multiple/);
});
