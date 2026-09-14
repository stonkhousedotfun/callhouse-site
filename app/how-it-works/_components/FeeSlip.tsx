import { Panel } from "@/components/ui";

/**
 * The mockup's fee slip: a lifted receipt that walks one example week from what buyers paid to
 * what depositors are credited. The figures are the fork rehearsal's 23-contract week and must
 * stay labelled as an example. They reconcile with Policy.splitPremium (Overcall's 5% rounded down
 * per contract, then multiplied) and Policy.splitHarvest (Callhouse's 5% rounded down on the
 * premium the vault received):
 *
 *   per contract   0.873192 → Overcall 0.043659, vault 0.829533
 *   23 contracts   gross 20.083416, Overcall 1.004157, vault 19.079259
 *   protocol fee   floor(19.079259 × 5%) = 0.953962 → credited 18.125297
 */
const ROWS: Array<{ k: string; sub?: string; v: string; minus?: boolean }> = [
  { k: "Buyers paid", sub: "23 × 0.873192 USDG", v: "20.083416" },
  { k: "Overcall's 5%", sub: "taken inside each fill", v: "− 1.004157", minus: true },
  { k: "Vault receives", v: "19.079259" },
  { k: "Callhouse 5%", sub: "of premium only", v: "− 0.953962", minus: true },
];

const PERF = "radial-gradient(circle at 7px 7px, var(--ground) 5px, transparent 5.5px)";

export function FeeSlip() {
  return (
    <Panel as="article" lift pad="none" aria-labelledby="slip-h" className="relative overflow-hidden">
      <div className="flex flex-wrap items-baseline justify-between gap-2.5 px-6 pb-4 pt-[22px]">
        <h3 id="slip-h" className="text-[17px] font-bold">
          What reaches depositors
        </h3>
        <span className="font-mono text-[12px] font-medium leading-none text-ink-3">example · 23 calls filled</span>
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
          <dd className="num text-[28px] font-semibold leading-none text-accent-text">18.125297</dd>
        </div>
      </dl>
      <div className="grid gap-2 px-6 pb-5 pt-3.5 text-[13px] text-ink-3">
        <p>USDG, split pro rata across all cNVDA shares. Figures from the fork rehearsal, not a live week.</p>
        <p>
          Had the week been assigned, the strike USDG would be added to the credit in full and the fee line would
          not change.
        </p>
      </div>
    </Panel>
  );
}
