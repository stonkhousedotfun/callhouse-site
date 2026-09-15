/**
 * stonkhouse.fun/ — the product landing. Say each fact once. The week in detail is /how-it-works;
 * the failure list is /risks. "Open the app" goes to the app frontpage, not /vault/nvda.
 *
 * One job: a skimmer of the first screen leaves with an accurate expectation. The hero's
 * disclosure line carries the three required phrases next to the headline, not in a footer.
 *
 * LIVE STATE (2026-09-15): the vault 0x88a9…ecbb and its Clear 0x53d7…9C6 are deployed on chain 4663.
 * The keeper prices in vol mode: strike at delta about 0.15 from Cboe's delayed NVDA chain, clamped
 * 5% to 11.5% inside the 3% to 12% band. Addresses live on /how-it-works#contracts.
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
import { Button, CheckCircleIcon, Chip, ClockNote, Container, Notice, Section, SectionHead } from "@/components/ui";
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

const STEPS: readonly { title: string; when: string; body: string; key?: boolean }[] = [
  {
    title: "You deposit",
    when: "until the Friday close",
    body: `${MARKET} in, ${SHARE_TICKER} out.`,
  },
  {
    title: "The vault lists the week",
    when: "from the start of the week",
    body: `A call ${fmtPct(5)} to 11.5% above spot, up to ${fmtPct(95)} of the stock. Nothing is written yet.`,
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

const ROADMAP: readonly { when: string; title: string; body: string; current?: boolean }[] = [
  {
    when: "Now",
    title: "Beta, NVDA live",
    current: true,
    body: `The ${MARKET} vault is on ${CHAIN_NAME}, capped at 20.`,
  },
  {
    when: "Next",
    title: "External audit",
    body: "A report on this site. The cap stays until it lands.",
  },
  {
    when: "Then",
    title: "Four published weeks",
    body: "Zeros included, on the public record, before the cap moves.",
  },
  {
    when: "Later",
    title: "More stock vaults",
    body: "One underlying each, same week, same rules. We will not name the next ticker until that vault is being built.",
  },
];

export default function HomePage() {
  return (
    <>
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
            Deposit a tokenised stock. Each week the vault lists covered calls against it and writes a call only when a
            buyer pays. You claim the premium in USDG.
          </p>

          <div className="mt-[30px] flex flex-wrap gap-3">
            <Button href={OPEN_APP}>Open the app</Button>
            <Button variant="ghost" href="/how-it-works">
              See how a week runs
            </Button>
          </div>

          <Notice variant="plain" className="mt-[26px]">
            Premium is paid only if a buyer fills. Assignment can take the collateral at the strike. Stock Tokens are
            debt securities, not Nvidia shares. The contracts are unaudited; an external audit is pending.
          </Notice>
        </div>

        <StatusCard />
      </Container>

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
            Policy, phases and addresses
            <span aria-hidden="true"> →</span>
          </Link>
        </p>
      </Section>

      <Section id="benefits" labelledBy="benefits-h">
        <SectionHead
          id="benefits-h"
          eyebrow="Why Stonkhouse"
          title="Hands off, and on the record."
          intro="The fee slip is one rehearsal week, labelled as one, not a quote."
        />

        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <ul className="grid gap-[34px]">
            <li>
              <h3 className="flex items-center gap-2.5 text-[19px] font-bold tracking-[-0.015em]">
                <CheckCircleIcon className="shrink-0 text-accent" />
                Hands off
              </h3>
              <p className="mt-2 text-[15.5px] text-ink-2">
                The keeper sets, lists and closes each week inside a published policy. You deposit once and check in
                when you like. No protocol token, no points, no airdrop.
              </p>
            </li>
            <li>
              <h3 className="flex items-center gap-2.5 text-[19px] font-bold tracking-[-0.015em]">
                <CheckCircleIcon className="shrink-0 text-accent" />
                Every week published
              </h3>
              <p className="mt-2 text-[15.5px] text-ink-2">
                The app&apos;s activity page lists each week the vault arms, zeros included. A week the keeper skips
                leaves no row. No projections.
              </p>
            </li>
          </ul>

          <FeeSlip />
        </div>
      </Section>

      <Section id="roadmap" labelledBy="roadmap-h">
        <SectionHead
          id="roadmap-h"
          eyebrow="Roadmap"
          title="Where Stonkhouse is going."
          intro="Product steps, not a return."
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

      <Container as="section" aria-labelledby="cta-h">
        <div className="mb-[72px] mt-4 flex flex-wrap items-center justify-between gap-7 rounded-[28px] bg-ink px-[22px] py-[30px] text-ground sm:p-12 [&_:focus-visible]:outline-ground">
          <div>
            <h2
              id="cta-h"
              className="max-w-[18em] text-[length:clamp(28px,3.4vw,40px)] font-bold leading-[1.08] tracking-[-0.03em] text-ground"
            >
              Deposit, and let the week run.
            </h2>
            <p className="mt-2.5 max-w-[34em] text-ground/75">This site never asks for a wallet.</p>
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
