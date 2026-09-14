/**
 * callhouse.finance/ — the landing page, and the first thing a stranger reads about this product.
 *
 * Built to the approved "Daylight" mockup, section by section: hero with the example week card,
 * the five-step week, why Callhouse with the fee slip, the three endings, what can go wrong, and
 * the CTA band. The footer comes from the layout.
 *
 * One job: leave a reader who skims only the first screen with an ACCURATE expectation. Premium
 * arrives only if somebody buys the call, assignment can take the collateral, the token is a debt
 * security, and the vault is neither deployed nor audited. The hero's disclosure line says all of
 * that next to the headline, not in a footer. If a future edit moves it below the fold, the edit
 * is wrong.
 *
 * DELIBERATELY ABSENT:
 *   - Wallet code, chain reads and fetches. This is a server component; the only client code is
 *     the endings tabs island (app/_components/EndingsTabs.tsx), whose first ending is server
 *     rendered. The vault is not deployed, so a live read would render zeros that mean "not
 *     deployed yet".
 *   - Any forward-looking figure, and any figure scaled past one week. The numbers are either
 *     launch policy (README "Policy (launch)", docs product/policy.md) or fork rehearsal figures,
 *     and the rehearsal figures are labelled as examples where they appear.
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
 * Every "go do something" link leaves for app.callhouse.finance through appUrl(). A relative href
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
import { CHAIN_NAME, MARKET, SHARE_TICKER, VENUE_NAME, appUrl } from "@/lib/site";

const TITLE = `Callhouse — pooled covered calls on ${MARKET} Stock Tokens`;

const DESCRIPTION = `Deposit ${MARKET} Stock Tokens, receive ${SHARE_TICKER} vault shares. Each week the vault writes covered calls, one per whole token, and lists them on ${VENUE_NAME} for USDG. Premium is paid only if a buyer fills, and a week with no buyer pays zero premium.`;

/**
 * `title.absolute` and not a bare string: the layout carries a "%s — Callhouse" template, so a
 * plain `title` here would render "Callhouse — … — Callhouse".
 */
export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/",
    siteName: "Callhouse",
    type: "website",
  },
};

const OPEN_APP = appUrl("/vault/nvda");

type Step = { title: string; when: string; body: string; key?: boolean };

/** Docs: getting-started/how-it-works.md and product/weekly-cycle.md. */
const STEPS: readonly Step[] = [
  {
    title: "You deposit your stock",
    when: "until the book closes",
    body: `${MARKET} Stock Tokens in, ${SHARE_TICKER} shares out, priced at the ${MARKET} behind each share.`,
  },
  {
    title: "The vault writes calls",
    when: `when ${VENUE_NAME} opens the week`,
    body: `Up to 95% of idle ${MARKET} becomes whole calls, one per token, 3% to 12% above spot at launch. No strike in that band, no write.`,
    key: true,
  },
  {
    title: `Buyers fill on ${VENUE_NAME}`,
    when: "until Fri 20:00 UTC",
    body: `USDG lands in the same transaction: 95% to the vault, 5% to ${VENUE_NAME}. Or nobody buys.`,
    key: true,
  },
  {
    title: "The week closes",
    when: "from Sat 20:00 UTC",
    body: `Unassigned ${MARKET} comes back, assigned ${MARKET} as strike USDG. The keeper closes at expiry; an hour later, anyone can.`,
  },
  {
    title: "You claim USDG",
    when: "whenever you like",
    body: "Premium net of fees, and any strike proceeds, wait in your balance. No deadline.",
  },
];

type Point = { title: string; body: string };

/** Docs: product/fees.md, product/policy.md, protocol/roles.md, getting-started/withdrawing.md. */
const BENEFITS: readonly Point[] = [
  {
    title: "Paid in USDG",
    body: "Premium arrives as USDG, tracked per share and never folded into your shares. No protocol token, no points, no airdrop at launch.",
  },
  {
    title: "Hands off",
    body: "The keeper writes, lists and closes each week inside the vault's policy. You deposit once and check in when you like.",
  },
  {
    title: "Fees only on premium",
    body: `Callhouse takes 5% of the premium the vault receives, capped at 20% in the contracts. Nothing on deposits, idle ${MARKET} or strike proceeds.`,
  },
  {
    title: "Every week published",
    body: "Once the vault is live, each closed week is published in the app with its real figures: filled, unfilled or assigned, zeros included. No projections.",
  },
  {
    title: "Two ways out",
    body: "Withdraw instantly while the vault is idle, or queue during a week and settle at the close. Closing the week does not depend on the keeper.",
  },
  {
    title: "Limits in the code",
    body: "The 1% strike floor, the 20% fee ceiling and the one-token lot size are compiled in. The keeper and guardian cannot move a token.",
  },
];

/** Docs: product/risks.md. The risks page carries the full list. */
const RISKS: readonly Point[] = [
  {
    title: "Weeks can pay nothing",
    body: "Premium is paid only if a buyer fills. On a thin book an unfilled week is the most likely outcome, and no dealer is obliged to buy.",
  },
  {
    title: "Assignment caps your upside",
    body: `If ${MARKET} runs past the strike, collateral leaves at the strike for USDG, even in a week the vault sold nothing. v1 does not buy it back.`,
  },
  {
    title: "Withdrawals wait for the close",
    body: "While a call is open, a withdrawal is queued, cannot be cancelled, and settles at the close, partly in USDG if the week was assigned.",
  },
  {
    title: "Late deposits share the week",
    body: "A deposit while a call is open is priced at face value and shares that week's result, including any assignment.",
  },
  {
    title: "Stock Tokens are not shares",
    body: "They are debt securities of Robinhood Assets (Jersey) Limited, with no vote or claim on Nvidia, and you carry the issuer's credit risk. The issuer can freeze transfers, which can hold up the close.",
  },
  {
    title: "Unaudited contracts",
    body: `The vault has had only an internal review, by the people who wrote it. There is no proxy, so a fix means a new vault. The 20 ${MARKET} launch cap is sized to that.`,
  },
  {
    title: "Settings can change",
    body: "The admin can change the strike band and the fee inside the compiled caps, and the deposit cap with no ceiling, at any time and with no timelock. At launch the admin is a single key.",
  },
  {
    title: "Third parties in the path",
    body: `${VENUE_NAME} runs the cycle and the book, Valorem settles assignment and USDG pays out; the vault cannot override any of them. An oracle pause stops writes and listings, never settlement.`,
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
            Deposit tokenised stocks into a vault. Each week it sells covered calls against them on {VENUE_NAME} and
            credits what buyers actually pay, less fees, in USDG for you to claim. The first vault holds {MARKET}.
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
            <Figure label="Launch cap" value={`20 ${MARKET}`} />
          </dl>

          <Notice variant="plain" className="mt-[26px]">
            Premium is paid only if a buyer fills. Assignment can take the collateral at the strike. Stock Tokens are
            debt securities, not Nvidia shares. Not deployed and not audited yet.
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
          intro={`Timing comes from ${VENUE_NAME}'s registry, not a calendar you have to watch. The keeper does the routine work; the contracts make sure nobody needs the keeper to get the week closed.`}
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

      {/* ------------------------------------------------------------------ why callhouse */}
      <Section id="benefits" labelledBy="benefits-h">
        <SectionHead
          id="benefits-h"
          eyebrow="Why Callhouse"
          title="A covered call desk you don't have to run."
          intro="Selling calls yourself means picking strikes, posting orders and watching expiries. Callhouse does that on a published policy with its limits compiled into the contracts, and publishes every result, including the weeks that pay nothing."
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
          eyebrow="Three endings"
          title="Every week ends one of three ways."
          intro={`Knowing all three before you deposit is the whole point. Which one you get is decided by the order book and by what holders of the week's calls do, not by the vault or a price feed. Pick one to see what happens to premium and to the ${MARKET} behind it.`}
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
            The risks page also covers partial assignment, keeper failure, USDG, the Valorem fee switch and an outage
            near the Friday book close.
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
              Read the risks first. Once the vault is live, connect a wallet in the app on {CHAIN_NAME} and deposit{" "}
              {MARKET}, the first vault, up to the cap. This site never asks for a wallet.
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
