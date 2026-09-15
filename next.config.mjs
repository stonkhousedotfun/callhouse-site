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

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  outputFileTracingRoot: import.meta.dirname,
  reactStrictMode: true,
  turbopack: {},
};

export default nextConfig;
