/**
 * Route coverage for app/sitemap.ts.
 * A literal list is deliberate (see the sitemap's own comment), so this test does not
 * generate the list; it makes the list impossible to forget. Every page route under app/ must either appear in
 * the sitemap or be named, with a reason, in EXCLUDED below, and every sitemap entry must be a real page.
 *
 * SOURCE-LEVEL, like app/_components/ThemeToggle.test.ts: this package runs `node --experimental-strip-types
 * --test`, which cannot resolve the `@/` alias or load next/navigation, so sitemap.ts is read as text rather than
 * imported. The parser is guarded against finding nothing (see "the sitemap parser sees every entry"), because a
 * parser that returns an empty list would make the coverage check pass vacuously.
 *
 * The head and header guards (share card footer, mono font preload, wordmark prefetch) used to share this
 * file; they now live, verbatim, in app/siteHead.test.ts.
 */
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";

const APP_DIR = new URL("./", import.meta.url);
const PAGE_FILE = /^page\.(tsx|ts|jsx|js|mdx)$/;

/**
 * Page routes that are deliberately NOT in the sitemap, each with the reason. Empty today: all seven pages are
 * public. A dynamic route (a `[param]` segment) cannot be listed literally, so it would have to be named here.
 */
const EXCLUDED: ReadonlyMap<string, string> = new Map();

/**
 * The URL path Next serves for a page in the directory `segments` below app/, or null when the directory is not
 * routable. Route groups `(name)` and parallel-route slots `@name` add no path segment; a private folder `_name`
 * (app/_components) opts its whole subtree out of routing.
 */
function routeOf(segments: readonly string[]): string | null {
  const path: string[] = [];
  for (const segment of segments) {
    if (segment.startsWith("_")) return null;
    if (segment.startsWith("(") && segment.endsWith(")")) continue;
    if (segment.startsWith("@")) continue;
    path.push(segment);
  }
  return `/${path.join("/")}`;
}

/** Every route that has a page file under `dir`, sorted. */
function pageRoutes(dir: URL = APP_DIR, segments: string[] = []): string[] {
  const routes: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      routes.push(...pageRoutes(new URL(`${entry.name}/`, dir), [...segments, entry.name]));
    } else if (PAGE_FILE.test(entry.name)) {
      const route = routeOf(segments);
      if (route !== null) routes.push(route);
    }
  }
  return routes.sort();
}

/** The paths app/sitemap.ts lists, in file order, read from `url: \`${SITE_URL}/…\`` entries outside comments. */
function sitemapRoutes(source: string): { routes: string[]; urlKeys: number } {
  const code = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  const routes = [...code.matchAll(/\burl:\s*`\$\{SITE_URL\}(\/[^`]*)`/g)].map((m) => m[1]);
  return { routes, urlKeys: [...code.matchAll(/\burl:/g)].length };
}

const pages = pageRoutes();
const listed = sitemapRoutes(readFileSync(new URL("./sitemap.ts", import.meta.url), "utf8"));

describe("app/sitemap.ts route coverage", () => {
  it("routeOf maps app/ directories the way the App Router does", () => {
    assert.equal(routeOf([]), "/");
    assert.equal(routeOf(["faq"]), "/faq");
    assert.equal(routeOf(["(marketing)", "faq"]), "/faq");
    assert.equal(routeOf(["@modal", "terms"]), "/terms");
    assert.equal(routeOf(["docs", "[slug]"]), "/docs/[slug]");
    assert.equal(routeOf(["_components"]), null);
    assert.equal(routeOf(["legal", "_drafts", "old"]), null);
  });

  it("the page walker finds the site's pages, including the landing page and /faq", () => {
    assert.ok(pages.length >= 7, `expected at least 7 page routes, found ${pages.length}: ${pages.join(", ")}`);
    assert.ok(pages.includes("/"), "landing page");
    assert.ok(pages.includes("/faq"), "app/faq/page.tsx");
    assert.equal(new Set(pages).size, pages.length, `two page files resolve to one route: ${pages.join(", ")}`);
  });

  it("the sitemap parser sees every entry", () => {
    assert.ok(listed.routes.length > 0, "no url entries parsed from app/sitemap.ts");
    assert.equal(listed.routes.length, listed.urlKeys, "a `url:` entry is not in the `${SITE_URL}/path` form");
    assert.equal(new Set(listed.routes).size, listed.routes.length, `duplicate entry: ${listed.routes.join(", ")}`);
  });

  it("every page route is in the sitemap or deliberately excluded", () => {
    const missing = pages.filter((route) => !listed.routes.includes(route) && !EXCLUDED.has(route));
    assert.deepEqual(missing, [], `page routes missing from app/sitemap.ts (list them, or add them to EXCLUDED with a reason): ${missing.join(", ")}`);
  });

  it("every sitemap entry is a page that exists", () => {
    const orphans = listed.routes.filter((route) => !pages.includes(route));
    assert.deepEqual(orphans, [], `app/sitemap.ts lists routes with no page: ${orphans.join(", ")}`);
  });

  it("every exclusion names an existing page that the sitemap does not also list", () => {
    for (const [route, reason] of EXCLUDED) {
      assert.ok(reason.trim().length > 0, `${route}: an exclusion needs a reason`);
      assert.ok(pages.includes(route), `${route} is excluded but has no page`);
      assert.ok(!listed.routes.includes(route), `${route} is both listed and excluded`);
    }
  });

  it("lists /faq", () => {
    assert.ok(listed.routes.includes("/faq"));
  });
});
