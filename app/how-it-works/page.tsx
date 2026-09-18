/** The public v2 explanation for both buyers and stock-owning writers. */
import type { Metadata } from "next";
import Link from "next/link";

import { Button, Container, ExternalLink, Panel, Section, SectionHead } from "@/components/ui";
import { ADDRESSES, CHAIN_ID, DEV_CARDS_ENABLED, DEV_PREVIEW, FEES_V2, REGISTRY_MARKET_COUNT, STATUS, addressUrl, appUrl } from "@/lib/site";

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
  { title: "Get paid on a fill", body: "A premium is paid only if a buyer takes your order. Writing a new option charges collateral rent when it is minted; an unfilled ask that has not been minted pays no rent." },
  { title: "Manage the next expiry", body: "If a call finishes in the money, upside above the strike belongs to its buyer. Auto-roll can prepare the next order, but you keep control of strategy settings and collateral." },
] as const;
const CONTRACTS = [
  ADDRESSES.v2Clearinghouse, ADDRESSES.v2OrderBook, ADDRESSES.v2SettlementOracle,
  ADDRESSES.v2ExpiryCalendar, ADDRESSES.v2PayoutAdapter, ADDRESSES.asset, ADDRESSES.usdg,
] as const;

export default function HowItWorksPage() {
  const writingReady = DEV_PREVIEW ? DEV_CARDS_ENABLED : STATUS.v2 !== "Not released";
  return <>
    <Section bordered={false}>
      <SectionHead level={1} eyebrow="How it works" title="A small cost. A known maximum loss."
        intro={<p>{DESCRIPTION}</p>} />
      <p className="max-w-[58em] text-ink-2">Stonkhouse lists options on Robinhood Chain Stock Tokens. The registry includes {REGISTRY_MARKET_COUNT} markets; availability and quotes are shown in the app. Stock Tokens are debt securities, not shares.</p>
      <div className="mt-7 flex flex-wrap gap-3"><Button href={appUrl("/")}>{DEV_PREVIEW ? "Open dev app" : STATUS.v2 === "Not released" ? "Open current app" : "Buy a contract"}</Button><Button variant="ghost" href={writingReady ? appUrl("/earn") : "#write"}>{writingReady ? "Explore writing" : "How writing works"}</Button></div>
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
        intro="Daily and weekly contracts expire at 16:00 New York time on a market session day. A 30-minute window supplies the averaged settlement price." />
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel><h3 className="text-lg font-bold">Price is finalised</h3><p className="mt-2 text-sm text-ink-2">The oracle uses each market&apos;s configured sources. A market with only one source waits through a candidate delay; disagreement or a guardian hold can delay payment.</p></Panel>
        <Panel><h3 className="text-lg font-bold">Redemption is open</h3><p className="mt-2 text-sm text-ink-2">After the oracle finalises a price, anyone can settle the series and then redeem; a caller must submit the transactions and pay gas. A cranker may automate this, but it has no exclusive privilege. A failed transfer becomes a balance in the holder&apos;s ledger.</p></Panel>
        <Panel><h3 className="text-lg font-bold">Calls and puts differ</h3><p className="mt-2 text-sm text-ink-2">A call payout is owed in Stock Tokens. By default the Clearinghouse attempts a bounded conversion to USDG; if conversion fails, it pays Stock Tokens in kind. Puts pay USDG natively when available.</p></Panel>
      </div>
    </Section>

    <Section id="fees" labelledBy="fees-h">
      <SectionHead id="fees-h" eyebrow="Fees" title="The full stack, before you trade."
        intro="These are planned v2 launch defaults, not live fees. The app's current quote, market rent and series-pinned terms govern an actual order." />
      <dl className="grid gap-3 md:grid-cols-2">
        <Panel><dt className="font-bold">Writer collateral rent</dt><dd className="mt-2 text-2xl font-semibold text-accent-text">Varies</dd><p className="mt-2 text-sm text-ink-2">Charged when an option is minted, based on its locked collateral, market rate and time to expiry. Calls pay in Stock Tokens; puts pay in USDG. The rate is fixed for that series when it is created.</p></Panel>
        <Panel><dt className="font-bold">Primary premium fee</dt><dd className="num mt-2 text-2xl font-semibold text-accent-text">{FEES_V2.premiumBps / 100}%</dd><p className="mt-2 text-sm text-ink-2">Planned launch default on a first sale. Rent is charged separately from premium.</p></Panel>
        <Panel><dt className="font-bold">Taker fee</dt><dd className="num mt-2 text-2xl font-semibold text-accent-text">0.10 USDG cap</dd><p className="mt-2 text-sm text-ink-2">The lesser of {Number(FEES_V2.takerFlatRaw) / 1_000_000} USDG or {FEES_V2.takerCapBps / 100}% of the filled premium, once per take.</p></Panel>
        <Panel><dt className="font-bold">Exercise fee</dt><dd className="num mt-2 text-2xl font-semibold text-accent-text">{FEES_V2.exerciseBps / 100}%</dd><p className="mt-2 text-sm text-ink-2">Based on collateral and taken in kind from an in-the-money payout, never more than {FEES_V2.exercisePayoutCapBps / 100}% of that payout. The rate is set when a series is created.</p></Panel>
      </dl>
      <p className="mt-5 max-w-[65em] text-sm text-ink-2">If someone brings the matching long and short together and closes before expiry, unused rent is returned to whoever closes, in the collateral asset. The initial charge and refund can differ because time has passed and amounts are rounded. Rent still held at settlement goes to the protocol; there is no refund at or after expiry.</p>
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
      <SectionHead id="contracts-h" eyebrow="Contracts" title="What makes a v2 trade work."
        intro={<p>Robinhood Chain {CHAIN_ID}. Public production v2 addresses remain pending until the owner verifies a separate release deployment.</p>} />
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
