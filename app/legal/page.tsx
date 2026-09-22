/**
 * Compliance surface, not marketing. Nothing on this page sells anything, and the register is
 * legal text rather than the plain-but-warm voice of the landing.
 *
 * This is the CANONICAL copy of the disclosures. app.stonkhouse.fun is noindex; stonkhouse.fun is
 * the indexed domain, so this is the version a stranger, a search engine or a regulator reads
 * first. The two disclosures it is required to carry — the US-person perimeter and the legal
 * form of the Stock Token — are required verbatim by disclosure policy. NOTHING CHECKS THIS AUTOMATICALLY since copy-lint was removed on 2026-09-21, so
 * the wording can drift. Do not reword, soften or tidy up a sentence here without checking the
 * disclosure policy and the app twin; "not available to US persons" and
 * "Robinhood Assets (Jersey) Limited" are literal string matches, not sentiments.
 *
 * Keep the geographic restriction and Stock Token form in sync with the dapp's
 * `web/app/legal/page.tsx`. This indexed page also describes v2 buyer and writer flows and links
 * to the fuller mechanics and risks on this domain. Cross-links to /activity use appUrl().
 *
 * DELIBERATELY ABSENT: no wallet, no chain read, no "I accept" button, no geo gate and no
 * cookie banner. Access is restricted by the Terms of Use at /terms and not by a technical
 * control, which the page says outright and links; shipping a checkbox here would imply a
 * perimeter that does not exist. Whether use-based acceptance is defensible for this perimeter
 * is a counsel question, tracked in stonkhousedotfun/callhouse: `ops/launch-legal.md`.
 *
 * The "Reporting a vulnerability" section at the bottom is the `Policy:` target of
 * /.well-known/security.txt (app/.well-known/security.txt/route.ts) and stonkhousedotfun/callhouse:
 * `SECURITY.md` §6 points here too. It renders the security contact from lib/legal.ts or says there
 * is none yet; it does not invent one. This section has no twin on the dapp's
 * web/app/legal/page.tsx — the disclosure address belongs on the indexed domain, once.
 */
import type { Metadata } from "next";

import { NOT_YET_DESIGNATED, SECURITY_CONTACT_EMAIL } from "@/lib/legal";
import { FEES_V2, delayHours, feePct } from "@/lib/site";

import {
  Callout,
  DOC_LINK,
  Code,
  DocLink,
  DocList,
  DocSection,
  LegalDocument,
  type TocEntry,
} from "./_components/LegalDocument";

const DESCRIPTION =
  "Geographic restrictions, Stock Token debt securities, buyer option costs and writer collateral on Robinhood Chain.";

export const metadata: Metadata = {
  title: "Legal",
  description: DESCRIPTION,
  alternates: { canonical: "/legal" },
  openGraph: {
    title: "Legal — Stonkhouse",
    description: DESCRIPTION,
    url: "/legal",
    siteName: "Stonkhouse",
    type: "article",
  },
};

/**
 * The page's h2s, in render order. The section list and the headings both read from here, so the
 * two cannot drift. "reporting" is the /legal#reporting anchor security.txt and SECURITY.md cite.
 */
const SECTIONS = {
  geographic: { id: "geographic-restrictions", title: "Geographic restrictions" },
  stockToken: { id: "stock-token", title: "What a Stock Token is" },
  share: { id: "vault-share", title: "Options and collateral" },
  noAdvice: { id: "no-advice", title: "No advice, no guarantee" },
  noAffiliation: { id: "no-affiliation", title: "No affiliation" },
  reporting: { id: "reporting", title: "Reporting a vulnerability" },
} as const satisfies Record<string, TocEntry>;

export default function LegalPage() {
  return (
    <LegalDocument
      eyebrow="Legal"
      title="Who this is for, and what Stock Tokens actually are"
      toc={Object.values(SECTIONS)}
    >
      <p>
        This explanatory disclosure is not one of the adopted legal documents. The in-force{" "}
        <DocLink href="/terms">Terms of Use</DocLink> and{" "}
        <DocLink href="/privacy">privacy notice</DocLink> are separate pages.
      </p>

      {/* The two phrases below are required, verbatim, by disclosure policy (copy-lint removed 2026-09-21).
          They come from README "Frontend copy" and are compliance text. Do not reword. */}
      <Callout tone="bad">
        <strong>This interface is not available to US persons.</strong>
        The same perimeter applies as to the underlying Stock Tokens. If you are a US person, or you
        are accessing this from a jurisdiction where these instruments are not offered, do not use
        this interface.
      </Callout>

      <DocSection {...SECTIONS.geographic}>
        <DocList>
          <li>
            Stonkhouse is <strong>not available to US persons</strong>, and nothing on this site is an
            offer or solicitation to any person in any jurisdiction where such an offer would be
            unlawful.
          </li>
          <li>
            Robinhood Chain Stock Tokens are offered outside the United States under their issuer&apos;s
            own terms and eligibility rules. Those rules govern whether you may hold the collateral at
            all; this interface does not widen them and cannot waive them.
          </li>
          <li>
            Access is restricted by the <DocLink href="/terms">Terms of Use</DocLink>, not by a technical
            control. You are responsible for your own eligibility, and for any tax or reporting
            consequence of using this interface.
          </li>
          <li>
            No know-your-customer process is run here, and none is implied. This is a permissionless
            smart contract on a public chain.
          </li>
        </DocList>
      </DocSection>

      <DocSection {...SECTIONS.stockToken}>
        <DocList>
          <li>
            The Stock Token underlying these options is a debt security issued by{" "}
            <strong>Robinhood Assets (Jersey) Limited</strong>. Stock Tokens are debt securities issued
            by that entity. They are not shares in the underlying company.
          </li>
          <li>
            Holding one gives you <strong>no shareholder rights</strong>: no vote, no direct claim on
            the underlying company, and no direct relationship with it.
          </li>
          <li>
            You carry <strong>issuer credit risk</strong> on Robinhood Assets (Jersey) Limited. If the
            issuer fails, the token&apos;s value does not survive independently of it.
          </li>
          <li>
            The issuer can <strong>freeze or restrict transfers</strong>. That may delay a writer&apos;s
            deposit or withdrawal and a buyer&apos;s in-kind payout. V2 settlement uses its own
            oracle sources and can be delayed when they are missing or disputed. A paused token
            price feed can also stop new series or orders. No Stonkhouse contract can override an issuer freeze.
          </li>
          <li>
            Corporate actions — splits, dividend adjustments — are expressed through an ERC-8056
            display multiplier rather than by rebasing balances. The app shows the adjusted figure
            clearly labelled as display-only; accounting uses raw balances.
          </li>
        </DocList>
      </DocSection>

      <DocSection {...SECTIONS.share}>
        <DocList>
          <li>
            A buyer pays premium and a capped taker fee for a long option. That full cost can be
            lost if the contract expires worthless. A writer locks Stock Tokens or USDG as
            collateral in the v2 Clearinghouse and chooses how much to offer. These option
            tokens are not pooled vault shares or shares in the underlying company.
          </li>
          <li>
            There is no points programme or airdrop for buying or writing these options.
          </li>
          <li>
            The replacement design is not active before broadcast. When active, a writer receives
            premium only when a buyer fills an order. An unfilled order earns no premium; a first sale
            pays {feePct(FEES_V2.premiumBps)} of its premium and a true resale pays {feePct(FEES_V2.resalePremiumBps)}. The collateral-based rate launches at
            zero, and a change for new series requires {delayHours(FEES_V2.marketFeeChangeDelayHours)}&apos; on-chain notice. A call that
            finishes in the money transfers upside above the strike to the buyer. The buyer&apos;s payout
            may arrive in Stock Tokens if conversion to USDG fails.{" "}
            <DocLink href="/risks">The risks page</DocLink> carries the full risk list, and{" "}
            <DocLink href="/how-it-works">how it works</DocLink> describes the cycle those outcomes come from.
          </li>
        </DocList>
      </DocSection>

      <DocSection {...SECTIONS.noAdvice}>
        <DocList>
          <li>
            Nothing on this site is investment, legal, tax or accounting advice, and nothing here is an
            offer of securities.
          </li>
          <li>
            No external audit report has been published for the Stonkhouse smart contracts.
            An external audit is pending. The contracts are provided as-is, with no warranty of any
            kind. Published source files carry their own license notices. Buyers can lose their
            full cost and writers can lose collateral value.
          </li>
          <li>
            Past weekly results describe what has already happened and say nothing about what any future week will do.
          </li>
        </DocList>
      </DocSection>

      <DocSection {...SECTIONS.noAffiliation}>
        <p>
          Stonkhouse is an independent project. It is not affiliated with, endorsed by, or operated by
          Robinhood Markets, Inc., Robinhood Assets (Jersey) Limited, Valorem, or the issuers of USDG or
          Seaport. Valorem and Seaport are part of legacy v1 accounts during run-off; the v2 path uses
          its Clearinghouse and OrderBook. Those names identify third-party contracts and services.
        </p>
      </DocSection>

      <DocSection {...SECTIONS.reporting}>
        <p>
          If you believe you have found a vulnerability in the contracts or either domain, do not
          post it publicly.{" "}
          {SECURITY_CONTACT_EMAIL ? (
            <>
              Send it to <a className={DOC_LINK} href={`mailto:${SECURITY_CONTACT_EMAIL}`}>{SECURITY_CONTACT_EMAIL}</a>.
              The same address is published, machine-readably, at{" "}
              <a className={DOC_LINK} href="/.well-known/security.txt">/.well-known/security.txt</a>.
            </>
          ) : (
            <>
              Disclosure address: <strong>{NOT_YET_DESIGNATED}</strong>. No mailbox for reports
              exists yet, and for that reason <Code>/.well-known/security.txt</Code> returns 404
              rather than a file with no contact line. Setting one is a launch step.
            </>
          )}{" "}
          No bug bounty is active and no external audit report has been published, so a report is a
          favour, not a claim.
        </p>
        <p>
          The <DocLink href="/terms">Terms of Use</DocLink> and the <DocLink href="/privacy">privacy notice</DocLink>{" "}
          are separate pages
          .
        </p>
      </DocSection>
    </LegalDocument>
  );
}
