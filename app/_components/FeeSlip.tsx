/**
 * "What reaches depositors": the fee slip beside the benefits list.
 *
 * The figures are cycle 1 of the keeper's fork rehearsal, to the base unit
 * (leekzor/callhouse: keeper/dryrun-out/2026-09-13T21-19-16-086Z/report.md: unitPrice6 873192,
 * gross6 20083416, toOvercall6 1004157, toVault6 19079259, harvest fee 953962, net 18125297), and
 * they reconcile the way the contracts round: Overcall's 5% is taken per contract and rounded
 * down (0.043659 x 23), and the protocol fee is 5% of what the vault received, rounded down.
 * They are an example, labelled as one, not a quote or a forecast.
 */
import type { ReactNode } from "react";

import { Num, Panel } from "@/components/ui";

const MINUS = "−";

function Row({ label, note, value, minus = false }: { label: string; note?: ReactNode; value: string; minus?: boolean }) {
  return (
    <div className="flex justify-between gap-4 border-b border-dashed border-line-2 py-[11px] text-[15px]">
      <dt className="text-ink-2">
        {label}
        {note ? <small className="block text-[12.5px] text-ink-3">{note}</small> : null}
      </dt>
      <dd className={minus ? "num whitespace-nowrap text-right text-ink-2" : "num whitespace-nowrap text-right"}>
        {minus ? `${MINUS} ${value}` : value}
      </dd>
    </div>
  );
}

export function FeeSlip() {
  return (
    <Panel as="article" lift pad="none" aria-labelledby="slip-h" className="overflow-hidden">
      <div className="flex flex-wrap items-baseline justify-between gap-2.5 px-6 pb-4 pt-[22px]">
        <h3 id="slip-h" className="text-[17px] font-bold">
          What reaches depositors
        </h3>
        <span className="num text-xs font-medium text-ink-3">example · 23 calls filled</span>
      </div>

      <div
        aria-hidden="true"
        className="mx-1 h-3.5"
        style={{
          backgroundImage: "radial-gradient(circle at 7px 7px, var(--ground) 5px, transparent 5.5px)",
          backgroundSize: "14px 14px",
          backgroundRepeat: "repeat-x",
        }}
      />

      <dl className="px-6 pb-1.5 pt-2">
        <Row
          label="Buyers paid"
          note={
            <>
              <Num>23 × 0.873192</Num> USDG
            </>
          }
          value="20.083416"
        />
        <Row label="Overcall's 5%" note="taken inside each fill" value="1.004157" minus />
        <Row label="Vault receives" value="19.079259" />
        <Row label="Stonkhouse 5%" note="of premium only" value="0.953962" minus />
      </dl>

      <dl>
        <div className="flex flex-wrap items-baseline justify-between gap-3 bg-accent-soft px-6 pb-[22px] pt-[18px]">
          <dt className="font-bold text-accent-text">Credited to depositors</dt>
          <dd className="num text-[28px] font-semibold leading-none text-accent-text">18.125297</dd>
        </div>
      </dl>

      <p className="px-6 pb-5 pt-3.5 text-[13px] text-ink-3">
        USDG, split pro rata across all cNVDA shares. Strike proceeds from an assignment would be added in full,
        with no fee. Figures from the fork rehearsal, not a live week or a forecast.
      </p>
    </Panel>
  );
}
