#!/usr/bin/env node
/**
 * Write (or check) lib/markets.generated.ts from the app's canonical market registry.
 *
 * WHY THIS EXISTS: lib/markets.generated.ts says "GENERATED ... do not edit" and scripts/check-twins.mjs
 * byte-compares it against the app registry, but until now nothing in this repo could WRITE it. A file that
 * only a checker knows how to produce is a file somebody eventually hand-edits.
 *
 * MIRROR, DO NOT RE-REASON. The projection rule (a v2 row is public-live only with BOTH a live status and
 * registration evidence) lives at scripts/market-projection.mjs:34-36 and the template at :45-54. Both are
 * IMPORTED here. This file contains no second copy of either, because a second copy is a second answer, and
 * check-twins.mjs:36-45 compares the file on disk against renderMarketProjection(projectMarketRegistry(...)) —
 * so any template of our own would drift and turn that check red.
 *
 * IT DOES NOT FAIL OPEN. Registry resolution matches check-twins.mjs:10-15 exactly — CALLHOUSE_WEB_DIR, else
 * ../callhouse/web, then ../ops/markets/tier1.json from there — plus an explicit --registry override.
 * Both tools exit NON-ZERO and name the missing source; a writer that reported success having written nothing
 * would leave the committed projection stale. The default output also requires the pinned v8 registry blob.
 *
 * Usage:
 *   node scripts/gen-markets.mjs --write [--registry <path>] [--out <path>]
 *   node scripts/gen-markets.mjs --check [--registry <path>] [--out <path>]
 * --out defaults to lib/markets.generated.ts and exists so a caller can render to a scratch copy without
 * touching the committed file.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { assertV8RegistrySource, projectMarketRegistry, renderMarketProjection } from "./market-projection.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** The committed projection this CLI owns. */
export const DEFAULT_OUT = resolve(root, "lib/markets.generated.ts");

/** A flag's value, or undefined. `--registry` with nothing after it is an error, not an empty default. */
function flagValue(argv, name) {
  const i = argv.indexOf(name);
  if (i === -1) return undefined;
  const value = argv[i + 1];
  if (value === undefined || value.startsWith("--")) {
    throw new Error(`${name} needs a path`);
  }
  return value;
}

/**
 * Where the registry is, resolved exactly as scripts/check-twins.mjs:10-15 resolves it, plus --registry.
 * Returns the path whether or not it exists; the caller reports the absence, so the message can name it.
 */
export function resolveRegistryPath(argv = [], env = process.env) {
  const explicit = flagValue(argv, "--registry");
  if (explicit !== undefined) return resolve(explicit);
  const web = env.CALLHOUSE_WEB_DIR ? resolve(env.CALLHOUSE_WEB_DIR) : resolve(root, "../callhouse/web");
  return resolve(web, "../ops/markets/tier1.json");
}

/** The bytes lib/markets.generated.ts should hold for `registryPath`. */
export function renderFromRegistry(registryPath, canonical = false) {
  const source = readFileSync(registryPath, "utf8");
  if (canonical) assertV8RegistrySource(source);
  const registry = JSON.parse(source);
  return renderMarketProjection(projectMarketRegistry(registry));
}

/**
 * Run the CLI. Returns the process exit code rather than calling process.exit, so the tests can drive it
 * in-process as well as by spawning it.
 */
export function main(argv = process.argv.slice(2), env = process.env, out = console) {
  const write = argv.includes("--write");
  const check = argv.includes("--check");
  if (write === check) {
    out.error("gen-markets: pass exactly one of --write or --check [--registry <path>] [--out <path>]");
    return 2;
  }

  let registryPath;
  let outPath;
  try {
    registryPath = resolveRegistryPath(argv, env);
    const explicitOut = flagValue(argv, "--out");
    outPath = explicitOut === undefined ? DEFAULT_OUT : resolve(explicitOut);
  } catch (error) {
    out.error(`gen-markets: ${error instanceof Error ? error.message : String(error)}`);
    return 2;
  }

  // The whole point of the CLI over check-twins.mjs: a registry it cannot find is a failure that names the
  // path, never a silent success.
  if (!existsSync(registryPath)) {
    out.error(
      `gen-markets: no registry at ${registryPath}. Set CALLHOUSE_WEB_DIR to the app's web/ directory, or pass --registry <path>.`,
    );
    return 1;
  }

  let expected;
  try {
    // Scratch --out fixtures may be small; only the committed projection requires the v8 source pin.
    expected = renderFromRegistry(registryPath, outPath === DEFAULT_OUT);
  } catch (error) {
    out.error(`gen-markets: cannot project ${registryPath}: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }

  if (write) {
    writeFileSync(outPath, expected, "utf8");
    out.log(`gen-markets: wrote ${outPath} from ${registryPath}`);
    return 0;
  }

  if (!existsSync(outPath)) {
    out.error(`gen-markets: ${outPath} does not exist; run --write`);
    return 1;
  }
  const actual = readFileSync(outPath, "utf8");
  if (actual !== expected) {
    out.error(`gen-markets: ${outPath} differs from ${registryPath}; run --write and commit the result`);
    return 1;
  }
  out.log(`gen-markets: ${outPath} matches ${registryPath}`);
  return 0;
}

// Only when this file is the entry point, so importing it in a test runs nothing.
if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main());
}
