/**
 * stonkhouse.fun/ — the landing page, and the first thing a stranger reads about this product.
 *
 * Built to the approved "Daylight" mockup, section by section: hero with the example week card,
 * the five-step week, why Stonkhouse with the fee slip, the endings (three, plus a close held up by
 * a token issuer), what can go wrong, and the CTA band. The footer comes from the layout.
 *
 * THE PRODUCT DESCRIBED HERE is the 2026-09-13 redesign (leekzor/callhouse-contracts README.md:5-15):
 * the keeper creates and arms a weekly Valorem option type and nothing is written at arm
 * (src/Vault.sol rollOpen); the vault lists one Seaport 1.6 order whose zone is the vault, and each
 * fill writes exactly the calls it buys inside authorizeOrder (src/Vault.sol authorizeOrder,
 * validateOrder); the floors are re-checked at the spot of each fill (src/lib/ValoremLib.sol:201-256).
 * There is no third-party venue, registry or venue fee (src/lib/SeaportOrderLib.sol:179-181).
 *
 * One job: leave a reader who skims only the first screen with an ACCURATE expectation. Premium
 * arrives only if somebody buys the call, assignment can take the collateral, the token is a debt
 * security, and the contracts have had no external audit. The hero's disclosure line says all of
 * that next to the headline, not in a footer. If a future edit moves it below the fold, the edit
 * is wrong. The audit status is stated plainly: no external audit (owner decision D14), one
 * internal review dated 2026-09-14.
 *
 * LIVE STATE (2026-09-15): the vault 0x88a9…ecbb and its Clear 0x53d7…C6 are deployed on chain 4663;
 * policy() = (300, 1200, 10, 9500, 500, 50); depositCap() = 20e18. The keeper prices in vol mode
 * (keeper/src/config.ts: KEEPER_PRICING_MODE default "vol", unset on Railway): strike at delta about
 * 0.15 from Cboe's delayed NVDA chain, clamped to [minOtm + 200, maxOtm − 50] bps = 5% to 11.5%.
 *
 * DELIBERATELY ABSENT:
 *   - Wallet code, chain reads and fetches. This is a server component; the only client code is
 *     the endings tabs island (app/_components/EndingsTabs.tsx), whose first ending is server
 *     rendered. The live week (strike, ask, fills) is on the app's cycle page, not here: a static
 *     page cannot keep it current.
 *   - Any forward-looking figure, and any figure scaled past one week. The numbers are either the
 *     policy as read on chain on 2026-09-15 or fork rehearsal figures, and the rehearsal figures are
 *     labelled as examples where they appear.
 *     scripts/copy-lint.mjs fails CI on the forbidden vocabulary; this page needs no
 *     `copy-lint-allow` escape hatch anywhere, and should not gain one.
 *   - The full policy table, the fee table, the phase machine and the addresses table. They live
 *     on /how-it-works, which owns them.
 *
 * Three phrases are required verbatim in THIS file by scripts/copy-lint.mjs, and they sit in the
 * hero's disclosure line:
 *   "Premium is paid only if a buyer fills"
 *   "Assignment can take the collateral at the strike"
 *   "Stock Tokens are debt securities"
 * Reword that line only with `node scripts/copy-lint.mjs` open.
 *
 * Every "go do something" link leaves for app.stonkhouse.fun through appUrl(). A relative href
 * on this domain is a 404, not a route into the dapp.
 */
import type { Metadata } from "next";
import Link from "next/link";

import { EndingsTabs } from "@/app/_components/EndingsTabs";
import { FeeSlip } from "@/app/_components/FeeSlip";
import { WeekCard } from "@/app/_components/WeekCard";
import {
  Button,
  CheckCircleIcon,
  Chip,
  Container,
  Figure,
  Notice,
  Section,
  SectionHead,
  WarnIcon,
} from "@/components/ui";
import { CHAIN_NAME, MARKET, SHARE_TICKER, appUrl } from "@/lib/site";

const TITLE = `Stonkhouse — pooled covered calls on ${MARKET} Stock Tokens`;

const DESCRIPTION = `Deposit ${MARKET} Stock Tokens, receive ${SHARE_TICKER} vault shares. Each week the vault lists covered calls for USDG, one per whole token, and writes each call only when a buyer fills. Premium is paid only if a buyer fills, and a week with no buyer pays zero premium.`;

/**
 * `title.absolute` and not a bare string: the layout carries a "%s — Stonkhouse" template, so a
 * plain `title` here would render "Stonkhouse — … — Stonkhouse".
 */
export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/",
    siteName: "Stonkhouse",
    type: "website",
  },
};

const OPEN_APP = appUrl("/vault/nvda");

type Step = { title: string; when: string; body: string; key?: boolean };

/**
 * Docs: getting-started/how-it-works.md and product/weekly-cycle.md. Times are New York time: the
 * keeper sets exercise at the NYSE Friday 16:00 ET close (Thursday on a Friday holiday) and expiry
 * 24 h later (leekzor/callhouse keeper/src/calendar.ts:1-30, :203-241). Deposits close at the
 * exercise time (src/Vault.sol _depositRefused); the keeper may close from expiry and anyone an
 * hour later (src/Vault.sol rollClose). Strike: keeper/src/vol.ts:668-730 (delta 0.15, clamped 5% to
 * 11.5% under the live band); band 3% to 12%, utilisation 95%, 50 contracts: live policy().
 */
const STEPS: readonly Step[] = [
  {
    title: "You deposit your stock",
    when: "until the Friday close",
    body: `${MARKET} Stock Tokens in, ${SHARE_TICKER} shares out, priced at the ${MARKET} behind each share.`,
  },
  {
    title: "The vault lists this week's calls",
    when: "after the last close",
    body: `The keeper picks a strike from delayed ${MARKET} option quotes, 5% to 11.5% above spot, and the vault checks it against its band, 3% to 12% today. Up to 95% of the ${MARKET} is offered, one call per token and at most 50. Nothing is written yet.`,
    key: true,
  },
  {
    title: "A buyer fills, and only then is a call written",
    when: "until Fri 16:00 ET",
    body: "Each fill writes exactly the calls bought and pays USDG to the vault in the same transaction, after the vault re-checks its price floor. Or nobody buys, and nothing is written.",
    key: true,
  },
  {
    title: "The week closes",
    when: "from Sat 16:00 ET",
    body: `Unassigned ${MARKET} comes back, assigned ${MARKET} as strike USDG. The keeper closes at expiry; an hour later, anyone can.`,
  },
  {
    title: "You claim USDG",
    when: "whenever you like",
    body: "Premium net of the fee, and any strike proceeds, wait in your balance. No deadline.",
  },
];

type Point = { title: string; body: string };

/** Docs: product/fees.md, product/policy.md, protocol/roles.md, getting-started/withdrawing.md. */
const BENEFITS: readonly Point[] = [
  {
    title: "Paid in USDG",
    body: "Premium arrives as USDG, tracked per share and never folded into your shares. There is no protocol token and no points.",
  },
  {
    title: "Hands off",
    body: "The keeper sets, lists and closes each week inside the vault's policy, and the vault writes each call itself when it sells. You deposit once and check in when you like.",
  },
  {
    title: "Fees only on premium",
    body: `Stonkhouse takes 5% of the premium buyers pay today, and the contracts cap it at 20%. Nothing on deposits, idle ${MARKET} or strike proceeds.`,
  },
  {
    title: "Every week on the record",
    body: "The app's activity page lists each week the vault arms, from its own events: filled, unfilled or assigned, zeros included. A week the keeper skips leaves no row. No projections.",
  },
  {
    title: "Two ways out",
    body: "Withdraw instantly while the vault is idle with no calls written, or queue during a week and settle at the close. Closing the week and settling the queue do not depend on the keeper.",
  },
  {
    title: "Limits in the code",
    body: `The 1% minimum strike distance, the 20% fee ceiling and the one-token lot size are compiled in, and a call is written only inside the fill that buys it. No key, the admin's included, can transfer depositors' ${MARKET}, USDG or ${SHARE_TICKER}.`,
  },
];

/** Docs: product/risks.md. The risks page carries the full list. */
const RISKS: readonly Point[] = [
  {
    title: "Weeks can pay nothing",
    body: "Premium is paid only if a buyer fills. On a thin book an unfilled week is the most likely outcome and no dealer is obliged to buy. If a rally leaves the strike less than 3% above spot, the vault refuses fills for as long as that lasts, and no reprice can help.",
  },
  {
    title: "Assignment caps your upside",
    body: `If ${MARKET} runs past the strike, collateral behind the calls the vault sold leaves at the strike for USDG. v1 does not buy it back.`,
  },
  {
    title: "Withdrawals wait for the close",
    body: "While a week is listed, a withdrawal is queued, cannot be cancelled, and settles at the close: NVDA, plus the USDG your queued shares earned while queued, strike USDG included if the week was assigned.",
  },
  {
    title: "Late deposits share the week",
    body: "A deposit while a week is listed is priced at face value, buys into the open short, and can be written against by later fills.",
  },
  {
    title: "Stock Tokens are not shares",
    body: "They are debt securities of Robinhood Assets (Jersey) Limited, with no vote or claim on Nvidia, and you carry the issuer's credit risk. The issuer can freeze transfers, which can strand the week's close.",
  },
  {
    title: "Unaudited contracts",
    body: `The contracts have had no external audit, only an internal review dated 14 September 2026, and there is no bug bounty. There is no proxy, so a fix means a new vault. Deposits are capped at 20 ${MARKET} today.`,
  },
  {
    title: "Settings can change",
    body: "The admin can change the strike band, the premium floor and the fee inside the compiled caps, and the deposit cap with no ceiling, at any time, with no timelock and effective at once. Today the admin is a single hot key, and a handover to a Safe has not happened.",
  },
  {
    title: "Third parties in the path",
    body: "Valorem settles assignment, Seaport settles fills, and USDG and the Stock Token have issuers who can freeze them; the vault cannot override any of them. A freeze at the close can strand the week's claim until it lifts.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* ------------------------------------------------------------------ hero */}
      <Container
        as="section"
        aria-labelledby="hero-h"
        className="grid grid-cols-1 items-center gap-9 pb-[72px] pt-4 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:gap-14 lg:pt-10"
      >
        <div>
          <Chip tone="accent" dot wrap>
            Stock Tokens · {CHAIN_NAME} · {MARKET} vault first
          </Chip>
          <h1
            id="hero-h"
            className="mt-5 text-[length:clamp(40px,5.6vw,66px)] font-extrabold leading-[1.02] tracking-[-0.035em]"
          >
            Put your stocks to work, <em className="not-italic text-accent">one week at a time.</em>
          </h1>
          <p className="mt-[22px] max-w-[34em] text-[19px] text-ink-2">
            Deposit tokenised stocks into a vault. Each week it lists covered calls against them, writes each call only
            when a buyer pays for it, and credits what buyers actually pay, less the fee, in USDG for you to claim. The
            first vault holds {MARKET}.
          </p>

          <div className="mt-[30px] flex flex-wrap gap-3">
            <Button href={OPEN_APP}>Open the app</Button>
            <Button variant="ghost" href="/how-it-works">
              See how a week runs
            </Button>
          </div>

          <dl className="mt-9 flex flex-wrap gap-x-7 gap-y-4">
            <Figure label="You deposit" value="Stock Tokens" />
            <Figure label="You claim" value="USDG" tone="usdg" />
            <Figure label="Protocol fee" value="5% of premium" />
            <Figure label="Deposit cap" value={`20 ${MARKET}`} />
          </dl>

          <Notice variant="plain" className="mt-[26px]">
            Premium is paid only if a buyer fills. Assignment can take the collateral at the strike. Stock Tokens are
            debt securities, not Nvidia shares. The contracts are live on {CHAIN_NAME} and have had no external audit.
          </Notice>
        </div>

        <WeekCard />
      </Container>

      {/* ------------------------------------------------------------------ how it works */}
      <Section id="how" labelledBy="how-h">
        <SectionHead
          id="how-h"
          eyebrow="How it works"
          title="Every week runs the same five steps."
          intro="The book closes on Friday at 16:00 New York time, the regular US market close, even on a day NYSE closes early: 20:00 UTC while US daylight saving time is in effect and 21:00 UTC after it ends. When Friday is an NYSE holiday it closes on Thursday, and expiry is on Friday. The keeper does the routine work; the contracts make sure nobody needs the keeper to get the week closed."
        />

        <ol className="grid grid-cols-1 gap-[26px] lg:grid-cols-5 lg:gap-0">
          {STEPS.map((step, i) => {
            const last = i === STEPS.length - 1;
            return (
              <li
                key={step.title}
                className="relative grid grid-cols-[44px_minmax(0,1fr)] gap-x-[18px] lg:block lg:pr-[18px]"
              >
                {last ? null : (
                  <>
                    {/* Dashed connector to the next step: down the left edge below lg, across above it. */}
                    <span
                      aria-hidden="true"
                      className="absolute -bottom-[26px] left-[21px] top-11 w-0.5 lg:hidden"
                      style={{
                        backgroundImage: "repeating-linear-gradient(180deg, var(--line-2) 0 8px, transparent 8px 14px)",
                      }}
                    />
                    <span
                      aria-hidden="true"
                      className="absolute left-11 right-0 top-[21px] hidden h-0.5 lg:block"
                      style={{
                        backgroundImage: "repeating-linear-gradient(90deg, var(--line-2) 0 8px, transparent 8px 14px)",
                      }}
                    />
                  </>
                )}
                <span
                  aria-hidden="true"
                  className={
                    step.key
                      ? "num relative grid size-11 place-items-center rounded-full border-2 border-accent bg-accent text-[15px] font-bold text-accent-ink"
                      : "num relative grid size-11 place-items-center rounded-full border-2 border-line-2 bg-surface text-[15px] font-bold text-ink-2"
                  }
                >
                  {i + 1}
                </span>
                <h3 className="mt-2 text-[18.5px] font-bold tracking-[-0.015em] lg:mt-[18px]">
                  <span className="sr-only">Step {i + 1}: </span>
                  {step.title}
                </h3>
                <p className="num col-start-2 mt-1.5 text-[12.5px] font-medium leading-[1.3] text-accent-text">
                  {step.when}
                </p>
                <p className="col-start-2 mt-2 text-[15px] text-ink-2">{step.body}</p>
              </li>
            );
          })}
        </ol>

        <p className="mt-11">
          <Link href="/how-it-works" className="link font-semibold text-accent-text">
            Every phase, the policy limits and the contract addresses
            <span aria-hidden="true"> →</span>
          </Link>
        </p>
      </Section>

      {/* ------------------------------------------------------------------ why stonkhouse */}
      <Section id="benefits" labelledBy="benefits-h">
        <SectionHead
          id="benefits-h"
          eyebrow="Why Stonkhouse"
          title="A covered call desk you don't have to run."
          intro="Selling calls yourself means picking strikes, posting orders and watching expiries. Stonkhouse does that on a published policy with its limits compiled into the contracts, and publishes the result of every week it arms, including the weeks that pay nothing."
        />

        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <ul className="grid grid-cols-1 gap-x-9 gap-y-[34px] sm:grid-cols-2">
            {BENEFITS.map((b) => (
              <li key={b.title}>
                <h3 className="flex items-center gap-2.5 text-[19px] font-bold tracking-[-0.015em]">
                  <CheckCircleIcon className="shrink-0 text-accent" />
                  {b.title}
                </h3>
                <p className="mt-2 text-[15.5px] text-ink-2">{b.body}</p>
              </li>
            ))}
          </ul>

          <FeeSlip />
        </div>
      </Section>

      {/* ------------------------------------------------------------------ three endings */}
      <Section id="endings" labelledBy="endings-h">
        <SectionHead
          id="endings-h"
          eyebrow="How a week ends"
          title="Three endings, and a close that can be held up."
          intro={`Knowing all four before you deposit is the whole point. Which one you get is decided by buyers, by what holders of the week's calls do and by the token issuers, not by the vault or a price feed. Pick one to see what happens to premium and to the ${MARKET} behind it.`}
        />
        <EndingsTabs />
      </Section>

      {/* ------------------------------------------------------------------ risks */}
      <Section id="risks" labelledBy="risks-h">
        <SectionHead
          id="risks-h"
          eyebrow="Before you deposit"
          title="What can go wrong."
          intro={
            <p>
              Plainly, before anything else. The full list, with what the contracts do about each one, is on{" "}
              <Link href="/risks" className="link">
                the risks page
              </Link>
              .
            </p>
          }
        />

        <ul className="grid grid-cols-1 gap-x-14 sm:grid-cols-2">
          {RISKS.map((r) => (
            <li
              key={r.title}
              className="grid grid-cols-[30px_minmax(0,1fr)] gap-x-3 gap-y-1 border-t border-line py-[22px]"
            >
              <WarnIcon size={18} className="mt-[3px] text-warn" />
              <h3 className="text-[17.5px] font-bold tracking-[-0.01em]">{r.title}</h3>
              <p className="col-start-2 text-[15px] text-ink-2">{r.body}</p>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-x-8 gap-y-4 border-t border-line pt-8">
          <p className="max-w-[44em] text-[15px] text-ink-2">
            The risks page also covers a fill refused after a rally, a claim stranded at the close, partial assignment,
            keeper failure, USDG, the Valorem fee switch and an outage near the Friday close.
          </p>
          <Button variant="ghost" href="/risks">
            Read every risk
          </Button>
        </div>
      </Section>

      {/* ------------------------------------------------------------------ cta band */}
      <Container as="section" aria-labelledby="cta-h">
        <div className="mb-[72px] mt-4 flex flex-wrap items-center justify-between gap-7 rounded-[28px] bg-ink px-[22px] py-[30px] text-ground sm:p-12 [&_:focus-visible]:outline-ground">
          <div>
            <h2
              id="cta-h"
              className="max-w-[18em] text-[length:clamp(28px,3.4vw,40px)] font-bold leading-[1.08] tracking-[-0.03em] text-ground"
            >
              Deposit your stock, and let the week run.
            </h2>
            <p className="mt-2.5 max-w-[34em] text-ground/75">
              Read the risks first. Then connect a browser wallet in the app on {CHAIN_NAME} and deposit {MARKET}, the
              first vault, up to the cap. This site never asks for a wallet.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button href={OPEN_APP}>Open the app</Button>
            <Button variant="inverse" href="/risks">
              Read the risks
            </Button>
          </div>
        </div>
      </Container>
    </>
  );
}
