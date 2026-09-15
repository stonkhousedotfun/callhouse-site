/**
 * Compliance surface, not marketing. Nothing on this page sells anything, and the register is
 * legal text rather than the plain-but-warm voice of the landing.
 *
 * This is the CANONICAL copy of the disclosures. app.stonkhouse.fun is noindex; stonkhouse.fun is
 * the indexed domain, so this is the version a stranger, a search engine or a regulator reads
 * first. The two disclosures it is required to carry — the US-person perimeter and the legal
 * form of the Stock Token — are enforced verbatim by scripts/copy-lint.mjs, which fails CI if
 * the wording drifts. Do not reword, soften or tidy up a sentence here without running that
 * script; "not available to US persons" and "Robinhood Assets (Jersey) Limited" are literal
 * string matches, not sentiments.
 *
 * It mirrors stonkhousedotfun/callhouse: `web/app/legal/page.tsx` and MUST STAY IN SYNC WITH IT. (2026-09-14:
 * the affiliation and "not a claim on" lists dropped the former third-party venue, matching the
 * app's ported page word for word.) A change to
 * one is a change to both, in paired commits across the two repos — two domains carrying two
 * different versions of the same disclosure is worse than either version on its own. The only
 * permitted divergence is cross-links: /activity is a dapp route and is reached with appUrl(),
 * while the risk list and the mechanics are pages on this domain.
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

import { LEGAL_DOCS_ARE_DRAFT, NOT_YET_DESIGNATED, SECURITY_CONTACT_EMAIL } from "@/lib/legal";
import { MARKET, SHARE_TICKER, appUrl } from "@/lib/site";

import {
  Callout,
  DOC_LINK,
  Code,
  DocExternalLink,
  DocLink,
  DocList,
  DocSection,
  LegalDocument,
  type TocEntry,
} from "./_components/LegalDocument";

export const metadata: Metadata = {
  title: "Legal",
  description:
    "Geographic restrictions and the legal form of Robinhood Chain Stock Tokens used as collateral.",
  alternates: { canonical: "/legal" },
};

/**
 * The page's h2s, in render order. The section list and the headings both read from here, so the
 * two cannot drift. "reporting" is the /legal#reporting anchor security.txt and SECURITY.md cite.
 */
const SECTIONS = {
  geographic: { id: "geographic-restrictions", title: "Geographic restrictions" },
  stockToken: { id: "stock-token", title: "What a Stock Token is" },
  share: { id: "vault-share", title: `What ${SHARE_TICKER} is` },
  noAdvice: { id: "no-advice", title: "No advice, no guarantee" },
  noAffiliation: { id: "no-affiliation", title: "No affiliation" },
  reporting: { id: "reporting", title: "Reporting a vulnerability" },
} as const satisfies Record<string, TocEntry>;

export default function LegalPage() {
  return (
    <LegalDocument
      eyebrow="Legal"
      title="Who this is for, and what the collateral actually is"
      toc={Object.values(SECTIONS)}
    >
      {/* The two phrases below are required, verbatim, by scripts/copy-lint.mjs.
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
            The collateral in this vault is a tokenised instrument issued by{" "}
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
            The issuer can <strong>freeze or restrict transfers</strong>, which can stop this vault
            writing, settling, or paying out tokens until it is lifted. The token can also pause its
            own price oracle, which stops this vault arming, listing and writing new calls; settlement does
            not read the oracle. No Stonkhouse contract can override either.
          </li>
          <li>
            Corporate actions — splits, dividend adjustments — are expressed through an ERC-8056
            display multiplier rather than by rebasing balances. The app shows the adjusted figure
            clearly labelled as display-only; all vault accounting uses raw balances.
          </li>
        </DocList>
      </DocSection>

      <DocSection {...SECTIONS.share}>
        <DocList>
          <li>
            {SHARE_TICKER} is a vault share. It represents a pro-rata claim on the {MARKET} Stock
            Tokens the vault holds, plus separately accrued USDG. It is not itself a Stock Token, not a
            deposit, and not a claim on Stonkhouse, Valorem or any Robinhood entity.
          </li>
          <li>
            There is no protocol token, no points programme and no airdrop attached to this vault.
          </li>
          <li>
            Premium is paid only when a buyer fills the weekly listing. A week with no buyer pays
            nothing, and an exercised call takes collateral at the strike.{" "}
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
            The Stonkhouse smart contracts have had no external audit, only the project&apos;s own internal
            reviews. An external audit is pending. They are provided as-is, under the MIT licence, with
            no warranty of any kind. You can lose the collateral you deposit.
          </li>
          <li>
            Past weekly results, including any published on{" "}
            <DocExternalLink href={appUrl("/activity")}>
              the activity page
            </DocExternalLink>
            , describe what has already happened and say nothing about what any future week will do.
          </li>
        </DocList>
      </DocSection>

      <DocSection {...SECTIONS.noAffiliation}>
        <p>
          Stonkhouse is an independent project. It is not affiliated with, endorsed by, or operated by
          Robinhood Markets, Inc., Robinhood Assets (Jersey) Limited, Valorem, or the issuers of USDG or
          Seaport. Those names appear here only to identify the third-party contracts and
          services this vault interacts with.
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
          There is no bug bounty, and the contracts have had no external audit, so a report is a
          favour, not a claim.
        </p>
        <p>
          The <DocLink href="/terms">Terms of Use</DocLink> and the <DocLink href="/privacy">privacy notice</DocLink>{" "}
          are separate pages
          {LEGAL_DOCS_ARE_DRAFT ? ", and both are drafts pending review by counsel" : ""}.
        </p>
      </DocSection>
    </LegalDocument>
  );
}
