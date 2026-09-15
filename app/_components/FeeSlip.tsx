/**
 * "What reaches depositors": the fee slip beside the benefits list.
 *
 * Figures are week 2 of the keeper's fork rehearsal — see lib/exampleWeek.ts. They reconcile the
 * way the contracts round (src/Policy.sol:217-225, src/Distributor.sol:147). Display rounds USDG
 * to dollar-like decimals; the comment below keeps the base units.
 *
 *   gross         2 × 856189 + 3 × 856189 = 4280945
 *   protocol fee  floor(4280945 × 500 / 10000) = 214047
 *   net           4280945 − 214047 = 4066898
 *   per share     floor(4066898 × 1e27 / 15e18) = 0.271126 USDG per cNVDA
 *
 * They are an example, labelled as one, not a quote or a forecast.
 */
import type { ReactNode } from "react";

import { Num, Panel } from "@/components/ui";
import { EXAMPLE } from "@/lib/exampleWeek";

const MINUS = "−";

function Row({
  label,
  note,
  value,
  minus = false,
}: {
  label: string;
  note?: ReactNode;
  value: string;
  minus?: boolean;
}) {
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
        <span className="num text-xs font-medium text-ink-3">example · {EXAMPLE.sold} calls filled</span>
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
              <Num>
                ({EXAMPLE.fillA} + {EXAMPLE.fillB}) × {EXAMPLE.ask}
              </Num>{" "}
              USDG
            </>
          }
          value={EXAMPLE.gross}
        />
        <Row label="Stonkhouse 5%" note="of premium only" value={EXAMPLE.fee} minus />
      </dl>

      <dl>
        <div className="flex flex-wrap items-baseline justify-between gap-3 bg-accent-soft px-6 pb-[22px] pt-[18px]">
          <dt className="font-bold text-accent-text">Credited to depositors</dt>
          <dd className="num text-[28px] font-semibold leading-none text-accent-text">{EXAMPLE.net}</dd>
        </div>
      </dl>

      <dl className="px-6 pt-1.5">
        <Row
          label="Per cNVDA share"
          note={
            <>
              over the <Num>{EXAMPLE.shares}</Num> shares then in the vault
            </>
          }
          value={EXAMPLE.perShare}
        />
      </dl>

      <p className="px-6 pb-5 pt-3.5 text-[13px] text-ink-3">
        USDG, split pro rata across all cNVDA shares. The same week had <span className="num">{EXAMPLE.assigned}</span>{" "}
        calls exercised at <span className="num">{EXAMPLE.strike}</span>: their{" "}
        <span className="num">{EXAMPLE.strikeProceeds}</span> USDG of strike proceeds were added in full, with no fee.
        Figures from a fork rehearsal, not a live week or a forecast.
      </p>
    </Panel>
  );
}
