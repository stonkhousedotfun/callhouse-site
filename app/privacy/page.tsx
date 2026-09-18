/**
 * Privacy notice for stonkhouse.fun, app.stonkhouse.fun, the v2 indexer and optional notifier.
 * Product facts were checked against callhouse/web/lib/v2/api.ts, the account and notification
 * routes, callhouse/notifier/README.md and its encrypted-target store. Recheck those sources when
 * service behaviour changes. Legal controller and contact fields come from lib/legal.ts.
 *
 * The indexed site is the canonical notice. The app uses wallet addresses for account reads;
 * the optional notifier stores wallet-linked subscriptions, encrypted channel targets and prefs.
 * There is no browser wallet or notification code on this site itself.
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
    "What the site, app, indexer and optional notifier process: wallet addresses, encrypted channel targets, preferences and HTTP logs." +
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
            This site sets no cookie, writes nothing to your browser&apos;s storage, runs no
            analytics, has no form and loads no third-party script. Its server may request public
            v2 contract cards and statistics from our indexer to render the landing; that request
            contains no visitor wallet address.
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
            reads public positions and market data from the chain and the Stonkhouse indexer. A
            position request sends your address to that indexer, and the request host may see your
            IP address. There is no username or password account.
          </li>
          <li>
            <strong>Browser storage.</strong> The wallet library (wagmi) keeps, in your browser&apos;s
            localStorage under keys beginning <Code>wagmi.</Code>, which connector you last used, the
            addresses and chain it was connected to, and a flag recording that you disconnected. This
            is what lets the page reconnect on your next visit. Notification settings may also
            use browser push state. We set no cookie; clearing site data removes local state.
          </li>
          <li>
            <strong>The HTTP request.</strong> App and API requests reach services hosted for the
            product. Their hosts may record standard HTTP logs including IP address, user agent,
            path and time. Some API paths or queries contain a wallet address.
          </li>
          <li>
            <strong>Optional notifications.</strong> If you enable Telegram, browser push or email
            alerts, the notifier stores your wallet address, channel, encrypted destination and
            alert preferences. A wallet signature authorizes each settings action. Telegram linking
            and email confirmation verify the destination; browser push uses the browser&apos;s push
            subscription. You can remove a subscription in settings or unsubscribe from email.
          </li>
        </DocList>
      </DocSection>

      <DocSection {...SECTIONS.whereItGoes}>
        <p>These are the services we run and the outside providers a request or alert may reach:</p>
        <DocList>
          <li>
            <strong>RPC providers.</strong> The dapp reads the chain from your browser, so your
            browser talks directly to {RPC_HOSTS[0]} (Robinhood) and, as a fallback,{" "}
            {RPC_HOSTS[1]} (PublicNode). They see your IP address and every call the page makes,
            which includes your wallet address as call data once connected. We do not proxy those
            requests and cannot see them.
          </li>
          <li>
            <strong>The Stonkhouse indexer.</strong> A service we run for markets, orders, positions,
            cost basis and settlement history. It stores addresses and values derived from public
            chain events. The app requests address-specific positions and history when you view an
            account; those requests can put the address in API and host logs.
          </li>
          <li>
            <strong>The Stonkhouse notifier.</strong> A service we run for alerts you choose. It
            stores a wallet-linked subscription, alert preferences and a channel target encrypted
            at rest. Delivery uses Telegram, a browser push provider or the email provider for that
            channel, so the destination and message reach that provider. Notification delivery
            records are used for retries and deduplication.
          </li>
          <li>
            <strong>Keeper and operating tools.</strong> Services we run may submit quote and order
            transactions. Settlement and redemption need separate transactions and are currently
            submitted manually; no automated settlement cranker is deployed. These transactions
            appear on the public chain.
          </li>
          <li>
            <strong>Hosting.</strong> Railway hosts the domains and services and keeps HTTP logs as
            described above.
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
          <li>No username or password account, marketing email list or know-your-customer process. Notification email is optional and used for the alerts you select.</li>
          <li>No selling or sharing of wallet-linked notification details for advertising.</li>
        </DocList>
      </DocSection>

      <DocSection {...SECTIONS.legalBases}>
        <p>
          Where the GDPR or the UK GDPR applies, the basis for the processing described above is the
          legitimate interest in operating and securing the interface (Article 6(1)(f)) — the HTTP
          logs exist to keep the service running and to investigate abuse. Notifications are
          optional and start only after you choose a channel and authorize its subscription.
          Wallet balances and transactions are public chain data; notification destinations and
          preferences are information you provide to the notifier.
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
          Second, our services may hold HTTP logs, indexer address records and any notification
          subscription you chose. A notification subscription can be removed through its settings
          or, for email, through the unsubscribe link.
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
            A notifier subscription stays until you delete it, even if delivery is disabled. Deleting it also
            removes its queued delivery records. Expired challenges and Telegram link tokens are
            purged; completed delivery records are purged after 30 days.
          </li>
          <li>
            Browser storage written by the wallet library lasts until you clear it. We cannot clear
            it for you.
          </li>
        </DocList>
      </DocSection>

      <DocSection {...SECTIONS.security}>
        <p>
          The domains and services are served over TLS. There is no password account. Notification
          channel targets are encrypted at rest with AES-256-GCM and bound to the wallet and channel;
          the notifier logs ids and error codes rather than targets or signatures.
        </p>
      </DocSection>

      <DocSection {...SECTIONS.transfers}>
        <p>
          The providers named above — Railway, the RPC providers, the explorer, and, if you enable
          alerts, Telegram, browser-push and email delivery providers — may process data in
          countries other than yours, including outside the EU and the UK. We
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
