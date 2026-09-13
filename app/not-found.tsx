/**
 * 404 for callhouse.finance. Not a content page — not in the sitemap, no metadata of its own beyond
 * the title — just a way back. A lost visitor gets the three routes that answer "what is this"
 * and the way out to the app, in the same chrome as every other page. No wallet code, no fetch:
 * this renders statically like everything else here.
 */
import type { Metadata } from "next";
import Link from "next/link";

import { appUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Not found",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <div className="page-head">
      <div className="eyebrow">404</div>
      <h1>There is nothing at this address</h1>
      <p className="lede">
        The link is old or mistyped. This site is six pages: what the vault does, how the week
        runs, what can go wrong, and the legal position.
      </p>
      <div className="cta">
        <Link className="btn" data-variant="primary" href="/">
          Back to the landing
        </Link>
        <Link className="btn" data-variant="ghost" href="/how-it-works">
          How it works
        </Link>
        <a className="btn ext" data-variant="ghost" href={appUrl()} target="_blank" rel="noreferrer noopener">
          Open the app
        </a>
      </div>
    </div>
  );
}
