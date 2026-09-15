/**
 * stonkhouse.fun/how-it-works — the mechanics, for someone who has not connected anything.
 *
 * This is the public sibling of the dapp's /docs page and a short path into the GitBook docs. The
 * reader has not deposited and nothing is connected, so every figure below is one of four things:
 * a policy setting (the value read on chain on 2026-09-15, or a compiled limit), an address, a
 * dated figure from the vault's first week (cycle 1, labelled with its cycle), or an example from
 * the keeper's fork rehearsal that is labelled as one where it appears.
 *
 * DELIBERATELY ABSENT: every number that moves week to week. No live strike, no realised week, no
 * TVL. This package makes zero chain reads and has no wallet code; the app's cycle and activity
 * pages carry the live week. Also absent: any figure scaled past one week, any chart, and any
 * statement of what a week will pay.
 *
 * LIVE FACTS THIS PAGE RESTS ON (chain 4663, 2026-09-15): policy() = (300, 1200, 10, 9500, 500, 50);
 * depositCap 20e18; maxPriceAge 345600; admin, keeper and guardian per lib/site.ts ROLE_KEYS (one
 * seed), feeRecipient() = the admin EOA, no timelock; Clear feesEnabled() false, feeTo() a 1-of-1
 * Safe; cycle 1 strike 223e6, listing gross 856436 for 1 contract. Keeper vol mode: keeper/src/vol.ts,
 * config.ts (target delta 0.15, edge 1000 bps, band buffer 200 bps, reprice-up 2500 bps); Railway
 * sets KEEPER_PREMIUM_MARGIN_BPS=50. The Exercise card on the app's cycle page follows the exercise
 * spec of 2026-09-15; the Clear's own window is exerciseTimestamp <= t < expiryTimestamp.
 *
 * WHAT THIS PAGE DESCRIBES is the vault as redesigned on 2026-09-13 (write on fill, no registry, the
 * stranded-claim state machine), with the file:line sources in stonkhousedotfun/callhouse-contracts at
 * 79cee08 plus the in-fill deposit refusal (AUDIT-FINDINGS-2026-09-14 L-01):
 *   - arm gate, nothing written:          src/Vault.sol rollOpen; src/lib/ValoremLib.sol:132-161
 *   - the listing shape:                  src/lib/SeaportOrderLib.sol:143-227; three per cycle Policy.sol:78
 *   - write on fill, floors at fill spot: src/Vault.sol authorizeOrder/validateOrder; ValoremLib.sol:201-256
 *   - the deposit gate:                   src/Vault.sol _depositRefused (seven reasons incl. in-fill)
 *   - instant redemption while flat:      src/Vault.sol canRedeemInstantly; settleQueue
 *   - split payout legs, reserve haircut: src/Vault.sol _payoutOwed, _haircut
 *   - stranded claim:                     src/Vault.sol rollClose, retryStrandedClaim, isStranded
 *   - policy and hard caps:               src/Policy.sol:49-78, :129-138; README.md "Hard caps"
 *   - fees:                               Policy.sol:217-225; ValoremLib.sol:223-231; I-01 in
 *                                         AUDIT-FINDINGS-2026-09-14 (own Clear; live feeTo is a Safe)
 * and in stonkhousedotfun/callhouse for the keeper's settings: keeper/README.md "The week" and "Pricing",
 * keeper/src/calendar.ts (NYSE Friday 16:00 ET, Thursday on a holiday, expiry +24 h).
 *
 * Every "go do something" link leaves for app.stonkhouse.fun via appUrl(). A relative href on
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
  ClockNote,
  Notice,
  Num,
  Panel,
  Section,
  SectionHead,
} from "@/components/ui";
import { WEEK } from "@/lib/clock";
import {
  ADDRESS_ROWS,
  CHAIN_ID,
  CHAIN_NAME,
  DOCS_URL,
  FILL_PAGE_PATH,
  MARKET,
  OPEN_APP,
  ROLE_KEYS,
  SHARE_TICKER,
  STATUS,
  VAULT_APP,
  addressUrl,
  appUrl,
} from "@/lib/site";

import { CaveatList, type Caveat } from "./_components/CaveatList";
import { DOCS, DocsLink } from "./_components/DocsLink";
import { FeeSlip } from "./_components/FeeSlip";
import { RuleTable, type RuleRow } from "./_components/RuleTable";
import { Timeline, type TimelineStep } from "./_components/Timeline";

const DESCRIPTION =
  "The weekly covered-call cycle in detail: the timeline, the phases, how strikes, sizes and prices are chosen, why a call is written only when it is bought, where the premium goes, how a week can end, withdrawals and deposits during a week, and who can do what.";

/**
 * `title` is the bare route name: the layout carries the "%s — Stonkhouse" template, so repeating
 * the suffix here would render it twice. `alternates.canonical` is not optional — the layout's
 * default canonical is "/", and inheriting it would point every crawler at the landing page. The
 * Open Graph title is stated in full because the template does not apply inside openGraph.
 */
export const metadata: Metadata = {
  title: "How it works",
  description: DESCRIPTION,
  alternates: { canonical: "/how-it-works" },
  openGraph: {
    title: "How it works — Stonkhouse",
    description: DESCRIPTION,
    url: "/how-it-works",
    siteName: "Stonkhouse",
    type: "article",
  },
};

const FILL_PAGE = appUrl(FILL_PAGE_PATH);

const ON_THIS_PAGE: Array<[string, string]> = [
  ["#week", "The week"],
  ["#phases", "Phases"],
  ["#policy", "Strike, size and price"],
  ["#fees", "Fees"],
  ["#endings", "How a week ends"],
  ["#withdrawals", "Withdrawals"],
  ["#deposits", "Deposits"],
  ["#roles", "Who can do what"],
  ["#contracts", "Contracts"],
];

/* ------------------------------------------------------------------ the week, step by step --- */

const STEPS: TimelineStep[] = [
  {
    title: "The keeper creates the week's call",
    when: "After the last week closes",
    body: `It creates this week's option type on the vault's own Valorem Clear: one ${MARKET} per contract, paid for in USDG, a strike picked from Cboe's delayed ${MARKET} option quotes, exercise on Friday at 16:00 New York time, the regular NYSE close (Thursday if Friday is an NYSE holiday, Wednesday if Thursday is shut too, and still 16:00 on a day NYSE closes early), and expiry 24 hours later. Anyone can create an option type, and creating one writes nothing.`,
  },
  {
    title: "The vault arms it",
    when: "Idle → Listed",
    body: `The vault reads the call back from Valorem and checks it itself: its own ${MARKET} and USDG, one token per contract, exercise at least an hour away, an exercise window of at least a day, no more than 21 days in all, Valorem's fee off or accepted, a fresh price and an unpaused Stock Token oracle, and a strike inside the band, today 3% to 12% above spot. Nothing is written. If a check fails, the vault stays Idle, and a skipped week is a normal outcome.`,
  },
  {
    title: "It lists the calls for USDG",
    when: "Until the exercise time",
    accent: true,
    body: `The keeper proposes one Seaport 1.6 order, and the vault authorises it on chain only if every field matches its own state: offered by the vault, with the vault as the order's zone, sized to what the vault could still write (today up to 95% of its ${MARKET} and 50 contracts), paid in USDG to the vault and nobody else, priced at or above the premium floor and at most the strike per call, and ending by the exercise time. The vault validates the order on Seaport itself, so the order needs no signature. At most three listings are authorised a week, cancelled ones included, so the keeper can relist at most twice.`,
    note: (
      <>
        Buy on{" "}
        <ExternalLink href={FILL_PAGE} className="link">
          the app&apos;s book
        </ExternalLink>
        , the only place the order is served. It checks the order against the chain and simulates your fill first, and
        it also shows the raw order for any Seaport 1.6 client. No third-party venue, order book or registry is
        involved.
      </>
    ),
  },
  {
    title: "A buyer fills, and only then is a call written",
    when: "Any time before the close",
    accent: true,
    body: `When a buyer takes some of the calls, Seaport asks the vault before it moves anything. The vault re-checks the clock, Valorem's fee switch, the price feed and the Stock Token oracle, the band floor and the premium floor at the spot of that moment, and the size against its capacity, then writes exactly the calls bought into Valorem. Seaport hands them to the buyer and the buyer's USDG to the vault in the same transaction. If a single call stayed behind in the vault, the whole fill reverts, so the vault never holds a call nobody bought and can never be assigned on more than it sold.`,
    note: (
      <>
        A fill can be refused after a rally, because the floors follow spot. On cycle <Num>1</Num>&apos;s listing
        (strike <Num>223</Num> USDG, asking <Num>0.856436</Num> USDG a call), a spot above about <Num>216.50</Num>{" "}
        USDG puts the strike under the band&apos;s <Num>3%</Num> floor, and no price can sell the rest of that week.
        The premium floor follows spot too, but at today&apos;s <Num>0.10%</Num> it would pass that ask only above a
        spot of about <Num>856</Num> USDG. In the fork rehearsal the first fill of a week used <Num>462,677</Num> gas
        and a later one <Num>289,157</Num>.
      </>
    ),
  },
  {
    title: "The book closes",
    when: WEEK.close,
    body: "This is the call's exercise time, fixed when the option type was created, and it is the real deadline. From that moment deposits close, nothing more can be sold or written, and anyone can lock the book, which cancels a listing still live. Nothing depends on anyone calling it, so a stopped keeper cannot hold the week open.",
  },
  {
    title: "The exercise window runs to expiry",
    when: WEEK.window,
    body: "Holders of this week's calls can exercise them on the Clear, from the exercise time until expiry. Nothing is exercised automatically, and a call not exercised by expiry expires worthless. The vault does nothing in this phase: whether a call is exercised is decided by whoever holds it. NVDA taken by an exercise leaves the vault's claim at once; the strike USDG for it arrives at the close.",
    note: (
      <>
        On{" "}
        <ExternalLink href={FILL_PAGE} className="link">
          the app&apos;s cycle page
        </ExternalLink>
        , a wallet holding this week&apos;s call sees an Exercise card: its balance, the strike, the {MARKET} received
        per contract and the exact USDG cost. The button works only inside the window. You choose how many contracts,
        and the card simulates that exercise from your wallet and shows the result, including any revert reason. On the
        click it simulates again, asks for a USDG approval to the Clear of exactly the cost (the strike, plus
        Valorem&apos;s fee if that is ever switched on) only if your existing approval is short, and then calls{" "}
        <code className="font-mono text-[13px]">exercise(optionId, amount)</code>. If spot is at or below that cost
        per {MARKET}, or the app cannot read spot, it warns you and asks you to confirm. Before the window it shows
        when exercise opens, in UTC and New York time. After expiry it says the calls expired worthless, but only until
        the close clears that week&apos;s option from the vault; after that the card no longer appears. You can also
        call <code className="font-mono text-[13px]">exercise</code> on the Clear directly, after approving it for
        the strike USDG.
      </>
    ),
  },
  {
    title: "The week closes",
    when: `From ${WEEK.expiry}`,
    accent: true,
    body: "The keeper can close from expiry, and anyone can one hour later. One transaction cancels any listing still live, redeems the Valorem claim if anything was sold (NVDA back, or strike USDG where it was assigned), takes the protocol fee from the premium alone, credits the rest per share with any strike USDG in full, settles the withdrawal queue and returns the vault to Idle.",
    note: "If a token issuer makes the redeem fail, the close still completes and keeps the claim, stranded, until a retry succeeds. The phases section below says what that shuts.",
  },
  {
    title: "You claim USDG",
    when: "Any time",
    body: "Premium and strike proceeds wait in your claimable balance, in any phase, with no deadline. Premium from a fill becomes claimable once the vault accounts for it: at the close, or earlier if a deposit arrives during the week. USDG is never reinvested for you. Then the keeper creates the next week's call and the week runs again.",
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
      withdrawals: "Instant, while nothing is written. A queue joined now can be settled by anyone",
      next: "The keeper arms this week's call, which writes nothing",
    },
  },
  {
    id: "listed",
    cells: {
      phase: "Listed",
      deposits: "Open until the exercise time. A deposit buys into the open short",
      withdrawals: "Queued",
      next: "Anyone can lock the book from the exercise time. Optional: the close also accepts a Listed vault",
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
  {
    id: "stranded",
    cells: {
      phase: "Idle, claim stranded",
      deposits: "Closed",
      withdrawals: "Queued. The queue settles on the idle NVDA now, and on the claim once it is redeemed",
      next: "Anyone retries the claim; the next week cannot be armed until it is redeemed",
    },
  },
];

const STOPS: Caveat[] = [
  {
    title: "A halt on writes",
    body: "The guardian or the admin can halt writes. It stops arming, new listings and every fill, nothing else: never a deposit, a withdrawal, the queue, a USDG claim, a stranded-claim retry, locking the book or closing the week.",
  },
  {
    title: "A stale price or a paused oracle",
    body: "The vault refuses to arm, list or sell against a stale price feed or a paused Stock Token oracle. Settlement never reads a price, so the close, the queue and claims keep working.",
  },
  {
    title: "A token issuer at the close: the claim is stranded",
    body: "Valorem cannot hand the claim back if, in a week where any of the vault's calls were exercised, USDG is paused, the vault or Valorem is frozen on USDG, or Valorem's USDG has been burnt, or if, in a week not fully assigned, the vault is blocklisted on the Stock Token. The close completes anyway and keeps the claim. Deposits, instant withdrawals and the next week stay shut, queued withdrawals settle on the idle NVDA and take their share of the claim later, and anyone can retry until it goes through. A Stock Token freeze of the vault also stops every NVDA transfer, a queued withdrawal's payout included.",
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
      param: "Minimum premium, checked at approval and at every fill",
      launch: (
        <>
          <Num>0.10%</Num> of spot notional
        </>
      ),
      cap: (
        <>
          Floor <Num>0.10%</Num>, so today&apos;s value is the lowest allowed. Lowered from <Num>0.40%</Num> on 15
          September 2026
        </>
      ),
    },
  },
  {
    id: "utilization",
    cells: {
      param: `Share of the vault's ${MARKET} that can be sold`,
      launch: <Num>95%</Num>,
      cap: <>Ceiling <Num>99.85%</Num></>,
    },
  },
  {
    id: "contracts",
    cells: { param: "Contracts per week", launch: <Num>50</Num>, cap: <>At least <Num>1</Num></> },
  },
  {
    id: "listings",
    cells: {
      param: "Listings authorised per week",
      launch: <Num>3</Num>,
      cap: "Constant. Each new listing spends one, cancelled or not",
    },
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
      param: "Oldest price the vault will arm or sell against",
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
      param: "The week's window",
      launch: (
        <>
          Set by the keeper: exercise at the Friday close, expiry <Num>24 hours</Num> later
        </>
      ),
      cap: (
        <>
          Exercise at least <Num>1 hour</Num> after arming, a window of at least <Num>1 day</Num>, at most{" "}
          <Num>21 days</Num> in all
        </>
      ),
    },
  },
];

const KEEPER_DEFAULTS: Array<{ title: string; body: string }> = [
  {
    title: "Strike",
    body: `The call with a delta of about 0.15 on Cboe's free, delayed ${MARKET} option quotes expiring on that week's close day, rounded to a whole USDG and then kept between 5% and 11.5% above spot, inside today's 3% to 12% band. If the quotes are missing, stale or inconsistent, the keeper skips the week rather than guess. The strike cannot change once armed.`,
  },
  {
    title: "Size",
    body: `Everything the policy allows, in one listing. With 20 ${MARKET} in the vault that is at most 19 contracts, and only the ones bought are ever written.`,
  },
  {
    title: "Price",
    body: "The higher of two prices, each rounded up: the quotes' mid price at the strike plus 10%, and the vault's premium floor at spot plus 0.5%. Never above the strike. The app's cycle page shows the keeper's own record of how it priced the live listing. Cycle 1's listing, at 0.856436 USDG a call, was priced by an earlier keeper version, before this rule and while the floor was still 0.40%.",
  },
  {
    title: "Repricing",
    body: "The keeper cancels and relists on the same strike when spot rises far enough that the ask falls below the premium floor, or, for a listing it priced from quotes, when fresh quotes put the price more than 25% above the live ask and a listing would still be left afterwards. It also relists after the guardian cancels a listing, and when a listing sold out and deposits added room. Every relist spends one of the vault's three listings a week, and once the strike is below the band floor no reprice can help.",
  },
];

/* -------------------------------------------------------------------------------- fees ------- */

const FEES: Array<{ who: string; size: string; when: string; body: string }> = [
  {
    who: "Stonkhouse",
    size: "5% of premium",
    when: "When premium is accounted, only above zero",
    body: "Taken when the vault accounts for premium: at the close, or earlier if a deposit arrives during the week. The rate is the one in force at that moment, so a change made before the close applies to premium already received that week. Strike proceeds from an assignment are credited to depositors in full: that exclusion is in the contract code, not a setting. The admin can change the rate, never above 20% of premium. The fee is paid to the vault's fee recipient, which today is the admin's own hot key.",
  },
  {
    who: "Valorem engine",
    size: `15 bps of written notional, in ${MARKET}`,
    when: "Currently off",
    body: `The vault's own Valorem Clear has this fee switched off. The switch is held by the Clear's fee address, a Safe with a single owner, not by the vault or its admin role. If it is switched on, the vault refuses to arm or sell until the vault admin separately accepts the fee. Once accepted, every fill pays 15 bps of the ${MARKET} it writes from the vault on top of the collateral, and the vault raises that fill's premium floor by the fee's value at spot. That sets a minimum price, not a pass-through: buyers cover the fee only when the ask is set by that floor, and when the ask comes from option quotes above it, depositors bear the fee. Exercising would also cost the exerciser 15 bps of the strike USDG, collected by the Clear for its fee address, whether or not the vault accepted.`,
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
      "The listing stayed open until the exercise time and nobody filled it. The week pays no premium and no fee is charged.",
      "Calls are written only when they are bought, so nothing was written and nothing can be assigned: the NVDA never left the vault, and the close simply returns it to Idle. The week is published like any other, not hidden as an error. In the fork rehearsal's first week, 23 calls were offered and the week closed with 0 USDG.",
    ],
    premium: "None",
    nvda: "Never left the vault",
    upside: "Kept",
  },
  {
    id: "otm",
    title: "Bought, expired worthless",
    chip: { tone: "accent", label: "Premium kept" },
    body: [
      "Buyers paid for some or all of the calls, each fill wrote exactly what it bought, and no exercise was assigned to the vault, usually because NVDA stayed below the strike. The options expire worthless to their holders.",
      "Premium, less Stonkhouse's 5%, is credited to depositors in USDG, and the NVDA behind the calls sold comes back at the close.",
    ],
    premium: "Kept, net of the fee",
    nvda: "Back at the close",
    upside: "Kept",
  },
  {
    id: "itm",
    title: "Bought and exercised",
    chip: { tone: "warn", label: "Assigned" },
    body: [
      "Assignment can take the collateral at the strike. NVDA finished above the strike and holders exercised: the assigned NVDA leaves and comes back as strike USDG, credited to depositors in full with no protocol fee. The premium is still kept, net of the fee, and anything above the strike is given up for that week. In the rehearsal's second week, 2 of the 5 calls sold were exercised at 223, and 446 USDG came back fee-free.",
      "v1 does not buy the NVDA back. Afterwards each cNVDA share holds less NVDA and more claimable USDG, the vault stays underweight until new deposits add to it, and the next week offers calls against the smaller balance.",
    ],
    premium: "Kept, net of the fee",
    nvda: "Part or all of what was sold leaves at the strike, paid in USDG",
    upside: "Given up that week",
  },
  {
    id: "stranded",
    title: "Closed, claim stranded",
    chip: { tone: "warn", label: "Close held up" },
    body: [
      "Closing the week asks Valorem to hand back the vault's claim, and a token issuer can make that fail: in a week where any of the vault's calls were exercised, USDG paused or the vault or Valorem frozen on USDG; in a week not fully assigned, the vault blocklisted on the Stock Token. The week closes anyway and the vault returns to Idle with the claim kept.",
      "While it is stranded, deposits, instant withdrawals and the next week are shut. Queued withdrawals settle their share of the idle NVDA at once and take their share of the claim when it is redeemed. Anyone can retry, as often as they like; it goes through only when the issuer lets it. In the rehearsal a USDG freeze of the vault stranded week 3, and after the unfreeze the retry brought back 1 NVDA and 239 USDG and the next week armed normally.",
    ],
    premium: "Credited; USDG claims wait on USDG",
    nvda: "Held in the claim until a retry succeeds",
    upside: "As the week ended",
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
    title: "Queueing while the vault is Idle",
    body: "It works, and anyone can settle that queue at once, at the same price as an instant withdrawal; the keeper does so before it arms the next week. While the vault is Idle with nothing written, redeeming instantly gets the same result in one step.",
  },
  {
    title: "USDG cannot hold up your NVDA",
    body: "A settled withdrawal pays its NVDA whatever USDG is doing. If USDG is paused or an address is frozen, only the USDG part waits, still owed, and can be collected later or to another address.",
  },
  {
    title: "A frozen Stock Token can",
    body: "A Stock Token freeze of the vault stops every NVDA payout, a queued one included, until it lifts. Stonkhouse runs no market for cNVDA, so do not count on selling shares instead.",
  },
  {
    title: "An issuer burn is shared",
    body: "If the Stock Token issuer burns NVDA from the vault below what settled withdrawals are owed, every uncollected withdrawal is paid the same fraction, whoever collects first, and deposits stay closed until the shortfall is gone.",
  },
];

const DEPOSIT_POINTS: Array<{ title: string; body: string }> = [
  {
    title: "Your NVDA can be sold that week",
    body: "A deposit adds to what the vault can sell: later fills that week are sized against the larger balance, so calls can be written against your NVDA in the week you arrive.",
  },
  {
    title: "Your shares carry that week's result",
    body: "cNVDA is pooled. From the moment your shares are minted you share pro rata in the rest of the week: premium from fills after your deposit, and the effect of any assignment, which is a lower NVDA share price plus a share of the strike USDG.",
  },
  {
    title: "Premium from before you arrived is not yours",
    body: "Before minting your shares, the deposit credits any premium that already reached the vault to the existing shares. A deposit made after a fill in the same transaction is refused, so it cannot take part of the premium that fill is paying.",
  },
  {
    title: "Deposits close at the exercise time",
    body: "And whenever a share cannot be priced honestly: while a claim is stranded, while assignment proceeds wait unredeemed, while an issuer burn leaves settled withdrawals unbacked, or while the share price is below a compiled floor. Exercise happens inside Valorem with no call to the vault: NVDA leaves at once while its strike USDG only arrives at the close, and new shares priced in that gap would take strike proceeds from the depositors who were assigned. The app's maximum goes to zero at the same instant.",
  },
];

/* ------------------------------------------------------------------------------- roles ------- */

const ROLES: Array<{
  id: string;
  title: string;
  holder: string;
  key?: string;
  can: string[];
  cannot: string[];
  note: string;
}> = [
  {
    id: "admin",
    title: "Admin",
    holder: "One hot key",
    key: ROLE_KEYS.admin,
    can: [
      "Set the policy inside the compiled limits, the deposit cap, the fee recipient and the price age",
      "Accept Valorem's engine fee. The switch that turns it on belongs to the Clear's fee address, not to this role",
      "Halt writes, and lift a halt",
      "Grant and revoke every role",
    ],
    cannot: [
      "Transfer depositors' NVDA, USDG or cNVDA",
      "Upgrade the vault or change an external address",
      "Block the queue, claims, a stranded-claim retry, locking the book or the close",
      "Charge a fee on strike proceeds, or go past a compiled limit",
    ],
    note: "Today every admin power sits with one hot key, the key that deployed the vault, which is also the protocol fee's recipient. There is no timelock: a change takes effect in the transaction that makes it. A handover to a Safe is planned and has not happened. A compromised admin could raise the fee to 20% of premium and redirect it, or grant itself the keeper role, loosen the policy to its limits and sell calls at the floor to a buyer it controls. No tokens leave the vault directly, but that is a real loss to depositors.",
  },
  {
    id: "keeper",
    title: "Keeper",
    holder: "Hot key, run by the keeper service",
    key: ROLE_KEYS.keeper,
    can: [
      "Create and arm the week's call",
      "Authorise up to three listings a week, and cancel or invalidate them",
      "Close the week from expiry, an hour before anyone else",
    ],
    cannot: [
      "Transfer, approve or receive a token for the vault",
      "Route premium to itself",
      "Change settings, halt, or grant roles",
      "Arm a strike outside the band, list past the exercise time, or offer more than the vault can write",
    ],
    note: "Inside those limits it can choose the least favourable terms the policy allows, such as the lowest strike and a price at the premium floor (0.10% of spot notional today), and sell to a buyer it controls, or skip a week by not arming or not listing.",
  },
  {
    id: "guardian",
    title: "Guardian",
    holder: "One key",
    key: ROLE_KEYS.guardian,
    can: ["Halt arming, listings and every fill", "Cancel the live listing", "Invalidate every outstanding listing"],
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
      "Buy calls from the vault's listing on the app's cycle page",
      "Exercise calls they hold, between the exercise time and expiry",
      "Lock the book from the exercise time",
      "Close the week from one hour after expiry",
      "Settle the queue while the vault is Idle",
      "Retry a stranded claim",
      "Push a stuck protocol fee to its recipient (never to the caller)",
    ],
    cannot: [],
    note: "Because locking the book, closing the week, settling the queue and retrying a stranded claim are open to anyone, settlement and the queue do not depend on the keeper or the guardian staying alive.",
  },
];

/* ============================================================================================= */

export default function HowItWorksPage() {
  return (
    <>
      {/* ---------------------------------------------------------------- page head ----------- */}
      <Container className="grid grid-cols-1 items-center gap-9 pb-14 pt-4 sm:pb-[72px] lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:gap-14 lg:pt-10">
        <div>
          <div className="flex flex-wrap gap-2">
            <Chip tone="accent" dot wrap>
              {STATUS.phase} · {CHAIN_NAME}
            </Chip>

          </div>
          <h1 className="mt-5 text-[length:clamp(38px,5vw,60px)] font-extrabold leading-[1.03] tracking-[-0.035em]">
            One week. <span className="text-accent">Your stock.</span>
          </h1>
          <p className="mt-[22px] max-w-[34em] text-[18px] text-ink-2 sm:text-[19px]">
            Put your {MARKET} in and choose how much is for sale this week. If someone pays you, that amount can be
            sold at the set price. If they don&apos;t, you keep it. This page is that week in detail.
          </p>
          <div className="mt-[30px] flex flex-wrap gap-3">
            <Button href={OPEN_APP}>Open the app</Button>
            <Button variant="ghost" href={DOCS_URL}>
              Read the docs
            </Button>
          </div>
          <Notice variant="plain" className="mt-[26px]">
            Premium is paid only if a buyer fills. Assignment can take the collateral at the strike.
          </Notice>
        </div>

        <Panel as="aside" lift aria-labelledby="glance-h" className="grid gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="glance-h" className="text-[18px] font-bold tracking-[-0.01em]">
              The rules at a glance
            </h2>
            <Chip>Current settings</Chip>
          </div>
          <dl className="grid grid-cols-2 gap-3">
            <Figure boxed size="md" label="Our fee" value="5%" />
            <Figure boxed size="md" label="Strike above spot" value="3–12%" />
            <Figure boxed size="md" label="Book closes" value="Friday 4:00pm" unit="New York" />
            <Figure boxed size="md" label="Expiry" value="Saturday 4:00pm" unit="New York" />
          </dl>
          <ClockNote className="border-t border-line pt-4" />
          <p className="text-[13.5px] text-ink-3">
            When Friday is an NYSE holiday the book closes on Thursday and expiry is on Friday. The admin can change
            these settings at any time, inside the compiled limits where the contracts set one; the deposit cap has
            none.
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
          title="Eight steps, from a new call to your claim."
          intro="The clock is the regular US market close. The keeper sets each week's exercise time at 16:00 New York time on Friday, even on a day NYSE closes early, and expiry a day later; the vault reads both from the call itself and holds everyone to them. The times below are the keeper's rule, not a promise the contracts make: the contracts accept any window that opens at least an hour out, lasts at least a day and ends within 21 days."
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
          intro="The contracts, not the keeper, decide what you can do at each point in the week. Deposits and withdrawals follow the phase, and a stranded claim is an Idle vault that is not yet flat."
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
          Three things can stop part of the week. A halt and a stale or paused price never touch settlement; a token
          issuer acting at the close strands the week&apos;s claim until it lifts. The issuers&apos; wider powers are on{" "}
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
          eyebrow="Strike, size and price"
          title="How the strike, the size and the price are chosen."
          intro="Two layers. Current values are what the vault reads today, and the admin can change them at any time with no timelock, taking effect at once, in the middle of a week too. Compiled limits are in the bytecode, checked on every change, and no key can move them. Neither is a forecast of what a week will pay."
        />

        <RuleTable
          caption="Current policy and the limits compiled into the contracts"
          firstColWidth="w-[38%]"
          columns={[
            { key: "param", label: "Setting" },
            { key: "launch", label: "Current value" },
            { key: "cap", label: "Compiled limit" },
          ]}
          rows={POLICY_ROWS}
        />

        <div className="mt-14 grid grid-cols-1 gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div>
            <h3 className="text-[22px] font-bold tracking-[-0.015em]">Inside the band, by default</h3>
            <p className="mt-3 text-[15.5px] text-ink-2">
              The contracts set the bounds and the keeper software chooses inside them. These are the settings it runs
              with today: operating choices, not commitments, and whoever runs the keeper can change them without a
              contract change. If the strike would not fit the band, the vault arms nothing that week.
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

        <DocsLink href={DOCS.policy}>Policy and hard caps</DocsLink>
      </Section>

      {/* ---------------------------------------------------------------- 4. fees ------------- */}
      <Section id="fees" labelledBy="fees-h" className="scroll-mt-4">
        <SectionHead
          id="fees-h"
          eyebrow="Where the money goes"
          title="The live fee comes out of premium, and only premium."
          intro="One fee is charged today, and it is taken from premium, which exists only when a buyer fills. A week with no buyer is charged nothing, and nothing is charged on deposits, idle NVDA or strike proceeds. Valorem's engine fee, off today, would be different: see below."
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
                <strong className="font-semibold">One fee, on premium only: 5% of what buyers pay.</strong> Every listing
                has a single payment leg, USDG to the vault, so nothing is taken out of a fill before it arrives. At the
                compiled ceiling the fee would be 20%.
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
          eyebrow="How a week ends"
          title="Three endings, and a close that can be held up."
          intro="Premium is paid only if a buyer fills. Which ending you get is decided by buyers, by what holders of this week's calls do and by the token issuers, not by anything the vault does."
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
          <strong className="font-semibold text-ink">Partial assignment is normal.</strong> Anyone can write the same
          call on Valorem, and Valorem spreads each exercise across the writers of that call, bucket by bucket, not
          according to who sold the exercised call. A week can end with some of the vault&apos;s contracts assigned and
          the rest not. Because the vault writes only what it sells, it is never assigned on more contracts than it
          sold. The vault then holds a mix of NVDA and USDG, every depositor gets the same blend per share, and a queued
          withdrawal settled that week pays out in the same mix.
        </Notice>

        <DocsLink href={DOCS.assignment}>Assignment, with worked examples</DocsLink>
      </Section>

      {/* ---------------------------------------------------------------- 6. withdrawals ------ */}
      <Section id="withdrawals" labelledBy="withdrawals-h" className="scroll-mt-4">
        <SectionHead
          id="withdrawals-h"
          eyebrow="Withdrawals"
          title="Two ways out, and the phase picks one."
          intro="From the moment a week is listed until it closes, a withdrawal waits for the close: NVDA behind a call sold is locked in Valorem until expiry, and a fill can write against the rest at any moment. The queue is the mechanism, not a discretionary gate: no Stonkhouse key can jump it or stop it."
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
              <li>A halt on writes never blocks it. It is off while a claim is stranded.</li>
            </ul>
          </Panel>

          <Panel as="article" pad="lg" aria-labelledby="queue-h" className="max-sm:p-[22px]!">
            <Chip tone="warn" dot>
              While a week is listed
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
                  week&apos;s USDG first, then burns the escrowed shares and sets aside their NVDA and USDG. While the
                  vault is Idle, anyone can settle the queue the same way.
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
                <dd className="text-ink-2">
                  Your pro-rata share of the vault&apos;s idle NVDA at settlement, priced like an instant withdrawal.
                  If the week&apos;s claim was stranded, your share of it follows when it is redeemed.
                </dd>
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
          intro="Deposits stay open while a week is listed, until the call's exercise time. A deposit in that window buys into the open short and joins the week, for better or for worse."
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
              Shares are priced at the NVDA behind them, including NVDA locked behind calls already sold at full
              value, with nothing subtracted for what those calls could cost. If NVDA is already above the strike
              when you deposit, you pay full price for collateral that may leave at the strike, and part of that loss
              is yours. Depositing while the vault is Idle avoids this.
            </Notice>
            <dl className="grid gap-0 text-[14.5px]">
              <div className="flex justify-between gap-3 border-t border-line py-2.5">
                <dt className="text-ink-2">First deposit</dt>
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
              The cap counts idle NVDA plus NVDA locked behind calls sold this week, so a fill does not free up room
              under it.
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
          intro="Three roles run the week and set policy inside the compiled limits. None of them can transfer depositors' tokens, though a bad keeper or admin could still cost depositors money, and every step that finishes a week is open to anyone."
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
              {role.key ? (
                <ExternalLink
                  href={addressUrl(role.key)}
                  className="link -mt-2 w-fit max-w-full break-all font-mono text-[13px] text-ink-3 hover:text-ink"
                >
                  {role.key}
                </ExternalLink>
              ) : null}
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
          is already open. The Stonkhouse contracts have had no external audit, only an internal review dated 14
          September 2026. There is no bug bounty.
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
              Everything the weekly cycle uses on chain {CHAIN_ID}. Stonkhouse deployed the vault, its two linked
              libraries and its own Valorem Clear on 15 September 2026; the rest are third-party contracts. There is no
              registry and no third-party venue in the path.
            </p>
          }
        />

        <ul className="grid grid-cols-1 gap-x-12 lg:grid-cols-2">
          {ADDRESS_ROWS.map((row) => (
            <li key={row.label} className="grid gap-1 border-t border-line py-5">
              <h3 className="text-[17px] font-bold tracking-[-0.01em]">{row.label}</h3>
              <p className="text-[15px] text-ink-2">{row.what}</p>
              {row.verified ? <p className="text-[13.5px] text-ink-3">{row.verified}</p> : null}
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
            feed is used for two things only: showing a spot price, and the floors the vault checks when it arms a week,
            approves a listing and sells a call, so it refuses to sell against a price older than{" "}
            <Num>4 days</Num> today. A pause of the Stock Token&apos;s own oracle blocks arming, listings and fills the
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
              Every week the vault arms goes on the record in the app, including the zeros. Unfilled weeks are rows on
              the same record as filled ones, because a record that only shows the weeks that worked is not a record. A
              week the keeper skips is never armed and leaves no row. No projections, no annual numbers, no price chart:
              only what each closed week actually paid, in USDG.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button href={appUrl("/activity")}>See every published week</Button>
            <Button variant="inverse" href={VAULT_APP}>
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
