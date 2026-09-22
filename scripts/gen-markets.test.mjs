import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { renderMarketProjection } from "./market-projection.mjs";
import { DEFAULT_OUT, renderFromRegistry, resolveRegistryPath } from "./gen-markets.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const CLI = join(here, "gen-markets.mjs");

/** Run the CLI as a real process: the exit code is the thing under test. */
const run = (args, env = {}) => spawnSync(process.execPath, [CLI, ...args], { encoding: "utf8", env: { ...process.env, ...env } });

const row = (ticker, status, registeredAt) => ({ ticker, v2: { status, registeredAt } });

function scratch(registry) {
  const dir = mkdtempSync(join(tmpdir(), "gen-markets-"));
  const registryPath = join(dir, "tier1.json");
  writeFileSync(registryPath, JSON.stringify(registry), "utf8");
  return { dir, registryPath, outPath: join(dir, "markets.generated.ts") };
}

test("--write then --check round-trips, and the bytes are the renderer's", () => {
  const { dir, registryPath, outPath } = scratch({ markets: [row("NVDA", "live", 123), row("SGOV", "planned", null)] });
  try {
    const written = run(["--write", "--registry", registryPath, "--out", outPath]);
    assert.equal(written.status, 0, written.stderr);

    // MIRROR: the file must be exactly what renderMarketProjection produces, because that is what
    // scripts/check-twins.mjs:36-45 compares against. A CLI with its own template passes its own --check and
    // fails check-twins, which is the drift this assertion exists to catch.
    assert.equal(readFileSync(outPath, "utf8"), renderMarketProjection({ liveMarkets: ["NVDA"], registryMarketCount: 2 }));

    const checked = run(["--check", "--registry", registryPath, "--out", outPath]);
    assert.equal(checked.status, 0, checked.stderr);
    assert.match(checked.stdout, /matches/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("--check exits 1 on a one-byte change and names the file", () => {
  const { dir, registryPath, outPath } = scratch({ markets: [row("NVDA", "live", 123)] });
  try {
    assert.equal(run(["--write", "--registry", registryPath, "--out", outPath]).status, 0);
    const good = readFileSync(outPath, "utf8");
    writeFileSync(outPath, `${good} `, "utf8"); // one byte
    const red = run(["--check", "--registry", registryPath, "--out", outPath]);
    assert.equal(red.status, 1);
    assert.match(red.stderr, /differs from/);

    writeFileSync(outPath, good, "utf8");
    assert.equal(run(["--check", "--registry", registryPath, "--out", outPath]).status, 0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("a registry with nothing live renders an empty LIVE_MARKETS and still counts the rows", () => {
  // This is today's ops/markets/tier1.json in miniature: every row planned, none registered. It must render,
  // not throw — the site decides what an empty projection means (lib/site.ts), not this CLI.
  const { dir, registryPath, outPath } = scratch({ markets: [row("NVDA", "planned", null), row("TSLA", "planned", null)] });
  try {
    assert.equal(run(["--write", "--registry", registryPath, "--out", outPath]).status, 0);
    const rendered = readFileSync(outPath, "utf8");
    assert.match(rendered, /export const LIVE_MARKETS = \[\n\] as const;/);
    assert.match(rendered, /export const REGISTRY_MARKET_COUNT = 2;/);
    assert.equal(rendered, renderFromRegistry(registryPath));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("an unresolvable registry exits non-zero and names the path it tried", () => {
  // The whole reason this CLI exists rather than reusing check-twins.mjs:17-24, which exits 0 here
  // (v8-plan/06-QUIRKS.md §A3). A writer that "succeeded" having written nothing is the worse failure.
  const dir = mkdtempSync(join(tmpdir(), "gen-markets-missing-"));
  try {
    const missing = run(["--check", "--registry", join(dir, "absent.json")]);
    assert.notEqual(missing.status, 0, "must not exit 0 when the registry is absent");
    assert.match(missing.stderr, /no registry at/);
    assert.match(missing.stderr, /absent\.json/, "the message names the path it tried");

    // The same via CALLHOUSE_WEB_DIR, which is how an operator actually points it at the app.
    const viaEnv = run(["--check"], { CALLHOUSE_WEB_DIR: join(dir, "no-such-web") });
    assert.notEqual(viaEnv.status, 0);
    assert.match(viaEnv.stderr, /tier1\.json/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("resolution matches check-twins.mjs: CALLHOUSE_WEB_DIR, else ../callhouse/web, and --registry wins", () => {
  // Read from the sibling script rather than restated, so the two cannot drift apart silently.
  const twins = readFileSync(join(here, "check-twins.mjs"), "utf8");
  assert.match(twins, /process\.env\.CALLHOUSE_WEB_DIR/);
  assert.match(twins, /resolve\(root, "\.\.\/callhouse\/web"\)/);
  assert.match(twins, /resolve\(web, "\.\.\/ops\/markets\/tier1\.json"\)/);

  const fromEnv = resolveRegistryPath([], { CALLHOUSE_WEB_DIR: join("anywhere", "web") });
  assert.equal(fromEnv, resolve("anywhere", "web", "../ops/markets/tier1.json"));
  const fallback = resolveRegistryPath([], {});
  assert.equal(fallback, resolve(here, "..", "../callhouse/web", "../ops/markets/tier1.json"));
  assert.equal(resolveRegistryPath(["--registry", "elsewhere/r.json"], { CALLHOUSE_WEB_DIR: "ignored" }), resolve("elsewhere/r.json"));
  assert.throws(() => resolveRegistryPath(["--registry"], {}), /needs a path/);
});

test("the CLI refuses an ambiguous invocation rather than guessing, and defaults --out to the committed file", () => {
  assert.equal(run([]).status, 2, "neither --write nor --check");
  assert.equal(run(["--write", "--check"]).status, 2, "both");
  assert.equal(DEFAULT_OUT, resolve(here, "..", "lib/markets.generated.ts"));
});

test("no absolute workspace path is baked into either file", () => {
  // scripts/check-commit-scope.mjs:20-25 rejects a staged .mjs containing one, so this fails here rather
  // than at commit time. Asserted by running the guard's own predicate, not by restating its regex.
  const selfTest = execFileSync(process.execPath, [join(here, "check-commit-scope.mjs"), "--self-test"], { encoding: "utf8" });
  assert.match(selfTest, /scope guard self-test passed/);
  for (const name of ["gen-markets.mjs", "gen-markets.test.mjs"]) {
    const content = readFileSync(join(here, name), "utf8");
    assert.doesNotMatch(content, /\/Users\/[^\s/]+\/Desktop\/robinhood-dev/, name);
    assert.doesNotMatch(content, /wt\/callhouse|github\.com\/leekzor\//, name);
  }
});
