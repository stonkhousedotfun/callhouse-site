/**
 * Every CALL position the site builds names its conversion floor.
 *
 *
 * WHY. `conversionFloorBps` is OPTIONAL on PayoffPosition (lib/payoff.ts, the app twin): absent, a call is
 * valued in kind at the settlement price; present, at the conditional USDG floor of a routed conversion. A call
 * payout is paid in Stock Tokens and converted, so every figure the site shows for a call must name the floor, and an
 * omission is silent: the number just comes out higher. Before this test, only lib/examplePayoff.ts passed it and
 * nothing noticed a builder that did not.
 *
 * HOW. lib/payoff.ts is a byte twin and cannot carry a site rule, so the rule is enforced where the site BUILDS
 * positions: every object literal in site source that has both an `isPut` and an `exerciseFeeBps` key (a
 * PayoffPosition, or a chart input that becomes one) must also have `conversionFloorBps`, unless it is `isPut: true`.
 * The byte twins are skipped because their bodies are the app's, pinned by scripts/check-twins.mjs; what they build
 * from a site input is checked behaviourally in app/_components/PayoffChart.test.ts.
 */
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { EXAMPLE_MULTIPLE, EXAMPLE_PAYOFF, EXAMPLE_PAYOUT, EXAMPLE_POSITION, EXAMPLE_TAKE } from "./examplePayoff.ts";
import { conversionFloorBps } from "./fees.ts";
import { multipleAt, payoutAt } from "./payoff.ts";

const root = fileURLToPath(new URL("..", import.meta.url));
/** Byte twins of callhouse web: their bodies are app code, compared by scripts/check-twins.mjs. */
const TWINS = new Set([
  "lib/payoff.ts", "lib/payoffCurve.ts", "lib/rent.ts", "lib/impliedVol.ts", "lib/payoffChart.ts", "lib/payoffFormat.ts",
  "lib/theme.ts", "app/_components/PayoffChart.tsx",
]);
const TEST = /\.test\.(ts|mts|mjs|tsx)$/;

function sources(dir: string): string[] {
  return readdirSync(join(root, dir), { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sources(path);
    return /\.(ts|tsx)$/.test(entry.name) && !TEST.test(entry.name) && !TWINS.has(path) ? [path] : [];
  });
}

/** The innermost `{ ... }` around `index`, by brace depth. Good enough for this repo's object literals. */
function enclosingLiteral(text: string, index: number): string | null {
  let depth = 0;
  let start = -1;
  for (let i = index; i >= 0; i--) {
    if (text[i] === "}") depth++;
    else if (text[i] === "{") {
      if (depth === 0) { start = i; break; }
      depth--;
    }
  }
  if (start < 0) return null;
  depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === "{") depth++;
    else if (text[i] === "}" && --depth === 0) return text.slice(start, i + 1);
  }
  return null;
}

/** Every position-shaped literal in site source: `file` and the literal's text. */
function sitePositions(files: { path: string; text: string }[]): { path: string; literal: string }[] {
  const found: { path: string; literal: string }[] = [];
  for (const { path, text } of files) {
    for (const match of text.matchAll(/\bexerciseFeeBps\s*:/g)) {
      const literal = enclosingLiteral(text, match.index);
      if (literal && /\bisPut\s*:/.test(literal)) found.push({ path, literal });
    }
  }
  return found;
}

const isCallLiteral = (literal: string) => !/\bisPut\s*:\s*true\b/.test(literal);
const namesFloor = (literal: string) => /\bconversionFloorBps\b/.test(literal);

const siteFiles = ["app", "components", "lib"].flatMap(sources).map((path) => ({ path, text: readFileSync(join(root, path), "utf8") }));

describe("every call position the site builds sets conversionFloorBps", () => {
  it("finds the site's position builders (the scan is not empty)", () => {
    const paths = sitePositions(siteFiles).map(({ path }) => path);
    assert.ok(paths.includes("lib/examplePayoff.ts"), `EXAMPLE_POSITION is found; scanned: ${paths.join(", ") || "(none)"}`);
  });

  it("names the conversion floor in every call literal", () => {
    const missing = sitePositions(siteFiles).filter(({ literal }) => isCallLiteral(literal) && !namesFloor(literal));
    assert.deepEqual(missing.map(({ path, literal }) => `${path}: ${literal.replace(/\s+/g, " ").slice(0, 120)}`), []);
  });

  it("tells a call literal without the floor from one with it, and ignores a put", () => {
    const scan = (text: string) => sitePositions([{ path: "x.ts", text }]);
    const bare = scan("const p = { isPut: false, strike: 1n, units: 1n, exerciseFeeBps: 25 };");
    assert.equal(bare.length, 1);
    assert.equal(namesFloor(bare[0]!.literal), false);
    assert.equal(namesFloor(scan("const p = { isPut: false, exerciseFeeBps: 25, conversionFloorBps: 9_700 };")[0]!.literal), true);
    assert.equal(isCallLiteral(scan("const p = { isPut: true, exerciseFeeBps: 25 };")[0]!.literal), false);
    assert.equal(scan("const q = { strike: 1n, exerciseFeeBps: 25 };").length, 0, "no isPut: not a position");
  });
});

describe("the example call is valued at its conversion floor", () => {
  it("carries the contract-bounded floor for 3 % slippage and a 1 % route fee", () => {
    assert.equal(EXAMPLE_POSITION.isPut, false);
    assert.equal(EXAMPLE_POSITION.conversionFloorBps, conversionFloorBps(300, 100));
    assert.equal(EXAMPLE_POSITION.conversionFloorBps, 9_700);
  });

  it("pays less than the in-kind value, so omitting the floor would overstate every figure", () => {
    const { isPut, strike, units, exerciseFeeBps } = EXAMPLE_POSITION;
    const inKind = payoutAt(EXAMPLE_PAYOFF.target, { isPut, strike, units, exerciseFeeBps });
    assert.ok(EXAMPLE_PAYOUT < inKind, `${EXAMPLE_PAYOUT} < ${inKind}`);
    assert.equal(EXAMPLE_PAYOUT, payoutAt(EXAMPLE_PAYOFF.target, EXAMPLE_POSITION));
    assert.equal(EXAMPLE_MULTIPLE, multipleAt(EXAMPLE_PAYOFF.target, EXAMPLE_POSITION, EXAMPLE_TAKE.cost));
  });
});
