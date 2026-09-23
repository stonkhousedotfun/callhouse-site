/**
 * Build config for the marketing site. Two lines here exist only because of how this repo is
 * shipped — Railway builds the Dockerfile with this repo as the build context, and runs the
 * produced container itself.
 *
 * `output: 'standalone'` makes Next emit .next/standalone: the server plus only the node_modules
 * it actually traced. That is what the container runs. Without it the image has to carry the
 * whole pnpm store to start.
 *
 * `outputFileTracingRoot` is pinned to this directory, which is the repo root. This repo is a
 * single pnpm package with its own lockfile, so every dependency (including the symlink targets
 * in node_modules/.pnpm) lives under this directory and the standalone tree is flat:
 * .next/standalone/server.js. It is set explicitly rather than left to inference because Next
 * walks UP looking for a lockfile to guess a workspace root; a stray pnpm-lock.yaml or
 * package-lock.json in a parent directory of a developer's checkout would otherwise move the root,
 * nest the entry point one level down, and break the Dockerfile's assertion. (In the monorepo this
 * pointed at "..", because pnpm hoisted into the workspace root; that is no longer true.)
 * Node 22 gives us import.meta.dirname, so no fileURLToPath dance.
 *
 * Deliberately absent: any webpack() block (Next 16 builds with Turbopack, and a `webpack` key
 * with no matching `turbopack` key is a hard build error), any redirects or rewrites to the dapp
 * (every CTA here is an absolute external link to app.stonkhouse.fun — see lib/site.ts), and any
 * image loader config, because this site ships no remote images.
 */

/**
 * SECURITY HEADERS. Every directive below is derived from what
 * this site actually loads, because a policy wide enough to never complain is the same shape as no
 * policy at all.
 *
 * WHAT THIS SITE LOADS, and why the origins list is this short: fonts are self-hosted — Figtree,
 * Geist_Mono and Schibsted_Grotesk come through next/font/google, which downloads them at BUILD
 * time and serves them from this origin (app/layout.tsx). The one runtime call to
 * fonts.googleapis.com is in app/opengraph-image.tsx and runs on the SERVER while generating the
 * share image, so no browser ever fetches it. There is no <script>, no next/script and no
 * dangerouslySetInnerHTML anywhere in app/ or components/. Two client islands hydrate
 * (app/_components/PayoffDemo.tsx and components/NavLinks.tsx) and their chunks come from
 * /_next/static. Nothing fetches from the browser: the only fetch() is lib/live.ts, server-side.
 * Links to x.com, github.com, the explorer, the docs and the dapp are navigations, not loads.
 *
 * THE ONE LOOSE DIRECTIVE, stated rather than buried: script-src carries 'unsafe-inline'. Next's
 * App Router emits an inline bootstrap script with no nonce, and adding one needs middleware —
 * outside this change. So this CSP does NOT stop an injected inline script. What makes that
 * acceptable here and nowhere else: this site takes NO request-derived
 * input (one route handler with no arguments, no middleware, no searchParams, no forms) and has no
 * HTML sink, so there is no path by which a script could be injected. If a form, a searchParams
 * read or a dangerouslySetInnerHTML is ever added, this directive stops being a formality and a
 * nonce becomes required. style-src carries it for the same reason: Next inlines critical CSS.
 *
 * THE DIRECTIVES THAT ARE LOAD-BEARING TODAY are the ones that do not depend on injection:
 *   frame-ancestors 'none'  — nobody can iframe /legal or /terms inside a lookalike page. This is
 *                             the finding's headline: the disclosure surface was framable.
 *   object-src 'none'       — no plugin content, ever.
 *   base-uri 'none'         — an injected <base> cannot re-point every relative URL on the page.
 *   form-action 'none'      — this site has no form; if one appears it must be declared here.
 *
 * WHAT BREAKS IF A DIRECTIVE IS WRONG: adding a remote image, an analytics script, an embedded
 * iframe or a browser-side API call will be BLOCKED and will fail visibly in the console rather
 * than silently — that is the intended behaviour, and the fix is to widen the specific directive,
 * never to drop the header.
 *
 * X-Frame-Options duplicates frame-ancestors for user agents that predate CSP level 2. HSTS is
 * two years with preload, which is a commitment: this domain and its subdomains must stay
 * HTTPS-only. Referrer-Policy keeps the path off outbound requests to the explorer and the dapp.
 * poweredByHeader is off because `X-Powered-By: Next.js` tells an attacker the stack for free.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "upgrade-insecure-requests",
].join("; ");

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // No `preload`. It is a ONE-WAY DOOR: getting onto the browser preload list is easy and getting
  // off it takes months, during which every subdomain must stay HTTPS-only or become unreachable —
  // and includeSubDomains here binds app.stonkhouse.fun and dev.stonkhouse.fun too. That is an
  // owner decision, not a lane's. The header below is the reversible 90% of it.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  outputFileTracingRoot: import.meta.dirname,
  reactStrictMode: true,
  turbopack: {},
  // `X-Powered-By: Next.js` on every response, for nothing in return.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
