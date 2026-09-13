# ---------------------------------------------------------------------------------------------
# @callhouse/site  →  callhouse.finance  (the marketing landing: /, /how-it-works, /risks, /legal)
#
# WHY THIS FILE EXISTS: Railway builds this repo with the repo root as the build context and the
# Dockerfile at `Dockerfile` (railway.json). This repo is one pnpm package with its own
# pnpm-lock.yaml, so the context holds everything the install needs and nothing else. README.md
# "Deploy" documents every Railway-side setting this file assumes; if you change one, change it
# there too.
#
# THE LAYERING IS THE POINT: manifests → install → sources → build. Copy the sources before the
# install and every one-line copy edit reinstalls node_modules from scratch.
#
# This image reads EIGHT build variables, and all eight are display strings: the two domain URLs
# plus the six operator facts the legal pages render (lib/legal.ts). The site has no wallet code
# and makes no chain reads at all — there is no RPC here, no vault address, no indexer URL,
# nothing to misconfigure into a wrong-contract failure. If this list ever grows past display
# strings — anything that smells of chain configuration — something has been added to this repo
# that belongs in the app (leekzor/callhouse, web/).
#
# DELIBERATELY ABSENT:
#   - No `corepack prepare pnpm@<x>`. package.json carries `packageManager`, so corepack resolves
#     the SAME pnpm the lockfile was written by, here, in CI and on every developer machine. An
#     unpinned corepack once resolved pnpm 12 for the keeper image and the install died.
#   - No `pnpm install --no-frozen-lockfile`. The lockfile is the reproducibility contract; an
#     install that is allowed to rewrite it is a different tree every build.
#   - No NEXT_PUBLIC_VAULT / RPC / API ARGs. Adding one would mean the site had started reading
#     the chain. v1 shows no live data: the vault is not deployed, so every live number would be
#     a zero, and a zero on a landing page reads as a broken product rather than as an honest
#     pre-launch state.
#   - No `next start`. The standalone output ships its own server; `next start` would need the
#     full node_modules tree this image deliberately does not carry.
#   - No HEALTHCHECK instruction. Railway owns the healthcheck (railway.json).
# ---------------------------------------------------------------------------------------------

# =============================================================================================
# base — shared by builder and runner so the Node version is stated once.
# =============================================================================================
FROM node:22-alpine AS base
# Alpine ships musl; libc6-compat is the glibc shim Next's optional native bits expect.
RUN apk add --no-cache libc6-compat
WORKDIR /app


# =============================================================================================
# builder
# =============================================================================================
FROM base AS builder

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
# No interactive "Corepack is about to download pnpm" prompt in a build log nobody is watching.
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
# The version comes from `packageManager` in package.json, read by corepack the moment pnpm is
# first invoked below. Nothing here names a version, so nothing here can disagree.
RUN corepack enable

# ---- manifests first. This layer changes only when a dependency changes. ----
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# =============================================================================================
# BUILD-TIME CONFIGURATION. READ THIS BEFORE CHANGING A VARIABLE IN THE RAILWAY UI.
#
# All eight values below are INLINED INTO THE JAVASCRIPT by `next build`. They are not read at
# runtime.
#
#   1. A Railway service variable reaches a Dockerfile build ONLY if the Dockerfile declares it as
#      an ARG. An undeclared variable is silently absent during the build and the compiled-in
#      fallback ships instead — the container starts, passes its healthcheck, and links to the
#      wrong host.
#   2. Changing one of these on Railway requires a REBUILD, not a restart.
#
# The failure mode is still a broken product: every "go do something" CTA on this site is an
# absolute external link to app.callhouse.finance. Get NEXT_PUBLIC_APP_URL wrong and the landing
# page's only job — handing the reader to the dapp — stops working.
#
# The domain pair carries the production defaults, so an unset variable ships a correct site
# rather than a relative metadata base or a link to "undefined". Override them for a preview
# deploy only.
#
# The six operator variables carry NO default, on purpose: unset compiles to "not yet designated"
# on /terms, /privacy and /legal, and /.well-known/security.txt stays a 404. That gap is the
# intended state until counsel decides the values (leekzor/callhouse: ops/launch-legal.md), and
# declaring the ARGs changes nothing until then — lib/legal.ts trims an empty string to unset.
#
# This block sits AFTER the install on purpose: a URL change must not invalidate the node_modules
# layer.
# =============================================================================================

ARG NEXT_PUBLIC_SITE_URL="https://callhouse.finance"
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_APP_URL="https://app.callhouse.finance"
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

# ---- operator facts for /terms, /privacy, /legal#reporting and /.well-known/security.txt.
#      Read by lib/legal.ts; every value is a counsel decision, and no default is provided. ----
ARG NEXT_PUBLIC_OPERATOR_LEGAL_NAME
ENV NEXT_PUBLIC_OPERATOR_LEGAL_NAME=$NEXT_PUBLIC_OPERATOR_LEGAL_NAME
ARG NEXT_PUBLIC_OPERATOR_JURISDICTION
ENV NEXT_PUBLIC_OPERATOR_JURISDICTION=$NEXT_PUBLIC_OPERATOR_JURISDICTION
ARG NEXT_PUBLIC_GOVERNING_LAW
ENV NEXT_PUBLIC_GOVERNING_LAW=$NEXT_PUBLIC_GOVERNING_LAW
ARG NEXT_PUBLIC_LEGAL_CONTACT_EMAIL
ENV NEXT_PUBLIC_LEGAL_CONTACT_EMAIL=$NEXT_PUBLIC_LEGAL_CONTACT_EMAIL
ARG NEXT_PUBLIC_PRIVACY_CONTACT_EMAIL
ENV NEXT_PUBLIC_PRIVACY_CONTACT_EMAIL=$NEXT_PUBLIC_PRIVACY_CONTACT_EMAIL
ARG NEXT_PUBLIC_SECURITY_CONTACT_EMAIL
ENV NEXT_PUBLIC_SECURITY_CONTACT_EMAIL=$NEXT_PUBLIC_SECURITY_CONTACT_EMAIL

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# ---- sources, last. .dockerignore decides what reaches this COPY: no node_modules (the layer
#      above owns it), no .next, no .git, and no .env file of any kind. ----
COPY . .

# An absent public/ is a hard COPY failure in the runner, so guarantee it exists rather than
# making the runner conditional.
RUN mkdir -p ./public

RUN pnpm run build

# The standalone tree mirrors `outputFileTracingRoot`, which next.config.mjs pins to this
# directory — so the entry point is standalone/server.js, at the top. Assert it here: if that
# config loses `output: 'standalone'`, or the tracing root drifts upward, the runner's COPY fails
# with a bare "not found" (or the container fails to boot) and no hint as to the cause.
RUN test -f .next/standalone/server.js || { \
      echo "BUILD ERROR: .next/standalone/server.js is missing."; \
      echo "next.config.mjs must set output:'standalone' AND outputFileTracingRoot to this directory."; \
      echo "See README.md, 'Known sharp edges'."; \
      exit 1; \
    }


# =============================================================================================
# runner — the shipped image. No pnpm, no source tree, no dev dependencies.
# =============================================================================================
FROM base AS runner

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Next's standalone server binds 127.0.0.1 unless HOSTNAME says otherwise. Inside a container that
# means nothing outside the container can reach it, and Railway's healthcheck fails with a timeout
# that looks like a slow boot. This one line is the difference.
ENV HOSTNAME=0.0.0.0
# A default only. Railway injects $PORT at runtime and server.js reads process.env.PORT, so the
# injected value wins; this keeps `docker run` locally on a predictable port.
ENV PORT=3000

# No runtime variables. This site has no server-side configuration at all — no API proxy, no
# secrets, nothing read per request.

RUN addgroup -g 1001 -S nodejs && adduser -u 1001 -S nextjs -G nodejs

# Three copies, and all three are needed:
#   1. standalone   — server.js, plus the pruned node_modules it traced, unpacked into /app.
#   2. .next/static — NOT included in standalone. Without it every hashed JS/CSS asset 404s and
#                     the page renders unstyled and dead.
#   3. public       — served from the directory next to server.js.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

# Exec form: node is PID 1 and receives Railway's SIGTERM directly. A shell form would put /bin/sh
# at PID 1, swallow the signal, and turn every redeploy into a 30-second kill. For the same reason
# railway.json carries no startCommand: Railway runs that through a shell.
CMD ["node", "server.js"]
