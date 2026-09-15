/**
 * stonkhouse.fun/ — the product landing. Plain English. The week in detail is /how-it-works;
 * the failure list is /risks. "Open the app" goes to the app frontpage.
 *
 * Three phrases are required verbatim in THIS file by scripts/copy-lint.mjs:
 *   "Premium is paid only if a buyer fills"
 *   "Assignment can take the collateral at the strike"
 *   "Stock Tokens are debt securities"
 */
import type { Metadata } from "next";
import Link from "next/link";

import { FeeSlip } from "@/app/_components/FeeSlip";
import { StatusCard } from "@/app/_components/StatusCard";
import { Button, CheckCircleIcon, Chip, Container, Notice, Section, SectionHead } from "@/components/ui";
import { CHAIN_NAME, MARKET, OPEN_APP, STATUS } from "@/lib/site";

const TITLE = "Stonkhouse — let your stonks work for you";

const DESCRIPTION = `Put your ${MARKET} to work. Each week someone can pay you for the chance to buy it at a set price. If they don't, you keep the stock.`;

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
    title: "Put your stock in",
    when: "your account",
    body: `Deposit ${MARKET}.`,
  },
  {
    title: "Choose how much is for sale",
    when: "you pick the amount",
    body: "Only that amount can be sold. The rest stays yours.",
    key: true,
  },
  {
    title: "Someone pays you — or they don't",
    when: "until Friday 4:00pm",
    body: "If they buy, you get paid. If they don't, you keep the stock.",
    key: true,
  },
  {
    title: "The week ends",
    when: "from Saturday 4:00pm",
    body: "Unsold stock comes back. Sold stock comes back as cash at the agreed price.",
  },
  {
    title: "You keep what you earned",
    when: "whenever you like",
    body: "Minus our 5%.",
  },
];

const ROADMAP: readonly { when: string; title: string; body: string; current?: boolean }[] = [
  {
    when: "Now",
    title: MARKET,
    current: true,
    body: CHAIN_NAME,
  },
  {
    when: "Later",
    title: "More stocks",
    body: "We will not name the next ticker until we are building it.",
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
          </div>
          <h1
            id="hero-h"
            className="mt-5 text-[length:clamp(40px,5.6vw,66px)] font-extrabold leading-[1.02] tracking-[-0.035em]"
          >
            Let your stonks work for you.{" "}
            <em className="not-italic text-accent">{MARKET} first.</em>
          </h1>
          <p className="mt-[22px] max-w-[34em] text-[19px] text-ink-2">
            Put your {MARKET} in. Each week, someone can pay you for the chance to buy it at a set price. If they
            don&apos;t, you keep the stock. If they do, you get paid that price.
          </p>

          <div className="mt-[30px] flex flex-wrap gap-3">
            <Button href={OPEN_APP}>Open the app</Button>
            <Button variant="ghost" href="/how-it-works">
              See how a week runs
            </Button>
          </div>

          <Notice variant="plain" className="mt-[26px]">
            Premium is paid only if a buyer fills. Assignment can take the collateral at the strike. Stock Tokens are
            debt securities, not Nvidia shares.
          </Notice>
        </div>

        <StatusCard />
      </Container>

      <Section id="how" labelledBy="how-h">
        <SectionHead id="how-h" eyebrow="How a week runs" title="Five steps. Same every week." />

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

        <p className="mt-6">
          <Link href="/how-it-works" className="link font-semibold text-accent-text">
            The full week
            <span aria-hidden="true"> →</span>
          </Link>
        </p>
      </Section>

      <Section id="benefits" labelledBy="benefits-h">
        <SectionHead
          id="benefits-h"
          eyebrow="Why Stonkhouse"
          title="Your stock. Your week."

        />

        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <ul className="grid gap-[34px]">
            <li>
              <h3 className="flex items-center gap-2.5 text-[19px] font-bold tracking-[-0.015em]">
                <CheckCircleIcon className="shrink-0 text-accent" />
                Only what you offer
              </h3>
              <p className="mt-2 text-[15.5px] text-ink-2">
                You choose how much of your {MARKET} is for sale each week. The rest cannot be taken.
              </p>
            </li>
            <li>
              <h3 className="flex items-center gap-2.5 text-[19px] font-bold tracking-[-0.015em]">
                <CheckCircleIcon className="shrink-0 text-accent" />
                Every week on the record
              </h3>
              <p className="mt-2 text-[15.5px] text-ink-2">
                Weeks that pay nothing are published too. No projections.
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
        />
        <ol className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
              Let your stonks work for you.
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
