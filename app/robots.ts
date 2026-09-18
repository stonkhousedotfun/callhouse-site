import type { MetadataRoute } from "next";

import { DEV_PREVIEW, SITE_URL } from "@/lib/site";

/**
 * /robots.txt for stonkhouse.fun. Production allows indexing; the separate dev build disallows all.
 *
 * THE PAIRING, AND WHY IT IS SPLIT — this file and stonkhousedotfun/callhouse: `web/app/robots.ts` are one
 * decision written twice, in opposite directions, in two repos. This domain is indexed;
 * app.stonkhouse.fun disallows every user agent and sets `robots: { index: false }` in its layout.
 * Read the comment at the top of stonkhousedotfun/callhouse: `web/app/layout.tsx` before changing either
 * side, and change both in paired commits. The reasoning, in short:
 *
 *   1. The app is reached BY LINK from here, not by search. Nobody's first contact with a
 *      restricted-perimeter product should be a deep link into a deposit form.
 *   2. Both domains carry the same disclosures — /legal, /how-it-works, /risks are duplicated on
 *      the dapp as /legal and /docs. Indexing both splits which copy a search engine decides to
 *      show, and the one it should show is the one on this domain: the pages here are static,
 *      have no wallet attached, and are gated by scripts/copy-lint.mjs on every build.
 *
 * So: one indexed domain, one that is not. If you ever find yourself allowing the app, you are
 * also volunteering to keep two copies of a securities disclosure ranking against each other.
 *
 * SITE_URL is inlined at build time (NEXT_PUBLIC_*, see .env.example), so the production
 * `sitemap` and `host` values below are baked into robots.txt. Dev mode emits only Disallow: /,
 * with no production host or sitemap URL.
 *
 * Deliberately absent in production: per-agent rules, crawl-delay, and any disallow. There is no /api, no
 * search page, no session-parameterised URL and no user content on this site — six public
 * routes, all of which we want read. A disallow list here would only be a list of things that do
 * not exist.
 */
export default function robots(): MetadataRoute.Robots {
  if (DEV_PREVIEW) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
