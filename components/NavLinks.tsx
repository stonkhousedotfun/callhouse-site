"use client";

/**
 * The site nav's link list, and the whole client island in the chrome. "use client" buys exactly
 * one thing: usePathname, for aria-current on the active link and for keeping that link from
 * prefetching the page it is already on. Everything around it (brand, the app button, the header) is
 * rendered by the server component in components/Nav.tsx.
 *
 * THE LIST FOLLOWS THE NEON MOCKUP: How it works, Risks, Docs, then X,
 * GitHub and Launch App from Nav.tsx. FAQ sits after How it works.
 * Risks is in the top bar AND the footer. Docs used to be left out because the GitBook described
 * legacy v1. That stopped being true when the docs were rewritten for v8 and pushed on 2026-09-22:
 * on 2026-09-23 the published home page (docs.stonkhouse.fun) read "Interface v8 is deployed on
 * Robinhood Chain 4663 from block 69,512,673 (22 September 2026); the launch markets are NVDA and
 * SPCX". If the docs ever fall behind the contracts again, take this link out rather than point
 * the top bar at stale mechanics.
 *
 * Docs leaves this origin, so it is an ExternalLink (new tab, ↗) and never aria-current. Its URL
 * comes in as a prop from the server component, so lib/site stays out of this client bundle.
 *
 * DELIBERATELY ABSENT: a "Home" link (the wordmark is the way home), Legal, Terms and Privacy
 * (footer only), any wallet or connect control, and any JS menu.
 *
 * Exact-match active test only: a prefix test would light every link that shares a prefix.
 *
 * PREFETCH. The header is in the viewport on every page,
 * and next/link prefetches every link in the viewport in production, so each of these routes was
 * fetched from every page. Two links opt out: the active link (it points at the page already shown),
 * and /risks, whose RSC payload is the site's largest (25.1 KB gz at the time of the report). It loads
 * on click instead. The others keep Next's default. The wordmark opts out in components/ui/Brand.tsx.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";

import { ExternalLink } from "@/components/ui/ExternalLink";
import { cn } from "@/lib/cn";

const LINKS = [
  { href: "/how-it-works", label: "How it works" },
  // Withdrawal times and settlement, one click from every page.
  { href: "/faq", label: "FAQ" },
  { href: "/risks", label: "Risks" },
] as const;

/** Header links that never prefetch; see PREFETCH above. */
const NO_PREFETCH: ReadonlySet<string> = new Set(["/risks"]);

/* The outline is inset (-2px offset) because the mobile row is an overflow container, which would
   clip an outline drawn outside the link. */
const LINK =
  "block whitespace-nowrap rounded-[10px] px-2.5 py-2 text-[15px] sm:px-3 font-medium no-underline transition-colors duration-150 focus-visible:outline-offset-[-2px]";
const IDLE = "text-ink-2 hover:bg-surface-2 hover:text-ink";
const ACTIVE = "bg-surface text-ink shadow-soft";

export function NavLinks({ docsHref }: { docsHref: string }) {
  const pathname = usePathname();
  return (
    <ul className="flex gap-0.5 sm:gap-1">
      {LINKS.map((link) => {
        const active = pathname === link.href;
        return (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={active ? "page" : undefined}
              prefetch={active || NO_PREFETCH.has(link.href) ? false : undefined}
              className={cn(LINK, active ? ACTIVE : IDLE)}
            >
              {link.label}
            </Link>
          </li>
        );
      })}
      <li>
        <ExternalLink href={docsHref} arrow className={cn(LINK, IDLE)}>
          Docs
        </ExternalLink>
      </li>
    </ul>
  );
}
