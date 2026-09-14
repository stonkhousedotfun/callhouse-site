/**
 * callhouse.finance/how-it-works — the mechanics, for someone who has not connected anything.
 *
 * This is the public sibling of the dapp's /docs page and a short path into the GitBook docs. The
 * reader has not deposited, nothing is connected, and the vault is not even deployed, so every
 * figure below is one of three things: a policy setting (launch value or compiled limit), an
 * address, or an example from the fork rehearsal that is labelled as one where it appears.
 *
 * DELIBERATELY ABSENT: every number that could move. No cycle number, no live strike, no realised
 * week, no TVL, no "current" anything. This package makes zero chain reads and has no wallet code,
 * and a live figure rendered before launch would be a zero next to a word like "realised". Also
 * absent: any figure scaled past one week, any chart, and any statement of what a week will pay.
 *
 * Sources: the origin/main version of this page (fact-checked against the contracts), the GitBook
 * docs repo (product/weekly-cycle, policy, fees, assignment; getting-started/depositing,
 * withdrawing, claiming-usdg; protocol/roles) and contracts/src/Policy.sol + Vault.sol at 634bf55.
 *
 * Every "go do something" link leaves for app.callhouse.finance via appUrl(). A relative href on
 * this domain is a 404, not a route into the dapp.
 */
import type { Metadata } from "next";
import Link from "next/link";

import {
  Button,
  Chip,
  Container,
  ExternalLink,
  Figure,
  Notice,
  Num,
  Panel,
  Section,
  SectionHead,
} from "@/components/ui";
import {
  ADDRESS_ROWS,
  CHAIN_ID,
  CHAIN_NAME,
  DOCS_URL,
  MARKET,
  SHARE_TICKER,
  VENUE_NAME,
  VENUE_URL,
  addressUrl,
  appUrl,
} from "@/lib/site";

import { CaveatList, type Caveat } from "./_components/CaveatList";
import { DOCS, DocsLink } from "./_components/DocsLink";
import { FeeSlip } from "./_components/FeeSlip";
import { RuleTable, type RuleRow } from "./_components/RuleTable";
import { Timeline, type TimelineStep } from "./_components/Timeline";

const DESCRIPTION =
  "The weekly covered-call cycle in detail: the timeline, the four phases, how strikes and sizes are chosen, where the premium goes, the three ways a week can end, withdrawals and deposits during a week, and who can do what.";

/**
 * `title` is the bare route name: the layout carries the "%s — Callhouse" template, so repeating
 * the suffix here would render it twice. `alternates.canonical` is not optional — the layout's
 * default canonical is "/", and inheriting it would point every crawler at the landing page. The
 * Open Graph title is stated in full because the template does not apply inside openGraph.
 */
export const metadata: Metadata = {
  title: "How it works",
  description: DESCRIPTION,
  alternates: { canonical: "/how-it-works" },
  openGraph: {
    title: "How it works — Callhouse",
    description: DESCRIPTION,
    url: "/how-it-works",
    siteName: "Callhouse",
    type: "article",
  },
};

const ON_THIS_PAGE: Array<[string, string]> = [
  ["#week", "The week"],
  ["#phases", "Phases"],
  ["#policy", "Strike and size"],
  ["#fees", "Fees"],
  ["#endings", "Three endings"],
  ["#withdrawals", "Withdrawals"],
  ["#deposits", "Deposits"],
  ["#roles", "Who can do what"],
  ["#contracts", "Contracts"],
];

/* ------------------------------------------------------------------ the week, step by step --- */

const STEPS: TimelineStep[] = [
  {
    title: "The cycle opens",
    when: "Start of the cycle",
    body: `${VENUE_NAME}'s registry publishes the week: up to five strike rungs, the exercise timestamp that ends writing and listing, and the expiry. The vault has no calendar of its own, so nothing can be written before this.`,
  },
  {
    title: "The keeper picks a strike and a size",
    when: "While writing is open",
    body: "It takes the nearest rung inside the strike band, at launch 3% to 12% above spot, and a size the policy allows. The vault re-checks every limit itself before any NVDA moves. If a check fails, nothing is written, the vault stays Idle, and the keeper can try again while the window is open. If no rung qualifies or no write lands in time, the week is skipped. A skipped week is a normal outcome.",
  },
  {
    title: "The vault writes the calls",
    when: "Idle → Listed",
    accent: true,
    body: `Idle ${MARKET} is locked in Valorem Clear and written as whole contracts, one contract per 1.0000 Stock Token, within the launch limits of 95% of the idle balance and 50 contracts. ${MARKET} deposited after the write stays idle until next week's write, but its shares are pooled with everyone else's from the moment they are minted.`,
  },
  {
    title: `It lists them on ${VENUE_NAME} for USDG`,
    when: "Until the exercise timestamp",
    accent: true,
    body: `The keeper proposes a Seaport order, and the vault authorises it by hash on chain only if every field matches the vault's own state and the asking price clears the premium floor. One listing is live at a time, at most three are signed per cycle, and each ends by the exercise timestamp. Buyers fill in part or in full, and each fill pays USDG in the same transaction: 95% to the vault, 5% to ${VENUE_NAME}. The keeper never holds the option tokens and can never move funds.`,
    note: `If ${VENUE_NAME}'s book does not show the vault's listing, the app's cycle page can offer the keeper's signed order instead, after checking it against the chain, and labels it as the keeper's listing. Buyers who only use ${VENUE_NAME} will not see it.`,
  },
  {
    title: "The book closes",
    when: "Fri 20:00 UTC",
    body: "This is the registry's exercise timestamp in the venue's current window, and it is the real deadline. From that moment deposits close, nothing more is written or listed, and anyone can lock the book, which cancels a listing still live. Nothing depends on anyone calling it, so a stopped keeper cannot hold the week open.",
  },
  {
    title: "The exercise window runs to expiry",
    when: "Fri 20:00 → Sat 20:00 UTC",
    body: "Holders of this week's calls can exercise them in Valorem. The vault does nothing in this phase: whether a call is exercised is decided by whoever holds it. NVDA taken by an exercise leaves the vault's claim at once; the strike USDG for it arrives at the close.",
  },
  {
    title: "The week closes",
    when: "From Sat 20:00 UTC",
    accent: true,
    body: "The keeper can close from expiry, and anyone can one hour later. One transaction cancels any listing still live, redeems the Valorem claim (NVDA back, or strike USDG where it was assigned), takes the protocol fee from the premium alone, credits the rest per share with any strike USDG in full, settles the withdrawal queue and returns the vault to Idle.",
  },
  {
    title: "You claim USDG",
    when: "Any time",
    body: "Premium and strike proceeds wait in your claimable balance, in any phase, with no deadline. USDG is never reinvested for you. Then the registry opens the next cycle and the week runs again.",
  },
];

/* ------------------------------------------------------------------------------ phases ------- */

const PHASE_ORDER = ["Idle", "Listed", "Exercisable", "Settling", "Idle again"];

const PHASE_ROWS: RuleRow[] = [
  {
    id: "idle",
    cells: {
      phase: "Idle",
      deposits: "Open, up to the cap",
      withdrawals: "Instant, while nothing is written",
      next: "The keeper writes this cycle's calls, only while the registry's write window is open",
    },
  },
  {
    id: "listed",
    cells: {
      phase: "Listed",
      deposits: "Open until the exercise timestamp, and closed as soon as any contract is assigned",
      withdrawals: "Queued",
      next: "Anyone can lock the book from the exercise timestamp. Optional: the close also accepts a Listed vault",
    },
  },
  {
    id: "exercisable",
    cells: {
      phase: "Exercisable",
      deposits: "Closed",
      withdrawals: "Queued",
      next: "The keeper closes the week from expiry; anyone can one hour later",
    },
  },
  {
    id: "settling",
    cells: {
      phase: "Settling",
      deposits: "Closed",
      withdrawals: "Being settled",
      next: "Inside that same closing transaction, the vault returns to Idle",
    },
  },
];

const STOPS: Caveat[] = [
  {
    title: "A halt on writes",
    body: "The guardian or the admin can halt writes. It stops new calls and new listings, nothing else: never a deposit, a withdrawal, the queue, a USDG claim, locking the book or closing the week.",
  },
  {
    title: "A stale price or a paused oracle",
    body: "The vault refuses to write or list against a stale price feed or a paused Stock Token oracle. Settlement never reads a price, so the close, the queue and claims keep working.",
  },
  {
    title: "An issuer freeze",
    body: "If the Stock Token issuer freezes transfers, the close cannot redeem the Valorem claim, so the week's close, the queue and NVDA payouts can be held up until it lifts. USDG claims keep working. USDG freezing the vault's address can do the same on an assigned week.",
  },
];

/* ------------------------------------------------------------------------------ policy ------- */

const POLICY_ROWS: RuleRow[] = [
  {
    id: "underlying",
    cells: { param: "Underlying", launch: `${MARKET} Stock Token only`, cap: "Fixed at deployment" },
  },
  {
    id: "min-otm",
    cells: {
      param: "Strike, minimum above spot",
      launch: <Num>3%</Num>,
      cap: (
        <>
          Floor <Num>1%</Num>. Stops an admin selling at-the-money calls.
        </>
      ),
    },
  },
  {
    id: "max-otm",
    cells: { param: "Strike, maximum above spot", launch: <Num>12%</Num>, cap: <>Ceiling <Num>25%</Num></> },
  },
  {
    id: "min-premium",
    cells: {
      param: "Minimum asking premium, gross",
      launch: (
        <>
          <Num>0.40%</Num> of spot notional
        </>
      ),
      cap: <>Floor <Num>0.10%</Num></>,
    },
  },
  {
    id: "utilization",
    cells: {
      param: `Share of idle ${MARKET} written`,
      launch: <Num>95%</Num>,
      cap: <>Ceiling <Num>100%</Num></>,
    },
  },
  {
    id: "contracts",
    cells: { param: "Contracts per cycle", launch: <Num>50</Num>, cap: <>At least <Num>1</Num></> },
  },
  {
    id: "listings",
    cells: { param: "Listings signed per cycle", launch: <Num>3</Num>, cap: "Constant, not adjustable" },
  },
  {
    id: "fee",
    cells: {
      param: "Protocol fee",
      launch: (
        <>
          <Num>5%</Num> of premium
        </>
      ),
      cap: (
        <>
          Ceiling <Num>20%</Num>. Never on strike proceeds, at any setting.
        </>
      ),
    },
  },
  {
    id: "cap",
    cells: {
      param: "Deposit cap",
      launch: <Num unit={MARKET}>20</Num>,
      cap: "No compiled ceiling",
    },
  },
  {
    id: "lot",
    cells: {
      param: "Contract size",
      launch: (
        <>
          <Num>1</Num> {MARKET} per contract
        </>
      ),
      cap: "Compiled in",
    },
  },
  {
    id: "price-age",
    cells: {
      param: "Oldest price the vault will write against",
      launch: <Num>4 days</Num>,
      cap: (
        <>
          <Num>1 hour</Num> to <Num>7 days</Num>
        </>
      ),
    },
  },
  {
    id: "tenor",
    cells: {
      param: "Cycle length",
      launch: (
        <>
          {VENUE_NAME}&apos;s, currently <Num>7 days</Num>
        </>
      ),
      cap: (
        <>
          At most <Num>21 days</Num> from the write
        </>
      ),
    },
  },
];

const KEEPER_DEFAULTS: Array<{ title: string; body: string }> = [
  {
    title: "Strike",
    body: "The nearest rung inside the band, meaning the lowest strike that qualifies. That is where a weekly call has premium, and it is also the rung most likely to be assigned.",
  },
  {
    title: "Size",
    body: `The largest the policy allows, all in one listing. With 20 ${MARKET} idle, that is at most 19 contracts.`,
  },
  {
    title: "Price",
    body: `The premium floor for the current spot, raised to the last fill seen on ${VENUE_NAME} for that rung, but never more than three times the floor and never above the strike. A rung with no fill history lists at the floor.`,
  },
  {
    title: "Relisting",
    body: "After a cancelled or invalidated order the keeper relists once, never below its previous ask. The vault's limit of three signed listings a cycle applies regardless.",
  },
];

/* -------------------------------------------------------------------------------- fees ------- */

const FEES: Array<{ who: string; size: string; when: string; body: string }> = [
  {
    who: VENUE_NAME,
    size: "5% of gross premium",
    when: "On each fill",
    body: "A second payment inside the Seaport order itself: the buyer's USDG splits in the same transaction, 95% to the vault and 5% to Overcall. It is rounded per contract, not on the total, because rounding on the total produces an order that signs and then cannot be partly filled.",
  },
  {
    who: "Callhouse",
    size: "5% of the premium the vault receives",
    when: "At harvest, only on premium above zero",
    body: "Taken when the vault accounts for premium, at the close or when a deposit arrives. Strike proceeds from an assignment are credited to depositors in full: that exclusion is in the contract code, not a setting. The admin can change the rate, never above 20% of premium.",
  },
  {
    who: "Valorem engine",
    size: "15 bps of written notional, in NVDA",
    when: "Currently off",
    body: "Not taken from premium. If Valorem switches it on and the admin accepts it, it is paid from the vault's NVDA at every write, filled or not, and on a weekly out-of-the-money call it can be a large part of the premium. While it is on and not accepted, the vault does not write.",
  },
];

/* ----------------------------------------------------------------------------- endings ------- */

const ENDINGS: Array<{
  id: string;
  title: string;
  chip: { tone: "neutral" | "accent" | "warn"; label: string };
  body: string[];
  premium: string;
  nvda: string;
  upside: string;
}> = [
  {
    id: "none",
    title: "Nobody bought",
    chip: { tone: "neutral", label: "Most likely on a thin book" },
    body: [
      "The listing sat on the book and nobody filled it. The week pays no premium, no fee is charged, and the unsold options are worthless after expiry.",
      "The collateral can still be assigned. The vault writes the same option series as other writers, and Valorem assigns exercises across all of them, so if their buyers exercise, NVDA can leave at the strike for strike USDG in a week that paid nothing. Whatever is not assigned comes back at the close. The week is published like any other, not hidden as an error.",
    ],
    premium: "None",
    nvda: "Back at the close, unless assigned",
    upside: "Kept, unless assigned",
  },
  {
    id: "otm",
    title: "Bought, expired worthless",
    chip: { tone: "accent", label: "Premium kept" },
    body: [
      "A buyer paid for the calls and no exercise was assigned to the vault, usually because NVDA stayed below the strike. The options expire worthless to their holders.",
      "Premium, less Overcall's 5% and Callhouse's 5%, is credited to depositors in USDG, and the NVDA comes back at the close.",
    ],
    premium: "Kept, net of fees",
    nvda: "Back at the close",
    upside: "Kept",
  },
  {
    id: "itm",
    title: "Bought and exercised",
    chip: { tone: "warn", label: "Assigned" },
    body: [
      "Assignment can take the collateral at the strike. NVDA finished above the strike and holders exercised: the assigned NVDA leaves and comes back as strike USDG, credited to depositors in full with no protocol fee. The premium is still kept, net of fees, and anything above the strike is given up for that week.",
      "v1 does not buy the NVDA back. Afterwards each cNVDA share holds less NVDA and more claimable USDG, the vault stays underweight until new deposits add to it, and the next week writes against the smaller balance.",
    ],
    premium: "Kept, net of fees",
    nvda: "Part or all leaves at the strike, paid in USDG",
    upside: "Given up that week",
  },
];

/* ------------------------------------------------------------------ withdrawals, deposits ----- */

const WITHDRAWAL_CAVEATS: Caveat[] = [
  {
    title: "Check both balances",
    body: "USDG credited to your shares before you queued is not part of the queue payout. It stays in your claimable balance, so after queueing, look in both places.",
  },
  {
    title: "A queued withdrawal cannot be cancelled",
    body: "There is no function to take escrowed shares back. Once settled, your amounts are fixed, later deposits do not dilute them, and there is no deadline to collect.",
  },
  {
    title: "Do not queue while the vault is Idle",
    body: "The transaction succeeds, but it settles only at the next close, which needs a call to be written first. That may not happen for a week or more, and your escrowed shares are written against with everyone else's in the meantime. While the vault is Idle, redeem instantly instead.",
  },
  {
    title: "A frozen token can hold the queue up",
    body: "An issuer freeze on the Stock Token can stop the close and the NVDA payout until it lifts. A halt on writes, a stale price feed or a paused oracle does not. cNVDA is not listed anywhere, so there is no secondary market to sell into instead.",
  },
];

const DEPOSIT_POINTS: Array<{ title: string; body: string }> = [
  {
    title: "Your NVDA is not written that week",
    body: "It lands in the vault's idle balance and waits for the next cycle's write.",
  },
  {
    title: "Your shares carry that week's result",
    body: "cNVDA is pooled. From the moment your shares are minted you share pro rata in the rest of the week: premium from fills after your deposit, and the effect of any assignment, which is a lower NVDA share price plus a share of the strike USDG.",
  },
  {
    title: "Premium from before you arrived is not yours",
    body: "Before minting your shares, the deposit credits any premium that already reached the vault to the existing shares. Your shares start from that point.",
  },
  {
    title: "Deposits close at the exercise timestamp",
    body: "And as soon as any contract has been assigned, whatever the clock says. Exercise happens inside Valorem with no call to the vault: NVDA leaves at once while its strike USDG only arrives at the close, and new shares priced in that gap would take strike proceeds from the depositors who were assigned. The app's maximum goes to zero at the same instant.",
  },
];

/* ------------------------------------------------------------------------------- roles ------- */

const ROLES: Array<{ id: string; title: string; holder: string; can: string[]; cannot: string[]; note: string }> = [
  {
    id: "admin",
    title: "Admin",
    holder: "Bootstrap key, then Safe 2 of 3",
    can: [
      "Set the policy inside the compiled limits, the deposit cap, the fee recipient and the price age",
      "Accept Valorem's engine fee if it is ever switched on",
      "Halt writes, and lift a halt",
      "Grant and revoke every role",
    ],
    cannot: [
      "Move any NVDA, USDG or cNVDA",
      "Upgrade the vault or change an external address",
      "Block the queue, claims, locking the book or the close",
      "Charge a fee on strike proceeds, or go past a compiled limit",
    ],
    note: "At launch one deployer key holds every admin power, then hands them to the 2-of-3 Safe. There is no timelock. A compromised admin could raise the fee to 20% of premium and redirect it, or loosen the policy to its limits and sell calls to a buyer it controls: no tokens leave the vault directly, but that is a real loss to depositors.",
  },
  {
    id: "keeper",
    title: "Keeper",
    holder: "Hot key",
    can: [
      "Open the week by writing the calls",
      "Authorise, cancel and invalidate listings",
      "Close the week from expiry, an hour before anyone else",
    ],
    cannot: [
      "Transfer, approve or receive a token for the vault",
      "Route premium to itself",
      "Change settings, halt, or grant roles",
      "Write outside the band, list more than three times a cycle, or list past the exercise timestamp",
    ],
    note: "Inside those limits it can choose the least favourable terms the policy allows, or skip a week by not writing or not listing.",
  },
  {
    id: "guardian",
    title: "Guardian",
    holder: "Single hardware key",
    can: ["Halt writes", "Cancel the live listing", "Invalidate every outstanding listing"],
    cannot: [
      "Lift a halt",
      "Change any setting or grant roles",
      "Move a token or stop a withdrawal",
    ],
    note: "At worst it keeps writes halted or keeps killing listings, and weeks pay no premium until the admin steps in. Exits keep working throughout.",
  },
  {
    id: "anyone",
    title: "Anyone",
    holder: "No key needed",
    can: [
      "Deposit, within the phase and the cap",
      "Redeem or queue your own shares, complete a settled redemption, claim USDG",
      "Lock the book from the exercise timestamp",
      "Close the week from one hour after expiry",
      "Push a stuck protocol fee to its recipient (never to the caller)",
    ],
    cannot: [],
    note: "Because locking the book and closing the week are open to anyone, settlement and the queue do not depend on the keeper or the guardian staying alive.",
  },
];

/* ============================================================================================= */

export default function HowItWorksPage() {
  return (
    <>
      {/* ---------------------------------------------------------------- page head ----------- */}
      <Container className="grid grid-cols-1 items-center gap-9 pb-14 pt-4 sm:pb-[72px] lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:gap-14 lg:pt-10">
        <div>
          <Chip tone="accent" dot wrap>
            {CHAIN_NAME} {CHAIN_ID} · {VENUE_NAME} · Valorem Clear · Seaport 1.6
          </Chip>
          <h1 className="mt-5 text-[length:clamp(38px,5vw,60px)] font-extrabold leading-[1.03] tracking-[-0.035em]">
            One week, <span className="text-accent">start to finish.</span>
          </h1>
          <p className="mt-[22px] max-w-[34em] text-[18px] text-ink-2 sm:text-[19px]">
            Deposit {MARKET} Stock Tokens and receive {SHARE_TICKER} shares. Each week the vault writes covered calls
            against the idle tokens, lists them on {VENUE_NAME} for USDG, and credits whatever buyers actually pay. This
            page is that week in detail: the timeline, the rules the contracts enforce, where the money goes and the
            three ways it can end.
          </p>
          <div className="mt-[30px] flex flex-wrap gap-3">
            <Button href={appUrl("/vault/nvda")}>Open the app</Button>
            <Button variant="ghost" href={DOCS_URL}>
              Read the docs
            </Button>
          </div>
          <Notice variant="plain" className="mt-[26px]">
            Premium is paid only if a buyer fills. Assignment can take the collateral at the strike. The vault is not
            deployed and the contracts are not audited. Every figure here is a policy setting or a labelled example,
            not a quote.
          </Notice>
        </div>

        <Panel as="aside" lift aria-labelledby="glance-h" className="grid gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="glance-h" className="text-[18px] font-bold tracking-[-0.01em]">
              The rules at a glance
            </h2>
            <Chip>Launch settings</Chip>
          </div>
          <dl className="grid grid-cols-2 gap-3">
            <Figure boxed size="md" label="Deposit cap" value="20" unit={MARKET} />
            <Figure boxed size="md" label="Written each week" value="≤ 95%" unit="of idle" />
            <Figure boxed size="md" label="Strike above spot" value="3–12%" />
            <Figure boxed size="md" label="Protocol fee" value="5%" unit="of premium" />
            <Figure boxed size="md" label="Book closes" value="Fri 20:00" unit="UTC" />
            <Figure boxed size="md" label="Expiry" value="Sat 20:00" unit="UTC" />
          </dl>
          <p className="border-t border-line pt-4 text-[13.5px] text-ink-3">
            Days and times are {VENUE_NAME}&apos;s current window, read from its registry. The admin can change the
            settings, never past the limits compiled into the contracts.
          </p>
        </Panel>

        <nav aria-label="On this page" className="lg:col-span-2">
          <ul className="flex flex-wrap gap-2">
            {ON_THIS_PAGE.map(([href, label]) => (
              <li key={href}>
                <a
                  href={href}
                  className="inline-flex rounded-full border border-line bg-surface px-3.5 py-2 text-[14px] font-medium leading-none text-ink-2 no-underline transition-colors hover:bg-surface-2 hover:text-ink"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </Container>

      {/* ---------------------------------------------------------------- 1. the week --------- */}
      <Section id="week" labelledBy="week-h" className="scroll-mt-4">
        <SectionHead
          id="week-h"
          eyebrow="The week"
          title="Eight steps, from write window to claim."
          intro={`The keeper follows ${VENUE_NAME}'s registry, not a wall clock. The days and times below are the venue's current window, not a promise Callhouse makes: if the registry moves the window, the vault moves with it.`}
        />
        <Timeline steps={STEPS} />
        <DocsLink href={DOCS.weeklyCycle}>The weekly cycle</DocsLink>
      </Section>

      {/* ---------------------------------------------------------------- 2. phases ----------- */}
      <Section id="phases" labelledBy="phases-h" className="scroll-mt-4">
        <SectionHead
          id="phases-h"
          eyebrow="Phases"
          title="Four phases, and what each one allows."
          intro="The contracts, not the keeper, decide what you can do at each point in the week. Deposits and withdrawals follow the phase."
        />

        <ol aria-label="Phase order" className="mb-8 flex flex-wrap items-center gap-2">
          {PHASE_ORDER.map((phase, i) => (
            <li key={phase} className="flex items-center gap-2">
              <span
                className={
                  i === 0 || i === PHASE_ORDER.length - 1
                    ? "rounded-full bg-accent-soft px-3.5 py-2 font-display text-[15px] font-bold leading-none text-accent-text"
                    : "rounded-full border border-line bg-surface px-3.5 py-2 font-display text-[15px] font-bold leading-none text-ink"
                }
              >
                {phase}
              </span>
              {i < PHASE_ORDER.length - 1 ? (
                <span aria-hidden="true" className="text-ink-3">
                  →
                </span>
              ) : null}
            </li>
          ))}
        </ol>

        <RuleTable
          caption="What deposits and withdrawals do in each phase, and what moves the vault on"
          firstColWidth="w-[15%]"
          columns={[
            { key: "phase", label: "Phase" },
            { key: "deposits", label: "Deposits" },
            { key: "withdrawals", label: "Withdrawals" },
            { key: "next", label: "Moves on when" },
          ]}
          rows={PHASE_ROWS}
        />

        <h3 className="mb-1 mt-14 text-[22px] font-bold tracking-[-0.015em]">What pauses, and what never does</h3>
        <p className="mb-5 max-w-[40em] text-[15.5px] text-ink-2">
          Three things can stop part of the week. A halt and a stale or paused price never touch settlement; a freeze
          on the Stock Token (or USDG freezing the vault) can hold up the close. The issuer&apos;s wider powers are on{" "}
          <Link href="/risks#issuer" className="link">
            the risks page
          </Link>
          .
        </p>
        <CaveatList items={STOPS} headingLevel={4} />
      </Section>

      {/* ---------------------------------------------------------------- 3. policy ----------- */}
      <Section id="policy" labelledBy="policy-h" className="scroll-mt-4">
        <SectionHead
          id="policy-h"
          eyebrow="Strike and size"
          title="How the strike and the size are chosen."
          intro="Two layers. Launch values are what the vault starts with, and the admin can change them with no timelock. Compiled limits are in the bytecode, checked on every change, and no key can move them. Neither is a forecast of what a week will pay."
        />

        <RuleTable
          caption="Launch policy and the limits compiled into the contracts"
          firstColWidth="w-[38%]"
          columns={[
            { key: "param", label: "Setting" },
            { key: "launch", label: "Launch value" },
            { key: "cap", label: "Compiled limit" },
          ]}
          rows={POLICY_ROWS}
        />

        <div className="mt-14 grid grid-cols-1 gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div>
            <h3 className="text-[22px] font-bold tracking-[-0.015em]">Inside the band, by default</h3>
            <p className="mt-3 text-[15.5px] text-ink-2">
              The contracts set the bounds and the keeper software chooses inside them. These are its default
              settings: operating choices, not commitments, and whoever runs the keeper can change them without a
              contract change. If no rung on the registry&apos;s ladder fits the band, the vault writes nothing that
              week.
            </p>
            <p className="mt-3 text-[15.5px] text-ink-2">
              The limits rule out the worst settings, such as selling at the money. They do not rule out poor
              settings inside them, which is on{" "}
              <Link href="/risks" className="link">
                the risk list
              </Link>
              .
            </p>
          </div>
          <dl className="grid grid-cols-1 gap-x-9 gap-y-7 sm:grid-cols-2">
            {KEEPER_DEFAULTS.map((d) => (
              <div key={d.title}>
                <dt className="font-display text-[18px] font-bold tracking-[-0.01em]">{d.title}</dt>
                <dd className="mt-1.5 text-[15px] text-ink-2">{d.body}</dd>
              </div>
            ))}
          </dl>
        </div>

        <DocsLink href={DOCS.policy}>Launch policy and hard caps</DocsLink>
      </Section>

      {/* ---------------------------------------------------------------- 4. fees ------------- */}
      <Section id="fees" labelledBy="fees-h" className="scroll-mt-4">
        <SectionHead
          id="fees-h"
          eyebrow="Where the money goes"
          title="The live fees come out of premium, and only premium."
          intro="Both live fees are taken from premium, and premium exists only when a buyer fills. A week with no buyer is charged nothing by either, and neither is charged on deposits, idle NVDA or strike proceeds. Valorem's engine fee, off today, would be different: see below."
        />

        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div>
            <ul className="grid">
              {FEES.map((fee) => (
                <li key={fee.who} className="border-t border-line py-6 first:border-t-0 first:pt-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <h3 className="text-[19px] font-bold tracking-[-0.015em]">{fee.who}</h3>
                    <Chip tone={fee.when === "Currently off" ? "neutral" : "accent"} wrap>
                      {fee.size}
                    </Chip>
                  </div>
                  <p className="mt-1.5 font-mono text-[12.5px] font-medium text-accent-text">{fee.when}</p>
                  <p className="mt-2 text-[15.5px] text-ink-2">{fee.body}</p>
                </li>
              ))}
            </ul>

            <div className="mt-2 rounded-md bg-surface-2 p-5">
              <p className="text-[15.5px] text-ink">
                <strong className="font-semibold">Stacked, the two live fees come to 9.75% of what the buyer paid:</strong>{" "}
                {VENUE_NAME}&apos;s 5% of the gross, then Callhouse&apos;s 5% of the 95% that reaches the vault. At the
                20% ceiling the stack would be 24%.
              </p>
              <p className="mt-2 text-[14px] text-ink-3">
                The protocol fee accrues in the vault and is paid out at the close on a best-effort basis. If that
                transfer fails, the close still completes and anyone can push the fee later. A stuck fee cannot block
                a close or a withdrawal.
              </p>
            </div>
          </div>

          <FeeSlip />
        </div>

        <DocsLink href={DOCS.fees}>Fees, with worked examples</DocsLink>
      </Section>

      {/* ---------------------------------------------------------------- 5. endings ---------- */}
      <Section id="endings" labelledBy="endings-h" className="scroll-mt-4">
        <SectionHead
          id="endings-h"
          eyebrow="Three endings"
          title="Every week ends one of three ways."
          intro="Premium is paid only if a buyer fills. Which ending you get is decided by the order book and by what holders of this week's calls do, not by anything the vault does."
        />

        <div className="grid gap-4">
          {ENDINGS.map((end) => (
            <Panel
              key={end.id}
              as="article"
              pad="lg"
              aria-labelledby={`end-${end.id}-h`}
              className="grid grid-cols-1 gap-x-10 gap-y-6 max-sm:p-[22px]! lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]"
            >
              <div>
                <Chip tone={end.chip.tone}>{end.chip.label}</Chip>
                <h3 id={`end-${end.id}-h`} className="mt-3.5 text-[length:clamp(22px,2.4vw,26px)] font-extrabold tracking-[-0.02em]">
                  {end.title}
                </h3>
                <div className="mt-3 grid max-w-[40em] gap-3 text-[16px] text-ink-2">
                  {end.body.map((para) => (
                    <p key={para.slice(0, 32)}>{para}</p>
                  ))}
                </div>
              </div>
              <dl className="grid grid-cols-1 content-start gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <Figure boxed caps mono={false} size="sm" label="Premium" value={end.premium} />
                <Figure boxed caps mono={false} size="sm" label={`The ${MARKET}`} value={end.nvda} />
                <Figure boxed caps mono={false} size="sm" label="Upside above the strike" value={end.upside} />
              </dl>
            </Panel>
          ))}
        </div>

        <Notice as="div" className="mt-6 text-[14.5px]!">
          <strong className="font-semibold text-ink">Partial assignment is normal.</strong> Valorem assigns by bucket
          across every writer of the same option series, not perfectly pro rata and not according to who sold the
          exercised call. A week can end with some of the vault&apos;s contracts assigned and the rest not, and that can
          happen in a week the vault&apos;s own listing never filled. The vault then holds a mix of NVDA and USDG, every
          depositor gets the same blend per share, and a queued withdrawal settled that week pays out in the same mix.
        </Notice>

        <DocsLink href={DOCS.assignment}>Assignment, with worked examples</DocsLink>
      </Section>

      {/* ---------------------------------------------------------------- 6. withdrawals ------ */}
      <Section id="withdrawals" labelledBy="withdrawals-h" className="scroll-mt-4">
        <SectionHead
          id="withdrawals-h"
          eyebrow="Withdrawals"
          title="Two ways out, and the phase picks one."
          intro="While a call is open, the NVDA behind it is locked in Valorem until expiry, so the vault cannot hand it back early. The queue is the mechanism, not a discretionary gate: no Callhouse key can jump it or stop it."
        />

        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
          <Panel as="article" pad="lg" aria-labelledby="instant-h" className="max-sm:p-[22px]!">
            <Chip tone="accent" dot>
              Idle, nothing written
            </Chip>
            <h3 id="instant-h" className="mt-3.5 text-[24px] font-extrabold tracking-[-0.02em]">
              Instant redemption
            </h3>
            <ul className="mt-4 grid gap-3 text-[15.5px] text-ink-2">
              <li>Your shares burn and NVDA comes back in the same transaction, at the current NVDA per share.</li>
              <li>It pays NVDA only. USDG already credited to you stays claimable.</li>
              <li>A halt on writes never blocks it.</li>
            </ul>
          </Panel>

          <Panel as="article" pad="lg" aria-labelledby="queue-h" className="max-sm:p-[22px]!">
            <Chip tone="warn" dot>
              While a call is open
            </Chip>
            <h3 id="queue-h" className="mt-3.5 text-[24px] font-extrabold tracking-[-0.02em]">
              The queue
            </h3>
            <ol className="mt-4 grid gap-3 text-[15.5px] text-ink-2">
              <li className="grid grid-cols-[28px_minmax(0,1fr)] gap-2">
                <span className="num font-semibold text-ink">1</span>
                <span>
                  <strong className="font-semibold text-ink">Queue.</strong> Your shares move into escrow in the vault,
                  tagged with the week.
                </span>
              </li>
              <li className="grid grid-cols-[28px_minmax(0,1fr)] gap-2">
                <span className="num font-semibold text-ink">2</span>
                <span>
                  <strong className="font-semibold text-ink">The week closes.</strong> The close harvests the
                  week&apos;s USDG first, then burns the escrowed shares and sets aside their NVDA and USDG.
                </span>
              </li>
              <li className="grid grid-cols-[28px_minmax(0,1fr)] gap-2">
                <span className="num font-semibold text-ink">3</span>
                <span>
                  <strong className="font-semibold text-ink">Complete.</strong> You collect both in one transaction.
                </span>
              </li>
            </ol>
            <dl className="mt-5 grid gap-3 border-t border-line pt-5 text-[15px]">
              <div>
                <dt className="font-semibold text-ink">NVDA</dt>
                <dd className="text-ink-2">Your pro-rata share of the vault&apos;s idle NVDA at settlement.</dd>
              </div>
              <div>
                <dt className="font-semibold text-usdg">USDG, per entry</dt>
                <dd className="text-ink-2">
                  What your own escrowed shares earned between queueing and settlement, including their share of strike
                  proceeds on an assigned week. Someone who queues after you cannot take a share of it.
                </dd>
              </div>
            </dl>
            <Notice className="mt-5">
              A queued withdrawal is never a promise of a fixed number of tokens. If the week was assigned, part of it
              arrives as USDG at the strike.
            </Notice>
          </Panel>
        </div>

        <CaveatList items={WITHDRAWAL_CAVEATS} className="mt-10" />

        <DocsLink href={DOCS.withdrawing}>Withdrawing and the redeem queue</DocsLink>
      </Section>

      {/* ---------------------------------------------------------------- 7. deposits --------- */}
      <Section id="deposits" labelledBy="deposits-h" className="scroll-mt-4">
        <SectionHead
          id="deposits-h"
          eyebrow="Deposits"
          title="Depositing into an open week."
          intro="Deposits stay open while a call is live, until the cycle's exercise timestamp. A deposit in that window joins the week, for better or for worse."
        />

        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <dl className="grid grid-cols-1 gap-x-9 gap-y-7 sm:grid-cols-2">
            {DEPOSIT_POINTS.map((p) => (
              <div key={p.title}>
                <dt className="font-display text-[18px] font-bold tracking-[-0.01em]">{p.title}</dt>
                <dd className="mt-1.5 text-[15px] text-ink-2">{p.body}</dd>
              </div>
            ))}
          </dl>

          <Panel as="aside" pad="sm" aria-labelledby="face-h" className="grid gap-4">
            <h3 id="face-h" className="text-[19px] font-bold tracking-[-0.015em]">
              Priced at face value
            </h3>
            <Notice as="div">
              Shares are priced at the NVDA behind them, including NVDA locked behind this week&apos;s call at full
              value, with nothing subtracted for what the open call could cost. If NVDA is already above the strike
              when you deposit, you pay full price for collateral that may leave at the strike, and part of that loss
              is yours. Depositing while the vault is Idle avoids this.
            </Notice>
            <dl className="grid gap-0 text-[14.5px]">
              <div className="flex justify-between gap-3 border-t border-line py-2.5">
                <dt className="text-ink-2">At launch</dt>
                <dd className="num text-right">1 cNVDA = 1 NVDA</dd>
              </div>
              <div className="flex justify-between gap-3 border-t border-line py-2.5">
                <dt className="text-ink-2">Deposit cap</dt>
                <dd className="num text-right">20 NVDA</dd>
              </div>
              <div className="flex justify-between gap-3 border-t border-line py-2.5">
                <dt className="text-ink-2">Blocked by a halt or a stale price</dt>
                <dd className="text-right font-semibold">No</dd>
              </div>
            </dl>
            <p className="text-[13.5px] text-ink-3">
              The cap counts idle NVDA plus NVDA locked in this week&apos;s call, so writing a call does not free up
              room under it.
            </p>
          </Panel>
        </div>

        <DocsLink href={DOCS.depositing}>Depositing</DocsLink>
      </Section>

      {/* ---------------------------------------------------------------- 8. roles ------------ */}
      <Section id="roles" labelledBy="roles-h" className="scroll-mt-4">
        <SectionHead
          id="roles-h"
          eyebrow="Roles"
          title="Who can do what."
          intro="Three keys run the week and set policy inside the compiled limits. None of them can transfer depositors' tokens, though a bad admin could still cost depositors money, and the two steps that finish a week are open to anyone."
        />

        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
          {ROLES.map((role) => (
            <Panel
              key={role.id}
              as="article"
              pad="sm"
              aria-labelledby={`role-${role.id}-h`}
              className="grid content-start gap-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 id={`role-${role.id}-h`} className="text-[21px] font-extrabold tracking-[-0.02em]">
                  {role.title}
                </h3>
                <Chip wrap>{role.holder}</Chip>
              </div>
              <div className={role.cannot.length ? "grid grid-cols-1 gap-5 sm:grid-cols-2" : "grid"}>
                <div>
                  <h4 className="text-[12.5px] font-semibold uppercase tracking-[0.06em] text-accent-text">Can</h4>
                  <ul className="mt-2 grid gap-2 text-[15px] text-ink-2">
                    {role.can.map((item) => (
                      <li key={item} className="grid grid-cols-[14px_minmax(0,1fr)] gap-2">
                        <span aria-hidden="true" className="mt-[9px] size-1.5 rounded-full bg-accent" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {role.cannot.length ? (
                  <div>
                    <h4 className="text-[12.5px] font-semibold uppercase tracking-[0.06em] text-ink-3">Cannot</h4>
                    <ul className="mt-2 grid gap-2 text-[15px] text-ink-2">
                      {role.cannot.map((item) => (
                        <li key={item} className="grid grid-cols-[14px_minmax(0,1fr)] gap-2">
                          <span aria-hidden="true" className="mt-[9px] size-1.5 rounded-full bg-line-2" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
              <p className="border-t border-line pt-4 text-[14px] text-ink-3">{role.note}</p>
            </Panel>
          ))}
        </div>

        <Notice as="div" className="mt-6 text-[14.5px]!">
          <strong className="font-semibold text-ink">There is no proxy on v1.</strong> The vault cannot be upgraded in
          place. Fixing anything means deploying Vault v2 and migrating to it, in public, with depositors moving their
          own funds. That is deliberate: an upgradeable vault is a key that can rewrite the rules under a position that
          is already open. The Callhouse contracts have not been audited.
        </Notice>

        <DocsLink href={DOCS.roles}>Roles and admin powers</DocsLink>
      </Section>

      {/* ---------------------------------------------------------------- 9. contracts -------- */}
      <Section id="contracts" labelledBy="contracts-h" className="scroll-mt-4">
        <SectionHead
          id="contracts-h"
          eyebrow="Contracts"
          title="What the week touches on chain."
          intro={
            <p>
              Everything the weekly cycle uses on chain {CHAIN_ID}. All third party: the Callhouse vault is not listed
              because it is not deployed yet. There is one{" "}
              <ExternalLink href={VENUE_URL} className="link">
                {VENUE_NAME}
              </ExternalLink>{" "}
              registry per market, and the one below is the {MARKET} market&apos;s.
            </p>
          }
        />

        <ul className="grid grid-cols-1 gap-x-12 lg:grid-cols-2">
          {ADDRESS_ROWS.map((row) => (
            <li key={row.address} className="grid gap-1 border-t border-line py-5">
              <h3 className="text-[17px] font-bold tracking-[-0.01em]">{row.label}</h3>
              <p className="text-[15px] text-ink-2">{row.what}</p>
              <ExternalLink
                href={addressUrl(row.address)}
                className="link mt-1 w-fit max-w-full break-all font-mono text-[13px] text-ink-2 hover:text-ink"
              >
                {row.address}
              </ExternalLink>
            </li>
          ))}
        </ul>

        <Panel pad="sm" className="mt-8">
          <p className="max-w-[60em] text-[15.5px] text-ink-2">
            <strong className="font-semibold text-ink">Settlement never reads a price feed.</strong> Whether a call is
            exercised is decided by whoever holds it, and what the vault gets back is decided by Valorem. The Chainlink
            feed is used for two things only: showing a spot price, and gating writes and listings so the vault refuses
            to sell against a stale price. A pause of the Stock Token&apos;s own oracle blocks writes and listings the
            same way. Neither is read when the week settles.
          </p>
        </Panel>

        <DocsLink href={DOCS.addresses}>Contracts and addresses</DocsLink>
      </Section>

      {/* ---------------------------------------------------------------- the record + CTA ---- */}
      <Container className="mb-[72px] mt-4">
        <div className="flex flex-wrap items-center justify-between gap-7 rounded-[28px] bg-ink px-[22px] py-[30px] text-ground sm:p-12 [&_:focus-visible]:outline-ground">
          <div>
            <h2 className="max-w-[18em] text-[length:clamp(28px,3.4vw,40px)] font-extrabold leading-[1.08] tracking-[-0.03em] text-ground">
              Then it happens again.
            </h2>
            <p className="mt-2.5 max-w-[34em] text-ground/75">
              Once the vault is live, every week is published, including the zeros. Unfilled weeks are rows on the same record as filled ones,
              because a record that only shows the weeks that worked is not a record. No projections, no annual
              numbers, no price chart: only what each closed week actually paid, in USDG.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button href={appUrl("/activity")}>See every published week</Button>
            <Button variant="inverse" href={appUrl("/vault/nvda")}>
              Open the {SHARE_TICKER} vault
            </Button>
          </div>
        </div>
        <p className="mt-6 max-w-[60em] text-[14px] text-ink-3">
          Read{" "}
          <Link href="/risks" className="link text-ink-2">
            the risks
          </Link>{" "}
          before depositing, and{" "}
          <Link href="/legal" className="link text-ink-2">
            the legal page
          </Link>{" "}
          for the geographic restrictions and the legal form of the collateral. Stock Tokens are debt securities issued
          by Robinhood Assets (Jersey) Limited, not shares. The full reference is in{" "}
          <ExternalLink href={DOCS_URL} className="link text-ink-2">
            the docs
          </ExternalLink>
          .
        </p>
      </Container>
    </>
  );
}
