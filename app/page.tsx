/**
 * stonkhouse.fun/ — the product landing. What Stonkhouse is, who it is for, and where it is
 * in its life: beta, one NVDA vault first, more Stock Token vaults later, pending audit.
 *
 * This page is not the vault. The week in detail, the policy table and the endings live on
 * /how-it-works. The unabridged failure list lives on /risks. "Open the app" goes to the app
 * frontpage, not /vault/nvda.
 *
 * One job: leave a reader who skims only the first screen with an ACCURATE expectation. Premium
 * arrives only if somebody buys the call, assignment can take the collateral, the token is a debt
 * security, we are in beta, and the contracts are unaudited with an external audit pending. The
 * hero's disclosure line says the three required phrases next to the headline, not in a footer.
 *
 * Three phrases are required verbatim in THIS file by scripts/copy-lint.mjs:
 *   "Premium is paid only if a buyer fills"
 *   "Assignment can take the collateral at the strike"
 *   "Stock Tokens are debt securities"
 *
 * DELIBERATELY ABSENT: wallet code, chain reads, live figures, any forward-looking return, and
 * any figure scaled past one week. Roadmap items are product steps, not yield.
 */
import type { Metadata } from "next";
import Link from "next/link";

import { FeeSlip } from "@/app/_components/FeeSlip";
import { StatusCard } from "@/app/_components/StatusCard";
import {
  Button,
  CheckCircleIcon,
  Chip,
  ClockNote,
  Container,
  Figure,
  Notice,
  Section,
  SectionHead,
  WarnIcon,
} from "@/components/ui";
import { WEEK } from "@/lib/clock";
import { fmtPct } from "@/lib/format";
import { CHAIN_NAME, MARKET, OPEN_APP, SHARE_TICKER, STATUS } from "@/lib/site";

const TITLE = `Stonkhouse — pooled covered calls on ${MARKET} Stock Tokens`;

const DESCRIPTION = `Stonkhouse is a pooled covered-call vault for tokenised stocks on ${CHAIN_NAME}. The first vault is ${MARKET}. Each week it lists covered calls and writes them only when a buyer fills. Premium is paid only if a buyer fills. Beta, pending audit.`;

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

const WHAT_WE_DO: readonly { title: string; body: string }[] = [
  {
    title: "Deposit tokenised stock",
    body: `${MARKET} Stock Tokens in, ${SHARE_TICKER} shares out. You keep a claim on the stock in the vault. More vaults, one stock each, follow this one.`,
  },
  {
    title: "The vault lists covered calls",
    body: `Each week it offers calls about ${fmtPct(5)} above spot, up to ${fmtPct(95)} of the stock, and writes a call only in the same transaction a buyer pays for it. A week with no buyer writes nothing.`,
  },
  {
    title: "You claim USDG",
    body: `Premium, less a ${fmtPct(5)} protocol fee, and any strike proceeds from assignment, wait in your balance. No deadline, and nothing is folded back into your shares.`,
  },
];

const STEPS: readonly { title: string; when: string; body: string; key?: boolean }[] = [
  {
    title: "You deposit",
    when: "until the Friday close",
    body: `${MARKET} in, ${SHARE_TICKER} out, priced at the stock behind each share.`,
  },
  {
    title: "The vault lists the week",
    when: "from the start of the week",
    body: `A call about ${fmtPct(5)} above spot, inside a ${fmtPct(3)} to ${fmtPct(12)} band. Nothing is written yet.`,
    key: true,
  },
  {
    title: "A buyer fills — then a call is written",
    when: "until Friday 4:00pm",
    body: "Each fill writes exactly the calls bought and pays USDG in the same transaction. Or nobody buys.",
    key: true,
  },
  {
    title: "The week closes",
    when: "from Saturday 4:00pm",
    body: `Unassigned ${MARKET} comes back. Assigned ${MARKET} comes back as strike USDG.`,
  },
  {
    title: "You claim USDG",
    when: "whenever you like",
    body: "Premium net of the fee, and any strike proceeds. No deadline.",
  },
];

const BENEFITS: readonly { title: string; body: string }[] = [
  {
    title: "Paid in USDG",
    body: "Premium arrives as USDG, tracked per share, never folded into your shares. No protocol token, no points, no airdrop at launch.",
  },
  {
    title: "Hands off",
    body: "The keeper sets, lists and closes each week inside a published policy. You deposit once and check in when you like.",
  },
  {
    title: "Fees only on premium",
    body: `Stonkhouse takes ${fmtPct(5)} of the premium buyers pay, capped at ${fmtPct(20)} in the contracts. Nothing on deposits, idle stock or strike proceeds.`,
  },
  {
    title: "Every week published",
    body: "Once live, each closed week is published with its real figures: filled, unfilled or assigned, zeros included. No projections.",
  },
];

const RISKS: readonly { title: string; body: string }[] = [
  {
    title: "Weeks can pay nothing",
    body: "Premium is paid only if a buyer fills. On a thin book an unfilled week is the most likely outcome.",
  },
  {
    title: "Assignment caps your upside",
    body: `If ${MARKET} runs past the strike, collateral behind sold calls leaves at the strike for USDG. v1 does not buy it back.`,
  },
  {
    title: "Stock Tokens are not shares",
    body: "They are debt securities of Robinhood Assets (Jersey) Limited, with no vote or claim on Nvidia. The issuer can freeze transfers.",
  },
  {
    title: "Beta, pending audit",
    body: `The vault is unaudited: internal reviews only, no external report yet. An external audit is pending. The 20 ${MARKET} launch cap is sized to that.`,
  },
];

type RoadmapStep = {
  when: string;
  title: string;
  body: string;
  current?: boolean;
};

const ROADMAP: readonly RoadmapStep[] = [
  {
    when: "Now",
    title: "Beta, NVDA first",
    current: true,
    body: `Public beta on ${CHAIN_NAME}. One vault, ${MARKET}, write-on-fill covered calls, a ${fmtPct(5)} fee on premium, a 20 ${MARKET} cap. ${STATUS.audit}.`,
  },
  {
    when: "Next",
    title: "External audit",
    body: "An external audit of the vault. The report is published on this site. The cap stays where it is until that report lands.",
  },
  {
    when: "Then",
    title: "Four published weeks",
    body: "Four closed weeks on the public record, unfilled weeks included, before the cap moves. A week that paid nothing is a row like any other.",
  },
  {
    when: "Later",
    title: "More stock vaults",
    body: "Additional Stock Token vaults, one underlying each, same weekly cycle and the same rules. NVDA is first, not the product.",
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
          <div className="flex flex-wrap gap-2">
            <Chip tone="accent" dot wrap>
              {STATUS.phase} · {CHAIN_NAME}
            </Chip>
            <Chip tone="warn" wrap>
              {STATUS.audit}
            </Chip>
          </div>
          <h1
            id="hero-h"
            className="mt-5 text-[length:clamp(40px,5.6vw,66px)] font-extrabold leading-[1.02] tracking-[-0.035em]"
          >
            Covered calls on tokenised stocks. <em className="not-italic text-accent">NVDA first.</em>
          </h1>
          <p className="mt-[22px] max-w-[34em] text-[19px] text-ink-2">
            Stonkhouse is a pooled vault: you deposit a tokenised stock, and each week it lists covered calls against
            that stock. A call is written only when a buyer pays for it. You claim whatever premium actually fills,
            less the fee, in USDG. The first vault is {MARKET}. More stocks follow, one vault each.
          </p>

          <div className="mt-[30px] flex flex-wrap gap-3">
            <Button href={OPEN_APP}>Open the app</Button>
            <Button variant="ghost" href="/how-it-works">
              See how a week runs
            </Button>
          </div>

          <dl className="mt-9 flex flex-wrap gap-x-7 gap-y-4">
            <Figure label="Status" value={STATUS.phase} mono={false} />
            <Figure label="First vault" value={MARKET} />
            <Figure label="You claim" value="USDG" tone="usdg" />
            <Figure label="Protocol fee" value={`${fmtPct(5)} of premium`} />
          </dl>

          <Notice variant="plain" className="mt-[26px]">
            Premium is paid only if a buyer fills. Assignment can take the collateral at the strike. Stock Tokens are
            debt securities, not Nvidia shares. Beta. The contracts are unaudited; an external audit is pending.
          </Notice>
        </div>

        <StatusCard />
      </Container>

      {/* ------------------------------------------------------------------ what we do */}
      <Section id="what" labelledBy="what-h">
        <SectionHead
          id="what-h"
          eyebrow="What we do"
          title="A covered-call desk you don't have to run."
          intro="Selling calls yourself means picking strikes, posting orders and watching expiries. Stonkhouse does that on a published policy, and publishes every result, including the weeks that pay nothing."
        />
        <ol className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {WHAT_WE_DO.map((item, i) => (
            <li key={item.title}>
              <span className="num grid size-11 place-items-center rounded-full border-2 border-accent bg-accent text-[15px] font-bold text-accent-ink">
                {i + 1}
              </span>
              <h3 className="mt-4 text-[19px] font-bold tracking-[-0.015em]">{item.title}</h3>
              <p className="mt-2 text-[15.5px] text-ink-2">{item.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* ------------------------------------------------------------------ first vault */}
      <Section id="vaults" labelledBy="vaults-h">
        <SectionHead
          id="vaults-h"
          eyebrow="Vaults"
          title="NVDA now. Other stocks next."
          intro="Launch is one vault, one stock. The product is built for a row of them — each with its own collateral, its own week, its own share token — not a basket."
        />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <article className="rounded-lg border border-accent/30 bg-accent-soft p-[26px]">
            <Chip tone="accent" dot>
              Live first
            </Chip>
            <h3 className="mt-4 text-[26px] font-extrabold tracking-[-0.02em]">{MARKET}</h3>
            <p className="mt-2 max-w-[34em] text-[15.5px] text-ink-2">
              Nvidia Stock Tokens, shares of {SHARE_TICKER}. Launch cap 20 {MARKET}, protocol fee {fmtPct(5)} of
              premium, strike about {fmtPct(5)} above spot inside a {fmtPct(3)}–{fmtPct(12)} band. Same week, every
              week, New York time.
            </p>
            <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Figure label="Share token" value={SHARE_TICKER} />
              <Figure label="Launch cap" value="20" unit={MARKET} />
              <Figure label="Sold at most" value={fmtPct(95)} />
              <Figure label="Book closes" value="Friday 4:00pm" unit="NY" />
            </dl>
          </article>
          <article className="rounded-lg border border-dashed border-line-2 bg-surface p-[26px]">
            <Chip>Next</Chip>
            <h3 className="mt-4 text-[26px] font-extrabold tracking-[-0.02em] text-ink-2">More stocks</h3>
            <p className="mt-2 max-w-[34em] text-[15.5px] text-ink-2">
              Additional Stock Token vaults on {CHAIN_NAME}, one underlying each, after NVDA is live and the audit
              report is public. We will not name the next ticker until that vault is actually being built.
            </p>
            <p className="mt-5 text-[14px] text-ink-3">
              Same design: deposit the token, weekly covered calls, claim USDG. No multi-asset pool, no points.
            </p>
          </article>
        </div>
      </Section>

      {/* ------------------------------------------------------------------ how it works */}
      <Section id="how" labelledBy="how-h">
        <SectionHead
          id="how-h"
          eyebrow="How a week runs"
          title="Five steps, the same every week."
          intro={`The book closes with the US market on ${WEEK.close}. The keeper does the routine work; the contracts make sure nobody needs the keeper to get the week closed.`}
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

        <ClockNote className="mt-10" />

        <p className="mt-6">
          <Link href="/how-it-works" className="link font-semibold text-accent-text">
            The full week, the policy limits and the contract addresses
            <span aria-hidden="true"> →</span>
          </Link>
        </p>
      </Section>

      {/* ------------------------------------------------------------------ why stonkhouse */}
      <Section id="benefits" labelledBy="benefits-h">
        <SectionHead
          id="benefits-h"
          eyebrow="Why Stonkhouse"
          title="Policy in the contracts, results on the record."
          intro="Limits are compiled in. Premium is a fill, or it is zero. The fee slip is one rehearsal week, labelled as one, not a quote."
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

      {/* ------------------------------------------------------------------ roadmap */}
      <Section id="roadmap" labelledBy="roadmap-h">
        <SectionHead
          id="roadmap-h"
          eyebrow="Roadmap"
          title="Where Stonkhouse is going."
          intro="Product steps, not a return. Nothing here is a date, a ticker we have not started, or a figure for a week that has not closed."
        />
        <ol className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          {ROADMAP.map((step) => (
            <li
              key={step.title}
              className={
                step.current
                  ? "rounded-lg border border-accent/30 bg-accent-soft p-5"
                  : "rounded-lg border border-line bg-surface p-5"
              }
            >
              <p className="font-body text-[12.5px] font-bold uppercase tracking-[0.1em] text-accent-text">
                {step.when}
              </p>
              <h3 className="mt-3 text-[18.5px] font-bold tracking-[-0.015em]">{step.title}</h3>
              <p className="mt-2 text-[14.5px] text-ink-2">{step.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* ------------------------------------------------------------------ risks */}
      <Section id="risks" labelledBy="risks-h">
        <SectionHead
          id="risks-h"
          eyebrow="Before you deposit"
          title="What can go wrong."
          intro={
            <p>
              The short list. The full list, with what the contracts do about each one, is on{" "}
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
            Also on the risks page: a fill refused after a rally, a claim stranded at the close, withdrawals during a
            week, keeper failure, USDG, and the Valorem fee switch.
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
              Start with NVDA. Let the week run.
            </h2>
            <p className="mt-2.5 max-w-[34em] text-ground/75">
              Stonkhouse is in beta, and an external audit is pending. Read the risks first. The app is on {CHAIN_NAME}.
              This site never asks for a wallet.
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
