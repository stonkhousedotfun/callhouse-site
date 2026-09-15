import type { Metadata, Viewport } from "next";
import { Figtree, Geist_Mono, Schibsted_Grotesk } from "next/font/google";

import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";

import { SITE_URL } from "@/lib/site";
import "./globals.css";

/**
 * Daylight type. next/font downloads these at BUILD time and serves them from this origin, so a
 * visitor's browser never contacts Google; the build itself does need to reach Google Fonts.
 * Each exposes a CSS variable on <html> that app/globals.css maps into font-display / font-body /
 * font-mono.
 *
 * All three are loaded as variable fonts (one file per face instead of one per weight). The design
 * uses Schibsted Grotesk 500–800 for display, Figtree 400–700 for body and Geist Mono 400–600 for
 * every number; stay inside those weights.
 */
const display = Schibsted_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-schibsted-grotesk",
});

const body = Figtree({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-figtree",
});

const mono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-mono",
});

/**
 * Root layout for stonkhouse.fun.
 *
 * DELIBERATELY ABSENT: a <Providers> wrapper. leekzor/callhouse: `web/app/layout.tsx` has one
 * because the dapp needs wagmi, viem and @tanstack/react-query mounted above every route. This
 * package has none of those as dependencies and must never acquire them — that is the entire point
 * of splitting the two domains. A marketing page that ships a wallet runtime pays for a connect
 * flow it will never offer, and this site never reads the chain, so every live figure it could render
 * would be a zero. Nothing under this layout fetches, reads a chain, or holds client state beyond
 * the nav's active link. If a page here ever needs a provider, the page belongs on
 * app.stonkhouse.fun.
 *
 * `metadataBase` is stonkhouse.fun because that is where this package is served; relative
 * canonicals and Open Graph URLs resolve against it, and without it Next falls back to localhost
 * in a production build.
 *
 * THE robots DECISION — index: true HERE, and index: false in leekzor/callhouse:
 * `web/app/layout.tsx`. The pairing is the point, and the two files have to be changed together,
 * in paired commits across the two repos:
 *
 *   - This domain carries the canonical /legal, /risks and /how-it-works copy. Serving the same
 *     disclosures from two hostnames is duplicate content, and duplicate content lets a search
 *     engine pick which of the two it shows. The disclosures get one address, and it is this one.
 *   - This is the surface scripts/copy-lint.mjs was written for. The page a stranger finds first
 *     should be the page whose wording is checked on every build.
 *
 * The title template exists so a route only has to name itself: `title: "Risks"` renders
 * "Risks — Stonkhouse". The default is the full positioning line, used on "/" alone.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Stonkhouse — let your stonks work for you",
    template: "%s — Stonkhouse",
  },
  description:
    "Let your stonks work for you. Put NVDA in. Each week someone can pay you for the chance to buy it at a set price. Beta, pending audit.",
  // Per-route canonicals override this; the default is the landing page.
  alternates: { canonical: "/" },
  openGraph: {
    // Stated in full rather than inherited: the template above would otherwise leak "%s" into a
    // share card on any route that sets its own title.
    title: "Stonkhouse — let your stonks work for you",
    description:
      "Let your stonks work for you. Put NVDA in. Each week someone can pay you for the chance to buy it at a set price. Beta, pending audit.",
    url: SITE_URL,
    siteName: "Stonkhouse",
    type: "website",
    // en_GB, not en_US: the copy is British-ish ("tokenised", "labelled") and the product is not
    // available to US persons. <html lang> stays the generic "en" because the pages are not
    // region-targeted content — the locale here only labels the share card.
    locale: "en_GB",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

/**
 * Browser chrome follows the page ground in each colour scheme: the --ground token in
 * app/globals.css, light and dark. Change them together. The dapp (leekzor/callhouse:
 * `web/app/layout.tsx`) should carry the same pair once it adopts Daylight, so the two domains do
 * not flash different chrome colours.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f8f6" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1511" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
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
