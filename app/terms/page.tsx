/**
 * /terms — Terms of Use for both domains. Adopted 2026-09-13 as v1, corrected as v2 the same day,
 * renamed to Stonkhouse as v3 on 2026-09-15, and corrected as v4 the same day for the contracts
 * redesign (first drafted 2026-09-14): no third-party venue or registry, the vault's own Valorem
 * Clear instance, and the admin's value levers stated. The v4 accuracy pass the same day checked
 * the factual sentences against the live deployment: the Clear's fee switch is its feeTo(), a
 * one-owner Safe (0xff14…CF61), not the admin key; the admin is a single hot key with no timelock;
 * "not audited" became "no external audit"; the keeper's Cboe price source and its order feed were
 * named (see LEGAL_DOCS_VERSION in lib/legal.ts). v7 updates the product description for v2 and
 * labels the Valorem/Seaport path as legacy while v1 positions run off.
 *
 * WHY THIS PAGE EXISTS: /legal says access is restricted by the Terms of Use rather than by a
 * technical control, and until 2026-09-12 there was no such document. A restriction that points
 * at nothing is not a restriction. This page is the thing that sentence points at, on the
 * indexed domain, canonical here and linked from app.stonkhouse.fun rather than duplicated there.
 *
 * WHAT STILL GAPS: no operating entity has been designated and no governing law has been chosen.
 * The page renders those gaps in plain words from lib/legal.ts instead of hiding them behind a
 * placeholder, and shows a warn notice while operatorIsDesignated() is false.
 * stonkhousedotfun/callhouse: `ops/launch-legal.md` is the list of decisions that closes it. The text was
 * adopted by the owner, reviewed against the code, without counsel; the DraftMarker machinery
 * remains so a future revision can be published as a draft before it takes force.
 *
 * The eligibility section is copied VERBATIM from app/legal/page.tsx, because the terms cannot
 * describe the perimeter differently from the page that announces it. "not available to US
 * persons" on this page is a literal match required by scripts/copy-lint.mjs, as is "Draft"; if
 * either is reworded the build fails. Keep this page and /legal in the same commit when the
 * perimeter wording changes.
 *
 * DELIBERATELY ABSENT: an "I accept" control (there is no account to attach acceptance to and a
 * checkbox would imply a gate that does not exist — whether use-based acceptance is defensible
 * for this perimeter is a counsel question, listed in stonkhousedotfun/callhouse: `ops/launch-legal.md`),
 * clause numbering
 * (the sections are not cross-referenced, so numbers would be decoration), a geoblock, and any
 * sentence that promises an outcome. Nothing here is legal advice.
 */
import type { Metadata } from "next";

import {
  Callout,
  DOC_LINK,
  DRAFT_MARKER,
  Code,
  DocExternalLink,
  DocIntro,
  DocLink,
  DocList,
  DocSection,
  LegalDocument,
  VersionChip,
  type TocEntry,
} from "@/app/legal/_components/LegalDocument";
import { cn } from "@/lib/cn";
import {
  GOVERNING_LAW,
  LEGAL_CONTACT_EMAIL,
  LEGAL_DOCS_ARE_DRAFT,
  LEGAL_DOCS_VERSION,
  NOT_YET_DESIGNATED,
  OPERATOR_GAP_NOTICE,
  OPERATOR_JURISDICTION,
  OPERATOR_LEGAL_NAME,
  operatorIsDesignated,
} from "@/lib/legal";
import { MARKET, OPEN_APP } from "@/lib/site";

// The draft sentence is appended from the same flag the in-page marker reads, so the search
// snippet and the page stop saying "draft" in the same build rather than one lagging the other.
export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "Terms of Use for stonkhouse.fun and app.stonkhouse.fun: who may use the interface, what it is, and what it does not promise." +
    (LEGAL_DOCS_ARE_DRAFT ? " Draft, pending review by counsel." : ""),
  alternates: { canonical: "/terms" },
};

/** The page's h2s, in render order. The section list and the headings both read from here. */
const SECTIONS = {
  who: { id: "who-may-use-this", title: "Who may use this" },
  what: { id: "what-this-interface-is", title: "What this interface is" },
  acceptableUse: { id: "acceptable-use", title: "Acceptable use" },
  noAdvice: { id: "no-advice", title: "No advice, no offer" },
  risks: { id: "risks", title: "Risks" },
  thirdParty: { id: "third-party-risk", title: "Smart-contract and third-party risk" },
  noWarranty: { id: "no-warranty", title: "No warranty" },
  liability: { id: "limitation-of-liability", title: "Limitation of liability" },
  indemnity: { id: "indemnity", title: "Indemnity" },
  ip: { id: "intellectual-property", title: "Intellectual property" },
  ending: { id: "ending", title: "Ending these terms" },
  changes: { id: "changes", title: "Changes" },
  general: { id: "general", title: "General" },
  governingLaw: { id: "governing-law", title: "Governing law" },
  contact: { id: "contact", title: "Contact" },
} as const satisfies Record<string, TocEntry>;

/** The marker the page carries at the top and the bottom while LEGAL_DOCS_ARE_DRAFT. */
function DraftMarker({ className }: { className?: string }) {
  if (!LEGAL_DOCS_ARE_DRAFT) return null;
  return (
    <p className={cn(DRAFT_MARKER, className)}>
      <strong>Draft — pending review by counsel.</strong> Version {LEGAL_DOCS_VERSION}.
    </p>
  );
}

export default function TermsPage() {
  const designated = operatorIsDesignated();

  return (
    <LegalDocument
      eyebrow="Terms of Use"
      title="Terms of Use for this interface"
      meta={<VersionChip />}
      toc={Object.values(SECTIONS)}
    >
      <DocIntro>
        <DraftMarker />

        {designated ? null : (
          <Callout tone="warn">
            <strong>No operator designated yet.</strong>
            {OPERATOR_GAP_NOTICE}
          </Callout>
        )}

        <p>
          These terms cover stonkhouse.fun and app.stonkhouse.fun (together, &ldquo;the
          interface&rdquo;). Using either domain is use under these terms. If you do not agree with
          them, do not use the interface. The smart contracts the interface points at are on a public
          chain and are not governed by these terms; nothing here can change what they do.
        </p>
      </DocIntro>

      {/* Copied verbatim from app/legal/page.tsx. The two phrases in bold are required, literally,
          by scripts/copy-lint.mjs. Do not reword here without rewording there. */}
      <DocSection {...SECTIONS.who}>
        <Callout tone="bad">
          <strong>This interface is not available to US persons.</strong>
          The same perimeter applies as to the underlying Stock Tokens. If you are a US person, or you
          are accessing this from a jurisdiction where these instruments are not offered, do not use
          this interface.
        </Callout>
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
            Access is restricted by these terms, not by a technical control. You are responsible for
            your own eligibility, and for any tax or reporting consequence of using this interface.
          </li>
          <li>
            No know-your-customer process is run here, and none is implied. This is a permissionless
            smart contract on a public chain.
          </li>
        </DocList>
        {/* Terms-only: the age, capacity and sanctions representation is not restated on /legal. */}
        <p>
          You must be at least 18 years old and able to enter a binding agreement, and you must not
          be barred from using the interface by sanctions or by the law of your jurisdiction. By
          using the interface you represent that both are true.
        </p>
      </DocSection>

      <DocSection {...SECTIONS.what}>
        <DocList>
          <li>
            A front-end to public smart contracts on Robinhood Chain. It builds transactions; your
            wallet signs them; the chain executes them. The interface never holds a key and never
            holds a token.
          </li>
          <li>
            The interface has no custody: a wallet signs each transaction. In v2, buyers pay premium
            and a capped taker fee to acquire long options, while writers lock Stock Tokens or USDG
            collateral in the Clearinghouse behind their orders. The contracts are non-upgradeable.
            Admin settings are bounded by compiled ceilings and cannot transfer user collateral,
            though fee and oracle choices can affect value. The admin is currently a single key with
            no timelock. Legacy v1 accounts use their own vault and Valorem Clear during run-off.
          </li>
          <li>
            There is no username or password account and no know-your-customer check. Your wallet
            address is public chain data. Optional notifications create a wallet-linked subscription
            with a channel target and preferences, as described in the privacy notice.
          </li>
          <li>
            The same contracts are reachable without this interface, from any tool that can send a
            transaction. Withdrawing does not depend on this site staying up.
          </li>
        </DocList>
      </DocSection>

      <DocSection {...SECTIONS.acceptableUse}>
        <DocList>
          <li>Use the interface only for lawful purposes, in your jurisdiction and in general.</li>
          <li>
            Do not attack or interfere with the interface: no exploiting a weakness to take what is
            not yours, no disruptive automation, no impersonation. If you find a vulnerability,{" "}
            <DocLink href="/legal#reporting">report it</DocLink> instead of using it.
          </li>
          <li>
            Do not misrepresent this interface as affiliated with Robinhood, Valorem or any other
            third party it names. It is not; <DocLink href="/legal">the legal page</DocLink>{" "}
            says so in full.
          </li>
        </DocList>
      </DocSection>

      <DocSection {...SECTIONS.noAdvice}>
        <p>
          Nothing on the interface is investment, legal, tax or accounting advice, and nothing here is
          an offer of securities or an invitation to buy or sell anything. Published weekly results
          describe what has already happened and say nothing about what any future week will do. The
          interface does not know your circumstances and does not try to.
        </p>
      </DocSection>

      <DocSection {...SECTIONS.risks}>
        <p>
          A buyer can lose the entire premium and taker fee if an option expires worthless. A writer
          receives premium only when an order fills, pays collateral rent when an option is minted,
          and gives up upside above the strike on collateral committed to a filled call. The Stock
          Token is a debt security whose issuer can restrict transfers. An oracle dispute can delay
          settlement, and a call payout may arrive in Stock Tokens when USDG conversion fails.{" "}
          <DocLink href="/risks">The risks page</DocLink> is part of these terms by reference; read
          it before trading.
        </p>
      </DocSection>

      <DocSection {...SECTIONS.thirdParty}>
        <DocList>
          <li>
            The Stonkhouse contracts have had no external audit, only internal reviews. An external
            audit is pending. The published source includes files with different license notices;
            check each applicable notice before reuse. The contracts have no upgrade path: a bug
            may require a new deployment and migration, not a patch.
          </li>
          <li>
            The {MARKET} Stock Token, USDG, RPC providers, market-data sources and any payout
            conversion route are third-party dependencies. None is operated by the people who
            publish this interface. Issuer restrictions can halt token transfers. In v2, oracle
            source availability and agreement determine the settlement price and can delay it;
            conversion of an in-the-money call to USDG may fail within the on-chain slippage bound,
            leaving a Stock Token payout instead.
          </li>
          <li>
            Legacy v1 accounts use Seaport and Valorem Clear. Valorem&apos;s fee switch is held by a
            separate Safe with one owner, and the legacy vault&apos;s admin decides whether it accepts
            that fee. Those dependencies remain relevant until the last v1 position is closed.
          </li>
          <li>
            V2 orders live in the Stonkhouse OrderBook. No automated settlement cranker is currently
            deployed. Anyone may snapshot, finalize or redeem when the contracts allow it, but a
            caller must submit each transaction and pay gas. An unavailable operator can delay a
            payout even though it has no exclusive settlement privilege.
          </li>
        </DocList>
      </DocSection>

      <DocSection {...SECTIONS.noWarranty}>
        <p>
          The interface and the contracts it points at are provided as-is and as-available, with no
          warranty of any kind, express or implied, including of merchantability, fitness for a
          purpose, accuracy, or uninterrupted operation. Figures shown on app.stonkhouse.fun are read
          from the chain, from an indexer or from the keeper, and may lag or be wrong; the chain is the
          record, not the page.
        </p>
      </DocSection>

      <DocSection {...SECTIONS.liability}>
        <p>
          To the extent the applicable law allows, the people who publish this interface are not
          liable for any loss arising from its use or from the contracts it points at, including lost
          collateral, lost premium, assignment, a frozen token, a failed third party, an error on the
          page, or downtime. Where that exclusion is not permitted, liability is limited to the
          smallest amount the law allows. Nothing here excludes liability that cannot lawfully be
          excluded.
        </p>
      </DocSection>

      <DocSection {...SECTIONS.indemnity}>
        <p>
          You indemnify the people who publish this interface against any claim, loss or expense
          brought by a third party that arises from your breach of these terms or your unlawful use
          of the interface, and you hold them harmless against it.
        </p>
      </DocSection>

      <DocSection {...SECTIONS.ip}>
        <p>
          Published contract source files carry their own license notices. Those notices govern
          reuse of the respective source; this page
          does not grant a separate license. The text and design of this site are not open-licensed:
          you may read them and link to them, and no other right is granted. Nothing here gives you
          any right to the Stonkhouse name or mark, or to the names and marks of the third parties
          this site names, which belong to their owners.
        </p>
      </DocSection>

      <DocSection {...SECTIONS.ending}>
        <p>
          You stop being bound by stopping using the interface. The interface may be suspended,
          changed or withdrawn at any time, without notice. The contracts it points at are on a
          public chain and do not depend on this site: contract redemption and withdrawal remain possible
          without it, from any tool that can send a transaction.
        </p>
      </DocSection>

      <DocSection {...SECTIONS.changes}>
        <p>
          These terms are versioned. The version in force is <Code>{LEGAL_DOCS_VERSION}</Code>. A
          change is a new version and a new date; there is no other notice. Continuing to use the
          interface after a change is use under the new version.
        </p>
      </DocSection>

      <DocSection {...SECTIONS.general}>
        <DocList>
          <li>If a clause of these terms is unenforceable, the rest still apply.</li>
          <li>A failure to enforce a clause is not a waiver of it.</li>
          <li>
            These terms, the <DocLink href="/privacy">privacy notice</DocLink> and the{" "}
            <DocLink href="/risks">risks page</DocLink> are the whole agreement between you and the people
            who publish this interface about the interface.
          </li>
          <li>
            You may not assign these terms. The operator may assign them to a successor operator of
            the interface, who will be named on this page.
          </li>
          <li>There are no third-party beneficiaries to these terms.</li>
        </DocList>
      </DocSection>

      <DocSection {...SECTIONS.governingLaw}>
        <p>
          {GOVERNING_LAW ? (
            <>These terms are governed by {GOVERNING_LAW}.</>
          ) : (
            <>
              Governing law: <strong>{NOT_YET_DESIGNATED}</strong>. No law and no forum have been
              chosen for these terms. That is a decision counsel has not yet made, and this page will
              say which when it has.
            </>
          )}
        </p>
      </DocSection>

      <DocSection {...SECTIONS.contact}>
        <p>
          {OPERATOR_LEGAL_NAME ? (
            <>
              These terms are published by {OPERATOR_LEGAL_NAME}
              {OPERATOR_JURISDICTION ? <> ({OPERATOR_JURISDICTION})</> : null}.{" "}
            </>
          ) : (
            <>
              Operating entity: <strong>{NOT_YET_DESIGNATED}</strong>.{" "}
            </>
          )}
          {LEGAL_CONTACT_EMAIL ? (
            <>
              Notices about these terms go to{" "}
              <a className={DOC_LINK} href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>.
            </>
          ) : (
            <>
              Legal contact: <strong>{NOT_YET_DESIGNATED}</strong>. There is no address for notices
              about these terms yet.
            </>
          )}
        </p>
        <p>
          The privacy notice is at <DocLink href="/privacy">/privacy</DocLink>, the perimeter and the legal
          form of the collateral are at <DocLink href="/legal">/legal</DocLink>, and the app
          lives at{" "}
          <DocExternalLink href={OPEN_APP}>
            app.stonkhouse.fun
          </DocExternalLink>
          .
        </p>
      </DocSection>

      <DraftMarker className="mt-14" />
    </LegalDocument>
  );
}
