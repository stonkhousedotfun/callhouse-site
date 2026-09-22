import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ROUTES = [
  {
    path: "app/legal/page.tsx",
    route: "/legal",
    title: "Legal — Stonkhouse",
    description:
      "Geographic restrictions, Stock Token debt securities, buyer option costs and writer collateral on Robinhood Chain.",
  },
  {
    path: "app/terms/page.tsx",
    route: "/terms",
    title: "Terms of Use — Stonkhouse",
    description:
      "Terms of Use for stonkhouse.fun and app.stonkhouse.fun: who may use the interface, what it is, and what it does not promise.",
  },
  {
    path: "app/privacy/page.tsx",
    route: "/privacy",
    title: "Privacy — Stonkhouse",
    description:
      "What the site, app, indexer and optional notifier process: wallet addresses, encrypted channel targets, preferences and HTTP logs.",
  },
];

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("legal routes publish page-specific Open Graph metadata", async (t) => {
  for (const route of ROUTES) {
    await t.test(route.route, () => {
      const source = read(route.path);
      const metadata = source.match(/export const metadata: Metadata = \{([\s\S]*?)\n\};/)?.[1];

      assert.ok(metadata, `${route.path} exports metadata`);
      assert.ok(source.includes(`const DESCRIPTION =\n  "${route.description}";`));
      assert.equal(metadata.match(/description: DESCRIPTION/g)?.length, 2);
      assert.ok(metadata.includes("openGraph: {"));
      assert.ok(metadata.includes(`title: "${route.title}"`));
      assert.ok(metadata.includes(`url: "${route.route}"`));
      assert.ok(metadata.includes('siteName: "Stonkhouse"'));
      assert.ok(metadata.includes('type: "article"'));
    });
  }
});
