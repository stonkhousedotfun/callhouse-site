import type { MetadataRoute } from "next";
import { notFound } from "next/navigation";

import { DEV_PREVIEW, SITE_URL } from "@/lib/site";

/**
 * /sitemap.xml for production stonkhouse.fun. Six routes, listed by hand. The separate dev
 * preview returns 404, so it does not publish a sitemap.
 *
 * The list is literal rather than derived from the filesystem on purpose. This site has exactly
 * six public pages — landing, mechanics, risks, legal, terms and privacy — and
 * adding another is a product decision, so a new route SHOULD require an edit here. A globbed sitemap would
 * quietly publish anything that landed in app/. /.well-known/security.txt is not a page and is
 * not listed.
 *
 * LASTMODIFIED IS A FIXED CONSTANT, NOT A CLOCK. `new Date()` or `Date.now()` at module scope
 * would stamp every build with the moment the container was built, so a rebuild with no copy
 * change — a dependency bump, a Railway redeploy, a retried CI job — would tell crawlers all
 * six pages had just been revised. That trains them to ignore the field. It also
 * makes the build non-reproducible: two builds of the same commit would emit different bytes.
 * Bump the constant BY HAND, in the same commit, when the copy on these pages actually changes.
 *
 * URLs are absolute and built from SITE_URL, which is inlined at build time. `changeFrequency`
 * and `priority` are hints and nothing more; they are set to what is true (this content is
 * near-static, and the landing page is the entry point) rather than to gamed values.
 *
 * Deliberately absent: app.stonkhouse.fun. The dapp is a different domain with its own robots.txt
 * that disallows everything — see app/robots.ts here and stonkhousedotfun/callhouse: `web/app/robots.ts`
 * there. Listing its routes in this sitemap would contradict that, and a sitemap may not carry URLs
 * on another host in the first place. Also absent: alternates/i18n (one language), images (no
 * remote images), and any route that is not one of the six below.
 */

/**
 * Last real change to the copy on these pages, ISO 8601. Hand-maintained. Passed as a string so
 * no Date is constructed during the build and the output is byte-identical every time.
 */
const CONTENT_REVISED = "2026-09-18T00:00:00.000Z";

export default function sitemap(): MetadataRoute.Sitemap {
  if (DEV_PREVIEW) notFound();
  return [
    {
      // Buyer-first landing, live cards when available, and the link into the app.
      url: `${SITE_URL}/`,
      lastModified: CONTENT_REVISED,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      // Buyer and writer flows, settlement, fees and v2 contract status.
      url: `${SITE_URL}/how-it-works`,
      lastModified: CONTENT_REVISED,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      // The unabridged risk list. Same priority as /how-it-works on purpose: the risks are not
      // a footnote to the mechanism, they are half of it.
      url: `${SITE_URL}/risks`,
      lastModified: CONTENT_REVISED,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      // Geographic restrictions and the legal form of the Stock Token. Changes least often and
      // is the page most likely to be linked directly, so it stays in the map at a low priority
      // rather than being dropped from it.
      url: `${SITE_URL}/legal`,
      lastModified: CONTENT_REVISED,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      // Terms of Use. Adopted v1-2026-09-13, corrected v2-2026-09-13, renamed v3-2026-09-15, corrected v4-2026-09-15; listed so the document /legal points at is
      // reachable by the same crawler that reads /legal.
      url: `${SITE_URL}/terms`,
      lastModified: CONTENT_REVISED,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      // Privacy notice. Same reasoning, same priority.
      url: `${SITE_URL}/privacy`,
      lastModified: CONTENT_REVISED,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
