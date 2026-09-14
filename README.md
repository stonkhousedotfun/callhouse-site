# callhouse-site

`callhouse.finance` — the public landing. Static marketing pages for a product whose dapp lives on a
different domain, in a different repo. Next.js 16 App Router, React 19, Tailwind CSS v4, zero
wallet code.

This repo was split out of the Callhouse monorepo (it was `site/` there) on 2026-09-13. It builds,
lints, typechecks and deploys on its own: its own `package.json`, its own `pnpm-lock.yaml`, its own
Dockerfile and Railway service, its own copy-lint gate.

```bash
pnpm install                 # pnpm 9.10.0 via corepack (packageManager), Node >= 22
pnpm dev                     # http://localhost:3001  (the app owns 3000 locally)
pnpm typecheck
pnpm lint
pnpm build                   # emits .next/standalone/server.js
pnpm copy-lint               # compliance gate: self-test, then the real tree. Also runs in CI
```

## Sibling repos

| Repo | Domain | What it is |
|---|---|---|
| **leekzor/callhouse-site** (this one) | `callhouse.finance` | explains the product. No wallet. |
| leekzor/callhouse | `app.callhouse.finance` | the app: `web/` (deposit, cycle tape, claim USDG), plus `keeper/`, `indexer/`, `ops/`, and `contracts/` mounted as a submodule. |
| leekzor/callhouse-contracts | — | the vault contracts (Foundry). |

References in this repo's code comments of the form ``leekzor/callhouse: `web/app/layout.tsx` ``
name a file in the app repo. Nothing here imports from, builds against or deploys with either
sibling; the links are for humans keeping paired files in step.

## Design: Daylight, on Tailwind CSS v4

The site's look is **Daylight**: a light, green-tinted ground with an emerald accent, and a matching
dark palette. Both follow the visitor's `prefers-color-scheme`; there is no theme toggle. Styling
is Tailwind CSS v4 utility classes in the components, driven by a small set of design tokens.

### Where the tokens and the design live

| What | Where |
|---|---|
| The tokens, as plain CSS variables: the light palette on `:root`, the dark palette under `@media (prefers-color-scheme: dark)` | `app/globals.css` |
| The mapping from tokens to utilities (`bg-surface`, `text-ink-2`, `border-line`, `rounded-lg`, `shadow-lift`, `font-display`) | the `@theme inline` block in `app/globals.css` |
| Breakpoints: `sm` is 560px and `lg` is 960px (redefined to match the design); `md`, `xl`, `2xl` keep Tailwind's defaults | the `@theme` block in `app/globals.css` |
| Fonts: Schibsted Grotesk (display), Figtree (body), Geist Mono (every number, tabular) | `next/font/google` in `app/layout.tsx`, exposed as CSS variables on `<html>` |
| Primitives: `Button`, `Chip`, `Container` / `Section`, `SectionHead`, `Panel`, `Notice`, `Figure` / `Num`, `Eyebrow`, `ExternalLink`, `Brand` | `components/ui/` (barrel: `@/components/ui`) |
| The Tailwind build | `postcss.config.mjs`, which loads `@tailwindcss/postcss` and nothing else. There is no `tailwind.config` file; v4 reads its configuration from the CSS |

The tokens:

- **Colour:** `ground`, `surface`, `surface-2`, `ink`, `ink-2`, `ink-3`, `line`, `line-2`, `accent`,
  `accent-hover`, `accent-ink` (text on an accent fill), `accent-soft`, `accent-text` (accent-coloured
  type), `usdg`, `usdg-soft`, `warn`, `warn-soft`, `danger`. Every one has a light and a dark value.
- **Elevation:** `--elevation-lift` and `--elevation-soft`, used as `shadow-lift` and `shadow-soft`.
- **Radius:** `--r-lg` 22px (cards, panels), `--r-md` 14px (tiles, tabs), `--r-sm` 9px, used as
  `rounded-lg`, `rounded-md` and `rounded-sm`. These replace Tailwind's defaults for those names.

The raw shadow and radius variables are named `--elevation-*` and `--r-*`, not `--shadow-*` and
`--radius-*`, because `@theme inline` would otherwise emit a variable that refers to itself.

Rules that keep the tokens honest:

- **The default Tailwind palette is switched off** (`--color-*: initial`). `bg-white` or
  `text-gray-500` compiles to nothing. A new colour is a new token, added to both palettes in
  `app/globals.css`, before any component uses it.
- **No `dark:` variants for colour.** The tokens change value under `prefers-color-scheme`, so
  `bg-surface` is already right in both themes.
- **`app/globals.css` holds tokens, the mapping, a small base layer and two utilities (`num`, `link`),
  and nothing else.** Do not grow it back into a class library; styling belongs in the components.
- **Three files carry token values as literals**, because they cannot read CSS variables:
  `app/icon.svg` (the mark: accent and accent-ink), `app/opengraph-image.tsx` (the share card, light
  palette) and the `themeColor` pair in `app/layout.tsx` (`--ground`, light and dark). Change them
  in the same commit as the token.
- **The build needs to reach Google Fonts.** `next/font` downloads the three faces during
  `next build` and serves them from this origin, so visitors never contact Google, but a Railway or
  CI build with no outbound access fails. The Open Graph card also asks Google Fonts for its two
  faces; that request is best effort and falls back to the face `next/og` bundles.

### The app will adopt the same tokens (the old byte-identical rule is retired)

Until this redesign, the rule here was that the `:root` token block in `app/globals.css` was
byte-identical to leekzor/callhouse `web/app/globals.css`: the same dark palette, radius, gap and font
stacks, changed only in paired commits. **That rule no longer holds, and nobody should restore the
old dark palette to satisfy it.** This site moved to Daylight first. The app
(leekzor/callhouse `web/`) keeps its old dark palette until its own rewrite adopts Daylight, so for
that window the two domains look different on purpose. That is a known gap, not drift to be fixed
by editing this repo.

When the app's rewrite lands, it takes its token names and values, both palettes, from this repo's
`app/globals.css`, and the same `themeColor` pair. From then on the pairing rule is back, in its new
form: **a token change is a pair of commits, one in each repo, with the same message and each naming
the other's commit. Deploy both or neither.** Neither side invents a token the other does not have.

Why duplicated rather than shared: this site must build and deploy with no dependency on the app.
The two domains sit one click apart, and a drifted palette reads as a phishing page when a user
crosses the seam.

The pairing rule already applies, unchanged, to the other files that mirror the app, each named in
its header comment: `app/legal/page.tsx` (disclosure copy), `app/layout.tsx` and `app/robots.ts`
(the index/noindex decision), `components/Nav.tsx` and `components/Footer.tsx` (the standing
disclaimers; their look follows Daylight here and follows the app's own design there until its
rewrite), and `scripts/copy-lint.mjs` (the forbidden-copy table).

## What this is not

- **No wallet.** `wagmi`, `viem` and `@tanstack/react-query` are not dependencies and must not
  become dependencies. There is no connect button on this domain.
- **No chain reads.** No RPC URL, no contract call, no indexer fetch, no `fetch()` at all.
- **No live data.** Not "live data we cached" — none. The vault is not deployed, so every live
  figure would render as a zero, and a zero next to the word "realized" reads as a result rather
  than as an absence. Every number here is a fixed policy parameter, an address, or a worked
  example from the fork rehearsal that is labelled as one.
- **Not a second copy of the dapp.** Every call to action is an absolute external link to
  `https://app.callhouse.finance/...`, built with `appUrl()` from `lib/site.ts`. A relative
  `href="/vault/nvda"` on this domain is a 404, not a route into the app.

If a page here ever needs a number that changes, it belongs on the dapp instead.

## Routes

| Route | Content |
|---|---|
| `/` | what the vault does, the weekly cycle in one screen, the three things that can happen to your week, and the link to the app |
| `/how-it-works` | the cycle in detail: the phase machine, the policy table, the addresses, who may call what |
| `/risks` | the unabridged risk list. No buyer, assignment, partial assignment, issuer freeze, fee switch, admin, unaudited contracts |
| `/legal` | geographic restrictions and the legal form of the Stock Token |
| `/terms`, `/privacy` | drafts, marked as such until counsel adopts them (see "Copy rules") |

Four product routes. Adding a fifth means asking whether it is marketing or product; product goes
to the app (leekzor/callhouse `web/`).

## Copy rules are a CI gate, not a style preference

`scripts/copy-lint.mjs` scans this whole repo (skipping `node_modules`, `.next` and other build
output) and fails CI. The rules come from leekzor/callhouse README "Frontend copy" and TECHSPEC 7.3,
and they exist because the product is a tokenized security in a restricted perimeter. This domain is
the *marketing* surface, which is the surface those rules were written for, so treat them as tighter
here, not looser.

The app repo carries its own copy of the script for `web/`. The `FORBIDDEN` table is byte-identical
between the two; `REQUIRED` here is exactly the monorepo's `site` rows. Change a forbidden rule in
one repo and change it in the other in a paired commit.

**Never appears anywhere in this repo:** APY, APR, "10% weekly", "projected yield", "annualized", <!-- copy-lint-allow: this line names the forbidden phrases inside an explicit "never" -->
"backed by Nvidia", "dividend paid by Nvidia", "guaranteed yield", "risk-free". <!-- copy-lint-allow: same enumeration, continued -->

The escape hatch is a `copy-lint-allow` comment on the same line and it is only for a sentence
that is an explicit denial. It is not a way to ship the phrase.

Never turn a weekly figure into a yearly one, by multiplication, compounding, illustration or
"for example". No price chart. No candlesticks.

**The legal-docs version gate.** `lib/legal.ts` exports `LEGAL_DOCS_VERSION`; a value starting
`draft-` makes `/terms` and `/privacy` render "Draft — pending review by counsel" top and bottom,
and copy-lint requires the marker code to stay in both pages. The documents were adopted as
`v1-2026-09-13` (owner review against the code, no counsel — leekzor/callhouse
`ops/launch-legal.md` §2 item 9) and corrected the same day as `v2-2026-09-13` (the Terms'
third-party clause: an oracle pause stops writing and listing, not settlement). Until adoption, copy-lint also pinned the literal
`export const LEGAL_DOCS_VERSION = "draft-` line, so dropping the prefix failed CI unless the gate
was removed in the same commit; that entry was removed in the adoption commit. A future revision
can be published as a draft first by re-adding the prefix.

Every run starts with a self-test on synthetic trees (forbidden phrase caught, wrapped phrase
caught, allow-comment honoured, missing disclosure caught, wrapped disclosure passes,
`node_modules`/`.next` skipped, missing package root is a hard failure). A red self-test
fails the run before the real tree is looked at.

## The honest framing is the brand

Do not write around any of these. They are the pitch, not the fine print:

- Premium is paid only if a buyer fills.
- A week with no buyer pays zero. On a thin book that is the most likely outcome, and it is
  published as a row like any other — not hidden as an error state.
- Assignment can take the collateral at the strike. The upside above it is gone that week.
- Stock Tokens are debt securities issued by Robinhood Assets (Jersey) Limited. Not shares, no
  vote, and the issuer can freeze transfers.
- Not available to US persons.
- No protocol token, no points, no airdrop at launch.
- The contracts have not been audited.

No exclamation marks, no marketing adjectives. The register is the app's `web/app/page.tsx`:
"Deposit one tokenised stock, receive vault shares."

## Display rules

- **Both themes, from `prefers-color-scheme`.** Check every change in light and in dark.
- **Every number is Geist Mono with tabular figures**: the `num` utility, or `<Num>` / `<Figure>`
  from `components/ui`.
- **Panels are flat**: a surface with a 1px `line` border. Only the hero's week card and the fee
  slip / key panels are lifted with `shadow-lift` (`<Panel lift>`). A page where everything floats
  has no emphasis left.
- **Worked example figures are labelled as examples** where they appear (the week card, the fee
  slip). They come from the fork rehearsal, not from a live vault.
- **Must work at 390px wide**, with no horizontal scroll and at least a 16px side gutter. `<main>`
  has no padding of its own, so every page wraps its content in `<Container>` or `<Section>`.
  Addresses and order hashes are single unbreakable tokens; let them wrap rather than let one push
  the page sideways.
- **Keep the focus ring and respect reduced motion.** Both are global in `app/globals.css`; do not
  remove the `:focus-visible` outline, and do not add motion that ignores
  `prefers-reduced-motion`.
- **Nothing that imitates Robinhood**: no feather, no Robinhood neon green. The accent is emerald.
- British-ish spellings already in use: "tokenised", "labelled". Match the file you are in.

## Addresses and constants are duplicated too

`lib/site.ts` carries the market ticker, the chain, the explorer and the address table, copied by
hand from leekzor/callhouse `web/lib/contracts.ts`, `web/lib/chain.ts` and `README.md` for the same
reason. This site *displays* those addresses; it never calls them. leekzor/callhouse `README.md`
and `ops/addresses.json` remain the source of truth — update this file from them, never the reverse.

## Environment

Three domain variables, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_DOCS_URL`, plus six operator variables
for the legal pages; see `.env.example`. All are inlined at build time, so the Dockerfile has to take
them as build `ARG`s — setting them as runtime variables on the service does nothing. The three domain
variables default to the production domains, so a local build with no `.env` produces exactly what
production produces.

The Dockerfile declares all eight: the two domain URLs carry production defaults, the six
`NEXT_PUBLIC_OPERATOR_*` / `*_CONTACT_EMAIL` variables are declared with **no default** — an
unset value compiles to the "not yet designated" gap on the legal pages and a 404 on
security.txt. As of 2026-09-13 the three `*_CONTACT_EMAIL` variables are set on Railway
(`legal@` / `privacy@` / `security@callhouse.finance`, Cloudflare Email Routing) and
`security.txt` returns 200; the operator name, jurisdiction and governing law remain
deliberately unset and the gap notice stays up until they exist (leekzor/callhouse
`ops/launch-legal.md`). Setting a variable on Railway then rebuilding is what closes a gap; a
restart does nothing.

## Deploy

Railway, one service, Dockerfile build, **this repo root as the build context**.

### Current state (2026-09-13)

**Live at `https://callhouse.finance` and `https://www.callhouse.finance`** (Let's Encrypt, issued
2026-09-13 about 19 minutes after the DNS below), and at `https://site-production-bea7.up.railway.app`.

- Project `callhouse`, service `site`, created with the Railway CLI (`railway init` /
  `railway add`). **Connected to `leekzor/callhouse-site`, branch `main`, on 2026-09-13** (in the
  dashboard; the CLI's repo-linking mutation was rejected as `Unauthorized`). Every push to `main`
  now builds `Dockerfile` per `railway.json` and deploys; `railway up -d` is no longer needed.
- `NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_APP_URL` were set before the first build, and the three
  `*_CONTACT_EMAIL` variables were set later followed by a rebuild (`railway up`), as the
  build-time inlining requires.
- Both custom domains are attached on the Railway side, created via the GraphQL
  `customDomainCreate` mutation because the CLI's `railway domain <custom>` call was also
  rejected.
- DNS, created 2026-09-13 through the Cloudflare API (all **DNS only**; Cloudflare flattens the apex):
  - `callhouse.finance` → CNAME `knpvo8xp.up.railway.app`
  - `www.callhouse.finance` → CNAME `utodkt24.up.railway.app`
  - TXT `_railway-verify` and TXT `_railway-verify.www` with the `railway-verify=…` tokens Railway
    shows for each domain. **The CNAMEs alone are not enough**: Railway keeps the certificate in
    `VALIDATING_OWNERSHIP` until the TXT ownership records exist. Read the exact targets and tokens
    from Railway (`domains { customDomains { status { dnsRecords verificationDnsHost verificationToken } } }`),
    never from notes. Cloudflare's API rejected a CNAME create that carried a `comment` field with a
    misleading "Content for CNAME record is invalid"; the same record without it succeeded.
- Email Routing is live on the zone: `legal@`, `privacy@`, `security@callhouse.finance` all
  forward to the owner's mailbox (destination verified). Set up with `wrangler email routing`.

### Railway service settings

| Setting | Value |
|---|---|
| Service name | `site` |
| Source → Repo / Branch | `leekzor/callhouse-site` / `main` |
| Source → Root Directory | empty (the repo root) |
| Config-as-code path | `railway.json` (the default) |
| Builder / Dockerfile path | `DOCKERFILE` / `Dockerfile` (from `railway.json`) |
| Public networking | enabled, port 3000 |
| Healthcheck | `GET /`, timeout 120 s, restart `ON_FAILURE` up to 10 (from `railway.json`) |

`railway.json` carries no comments — JSON has none. This section is its documentation.

- **No `watchPatterns`.** The whole repo is the site, so every push is a site change.
- **No `startCommand`, deliberately.** Railway runs a `startCommand` through a shell, which puts
  `/bin/sh` at PID 1, swallows SIGTERM, and turns every redeploy into a 30-second kill. With the key
  absent, the Dockerfile's exec-form `CMD ["node", "server.js"]` runs and node is PID 1. (The
  monorepo's keeper dropped its `startCommand` for the same reason.) Do not re-add it for
  legibility; the start command is readable in the Dockerfile.

### Build variables need a REBUILD

| Variable | Value | If unset |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://callhouse.finance` | Dockerfile ARG default, same value. Safe |
| `NEXT_PUBLIC_APP_URL` | `https://app.callhouse.finance` | Dockerfile ARG default, same value. Safe |
| `NEXT_PUBLIC_OPERATOR_*`, `NEXT_PUBLIC_*_CONTACT_EMAIL` (six) | As counsel decides — `ops/launch-legal.md` in leekzor/callhouse | "not yet designated" on the legal pages, `security.txt` 404. Intended pre-launch |

Set the domain pair anyway; an explicit variable is what a preview environment overrides.

> **`NEXT_PUBLIC_*` is compiled into the JavaScript by `next build`. It is not read at runtime.**
> Railway passes a service variable into a Dockerfile build only if the Dockerfile declares it as
> an `ARG`. An undeclared variable is silently absent: the container starts, the healthcheck passes,
> and the page links to the wrong host. **Changing one requires a rebuild (Deploy → Redeploy, or a
> push), not a restart.**

Runtime variables: none. `PORT` is injected by Railway and read by `server.js`; do not set it.

### First deploy, in order

1. `pnpm install --frozen-lockfile` locally must succeed without touching the lockfile. If it wants
   to rewrite `pnpm-lock.yaml`, stop: the Docker build runs the same command and will fail.
2. Set the build variables above, before the first build.
3. Deploy (push to `main`, or Railway → service → Deploy).
4. Verify on the Railway-generated `*.up.railway.app` host (see below).
5. **Attach the custom domain only after a deploy is healthy**, so a DNS failure is distinguishable
   from an application failure.

### Custom domain: `callhouse.finance` is an apex

Attach in Railway → service → Settings → Networking → Custom Domain. Railway gives a target of the
form `<something>.up.railway.app`.

**A `CNAME` at the apex is not valid DNS** (RFC 1034: a CNAME cannot coexist with the `SOA` and `NS`
records every zone apex carries), and Railway publishes no stable A record. The apex therefore needs
a DNS provider that implements one of:

- **`ALIAS` / `ANAME`** — a synthetic record that resolves the target and answers with its A/AAAA
  (DNSimple, Namecheap, Route 53 `ALIAS`, others).
- **Cloudflare CNAME flattening** — create a normal `CNAME` at the root and Cloudflare flattens it.

```
Type          Name   Value
ALIAS/ANAME   @      <target>.up.railway.app
```

If the registrar offers neither, move DNS to one that does (Cloudflare is free). **Do not** pin an A
record to an IP you got from `dig` against the Railway target: it is not yours and it will move. On
Cloudflare, use **DNS only** (grey cloud) unless you have decided to run proxied on purpose.

`www.callhouse.finance` redirects to the apex with a 301, implemented at the DNS/CDN layer (a Cloudflare
Redirect Rule or registrar forwarding), not in the app. TLS is issued by Railway once the record
resolves.

### Verify a deploy

```bash
curl -sI https://callhouse.finance/ | head -1                                     # HTTP/2 200
curl -s https://callhouse.finance/ | grep -ci 'connect wallet'                    # 0
curl -s https://callhouse.finance/ | grep -o 'https://app\.callhouse\.xyz[^"]*' | sort -u
for p in "" how-it-works risks legal terms privacy; do
  printf '%-14s %s\n' "/$p" "$(curl -s -o /dev/null -w '%{http_code}' https://callhouse.finance/$p)"
done
```

### Rollback

Railway → service → Deployments → last known-good → Redeploy. That restores the image, including the
`NEXT_PUBLIC_*` values it was built with. Reverting a commit alone does not undo a variable change.

### Build the image locally

```bash
docker build -t callhouse-site .
docker run --rm -p 3000:3000 callhouse-site      # -> http://localhost:3000
```

### Known sharp edges

1. **`NEXT_PUBLIC_*` is baked at build time.** Rebuild, never restart.
2. **`HOSTNAME=0.0.0.0`** in the runner. Remove it and the standalone server binds localhost,
   unreachable from outside the container; every healthcheck times out and looks like a slow boot.
   Also do not override `PORT` on the service.
3. **The standalone entry point is `.next/standalone/server.js`**, because `next.config.mjs` pins
   `outputFileTracingRoot` to this directory. `.next/static` is not inside the standalone tree and is
   copied separately; miss it and every asset 404s. The Dockerfile asserts the entry point exists at
   the end of the builder stage so a config regression fails with an explanation.
4. **pnpm is pinned by `packageManager`** (`pnpm@9.10.0`, the version that wrote `pnpm-lock.yaml`).
   `corepack enable` in the Dockerfile and `pnpm/action-setup` in CI both read it. Change the field,
   never a version in the Dockerfile.
5. **`.dockerignore` keeps every `.env*` file out of the build context.** Next loads `.env` files
   during `next build`; a local one leaking in would override the build ARGs.
6. **The image runs as `nextjs` (uid 1001).** Nothing writes to disk at runtime.

## CI

`.github/workflows/ci.yml`: `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm lint`,
`pnpm build` on Node 22 with pnpm from `packageManager`, plus a separate dependency-free
`copy-lint` job.

**Resolved 2026-09-13:** the `leekzor` account-level Actions billing problem that failed every run
with `startup_failure` is fixed. If it ever recurs, the fallback is to run the five commands above
locally before pushing.
