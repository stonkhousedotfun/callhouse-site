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
  V8_ADDRESSES,
  V8_DEPLOY_BLOCK,
  listedExpiriesSentence,
  listTickers,
  type AddressRow,
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
  { title: "Pay the option cost", body: "Pay the ask premium plus a small capped fee in USDG. That is the most you can lose." },
  { title: "Get paid after the close", body: "Once the closing price is set, the contract pays out. A bot does this for you; anyone can trigger it." },
] as const;
const WRITE_STEPS = [
  { title: "Offer covered calls", body: "Deposit Stock Tokens or USDG collateral into the v2 Clearinghouse and choose a strike, expiry, size and ask. A preset can fill in the starting terms." },
  { title: "Get paid on a fill", body: `You get the premium when a buyer takes your order. The fee is ${feePct(FEES_V2.premiumBps)} of a first-sale premium and ${feePct(FEES_V2.resalePremiumBps)} on a resale.` },
  { title: "Manage the next expiry", body: "If a call finishes in the money, upside above the strike belongs to its buyer. Auto-roll can prepare the next order, but you keep control of strategy settings and collateral." },
] as const;
const CONTRACTS: readonly AddressRow[] = [
  ADDRESSES.usdg,
  ...Object.values(V8_ADDRESSES),
];

export default function HowItWorksPage() {
  const writingReady = DEV_PREVIEW ? DEV_CARDS_ENABLED : true;
  return <>
    <Section bordered={false}>
      <SectionHead level={1} eyebrow="How it works" title="A small cost. A known maximum loss."
        intro={<p>{DESCRIPTION}</p>} />
      <p className="max-w-[58em] text-ink-2">Stonkhouse lists options on Robinhood Chain Stock Tokens. The launch set is {LAUNCH_SET.length} markets, {listTickers(LAUNCH_SET)}{REGISTRY_MARKET_COUNT === LAUNCH_SET.length ? ", and they are the only markets Stonkhouse lists" : `; the registry holds ${REGISTRY_MARKET_COUNT} rows in all`}; availability and quotes are shown in the app. Stock Tokens are debt securities, not shares.</p>
      <aside aria-label="Market availability" className="mt-6 flex max-w-[58em] flex-col gap-1 rounded-md border border-line bg-surface-2 px-4 py-3 sm:flex-row sm:items-baseline sm:gap-4">
        <p className="num shrink-0 font-bold text-accent-text">{listTickers(LAUNCH_SET)} on {CHAIN_NAME}</p>
        <p className="text-sm text-ink-2">Live now. Quotes and trading are in the app.</p>
      </aside>
      <div className="mt-7 flex flex-wrap gap-3"><Button href={appUrl("/")}>Buy a contract</Button><Button variant="ghost" href={writingReady ? appUrl("/earn") : "#write"}>{writingReady ? "Explore writing" : "How writing works"}</Button></div>
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
        intro={<p>Daily and weekly contracts expire at 16:00 New York time on a market session day. {listedExpiriesSentence()} A 30-minute window supplies the averaged settlement price. {listTickers(LAUNCH_SET)} each have two price sources. Withdrawal times and settlement are answered step by step in the <Link href="/faq" className="link">FAQ</Link>.</p>} />
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel><h3 className="text-lg font-bold">The price is set</h3><p className="mt-2 text-sm text-ink-2">When both price sources agree, the price is final about two minutes after the close. If only one source has a price, it is final six hours later. If neither has one, an administrator can set it only after the guardian has publicly held it and a week has passed.</p></Panel>
        <Panel><h3 className="text-lg font-bold">You get paid</h3><p className="mt-2 text-sm text-ink-2">Once the price is final, the contract pays every holder. A bot does this for you, and anyone can trigger it. If a payment cannot be sent, it waits in your balance to withdraw.</p></Panel>
        <Panel><h3 className="text-lg font-bold">Calls and puts</h3><p className="mt-2 text-sm text-ink-2">{listTickers(LAUNCH_SET)} list calls only. Where a market lists puts, they are backed by USDG and pay USDG. Calls are backed by Stock Tokens and pay in USDG when the swap goes through, otherwise in Stock Tokens. You can also choose to be paid in Stock Tokens.</p></Panel>
      </div>
    </Section>

    <Section id="fees" labelledBy="fees-h">
      <SectionHead id="fees-h" eyebrow="Fees" title="The full stack, before you trade."
        intro="Every fee, up front." />
      <dl className="grid gap-3 md:grid-cols-2">
        <Panel><dt className="font-bold">Writer collateral charge</dt><dd className="mt-2 text-2xl font-semibold text-accent-text">{writerCollateralHeadline(FEES_V2.writerCollateralRatePpm)}</dd><p className="mt-2 text-sm text-ink-2">Zero at launch. Any change needs {FEES_V2.marketFeeChangeDelayHours} hours&apos; notice on chain.</p></Panel>
        <Panel><dt className="font-bold">First-sale premium fee</dt><dd className="num mt-2 text-2xl font-semibold text-accent-text">{FEES_V2.premiumBps / 100}%</dd><p className="mt-2 text-sm text-ink-2">Taken from the writer&apos;s premium when a newly written option sells. A true resale of an existing long is {FEES_V2.resalePremiumBps / 100}%.</p></Panel>
        <Panel><dt className="font-bold">Taker fee</dt><dd className="num mt-2 text-2xl font-semibold text-accent-text">{takerFeeCapHeadline(FEES_V2.takerFlatRaw)}</dd><p className="mt-2 text-sm text-ink-2">The lesser of {Number(FEES_V2.takerFlatRaw) / 1_000_000} USDG or {FEES_V2.takerCapBps / 100}% of the filled premium, once per take; an account-specific discount may reduce it. {feePct(FEES_V2.makerRebateBps)} of it goes to the maker whose order filled, as a rebate.</p></Panel>
        <Panel><dt className="font-bold">Exercise fee</dt><dd className="num mt-2 text-2xl font-semibold text-accent-text">{FEES_V2.exerciseBps / 100}%</dd><p className="mt-2 text-sm text-ink-2">Based on collateral and taken in kind from an in-the-money payout, never more than {FEES_V2.exercisePayoutCapBps / 100}% of that payout. The rate is set when a series is created.</p></Panel>
      </dl>
      <p className="mt-5 max-w-[65em] text-sm text-ink-2">General fee changes have {FEES_V2.feeChangeDelayHours} hours&apos; notice; exercise and collateral-rate changes have {FEES_V2.marketFeeChangeDelayHours} hours&apos; notice. Each take includes a maximum total fee, so a transaction reverts instead of accepting a higher taker-side total.</p>
    </Section>

    <Section id="write" labelledBy="write-h">
      <SectionHead id="write-h" eyebrow="For stock owners" title="Own the stock? Write the call."
        intro="Writers can set their own ask, use a preset, or configure an auto-roll strategy. The collateral behind what you offer is what an in-the-money finish can pay away." />
      <ol className="grid gap-4 lg:grid-cols-3">{WRITE_STEPS.map((step, i) => <li key={step.title} className="rounded-lg border border-line bg-surface p-6">
        <span className="num text-sm font-bold text-accent-text">0{i + 1}</span>
        <h3 className="mt-4 text-xl font-bold">{step.title}</h3><p className="mt-2 text-sm text-ink-2">{step.body}</p>
      </li>)}</ol>
      <p className="mt-6 max-w-[65em] text-sm text-ink-2">There is no assignment: at settlement the holder&apos;s in-the-money value is paid out of the writer&apos;s collateral, and the rest of the collateral comes back in kind. For calls that is a net share amount rather than an all-or-nothing share sale. Unfilled orders can be cancelled.</p>
    </Section>

    <Section id="contracts" labelledBy="contracts-h">
      <SectionHead id="contracts-h" eyebrow="Contracts" title="The v9 contracts on Robinhood Chain."
        intro={<p>Robinhood Chain {CHAIN_ID}. USDG, then the v9 contracts deployed at block {V8_DEPLOY_BLOCK.toLocaleString("en-US")}. Each one whose source is verified on the explorer links to it; one that is not verified yet says so. </p>} />
      <ul className="grid gap-x-12 lg:grid-cols-2">{CONTRACTS.map((row) => <li key={row.label} className="border-t border-line py-5">
        <h3 className="font-bold">{row.label}</h3><p className="mt-1 text-sm text-ink-2">{row.what}</p>
        {row.address ? <ExternalLink href={addressUrl(row.address)} className="link num mt-2 block break-all text-xs text-accent-text">{row.address}</ExternalLink>
          : <p className="mt-2 text-sm font-semibold text-warn">Pending public release</p>}
        {row.sourceUrl ? <ExternalLink href={row.sourceUrl} className="link mt-1 block text-xs">Verified source<span className="sr-only"> for {row.label}</span></ExternalLink>
          : row.verified ? <p className="mt-1 text-xs text-ink-2">{row.verified}</p> : null}
      </li>)}</ul>
    </Section>

  </>;
}
