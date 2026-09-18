import { Panel } from "@/components/ui";
import type { LiveCard } from "@/lib/live";
import { cardSentence } from "@/lib/payoff";
import { appUrl } from "@/lib/site";

function exact(raw: string): string {
  const value = BigInt(raw);
  const fraction = (value % 1_000_000n).toString().padStart(6, "0").replace(/0+$/, "");
  return `${(value / 1_000_000n).toString()}${fraction ? `.${fraction}` : ""}`;
}

export function PayoffCard({ card, featured = false }: { card: LiveCard; featured?: boolean }) {
  // perShare walks the entire ask book. The best ask level alone may contain fewer than
  // 100 units even when the API has a valid one-share quote across several levels.
  const oneShare = card.perShare !== null;
  const quote = oneShare ? card.perShare! : card.perUnit;
  const units = oneShare ? 100n : 1n;
  const sentence = cardSentence(card, units, {
    cost: BigInt(quote.cost.raw), payout: BigInt(quote.payoutAtTarget.raw),
  });
  const date = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "America/New_York" })
    .format(new Date(card.series.expiry * 1000));
  return <Panel as="article" lift={featured} className="flex h-full min-w-0 flex-col justify-between gap-6">
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-ink-2">
        <strong className="font-display text-lg text-ink">{card.series.ticker} {card.series.isPut ? "put" : "call"}</strong>
        <span>{date} · ${exact(card.series.strike.raw)} strike</span>
      </div>
      <p className="num mt-5 text-[length:clamp(34px,4vw,48px)] font-semibold leading-none tracking-[-0.03em] text-accent-text">
        {quote.multiple.toFixed(2)}×
      </p>
      <p className="mt-2 text-sm text-ink-2">{card.series.isPut ? "At" : "Estimated at"} ${exact(card.target.raw)} at expiry · {oneShare ? "1 share" : "0.01 share"}</p>
      <p className="mt-5 text-sm leading-relaxed text-ink">{sentence}</p>
      {!card.series.isPut ? <p className="mt-2 text-xs text-ink-3">Winning calls are owed Stock Tokens. USDG conversion may deliver less or fall back to tokens.</p> : null}
    </div>
    <a className="link w-fit text-sm font-semibold text-accent-text" href={appUrl(`/${card.series.ticker.toLowerCase()}/${card.series.longId}`)}>
      See this contract <span aria-hidden="true">→</span>
    </a>
  </Panel>;
}
