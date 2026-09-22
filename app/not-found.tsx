/**
 * 404 for stonkhouse.fun. Not a content page (not in the sitemap, no metadata of its own beyond
 * the title and noindex), just a friendly way back. A lost visitor gets the three ways out the
 * design calls for (home, how it works, the app) as buttons, and beside them every page this site
 * has, so an old or mistyped link still lands somewhere useful. Same chrome as every other page.
 *
 * Server component. No wallet code, no fetch, no client state: this renders statically like
 * everything else here. The app link is external (a different domain), so it opens a new tab.
 *
 * The page list mirrors app/sitemap.ts. If a route is added or removed, change both.
 */
import type { Metadata } from "next";
import Link from "next/link";

import { Button, Chip, Container, Panel } from "@/components/ui";
import { appUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Not found",
  robots: { index: false },
};

const PAGES = [
  { href: "/", label: "Home", what: "What Stonkhouse is and which markets are live" },
  { href: "/how-it-works", label: "How it works", what: "One week, start to finish" },
  { href: "/risks", label: "Risks", what: "What can go wrong, before you deposit" },
  { href: "/legal", label: "Legal", what: "Who this is for, and what the collateral actually is" },
  { href: "/terms", label: "Terms of Use", what: "Who may use the interface, and what it does not promise" },
  { href: "/privacy", label: "Privacy", what: "What this interface sees, and what it keeps" },
] as const;

export default function NotFound() {
  return (
    <Container className="grid grid-cols-1 items-center gap-10 pb-[72px] pt-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:gap-14 lg:pt-14">
      <div>
        <Chip tone="accent" dot>
          <span className="num">404</span> · Page not found
        </Chip>
        <h1 className="mt-5 text-[length:clamp(40px,5.6vw,66px)] font-extrabold leading-[1.02] tracking-[-0.035em]">
          There is nothing <span className="text-accent">at this address.</span>
        </h1>
        <p className="mt-[22px] max-w-[34em] text-[19px] text-ink-2">
          The link is old or mistyped. This site is six pages: what Stonkhouse is, how a week runs,
          what can go wrong, and the legal position. Pick one, or head straight to the app.
        </p>
        <div className="mt-[30px] flex flex-wrap gap-3">
          <Button href="/">Back to the home page</Button>
          <Button variant="ghost" href="/how-it-works">
            How it works
          </Button>
          <Button variant="ghost" href={appUrl()}>
            Open the app <span aria-hidden="true">↗</span>
          </Button>
        </div>
      </div>

      <Panel pad="none" className="overflow-hidden">
        <nav aria-labelledby="pages-h">
          <h2 id="pages-h" className="px-[22px] pb-3 pt-5 text-[17px] font-bold tracking-[-0.01em]">
            Every page on this site
          </h2>
          <ul>
            {PAGES.map((page) => (
              <li key={page.href} className="border-t border-line">
                <Link
                  href={page.href}
                  className="group flex items-center gap-4 px-[22px] py-3.5 no-underline transition-colors duration-150 hover:bg-surface-2 focus-visible:outline-offset-[-2px]"
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline gap-x-2.5">
                      <span className="font-display text-[16.5px] font-bold tracking-[-0.01em] text-ink">
                        {page.label}
                      </span>
                      <span className="num text-[12.5px] text-ink-3">{page.href}</span>
                    </span>
                    <span className="mt-0.5 block text-[14.5px] text-ink-2">{page.what}</span>
                  </span>
                  <span
                    aria-hidden="true"
                    className="text-ink-3 transition-[color,translate] duration-150 group-hover:translate-x-0.5 group-hover:text-accent-text"
                  >
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Panel>
    </Container>
  );
}
