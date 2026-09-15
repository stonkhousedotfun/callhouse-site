/**
 * /risks — the unabridged failure list for stonkhouse.fun, in the Daylight design.
 *
 * This page is a product feature, not a legal appendix. The pitch is that the bad weeks are
 * published, so the bad weeks are described here in the register an engineer would use in a
 * postmortem: what the failure is, how often to expect it, what it costs the depositor, and what
 * the system actually does about it. For several of these the answer is nothing, and the page says
 * so rather than inventing a mitigation.
 *
 * Layout: a page head with the four standing disclosures in a lifted key panel, an "At a glance"
 * strip (every risk as a link, with how often and the worst case), then one band per group with
 * the detailed entries, then the perimeter notes and the CTA band. The strip and the entries render
 * from the same GROUPS records (see ./_components/risk-ui.tsx).
 *
 * Sources, in order of authority: the contracts (leekzor/callhouse-contracts), the audited GitBook
 * docs (leekzor/callhouse-docs: product/risks.md, product/policy.md, protocol/roles.md,
 * getting-started/withdrawing.md and depositing.md), then the previous version of this page. Where
 * this page and those disagree, this page is the one that is wrong.
 *
 * DELIBERATELY ABSENT:
 *   - Any number that is not a fixed policy setting or a compiled limit. No live state, no fetch,
 *     no chain read; the vault is not deployed and a zero next to a risk would read as a
 *     measurement.
 *   - Any likelihood expressed as a percentage. "Most weeks" is an honest ordering; "12% chance of
 *     assignment" would be a model we do not have.
 *   - Any reassurance the bytecode does not enforce. Every "What the system does" line maps to a
 *     check in the contracts, to documented keeper or app behaviour, or to an explicit "nothing".
 *   - Wallet code of any kind. Links that do something point into app.stonkhouse.fun via
 *     appUrl(), and open in a new tab.
 */
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

import { Button, Container, Eyebrow, ExternalLink, Figure, Num, Panel, Section, SectionHead, WarnIcon } from "@/components/ui";
import { ADDRESSES, CHAIN_ID, CHAIN_NAME, DOCS_URL, MARKET, SHARE_TICKER, addressUrl, appUrl } from "@/lib/site";

import { GlanceGroup, ImpactLegend, RiskEntry, type RiskGroup } from "./_components/risk-ui";

const DESCRIPTION =
  "Every way a week here pays nothing, or costs you the collateral: no buyer, assignment, issuer freeze, unaudited contracts, a keeper that can stop.";

export const metadata: Metadata = {
  // Bare route name: the layout's "%s — Stonkhouse" template applies the suffix. The Open Graph
  // title is stated in full because the template does not apply inside openGraph.
  title: "Risks",
  description: DESCRIPTION,
  alternates: { canonical: "/risks" },
  openGraph: {
    title: "Risks — Stonkhouse",
    description: DESCRIPTION,
    url: "/risks",
    siteName: "Stonkhouse",
    type: "article",
  },
};

/* ------------------------------------------------------------------------------------------------
 * The risks. Copy lives here, in the page file, so copy-lint and a reviewer read it in one place.
 * ---------------------------------------------------------------------------------------------- */

const GROUPS: readonly RiskGroup[] = [
  {
    id: "ordinary",
    eyebrow: "Ordinary outcomes",
    title: "Not edge cases. Every week ends in one or more of these.",
    intro:
      "A vault that sells one thing a week can fail to sell it, sell it and have it exercised, or have it exercised without selling it at all.",
    risks: [
      {
        id: "no-buyer",
        title: "No buyer: a week that pays zero",
        often: "Most weeks",
        impact: "premium",
        body: (
          <>
            <p>
              Premium is paid only if a buyer fills. The keeper writes the call and lists it on
              Overcall. If nobody buys before the book closes (<Num>Fri 20:00 UTC</Num> in
              Overcall&apos;s current cycle; the registry&apos;s timestamps are what count), the
              week&apos;s premium is zero and the unsold calls expire worthless.
            </p>
            <p>
              This is the most likely outcome on a thin book, and the book for weekly calls on a
              tokenised stock is thin.
            </p>
          </>
        ),
        cost: (
          <p>
            The week&apos;s premium, which is zero, and the time. The protocol fee is a share of the
            premium the vault receives, so an unfilled week pays no fee either. An unsold listing
            does not protect the collateral from assignment: see the next entry.
          </p>
        ),
        response: (
          <>
            <p>
              Publishes it. An empty book is a market fact, not an error, so the week appears in the
              results with premium <Num>0</Num>, marked unfilled (or assigned, if Valorem assigned
              part of the vault&apos;s claim anyway), next to the weeks that filled.
            </p>
            <p>
              If Overcall&apos;s book does not show the listing, the app&apos;s cycle page falls back
              to the keeper&apos;s signed order, checks it against the chain, and offers the fill
              there, labelled as the keeper&apos;s listing. Buyers who only browse Overcall still
              will not see it, so an invisible listing is still likely to be an unfilled week.
            </p>
          </>
        ),
      },
      {
        id: "assigned-unsold",
        title: "Assignment in a week nobody bought",
        often: `Any week ${MARKET} runs`,
        impact: "upside",
        body: (
          <p>
            The call the vault writes is not private to it. It is one of the {MARKET} options Overcall
            registers for the week, and anyone who writes the same option writes into the same
            series. Valorem assigns exercises across all writers of a series, by bucket, not to
            whoever sold the exercised call. So if buyers of calls that other writers sold exercise,
            part or all of the vault&apos;s position can be assigned even though its own listing
            never filled.
          </p>
        ),
        cost: (
          <p>
            Both at once. The week&apos;s premium is zero, and the assigned tokens leave at the
            strike. The vault receives the strike in USDG, credited to depositors with no fee, and
            the upside above the strike is gone for that week. <Num>v1</Num> does not buy the tokens
            back.
          </p>
        ),
        response: (
          <p>
            Nothing it can do. The vault cannot choose which writers Valorem assigns, and holding its
            own unsold calls does not shield its collateral: they are worthless after expiry. At the
            close the vault redeems its claim and gets back the collateral that was not assigned,
            plus the strike USDG for what was. Deposits stay closed while assignment proceeds sit
            unredeemed in the claim, so nobody can buy shares into that gap.
          </p>
        ),
      },
      {
        id: "assignment",
        title: "Assignment caps your upside",
        often: `Any week ${MARKET} runs`,
        impact: "upside",
        body: (
          <p>
            Anyone holding a call of the series the vault wrote may exercise it inside the exercise
            window (<Num>Fri 20:00</Num> to <Num>Sat 20:00 UTC</Num> in Overcall&apos;s current
            cycle), and Valorem can assign that exercise to the vault whether or not the call was
            bought from the vault. Valorem takes the collateral at the strike and leaves the strike
            proceeds in USDG, credited to depositors in full: the protocol fee is charged on premium,
            never on strike proceeds. At launch the strike is the nearest Overcall rung{" "}
            <Num>3%</Num> to <Num>12%</Num> above spot at the write, so it takes a move, but not an
            enormous one.
          </p>
        ),
        cost: (
          <p>
            Every cent of upside above the strike for that week, and the position itself. The vault
            can end the week underweight {MARKET}, holding USDG where it used to hold tokens, so the{" "}
            {MARKET} behind each share falls. If {MARKET} gaps up and keeps going, you sold the move
            for a week&apos;s premium.
          </p>
        ),
        response: (
          <>
            <p>
              <Num>v1</Num> does not buy the token back. That would be <Num>v2</Num>, and it is not in
              the <Num>v1</Num> contracts: an automated market buy is a risk of its own.
            </p>
            <p>
              The vault does defend the accounting around assignment. Deposits close at the
              cycle&apos;s exercise timestamp, whether or not the keeper is running, and as soon as
              any contract is assigned, so nobody can mint shares into a position whose collateral
              has already left.
            </p>
          </>
        ),
      },
      {
        id: "partial-assignment",
        title: "Partial assignment",
        often: "Whenever assigned",
        impact: "upside",
        body: (
          <p>
            Valorem assigns by bucket, not perfectly pro rata. The vault can be assigned on some of
            the contracts it wrote and not on others, so an exercised week usually ends as a mixture
            rather than a clean swap. Assignment reaches every contract the vault wrote, while
            premium comes only from the contracts it sold.
          </p>
        ),
        cost: (
          <p>
            Predictability, and possibly assignment on contracts that never earned a premium. A
            redemption from an open week is never a promise of a fixed number of tokens: part of what
            comes back can be USDG at the strike, and the split is not known until the week closes.
          </p>
        ),
        response: (
          <p>
            Nothing it can do. Which contracts get assigned is the clearinghouse&apos;s decision, not
            the vault&apos;s, and there is no call that makes it fairer. The vault pools the result:
            every depositor gets the same blend, and nobody is singled out for the assigned part.
          </p>
        ),
      },
    ],
  },
  {
    id: "position",
    eyebrow: "Your position",
    title: "Not failures, and still the reasons people end up unhappy.",
    intro:
      "When money can come in and go out, what a late deposit shares, and what nothing tops up. These are the design, stated plainly.",
    risks: [
      {
        id: "open-week-deposit",
        title: "Depositing into an open week",
        often: "Any deposit while a call is open",
        impact: "upside",
        body: (
          <p>
            Deposits stay open while a call is live, until the exercise timestamp. A deposit then is
            priced at face value: the share price counts the {MARKET} locked behind the call and
            does not subtract what the call could cost. The new shares share that week&apos;s result,
            including any assignment.
          </p>
        ),
        cost: (
          <p>
            If {MARKET} is above the strike when you deposit, you pay full price for shares whose
            collateral may leave at the strike, and your shares take their pro rata part of that
            loss. Deposits made while the vault is Idle are not exposed this way.
          </p>
        ),
        response: (
          <p>
            Deposits close at the exercise timestamp without anyone calling anything, and as soon as
            any contract is assigned, whatever the clock says. They reopen when the week closes and
            the vault is Idle again.
          </p>
        ),
      },
      {
        id: "withdrawals-queue",
        title: "Withdrawals wait for the close",
        often: "Every open week",
        impact: "exit",
        body: (
          <p>
            A withdrawal settles instantly only while the vault is Idle with nothing written. Once a
            call is open, the collateral is locked in Valorem until expiry, so a withdrawal started
            mid-week is queued and completes after the week closes, not before. A queued redemption
            cannot be cancelled.
          </p>
        ),
        cost: (
          <p>
            The option to leave at a moment of your choosing. <Num>{SHARE_TICKER}</Num> is not listed
            anywhere, so there is no secondary market to sell into instead, and what the queue
            returns is a mix of {MARKET} and USDG rather than a fixed token count.
          </p>
        ),
        response: (
          <p>
            The queue is the mechanism, not a discretionary gate. Queued shares are escrowed and
            tagged with an epoch, the epoch settles when the week closes, and you draw a pro rata
            share of the {MARKET} plus the USDG your own queued shares earned. No Stonkhouse key can
            jump the queue or stop it, and the close is open to anyone an hour after expiry. A Stock
            Token issuer freeze can still hold up the close until it lifts.
          </p>
        ),
      },
      {
        id: "no-subsidy",
        title: "No subsidy behind a bad week",
        often: "By design",
        impact: "premium",
        body: (
          <p>
            Plenty of products make an empty week look survivable by paying it in their own token.
            This one has no token to pay with. Depositors keep the premium left after Overcall&apos;s{" "}
            <Num>5%</Num> and the <Num>5%</Num> protocol fee, and that is the entire return path.
          </p>
        ),
        cost: (
          <p>
            The cushion. There is no emission to offset an assigned week, and no airdrop to make up
            for a run of empty ones.
          </p>
        ),
        response: (
          <p>
            Nothing, deliberately. There is no protocol token, no points programme and no airdrop at
            launch, so nothing quietly tops up a week that earned nothing. A zero week is shown as
            zero because there is nothing available to paper over it.
          </p>
        ),
      },
    ],
  },
  {
    id: "asset",
    eyebrow: "The asset and the stablecoin",
    title: "Two tokens with somebody else's keys on them.",
    intro:
      "The collateral and the payout are issued by third parties who hold powers over both. None of those powers can be overridden from the vault.",
    risks: [
      {
        id: "issuer",
        title: "Issuer freeze or oracle pause",
        often: "Rare, and unmitigable",
        impact: "total",
        body: (
          <>
            <p>
              Stock Tokens are debt securities issued by Robinhood Assets (Jersey) Limited. They are
              not shares: no vote, no claim on Nvidia, and issuer credit risk on that entity. The
              issuer can freeze or restrict transfers, blocklist the vault, burn tokens from any
              holder including the vault, and upgrade the token contract, each from a single key with
              no timelock. The token can also pause its own price oracle.
            </p>
            <p>
              The two events are different. A freeze stops anything that moves the token, including
              writing a call and closing the week. An oracle pause stops the vault writing and listing
              new calls, and nothing else: settlement never reads the oracle, so an open week still
              closes.
            </p>
          </>
        ),
        extra: <FreezeList />,
        cost: (
          <>
            <p>
              In the mild case, weeks of nothing: no new calls under either event, and under a freeze
              an open week that cannot close and redemptions that cannot pay out tokens until it
              lifts.
            </p>
            <p>
              In the severe case, the instrument itself. If the issuer fails, the token does not
              survive independently of it. The legal form is set out on{" "}
              <Link href="/legal" className="link">
                the legal page
              </Link>
              .
            </p>
          </>
        ),
        response: (
          <p>
            There is no technical mitigation, and pretending otherwise would be the dishonest part:
            that is the asset. What the contracts ensure is that a freeze never traps you
            procedurally (queueing a redemption and claiming credited USDG keep working), and the
            vault refuses to write against a paused oracle rather than writing blind.
          </p>
        ),
      },
      {
        id: "usdg",
        title: "USDG, the stablecoin you are paid in",
        often: "Rare, and outside our control",
        impact: "total",
        body: (
          <p>
            Premium and strike proceeds are paid in USDG, a third-party stablecoin, so you carry
            whatever risk USDG carries. It is upgradeable by an admin behind a{" "}
            <Num>24-hour</Num> timelock that Stonkhouse does not control. A separate single key can
            pause USDG, freeze an address, and wipe the USDG balance of a frozen address, the
            vault&apos;s included.
          </p>
        ),
        cost: (
          <p>
            A pause or a freeze stops USDG claims and USDG payouts until it is resolved, and a wipe
            would take the USDG a frozen vault holds. If the vault&apos;s address is frozen on a week
            with strike proceeds to receive, closing the week can revert, and the collateral and the
            redeem queue wait until the freeze is lifted.
          </p>
        ),
        response: (
          <p>
            A USDG-side problem with the protocol fee cannot block the close of a week. That
            protection covers the fee only. Closing the week is the only way to redeem the Valorem
            claim, and there is no alternative unwind, rescue function or upgrade path.
          </p>
        ),
      },
    ],
  },
  {
    id: "third-parties",
    eyebrow: "Third parties",
    title: "Services that can stop the week.",
    intro:
      "Contracts and services in the path belong to somebody else, and none of them can be overridden from here. Most of their failures end in a skipped week, which is the safe direction.",
    risks: [
      {
        id: "valorem-fee",
        title: "Valorem engine fee switch",
        often: "One key away",
        impact: "nvda-fee",
        body: (
          <p>
            Valorem Clear can charge <Num>15 bps</Num> of written notional, paid in {MARKET} from the
            vault&apos;s balance on top of the collateral at each write, whether or not a buyer
            fills. It is off today, and the switch belongs to a third party. On a weekly
            out-of-the-money call that is not small change: the launch floor for a listing is{" "}
            <Num>0.40%</Num> of spot, so <Num>15 bps</Num> of notional can be a large share of a good
            week and more than all of a thin one.
          </p>
        ),
        cost: (
          <p>
            Nothing directly while the fee is not accepted, because the vault refuses to write; the
            cost is weeks of zero until the admin decides. If the admin accepts it, every write pays
            it in {MARKET}, filled or not.
          </p>
        ),
        response: (
          <p>
            The vault stops writing rather than paying a fee nobody agreed to. While Valorem reports
            the fee on and the vault admin has not accepted it, opening a week reverts. Accepting it
            is an admin decision, recorded on chain as an event, not something the keeper can do.
          </p>
        ),
      },
      {
        id: "outages",
        title: "Sequencer, price feed or listings API down",
        often: "Occasional",
        impact: "premium",
        body: (
          <>
            <p>
              {CHAIN_NAME} runs a centralised sequencer with no uptime feed, so an outage shows up
              here as a stale price. The {MARKET} price feed follows US equity hours and stops over
              weekends and holidays; a gap longer than the vault&apos;s price-age limit (
              <Num>4 days</Num> at launch) blocks writing until the feed updates.
            </p>
            <p>
              Overcall&apos;s listings API is a third-party service that can reject or drop an order.
              Any of these, in the hours before the book closes, means no visible listing when buyers
              are looking.
            </p>
          </>
        ),
        cost: (
          <p>
            The week&apos;s premium: the same outcome as no buyer, arrived at for an operational
            reason instead of a market one. A call already written stays written, and assignable,
            until expiry.
          </p>
        ),
        response: (
          <p>
            The keeper retries the listings API with backoff, and the vault refuses to write or list
            against a stale or paused price. Before the write that is a skipped week; after it, the
            written calls sit unlisted, and assignable, until expiry. If Overcall rejects or drops the
            order, the keeper keeps serving it, and the app&apos;s cycle page can offer it after
            checking it against the chain.
          </p>
        ),
      },
    ],
  },
  {
    id: "code-and-keys",
    eyebrow: "Code and keys",
    title: "What a bug costs, and what a stolen key buys.",
    intro:
      "And what the people with permissions can still get wrong inside the limits compiled into the contracts.",
    risks: [
      {
        id: "contracts",
        title: "Smart contract risk",
        often: "Unquantified",
        impact: "total",
        body: (
          <>
            <p>
              <strong className="font-semibold text-ink">
                The Stonkhouse contracts are not deployed and have not been audited.
              </strong>{" "}
              An internal adversarial review across <Num>13</Num> surfaces raised <Num>72</Num>{" "}
              findings, of which <Num>51</Num> survived refutation. The contract defects recorded as
              fixed carry regression tests; the project&apos;s records do not say every surviving
              finding was fixed. That review was done by the people who wrote the code. It is not an
              audit, and it does not substitute for one.
            </p>
            <p>
              Valorem Clear was audited by Zellic in <Num>2022–2023</Num> under its former name,
              OptionSettlementEngine. That audit covers Valorem, not this vault. Seaport, USDG and the
              Stock Token are third-party code outside anyone&apos;s control here.
            </p>
          </>
        ),
        cost: <p>In the worst case, everything deposited.</p>,
        response: (
          <p>
            The deposit cap is the real statement of confidence: <Num>20 {MARKET}</Num> at launch, not
            an open door, and the launch plan is to publish four weekly results, unfilled weeks
            included, before raising it. There is no proxy and no upgrade key, so a bug means a new
            vault and a migration, not a silent patch. An external audit is planned and has not
            happened.
          </p>
        ),
      },
      {
        id: "keeper-stops",
        title: "Keeper stops running",
        often: "Expect it eventually",
        impact: "premium",
        body: (
          <p>
            The keeper is one hot key running a weekly state machine against a third-party cycle. It
            can crash, run out of gas money, or be looking the wrong way when the window opens.
          </p>
        ),
        cost: (
          <p>
            A skipped week if it stops before the write. If it stops after the write but before the
            calls are listed or sold, the collateral stays locked until expiry and the week earns
            nothing. If it stops after a fill, only delay.
          </p>
        ),
        response: (
          <>
            <p>
              A stopped keeper cannot strand collateral past the week. Deposits close on the exercise
              timestamp without anyone calling anything. The keeper can close the week from expiry,
              and one hour after expiry anyone can: redeem the claim, settle the queue and return the
              vault to Idle.
            </p>
            <p>
              The Guardian cannot close a week; it can only halt writes and cancel or invalidate
              listings. A halt never blocks a redemption, a USDG claim or the close of a week.
            </p>
          </>
        ),
      },
      {
        id: "keeper-key",
        title: "Keeper key compromise",
        often: "Low, and bounded",
        impact: "upside",
        body: (
          <p>
            Assume the keeper key is stolen outright. The attacker can propose a strike, a size and an
            order, and can cancel listings. Every one of those goes through the vault, which is the
            Valorem writer and the Seaport seller, authorises each listing by hash on chain, and
            checks every field against the current policy (the strike band, the premium floor, the
            utilisation ceiling and the contract cap) and against the compiled <Num>21</Num>-day
            cycle limit and one-token lot size.
          </p>
        ),
        cost: (
          <p>
            Skipped weeks, or calls written and listed on the least favourable terms the policy
            allows (the lowest in-band strike, the largest size, a price at the premium floor) and
            filled by a buyer the attacker controls. That moves option value to the buyer. A fully
            compromised keeper still cannot take a token out of the vault, route premium to itself or
            step outside the policy.
          </p>
        ),
        response: (
          <p>
            No off-chain component can move money. At launch policy the worst terms are still strikes
            at least <Num>3%</Num> above spot and a gross premium of at least <Num>0.40%</Num> of spot
            notional per listing, and the admin can revoke the key.
          </p>
        ),
      },
      {
        id: "admin",
        title: "Admin judgment",
        often: "Bounded, not zero",
        impact: "upside",
        body: (
          <p>
            The vault admin sets policy inside compiled caps: the strike band, the premium floor, the
            utilisation ceiling, the protocol fee, the contract cap, the deposit cap, the price-age
            limit, the fee recipient, and whether to accept Valorem&apos;s engine fee. It can halt
            and unhalt writes and appoint the keeper and the Guardian. At launch the admin is a single
            deployer key, handed to a <Num>2-of-3</Num> Safe later. There is no timelock in{" "}
            <Num>v1</Num>.
          </p>
        ),
        cost: (
          <p>
            A band set too tight means weeks where no strike qualifies and the vault simply holds{" "}
            {MARKET}. A band set too loose means assignment becomes routine. An admin can also
            redirect up to <Num>20%</Num> of premium to an address it chooses, or loosen policy to
            the caps and run writes through a keeper it appoints, which moves option value rather
            than tokens. All of these are legal moves inside the caps.
          </p>
        ),
        response: (
          <p>
            The caps are enforced on chain, which rules out the worst version: nobody can sell calls
            closer than <Num>1%</Num> above spot, set the protocol fee above <Num>20%</Num> of
            premium, or take a fee from strike proceeds, and no admin function transfers
            depositors&apos; tokens or blocks exits. The caps do not rule out bad settings inside
            them, and the deposit cap and contract cap have no compiled ceiling. Every change is
            visible on chain as an event, and the deposit cap is the honest size of this trust.
          </p>
        ),
      },
    ],
  },
];

/* ------------------------------------------------------------------------------------------------
 * Page-local pieces that carry copy.
 * ---------------------------------------------------------------------------------------------- */

/** What still works during a Stock Token transfer freeze. */
function FreezeList() {
  const rows = [
    { what: "Queueing a redemption", works: true, why: `Only your ${SHARE_TICKER} moves, into the vault's escrow.` },
    { what: "Claiming USDG already credited to you", works: true, why: "It moves only USDG." },
    {
      what: "Depositing, instant redemption, completing a queued redemption",
      works: false,
      why: `Each moves ${MARKET}.`,
    },
    {
      what: "Writing a new call, or closing the week",
      works: false,
      why: `Each moves ${MARKET} into or out of Valorem.`,
    },
  ];
  return (
    <div className="mt-6 max-w-[44em]">
      <p className="text-[12.5px] font-bold uppercase leading-none tracking-[0.08em] text-ink-3">
        During an issuer freeze
      </p>
      <ul className="mt-3 overflow-hidden rounded-md border border-line">
        {rows.map((row) => (
          <li
            key={row.what}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 border-t border-line bg-surface px-4 py-3 first:border-t-0"
          >
            <span className="text-[15px]">
              <span className="block font-semibold text-ink">{row.what}</span>
              <span className="block text-[13.5px] text-ink-3">{row.why}</span>
            </span>
            <span
              className={
                row.works
                  ? "mt-0.5 inline-flex rounded-full bg-accent-soft px-2.5 py-1.5 text-[12.5px] font-semibold leading-none text-accent-text"
                  : "mt-0.5 inline-flex rounded-full bg-warn-soft px-2.5 py-1.5 text-[12.5px] font-semibold leading-none text-warn"
              }
            >
              {row.works ? "Works" : "Stops"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/** The dependencies in the path, with explorer links where there is a contract to check. */
function Dependencies() {
  const rows: { name: string; address?: string; text: ReactNode }[] = [
    {
      name: ADDRESSES.registry.label,
      address: ADDRESSES.registry.address,
      text: (
        <>
          Publishes each week&apos;s cycle, strikes and deadlines, from a single third-party key. The
          vault refuses a malformed cycle: longer than <Num>21</Num> days, a lot size other than one
          token, or options that do not match the cycle. That costs a skipped week. Strikes inside
          the vault&apos;s band are not second-guessed.
        </>
      ),
    },
    {
      name: "Overcall listings API",
      text: "Shows the vault's listing to buyers. It can reject or drop an order, and an invisible listing is an unfilled week. The app's cycle page then offers the keeper's signed order, checked against the chain, but buyers browsing Overcall will not see it.",
    },
    {
      name: ADDRESSES.clear.label,
      address: ADDRESSES.clear.address,
      text: "Holds the collateral, mints the options and settles assignment. Its engine fee, off today, can be switched on by a third party; the vault then stops writing until the admin accepts it.",
    },
    {
      name: ADDRESSES.seaport.label,
      address: ADDRESSES.seaport.address,
      text: "The listing and fill contract. Third-party code outside Stonkhouse's control.",
    },
    {
      name: ADDRESSES.priceFeed.label,
      address: ADDRESSES.priceFeed.address,
      text: "Read for display and to gate writes and listings only. Settlement never reads it. A stale or broken feed means a skipped week.",
    },
    {
      name: CHAIN_NAME,
      text: "A centralised sequencer with no uptime feed. An outage near the book close means no live listing when buyers are looking.",
    },
  ];
  return (
    <div className="mt-14 border-t border-line pt-9">
      <h3 id="dependencies" className="text-[21px] font-bold leading-[1.2] tracking-[-0.015em]">
        Who else is in the path
      </h3>
      <ul className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-2">
        {rows.map((row) => (
          <li key={row.name} className="grid content-start gap-1.5 rounded-md border border-line bg-surface p-4 sm:px-5">
            <p className="font-semibold text-ink">{row.name}</p>
            <p className="text-[14.5px] text-ink-2">{row.text}</p>
            {row.address ? (
              <ExternalLink
                href={addressUrl(row.address)}
                arrow
                className="link mt-1 w-fit rounded-sm text-[13px] text-ink-3 hover:text-ink"
              >
                <span className="num">{shortAddress(row.address)}</span> on the explorer
              </ExternalLink>
            ) : row.name === CHAIN_NAME ? (
              <p className="mt-1 text-[13px] text-ink-3">
                Chain <Num>{CHAIN_ID}</Num>
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------------------------------------
 * Page
 * ---------------------------------------------------------------------------------------------- */

export default function RisksPage() {
  return (
    <>
      {/* Page head: the lede and how to read the page on the left, the standing disclosures on the right. */}
      <Container className="grid grid-cols-1 items-start gap-9 pb-16 pt-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14 lg:pb-20 lg:pt-12">
        <div>
          <Eyebrow>Risks</Eyebrow>
          <h1 className="mt-3 text-[length:clamp(36px,4.8vw,56px)] font-extrabold leading-[1.04] tracking-[-0.03em]">
            Everything that can go wrong.
          </h1>
          <p className="mt-5 max-w-[34em] text-[19px] text-ink-2">
            The whole list, in the order you are likely to meet it. Most of these are not bugs and
            have no fix: they are the shape of writing covered calls against a tokenised security on
            a one-week clock, through contracts other people control.
          </p>
          <div className="mt-6 grid max-w-[36em] gap-3 text-ink-2">
            <p>
              The vault sells something once a week, and a sale can fail to happen, happen at a poor
              price, or happen and then be exercised against you. Every entry below says how often to
              expect it, what it costs you, and what the system does about it. Several say the system
              does nothing, because a vault cannot outvote an issuer or conjure a bidder.
            </p>
            <p className="text-[14.5px] text-ink-3">
              Nothing on this page is live. The figures are launch settings and limits compiled into
              the contracts, not readings from a running vault. The same list, with the contract
              detail, is in{" "}
              <ExternalLink href={DOCS_URL} className="link">
                the docs
              </ExternalLink>
              .
            </p>
          </div>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button variant="ghost" href="#at-a-glance">
              See the whole list
            </Button>
          </div>
        </div>

        <Panel as="aside" lift aria-labelledby="first-h" className="grid gap-5">
          <div className="flex items-start gap-3 rounded-md bg-danger/10 p-4">
            <WarnIcon size={18} className="mt-[3px] shrink-0 text-danger" />
            <div>
              <h2 id="first-h" className="text-[18px] font-bold leading-snug tracking-[-0.01em]">
                You can lose the collateral you deposit.
              </h2>
              <p className="mt-1.5 text-[14.5px] text-ink-2">
                The Stonkhouse contracts are not deployed and have not been audited, the token&apos;s
                issuer can freeze it, and a clearinghouse can take the collateral at the strike.
                Deposit accordingly.
              </p>
            </div>
          </div>

          <div>
            <p className="text-[12.5px] font-bold uppercase leading-none tracking-[0.08em] text-ink-3">
              Four sentences to keep
            </p>
            <ul className="mt-2">
              <li className="flex items-start gap-3 border-t border-line py-3 text-[15.5px] font-semibold leading-snug first:border-t-0">
                <WarnIcon className="mt-0.5 shrink-0 text-warn" />
                <span>Premium is paid only if a buyer fills.</span>
              </li>
              <li className="flex items-start gap-3 border-t border-line py-3 text-[15.5px] font-semibold leading-snug">
                <WarnIcon className="mt-0.5 shrink-0 text-warn" />
                <span>Assignment can take the collateral at the strike.</span>
              </li>
              <li className="flex items-start gap-3 border-t border-line py-3 text-[15.5px] font-semibold leading-snug">
                <WarnIcon className="mt-0.5 shrink-0 text-warn" />
                <span>Stock Tokens are debt securities, not Nvidia shares.</span>
              </li>
              <li className="flex items-start gap-3 border-t border-line pt-3 text-[15.5px] font-semibold leading-snug">
                <WarnIcon className="mt-0.5 shrink-0 text-warn" />
                <span>Stonkhouse is not available to US persons.</span>
              </li>
            </ul>
          </div>

          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Figure boxed size="sm" label="Deposit cap at launch" value="20" unit={MARKET} />
            <Figure boxed size="sm" label="Strike at launch" value="3–12%" unit="above spot" />
            <Figure boxed size="sm" mono={false} label="External audit" value="Not yet" />
          </dl>
        </Panel>
      </Container>

      <Section id="at-a-glance" labelledBy="at-a-glance-h">
        <SectionHead
          id="at-a-glance-h"
          eyebrow="At a glance"
          title="The whole list on one screen."
          intro="Each row links to its full entry. The grey line is how often to expect it; the chip is the worst it can cost you."
        />
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
          {GROUPS.map((group) => (
            <GlanceGroup key={group.id} group={group} />
          ))}
          <ImpactLegend />
        </div>
      </Section>

      {GROUPS.map((group) => (
        <Section key={group.id} id={group.id} labelledBy={`${group.id}-h`}>
          <SectionHead id={`${group.id}-h`} eyebrow={group.eyebrow} title={group.title} intro={group.intro} />
          <div>
            {group.risks.map((risk) => (
              <RiskEntry key={risk.id} risk={risk} />
            ))}
          </div>
          {group.id === "third-parties" ? <Dependencies /> : null}
        </Section>
      ))}

      <Section id="before-you-go" labelledBy="before-you-go-h">
        <SectionHead id="before-you-go-h" eyebrow="Before you go further" title="What this page is not." />
        <ul className="grid grid-cols-1 gap-x-14 lg:grid-cols-2">
          <li className="border-t border-line py-[22px]">
            <h3 className="text-[17.5px] font-bold tracking-[-0.01em]">Not an offer to US persons</h3>
            <p className="mt-1.5 text-[15px] text-ink-2">
              Stonkhouse is not available to US persons. Access is restricted by the Terms of Use, not
              by a technical control, and you are responsible for your own eligibility. The legal form
              of the collateral is set out on{" "}
              <Link href="/legal" className="link">
                the legal page
              </Link>
              .
            </p>
          </li>
          <li className="border-t border-line py-[22px]">
            <h3 className="text-[17.5px] font-bold tracking-[-0.01em]">Not advice</h3>
            <p className="mt-1.5 text-[15px] text-ink-2">
              Nothing here is investment, legal or tax advice, and nothing here is an offer of
              securities.
            </p>
          </li>
          <li className="border-t border-line py-[22px]">
            <h3 className="text-[17.5px] font-bold tracking-[-0.01em]">Not live</h3>
            <p className="mt-1.5 text-[15px] text-ink-2">
              Nothing on this page reads the chain. The vault is not deployed, and the figures are
              launch settings and compiled limits, not measurements.
            </p>
          </li>
          <li className="border-t border-line py-[22px]">
            <h3 className="text-[17.5px] font-bold tracking-[-0.01em]">Not a forecast</h3>
            <p className="mt-1.5 text-[15px] text-ink-2">
              Past weeks describe what already happened and say nothing about the next one. Every
              result, the empty weeks included, is published as it closes.
            </p>
          </li>
        </ul>
      </Section>

      <Container>
        <div className="mb-[72px] mt-4 flex flex-wrap items-center justify-between gap-7 rounded-[28px] bg-ink px-[22px] py-[30px] text-ground sm:p-12 [&_:focus-visible]:outline-ground">
          <div>
            <h2 className="max-w-[18em] text-[length:clamp(28px,3.4vw,40px)] font-extrabold leading-[1.08] tracking-[-0.03em] text-ground">
              The bad weeks will be published too.
            </h2>
            <p className="mt-2.5 max-w-[34em] text-ground/75">
              Once the vault is live, every closed week is published with its real figures, unfilled
              and assigned weeks included. Until then, walk through a single week, step by step.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button href={appUrl("/activity")}>Read the weekly results</Button>
            <Button variant="inverse" href="/how-it-works">
              How a week runs
            </Button>
          </div>
        </div>
      </Container>
    </>
  );
}
