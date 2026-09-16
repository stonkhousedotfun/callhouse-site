/**
 * stonkhouse.fun/how-it-works — the week in short. Deposit, offer, get paid or keep the stock.
 *
 * This is the public sibling of the dapp's /docs. No wallet, no live chain reads. The app at
 * app.stonkhouse.fun is where a week is listed and bought.
 */
import type { Metadata } from "next";
import Link from "next/link";

import { Button, Container, ExternalLink, Section, SectionHead } from "@/components/ui";
import { WEEK } from "@/lib/clock";
import {
  ADDRESSES,
  CHAIN_ID,
  DOCS_URL,
  MARKET,
  OPEN_APP,
  VAULT_APP,
  addressUrl,
  appUrl,
} from "@/lib/site";

const DESCRIPTION = `Put ${MARKET} in. Choose how much is for sale. If someone pays, you get USDG. If they don't, you keep the stock.`;

export const metadata: Metadata = {
  title: "How it works",
  description: DESCRIPTION,
  alternates: { canonical: "/how-it-works" },
  openGraph: {
    title: "How it works — Stonkhouse",
    description: DESCRIPTION,
    url: "/how-it-works",
    siteName: "Stonkhouse",
    type: "article",
  },
};

const STEPS = [
  { title: "Put your stock in", body: `Deposit ${MARKET} into your own account. Idle tokens can come out until you list.` },
  { title: "Choose how much is for sale", body: "Whole lots only. Only that amount can be sold. The rest stays yours." },
  {
    title: "Someone pays you — or they don't",
    body: `If they buy, you get paid in USDG minus 5%, in your wallet, on the fill. If they don't, you keep the stock. Sales stop at ${WEEK.close}.`,
  },
  {
    title: "The week ends",
    body: `From ${WEEK.expiry}, unsold stock unlocks. Assigned lots pay the strike into the account. Collect that USDG whenever you like.`,
  },
] as const;

const CONTRACTS = [ADDRESSES.factory, ADDRESSES.implementation, ADDRESSES.asset, ADDRESSES.usdg, ADDRESSES.clear, ADDRESSES.seaport] as const;

export default function HowItWorksPage() {
  return (
    <>
      <Section>
        <SectionHead
          level={1}
          eyebrow="How it works"
          title="Your stock. Your offer. Your money."
          intro={<p>{DESCRIPTION}</p>}
        />
        <ol className="mt-8 grid gap-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="rounded-lg border border-line bg-surface p-5">
              <p className="text-[12.5px] font-bold uppercase tracking-[0.1em] text-accent-text">
                {i + 1}
              </p>
              <h2 className="mt-2 text-[18px] font-bold tracking-[-0.015em]">{step.title}</h2>
              <p className="mt-1.5 text-[15px] text-ink-2">{step.body}</p>
            </li>
          ))}
        </ol>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button href={VAULT_APP}>Open your account</Button>
          <Button variant="ghost" href={appUrl("/book")}>
            Buy this week
          </Button>
        </div>
      </Section>

      <Section id="contracts" labelledBy="contracts-h">
        <SectionHead
          id="contracts-h"
          eyebrow="Contracts"
          title="What a week touches on chain."
          intro={<p>Robinhood Chain {CHAIN_ID}.</p>}
        />
        <ul className="grid grid-cols-1 gap-x-12 lg:grid-cols-2">
          {CONTRACTS.map((row) => (
            <li key={row.label} className="grid gap-1 border-t border-line py-5">
              <h3 className="text-[17px] font-bold tracking-[-0.01em]">{row.label}</h3>
              <p className="text-[15px] text-ink-2">{row.what}</p>
              <ExternalLink
                href={addressUrl(row.address)}
                className="link mt-1 w-fit max-w-full break-all font-mono text-[13px] text-ink-2 hover:text-ink"
              >
                {row.address}
              </ExternalLink>
            </li>
          ))}
        </ul>
      </Section>

      <Container className="mb-[72px] mt-4">
        <div className="flex flex-wrap items-center justify-between gap-7 rounded-[28px] bg-ink px-[22px] py-[30px] text-ground sm:p-12 [&_:focus-visible]:outline-ground">
          <h2 className="max-w-[18em] text-[length:clamp(28px,3.4vw,40px)] font-extrabold leading-[1.08] tracking-[-0.03em] text-ground">
            Let your stonks work for you.
          </h2>
          <Button href={OPEN_APP}>Open the app</Button>
        </div>
        <p className="mt-6 max-w-[60em] text-[14px] text-ink-3">
          Read{" "}
          <Link href="/risks" className="link text-ink-2">
            the risks
          </Link>{" "}
          and{" "}
          <Link href="/legal" className="link text-ink-2">
            the legal page
          </Link>
          . Stock Tokens are debt securities issued by Robinhood Assets (Jersey) Limited, not shares. The full
          reference is in{" "}
          <ExternalLink href={DOCS_URL} className="link text-ink-2">
            the docs
          </ExternalLink>
          .
        </p>
      </Container>
    </>
  );
}
