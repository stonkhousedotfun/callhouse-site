/**
 * "What reaches depositors": the fee slip beside the benefits list.
 *
 * The figures are week 2 of the keeper's fork rehearsal of the redesigned vault, to the base unit
 * (keeper/run-final/report.md, "Week 2": unitPrice6 856189; fills of 2 and 3 with premium 1712378 and
 * 2568567; listedDeposit.checkpointHarvest gross 4280945, fee 214047, net 4066898; totalSupply 15e18
 * at that checkpoint, 25 deposited less 5 + 2 + 3 redeemed in week 1). They reconcile the way the
 * contracts round:
 *
 *   gross         2 × 856189 + 3 × 856189 = 4280945          (one USDG leg per fill, to the vault:
 *                                                            src/lib/SeaportOrderLib.sol:179-213)
 *   protocol fee  floor(4280945 × 500 / 10000) = 214047      (src/Policy.sol:217-225, protocolFeeBps 500
 *                                                            at :135)
 *   net           4280945 − 214047 = 4066898
 *   per share     floor(4066898 × 1e27 / 15e18) = 271126533333333 per 1e27, i.e. 0.271126 USDG
 *                 per cNVDA (src/Distributor.sol:147, :124)
 *
 * The same week had 2 calls exercised at 223: 446 USDG of strike proceeds came back at the close and
 * were credited fee-free (harvest gross 450280945, fee still 214047; src/Vault.sol _accrueHarvest).
 * There is no venue fee line: a listing has exactly one payment leg, USDG to the vault.
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
        <span className="num text-xs font-medium text-ink-3">example · 5 calls filled</span>
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
              <Num>(2 + 3) × 0.856189</Num> USDG
            </>
          }
          value="4.280945"
        />
        <Row label="Stonkhouse 5%" note="of premium only" value="0.214047" minus />
      </dl>

      <dl>
        <div className="flex flex-wrap items-baseline justify-between gap-3 bg-accent-soft px-6 pb-[22px] pt-[18px]">
          <dt className="font-bold text-accent-text">Credited to depositors</dt>
          <dd className="num text-[28px] font-semibold leading-none text-accent-text">4.066898</dd>
        </div>
      </dl>

      <dl className="px-6 pt-1.5">
        <Row
          label="Per cNVDA share"
          note={
            <>
              over the <Num>15</Num> shares then in the vault
            </>
          }
          value="0.271126"
        />
      </dl>

      <p className="px-6 pb-5 pt-3.5 text-[13px] text-ink-3">
        USDG, split pro rata across all cNVDA shares. The same week had <span className="num">2</span> calls exercised
        at <span className="num">223</span>: their <span className="num">446</span> USDG of strike proceeds were added
        in full, with no fee. Figures from a fork rehearsal, not a live week or a forecast.
      </p>
    </Panel>
  );
}
