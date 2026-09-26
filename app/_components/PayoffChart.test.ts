/**
 * The front-page payoff chart. PayoffChart.tsx is the twin of callhouse web/components/v2/PayoffChart.tsx
 * (scripts/check-twins.mjs compares them), and its maths are unit-tested in lib/payoffChart.test.ts. This package's
 * runner is `node --experimental-strip-types --test`, which cannot load TSX, so the checks here are on the example
 * INPUT the demo draws and, at source level, on how PayoffDemo hosts the chart.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import { EXAMPLE_CHART, EXAMPLE_PAYOFF, EXAMPLE_PAYOUT, EXAMPLE_POSITION, EXAMPLE_TAKE } from "../../lib/examplePayoff.ts";
import { bsPrice, SECONDS_PER_YEAR } from "../../lib/impliedVol.ts";
import { breakeven } from "../../lib/payoff.ts";
import { buildPayoffChart, chartCaptions, chartDomain, defaultHandlePrice, tooltipFor } from "../../lib/payoffChart.ts";

const demo = readFileSync(new URL("./PayoffDemo.tsx", import.meta.url), "utf8");
const chart = readFileSync(new URL("./PayoffChart.tsx", import.meta.url), "utf8");
const usdg = (raw: bigint) => Number(raw) / 1e6;

describe("the example the demo draws", () => {
  it("is the labelled example: its strike, spot, size and cost, one day before expiry", () => {
    assert.equal(EXAMPLE_CHART.strike, EXAMPLE_PAYOFF.strike);
    assert.equal(EXAMPLE_CHART.spot, EXAMPLE_PAYOFF.spot);
    assert.equal(EXAMPLE_CHART.units, EXAMPLE_PAYOFF.units);
    assert.equal(EXAMPLE_CHART.cost, EXAMPLE_TAKE.cost);
    assert.equal(EXAMPLE_CHART.premium, EXAMPLE_TAKE.premium);
    assert.equal(EXAMPLE_CHART.expiry! - EXAMPLE_CHART.now!, 86_400);
  });

  it("backs its implied vol out of the example ask, so the curve passes through that ask at spot", () => {
    const model = buildPayoffChart(EXAMPLE_CHART);
    assert.equal(model.estimate.ok, true, "a vol reproduces the example ask");
    if (!model.estimate.ok) return;
    // The example's spot (212.38) sits BELOW the call's drawn domain, which starts near floor(K x 0.975),
    // so the chart hides "Now" there and `model.at(spot)` would clamp to the domain edge. An earlier draft read
    // the curve at `model.at(spot)` and compared it with the premium: that compared the value at 217, not at spot, and
    // could never hold. The premise is stated here, and the pass-through is checked where it is exact, below.
    const domain = chartDomain(false, EXAMPLE_CHART.strike, EXAMPLE_CHART.spot);
    assert.ok(EXAMPLE_CHART.spot! < domain.min, "spot is off the drawn domain, so the check below reprices at spot directly");
    // Spot is below the strike, so no exercise fee applies there. The fitted vol, repriced independently of the chart at
    // spot, gives back the example ask exactly: the curve and the quote agree.
    const perShare = bsPrice({ isPut: false, spot: usdg(EXAMPLE_CHART.spot!), strike: usdg(EXAMPLE_CHART.strike), years: 86_400 / SECONDS_PER_YEAR }, model.estimate.vol);
    assert.ok(Math.abs(perShare - usdg(EXAMPLE_PAYOFF.askPerShare)) < 1e-9);
  });

  it("values the call at expiry exactly as the rest of the page does: at its conversion floor", () => {
    const model = buildPayoffChart(EXAMPLE_CHART);
    const atTarget = model.at(EXAMPLE_PAYOFF.target);
    assert.equal(atTarget.expiryValue, EXAMPLE_PAYOUT, "the chart and EXAMPLE_PAYOUT agree at the example target");
    assert.equal(atTarget.pnl, EXAMPLE_PAYOUT - EXAMPLE_TAKE.cost);
    assert.equal(model.breakeven, breakeven(EXAMPLE_POSITION, EXAMPLE_TAKE.cost));
  });

  it("captions the site chart with one plain settlement line and nothing else", () => {
    const captions = chartCaptions(buildPayoffChart(EXAMPLE_CHART));
    assert.deepEqual(captions, ["Settles on the average price over the last 30 minutes before the close."]);
    for (const gone of ["Black", "implied vol", "Includes the exercise fee", "example", "live ask"]) {
      assert.equal(captions.join(" ").includes(gone), false, gone);
    }
  });

  it("opens the handle at spot + 5 % and reads the estimate as a day early", () => {
    const model = buildPayoffChart(EXAMPLE_CHART);
    const handle = defaultHandlePrice(EXAMPLE_CHART, chartDomain(false, EXAMPLE_CHART.strike, EXAMPLE_CHART.spot));
    const tip = tooltipFor(model, handle);
    assert.match(tip.title, /^NVDA at \$\d+\.\d\d$/);
    assert.match(tip.estimate, /if sold a day early$/);
  });
});

describe("PayoffDemo hosts the shared chart", () => {
  it("draws PayoffChart from the example chart input, with no example label and no instructions text", () => {
    assert.ok(demo.includes("<PayoffChart input={EXAMPLE_CHART}"), "PayoffDemo renders <PayoffChart input={EXAMPLE_CHART} />");
    // The "Example, not a live quote" label was removed, with the drag hint.
    for (const gone of ["Example, not a live quote", ">Example<", "Drag or tap the chart"]) {
      assert.equal(demo.includes(gone), false, `removed: ${gone}`);
    }
    assert.equal(/lib\/live/.test(demo), false, "the demo reads no live data");
  });

  it("keeps the site gesture code, which now lives in PayoffChart", () => {
    for (const piece of ["setPointerCapture", "TOUCH_DRAG_THRESHOLD", 'gesture.axis = "vertical"', "touch-pan-y", 'role="slider"']) {
      assert.ok(chart.includes(piece), `PayoffChart has ${piece}`);
    }
    assert.equal(demo.includes("setPointerCapture"), false, "no second copy left in PayoffDemo");
  });
});
