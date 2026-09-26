import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";

import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";

import { DEV_PREVIEW, SITE_URL } from "@/lib/site";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import "./globals.css";

/**
 * Neon type, the same two faces as app.stonkhouse.fun
 * (stonkhousedotfun/callhouse: web/app/layout.tsx). next/font downloads them at BUILD time and serves them
 * from this origin, so a visitor's browser never contacts Google; the build itself does need to reach Google Fonts.
 * Each exposes a CSS variable on <html> that app/globals.css maps into font-display / font-body / font-sans (Plus
 * Jakarta Sans) and font-mono (JetBrains Mono).
 *
 * Plus Jakarta Sans 400–800 for all text and headline numbers, JetBrains Mono 400–600 for tabular figures; stay
 * inside those weights. A number people compare down a column uses mono; a number that is the point of the screen
 * uses heavy sans.
 */
const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-plus-jakarta-sans",
});

/**
 * NOT PRELOADED. next/font preloads by default, which puts a <link rel="preload"> for this face in the <head> of
 * every route. Mono styles only the `.num` figures, mostly below the fold, so the preload competed with the LCP
 * text for bandwidth on every page: blocking it measured -56 to -64 ms mobile LCP as an upper bound.
 * With `display: "swap"` the figures render in the fallback mono
 * until the face arrives. Plus Jakarta Sans stays preloaded: it is the LCP text.
 */
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  preload: false,
  variable: "--font-jetbrains-mono",
});

/**
 * Root layout for stonkhouse.fun.
 *
 * DELIBERATELY ABSENT: a <Providers> wrapper. stonkhousedotfun/callhouse: `web/app/layout.tsx` has one
 * because the dapp needs wagmi, viem and @tanstack/react-query mounted above every route. This
 * package has none of those as dependencies and must never acquire them — that is the entire point
 * of splitting the two domains. A marketing page that ships a wallet runtime pays for a connect
 * flow it will never offer. The landing reads only the public v2 cards and stats API on the
 * server; it never reads the chain. The only new client state is the isolated payoff demo.
 * If a page here ever needs a wallet provider, that page belongs on app.stonkhouse.fun.
 *
 * `metadataBase` is stonkhouse.fun because that is where this package is served; relative
 * canonicals and Open Graph URLs resolve against it, and without it Next falls back to localhost
 * in a production build.
 *
 * THE robots DECISION — index: true on production HERE, and index: false in stonkhousedotfun/callhouse:
 * `web/app/layout.tsx`. The pairing is the point, and the two files have to be changed together,
 * in paired commits across the two repos:
 *
 *   - This domain carries the canonical /legal, /risks and /how-it-works copy. Serving the same
 *     disclosures from two hostnames is duplicate content, and duplicate content lets a search
 *     engine pick which of the two it shows. The disclosures get one address, and it is this one.
 *   - This is the surface copy-lint was written for, before it was removed on 2026-09-21. The page a stranger finds first
 *     should be the page whose wording is checked on every build.
 * The separate dev build is an explicit exception: DEV_PREVIEW gives all its pages noindex, while
 * app/robots.ts disallows crawling and app/sitemap.ts returns 404. It carries no visible banner.
 *
 *
 * The title template exists so a route only has to name itself: `title: "Risks"` renders
 * "Risks — Stonkhouse". The default follows the buyer-first landing.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Stonkhouse — small bets on big stocks",
    template: "%s — Stonkhouse",
  },
  description:
    "Explore Stock Token options with a known maximum option loss: premium and taker fee. Network gas is extra.",
  // Per-route canonicals override this; the default is the landing page.
  alternates: { canonical: "/" },
  openGraph: {
    // Stated in full rather than inherited: the template above would otherwise leak "%s" into a
    // share card on any route that sets its own title.
    title: "Stonkhouse — small bets on big stocks",
    description:
      "Explore Stock Token options with a known maximum option loss: premium and taker fee. Network gas is extra.",
    url: SITE_URL,
    siteName: "Stonkhouse",
    type: "website",
    // en_GB, not en_US: the copy is British-ish ("tokenised", "labelled") and the product is not
    // available to US persons. <html lang> stays the generic "en" because the pages are not
    // region-targeted content — the locale here only labels the share card.
    locale: "en_GB",
  },
  twitter: { card: "summary_large_image" },
  robots: DEV_PREVIEW
    ? { index: false, follow: false, noarchive: true }
    : { index: true, follow: true },
};

/**
 * Browser chrome follows the page ground in each colour scheme: the --ground token in app/globals.css, DAY #ffffff
 * and NIGHT #000000, the same pair the dapp declares (stonkhousedotfun/callhouse: web/app/layout.tsx), so moving
 * between the two domains does not flash a different chrome colour. Change them together. (Chrome follows the SYSTEM
 * setting; the in-page toggle cannot move a meta tag the browser has already read.)
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: THEME_INIT_SCRIPT sets data-theme on <html> before React hydrates, on purpose, so the
    // server markup (no attribute) and the client DOM differ in exactly that one attribute.
    <html lang="en" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        {/* Night/day before first paint: the stored choice, else the system setting. lib/theme.ts. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-[10px] focus:bg-surface focus:px-3.5 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-ink focus:shadow-lift"
        >
          Skip to content
        </a>
        <Nav />
        {/* No width or padding here: each page lays out its own full-width bands with
            <Container> / <Section> from components/ui. */}
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
