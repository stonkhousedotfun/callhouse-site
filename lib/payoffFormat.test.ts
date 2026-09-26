/**
 * lib/payoffFormat.ts, the twin of callhouse web/lib/v2/payoffFormat.ts. This package runs
 * node:test, not vitest, so the app's payoffFormat.test.ts is ported onto node:assert rather than copied: the leaf and
 * import checks read this package's files (the site twins specify `./x.ts`), and the "defined once" scan walks the
 * site's lib/ and app/. The formatter cases are the app's, value for value.
 */
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { formatPriceExact, formatShares, formatSignedUsdg, formatUsdgCents, group } from "./payoffFormat.ts";

const source = (name: string) => readFileSync(new URL(`./${name}`, import.meta.url), "utf8");
const importSpecifiers = (text: string) => [...text.matchAll(/^\s*import\b[^;]*?from\s+"([^"]+)"/gms)].map((m) => m[1]);

describe("the leaf formatter", () => {
  it("has no imports at all, not even type-only ones", () => {
    const text = source("payoffFormat.ts");
    assert.doesNotMatch(text, /^\s*import\b/m);
    assert.doesNotMatch(text, /\bfrom\s+["']/);
    assert.doesNotMatch(text, /\brequire\(|\bimport\(/);
  });

  it("is where payoffChart.ts gets the four formatters, and payoffChart.ts imports only its twinned modules", () => {
    const chart = source("payoffChart.ts");
    assert.deepEqual(importSpecifiers(chart).sort(), ["./impliedVol.ts", "./payoff.ts", "./payoffFormat.ts"]);
    assert.match(chart, /import \{ formatPriceExact, formatShares, formatSignedUsdg, formatUsdgCents \} from "\.\/payoffFormat\.ts";/);
  });

  it("defines each of the four formatters exactly once in the site, here", () => {
    const siteRoot = fileURLToPath(new URL("..", import.meta.url));
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        if (name === "node_modules" || name.startsWith(".")) continue;
        const path = join(dir, name);
        if (statSync(path).isDirectory()) walk(path);
        else if (/\.tsx?$/.test(name)) files.push(path);
      }
    };
    for (const dir of ["lib", "app"]) walk(join(siteRoot, dir));
    const definers = (fn: string) => files
      .filter((path) => new RegExp(`(function\\s+${fn}\\s*\\(|(const|let|var)\\s+${fn}\\s*=)`).test(readFileSync(path, "utf8")))
      .map((path) => path.slice(siteRoot.length));
    for (const fn of ["formatShares", "formatUsdgCents", "formatSignedUsdg", "formatPriceExact"]) {
      assert.deepEqual(definers(fn), ["lib/payoffFormat.ts"], fn);
    }
    // Control: the scan finds a definition that lives elsewhere, so an empty answer above could not pass.
    assert.deepEqual(definers("formatUsdg"), ["lib/examplePayoff.ts"]);
  });

  it("recognises an import when one is there (control for the two checks above)", () => {
    assert.deepEqual(importSpecifiers('import { a } from "./x.ts";\nimport type { B } from "./y.ts";'), ["./x.ts", "./y.ts"]);
    assert.match('import type { B } from "./y.ts";', /^\s*import\b/m);
  });
});

describe("formatters (the app's cases)", () => {
  it("groups thousands", () => {
    assert.equal(group(0n), "0");
    assert.equal(group(1_234_567n), "1,234,567");
  });

  it("shows contract units as shares, trailing zeros dropped", () => {
    assert.equal(formatShares(100n), "1");
    assert.equal(formatShares(250n), "2.5");
    assert.equal(formatShares(1n), "0.01");
    assert.equal(formatShares(0n), "0");
  });

  it("rounds costs up and payouts down to the cent, a loss away from zero", () => {
    assert.equal(formatUsdgCents(1_234_567n, "up"), "1.24");
    assert.equal(formatUsdgCents(1_234_567n, "down"), "1.23");
    assert.equal(formatUsdgCents(-1_234_567n, "down"), "−1.24");
    assert.equal(formatUsdgCents(1_000_000_000_000n, "down"), "1,000,000.00");
  });

  it("signs P&L, floored", () => {
    assert.equal(formatSignedUsdg(19_900_000n), "+19.90");
    assert.equal(formatSignedUsdg(-2_600_000n), "−2.60");
    assert.equal(formatSignedUsdg(0n), "0.00");
  });

  it("prints a USDG-6 price exactly, with at least cents", () => {
    assert.equal(formatPriceExact(241_000_000n), "241.00");
    assert.equal(formatPriceExact(236_123_400n), "236.1234");
    assert.equal(formatPriceExact(1_234_000_000n), "1,234.00");
  });
});
