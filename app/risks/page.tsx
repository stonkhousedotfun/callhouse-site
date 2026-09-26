/**
 * /risks — what can go wrong for a v2 buyer or writer, in plain words.
 *
 * The v1 legacy-account record (Valorem, Seaport 1-lot listings, the NVDA account
 * weeks) and the page's status chips, audit figure and "what this page is not" panel were removed. One short entry per
 * risk, no likelihoods and no reassurance the contracts do not enforce. The settlement and payout sentences match
 * /how-it-works#settlement; change them together.
 */
import type { Metadata } from "next";

import { Section, SectionHead } from "@/components/ui";
import { FEES_V2 } from "@/lib/site";

const DESCRIPTION = "Buyers can lose what they paid. Writers give up the gain above the strike. Payouts can be late.";

export const metadata: Metadata = {
  title: "Risks",
  description: DESCRIPTION,
  alternates: { canonical: "/risks" },
  openGraph: {
    title: "Risks — Stonkhouse",
    description: DESCRIPTION,
    url: "/risks",
    siteName: "Stonkhouse",
    type: "article",
  },
};

type Risk = { id: string; title: string; body: string };
type RiskGroup = { id: string; eyebrow: string; title: string; risks: readonly Risk[] };

const GROUPS: readonly RiskGroup[] = [
  {
    id: "buyers",
    eyebrow: "Buyers",
    title: "You can lose what you paid.",
    risks: [
      {
        id: "buyer-premium-loss",
        title: "The contract can expire worthless",
        body: "A call pays only if the settlement price ends above the strike, and a put only if it ends below. Otherwise you lose the premium and fee you paid. That is the most you can lose; network gas is extra.",
      },
      {
        id: "thin-book",
        title: "Selling early can be hard",
        body: "There may be no buyer for your contract before expiry, or only a low bid. You can always hold it to expiry.",
      },
      {
        id: "payout-conversion",
        title: "A call can pay in Stock Tokens",
        body: "A call pays in USDG when the swap goes through. If the swap fails, you are paid in Stock Tokens instead.",
      },
    ],
  },
  {
    id: "writers",
    eyebrow: "Writers",
    title: "You give up the upside above the strike.",
    risks: [
      {
        id: "writer-upside",
        title: "A rally goes to the buyer",
        body: `If a call you sold ends above the strike, the buyer gets the gain above the strike out of your collateral. You keep the premium, less the ${FEES_V2.premiumBps / 100}% fee.`,
      },
      {
        id: "no-buyer",
        title: "Your offer may not sell",
        body: "No buyer means no premium. You can cancel an unfilled order.",
      },
      {
        id: "automatic-repricing",
        title: "Smart pricing moves your ask",
        body: "If you turn it on, a bot can change your ask, but only between the minimum and maximum you set. When the market is closed or it has no good estimate, your ask stays where it was.",
      },
    ],
  },
  {
    id: "everyone",
    eyebrow: "Buyers and writers",
    title: "Things outside your trade.",
    risks: [
      {
        id: "settlement-delay",
        title: "Settlement can be late",
        body: "When both price sources agree, the price is final about two minutes after the close. If only one source has a price, it is final six hours later. If neither has one, an administrator can set it only after the guardian has publicly held it and a week has passed, so your payout can wait at least seven days.",
      },
      {
        id: "keeper-delay",
        title: "Payouts need a transaction",
        body: "A bot settles each expiry and pays holders. If it is down, anyone can do it, but your payout may be late.",
      },
      {
        id: "contracts",
        title: "The contracts can have bugs",
        body: "The contracts cannot be upgraded. A bug or a wrong settlement price could cost a buyer what they paid or a writer their collateral.",
      },
      {
        id: "stock-tokens",
        title: "Stock Tokens are not shares",
        body: "Stock Tokens are debt securities issued by Robinhood Assets (Jersey) Limited. The issuer can freeze transfers, which can hold up a payout or a withdrawal.",
      },
    ],
  },
];

export default function RisksPage() {
  return (
    <>
      <Section bordered={false}>
        <SectionHead level={1} eyebrow="Risks" title="What can go wrong." intro={<p>{DESCRIPTION}</p>} />
      </Section>

      {GROUPS.map((group) => (
        <Section key={group.id} id={group.id} labelledBy={`${group.id}-h`}>
          <SectionHead id={`${group.id}-h`} eyebrow={group.eyebrow} title={group.title} />
          <ul className="grid gap-4 lg:grid-cols-2">
            {group.risks.map((risk) => (
              <li key={risk.id} id={risk.id} className="scroll-mt-6 rounded-lg border border-line bg-surface p-6">
                <h3 className="text-lg font-bold">{risk.title}</h3>
                <p className="mt-2 text-sm text-ink-2">{risk.body}</p>
              </li>
            ))}
          </ul>
        </Section>
      ))}
    </>
  );
}
