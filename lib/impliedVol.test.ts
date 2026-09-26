/**
 * lib/impliedVol.ts, the twin of callhouse web/lib/v2/impliedVol.ts. These are the app's cases,
 * ported from vitest to node:test (this package's runner) with the same inputs and reference values. `close` is
 * vitest's toBeCloseTo rule: |actual - expected| < 10^-digits / 2. Reference values are textbook Black–Scholes
 * (r = 0), computed independently of the code under test (Python math.erf).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { SECONDS_PER_YEAR, VOL_MAX, VOL_MIN, bsPrice, impliedVol, intrinsic, normCdf } from "./impliedVol.ts";

const oneDay = 86_400 / SECONDS_PER_YEAR;

function close(actual: number, expected: number, digits: number, label = "") {
  const tolerance = 10 ** -digits / 2;
  assert.ok(Math.abs(actual - expected) < tolerance, `${label} ${actual} is not within ${tolerance} of ${expected}`.trim());
}

describe("normal CDF", () => {
  it("matches math.erf to 1e-12", () => {
    close(normCdf(0), 0.5, 12);
    close(normCdf(1), 0.8413447460685429, 12);
    close(normCdf(-1.96), 0.024997895148220428, 12);
    close(normCdf(3), 0.9986501019683699, 12);
  });
});

describe("Black–Scholes, r = 0", () => {
  it("prices an at-the-money call and put the same (put–call parity at the money)", () => {
    // ATM, r = 0: C = P = S (2N(σ√T/2) − 1). σ = 0.2, T = 1: 100 × (2N(0.1) − 1) = 7.9655674554.
    const call = bsPrice({ isPut: false, spot: 100, strike: 100, years: 1 }, 0.2);
    const put = bsPrice({ isPut: true, spot: 100, strike: 100, years: 1 }, 0.2);
    close(call, 7.965567455405798, 9);
    close(put, call, 9);
  });

  it("satisfies parity C − P = S − K off the money", () => {
    const input = { spot: 229.03, strike: 236, years: 3 * oneDay };
    const call = bsPrice({ ...input, isPut: false }, 0.6);
    const put = bsPrice({ ...input, isPut: true }, 0.6);
    close(call - put, 229.03 - 236, 9);
  });

  it("collapses to intrinsic at zero time or zero vol", () => {
    assert.equal(bsPrice({ isPut: false, spot: 250, strike: 236, years: 0 }, 0.5), 14);
    assert.equal(bsPrice({ isPut: true, spot: 230, strike: 236, years: 1 }, 0), 6);
    assert.equal(bsPrice({ isPut: false, spot: 230, strike: 236, years: 0 }, 0.5), 0);
  });

  it("rises with vol", () => {
    const input = { isPut: false, spot: 229.03, strike: 245, years: oneDay };
    assert.ok(bsPrice(input, 0.8) > bsPrice(input, 0.4));
  });
});

describe("implied vol from the ask", () => {
  it("round-trips: the vol it returns reprices the ask", () => {
    for (const [isPut, strike, vol, days] of [
      [false, 236, 0.45, 1], [false, 245, 0.9, 1], [true, 220, 0.6, 3], [false, 229, 0.3, 6], [true, 240, 1.5, 0.25],
    ] as const) {
      const label = `${isPut ? "put" : "call"} ${strike}`;
      const input = { isPut, spot: 229.03, strike, years: days * oneDay };
      const ask = bsPrice(input, vol);
      const solved = impliedVol(input, ask);
      assert.equal(solved.ok, true, label);
      if (!solved.ok) continue;
      close(solved.vol, vol, 6, label);
      close(bsPrice(input, solved.vol), ask, 9, label);
    }
  });

  it("fits a 0.47 quote on a $245 call exactly, where a fixed 50 % vol would not", () => {
    const input = { isPut: false, spot: 229.03, strike: 245, years: oneDay };
    assert.ok(Math.abs(bsPrice(input, 0.5) - 0.47) > 0.01);
    const solved = impliedVol(input, 0.47);
    assert.equal(solved.ok, true);
    if (solved.ok) close(bsPrice(input, solved.vol), 0.47, 9);
  });

  it("refuses an ask below intrinsic, at zero time, above the model ceiling, and bad input", () => {
    const itm = { isPut: false, spot: 250, strike: 236, years: oneDay };
    assert.equal(intrinsic(itm), 14);
    assert.deepEqual(impliedVol(itm, 13), { ok: false, reason: "below-intrinsic" });
    assert.deepEqual(impliedVol({ ...itm, years: 0 }, 15), { ok: false, reason: "no-time" });
    assert.deepEqual(impliedVol({ ...itm, years: -1 }, 15), { ok: false, reason: "no-time" });
    // A call can never be worth the stock itself.
    assert.deepEqual(impliedVol(itm, 250), { ok: false, reason: "above-max" });
    // Worth more than the vol ceiling allows, but less than the stock.
    const otm = { isPut: false, spot: 100, strike: 150, years: oneDay };
    assert.ok(bsPrice(otm, VOL_MAX) < 99);
    assert.deepEqual(impliedVol(otm, 99), { ok: false, reason: "above-max" });
    assert.deepEqual(impliedVol(itm, 0), { ok: false, reason: "invalid" });
    assert.deepEqual(impliedVol(itm, Number.NaN), { ok: false, reason: "invalid" });
    assert.deepEqual(impliedVol({ ...itm, spot: 0 }, 1), { ok: false, reason: "invalid" });
  });

  it("refuses a price above intrinsic that even the minimum vol overprices", () => {
    // At the money over a year, even VOL_MIN is worth 100 × (2N(0.0005) − 1) ≈ 0.0399 against intrinsic 0.
    const input = { isPut: false, spot: 100, strike: 100, years: 1 };
    close(bsPrice(input, VOL_MIN), 0.0399, 4);
    assert.deepEqual(impliedVol(input, 0.02), { ok: false, reason: "below-min-vol" });
  });
});
