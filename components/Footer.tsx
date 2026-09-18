/**
 * Footer for stonkhouse.fun (the mockup's .footer). Server component: nothing here hydrates.
 *
 * Four rows, in this order:
 *   1. what this is: product, registry market count, chain.
 *   2. where to go: how it works, risks, legal, terms, privacy, then the links that leave this
 *      domain (docs, the app, the explorer), each marked ↗ and opening a new tab. Risks and legal
 *      live here, not in the top bar.
 *   3. the standing disclaimers. "Not affiliated with Robinhood Markets, Robinhood Assets (Jersey)
 *      Limited or Valorem" is carried word for word from the dapp's footer (stonkhousedotfun/callhouse
 *      `web/app/layout.tsx`, as ported 2026-09-14); if it is reworded, reword both in paired commits
 *      across the two repos.
 *   4. the audit status, stated outright.
 *
 * DELIBERATELY ABSENT: a contract link (the addresses live on /how-it-works#contracts).
 * The old GitBook is labelled legacy v1 here, not advertised as current v2 guidance.
 */
import Link from "next/link";

import { Container } from "@/components/ui/Container";
import { ExternalLink } from "@/components/ui/ExternalLink";
import {
  APP_URL,
  CHAIN_ID,
  CHAIN_NAME,
  DOCS_URL,
  EXPLORER_URL,
  REGISTRY_MARKET_COUNT,
  STATUS,
} from "@/lib/site";

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
            <span className="font-display font-bold text-ink-2">Stonkhouse</span> · <span className="num">{REGISTRY_MARKET_COUNT}</span> markets in the registry · {CHAIN_NAME}{" "}
            <span className="num">{CHAIN_ID}</span>. Live availability is shown in the app.
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
                  Legacy v1 docs
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
            Not available to US persons. Not affiliated with Robinhood Markets, Robinhood Assets (Jersey) Limited or Valorem (legacy accounts).
            Nothing here is financial advice or an offer of securities.
          </p>
          <p className="max-w-[70em]">{STATUS.phase}.</p>
        </div>
      </Container>
    </footer>
  );
}
