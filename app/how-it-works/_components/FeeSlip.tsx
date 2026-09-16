import { Panel } from "@/components/ui";
import { EXAMPLE } from "@/lib/exampleWeek";

/**
 * Fee slip: a lifted receipt from what buyers paid to what the writer receives in-wallet.
 * 5% is a Seaport consideration item. Figures from lib/exampleWeek.ts, labelled as an example.
 */
const PERF = "radial-gradient(circle at 7px 7px, var(--ground) 5px, transparent 5.5px)";

export function FeeSlip() {
  return (
    <Panel as="article" lift pad="none" aria-labelledby="slip-h" className="relative overflow-hidden">
      <div className="flex flex-wrap items-baseline justify-between gap-2.5 px-6 pb-4 pt-[22px]">
        <h3 id="slip-h" className="text-[17px] font-bold">
          What the writer receives
        </h3>
        <span className="font-mono text-[12px] font-medium leading-none text-ink-3">
          example · {EXAMPLE.sold} calls filled
        </span>
      </div>
      <div
        aria-hidden="true"
        className="mx-1 h-3.5 bg-repeat-x"
        style={{ backgroundImage: PERF, backgroundSize: "14px 14px" }}
      />
      <dl className="px-6 pt-2">
        <div className="flex justify-between gap-4 border-b border-dashed border-line-2 py-[11px] text-[15px]">
          <dt className="text-ink-2">
            Buyers paid
            <small className="block text-[12.5px] text-ink-3">
              ({EXAMPLE.fillA} + {EXAMPLE.fillB}) × {EXAMPLE.ask} USDG
            </small>
          </dt>
          <dd className="num whitespace-nowrap text-right text-ink">{EXAMPLE.gross}</dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-dashed border-line-2 py-[11px] text-[15px]">
          <dt className="text-ink-2">
            Stonkhouse 5%
            <small className="block text-[12.5px] text-ink-3">of the ask, paid in the fill</small>
          </dt>
          <dd className="num whitespace-nowrap text-right text-ink-2">− {EXAMPLE.fee}</dd>
        </div>
        <div className="-mx-6 mt-1.5 flex flex-wrap items-baseline justify-between gap-3 bg-accent-soft px-6 pb-[22px] pt-[18px]">
          <dt className="font-bold text-accent-text">Paid to the writer</dt>
          <dd className="num text-[28px] font-semibold leading-none text-accent-text">{EXAMPLE.net}</dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-dashed border-line-2 py-[11px] text-[15px]">
          <dt className="text-ink-2">
            Per filled lot
            <small className="block text-[12.5px] text-ink-3">premium on that contract, net of the fee</small>
          </dt>
          <dd className="num whitespace-nowrap text-right text-ink">{EXAMPLE.perShare}</dd>
        </div>
      </dl>
      <div className="grid gap-2 px-6 pb-5 pt-3.5 text-[13px] text-ink-3">
        <p>
          USDG to the wallet that owns the account. Figures from a labelled example, not a live week.
        </p>
        <p>
          The same week had {EXAMPLE.assigned} calls exercised at {EXAMPLE.strike}. Their {EXAMPLE.strikeProceeds} USDG
          of strike proceeds go to that same account in full, and the fee line does not change.
        </p>
      </div>
    </Panel>
  );
}
