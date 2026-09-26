"use client";

/**
 * The front-page payoff demo: the shared PayoffChart (app/_components/PayoffChart.tsx, the twin of
 * callhouse web/components/v2/PayoffChart.tsx) drawn from lib/examplePayoff.ts. No "example" label
 * and no instructions text; the chart and its interaction stay. The chart backs its implied vol out of the example ask, so the curve passes through that ask
 * at spot. The gesture code this file used to carry (pointer capture, touch axis-lock so vertical scroll still works,
 * keyboard steps) now lives in PayoffChart, which was built from it.
 */
import { PayoffChart } from "@/app/_components/PayoffChart";
import { EXAMPLE_CHART, EXAMPLE_TAKE, formatUsdg } from "@/lib/examplePayoff";
import { buildPayoffChart, chartDomain, chartHeading, defaultHandlePrice, tooltipFor } from "@/lib/payoffChart";

export function PayoffDemo() {
  return <div className="rounded-lg border border-line bg-surface p-5 sm:p-7">
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <h3 className="text-xl font-bold">Move the stock price</h3>
      <span className="text-sm font-semibold text-accent-text">{chartHeading(EXAMPLE_CHART)}</span>
    </div>
    <PayoffChart input={EXAMPLE_CHART} className="mt-5" />
    <p className="mt-4 text-sm font-semibold text-ink">Max loss: {formatUsdg(EXAMPLE_TAKE.cost)} USDG.</p>
  </div>;
}

/**
 * The phone front page's compact static payoff card: the same chart,
 * drawn as the chart's static "mini" variant with its handle at the chart's default price, the cost next to its max
 * loss, and the P&L at that price. No controls; the interactive demo is the desktop section.
 */
export function PayoffCompactCard() {
  const model = buildPayoffChart(EXAMPLE_CHART);
  const price = defaultHandlePrice(EXAMPLE_CHART, chartDomain(EXAMPLE_CHART.isPut, EXAMPLE_CHART.strike, EXAMPLE_CHART.spot));
  const tip = tooltipFor(model, price);
  const cost = formatUsdg(EXAMPLE_TAKE.cost);
  return <div data-slot="payoff-compact" className="rounded-lg border border-line bg-surface p-4">
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-[15px] font-extrabold">{chartHeading(EXAMPLE_CHART)}</span>
    </div>
    <p className="mt-1 text-sm"><b className="num">{cost}</b> to play · <span className="text-danger-text">max loss <span className="num">−{cost}</span></span> (dashed line)</p>
    <PayoffChart input={EXAMPLE_CHART} variant="mini" price={price} className="mt-3" />
    <p className="mt-2 text-sm text-ink-2">{tip.title.replace(/^\S+ at /, "At ")}: <b className="num text-ink">{tip.headline}</b> at expiry</p>
  </div>;
}
