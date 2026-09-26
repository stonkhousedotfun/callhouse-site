/**
 * FAQ: withdrawal times for every vault,
 * and how an option is settled.
 *
 * EVERY STATEMENT IS WRITTEN FROM THE CONTRACTS, not from product copy. Sources, all in
 * callhouse-contracts, at the source these answers were written from (re-read them when the
 * contracts change):
 *
 *   House vault      src/v2/periphery/house/HouseVault.sol
 *     kind fixed at deploy, weekly or daily ........... :55-57, :191-196 (`bool public immutable weekly`)
 *     boundary = calendar.nextExpiry(now, weekly) ...... :374, :708
 *     queue now, priced at the boundary ................ :77-78
 *     deposit and withdraw requests AND their cancels close at
 *     epochEnd - SETTLEMENT_WINDOW (1800 s), refused until the roll
 *     (PastCutoff, _requireBeforeCutoff; the Earliest and Daily answers
 *     cite it too)
 *     ................................................. :1116-1124; calls :528, :567, :588, :607
 *     one open request until claimed (TooEarly) ........ :396, :441
 *     boundary needs a Finalized price, anyone rolls ... :557, :567-572
 *     paid in kind, pro rata, after the fee ............ :495-496, :614, :634-635
 *     performance fee at the boundary, ceiling 20% ..... :175, :592-608
 *   Earn vault       src/v2/periphery/earn/EarnVault.sol
 *     instant redeem when cash covers it ............... :456-461
 *     otherwise queued, never refused .................. :465, interface IEarnVault :10-16
 *     queue is first in, first out; anyone processes ... :472, :582-593
 *     open option position -> redemptions queue ........ :446-447, :479-480
 *     priced when served, not when requested ........... :81-83
 *     cancel a queued request (owner only) ............. :605-628
 *     no venue at deploy; venue is an ERC-4626 ......... :255-258; adapters/Erc4626VenueAdapter.sol:13-16
 *       (Steakhouse USDG on Morpho Blue)
 *     skim on realised gain only, ceiling 10% .......... :73-74, :161, :649-662
 *   Calendar         src/v2/ExpiryCalendar.sol
 *     16:00 New York, daily / weekly definitions ....... :11-12, :68-69, :259-271
 *     holidays are admin data; early closes are
 *     ordinary session days ............................ :22-26, :85
 *   Settlement       src/v2/oracle/SettlementOracle.sol, src/v2/interfaces/V2Constants.sol
 *     30-minute average, 2-minute finalize delay,
 *     48-hour admin resolve ............................ V2Constants.sol:44, :46, :50
 *     corroborated = two ok sources agree .............. SettlementOracle.sol:76, :795-826, :748-751
 *     uncorroborated: delay (default 6 h, 30 min-24 h)
 *     and guardian veto ................................ :91, :137, :212-214, :493-514, :756-771
 *     admin resolve: bounded by recorded ok prices,
 *     UNBOUNDED when no source was ok .................. :522-533, :853-856
 *     v9: that unbounded resolve only once the
 *     expiry is Held and from expiry + 7 days; a Held expiry
 *     with ok prices widens to x1.25 after 7 days ....... callhouse-contracts v9
 *                                                          SettlementOracle.sol:121-142, :279-282, :681-682
 *   Payout           src/v2/Clearinghouse.sol
 *     cash value from the collateral, no assignment .... :48-51
 *     puts pay USDG, calls pay the stock token ......... :31-32, :1087, :1219-1220
 *     call payout converted to USDG unless in kind,
 *     slippage floor, falls back to in kind ............ :126, :581, :1098-1119, :1185-1189
 *     anyone can settle and redeem; holder opt-out ..... :29, :597-599, :718-727
 *     no new contracts in the last 30 minutes .......... :632, :947-948
 *
 * NVDA and SPCX are each priced from two sources (a Chainlink feed and a Uniswap v3 pool), which is what makes
 * the corroborated path available to them: script/v2/RegisterMarkets.s.sol:919-921 registers both sources
 * whenever a market has a pool.
 *
 * NO YIELD IS PROMISED. The Earn answer says the return is variable and comes from lending on Morpho, and that
 * nothing is earned while no venue is connected. The live v9 Earn vault
 * (0x847794900FAE91516Cc3fbc36955C6B64a2dD609) answers adapter() 0x18C8731455e956DC11fed5433Fff0223ffd935b9, whose
 * venue() is the "Steakhouse USDG" (steakUSDG) ERC-4626 vault 0xBeEff033F34C046626B8D0A041844C5d1A5409dd, so the answer
 * says the venue is connected. fundingEnabled() is false: no just-in-time maker funding.
 */
import type { Metadata } from "next";

import { DocIntro, DocLink, DocList, DocSection, LegalDocument, type TocEntry } from "@/app/legal/_components/LegalDocument";
import { LAUNCH_SET, listedExpiriesSentence, listTickers } from "@/lib/site";

const DESCRIPTION =
  "When you can take money out of each Stonkhouse vault, and how an option is priced and paid at expiry.";

export const metadata: Metadata = {
  title: "FAQ",
  description: DESCRIPTION,
  alternates: { canonical: "/faq" },
  openGraph: {
    title: "FAQ — Stonkhouse",
    description: DESCRIPTION,
    url: "/faq",
    siteName: "Stonkhouse",
    type: "article",
  },
};

/** The page's h2s, in render order. The section list and the headings both read from here. */
const FAQ_SECTIONS = {
  earliest: { id: "earliest-withdrawal", title: "What does “Earliest withdrawal” mean?" },
  house: { id: "house-vault", title: "When can I withdraw from a House vault?" },
  earn: { id: "earn-vault", title: "When can I withdraw from Earn?" },
  close: { id: "the-close", title: "What is “the close”?" },
  price: { id: "settlement-price", title: "How is the settlement price set?" },
  payout: { id: "payout", title: "How is an option paid at expiry?" },
} as const satisfies Record<string, TocEntry>;

export default function FaqPage() {
  return (
    <LegalDocument eyebrow="FAQ" title="Withdrawals and settlement" toc={Object.values(FAQ_SECTIONS)}>
      <DocIntro>
        <p>
          Straight answers about timing: when money can leave each vault, and how an option on{" "}
          {listTickers(LAUNCH_SET)} is priced and paid when it expires. Each answer describes what the
          contracts do. None of it is a promise of a return.
        </p>
      </DocIntro>

      <DocSection {...FAQ_SECTIONS.earliest}>
        <p>
          It is the soonest your withdrawal can be paid if you ask now. For a House vault it is the next
          boundary, the close its epoch ends at, when you ask before requests close 30 minutes before it.
          Inside those last 30 minutes the vault takes no new requests, so a withdrawal waits for the next
          period: you request it once that boundary is processed, and it is paid at the close after. For
          Earn it is now, if the vault holds enough cash to pay you, and otherwise your place in the
          withdrawal queue. It is the earliest possible time, not a guarantee: a boundary can only be
          processed once the settlement price for it is final (see below).
        </p>
      </DocSection>

      <DocSection {...FAQ_SECTIONS.house}>
        <p>
          A House vault runs in epochs. Deposits and withdrawals are queued during an epoch and all priced
          together at its boundary, which is a market close. Each vault&apos;s epoch length is fixed when it
          is created and can never change:
        </p>
        <DocList>
          <li>
            <strong>Daily vaults</strong> end an epoch at every session close. A withdrawal you request
            during the day, up to 30 minutes before the close, is priced at that day&apos;s close. In the
            last 30 minutes the vault takes no new requests, so it waits for the next session&apos;s close.
            When no option of its market expires at an epoch&apos;s close, the vault sells nothing that
            epoch and holds cash.
          </li>
          <li>
            <strong>Weekly vaults</strong> end an epoch at the last session close of the week, usually
            Friday&apos;s. A withdrawal requested on Monday waits for that close. {listTickers(LAUNCH_SET)}
            have daily House vaults only.
          </li>
        </DocList>
        <p>What to expect:</p>
        <DocList>
          <li>
            Requests close <strong>30 minutes before the close</strong>. Until then you can request a
            withdrawal or a deposit, or cancel one. From 30 minutes before the close until the boundary is
            processed, the vault refuses new withdrawal and deposit requests and cancels of either: those 30
            minutes are the window the settlement price is averaged over, so a request made inside it would
            already know part of its own price. Once the boundary is processed, requests open again for the
            next boundary.
          </li>
          <li>
            You are paid <strong>in kind</strong>: your share of the vault&apos;s USDG and its Stock Token,
            pro rata, after any performance fee for the epoch. The performance fee is charged only on gain
            above the vault&apos;s previous high point, and the contract caps it at 20%.
          </li>
          <li>
            After the boundary, you <strong>claim</strong> what you are owed. Until you claim, you cannot
            place a new request in a later epoch.
          </li>
          <li>
            The boundary is processed only once the settlement price for that close is final. Anyone can
            process it. If the price takes longer to settle, your withdrawal waits with it.
          </li>
        </DocList>
      </DocSection>

      <DocSection {...FAQ_SECTIONS.earn}>
        <p>
          Earn pays you straight away when it holds enough cash to cover your withdrawal. When it does not,
          your request is queued, never refused, and is paid first in, first out as cash comes back. Anyone
          can process the queue. A queued withdrawal is priced when it is paid, not when you asked, and you
          can cancel it while it waits.
        </p>
        <DocList>
          <li>
            While the vault has an option position open, withdrawals go to the queue and the queue waits
            until the position is closed.
          </li>
          <li>
            Once anyone is queued, later withdrawals queue behind them, so nobody jumps the line.
          </li>
          <li>
            Earn can lend its idle USDG through a lending venue: the Steakhouse USDG vault on Morpho. The
            return from it is <strong>variable</strong>, comes from Morpho lending, and is not guaranteed.
            The live vault is connected to it. If the venue is ever disconnected, idle USDG earns
            nothing. Money lent to the venue has to come back from it before it can be paid out, which is
            one reason a withdrawal can queue.
          </li>
          <li>
            The protocol takes a share of realised gain above the vault&apos;s previous high point (capped
            at 10% by the contract), never on a flat or losing period and never while the queue is open.
          </li>
        </DocList>
      </DocSection>

      <DocSection {...FAQ_SECTIONS.close}>
        <p>
          Options expire, and House vault epochs end, at <strong>16:00 New York time</strong> on NYSE trading
          days. A daily expiry is every trading day; a weekly expiry is the last trading day of the week.
          Not every market lists every expiry: {listedExpiriesSentence()}
          Full-day market holidays are not trading days. On an early-close day (13:00) the expiry is still
          16:00, so the settlement price is the average of the last prices before the early close.
        </p>
      </DocSection>

      <DocSection {...FAQ_SECTIONS.price}>
        <p>
          The settlement price is an average over the <strong>30 minutes before expiry</strong>, taken from
          each of the market&apos;s price sources. {listTickers(LAUNCH_SET)} each have two independent
          sources.
        </p>
        <DocList>
          <li>
            <strong>Both sources agree:</strong> the price is final about two minutes after the close. This
            is the normal path.
          </li>
          <li>
            <strong>Only one source is usable:</strong> its price is proposed and becomes final after a
            waiting period (six hours by default; it can be set between 30 minutes and 24 hours). During
            that wait a guardian can veto it.
          </li>
          <li>
            <strong>Still not final after 48 hours:</strong> an administrator can set the price. If any source
            recorded a usable price, it must be set within a band around the recorded prices. If no source
            recorded a usable price at all, the contract does not bound it, but it accepts that price only after
            the guardian has publicly held the expiry and at least seven days after the close; a held expiry with
            recorded prices also gets a wider band after those seven days. This is one reason the launch
            markets have two sources.
          </li>
        </DocList>
        <p>
          The full list of what can go wrong is on the <DocLink href="/risks">Risks</DocLink> page.
        </p>
      </DocSection>

      <DocSection {...FAQ_SECTIONS.payout}>
        <p>
          Settlement is cash value paid out of the collateral that backs the contract. Nothing is assigned
          and no one has to deliver anything. Once the price is final, anyone can settle the series and pay
          every holder.
        </p>
        <DocList>
          <li>
            <strong>Puts</strong> are backed by USDG and pay out in USDG. {listTickers(LAUNCH_SET)} list calls only.
          </li>
          <li>
            <strong>Calls</strong> are backed by the Stock Token and pay out in it. By default an
            in-the-money call payout is converted to USDG, with a minimum price the conversion must meet; if
            it cannot convert, you are paid in the Stock Token instead. You can choose to always be paid in
            kind.
          </li>
          <li>
            <strong>Writers</strong> get back the collateral that was not paid to the holder, in the same
            asset they locked.
          </li>
          <li>
            New contracts cannot be opened in the last 30 minutes before expiry, the window the price is
            averaged over.
          </li>
        </DocList>
        <p>
          The full mechanics are on <DocLink href="/how-it-works">How it works</DocLink>.
        </p>
      </DocSection>
    </LegalDocument>
  );
}
