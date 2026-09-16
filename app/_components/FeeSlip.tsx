/**
 * "What reaches depositors": the fee slip beside the benefits list.
 *
 * Figures are a labelled example at week 1's live ask (1 USDG) — see lib/exampleWeek.ts.
 * 5% is taken in the Seaport order; 95% goes to the writer's wallet. Not a quote or a forecast.
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
          What the writer receives
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
          <dt className="font-bold text-accent-text">Paid to the writer</dt>
          <dd className="num text-[28px] font-semibold leading-none text-accent-text">{EXAMPLE.net}</dd>
        </div>
      </dl>

      <dl className="px-6 pt-1.5">
        <Row
          label="Per filled lot"
          note="premium on that contract, net of the fee"
          value={EXAMPLE.perShare}
        />
      </dl>

      <p className="px-6 pb-5 pt-3.5 text-[13px] text-ink-3">
        Premium goes to the account that sold the lot. Strike proceeds, if assigned, go to that same account with no
        fee. Figures from a labelled example, not a live week or a forecast.
      </p>
    </Panel>
  );
}
