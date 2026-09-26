/**
 * The Neon front page.
 * Buyer-first.
 *
 * WHAT IS REAL. Public API values are checked in lib/live.ts: the ticker cards print only a spot from /v2/markets
 * (getSpots), else their not-ready state, and the live contract cards render only for a non-empty validated feed.
 * No "example" labels and no warning copy. The hero's example ticket is gone (its figures
 * existed only as an example); the payoff demo is kept as an interactive chart; the owner card's fee table is the
 * product's own fee terms on a 1.00 ask (FEES_V2). The API publishes no day change, so the ticker cards carry none.
 *
 * PHONE (A-Phone-Landing): the hero, a compact static payoff card and the two CTAs lead; the large interactive demo is
 * the desktop section.
 */
import type { Metadata } from "next";
import Link from "next/link";

import { PayoffCard } from "@/app/_components/PayoffCard";
import { PayoffCompactCard, PayoffDemo } from "@/app/_components/PayoffDemo";
import { Button, Chip, Container, Panel, Section, SectionHead } from "@/components/ui";
import { LocalTime } from "@/components/ui/LocalTime";
import { notReadyTickers, ownerFeeRows, tickerCardView } from "@/lib/frontPage";
import { getCards, getSpots, getStats } from "@/lib/live";
import { appUrl, CHAIN_NAME, DEV_CARDS_ENABLED, DEV_PREVIEW, LAUNCH_SET } from "@/lib/site";

const TITLE = "Stonkhouse — small bets on big stocks";
const DESCRIPTION = "Daily and weekly calls on Stock Tokens from 0.01 share. The most you can lose is what you pay up front.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/", siteName: "Stonkhouse", type: "website" },
};

const BUY_STEPS = [
  { title: "Pick a contract", body: "Choose a stock, a day and a strike. Every contract shows its full cost up front." },
  { title: "Pay the premium", body: "Pay the premium and a small capped fee. That total is the most you can lose." },
  { title: "Get paid", body: "If your call finishes above the strike, you get paid after the close, in USDG when it can be swapped." },
] as const;

export default async function HomePage() {
  const showCardsFeed = DEV_PREVIEW ? DEV_CARDS_ENABLED : true;
  const [spots, cards, stats] = showCardsFeed
    ? await Promise.all([getSpots(), getCards(), getStats()])
    : [null, null, null] as const;
  const appAction = "See today's contracts";
  const tickers = spots ? spots.map(tickerCardView) : notReadyTickers(LAUNCH_SET);
  const fees = ownerFeeRows();

  return <>
    <Container as="section" aria-labelledby="hero-h"
      className="grid grid-cols-1 items-center gap-9 pb-[72px] pt-4 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:gap-14 lg:pt-10">
      <div>
        <Chip tone="accent" dot wrap>{`${LAUNCH_SET.join(" · ")} live on ${CHAIN_NAME}`}</Chip>
        <h1 id="hero-h" className="mt-5 text-[length:clamp(56px,7.5vw,96px)] font-extrabold leading-[0.92] tracking-[-0.055em]">
          Small bets on<br />big stocks.
        </h1>
        <p className="mt-6 max-w-[35em] text-[17px] text-ink-2 sm:text-[19px]">
          Daily and weekly calls on Stock Tokens, from 0.01 share. See your max loss before you buy.
          <span className="max-sm:hidden"> Or hold the stock and get paid to sell calls.</span>
        </p>
        <div className="mt-6 sm:hidden"><PayoffCompactCard /></div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href={appUrl("/")}>{appAction}</Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 max-sm:hidden">
        <ul className="grid grid-cols-2 gap-3" aria-label="Launch markets">
          {tickers.map((t) => <li key={t.ticker}>
            <Panel pad="sm" data-slot="ticker-card" data-ready={t.price ? "yes" : "no"}>
              <p className="text-[15px] font-extrabold">{t.ticker}</p>
              <p className="truncate text-xs text-ink-3">{t.name}</p>
              <p className="mt-3 text-[28px] font-extrabold leading-none tracking-[-0.03em]">{t.price ?? "—"}</p>
              <p className="mt-1 text-xs text-ink-3">
                {t.note}
                {t.updatedAt !== null ? <> · <LocalTime at={t.updatedAt} dateless /></> : null}
              </p>
            </Panel>
          </li>)}
        </ul>
      </div>
    </Container>

    {cards && cards.length > 0 ? <Section id="contracts" labelledBy="contracts-h">
      <SectionHead id="contracts-h" eyebrow="Contracts" title="See the payoff before you buy."
        intro="A call pays when its stock finishes above the strike. Each card shows the full cost, fees included." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => <PayoffCard key={card.series.longId} card={card} />)}
      </div>
    </Section> : null}

    <Section id="demo" labelledBy="demo-h" className="max-sm:hidden">
      <SectionHead id="demo-h" eyebrow="Try a scenario" title="Move the price. Watch it pay."
        intro="The same fee-net maths as the app." />
      <PayoffDemo />
    </Section>

    <Section id="how" labelledBy="how-h">
      <SectionHead id="how-h" eyebrow="How it works" title="Three steps to a call." />
      <ol className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {BUY_STEPS.map((step, i) => <li key={step.title} className="rounded-lg border border-line bg-surface p-6">
          <span className="num text-sm font-bold text-accent-text">0{i + 1}</span>
          <h3 className="mt-4 text-xl font-extrabold">{step.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-2">{step.body}</p>
        </li>)}
      </ol>
      <Link href="/how-it-works" className="link mt-3 inline-block font-semibold text-accent-text">Read how it works →</Link>
    </Section>

    {stats ? <Section id="proof" labelledBy="proof-h">
      <SectionHead id="proof-h" eyebrow="On the record" title="What has happened so far." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Panel><p className="text-sm text-ink-2">Contracts filled</p><p className="num mt-2 text-3xl font-semibold">{BigInt(stats.contractsFilled).toLocaleString("en-US")}</p></Panel>
        {stats.biggestWinWeek ? <Panel><p className="text-sm text-ink-2">Biggest win this week</p>
          <p className="num mt-2 text-3xl font-semibold">{stats.biggestWinWeek.multiple.toFixed(2)}×</p>
          <p className="mt-1 text-xs text-ink-3">{stats.biggestWinWeek.ticker} · closed-position return</p>
        </Panel> : null}
      </div>
    </Section> : null}

    <Container as="section" aria-labelledby="writers-h">
      {/* The old accent-filled card was hard to read. Surface card, ink text, accent only on the
          eyebrow, the key number and the button; readable in both colour schemes. */}
      <div data-slot="owner-card" className="mb-[72px] mt-4 grid grid-cols-1 items-start gap-8 rounded-[24px] border border-line bg-surface px-[22px] py-[30px] shadow-soft sm:p-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-accent-text">For stock owners</p>
          <h2 id="writers-h" className="mt-3 max-w-[16em] text-[length:clamp(30px,3.6vw,44px)] font-extrabold leading-[1.05] tracking-[-0.035em] text-ink">Own the stock? Get paid to sell calls.</h2>
          <p className="mt-4 max-w-[34em] text-[16px] text-ink-2">Set your ask and let auto-roll line up the next contract. You get the premium when a buyer fills.</p>
          <Button className="mt-6" href={showCardsFeed ? appUrl("/earn") : "/how-it-works#write"}>
            {showCardsFeed ? "Explore Earn" : "How writing works"}
          </Button>
        </div>
        <div className="rounded-[18px] border border-line bg-surface-2 p-5" data-slot="owner-fees">
          <p className="text-sm font-bold text-ink">Fees on a {fees.ask} USDG ask</p>
          <dl className="mt-3 text-sm">
            {fees.rows.map((row) => <div key={row.label} className="flex justify-between gap-4 border-b border-line py-2.5">
              <dt className="text-ink-2">{row.label}</dt><dd className="num font-semibold text-ink">{row.value}</dd>
            </div>)}
            <div className="flex justify-between gap-4 pt-3"><dt className="font-bold text-ink">Writer receives</dt><dd className="num text-lg font-extrabold text-accent-text">{fees.writerReceives} USDG</dd></div>
          </dl>
          <Link href="/how-it-works#fees" className="link mt-3 inline-block text-sm font-semibold text-accent-text">Full fee schedule →</Link>
        </div>
      </div>
    </Container>
  </>;
}
