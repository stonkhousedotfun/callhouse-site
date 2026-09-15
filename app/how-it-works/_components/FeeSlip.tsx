import { Panel } from "@/components/ui";
import { EXAMPLE } from "@/lib/exampleWeek";

/**
 * The mockup's fee slip: a lifted receipt that walks one example week from what buyers paid to
 * what depositors are credited. Figures from lib/exampleWeek.ts, labelled as an example. There is
 * one fee line because a listing has one payment leg, USDG to the vault
 * (stonkhousedotfun/callhouse-contracts src/lib/SeaportOrderLib.sol:179-213).
 */
const PERF = "radial-gradient(circle at 7px 7px, var(--ground) 5px, transparent 5.5px)";

export function FeeSlip() {
  return (
    <Panel as="article" lift pad="none" aria-labelledby="slip-h" className="relative overflow-hidden">
      <div className="flex flex-wrap items-baseline justify-between gap-2.5 px-6 pb-4 pt-[22px]">
        <h3 id="slip-h" className="text-[17px] font-bold">
          What reaches depositors
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
            <small className="block text-[12.5px] text-ink-3">of premium only</small>
          </dt>
          <dd className="num whitespace-nowrap text-right text-ink-2">− {EXAMPLE.fee}</dd>
        </div>
        <div className="-mx-6 mt-1.5 flex flex-wrap items-baseline justify-between gap-3 bg-accent-soft px-6 pb-[22px] pt-[18px]">
          <dt className="font-bold text-accent-text">Credited to depositors</dt>
          <dd className="num text-[28px] font-semibold leading-none text-accent-text">{EXAMPLE.net}</dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-dashed border-line-2 py-[11px] text-[15px]">
          <dt className="text-ink-2">
            Per cNVDA share
            <small className="block text-[12.5px] text-ink-3">over the {EXAMPLE.shares} shares then in the vault</small>
          </dt>
          <dd className="num whitespace-nowrap text-right text-ink">{EXAMPLE.perShare}</dd>
        </div>
      </dl>
      <div className="grid gap-2 px-6 pb-5 pt-3.5 text-[13px] text-ink-3">
        <p>
          USDG, split pro rata across all cNVDA shares. Figures from a fork rehearsal, not a live week. No other fee
          came out of the fills: each one paid the vault directly.
        </p>
        <p>
          The same week had {EXAMPLE.assigned} calls exercised at {EXAMPLE.strike}. Their {EXAMPLE.strikeProceeds} USDG
          of strike proceeds were added to the credit in full, and the fee line did not change.
        </p>
      </div>
    </Panel>
  );
}
