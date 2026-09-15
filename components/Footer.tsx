/**
 * Footer for stonkhouse.fun (the mockup's .footer). Server component: nothing here hydrates.
 *
 * Four rows, in this order:
 *   1. what this is: product, share ticker, collateral, chain.
 *   2. where to go: how it works, risks, legal, terms, privacy, then the links that leave this
 *      domain (docs, the app, the explorer), each marked ↗ and opening a new tab. Risks and legal
 *      live here, not in the top bar.
 *   3. the standing disclaimers. "Not affiliated with Robinhood Markets, Robinhood Assets (Jersey)
 *      Limited or Valorem" is carried word for word from the dapp's footer (leekzor/callhouse
 *      `web/app/layout.tsx`, as ported 2026-09-14); if it is reworded, reword both in paired commits
 *      across the two repos.
 *   4. the audit status, stated outright.
 *
 * DELIBERATELY ABSENT: a vault contract link (the addresses live on /how-it-works#contracts). GitHub
 * and GitBook sit in the top bar, not here.
 */
import Link from "next/link";

import { Container } from "@/components/ui/Container";
import { ExternalLink } from "@/components/ui/ExternalLink";
import { APP_URL, CHAIN_ID, CHAIN_NAME, DOCS_URL, EXPLORER_URL, MARKET, SHARE_TICKER, STATUS } from "@/lib/site";

const PAGES = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/risks", label: "Risks" },
  { href: "/legal", label: "Legal" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
] as const;

const LINK = "rounded-sm text-ink-2 no-underline transition-colors duration-150 hover:text-ink";

/** "app.stonkhouse.fun" in production; whatever host a preview build points at otherwise. */
const APP_HOST = APP_URL.replace(/^https?:\/\//i, "");

export function Footer() {
  return (
    <footer>
      <Container>
        <div className="grid gap-3.5 border-t border-line pb-12 pt-8 text-[13.5px] text-ink-3">
          <p>
            <span className="font-display font-bold text-ink-2">Stonkhouse</span> · <span className="num">{SHARE_TICKER}</span>{" "}
            · {MARKET} on {CHAIN_NAME} <span className="num">{CHAIN_ID}</span>
          </p>
          <nav aria-label="Footer">
            <ul className="flex flex-wrap gap-x-[18px] gap-y-2">
              {PAGES.map((page) => (
                <li key={page.href}>
                  <Link href={page.href} className={LINK}>
                    {page.label}
                  </Link>
                </li>
              ))}
              <li>
                <ExternalLink href={DOCS_URL} arrow className={LINK}>
                  Docs
                </ExternalLink>
              </li>
              <li>
                <ExternalLink href={APP_URL} arrow className={LINK}>
                  {APP_HOST}
                </ExternalLink>
              </li>
              <li>
                <ExternalLink href={EXPLORER_URL} arrow className={LINK}>
                  Explorer
                </ExternalLink>
              </li>
            </ul>
          </nav>
          <p className="max-w-[70em]">
            Not available to US persons. Not affiliated with Robinhood Markets, Robinhood Assets (Jersey) Limited or Valorem.
            Nothing here is financial advice or an offer of securities.
          </p>
          <p className="max-w-[70em]">
            {STATUS.phase}. {STATUS.auditLine}
          </p>
        </div>
      </Container>
    </footer>
  );
}
