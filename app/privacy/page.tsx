/**
 * /privacy — the privacy notice for both domains. Adopted 2026-09-13 as v1; renamed to Stonkhouse
 * as v3 on 2026-09-15; revised as v4 the same day (first drafted 2026-09-14), when the dapp's
 * third-party listings route was replaced by its own order-feed route (see LEGAL_DOCS_VERSION in
 * lib/legal.ts).
 *
 * WHY THIS PAGE EXISTS: the product is non-US by construction, so it is served to visitors in
 * the EU and the UK, and a request to app.stonkhouse.fun terminates on a server we run. Until
 * 2026-09-12 nothing on either domain said what that server sees, where a wallet address goes,
 * or who the controller is. This page does, and where the answer is "nobody has decided" it
 * says that, from lib/legal.ts, rather than naming an entity that does not exist.
 *
 * EVERY SENTENCE BELOW IS GROUNDED IN CODE THAT WAS READ BEFORE IT WAS WRITTEN. The facts and
 * where they come from, so the next editor can re-verify rather than trust:
 *
 *   site     (this repo) grep -rniE 'cookie|localStorage|sessionStorage|analytics|gtag|fetch\(|
 *            <script|posthog|plausible|sentry' . --include=*.ts --include=*.tsx --include=*.mjs
 *            --include=*.css (node_modules and .next excluded) returns, outside this file, three
 *            hits: a comment in app/legal/page.tsx saying there is no cookie banner, and two calls in
 *            app/opengraph-image.tsx that ask Google Fonts for the share card's faces. Those run
 *            at build time only, when the card is rendered into a static PNG. app/layout.tsx
 *            loads its three families through next/font/google, which also downloads the faces
 *            during `next build` and serves them from this origin (/_next/static/media), so a
 *            visitor's browser never contacts Google. package.json has three runtime
 *            dependencies: next, react, react-dom. No form, no wallet, no fetch at request time,
 *            no third-party script.
 *   web/     (in stonkhousedotfun/callhouse) lib/wagmi.ts: createConfig with `ssr: true` and the default
 *            storage, which @wagmi/core 3.6.5 createStorage.js keys as `wagmi.<name>` in
 *            localStorage. The
 *            names written are `recentConnectorId` (actions/connect.js), `store` (the
 *            persisted connection state: connected addresses and chain id) and
 *            `injected.connected` / `injected.disconnected` (connectors/injected.js, the
 *            shimDisconnect flag). No cookie is set anywhere in web/ (same grep). React Query
 *            (app/providers.tsx) caches in memory only.
 *            lib/hooks.ts useAccountPosition reads your position with useReadContracts, i.e.
 *            from the RPCs, in the browser, so the address reaches them as call data.
 *            lib/api.ts defines readers for /v1/vault, /v1/cycles and /v1/health, none keyed by
 *            address; only fetchCycles (/v1/cycles) is imported, by lib/history.ts. It also exports fetchAccount(), which would GET /v1/account/{address} on
 *            the indexer; NOTHING CALLS IT (grep fetchAccount web/ — the definition is the only
 *            hit), and no dapp route path contains an address (web/app has no dynamic
 *            segment). If either changes, the "not sent to a server of ours" sentences below
 *            become false and must change in a paired commit in this repo.
 *            app/api/keeper/orders/route.ts: `runtime = "nodejs"`, GET only, the ONLY server
 *            route in web/app/api. It fetches the one URL in KEEPER_ORDERS_URL, a runtime
 *            server variable (on Railway the keeper's private address), and "no query string, no
 *            body and no header reaches the upstream call"; redirects are not followed
 *            (route.ts header comment; lib/keeperOrders.ts). It then reads the chain through the
 *            server's own RPC client. The visitor's IP stops at our server; the keeper sees our
 *            server's. The browser calls it from lib/api.ts fetchKeeperOrderBook() with no
 *            parameters. (Until 2026-09-14 a different route forwarded to a third-party listings
 *            API; it was deleted with the contracts redesign.)
 *   indexer/ (in stonkhousedotfun/callhouse) ponder.schema.ts: every table is derived from on-chain
 *            events. The `user` table is keyed by wallet address and holds share and USDG
 *            figures. src/api/index.ts serves GET /v1/account/:addr (an address in the path)
 *            and mounts hono/logger, which prints method, path, status and elapsed time — not
 *            IP. So a call to that
 *            endpoint would put the address in our log, and the host's own connection log, if
 *            it keeps one, would hold the caller's IP beside it. Today the dapp makes no such
 *            call (see web/ above).
 *   RPC      web/lib/chain.ts (stonkhousedotfun/callhouse): rpc.mainnet.chain.robinhood.com then
 *            robinhood-rpc.publicnode.com, called from the browser by wagmi's transport and
 *            by publicClient.
 *   Railway  both domains are Railway services (README.md "Deploy" here; stonkhousedotfun/callhouse:
 *            `ops/deploy.md` for the app). Railway keeps its own HTTP logs for each service;
 *            nothing in either repository configures, shortens or extends that retention, and
 *            no log is shipped anywhere else.
 *
 * If any of those files changes what it does, this page is wrong and must change in the same
 * commit (or, for a file in stonkhousedotfun/callhouse, in a paired commit here). "Draft" on this page is
 * a literal match required by scripts/copy-lint.mjs.
 *
 * DELIBERATELY ABSENT: a cookie banner (there are no cookies to consent to), a "we may share
 * with partners" clause (there are no partners), a data-processing-agreement list, and a
 * retention period of our own — we have not set one, and inventing a number for a page would
 * be the same lie as inventing a controller. Nothing here is legal advice.
 */
import type { Metadata } from "next";

import {
  Callout,
  DOC_LINK,
  DRAFT_MARKER,
  Code,
  DocExternalLink,
  DocH3,
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
  LEGAL_DOCS_ARE_DRAFT,
  LEGAL_DOCS_VERSION,
  NOT_YET_DESIGNATED,
  OPERATOR_GAP_NOTICE,
  OPERATOR_JURISDICTION,
  OPERATOR_LEGAL_NAME,
  PRIVACY_CONTACT_EMAIL,
  operatorIsDesignated,
} from "@/lib/legal";
import { EXPLORER_URL, appUrl } from "@/lib/site";

// The draft sentence is appended from the same flag the in-page marker reads, so the search
// snippet and the page stop saying "draft" in the same build rather than one lagging the other.
export const metadata: Metadata = {
  title: "Privacy",
  description:
    "What stonkhouse.fun and app.stonkhouse.fun process, where it goes, and what they do not do. No cookies, no analytics, no accounts." +
    (LEGAL_DOCS_ARE_DRAFT ? " Draft, pending review by counsel." : ""),
  alternates: { canonical: "/privacy" },
};

/** The page's h2s, in render order. The section list and the headings both read from here. */
const SECTIONS = {
  process: { id: "what-we-process", title: "What we process" },
  whereItGoes: { id: "where-it-goes", title: "Where it goes" },
  doNot: { id: "what-we-do-not-do", title: "What we do not do" },
  legalBases: { id: "legal-bases", title: "Legal bases" },
  rights: { id: "your-rights", title: "Your rights" },
  retention: { id: "retention", title: "Retention" },
  security: { id: "security", title: "Security" },
  transfers: { id: "international-transfers", title: "International transfers" },
  children: { id: "children", title: "Children" },
  changes: { id: "changes", title: "Changes to this notice" },
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

/** The two RPC hosts the dapp calls from the browser. Display only; this site never calls them. */
const RPC_HOSTS = ["rpc.mainnet.chain.robinhood.com", "robinhood-rpc.publicnode.com"] as const;

export default function PrivacyPage() {
  const designated = operatorIsDesignated();

  return (
    <LegalDocument
      eyebrow="Privacy"
      title="What this interface sees, and what it keeps"
      meta={<VersionChip />}
      toc={Object.values(SECTIONS)}
    >
      <DocIntro>
        <DraftMarker />

        {designated ? null : (
          <Callout tone="warn">
            <strong>No controller has been named.</strong>
            {OPERATOR_GAP_NOTICE}
          </Callout>
        )}

        <p>
          This notice covers stonkhouse.fun (this site) and app.stonkhouse.fun (the dapp). It is written
          from the code, not from a template: each statement below was checked against the file that
          implements it. It does not cover
          your wallet, the chain, or any third-party site linked from here.
        </p>
      </DocIntro>

      <DocSection {...SECTIONS.process}>
        <DocH3>On stonkhouse.fun</DocH3>
        <DocList>
          <li>
            Nothing beyond the HTTP request itself. This site sets no cookie, writes nothing to your
            browser&apos;s storage, runs no analytics, has no form and loads no third-party script.
            Its dependencies are Next.js and React and nothing else.
          </li>
          <li>
            The server that answers the request is a Railway service. Railway records standard HTTP
            logs for it: your IP address, user agent, the path requested and the time. See{" "}
            <em>Retention</em> below.
          </li>
        </DocList>
        <DocH3>On app.stonkhouse.fun</DocH3>
        <DocList>
          <li>
            <strong>Your wallet address</strong>, once you connect. It is public chain data. The dapp
            reads your balance, your shares and your claimable USDG straight from the chain, in the
            browser. Today no request from the dapp carries your address to a server of ours, and
            there is no account to attach it to.
          </li>
          <li>
            <strong>Browser storage.</strong> The wallet library (wagmi) keeps, in your browser&apos;s
            localStorage under keys beginning <Code>wagmi.</Code>, which connector you last used, the
            addresses and chain it was connected to, and a flag recording that you disconnected. This
            is what lets the page reconnect on your next visit. Nothing else is stored, no cookie is
            set by us, and clearing site data removes all of it.
          </li>
          <li>
            <strong>The HTTP request.</strong> Every page and one server route (
            <Code>/api/keeper/orders</Code>) is answered by a Railway service, which records the
            same standard HTTP logs as the site: IP address, user agent, path, time.
          </li>
        </DocList>
      </DocSection>

      <DocSection {...SECTIONS.whereItGoes}>
        <p>Each of these is a separate organisation with its own privacy terms. By name:</p>
        <DocList>
          <li>
            <strong>RPC providers.</strong> The dapp reads the chain from your browser, so your
            browser talks directly to {RPC_HOSTS[0]} (Robinhood) and, as a fallback,{" "}
            {RPC_HOSTS[1]} (PublicNode). They see your IP address and every call the page makes,
            which includes your wallet address as call data once connected. We do not proxy those
            requests and cannot see them.
          </li>
          <li>
            <strong>The Stonkhouse indexer.</strong> A history service we run. It stores wallet
            addresses, share balances and USDG amounts derived from public on-chain events, and
            nothing that is not already on the chain. The dapp asks it only for weekly history; it
            does not ask it for your position today, although the indexer has an
            endpoint keyed by address and the dapp contains an unused function that would call it.
            If that is ever wired up, the address will appear in the indexer&apos;s request log
            (which records method, path, status and timing, not IP) and the host it runs on may
            keep a connection log holding your IP beside it. This notice changes in the same
            commit.
          </li>
          <li>
            <strong>The Stonkhouse keeper.</strong> A service we run on a private network. The cycle
            page asks our server for the vault&apos;s open listing, and our server asks the keeper at
            one fixed address, then checks the answer against the chain. Nothing from your request is
            forwarded: not your IP address, not your wallet address, not a query string or a header.
            The route is read-only, and no third-party listings service is involved.
          </li>
          <li>
            <strong>Railway.</strong> Hosts both domains and the HTTP logs described above.
          </li>
          <li>
            <strong>The explorer.</strong> Links to{" "}
            <DocExternalLink href={EXPLORER_URL} srNote={false}>
              Blockscout
            </DocExternalLink>{" "}
            open in a new tab. Following one is a visit to their site under their terms.
          </li>
          <li>
            <strong>Your wallet.</strong> Whatever your wallet extension sends to its own vendor is
            governed by that vendor, not by this notice.
          </li>
        </DocList>
      </DocSection>

      <DocSection {...SECTIONS.doNot}>
        <DocList>
          <li>No cookies, on either domain.</li>
          <li>No analytics, no tracking pixel, no session replay, no third-party script.</li>
          <li>No accounts, no sign-up, no email list, no know-your-customer process.</li>
          <li>No selling or sharing of anything for advertising. There is nothing to sell.</li>
          <li>
            No server-side record of which wallet visited which page. No dapp URL contains a wallet
            address, so Railway&apos;s logs hold your IP and the path, not your address.
          </li>
          <li>
            No request that would put an IP address and a wallet address on the same line of a log
            we control — today. The one endpoint we run that takes an address in its path (the
            indexer&apos;s account route, above) is not called by the dapp. If that changes, this
            bullet goes and the indexer bullet says what is logged.
          </li>
        </DocList>
      </DocSection>

      <DocSection {...SECTIONS.legalBases}>
        <p>
          Where the GDPR or the UK GDPR applies, the basis for the processing described above is the
          legitimate interest in operating and securing the interface (Article 6(1)(f)) — the HTTP
          logs exist to keep the service running and to investigate abuse. We do not rely on consent
          because there is nothing to consent to: no cookies, no analytics, no marketing. Wallet
          addresses and balances are public chain data that the indexer republishes, not data you
          handed us.
        </p>
      </DocSection>

      <DocSection {...SECTIONS.rights}>
        <p>
          If you are in the EU, the EEA or the UK, the GDPR and the UK GDPR give you rights over
          personal data about you. In plain words, you can:
        </p>
        <DocList>
          <li>ask what personal data is held about you and get a copy;</li>
          <li>ask for it to be corrected if it is wrong;</li>
          <li>ask for it to be deleted, where there is no reason to keep it;</li>
          <li>ask for processing to be restricted, or object to it;</li>
          <li>receive it in a portable form where it was provided by you;</li>
          <li>complain to your data-protection authority.</li>
        </DocList>
        <p>
          Two honest limits. First, a wallet address and its transactions are on a public chain that
          nobody can edit; the rights above apply to what we hold, and we cannot delete a block.
          Second, the only personal data we hold ourselves is in Railway&apos;s HTTP logs and the
          indexer&apos;s address table, so most requests will be answered by describing exactly that.
        </p>
        <p>
          Controller:{" "}
          {OPERATOR_LEGAL_NAME ? (
            <>
              <strong>{OPERATOR_LEGAL_NAME}</strong>
              {OPERATOR_JURISDICTION ? <> ({OPERATOR_JURISDICTION})</> : null}.
            </>
          ) : (
            <>
              <strong>{NOT_YET_DESIGNATED}</strong>. No legal person has yet been named as the
              controller for the processing described here, and whether an EU or UK representative
              is required has not been decided. This line will name them when that is done.
            </>
          )}
        </p>
      </DocSection>

      <DocSection {...SECTIONS.retention}>
        <DocList>
          <li>
            HTTP logs are retained by Railway for as long as Railway retains them. We have not
            configured a retention period of our own, longer or shorter, and we do not export the
            logs anywhere.
          </li>
          <li>
            The indexer keeps address-level figures for as long as the chain does, because it is a
            replay of the chain. Dropping and rebuilding it reproduces the same rows.
          </li>
          <li>
            Browser storage written by the wallet library lasts until you clear it. We cannot clear
            it for you.
          </li>
        </DocList>
      </DocSection>

      <DocSection {...SECTIONS.security}>
        <p>
          Both domains are served over TLS. There are no accounts, passwords or stored credentials
          on either domain, so there is no credential store to breach; the main protection for your
          data is that we collect almost none of it.
        </p>
      </DocSection>

      <DocSection {...SECTIONS.transfers}>
        <p>
          The providers named above — Railway, the RPC providers and the explorer — may process
          data in countries other than yours, including outside the EU and the UK. We
          have not put transfer safeguards of our own in place beyond what those providers publish;
          the only data that reaches them is what this page describes.
        </p>
      </DocSection>

      <DocSection {...SECTIONS.children}>
        <p>
          Neither domain is directed at anyone under 18, and we do not knowingly process data about
          anyone under 18. The <DocLink href="/terms">terms</DocLink> require users to be adults.
        </p>
      </DocSection>

      <DocSection {...SECTIONS.changes}>
        <p>
          This notice is versioned with the Terms of Use. The version in force is{" "}
          <Code>{LEGAL_DOCS_VERSION}</Code>. A change is a new version and a new date, published on
          this page; there is no other notice.
        </p>
      </DocSection>

      <DocSection {...SECTIONS.contact}>
        <p>
          {PRIVACY_CONTACT_EMAIL ? (
            <>
              Requests about personal data go to{" "}
              <a className={DOC_LINK} href={`mailto:${PRIVACY_CONTACT_EMAIL}`}>{PRIVACY_CONTACT_EMAIL}</a>.
            </>
          ) : (
            <>
              Privacy contact: <strong>{NOT_YET_DESIGNATED}</strong>. There is no address for
              data-protection requests yet. That gap is on the launch checklist, not an oversight
              that will be fixed quietly.
            </>
          )}{" "}
          The terms are at <DocLink href="/terms">/terms</DocLink>, the perimeter at{" "}
          <DocLink href="/legal">/legal</DocLink>, and the dapp this notice describes is at{" "}
          <DocExternalLink href={appUrl()}>
            app.stonkhouse.fun
          </DocExternalLink>
          .
        </p>
      </DocSection>

      <DraftMarker className="mt-14" />
    </LegalDocument>
  );
}
