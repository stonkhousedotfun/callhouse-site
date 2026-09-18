/** Buyer-first v2 landing. Public API values are checked in lib/live.ts; examples are labelled. */
import type { Metadata } from "next";
import Link from "next/link";

import { FeeSlip } from "@/app/_components/FeeSlip";
import { PayoffCard } from "@/app/_components/PayoffCard";
import { PayoffDemo } from "@/app/_components/PayoffDemo";
import { Button, Chip, Container, Notice, Panel, Section, SectionHead } from "@/components/ui";
import { EXAMPLE_MULTIPLE, EXAMPLE_PAYOFF, EXAMPLE_PAYOUT, EXAMPLE_TAKE, formatUsdg } from "@/lib/examplePayoff";
import { getCards, getHero, getStats } from "@/lib/live";
import { cardSentence } from "@/lib/payoff";
import { appUrl, CHAIN_NAME, DEV_CARDS_ENABLED, DEV_PREVIEW, STATUS } from "@/lib/site";

const TITLE = "Stonkhouse — small bets on big stocks";
const DESCRIPTION = "Explore Stock Token options with a known maximum option loss: the premium and taker fee you pay. Network gas is extra. See labelled payoff scenarios and live contracts when available.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/", siteName: "Stonkhouse", type: "website" },
};

function ExampleCard() {
  return <Panel as="article" lift className="flex h-full flex-col justify-between gap-6">
    <div>
      <p className="text-sm font-bold uppercase tracking-wider text-accent-text">Example · not a live quote</p>
      <h2 className="mt-3 text-xl font-bold">{EXAMPLE_PAYOFF.ticker} call · ${formatUsdg(EXAMPLE_PAYOFF.strike)} strike</h2>
      <p className="num mt-5 text-[length:clamp(38px,5vw,58px)] font-semibold leading-none tracking-[-0.03em] text-accent-text">
        {EXAMPLE_MULTIPLE?.toFixed(2)}×
      </p>
      <p className="mt-2 text-sm text-ink-2">Estimated value if NVDA finishes at ${formatUsdg(EXAMPLE_PAYOFF.target)} at expiry</p>
      <p className="mt-5 text-sm leading-relaxed text-ink">
        Pay {formatUsdg(EXAMPLE_TAKE.cost)} USDG for 1 share of calls. Estimated settlement value: {formatUsdg(EXAMPLE_PAYOUT)} USDG in this example scenario.
        Max loss: {formatUsdg(EXAMPLE_TAKE.cost)} USDG.
      </p>
      <p className="mt-2 text-xs text-ink-3">Winning calls are owed Stock Tokens. USDG conversion may deliver less or fall back to tokens. Network gas is extra.</p>
    </div>
    <span className="text-xs text-ink-3">Example arithmetic includes the taker and exercise fees.</span>
  </Panel>;
}

const BUY_STEPS = [
  { title: "Pick a card", body: "Choose a stock, strike and expiry. Each card shows a specific price scenario and the full cost." },
  { title: "Pay the premium", body: "Pay the premium and the capped taker fee. That total is the most you can lose." },
  { title: "See the outcome", body: "A winning call is owed Stock Tokens after settlement. USDG conversion is attempted by default and may fall back to tokens." },
] as const;

export default async function HomePage() {
  const showCardsFeed = DEV_PREVIEW ? DEV_CARDS_ENABLED : true;
  const [hero, cards, stats] = showCardsFeed
    ? await Promise.all([getHero(), getCards(), getStats()])
    : [null, null, null] as const;
  const appAction = DEV_PREVIEW ? "Open dev app" : "See today's contracts";
  const heroQuote = hero?.perShare;
  const headline = "Small bets on big stocks. Lose at most what you pay.";
  const heroSentence = hero && heroQuote ? cardSentence(hero, 100n, {
    cost: BigInt(heroQuote.cost.raw), payout: BigInt(heroQuote.payoutAtTarget.raw),
  }) : null;

  return <>
    <Container as="section" aria-labelledby="hero-h"
      className="grid grid-cols-1 items-center gap-9 pb-[72px] pt-4 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:gap-14 lg:pt-10">
      <div>
        <Chip tone="accent" dot wrap>{hero ? `${DEV_PREVIEW ? "Dev contracts" : "Live contracts"} · ${CHAIN_NAME}` : `${STATUS.v2} · ${CHAIN_NAME}`}</Chip>
        <h1 id="hero-h" className="mt-5 text-[length:clamp(40px,5.6vw,66px)] font-extrabold leading-[1.02] tracking-[-0.035em]">
          {headline}
        </h1>
        <p className="mt-6 max-w-[35em] text-[19px] text-ink-2">
          {heroSentence ?? "Explore what a call could pay if a stock rises. The example shows the maths; check the app for live NVDA contracts and quotes."}
        </p>
        {hero && !hero.series.isPut ? <p className="mt-2 max-w-[35em] text-sm text-ink-3">A winning call is owed Stock Tokens. USDG conversion may deliver less or fall back to tokens.</p> : null}
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href={appUrl("/")}>{appAction}</Button>
          <Button variant="ghost" href="#how">How it works</Button>
        </div>
        <Notice variant="plain" className="mt-7">
          Most options expire worthless. Stock Tokens are debt securities, not shares. For buyers, the most you can lose is what you pay for the option: premium plus taker fee. Network gas is extra.
        </Notice>
      </div>
      {hero ? <PayoffCard card={hero} featured /> : <ExampleCard />}
    </Container>

    <Section id="contracts" labelledBy="contracts-h">
      <SectionHead id="contracts-h" eyebrow="Contracts" title="See the payoff before you buy."
        intro="A call can pay when its stock rises above the strike. Each live card includes fees and shows the maximum option loss before network gas." />
      {cards && cards.length > 0 ? <>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => <PayoffCard key={card.series.longId} card={card} />)}
        </div>
        <p className="mt-5 text-sm text-ink-3">Quotes can change before checkout. Check the current price in the app before buying.</p>
      </> : <Panel className="max-w-[620px]">
        <h3 className="text-lg font-bold">{showCardsFeed ? "No v2 cards to show right now" : "v2 contracts are not available yet"}</h3>
        <p className="mt-2 text-sm text-ink-2">The card above is an illustration, not a quote. Try the payoff demo below to see how its outcome changes with the stock price.</p>
        <Link href="#demo" className="link mt-3 inline-block text-sm font-semibold text-accent-text">Try the payoff demo →</Link>
      </Panel>}
    </Section>

    <Section id="demo" labelledBy="demo-h">
      <SectionHead id="demo-h" eyebrow="Try a scenario" title="Move the price. Watch the payoff."
        intro="The curve shows one labelled example with the same fee-net maths used in the app." />
      <PayoffDemo />
    </Section>

    <Section id="how" labelledBy="how-h">
      <SectionHead id="how-h" eyebrow="How it works" title="Three steps to a call." />
      <ol className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {BUY_STEPS.map((step, i) => <li key={step.title} className="rounded-lg border border-line bg-surface p-6">
          <span className="num text-sm font-bold text-accent-text">0{i + 1}</span>
          <h3 className="mt-4 text-xl font-bold">{step.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-2">{step.body}</p>
        </li>)}
      </ol>
      <p className="mt-6 text-sm text-ink-2">Settlement uses an averaged price. See the full flow and risks before placing an order.</p>
      <Link href="/how-it-works" className="link mt-3 inline-block font-semibold text-accent-text">Read how it works →</Link>
    </Section>

    {stats ? <Section id="proof" labelledBy="proof-h">
      <SectionHead id="proof-h" eyebrow="On the record" title="What has happened so far." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Panel><p className="text-sm text-ink-2">Contracts filled</p><p className="num mt-2 text-3xl font-semibold">{BigInt(stats.contractsFilled).toLocaleString("en-US")}</p></Panel>
        {stats.biggestWinWeek ? <Panel><p className="text-sm text-ink-2">Biggest win this week</p>
          <p className="num mt-2 text-3xl font-semibold">{stats.biggestWinWeek.multiple.toFixed(2)}×</p>
          <p className="mt-1 text-xs text-ink-3">{stats.biggestWinWeek.ticker} · realised closed-position return, including resale where applicable; not a typical return</p>
        </Panel> : null}
      </div>
    </Section> : null}

    <Section id="writers" labelledBy="writers-h">
      <SectionHead id="writers-h" eyebrow="For stock owners" title="Own the stock? Get paid to sell calls."
        intro="Set your ask or start from a preset, then let auto-roll prepare the next expiry. You control what you offer." />
      <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <div>
          <p className="text-ink-2">Premium is paid only if a buyer fills. Assignment can take the collateral at the strike. A writer&apos;s upside on sold stock is capped at that strike.</p>
          <Button href={showCardsFeed ? appUrl("/earn") : "/how-it-works#write"} className="mt-6">{showCardsFeed ? "Explore writing" : "How writing works"}</Button>
        </div>
        <FeeSlip />
      </div>
    </Section>

    <Container as="section" aria-labelledby="cta-h">
      <div className="mb-[72px] mt-4 flex flex-wrap items-center justify-between gap-7 rounded-[28px] bg-ink px-[22px] py-[30px] text-ground sm:p-12 [&_:focus-visible]:outline-ground">
        <div>
          <h2 id="cta-h" className="max-w-[18em] text-[length:clamp(28px,3.4vw,40px)] font-bold leading-[1.08] tracking-[-0.03em] text-ground">{showCardsFeed ? "See the contracts for yourself." : "Explore the app."}</h2>
          <p className="mt-2 text-sm text-ground/75">This site never asks for a wallet.</p>
        </div>
        <div className="flex flex-wrap gap-3"><Button href={appUrl("/")}>{appAction}</Button><Button variant="inverse" href="/risks">Read the risks</Button></div>
      </div>
    </Container>
  </>;
}
