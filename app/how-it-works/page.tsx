/** The public v2 explanation for both buyers and stock-owning writers. */
import type { Metadata } from "next";
import Link from "next/link";

import { Button, Container, ExternalLink, Panel, Section, SectionHead } from "@/components/ui";
import { takerFeeCapHeadline, writerCollateralHeadline } from "@/lib/fees";
import {
  ADDRESSES,
  CHAIN_ID,
  CHAIN_NAME,
  DEV_CARDS_ENABLED,
  DEV_PREVIEW,
  FEES_V2,
  REGISTRY_MARKET_COUNT,
  addressUrl,
  appUrl,
  feePct,
  LAUNCH_SET,
  listTickers,
} from "@/lib/site";

const DESCRIPTION = "Choose a call, see its total cost and maximum loss, and receive a payout after settlement when it finishes in the money. Stock owners can set asks and write covered calls.";
export const metadata: Metadata = {
  title: "How it works",
  description: DESCRIPTION,
  alternates: { canonical: "/how-it-works" },
  openGraph: { title: "How it works — Stonkhouse", description: DESCRIPTION, url: "/how-it-works", siteName: "Stonkhouse", type: "article" },
};

const BUY_STEPS = [
  { title: "Pick a contract", body: "Browse a stock, strike and expiry. Each card states a price scenario, the fee-net payout and the most you can lose." },
  { title: "Pay the option cost", body: "Pay the ask premium plus a capped taker fee in USDG. That is your maximum loss on the option; network gas is extra. Most options expire worthless." },
  { title: "Wait for settlement", body: "After the oracle finalises the price, anyone can settle the series and then redeem holders. A cranker can automate this." },
] as const;
const WRITE_STEPS = [
  { title: "Offer covered calls", body: "Deposit Stock Tokens or USDG collateral into the v2 Clearinghouse and choose a strike, expiry, size and ask. A preset can fill in the starting terms." },
  { title: "Get paid on a fill", body: `A premium is paid only if a buyer takes your order. The replacement design takes a ${feePct(FEES_V2.premiumBps)} fee from that first-sale premium; a true resale is ${feePct(FEES_V2.resalePremiumBps)}, and an unfilled ask earns no premium.` },
  { title: "Manage the next expiry", body: "If a call finishes in the money, upside above the strike belongs to its buyer. Auto-roll can prepare the next order, but you keep control of strategy settings and collateral." },
] as const;
const CONTRACTS = [
  ADDRESSES.usdg,
] as const;

export default function HowItWorksPage() {
  const writingReady = DEV_PREVIEW ? DEV_CARDS_ENABLED : true;
  return <>
    <Section bordered={false}>
      <SectionHead level={1} eyebrow="How it works" title="A small cost. A known maximum loss."
        intro={<p>{DESCRIPTION}</p>} />
      <p className="max-w-[58em] text-ink-2">Stonkhouse lists options on Robinhood Chain Stock Tokens. The launch set is {LAUNCH_SET.length} markets, {listTickers(LAUNCH_SET)}; the registry holds {REGISTRY_MARKET_COUNT} rows in all, and availability and quotes are shown in the app. Stock Tokens are debt securities, not shares.</p>
      <aside aria-label="Market availability" className="mt-6 flex max-w-[58em] flex-col gap-1 rounded-md border border-line bg-surface-2 px-4 py-3 sm:flex-row sm:items-baseline sm:gap-4">
        <p className="num shrink-0 font-bold text-accent-text">{listTickers(LAUNCH_SET)} on {CHAIN_NAME}</p>
        <p className="text-sm text-ink-2">Live means registered and enabled, not that a quote or fill is available. The launch is {listTickers(LAUNCH_SET)} only. The other {REGISTRY_MARKET_COUNT - LAUNCH_SET.length} registry markets are not part of the launch and nothing here promises them a date.</p>
      </aside>
      <div className="mt-7 flex flex-wrap gap-3"><Button href={appUrl("/")}>{DEV_PREVIEW ? "Open dev app" : "Buy a contract"}</Button><Button variant="ghost" href={writingReady ? appUrl("/earn") : "#write"}>{writingReady ? "Explore writing" : "How writing works"}</Button></div>
    </Section>

    <Section id="buy" labelledBy="buy-h">
      <SectionHead id="buy-h" eyebrow="For buyers" title="Buy a call in three steps." />
      <ol className="grid gap-4 lg:grid-cols-3">{BUY_STEPS.map((step, i) => <li key={step.title} className="rounded-lg border border-line bg-surface p-6">
        <span className="num text-sm font-bold text-accent-text">0{i + 1}</span>
        <h3 className="mt-4 text-xl font-bold">{step.title}</h3><p className="mt-2 text-sm text-ink-2">{step.body}</p>
      </li>)}</ol>
      <Panel as="aside" className="mt-6"><h3 className="text-lg font-bold">What a call pays</h3>
        <p className="mt-2 text-sm text-ink-2">If the averaged settlement price is above the strike, the buyer receives the net in-the-money value for each 0.01-share unit. If it is at or below the strike, the payout is zero. Your maximum option loss is the premium and taker fee you paid; network gas is extra.</p>
      </Panel>
    </Section>

    <Section id="settlement" labelledBy="settlement-h">
      <SectionHead id="settlement-h" eyebrow="Expiry and payout" title="The market close sets the result."
        intro="Daily and weekly contracts expire at 16:00 New York time on a market session day. A 30-minute window supplies the averaged settlement price. Most markets in the approved 20-market launch use one source and a one-hour candidate wait." />
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel><h3 className="text-lg font-bold">Price is finalised</h3><p className="mt-2 text-sm text-ink-2">For a single-source market, the oracle records a candidate and waits one hour before finalisation; the guardian can hold it. A dual-source market can finalise when both sources agree. If one is missing or they disagree, that market&apos;s configured candidate delay applies.</p></Panel>
        <Panel><h3 className="text-lg font-bold">Redemption is open</h3><p className="mt-2 text-sm text-ink-2">After the oracle finalises a price, anyone can settle the series and then redeem; a caller must submit the transactions and pay gas. A cranker may automate this, but it has no exclusive privilege. A failed transfer becomes a balance in the holder&apos;s ledger.</p></Panel>
        <Panel><h3 className="text-lg font-bold">Calls and puts differ</h3><p className="mt-2 text-sm text-ink-2">Most markets in the approved launch have no qualified USDG conversion route, so an in-the-money call pays Stock Tokens in kind. A routed market attempts bounded USDG conversion and falls back to Stock Tokens if it fails. Puts pay USDG natively when available.</p></Panel>
      </div>
    </Section>

    <Section id="fees" labelledBy="fees-h">
      <SectionHead id="fees-h" eyebrow="Fees" title="The full stack, before you trade."
        intro="These are pre-broadcast settings for the replacement contracts, not a live quote. The app's current quote and series-pinned terms govern an actual order after those contracts are active." />
      <dl className="grid gap-3 md:grid-cols-2">
        <Panel><dt className="font-bold">Writer collateral charge</dt><dd className="mt-2 text-2xl font-semibold text-accent-text">{writerCollateralHeadline(FEES_V2.writerCollateralRatePpm)}</dd><p className="mt-2 text-sm text-ink-2">The replacement contracts keep a bounded per-market rate for new series, but it launches at {FEES_V2.writerCollateralRatePpm} ppm. A change needs {FEES_V2.marketFeeChangeDelayHours} hours&apos; on-chain notice.</p></Panel>
        <Panel><dt className="font-bold">First-sale premium fee</dt><dd className="num mt-2 text-2xl font-semibold text-accent-text">{FEES_V2.premiumBps / 100}%</dd><p className="mt-2 text-sm text-ink-2">Taken from the writer&apos;s premium when a newly written option sells. A true resale of an existing long is {FEES_V2.resalePremiumBps / 100}%.</p></Panel>
        <Panel><dt className="font-bold">Taker fee</dt><dd className="num mt-2 text-2xl font-semibold text-accent-text">{takerFeeCapHeadline(FEES_V2.takerFlatRaw)}</dd><p className="mt-2 text-sm text-ink-2">The lesser of {Number(FEES_V2.takerFlatRaw) / 1_000_000} USDG or {FEES_V2.takerCapBps / 100}% of the filled premium, once per take; an account-specific discount may reduce it.</p></Panel>
        <Panel><dt className="font-bold">Exercise fee</dt><dd className="num mt-2 text-2xl font-semibold text-accent-text">{FEES_V2.exerciseBps / 100}%</dd><p className="mt-2 text-sm text-ink-2">Based on collateral and taken in kind from an in-the-money payout, never more than {FEES_V2.exercisePayoutCapBps / 100}% of that payout. The rate is set when a series is created.</p></Panel>
      </dl>
      <p className="mt-5 max-w-[65em] text-sm text-ink-2">General fee changes have {FEES_V2.feeChangeDelayHours} hours&apos; notice; exercise and collateral-rate changes have {FEES_V2.marketFeeChangeDelayHours} hours&apos; notice. Each take includes a maximum total fee, so a transaction reverts instead of accepting a higher taker-side total.</p>
    </Section>

    <Section id="write" labelledBy="write-h">
      <SectionHead id="write-h" eyebrow="For stock owners" title="Own the stock? Write the call."
        intro="Writers can set their own ask, use a preset, or configure an auto-roll strategy. The amount offered is the amount at risk of assignment." />
      <ol className="grid gap-4 lg:grid-cols-3">{WRITE_STEPS.map((step, i) => <li key={step.title} className="rounded-lg border border-line bg-surface p-6">
        <span className="num text-sm font-bold text-accent-text">0{i + 1}</span>
        <h3 className="mt-4 text-xl font-bold">{step.title}</h3><p className="mt-2 text-sm text-ink-2">{step.body}</p>
      </li>)}</ol>
      <p className="mt-6 max-w-[65em] text-sm text-ink-2">Assignment can take the collateral at the strike. Settlement returns the writer&apos;s remaining collateral in kind: for calls, a net share amount rather than an all-or-nothing share sale. Unfilled orders can be cancelled.</p>
    </Section>

    <Section id="contracts" labelledBy="contracts-h">
      <SectionHead id="contracts-h" eyebrow="Payment asset" title="USDG on Robinhood Chain."
        intro={<p>Robinhood Chain {CHAIN_ID}. Replacement option-contract addresses will be published after deployment and verification.</p>} />
      <ul className="grid gap-x-12 lg:grid-cols-2">{CONTRACTS.map((row) => <li key={row.label} className="border-t border-line py-5">
        <h3 className="font-bold">{row.label}</h3><p className="mt-1 text-sm text-ink-2">{row.what}</p>
        {row.address ? <ExternalLink href={addressUrl(row.address)} className="link num mt-2 block break-all text-xs text-accent-text">{row.address}</ExternalLink>
          : <p className="mt-2 text-sm font-semibold text-warn">Pending public release</p>}
      </li>)}</ul>
    </Section>

    <Container as="section" aria-labelledby="next-h" className="mb-16">
      <div className="rounded-lg bg-ink p-7 text-ground sm:p-10 [&_:focus-visible]:outline-ground">
        <h2 id="next-h" className="text-2xl font-bold text-ground">Read the risks before opening a position.</h2>
        <p className="mt-2 text-sm text-ground/75">A call can expire worthless. Thin books, oracle delays and issuer restrictions can affect an outcome.</p>
        <div className="mt-5 flex flex-wrap gap-4"><Button href="/risks">See the risks</Button><Link href="/legal" className="link self-center text-sm text-ground">Legal details</Link></div>
      </div>
    </Container>
  </>;
}
