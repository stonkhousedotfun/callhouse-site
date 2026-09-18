/** The v7 launch fee example: buyer USDG math and writer collateral rent are separate assets. */
import { Panel } from "@/components/ui";
import { EXAMPLE_TAKE, formatUsdg } from "@/lib/examplePayoff";
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
      <p className="mt-1 text-xs font-medium text-ink-3">Example · 1 NVDA call covering 1 share · ask 1.00 USDG</p>
    </div>
    <dl className="px-6">
      <Row label="Premium" value={`${formatUsdg(EXAMPLE_TAKE.premium)} USDG`} />
      <Row label="Buyer taker fee" note={`Lesser of ${formatUsdg(FEES_V2.takerFlatRaw)} USDG or ${FEES_V2.takerCapBps / 100}% of premium`} value={`${formatUsdg(EXAMPLE_TAKE.fee)} USDG`} />
      <Row label="Maximum option loss" note="Premium plus taker fee; network gas is extra" value={`${formatUsdg(EXAMPLE_TAKE.cost)} USDG`} />
      <Row label="Primary premium fee" note={`${FEES_V2.premiumBps / 100}% planned launch default`} value={`${formatUsdg(premiumFee)} USDG`} />
      <Row label="Writer collateral rent" note="Charged at mint in the collateral asset; market rate and time to expiry vary" value="Varies" />
    </dl>
    <dl><div className="mt-3 flex justify-between gap-4 bg-accent-soft px-6 py-5">
      <dt className="font-bold text-accent-text">Premium to writer on this fill</dt>
      <dd className="num text-xl font-semibold text-accent-text">{formatUsdg(writerPremium)} USDG</dd>
    </div></dl>
    <p className="px-6 py-5 text-sm text-ink-2">
      At an in-the-money settlement, the exercise fee is {FEES_V2.exerciseBps / 100}% of collateral and
      never more than {FEES_V2.exercisePayoutCapBps / 100}% of the payout. It is taken from the
      payout. Premium is paid only if a buyer fills. A writer pays rent when the option is minted,
      even if its premium is lower than the rent. Closing a matching long and short before expiry
      returns unused rent to whoever closes, in the collateral asset; no rent is refunded at or after expiry.
    </p>
  </Panel>;
}
