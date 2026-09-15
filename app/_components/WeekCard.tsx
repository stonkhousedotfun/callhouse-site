/**
 * The hero's example week card ("This week's call").
 *
 * EVERY FIGURE HERE IS AN EXAMPLE, and the card says so twice. They are week 2 of the keeper's fork
 * rehearsal of the redesigned vault (2026-09-15T03:44Z UTC run, keeper/run-final/report.md, "Week 2"):
 * strike 223.00 (strikeUsdg6 223000000), spot when the week was armed 211.93 (spotAtArmUsdg6
 * 211927750, the live Chainlink print at the fork block), ask 0.856189 USDG per call (unitPrice6
 * 856189), 14 calls offered (listed: 14, the vault's capacity), and two buyers filling 2 and then 3
 * (fills[].contracts). Nothing was written before those fills: the vault writes inside each fill
 * (leekzor/callhouse-contracts src/Vault.sol authorizeOrder), so written == sold == 5.
 *
 * The times are that week's real ones: exercise 1790366400 = Fri 2026-09-25 16:00 ET = 20:00 UTC
 * (US daylight time), expiry 24 h later. The keeper sets them from the NYSE Friday close
 * (leekzor/callhouse keeper/src/calendar.ts); after daylight time ends (2026-11-01) the same close is
 * 21:00 UTC, and a Friday NYSE holiday moves it to Thursday. The footnote says so.
 *
 * Nothing here reads a chain. The vault is not deployed.
 */
import { Chip, Figure, Num, Panel } from "@/components/ui";

/** Calls the listing offered: the vault's capacity that week. */
const OFFERED = 14;
/** Calls bought, and therefore written: 2 + 3. */
const SOLD = 5;

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
        <Figure boxed size="lg" label="Strike" value="223.00" unit="USDG" />
        <Figure boxed size="lg" label="Spot at listing" value="211.93" unit="USDG" />
        <Figure boxed size="lg" label="Ask per call" value="0.856" unit="USDG" tone="usdg" />
      </dl>

      <div className="pt-1.5">
        <div aria-hidden="true" className="relative h-2 overflow-hidden rounded-full bg-surface-2">
          <div className="absolute inset-y-0 left-0 w-[36%] rounded-full bg-linear-to-r from-accent-soft to-accent" />
        </div>
        <ol className="mt-3 grid grid-cols-2 gap-2 text-[12.5px] leading-[1.35] text-ink-3 sm:grid-cols-4">
          <li>
            <b className="block text-[13px] font-semibold text-ink">Written</b>
            <Num>{SOLD}</Num> calls, as bought
          </li>
          <li>
            <b className="block text-[13px] font-semibold text-accent-text">Listed now</b>
            on the app&apos;s fill page
          </li>
          <li>
            <b className="block text-[13px] font-semibold text-ink">Book closes</b>
            <Num>Fri 16:00 ET</Num>
            <span className="block">
              <Num>20:00 UTC</Num>
            </span>
          </li>
          <li>
            <b className="block text-[13px] font-semibold text-ink">Expiry</b>
            <Num>Sat 16:00 ET</Num>
            <span className="block">
              <Num>20:00 UTC</Num>
            </span>
          </li>
        </ol>
      </div>

      <div className="grid gap-2.5 border-t border-line pt-4">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-ink-2">
          <span>
            <b className="num font-semibold text-ink">
              {SOLD} of {OFFERED}
            </b>{" "}
            calls bought so far
          </span>
          <span aria-hidden="true" className="flex flex-wrap gap-[3px]">
            {Array.from({ length: OFFERED }, (_, i) => (
              <i key={i} className={i < SOLD ? "block h-4 w-[9px] rounded-[3px] bg-accent" : "block h-4 w-[9px] rounded-[3px] bg-surface-2"} />
            ))}
          </span>
        </div>
        <p className="text-xs text-ink-3">
          Not live data. Week <span className="num">2</span> of a keeper rehearsal on a fork of Robinhood Chain: two buyers took <span className="num">2</span> and <span className="num">3</span> calls, and
          the <span className="num">9</span> nobody bought were never written. Times are New York time; the close is{" "}
          <span className="num">21:00 UTC</span> once US daylight saving time ends, and Thursday when Friday is an NYSE
          holiday.
        </p>
      </div>
    </Panel>
  );
}
