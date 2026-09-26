#!/usr/bin/env node
/** Compare the site's committed projections with the required v8 app checkout. */
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { assertV8RegistrySource, projectMarketRegistry, renderMarketProjection } from "./market-projection.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const web = process.env.CALLHOUSE_WEB_DIR
  ? resolve(process.env.CALLHOUSE_WEB_DIR)
  : resolve(root, "../callhouse/web");
// The chart maths twin too: impliedVol.ts (Black–Scholes and the vol backed out of an ask), payoffChart.ts (the
// chart model) and payoffFormat.ts (its import-free number formatters, split out of the app so the chart
// model twins byte for byte).
const names = ["payoff.ts", "payoffCurve.ts", "rent.ts", "impliedVol.ts", "payoffFormat.ts", "payoffChart.ts"];
const sources = names.map((name) => resolve(web, "lib/v2", name));
const registryPath = resolve(web, "../ops/markets/tier1.json");
// The Neon theme twins: lib/theme.ts (same header rule as the three above) and the TWIN BLOCK span of
// app/globals.css, BEGIN marker through END marker inclusive, compared byte for byte.
const themeSource = resolve(web, "lib/theme.ts");
const cssSource = resolve(web, "app/globals.css");
// The chart component twins the app's; see the block below for its one permitted difference.
const chartComponentSource = resolve(web, "components/v2/PayoffChart.tsx");
// What the chart imports: the display rules (lib/numberFormat.ts) and the "?" tip
// (components/ui/InfoTip.tsx with its timing rules, lib/ui/infoTip.ts). Each sits at the same path in both repos and
// twins byte for byte under the same header rule as theme.ts, so none can drift under the chart silently.
const samePathTwins = ["lib/numberFormat.ts", "lib/ui/infoTip.ts", "components/ui/InfoTip.tsx"];
const samePathSources = samePathTwins.map((path) => resolve(web, path));
const required = [...sources, registryPath, themeSource, cssSource, chartComponentSource, ...samePathSources];
if (required.some((path) => !existsSync(path))) {
  console.error(`check-twins: expected v2 source files under ${web} and registry at ${registryPath}; set CALLHOUSE_WEB_DIR to the v8 web checkout`);
  process.exit(1);
}

// The one permitted difference: the site's tests run under `node --experimental-strip-types`, which resolves
// ESM specifiers literally, so a twin writes `from "./rent.ts"` where the app (bundler resolution) writes
// `from "./rent"`. Only that suffix, only on a relative specifier, is dropped before comparing.
const stripTsSpecifiers = (text) => text.replace(/(\bfrom\s+"\.\.?\/[^"]+)\.ts"/g, '$1"');

for (let i = 0; i < names.length; i++) {
  const target = readFileSync(resolve(root, "lib", names[i]), "utf8");
  const header = `/** Twin of callhouse/web/lib/v2/${names[i]}. Keep the body identical; see scripts/check-twins.mjs. */\n`;
  const source = readFileSync(sources[i], "utf8");
  if (!target.startsWith(header) || stripTsSpecifiers(target.slice(header.length)) !== source) {
    console.error(`check-twins: ${names[i]} differs from ${sources[i]}`);
    process.exitCode = 1;
  }
}

{
  const target = readFileSync(resolve(root, "lib/theme.ts"), "utf8");
  const header = "/** Twin of callhouse/web/lib/theme.ts. Keep the body identical; see scripts/check-twins.mjs. */\n";
  if (!target.startsWith(header) || target.slice(header.length) !== readFileSync(themeSource, "utf8")) {
    console.error(`check-twins: theme.ts differs from ${themeSource}`);
    process.exitCode = 1;
  }
}

for (let i = 0; i < samePathTwins.length; i++) {
  const target = readFileSync(resolve(root, samePathTwins[i]), "utf8");
  const header = `/** Twin of callhouse/web/${samePathTwins[i]}. Keep the body identical; see scripts/check-twins.mjs. */\n`;
  if (!target.startsWith(header) || target.slice(header.length) !== readFileSync(samePathSources[i], "utf8")) {
    console.error(`check-twins: ${samePathTwins[i]} differs from ${samePathSources[i]}`);
    process.exitCode = 1;
  }
}

// The chart component's one permitted difference is its import alias: the app keeps the chart maths under @/lib/v2/,
// the site under @/lib/. Only that prefix, only on a from-specifier, is rewritten before comparing.
{
  const target = readFileSync(resolve(root, "app/_components/PayoffChart.tsx"), "utf8");
  const header = "/** Twin of callhouse/web/components/v2/PayoffChart.tsx. Keep the body identical; see scripts/check-twins.mjs. */\n";
  const siteAlias = (text) => text.replace(/(\bfrom\s+")@\/lib\/v2\//g, "$1@/lib/");
  if (!target.startsWith(header) || target.slice(header.length) !== siteAlias(readFileSync(chartComponentSource, "utf8"))) {
    console.error(`check-twins: app/_components/PayoffChart.tsx differs from ${chartComponentSource}`);
    process.exitCode = 1;
  }
}

/** The TWIN BLOCK span, markers included, or null when the markers are missing, repeated or out of order. */
export function twinBlock(css) {
  const begin = "/* ==== TWIN BLOCK BEGIN ==== */";
  const end = "/* ==== TWIN BLOCK END ==== */";
  const b = css.indexOf(begin);
  const e = css.indexOf(end);
  if (b < 0 || e < b || css.indexOf(begin, b + 1) >= 0 || css.indexOf(end, e + 1) >= 0) return null;
  return css.slice(b, e + end.length);
}

{
  const site = twinBlock(readFileSync(resolve(root, "app/globals.css"), "utf8"));
  const app = twinBlock(readFileSync(cssSource, "utf8"));
  if (site === null || app === null || site !== app) {
    console.error(`check-twins: app/globals.css TWIN BLOCK differs from ${cssSource} (or its markers are missing)`);
    process.exitCode = 1;
  }
}

try {
  const source = readFileSync(registryPath, "utf8");
  assertV8RegistrySource(source);
  const registry = JSON.parse(source);
  const projection = projectMarketRegistry(registry);
  const generatedPath = resolve(root, "lib/markets.generated.ts");
  const expected = renderMarketProjection(projection);
  const actual = readFileSync(generatedPath, "utf8");
  if (actual !== expected) {
    console.error(`check-twins: ${generatedPath} differs from ${registryPath}`);
    process.exitCode = 1;
  }
} catch (error) {
  console.error(`check-twins: cannot verify ${registryPath}: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}

if (!process.exitCode) {
  console.log("check-twins: payoff, payoffCurve, rent, impliedVol, payoffFormat, payoffChart, theme.ts, numberFormat.ts, ui/infoTip.ts, the InfoTip and PayoffChart components, the globals.css TWIN BLOCK and the market projection match the web sources");
}
