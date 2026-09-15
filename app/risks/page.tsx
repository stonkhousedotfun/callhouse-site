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
 * Sources, in order of authority: the contracts (leekzor/callhouse-contracts at the 2026-09-13
 * redesign: src/Vault.sol, src/lib/ValoremLib.sol, src/lib/SeaportOrderLib.sol, src/Policy.sol,
 * SECURITY.md §0-§4, docs/ACCOUNTING.md), the 2026-09-14 audit findings (L-01 in-fill deposits,
 * I-01 the admin's Valorem fee lever with our own Clear), the keeper as ported
 * (leekzor/callhouse keeper/README.md, keeper/src/policy.ts fillVerdict), the integration dossiers
 * (projects/callhouse/integrations/INDEX.md §2, usdg.md, robinhood-chain.md, valorem.md), then the
 * GitBook docs, then the previous version of this page. Where this page and those disagree, this
 * page is the one that is wrong. Worked figures come from the keeper's fork rehearsal
 * (keeper/run-final/report.md) or from cycle 1's live listing, and are labelled as such where they
 * appear.
 *
 * ACCURACY PASS 2026-09-15, against the live deployment on 4663 (vault 0x88a98931…ecbb, our Clear
 * 0x53d7A6d0…C6): policy() = (300, 1200, 10, 9500, 500, 50), so the premium floor is 0.10% of spot
 * (MIN_PREMIUM_FLOOR_BPS is also 10); maxPriceAge() 345600; depositCap() 20e18; feeRecipient() and
 * DEFAULT_ADMIN_ROLE are the hot EOA 0xEb82…9d9b (no timelock, Safe handover not done); the Clear's
 * feeTo() is the 1-of-1 Safe 0xff14…CF61 (owner 0x7A3a…2C32), NOT the admin key; feesEnabled()
 * false, feeBps 15. Keeper pricing is vol mode (keeper/src/vol.ts): strike at delta about 0.15 from
 * Cboe's delayed NVDA chain, clamped to [minOtm + 200 bps, maxOtm - 50 bps], i.e. 5% to 11.5% today.
 * The Clear is not source-verified; its runtime equals Valorem 6436c823 (last upstream commit,
 * 2023-11-13) except the CBOR metadata hash. The 2026-09-14 review: no C/H/M, L-01 fixed, one
 * Informational (I-02 was withdrawn), per SECURITY.md "The 2026-09-14 review".
 *
 * The rally threshold quoted in "A fill refused after a rally" is derived, not observed: with cycle
 * 1's listing (listingGrossUsdg 856436 for listingAmount 1, cycleStrikeUsdg 223000000) and
 * minOtmBps 300, Policy.strikeBand(spot).lo > 223000000 once spot6 > 216504854 (Policy.sol:152). At
 * minPremiumBps 10 that listing's price clears the premium floor until spot6 856436000, so on it the
 * band binds first. Both are re-checked at every fill (ValoremLib.sol:216-231). The keeper-key and
 * admin estimates are the SECURITY.md §3 method (a 7-day call's Black-Scholes value at 50% IV, less
 * the premium floor): 3% OTM is 1.555% of spot, less 0.10% = about 1.45%; 1% OTM is 2.30%, less
 * 0.10% = about 2.2%.
 *
 * DELIBERATELY ABSENT:
 *   - Any number that is not a policy setting (given as the current value, which the admin can
 *     change), a compiled limit, a figure the contracts' own threat model states, or a labelled
 *     example. No fetch and no chain read: this page is static, so a live reading would go stale on
 *     it. Live figures belong on app.stonkhouse.fun.
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

import { Button, Chip, Container, Eyebrow, ExternalLink, Figure, Num, Panel, Section, SectionHead, WarnIcon } from "@/components/ui";
import { WEEK } from "@/lib/clock";
import { SECURITY_CONTACT_EMAIL } from "@/lib/legal";
import { ADDRESSES, CHAIN_ID, CHAIN_NAME, DOCS_URL, MARKET, SHARE_TICKER, STATUS, addressUrl, appUrl } from "@/lib/site";

import { GlanceGroup, ImpactLegend, RiskEntry, type RiskGroup } from "./_components/risk-ui";

const DESCRIPTION =
  "Every way a week here pays nothing, or costs you the collateral: no buyer, a fill refused after a rally, assignment, a claim stranded at the close, issuer freeze, contracts with no external audit, a keeper that can stop.";

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
      "A vault that sells one thing a week can fail to sell it, be refused the sale by its own price checks, or sell it and have it exercised.",
    risks: [
      {
        id: "no-buyer",
        title: "No buyer: a week that pays zero",
        often: "Most weeks",
        impact: "premium",
        body: (
          <>
            <p>
              Premium is paid only if a buyer fills. The vault&apos;s order for the week&apos;s calls
              is served only on the app&apos;s cycle page, and any Seaport 1.6 client can fill the
              same order from what that page serves. If nobody buys before the book closes at{" "}
              <Num>{WEEK.close}</Num> — or Thursday when NYSE is shut that Friday; the call&apos;s own
              exercise time is what counts — the week&apos;s premium is zero. Calls are written only
              when bought, so nothing was written.
            </p>
            <p>
              This is the most likely outcome on a thin book, and the book for weekly calls on a
              tokenised stock is thin. The listing is not shown on any third-party venue or order
              book: a buyer has to come to it.
            </p>
          </>
        ),
        cost: (
          <p>
            The week&apos;s premium, which is zero, and the time. The protocol fee is a share of
            premium, so an unfilled week pays no fee either. Nothing was written, so an unfilled week
            has nothing that can be assigned.
          </p>
        ),
        response: (
          <>
            <p>
              Publishes it. An empty book is a market fact, not an error, so the week appears in the
              results with premium <Num>0</Num>, marked unfilled, next to the weeks that filled.
            </p>
            <p>
              The keeper serves the order to the app&apos;s cycle page, which checks it against the
              chain and simulates each fill before it offers the button. A buyer who does not use that
              page, and does not build the fill in another Seaport client from the order it serves,
              will not see the listing at all.
            </p>
          </>
        ),
      },
      {
        id: "refused-fill",
        title: "A fill refused after a rally",
        often: `Any week ${MARKET} rises`,
        impact: "premium",
        body: (
          <>
            <p>
              The vault re-checks its premium floor and the lower bound of its strike band at the spot
              of every fill, not at the spot the listing was priced on. If {MARKET} rises and the listed
              price falls under the floor, the fill reverts; the keeper then cancels and relists at a
              price that clears the new floor, on the same strike, and each listing spends one of the
              vault&apos;s three a week. If {MARKET} rises until the strike is less than{" "}
              <Num>3%</Num> above spot (the band&apos;s lower bound under the current policy), no price
              fixes that: nothing more can be sold that week.
            </p>
            <p>
              On cycle <Num>1</Num>&apos;s listing (strike <Num>223</Num> USDG, <Num>0.856436</Num> USDG
              a call, listed with spot near <Num>213.04</Num>), fills are refused at any price once spot
              passes about <Num>216.50</Num>. At the current premium floor of <Num>0.10%</Num> of spot,
              that listing&apos;s price is not what binds.
            </p>
          </>
        ),
        cost: (
          <p>
            Premium on the calls that did not sell. A buyer who tries between the rally and the reprice
            gets a reverted transaction; the app&apos;s cycle page simulates the fill first, but a buyer
            using another client may pay gas for the revert.
          </p>
        ),
        response: (
          <p>
            The refusal is the protection: it stops a buyer taking a near-the-money call at an
            out-of-the-money price from a quote that has gone stale. The keeper mirrors the check on
            every tick and reprices, up to the vault&apos;s three listings a week. After that, or once
            the strike is below the band, the week sells nothing more. Calls already sold stay sold.
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
            Anyone holding a call of the week&apos;s option type may exercise it inside the exercise
            window (<Num>{WEEK.window}</Num>), and Valorem can assign that
            exercise to the vault whether or not that particular call was bought from the vault, up to
            the number the vault sold. Valorem takes the collateral at the strike and leaves the strike
            proceeds in USDG, credited to depositors in full: the protocol fee is charged on premium,
            never on strike proceeds. The keeper picks the strike where Cboe&apos;s free delayed{" "}
            {MARKET} option quotes put the call&apos;s delta at about <Num>0.15</Num>, kept between{" "}
            <Num>5%</Num> and <Num>11.5%</Num> above spot under the current policy, and the vault
            refuses to arm a strike outside <Num>3%</Num> to <Num>12%</Num> above spot. It takes a
            move, but not an enormous one.
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
              Nothing buys the token back. The contracts have no function for it, and an automated
              market buy would be a risk of its own.
            </p>
            <p>
              The vault does defend the accounting around assignment. Deposits close at the
              call&apos;s exercise time, whether or not the keeper is running, and stay closed while
              assignment proceeds wait unredeemed, so nobody can mint shares into a position whose
              collateral has already left.
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
            Anyone can write the same Valorem call as the vault, and Valorem spreads each exercise across
            the writers of that call, bucket by bucket, not according to who sold the exercised call.
            The vault can be assigned on some of the contracts it wrote and not on others, so an
            exercised week usually ends as a mixture rather than a clean swap.
          </p>
        ),
        cost: (
          <p>
            Predictability. A redemption from an open week is never a promise of a fixed number of
            tokens: part of what comes back can be USDG at the strike, and the split is not known until
            the week closes.
          </p>
        ),
        response: (
          <p>
            It bounds it, and no more. Because the vault writes only inside the fill that sells, every
            contract it can be assigned on earned a premium, and someone who writes the same call and
            exercises it can assign the vault at most what the vault sold. Which of those contracts get
            assigned is the clearinghouse&apos;s decision. The vault pools the result: every depositor
            gets the same blend, and nobody is singled out for the assigned part.
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
        often: "Any deposit while a week is listed",
        impact: "upside",
        body: (
          <p>
            Deposits stay open while a week is listed, until the exercise time. A deposit then is priced
            at face value: the share price counts the {MARKET} locked behind calls already sold and does
            not subtract what they could cost. The new shares buy into the open short and share that
            week&apos;s result, including any assignment, and later fills that week can write calls
            against the {MARKET} just deposited.
          </p>
        ),
        cost: (
          <p>
            If {MARKET} is above the strike when you deposit, you pay full price for shares whose
            collateral may leave at the strike, and your shares take their pro rata part of that loss.
            Deposits made while the vault is Idle are not exposed this way.
          </p>
        ),
        response: (
          <p>
            Deposits close at the exercise time without anyone calling anything, and stay closed while
            assignment proceeds wait unredeemed. A deposit made after a fill in the same transaction is
            refused, so nobody can take part of the premium of the fill that is paying for their shares.
            Deposits reopen when the week closes and the vault is Idle again.
          </p>
        ),
      },
      {
        id: "withdrawals-queue",
        title: "Withdrawals wait for the close",
        often: "Every listed week",
        impact: "exit",
        body: (
          <p>
            A withdrawal settles instantly only while the vault is Idle with nothing written. From the
            moment a week is listed, a withdrawal is queued and completes after the week closes, not
            before: the collateral of calls sold is locked in Valorem until expiry, and a fill can write
            against the rest at any moment. A queued redemption cannot be cancelled.
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
            jump the queue or stop it, the close is open to anyone an hour after expiry, and while the
            vault is Idle anyone can settle the queue. A settled withdrawal is paid its {MARKET} whatever
            USDG is doing; only its USDG can wait. A Stock Token issuer freeze of the vault can still
            hold up the {MARKET} payout until it lifts.
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
            This one has no token to pay with. Depositors keep the premium left after the protocol
            fee (<Num>5%</Num> today; the admin can set it anywhere up to <Num>20%</Num>), and that is
            the entire return path.
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
        title: "Issuer freeze, burn or oracle pause",
        often: "Rare, and unmitigable",
        impact: "total",
        body: (
          <>
            <p>
              Stock Tokens are debt securities issued by Robinhood Assets (Jersey) Limited. They are
              not shares: no vote, no claim on Nvidia, and issuer credit risk on that entity. The
              issuer can freeze or restrict transfers, blocklist the vault, burn tokens from any
              holder including the vault, and upgrade the token contract, each from a single key with
              no timelock. The token can also pause its own price oracle, and the issuer can end the
              series on <Num>30</Num> days&apos; notice, after which the tokens can be redeemed only
              with identity checks a vault cannot pass.
            </p>
            <p>
              The events are different. A freeze stops anything that moves the token, including selling
              a call, an {MARKET} payout and the {MARKET} leg of the close. An oracle pause stops the
              vault arming, listing and selling calls, and nothing else: settlement never reads the
              oracle, so an open week still closes. A burn takes {MARKET} out of the vault outright.
            </p>
          </>
        ),
        extra: <FreezeList />,
        cost: (
          <>
            <p>
              In the mild case, weeks of nothing: no new calls under either a freeze or an oracle pause,
              and under a freeze an open week whose claim is stranded at the close and redemptions that
              cannot pay out tokens until it lifts.
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
          <>
            <p>
              There is no technical mitigation, and pretending otherwise would be the dishonest part:
              that is the asset. What the contracts ensure is that a freeze never traps you
              procedurally (queueing a redemption, settling the queue and claiming credited USDG keep
              working, and the close strands the claim rather than locking the vault), and the vault
              refuses to sell against a paused oracle rather than selling blind.
            </p>
            <p>
              After a burn, the share price shows the loss at once, deposits close while settled
              withdrawals are unbacked, and every uncollected withdrawal is paid the same fraction of
              what it was owed rather than first come, first served.
            </p>
          </>
        ),
      },
      {
        id: "usdg",
        title: "USDG, the stablecoin you are paid in",
        often: "Rare, and outside our control",
        impact: "total",
        body: (
          <p>
            Premium and strike proceeds are paid in USDG, a third-party stablecoin issued by Paxos, so
            you carry whatever risk USDG carries. One Paxos key, with no delay, can pause USDG, freeze
            any address, wipe the balance of a frozen address, and in two transactions burn USDG from
            any address that is not frozen. The same key proposes and executes upgrades to the token
            behind a <Num>24-hour</Num> timelock that Stonkhouse does not control. It has frozen
            addresses on this chain and, so far, has never unfrozen one.
          </p>
        ),
        cost: (
          <p>
            A pause or a freeze stops USDG claims and USDG payouts until it is resolved, and a wipe or a
            burn would take the USDG the vault holds, premium and strike proceeds not yet claimed
            included. An assigned week&apos;s strike USDG sits in Valorem until the close. If USDG is
            paused, or the vault or Valorem is frozen on USDG, when such a week closes, the claim is
            stranded: see the next entry.
          </p>
        ),
        response: (
          <p>
            The vault makes sure a USDG event never traps the {MARKET}. The close completes and strands
            the claim rather than reverting, a settled withdrawal is paid its {MARKET} whatever USDG is
            doing and its USDG later, and the protocol fee is paid on a best-effort basis so it can never
            block anything. What USDG takes, the vault cannot get back.
          </p>
        ),
      },
      {
        id: "stranded",
        title: "A claim stranded at the close",
        often: "Rare, and outside our control",
        impact: "total",
        body: (
          <p>
            Closing a week asks Valorem to hand back the vault&apos;s claim: the unassigned {MARKET} and
            the strike USDG, in one call. Either token&apos;s issuer can make that call fail. In a week
            where any of the vault&apos;s calls were exercised: USDG paused, the vault or Valorem frozen
            on USDG, or Valorem&apos;s USDG burnt. In a week that was not fully assigned: the vault
            blocklisted on the Stock Token. When it fails, the week
            still closes and the vault returns to Idle with the claim kept. The claim is stranded.
          </p>
        ),
        cost: (
          <p>
            Time, and your exit. While a claim is stranded, deposits and instant withdrawals are shut and
            the next week cannot start. Queued withdrawals settle their share of the idle {MARKET} and
            USDG straight away, and their share of the claim is paid only when the claim is redeemed,
            which is whenever the issuer lets it through, and possibly never.
          </p>
        ),
        response: (
          <p>
            Anyone can call the retry at any time, and the keeper tries every hour; the first attempt
            Valorem lets through redeems the claim and pays everyone&apos;s share of it. A close starved
            of gas cannot fake a strand. In the fork rehearsal a USDG freeze of the vault stranded week{" "}
            <Num>3</Num>; after the unfreeze the retry returned <Num>1</Num> {MARKET} and{" "}
            <Num>239</Num> USDG, and the next week armed normally.
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
      "Contracts and services in the path belong to somebody else, or run on one key, and none of them can be overridden from here. Most of their failures end in a skipped or unsold week, which is the safe direction.",
    risks: [
      {
        id: "valorem-fee",
        title: "Valorem engine fee switch",
        often: "One key away",
        impact: "nvda-fee",
        body: (
          <p>
            Valorem Clear can charge <Num>15 bps</Num> of written notional, paid in {MARKET} from the
            vault&apos;s balance on top of the collateral each time a fill writes calls. It is off
            today. The vault settles on its own instance of Valorem Clear, whose fee switch is held by
            a Safe with a single owner and a threshold of one, not by the vault admin; the vault
            refuses to sell through the fee until the vault admin separately accepts it. On a weekly
            out-of-the-money call that is not small change: the premium floor is currently{" "}
            <Num>0.10%</Num> of spot, so <Num>15 bps</Num> of notional is one and a half times a
            listing priced at the floor.
          </p>
        ),
        cost: (
          <p>
            If the fee is switched on and accepted, every fill takes <Num>15 bps</Num> of the {MARKET} it
            writes from the vault, and the vault raises that fill&apos;s premium floor by the fee&apos;s
            value at spot. Buyers cover the fee only when the ask is set by that floor; when the ask comes
            from option quotes above it, depositors bear the fee. Either way it is a standing cost on
            every sale. An exerciser would also pay{" "}
            <Num>15 bps</Num> of the strike into the Clear&apos;s fee balance, which the fee Safe can
            sweep, whether or not the vault accepted the fee. While the fee is on and not accepted,
            nothing sells.
          </p>
        ),
        response: (
          <p>
            The vault refuses to sell through a fee nobody accepted: arming and every fill revert until
            the admin accepts it, recorded on chain as an event. The fee switch sits on the
            one-owner Safe and the acceptance on the admin&apos;s single key, and neither has a delay;
            the acceptance is part of the admin risk below.
          </p>
        ),
      },
      {
        id: "outages",
        title: "Sequencer, price feed or keeper down",
        often: "Occasional",
        impact: "premium",
        body: (
          <>
            <p>
              {CHAIN_NAME} runs a single Robinhood sequencer and has no uptime feed for the vault to
              read, so the vault cannot tell that an outage happened: afterwards it arms and sells on
              the last price the feed posted, as long as that price is inside its price-age limit. The sequencer also screens transactions, and one that touches a
              restricted address is dropped; if the vault itself were restricted, nothing could reach
              it. Forcing a transaction in through Ethereum takes <Num>4 days</Num>, and may not escape the
              screening either. The {MARKET}{" "}
              price feed updates through the week, overnight included, and stops from the Friday close to
              Sunday evening New York time and over US market holidays; a gap longer than
              the vault&apos;s price-age limit (<Num>4 days</Num> today; the admin can set it from{" "}
              <Num>1 hour</Num> to <Num>7 days</Num>) blocks arming and selling until the feed
              updates.
            </p>
            <p>
              The keeper prices each week from Cboe&apos;s free delayed {MARKET} option quotes. If those
              are missing, stale or inconsistent when the week is due to arm, the keeper skips the week
              rather than guess a price.
            </p>
            <p>
              The listing&apos;s details are served by the keeper to the app&apos;s cycle page. If either
              is down in the hours before the close, buyers have no page to fill from.
            </p>
          </>
        ),
        cost: (
          <p>
            The week&apos;s premium: the same outcome as no buyer, arrived at for an operational reason
            instead of a market one. Calls already sold stay sold, and assignable, until expiry.
          </p>
        ),
        response: (
          <p>
            The vault refuses to arm, list or sell against a price older than its limit or a paused
            oracle, so a feed gap longer than that before the arm is a skipped week, and one after it
            leaves the listing unfillable until the feed updates. Nothing is written without a buyer, so an unfillable listing costs no collateral.
            The close, the queue and a stranded-claim retry are open to anyone, so an outage of the
            keeper delays them but no key is needed to finish them.
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
                The Stonkhouse contracts are live and have had no external audit.
              </strong>{" "}
              What stands behind them is a test suite and internal reviews by the team that built
              them. An internal adversarial review on{" "}
              <Num>2026-09-12</Num> raised <Num>72</Num> findings across <Num>13</Num> surfaces, of
              which <Num>51</Num> survived refutation; the contract defects recorded as fixed carry
              regression tests, and the project&apos;s records do not say every surviving finding was
              fixed. An internal audit on <Num>2026-09-13</Num> found five more, the first of them High:
              the vault then wrote calls before selling them, and anyone could take the value of the
              unsold calls in an in-the-money week. The vault was redesigned to write only inside a
              fill. An internal review of the redesign on <Num>2026-09-14</Num> reported no Critical,
              High or Medium finding, one Low that has been fixed, and one informational note.
            </p>
            <p>
              The vault and its two libraries have their source verified on Sourcify as a partial
              match, which means the compiled code matches but the metadata hash does not. The
              vault&apos;s Valorem Clear is not source-verified on any explorer yet; its deployed
              bytecode is identical to Valorem&apos;s published code except for that metadata hash.
            </p>
            <p>
              None of these is an audit, and none substitutes for one. Valorem Clear&apos;s code was
              audited by Zellic in <Num>2022–2023</Num> under its former name, OptionSettlementEngine;
              the vault&apos;s own instance is deployed from that unmodified code, and the audit covers
              Valorem, not this vault. Valorem&apos;s code has had no commit since <Num>2023</Num>, so
              there is no patch path behind it. Seaport, USDG and the Stock Token are third-party code
              outside anyone&apos;s control here.
            </p>
          </>
        ),
        cost: <p>In the worst case, everything deposited.</p>,
        response: (
          <p>
            The deposit cap is the real statement of confidence: <Num>20 {MARKET}</Num> today, not an
            open door. The admin sets it and can change it at any time; it has no compiled ceiling.
            There is no proxy and no upgrade key, so a bug means a new vault and a migration, not a
            silent patch. No external audit has been completed. One is pending. There is no bug bounty;
            report a vulnerability to{" "}
            {SECURITY_CONTACT_EMAIL ? (
              <a className="link" href={`mailto:${SECURITY_CONTACT_EMAIL}`}>
                {SECURITY_CONTACT_EMAIL}
              </a>
            ) : (
              <Link href="/legal#reporting" className="link">
                the address on the legal page
              </Link>
            )}
            .
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
            The keeper is one hot key running a weekly state machine. It can crash, run out of gas
            money, or be looking the wrong way when the week should open.
          </p>
        ),
        cost: (
          <p>
            A skipped week if it stops before the arm or the listing. If it stops after listing, the
            app&apos;s cycle page has no order to serve and a rally leaves nobody to reprice, so the week
            most likely sells nothing more; the collateral of calls already sold stays locked until
            expiry. If it stops after the last fill, only delay.
          </p>
        ),
        response: (
          <>
            <p>
              A stopped keeper cannot strand collateral past the week. Deposits close on the exercise
              time without anyone calling anything. The keeper can close the week from expiry, and one
              hour after expiry anyone can: redeem the claim, settle the queue and return the vault to
              Idle. Anyone can also settle an Idle queue and retry a stranded claim.
            </p>
            <p>
              The Guardian has no early close: like anyone else, it can close a week from one hour after
              expiry. What its role adds is halting arming, listings and fills (which the admin can also
              do), and cancelling or invalidating listings. A halt never blocks a deposit, a redemption,
              a USDG claim or the close of a week.
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
            Assume the keeper key is stolen outright. The attacker can create and arm a call, propose an
            order, and cancel listings. Every one of those goes through the vault, which checks the call
            it arms against the strike band, the one-token lot and the compiled window limits (exercise
            at least an hour away, everything over within <Num>21</Num> days), authorises each listing
            by hash on chain, and checks every field against the current policy: the premium floor, the
            utilisation ceiling and the contract cap.
          </p>
        ),
        cost: (
          <p>
            Skipped weeks, or calls armed and listed on the least favourable terms the policy allows
            (the lowest in-band strike, the largest size, a price at the premium floor) and bought by a
            buyer the attacker controls. That moves option value to the buyer: about{" "}
            <Num>1.45%</Num> of the notional sold per week at the current policy and <Num>50%</Num>{" "}
            implied volatility, by the method of the contracts&apos; own threat model, and more in a
            volatile week. A fully
            compromised keeper still cannot take a token out of the vault, route premium to itself or
            step outside the policy.
          </p>
        ),
        response: (
          <p>
            No off-chain component can move money. At the current policy the worst terms are still
            strikes at least <Num>3%</Num> above spot and a gross premium of at least{" "}
            <Num>0.10%</Num> of spot notional, checked again at every fill, and the admin can revoke
            the key.
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
            limit, the fee recipient, and whether to accept Valorem&apos;s engine fee (the switch that
            turns that fee on is held by the Clear&apos;s one-owner fee Safe, not by the admin). It
            can halt and unhalt writes and appoint the keeper and the Guardian. Today the admin is a
            single hot key, the deployer&apos;s own address, and the protocol fee is paid to that same
            address. There is no timelock and no delay. A handover of the admin role to a Safe is
            planned and has not happened.
          </p>
        ),
        cost: (
          <p>
            A band set too tight means weeks where no strike qualifies and the vault simply holds{" "}
            {MARKET}. A band set too loose means assignment becomes routine. An admin can also redirect
            up to <Num>20%</Num> of premium to an address it chooses; loosen policy to the caps and sell
            through a keeper it appoints to a buyer it controls, about <Num>2.2%</Num> of the notional
            sold per week by the contracts&apos; own estimate; or, once the fee Safe switches
            Valorem&apos;s fee on, accept it: a standing <Num>15 bps</Num> of {MARKET} on every call
            sold, which buyers cover only when the ask is set by the premium floor. All of these are legal moves inside the caps, and they
            move value rather than tokens. Every change takes effect at once, in the middle of a week
            too: the protocol fee is taken at the rate in force when premium is credited to holders,
            which happens at the next deposit or at the close.
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

type Verdict = "works" | "partly" | "stops";

const VERDICT: Record<Verdict, { label: string; chip: string }> = {
  works: {
    label: "Works",
    chip: "bg-accent-soft text-accent-text",
  },
  partly: {
    label: "Strands",
    chip: "bg-warn-soft text-warn",
  },
  stops: {
    label: "Stops",
    chip: "bg-warn-soft text-warn",
  },
};

/** What still works during a Stock Token transfer freeze of the vault. */
function FreezeList() {
  const rows: { what: string; verdict: Verdict; why: string }[] = [
    { what: "Queueing a redemption", verdict: "works", why: `Only your ${SHARE_TICKER} moves, into the vault's escrow.` },
    { what: "Settling the queue while the vault is Idle", verdict: "works", why: "It moves no token." },
    { what: "Claiming USDG already credited to you", verdict: "works", why: "It moves only USDG." },
    {
      what: "Closing the week",
      verdict: "partly",
      why: `It completes, but a claim with ${MARKET} to hand back is stranded until the freeze lifts. Anyone can retry.`,
    },
    {
      what: "Depositing, instant redemption, completing a queued redemption",
      verdict: "stops",
      why: `Each moves ${MARKET}.`,
    },
    {
      what: "Selling a call",
      verdict: "stops",
      why: `Each fill moves ${MARKET} into Valorem.`,
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
              className={`mt-0.5 inline-flex rounded-full px-2.5 py-1.5 text-[12.5px] font-semibold leading-none ${VERDICT[row.verdict].chip}`}
            >
              {VERDICT[row.verdict].label}
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

/** The dependencies in the path, with explorer links where there is a live contract to check. */
function Dependencies() {
  const rows: { name: string; address?: string | null; text: ReactNode }[] = [
    {
      name: ADDRESSES.clear.label,
      address: ADDRESSES.clear.address,
      text: "Deployed with the vault from Valorem's unmodified code, and not yet source-verified on an explorer: its bytecode matches Valorem's published code except the metadata hash. Holds the collateral of calls sold, mints each call inside the fill that buys it and settles assignment. Its engine fee is off, and its switch is held by a one-owner Safe; the vault refuses to sell through that fee until the vault admin also accepts it.",
    },
    {
      name: ADDRESSES.seaport.label,
      address: ADDRESSES.seaport.address,
      text: "Settles every fill and asks the vault before it moves anything. Third-party code outside Stonkhouse's control.",
    },
    {
      name: "The keeper and the app's cycle page",
      text: "Create the week's call, price the listing from Cboe's free delayed NVDA option quotes and serve it to buyers. If either is down, or the quotes are unusable, the week most likely sells nothing, but nothing is written without a buyer and the close does not need them.",
    },
    {
      name: ADDRESSES.priceFeed.label,
      address: ADDRESSES.priceFeed.address,
      text: "Read for display and for the floors checked when a week is armed and a call is sold. Settlement never reads it. A stale or broken feed means a skipped or unsold week.",
    },
    {
      name: CHAIN_NAME,
      text: "A single Robinhood sequencer with no uptime feed, which screens transactions against a restricted list. An outage near the book close means no fills when buyers are looking; forcing a transaction in takes 4 days.",
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
          <div className="flex flex-wrap gap-2">
            <Chip tone="accent" dot>
              {STATUS.phase}
            </Chip>
            <Chip tone="warn">{STATUS.audit}</Chip>
          </div>
          <Eyebrow className="mt-5">Risks</Eyebrow>
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
              Nothing on this page reads the chain. The figures are the vault&apos;s current settings,
              which the admin can change, and limits compiled into the contracts, not live readings.
              The same list, with the contract detail, is in{" "}
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
                The Stonkhouse contracts have had no external audit, the token&apos;s issuer can freeze
                or burn it, and a clearinghouse can take the collateral at the strike. Deposit
                accordingly.
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
            <Figure boxed size="sm" label="Deposit cap today" value="20" unit={MARKET} />
            <Figure boxed size="sm" label="Strike band today" value="3–12%" unit="above spot" />
            <Figure boxed size="sm" mono={false} label="External audit" value={STATUS.audit} />
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
            <h3 className="text-[17.5px] font-bold tracking-[-0.01em]">Not a live reading</h3>
            <p className="mt-1.5 text-[15px] text-ink-2">
              Nothing on this page reads the chain. The figures are current settings and compiled
              limits, not measurements; the vault&apos;s live figures are on app.stonkhouse.fun.
            </p>
          </li>
          <li className="border-t border-line py-[22px]">
            <h3 className="text-[17.5px] font-bold tracking-[-0.01em]">Not a forecast</h3>
            <p className="mt-1.5 text-[15px] text-ink-2">
              Past weeks describe what already happened and say nothing about the next one. Every
              week the vault arms is published on the app, unfilled weeks included; a week the keeper
              skips leaves no record.
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
              Every closed week is published on the app with its real figures, unfilled and assigned
              weeks included. To see how one week runs, walk through it step by step.
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
