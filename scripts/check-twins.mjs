#!/usr/bin/env node
/** Compare the pure maths twins with the web app when its v2 checkout is available. */
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const web = process.env.CALLHOUSE_WEB_DIR
  ? resolve(process.env.CALLHOUSE_WEB_DIR)
  : resolve(root, "../callhouse/web");
const names = ["payoff.ts", "payoffCurve.ts", "rent.ts"];
const sources = names.map((name) => resolve(web, "lib/v2", name));
if (sources.some((path) => !existsSync(path))) {
  if (process.env.CALLHOUSE_WEB_DIR) {
    console.error(`check-twins: expected v2 source files under ${web}`);
    process.exit(1);
  }
  console.log("check-twins: sibling web v2 source is absent; skipped");
  process.exit(0);
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
if (!process.exitCode) console.log("check-twins: payoff, payoffCurve and rent match the web v2 sources");
