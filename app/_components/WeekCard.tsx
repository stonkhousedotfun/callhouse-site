/**
 * The hero's example week card ("This week's call").
 *
 * EVERY FIGURE HERE IS AN EXAMPLE, and the card says so twice. Strike 225.00, spot 218.30, the
 * 0.873 USDG ask and the 23 contracts are cycle 3 of the keeper's fork rehearsal
 * (leekzor/callhouse: keeper/dryrun-out/2026-09-13T21-19-16-086Z/report.md), which ran with a
 * 50 NVDA deposit cap; launch is 20 NVDA. The "15 of 23 bought" progress is illustrative: the
 * rehearsal filled all 23. The Friday and Saturday times are Overcall's current window, not the
 * rehearsal's (its cycle 3 ran Sun 22:02 to Mon 22:02 UTC on a mock registry), and the footnote
 * says so.
 *
 * Nothing here reads a chain. The vault is not deployed.
 */
import { Chip, Figure, Num, Panel } from "@/components/ui";

const WRITTEN = 23;
const SOLD = 15;

export function WeekCard() {
  return (
    <Panel as="article" lift aria-labelledby="week-card-h" className="grid gap-[22px]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="week-card-h" className="text-lg font-bold tracking-[-0.01em]">
            This week&apos;s call
          </h2>
          <p className="text-[13.5px] text-ink-3">Example week from the fork rehearsal</p>
        </div>
        <Chip tone="accent" dot>
          Listed
        </Chip>
      </div>

      <dl className="my-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Figure boxed size="lg" label="Strike" value="225.00" unit="USDG" />
        <Figure boxed size="lg" label="Spot at write" value="218.30" unit="USDG" />
        <Figure boxed size="lg" label="Ask per call" value="0.873" unit="USDG" tone="usdg" />
      </dl>

      <div className="pt-1.5">
        <div aria-hidden="true" className="relative h-2 overflow-hidden rounded-full bg-surface-2">
          <div className="absolute inset-y-0 left-0 w-[58%] rounded-full bg-linear-to-r from-accent-soft to-accent" />
        </div>
        <ol className="mt-3 grid grid-cols-2 gap-2 text-[12.5px] leading-[1.35] text-ink-3 sm:grid-cols-4">
          <li>
            <b className="block text-[13px] font-semibold text-ink">Written</b>
            <Num>{WRITTEN}</Num> calls
          </li>
          <li>
            <b className="block text-[13px] font-semibold text-accent-text">Listed now</b>
            on Overcall
          </li>
          <li>
            <b className="block text-[13px] font-semibold text-ink">Book closes</b>
            <Num>Fri 20:00 UTC</Num>
          </li>
          <li>
            <b className="block text-[13px] font-semibold text-ink">Expiry</b>
            <Num>Sat 20:00 UTC</Num>
          </li>
        </ol>
      </div>

      <div className="grid gap-2.5 border-t border-line pt-4">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-ink-2">
          <span>
            <b className="num font-semibold text-ink">
              {SOLD} of {WRITTEN}
            </b>{" "}
            calls bought so far
          </span>
          <span aria-hidden="true" className="flex flex-wrap gap-[3px]">
            {Array.from({ length: WRITTEN }, (_, i) => (
              <i key={i} className={i < SOLD ? "block h-4 w-[9px] rounded-[3px] bg-accent" : "block h-4 w-[9px] rounded-[3px] bg-surface-2"} />
            ))}
          </span>
        </div>
        <p className="text-xs text-ink-3">
          Not live data. The rehearsal ran with a <span className="num">50</span> NVDA cap (launch is{" "}
          <span className="num">20</span>), the fill count is illustrative, and the times are Overcall&apos;s current
          window.
        </p>
      </div>
    </Panel>
  );
}
