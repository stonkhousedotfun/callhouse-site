import { Panel } from "@/components/ui";

/**
 * The mockup's fee slip: a lifted receipt that walks one example week from what buyers paid to
 * what depositors are credited. The figures are week 2 of the keeper's fork rehearsal of the
 * redesigned vault (keeper/run-final/report.md, "Week 2") and must stay labelled as an example.
 * There is one fee line because a listing has one payment leg, USDG to the vault
 * (leekzor/callhouse-contracts src/lib/SeaportOrderLib.sol:179-213). They reconcile with
 * Policy.splitHarvest (src/Policy.sol:217-225, 5% rounded down on premium) and the per-share index
 * (src/Distributor.sol:147):
 *
 *   fills          2 × 0.856189 + 3 × 0.856189 = 4.280945
 *   protocol fee   floor(4.280945 × 5%) = 0.214047 → credited 4.066898
 *   per share      floor(4.066898 / 15 shares) = 0.271126
 *   strike         2 exercised × 223 = 446 USDG, credited fee-free (harvest fee unchanged at 0.214047)
 */
const ROWS: Array<{ k: string; sub?: string; v: string; minus?: boolean }> = [
  { k: "Buyers paid", sub: "(2 + 3) × 0.856189 USDG", v: "4.280945" },
  { k: "Callhouse 5%", sub: "of premium only", v: "− 0.214047", minus: true },
];

const PERF = "radial-gradient(circle at 7px 7px, var(--ground) 5px, transparent 5.5px)";

export function FeeSlip() {
  return (
    <Panel as="article" lift pad="none" aria-labelledby="slip-h" className="relative overflow-hidden">
      <div className="flex flex-wrap items-baseline justify-between gap-2.5 px-6 pb-4 pt-[22px]">
        <h3 id="slip-h" className="text-[17px] font-bold">
          What reaches depositors
        </h3>
        <span className="font-mono text-[12px] font-medium leading-none text-ink-3">example · 5 calls filled</span>
      </div>
      <div
        aria-hidden="true"
        className="mx-1 h-3.5 bg-repeat-x"
        style={{ backgroundImage: PERF, backgroundSize: "14px 14px" }}
      />
      <dl className="px-6 pt-2">
        {ROWS.map((row) => (
          <div
            key={row.k}
            className="flex justify-between gap-4 border-b border-dashed border-line-2 py-[11px] text-[15px]"
          >
            <dt className="text-ink-2">
              {row.k}
              {row.sub ? <small className="block text-[12.5px] text-ink-3">{row.sub}</small> : null}
            </dt>
            <dd className={row.minus ? "num whitespace-nowrap text-right text-ink-2" : "num whitespace-nowrap text-right text-ink"}>
              {row.v}
            </dd>
          </div>
        ))}
        <div className="-mx-6 mt-1.5 flex flex-wrap items-baseline justify-between gap-3 bg-accent-soft px-6 pb-[22px] pt-[18px]">
          <dt className="font-bold text-accent-text">Credited to depositors</dt>
          <dd className="num text-[28px] font-semibold leading-none text-accent-text">4.066898</dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-dashed border-line-2 py-[11px] text-[15px]">
          <dt className="text-ink-2">
            Per cNVDA share
            <small className="block text-[12.5px] text-ink-3">over the 15 shares then in the vault</small>
          </dt>
          <dd className="num whitespace-nowrap text-right text-ink">0.271126</dd>
        </div>
      </dl>
      <div className="grid gap-2 px-6 pb-5 pt-3.5 text-[13px] text-ink-3">
        <p>
          USDG, split pro rata across all cNVDA shares. Figures from a fork rehearsal, not a live week. No other fee
          came out of the fills: each one paid the vault directly.
        </p>
        <p>
          The same week had 2 calls exercised at 223. Their 446 USDG of strike proceeds were added to the credit in
          full, and the fee line did not change.
        </p>
      </div>
    </Panel>
  );
}
