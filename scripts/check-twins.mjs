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
const names = ["payoff.ts", "payoffCurve.ts", "rent.ts"];
const sources = names.map((name) => resolve(web, "lib/v2", name));
const registryPath = resolve(web, "../ops/markets/tier1.json");
const required = [...sources, registryPath];
if (required.some((path) => !existsSync(path))) {
  console.error(`check-twins: expected v2 source files under ${web} and registry at ${registryPath}; set CALLHOUSE_WEB_DIR to the v8 web checkout`);
  process.exit(1);
}

for (let i = 0; i < names.length; i++) {
  const target = readFileSync(resolve(root, "lib", names[i]), "utf8");
  const header = `/** Twin of callhouse/web/lib/v2/${names[i]}. Keep the body identical; see scripts/check-twins.mjs. */\n`;
  const source = readFileSync(sources[i], "utf8");
  if (!target.startsWith(header) || target.slice(header.length) !== source) {
    console.error(`check-twins: ${names[i]} differs from ${sources[i]}`);
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
  console.log("check-twins: payoff, payoffCurve, rent and the market projection match the web v2 sources");
}
