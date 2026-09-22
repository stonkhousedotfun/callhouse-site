/** The replacement-contract fee example. These design values are not active before broadcast. */
import { Panel } from "@/components/ui";
import { EXAMPLE_TAKE, formatUsdg } from "@/lib/examplePayoff";
import { writerCollateralHeadline } from "@/lib/fees";
import { FEES_V2 } from "@/lib/site";

const premiumFee = EXAMPLE_TAKE.premium * BigInt(FEES_V2.premiumBps) / 10_000n;
const writerPremium = EXAMPLE_TAKE.premium - premiumFee;

function Row({ label, value, note }: { label: string; value: string; note?: string }) {
  return <div className="flex justify-between gap-4 border-b border-dashed border-line-2 py-3 text-sm">
    <dt className="text-ink-2">{label}{note ? <small className="block text-xs text-ink-3">{note}</small> : null}</dt>
    <dd className="num whitespace-nowrap text-right font-medium">{value}</dd>
  </div>;
}

export function FeeSlip() {
  return <Panel as="article" lift pad="none" aria-labelledby="slip-h" className="overflow-hidden">
    <div className="px-6 pb-4 pt-6">
      <h3 id="slip-h" className="text-lg font-bold">What the fees look like</h3>
      <p className="mt-1 text-xs font-medium text-ink-3">1 NVDA call covering 1 share · ask 1.00 USDG</p>
    </div>
    <dl className="px-6">
      <Row label="Premium" value={`${formatUsdg(EXAMPLE_TAKE.premium)} USDG`} />
      <Row label="Buyer taker fee" note={`Undiscounted: lesser of ${formatUsdg(FEES_V2.takerFlatRaw)} USDG or ${FEES_V2.takerCapBps / 100}% of premium`} value={`${formatUsdg(EXAMPLE_TAKE.fee)} USDG`} />
      <Row label="Maximum option loss" note="Premium plus taker fee; network gas is extra" value={`${formatUsdg(EXAMPLE_TAKE.cost)} USDG`} />
      <Row label="First-sale premium fee" note={`${FEES_V2.premiumBps / 100}% of premium in the replacement design`} value={`${formatUsdg(premiumFee)} USDG`} />
      <Row label="True-resale premium fee" note="A resale of an existing long does not mint a new option" value={`${FEES_V2.resalePremiumBps / 100}%`} />
      <Row label="Writer collateral charge" note={`Launch rate ${FEES_V2.writerCollateralRatePpm} ppm; a change for new series needs ${FEES_V2.marketFeeChangeDelayHours} hours' notice`} value={writerCollateralHeadline(FEES_V2.writerCollateralRatePpm)} />
    </dl>
    <dl><div className="mt-3 flex justify-between gap-4 bg-accent-soft px-6 py-5">
      <dt className="font-bold text-accent-text">Premium to writer on this fill</dt>
      <dd className="num text-xl font-semibold text-accent-text">{formatUsdg(writerPremium)} USDG</dd>
    </div></dl>
    <p className="px-6 py-5 text-sm text-ink-2">
      At an in-the-money settlement, the exercise fee is {FEES_V2.exerciseBps / 100}% of collateral and
      never more than {FEES_V2.exercisePayoutCapBps / 100}% of the payout. It is taken from the
      payout. Premium is paid only if a buyer fills. The replacement design charges {FEES_V2.premiumBps / 100}%
      on a first sale and {FEES_V2.resalePremiumBps / 100}% on a true resale. General fee changes have
      {FEES_V2.feeChangeDelayHours} hours&apos; notice; exercise and collateral-rate changes have
      {FEES_V2.marketFeeChangeDelayHours} hours&apos; notice. Each take carries a maximum total fee and
      reverts if its taker-side total would exceed that limit. None of these replacement-contract
      settings is active before broadcast.
    </p>
  </Panel>;
}
