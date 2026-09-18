/**
 * /risks — v2 buyer and writer risks first, followed by the detailed v1 legacy account record.
 *
 * This page is a product feature, not a legal appendix. The pitch is that the bad weeks are
 * published, so the bad weeks are described here in the register an engineer would use in a
 * postmortem: what the failure is, how often to expect it, what it costs the writer, and what
 * the system actually does about it. For several of these the answer is nothing, and the page says
 * so rather than inventing a mitigation.
 *
 * Sources, in order of authority: the live factory and account (stonkhousedotfun/callhouse-contracts
 * src/solo/AccountFactory.sol, src/solo/Account.sol, src/Policy.sol, src/lib/ValoremLib.sol),
 * then the implementation. The footer GitBook is a legacy v1 reference, not v2 guidance.
 *
 * ACCURACY PASS 2026-09-15, against factory 0xc4A5Cd0DE91CaB7F5Ebe2114bc63Fbb43E642BBb on 4663:
 * policy() = (300, 1200, 40, 9500, 500, 50) so the premium floor is 0.40% of spot; maxPriceAge()
 * 345600; depositCap() type(uint256).max; feeRecipient() and DEFAULT_ADMIN_ROLE are the hot EOA
 * 0xEb82…9d9b (no timelock); keeper 0x06c1…1d2 is not admin; guardian 0x2974…6F39; Clear feeTo()
 * is the 1-of-1 Safe 0xff14…CF61; feesEnabled() false, feeBps 15. Factory weeks are priced from
 * spot (5% OTM, 0.40% ask floored at 1 USDG), not Cboe vol mode. Week 1: strike 223 USDG, ask
 * 1.000000 USDG, exercise Friday 18 September 2026 4:00pm ET.
 *
 * The rally threshold in "A fill refused after a rally" is derived: week 1 strike 223 USDG and
 * minOtmBps 300 refuse fills once spot is above about 216.50 USDG. At 0.40% the 1 USDG ask is not
 * what binds first. Both are re-checked at every fill.
 *
 * DELIBERATELY ABSENT: live fetches, percentage likelihoods, reassurances the bytecode does not
 * enforce, wallet code. Links that do something point into app.stonkhouse.fun via appUrl().
 */
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

import { Button, Chip, Container, Eyebrow, ExternalLink, Figure, Num, Panel, Section, SectionHead, WarnIcon } from "@/components/ui";
import { WEEK } from "@/lib/clock";
import { SECURITY_CONTACT_EMAIL } from "@/lib/legal";
import { ADDRESSES, CHAIN_ID, CHAIN_NAME, DEV_CARDS_ENABLED, DEV_PREVIEW, FEES_V2, MARKET, STATUS, addressUrl, appUrl } from "@/lib/site";

import { GlanceGroup, ImpactLegend, RiskEntry, type RiskGroup } from "./_components/risk-ui";

const DESCRIPTION =
  "Buyers can lose the entire premium and taker fee. Thin books, settlement delays and payout conversion can change the result. Writers face capped upside and collateral risk.";

export const metadata: Metadata = {
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

const V2_GROUPS: readonly RiskGroup[] = [
  {
    id: "buyers",
    eyebrow: "Buyers · v2",
    title: "The cost is known. A payout is not.",
    intro: "The buyer's maximum option loss is the premium plus taker fee paid; network gas is extra. The stock price and the ability to trade before expiry remain uncertain.",
    risks: [
      {
        id: "buyer-premium-loss", title: "The contract can expire worthless", often: "Common", impact: "buyer-cost",
        body: <p>A call pays only when its averaged settlement price finishes above its strike. Most options expire worthless. A correct forecast about the stock can still miss the strike or the expiry.</p>,
        cost: <p>The entire premium and capped taker fee. There is no further buyer collateral to seize.</p>,
        response: <p>The card and trade ticket show the maximum option loss before the wallet signs. Network gas is extra. The protocol does not refund an expired option.</p>,
      },
      {
        id: "thin-book", title: "A thin book can make an exit costly", often: "Possible at any time", impact: "buyer-cost",
        body: <p>A quoted ask may disappear or have too little size. A bid may not exist when you want to sell your option before expiry; crossing a thin spread can cost much of the premium.</p>,
        cost: <p>Slippage on an entry or resale, up to the full amount paid if no buyer appears and the option expires worthless.</p>,
        response: <p>The app shows depth and checks orders again before a trade. It cannot create a counterparty or promise a resale price.</p>,
      },
      {
        id: "oracle-dispute", title: "Settlement can be delayed or held", often: "Uncommon, but material", impact: "exit",
        body: <p>The v2 settlement oracle uses an averaged price around 16:00 New York time. If sources are missing or disagree, a single-source candidate waits and the guardian can hold it. The admin can resolve a stuck result only after the configured delay.</p>,
        cost: <p>Time without access to a final payout. A wrong settlement price could also change the amount owed.</p>,
        response: <p>The oracle records source evidence and delay state on-chain. Redemption waits for a finalized price; a keeper cannot choose the price.</p>,
      },
      {
        id: "payout-conversion", title: "A call payout may arrive as Stock Tokens", often: "When conversion fails", impact: "exit",
        body: <p>An in-the-money call is owed Stock Tokens. The Clearinghouse normally attempts to swap them to USDG within a bounded slippage limit. If the route fails or cannot meet that limit, it pays in kind instead. An issuer transfer freeze can leave an internal ledger balance until withdrawal works.</p>,
        cost: <p>The time and price risk of holding or converting Stock Tokens instead of receiving USDG immediately. Stock Tokens are debt securities, not shares.</p>,
        response: <p>The core checks the conversion result against the on-chain slippage bound. A failed transfer is credited to the holder&apos;s ledger rather than blocking every other holder&apos;s redemption.</p>,
      },
    ],
  },
  {
    id: "writers-v2",
    eyebrow: "Writers · v2",
    title: "Premium trades away some upside.",
    intro: "Writers must supply collateral and decide how much of it to offer. Minting an option charges rent; a filled call changes the payout they receive at settlement.",
    risks: [
      {
        id: "writer-upside", title: "A rally caps the writer's upside", often: "Whenever a sold call finishes in the money", impact: "upside",
        body: <p>A filled call gives its buyer the gain above the strike. The writer receives the sale premium at the planned launch primary fee of {FEES_V2.premiumBps / 100}%, but gives up that upside on the amount sold. Settlement returns the remaining Stock Tokens as a net-share amount; it is not simply all shares back or a full cash sale.</p>,
        cost: <p>The gain above the strike on the collateral behind filled calls, plus any writer rent charged when the option was minted.</p>,
        response: <p>Only the amount offered can be written. The app shows the writer payoff before an order is signed; an unfilled order can be cancelled.</p>,
      },
      {
        id: "writer-rent", title: "Writer rent is charged at mint", often: "Each new option mint", impact: "collateral-fee",
        body: <p>The fee is based on locked collateral, the market rate pinned when the series is created, and time remaining to expiry. A call pays in Stock Tokens and a put pays in USDG. An unfilled write ask that has not minted an option pays no rent, but a pre-minted option has already paid it even if its later sale never fills.</p>,
        cost: <p>The rent can exceed the premium on a cheap option. If a holder brings matching long and short tokens together before expiry, unused rent is returned to whoever closes, in the collateral asset. The initial charge and refund can differ after time passes and amounts are rounded. There is no refund at or after expiry.</p>,
        response: <p>Check the series-pinned rate and current mint fee in the app before writing. Any rent still held when the series settles accrues to the protocol.</p>,
      },
      {
        id: "keeper-delay", title: "Settlement needs a caller", often: "Possible without automation or during outages", impact: "exit",
        body: <p>Snapshotting prices, finalizing settlement and redeeming holders require transactions. A cranker can automate them and advance auto-roll strategies, but no cranker has an exclusive settlement privilege: anyone may call the public functions, pay gas and submit the transactions.</p>,
        cost: <p>A delayed payout, an unrolled strategy, or a missed chance to list. An unavailable keeper does not transfer your collateral to itself.</p>,
        response: <p>Public functions remain callable. The app and runbooks expose the state so another caller can resume work.</p>,
      },
      {
        id: "oracle-and-admin", title: "The oracle and admin are in the money path", often: "Low-frequency dependency", impact: "total",
        body: <p>The finalized price controls both long and short payouts. The admin can configure market sources and fees within compiled ceilings and can resolve a stuck settlement after a delay. The guardian can pause new risk and veto a single-source result.</p>,
        cost: <p>A bad price or contract fault can cost a buyer&apos;s entire premium or a writer&apos;s collateral value. These contracts have no external audit and are non-upgradeable.</p>,
        response: <p>Rules and limits are on-chain, and close, redeem, withdraw and cancel cannot be paused by a role. Those limits reduce authority; they do not remove implementation or key risk.</p>,
      },
    ],
  },
];

/** Historical v1 account mechanics stay visible until O2-05 retires the last account. */
const GROUPS: readonly RiskGroup[] = [
  {
    id: "ordinary",
    eyebrow: "Ordinary outcomes",
    title: "Not edge cases. Every week ends in one or more of these.",
    intro:
      "You offer some of your stock for one week. That offer can fail to sell, be refused by its own price checks, or sell and then be exercised.",
    risks: [
      {
        id: "no-buyer",
        title: "No buyer: a week that pays zero",
        often: "Most weeks",
        impact: "premium",
        body: (
          <>
            <p>
              Premium is paid only if a buyer fills. Your listed lots sit on the app&apos;s book, and
              any Seaport 1.6 client can fill the same orders. If nobody buys before the book closes at{" "}
              <Num>{WEEK.close}</Num> — or Thursday when NYSE is shut that Friday; the call&apos;s own
              exercise time is what counts — that week&apos;s premium is zero. Calls are written only
              when bought, so nothing was written.
            </p>
            <p>
              This is the most likely outcome on a thin book, and the book for weekly calls on a
              tokenised stock is thin. The listing is not shown on any third-party venue: a buyer has
              to come to it.
            </p>
          </>
        ),
        cost: (
          <p>
            The week&apos;s premium, which is zero, and the time. The protocol fee is a share of the
            ask, so an unfilled week pays no fee either. Nothing was written, so an unfilled week has
            nothing that can be assigned. Idle {MARKET} you did not list was never at risk.
          </p>
        ),
        response: (
          <>
            <p>
              Unsold lots unlock when anyone settles your account after expiry. An empty book is a
              market fact, not an error.
            </p>
            <p>
              The app&apos;s book is where lots are shown and filled. A buyer who does not use that
              page, and does not build the fill in another Seaport client, will not see the listing at
              all.
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
              Each account re-checks its premium floor and the lower bound of its strike band at the
              spot of every fill, not at the spot the week was priced on. If {MARKET} rises and the
              listed ask falls under the floor, the fill reverts. If {MARKET} rises until the strike
              is less than <Num>3%</Num> above spot (the band&apos;s lower bound under the current
              policy), no new ask fixes that: nothing more can be sold from that listing.
            </p>
            <p>
              On week <Num>1</Num> (strike <Num>223</Num> USDG, ask <Num>1.000000</Num> USDG), fills
              are refused at any price once spot passes about <Num>216.50</Num>. At the current
              premium floor of <Num>0.40%</Num> of spot, that listing&apos;s ask is not what binds
              first.
            </p>
          </>
        ),
        cost: (
          <p>
            Premium on the lots that did not sell. A buyer who tries between the rally and a new week
            gets a reverted transaction; the book simulates the fill first, but a buyer using another
            client may pay gas for the revert.
          </p>
        ),
        response: (
          <p>
            The refusal is the protection: it stops a buyer taking a near-the-money call at an
            out-of-the-money price. Listed accounts have already pinned this week&apos;s strike and
            ask; they do not reprice. Calls already sold stay sold.
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
            Anyone holding a call of <strong>your</strong> option type may exercise it inside the
            exercise window (<Num>{WEEK.window}</Num>), plus a few seconds of offset unique to your
            account. Valorem takes the collateral at the strike and leaves the strike proceeds in
            USDG in your account, with no protocol fee. Premium from those lots is already in your
            wallet. The keeper sets the strike about <Num>5%</Num> above spot, and the factory
            refuses a list outside <Num>3%</Num> to <Num>12%</Num> above spot. It takes a move, but
            not an enormous one.
          </p>
        ),
        cost: (
          <p>
            Every cent of upside above the strike on the lots that sold, and those tokens themselves.
            v1 does not buy the stock back. Idle lots you did not list cannot be assigned. If {MARKET}{" "}
            gaps up and keeps going, you sold the move for a week&apos;s premium.
          </p>
        ),
        response: (
          <>
            <p>
              Nothing buys the token back. The contracts have no function for it, and an automated
              market buy would be a risk of its own.
            </p>
            <p>
              Each account uses its own Valorem option type (same strike, expiry = base + your index),
              so other Stonkhouse writers cannot share your assignment bucket. You can be assigned on
              at most the lots you sold, because the account writes only inside a fill.
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
            A buyer can exercise some of the lots they bought from you and let the rest expire. You
            can end the week with a mix: some NVDA back, some strike USDG, plus the premium already
            paid on every sold lot.
          </p>
        ),
        cost: (
          <p>
            Predictability. Listed lots that sold are never a promise of a fixed number of tokens
            back: part of what comes back can be USDG at the strike, and the split is not known until
            holders exercise or the option expires.
          </p>
        ),
        response: (
          <p>
            It bounds it, and no more. Because the account writes only inside the fill that sells,
            every lot it can be assigned on earned a premium. Which of those lots get exercised is
            the holder&apos;s decision.
          </p>
        ),
      },
    ],
  },
  {
    id: "position",
    eyebrow: "Your position",
    title: "Not failures, and still the reasons people end up unhappy.",
    intro: "When money can come in and go out, what listed lots commit you to, and what nothing tops up.",
    risks: [
      {
        id: "open-week-deposit",
        title: "Listed terms cannot be changed",
        often: "Once you list",
        impact: "upside",
        body: (
          <p>
            Depositing while a week is listed does <strong>not</strong> put the new {MARKET} up for
            sale. New tokens sit idle. What you already listed is pinned: strike, ask, exercise and
            your expiry cannot move if the keeper sets a later week. You cannot change how many lots
            you offered while listed.
          </p>
        ),
        cost: (
          <p>
            You cannot add to this week&apos;s offer, cut it, or take listed lots out until after
            expiry. If the strike now looks wrong, you wait.
          </p>
        ),
        response: (
          <p>
            Idle {MARKET} can still be withdrawn. After your expiry, anyone can settle the account:
            leftover orders cancel and unsold lots unlock.
          </p>
        ),
      },
      {
        id: "withdrawals-queue",
        title: "Listed NVDA is locked until settle",
        often: "Every listed week",
        impact: "exit",
        body: (
          <p>
            Idle {MARKET} can leave at any time. Lots you listed are reserved until a fill takes them
            or until someone settles after your expiry. There is no share token and no redeem queue.
          </p>
        ),
        cost: (
          <p>
            The option to leave with listed tokens at a moment of your choosing. You wait for expiry,
            even in a week that sold nothing.
          </p>
        ),
        response: (
          <p>
            Settle is permissionless after that account&apos;s expiry, so a stopped keeper cannot trap
            reserved {MARKET} forever. No Stonkhouse key is needed to finish the week. A Stock Token
            issuer freeze of the account can still hold up the {MARKET} payout until it lifts.
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
            This one has no token to pay with. You keep the ask less the protocol fee (
            <Num>5%</Num> today; the admin can set it anywhere up to <Num>20%</Num>), and that is the
            entire return path.
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
      "The collateral and the payout are issued by third parties who hold powers over both. None of those powers can be overridden from your account.",
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
              issuer can freeze or restrict transfers, blocklist your account, burn tokens from any
              holder including the account, and upgrade the token contract, each from a single key with
              no timelock. The token can also pause its own price oracle, and the issuer can end the
              series on <Num>30</Num> days&apos; notice, after which the tokens can be redeemed only
              with identity checks an account cannot pass.
            </p>
            <p>
              The events are different. A freeze stops anything that moves the token, including selling
              a call, a withdrawal and the {MARKET} leg of settle. An oracle pause stops new lists and
              fills, and nothing else: settlement never reads the oracle, so an open week can still
              settle. A burn takes {MARKET} out of the account outright.
            </p>
          </>
        ),
        extra: <FreezeList />,
        cost: (
          <>
            <p>
              In the mild case, weeks of nothing: no new calls under either a freeze or an oracle pause,
              and under a freeze an open week whose claim is stranded at settle.
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
              procedurally (premium already paid to your wallet stays yours, USDG already in the
              account can still be collected if USDG moves, and settle strands the claim rather than
              reverting forever), and the account refuses to sell against a paused oracle rather than
              selling blind.
            </p>
            <p>
              After a burn, the {MARKET} is simply gone from that account. There is no share price to
              haircut and no queue of other depositors.
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
            Premium is paid to your wallet on the fill, so a later freeze of the account does not take
            that USDG back. Strike USDG sits in Valorem until settle, then in the account until you
            collect it. A pause or a freeze can stop those later legs. A wipe or a burn would take
            USDG the account still holds.
          </p>
        ),
        response: (
          <p>
            Settle completes and strands the claim rather than reverting, so a USDG event does not trap
            the {MARKET} forever. What USDG takes, the account cannot get back.
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
            Settling a written week asks Valorem to hand back the account&apos;s claim: the unassigned{" "}
            {MARKET} and the strike USDG, in one call. Either token&apos;s issuer can make that call
            fail. When it fails, settle still clears the listing and leaves the claim in place. The
            claim is stranded.
          </p>
        ),
        cost: (
          <p>
            Time. Listed leftovers are already cancelled, but written {MARKET} and strike USDG wait
            until Valorem lets a later settle through, and possibly never.
          </p>
        ),
        response: (
          <p>
            Anyone can call settle again after expiry. The first attempt Valorem lets through redeems
            the claim. Idle {MARKET} was never in the claim.
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
            account&apos;s balance on top of the collateral each time a fill writes a lot. It is off
            today. Stonkhouse settles on its own instance of Valorem Clear, whose fee switch is held by
            a Safe with a single owner and a threshold of one, not by the factory admin; the factory
            refuses to list or fill through the fee until admin separately accepts it. On a weekly
            out-of-the-money call that is not small change: the premium floor is currently{" "}
            <Num>0.40%</Num> of spot, so <Num>15 bps</Num> of notional is a large fraction of a listing
            priced at the floor.
          </p>
        ),
        cost: (
          <p>
            If the fee is switched on and accepted, every fill takes <Num>15 bps</Num> of the {MARKET} it
            writes from that account. An exerciser would also pay <Num>15 bps</Num> of the strike into
            the Clear&apos;s fee balance, whether or not the factory accepted the fee. While the fee is
            on and not accepted, nothing sells.
          </p>
        ),
        response: (
          <p>
            The factory refuses to sell through a fee nobody accepted: list and every fill revert until
            the admin accepts it. The fee switch sits on the one-owner Safe and the acceptance on the
            admin&apos;s single key, and neither has a delay; the acceptance is part of the admin risk
            below.
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
              {CHAIN_NAME} runs a single Robinhood sequencer and has no uptime feed for the factory to
              read. The sequencer also screens transactions, and one that touches a restricted address
              is dropped; if an account itself were restricted, nothing could reach it. Forcing a
              transaction in through Ethereum takes <Num>4 days</Num>, and may not escape the screening
              either. The {MARKET} price feed updates through the week, overnight included, and stops
              from the Friday close to Sunday evening New York time and over US market holidays; a gap
              longer than the factory&apos;s price-age limit (<Num>4 days</Num> today; the admin can set
              it from <Num>1 hour</Num> to <Num>7 days</Num>) blocks listing and selling until the feed
              updates.
            </p>
            <p>
              The keeper prices each factory week from spot. If the feed cannot be read when the week
              is due, the keeper sets no week rather than guess a price.
            </p>
            <p>
              Live lots are shown on the app&apos;s book. If the app is down in the hours before the
              close, buyers have no page to fill from, though the orders still exist on Seaport.
            </p>
          </>
        ),
        cost: (
          <p>
            The week&apos;s premium: the same outcome as no buyer, arrived at for an operational reason
            instead of a market one. Lots already sold stay sold, and assignable, until expiry.
          </p>
        ),
        response: (
          <p>
            The account refuses to list or sell against a price older than its limit or a paused
            oracle. Nothing is written without a buyer, so an unfillable listing costs no collateral.
            Settle after expiry is open to anyone, so an outage of the keeper delays it but no key is
            needed to finish it.
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
              them. An internal audit on <Num>2026-09-13</Num> found that the earlier pooled vault
              wrote calls before selling them; the design was changed to write only inside a fill.
              Isolated accounts inherit that rule, plus a unique option type per account. Those
              reviews were of the vault, not a substitute for an audit of the live factory.
            </p>
            <p>
              The factory clones a locked implementation. Valorem Clear is not source-verified on any
              explorer yet; its deployed bytecode is identical to Valorem&apos;s published code except
              for the metadata hash. Valorem Clear&apos;s code was audited by Zellic in{" "}
              <Num>2022–2023</Num> under its former name, OptionSettlementEngine; that audit covers
              Valorem, not this factory. Valorem&apos;s code has had no commit since <Num>2023</Num>,
              so there is no patch path behind it. Seaport, USDG and the Stock Token are third-party
              code outside anyone&apos;s control here.
            </p>
          </>
        ),
        cost: <p>In the worst case, everything deposited in that account.</p>,
        response: (
          <p>
            There is no proxy and no upgrade key on the implementation, so a bug means a new factory
            and new accounts, not a silent patch. No external audit has been completed. One is pending.
            There is no bug bounty; report a vulnerability to{" "}
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
            The keeper is one hot key. It can crash, run out of gas money, or be looking the wrong way
            when the week should be set or your lots listed.
          </p>
        ),
        cost: (
          <p>
            A skipped week if it stops before the week is set. If it stops after the week is set,
            you can still list yourself. If it stops after listing, the book may have nothing to show,
            so the week most likely sells nothing more; lots already sold stay locked until expiry.
          </p>
        ),
        response: (
          <>
            <p>
              A stopped keeper cannot strand collateral past the week. After your expiry, anyone can
              settle: cancel leftovers, unlock unsold {MARKET}, redeem the claim if Valorem allows.
            </p>
            <p>
              The Guardian can halt new lists and fills. A halt never blocks a deposit, an idle
              withdrawal, a USDG claim or settle after expiry.
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
            Assume the keeper key is stolen outright. The attacker can set the week&apos;s strike and
            ask, and list lots you already requested. Every list still goes through the account, which
            checks the strike band, the premium floor, the lot size and the compiled window limits.
          </p>
        ),
        cost: (
          <p>
            Skipped weeks, or a week set on the least favourable terms the policy allows (the lowest
            in-band strike, an ask at the premium floor) and bought by a buyer the attacker controls.
            A fully compromised keeper still cannot withdraw your idle {MARKET}, or list lots you did
            not request.
          </p>
        ),
        response: (
          <p>
            No off-chain component can move money. At the current policy the worst terms are still
            strikes at least <Num>3%</Num> above spot and an ask of at least <Num>0.40%</Num> of spot
            notional, checked again at every fill, and the admin can revoke the key.
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
            The factory admin sets policy inside compiled caps: the strike band, the premium floor, the
            utilisation ceiling, the protocol fee, the lot cap, the deposit cap, the price-age limit,
            the fee recipient, and whether to accept Valorem&apos;s engine fee (the switch that turns
            that fee on is held by the Clear&apos;s one-owner fee Safe, not by the admin). It can
            appoint the keeper and the Guardian. Today the admin is a single hot key, and the protocol
            fee is paid to that same address. There is no timelock and no delay. A handover of the
            admin role to a Safe is planned and has not happened.
          </p>
        ),
        cost: (
          <p>
            A band set too tight means weeks where no strike qualifies. A band set too loose means
            assignment becomes routine. An admin can also redirect up to <Num>20%</Num> of the ask to
            an address it chooses; loosen policy to the caps; or, once the fee Safe switches
            Valorem&apos;s fee on, accept it: a standing <Num>15 bps</Num> of {MARKET} on every lot
            sold. All of these are legal moves inside the caps. Listed accounts have already pinned
            this week&apos;s orders.
          </p>
        ),
        response: (
          <p>
            The caps are enforced on chain, which rules out the worst version: nobody can sell calls
            closer than <Num>1%</Num> above spot, set the protocol fee above <Num>20%</Num> of the
            ask, or take a fee from strike proceeds, and no admin function transfers your tokens or
            blocks idle withdrawals. The caps do not rule out bad settings inside them. Every change
            is visible on chain as an event.
          </p>
        ),
      },
    ],
  },
];

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

/** What still works during a Stock Token transfer freeze of the account. */
function FreezeList() {
  const rows: { what: string; verdict: Verdict; why: string }[] = [
    { what: "Collecting USDG already in the account", verdict: "works", why: "It moves only USDG." },
    {
      what: "Premium already paid on a fill",
      verdict: "works",
      why: "That USDG went to your wallet in the fill. A later freeze of the account does not take it back.",
    },
    {
      what: "Settling after expiry",
      verdict: "partly",
      why: `It clears leftover orders, but a claim with ${MARKET} to hand back is stranded until the freeze lifts. Anyone can retry.`,
    },
    {
      what: "Depositing or withdrawing idle NVDA",
      verdict: "stops",
      why: `Each moves ${MARKET}.`,
    },
    {
      what: "Selling a lot",
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
      text: "Holds the collateral of lots sold, mints each call inside the fill that buys it and settles assignment. Its engine fee is off, and its switch is held by a one-owner Safe; the factory refuses to sell through that fee until admin also accepts it. Not yet source-verified: runtime matches Valorem's published code except the metadata hash.",
    },
    {
      name: ADDRESSES.seaport.label,
      address: ADDRESSES.seaport.address,
      text: "Settles every fill and asks the account before it moves anything. Third-party code outside Stonkhouse's control.",
    },
    {
      name: "The keeper and the app's book",
      text: "Set the week's strike and ask from spot, list requested lots, and show them to buyers. If either is down, the week most likely sells nothing, but nothing is written without a buyer and settle after expiry does not need them.",
    },
    {
      name: ADDRESSES.priceFeed.label,
      address: ADDRESSES.priceFeed.address,
      text: "Read for display and for the floors checked when an account lists and a lot fills. Settlement never reads it. A stale or broken feed means a skipped or unsold week.",
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

export default function RisksPage() {
  return (
    <>
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
            A buyer can lose every USDG paid for a contract. A writer can lose upside on stock
            committed to a filled call. Settlement, liquidity and issuer restrictions can delay an exit.
          </p>
          <div className="mt-6 grid max-w-[36em] gap-3 text-ink-2">
            <p>
              The v2 buyer and writer risks come first. Each entry names the possible cost and what
              the protocol actually does about it. The detailed v1 account risks remain below,
              labelled for legacy accounts until their run-off is complete.
            </p>
            <p className="text-[14.5px] text-ink-3">
              Nothing on this page reads the chain. Fee figures are planned v2 launch defaults, not a
              live trade quote; writer rent varies by market and time. Check the app&apos;s
              live quote and the relevant contract before transacting.
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
                Buyers can lose their full cost. Writers can lose upside.
              </h2>
              <p className="mt-1.5 text-[14.5px] text-ink-2">
                Most options expire worthless. The Stonkhouse contracts have had no external audit,
                and a Stock Token issuer can restrict transfers. Read the full list before trading.
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
                <span>A buyer can lose the entire premium and taker fee.</span>
              </li>
              <li className="flex items-start gap-3 border-t border-line py-3 text-[15.5px] font-semibold leading-snug">
                <WarnIcon className="mt-0.5 shrink-0 text-warn" />
                <span>Premium is paid only if a buyer fills. Assignment can take the collateral at the strike.</span>
              </li>
              <li className="flex items-start gap-3 border-t border-line py-3 text-[15.5px] font-semibold leading-snug">
                <WarnIcon className="mt-0.5 shrink-0 text-warn" />
                <span>Stock Tokens are debt securities, not shares.</span>
              </li>
              <li className="flex items-start gap-3 border-t border-line pt-3 text-[15.5px] font-semibold leading-snug">
                <WarnIcon className="mt-0.5 shrink-0 text-warn" />
                <span>Stonkhouse is not available to US persons.</span>
              </li>
            </ul>
          </div>

          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Figure boxed size="sm" label="v2 primary premium fee" value={`${FEES_V2.premiumBps / 100}%`} unit="planned launch" />
            <Figure boxed size="sm" label="v2 exercise fee default" value={`${FEES_V2.exerciseBps / 100}%`} unit="capped" />
            <Figure boxed size="sm" mono={false} label="External audit" value={STATUS.audit} />
          </dl>
        </Panel>
      </Container>

      <Section id="at-a-glance" labelledBy="at-a-glance-h">
        <SectionHead
          id="at-a-glance-h"
          eyebrow="At a glance"
          title="The risks, on one screen."
          intro="Each row links to its full entry. The grey line is how often to expect it; the chip is the worst it can cost you."
        />
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
          {[...V2_GROUPS, ...GROUPS.map((group) => ({ ...group, eyebrow: `Legacy accounts · ${group.eyebrow}` }))].map((group) => (
            <GlanceGroup key={group.id} group={group} />
          ))}
          <ImpactLegend />
        </div>
      </Section>

      {V2_GROUPS.map((group) => (
        <Section key={group.id} id={group.id} labelledBy={`${group.id}-h`}>
          <SectionHead id={`${group.id}-h`} eyebrow={group.eyebrow} title={group.title} intro={group.intro} />
          <div>{group.risks.map((risk) => <RiskEntry key={risk.id} risk={risk} />)}</div>
        </Section>
      ))}

      <Section id="legacy-accounts" labelledBy="legacy-accounts-h">
        <SectionHead id="legacy-accounts-h" eyebrow="Legacy accounts · v1" title="Earlier account risks remain published."
          intro="These Valorem and Seaport paths describe v1 accounts during their run-off. They are not the v2 Clearinghouse and OrderBook path." />
        <p className="max-w-[65em] text-sm text-ink-2">The v1 contracts remain relevant until all positions expire and their holders finish withdrawing. The historical fee, keeper and oracle descriptions below apply only to those accounts.</p>
      </Section>

      {GROUPS.map((group) => (
        <Section key={group.id} id={group.id} labelledBy={`${group.id}-h`}>
          <SectionHead id={`${group.id}-h`} eyebrow={`Legacy accounts · ${group.eyebrow}`} title={group.title} intro={group.intro} />
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
              limits, not measurements; live lots are on app.stonkhouse.fun.
            </p>
          </li>
          <li className="border-t border-line py-[22px]">
            <h3 className="text-[17.5px] font-bold tracking-[-0.01em]">Not a forecast</h3>
            <p className="mt-1.5 text-[15px] text-ink-2">
              Past weeks describe what already happened and say nothing about the next one.
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
              {DEV_PREVIEW && DEV_CARDS_ENABLED
                ? "Dev contracts appear in the dev app book. See how settlement works before trading."
                : DEV_PREVIEW
                ? "Dev contracts are not ready yet. See how settlement works before trading."
                : STATUS.v2 === "Not released"
                ? "The current app has the v1 book; public v2 trading is not released. See how settlement works before trading."
                : "Live lots are on the book. To see how one week runs, walk through it step by step."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {DEV_PREVIEW && !DEV_CARDS_ENABLED ? null : <Button href={appUrl("/book")}>{DEV_PREVIEW ? "Open dev book" : STATUS.v2 === "Not released" ? "Open current book" : "Open the book"}</Button>}
            <Button variant="inverse" href="/how-it-works">
              How a week runs
            </Button>
          </div>
        </div>
      </Container>
    </>
  );
}
