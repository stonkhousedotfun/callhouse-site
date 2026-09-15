/**
 * The hero's example week card ("What a week looks like").
 *
 * EVERY FIGURE HERE IS AN EXAMPLE, and the card says so twice. They are week 2 of the keeper's fork
 * rehearsal of the redesigned vault — see lib/exampleWeek.ts. Nothing is written before those fills:
 * the vault writes inside each fill (leekzor/callhouse-contracts src/Vault.sol authorizeOrder), so
 * written == sold == 5.
 *
 * The times are that week's real ones, printed New York-first (lib/clock.ts). Nothing here reads a
 * chain. The vault is not deployed.
 */
import { Chip, ClockNote, Figure, Num, Panel, When } from "@/components/ui";
import { EXAMPLE, EXAMPLE_WEEK } from "@/lib/exampleWeek";

export function WeekCard() {
  return (
    <Panel as="article" lift aria-labelledby="week-card-h" className="grid gap-[22px]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="week-card-h" className="text-lg font-bold tracking-[-0.01em]">
            What a week looks like
          </h2>
          <p className="text-[13.5px] text-ink-3">Example week from the fork rehearsal</p>
        </div>
        <Chip tone="accent" dot>
          Listed
        </Chip>
      </div>

      <dl className="my-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Figure boxed size="lg" label="Strike" value={EXAMPLE.strike} unit="USDG" />
        <Figure boxed size="lg" label="Spot at listing" value={EXAMPLE.spot} unit="USDG" />
        <Figure boxed size="lg" label="Ask per call" value={EXAMPLE.ask} unit="USDG" tone="usdg" />
      </dl>

      <div className="pt-1.5">
        <div aria-hidden="true" className="relative h-2 overflow-hidden rounded-full bg-surface-2">
          <div className="absolute inset-y-0 left-0 w-[36%] rounded-full bg-linear-to-r from-accent-soft to-accent" />
        </div>
        <ol className="mt-3 grid grid-cols-2 gap-2 text-[12.5px] leading-[1.35] text-ink-3 sm:grid-cols-4">
          <li>
            <b className="block text-[13px] font-semibold text-ink">Written</b>
            <Num>{EXAMPLE.sold}</Num> calls, as bought
          </li>
          <li>
            <b className="block text-[13px] font-semibold text-accent-text">Listed now</b>
            on the app&apos;s fill page
          </li>
          <li>
            <b className="block text-[13px] font-semibold text-ink">Book closes</b>
            <When utc={EXAMPLE.exercise.utc}>
              {EXAMPLE.exercise.weekdayShort} {EXAMPLE.exercise.time} NY
            </When>
          </li>
          <li>
            <b className="block text-[13px] font-semibold text-ink">Expiry</b>
            <When utc={EXAMPLE.expiry.utc}>
              {EXAMPLE.expiry.weekdayShort} {EXAMPLE.expiry.time} NY
            </When>
          </li>
        </ol>
      </div>

      <div className="grid gap-2.5 border-t border-line pt-4">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-ink-2">
          <span>
            <b className="num font-semibold text-ink">
              {EXAMPLE.sold} of {EXAMPLE.offered}
            </b>{" "}
            calls bought so far
          </span>
          <span aria-hidden="true" className="flex flex-wrap gap-[3px]">
            {Array.from({ length: EXAMPLE_WEEK.offered }, (_, i) => (
              <i
                key={i}
                className={
                  i < EXAMPLE_WEEK.sold
                    ? "block h-4 w-[9px] rounded-[3px] bg-accent"
                    : "block h-4 w-[9px] rounded-[3px] bg-surface-2"
                }
              />
            ))}
          </span>
        </div>
        <p className="text-xs text-ink-3">
          Not live data. Week <span className="num">{EXAMPLE.week}</span> of a keeper rehearsal on a fork of Robinhood
          Chain: two buyers took <span className="num">{EXAMPLE.fillA}</span> and{" "}
          <span className="num">{EXAMPLE.fillB}</span> calls, and the <span className="num">{EXAMPLE.unfilled}</span>{" "}
          nobody bought were never written.
        </p>
        <ClockNote className="text-xs" />
      </div>
    </Panel>
  );
}
