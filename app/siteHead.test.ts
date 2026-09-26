/**
 * What every route ships in its head and header: the share card's footer, the mono font's preload,
 * and the wordmark's prefetch. Moved here verbatim from app/sitemap.test.ts.
 *
 *
 * SOURCE-LEVEL, like app/sitemap.test.ts and app/_components/ThemeToggle.test.ts: this package runs
 * `node --experimental-strip-types --test`, which cannot resolve the `@/` alias or load next/font, so each guard
 * reads its subject as text rather than importing it.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

/** Source text with block comments (JS, and JSX `{/* … *\/}`) and whole-line `//` comments removed. */
function code(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

/** The option-object text of the first `name({ … })` call, or null. The font configs hold no nested braces. */
function callArgs(source: string, name: string): string | null {
  return source.match(new RegExp(`\\b${name}\\(\\{([^}]*)\\}\\)`))?.[1] ?? null;
}

const head = {
  card: code(readFileSync(new URL("./opengraph-image.tsx", import.meta.url), "utf8")),
  layout: code(readFileSync(new URL("./layout.tsx", import.meta.url), "utf8")),
  brand: code(readFileSync(new URL("../components/ui/Brand.tsx", import.meta.url), "utf8")),
};

describe("what every route ships in its head and header", () => {
  it("the share card draws the host once, derived from SITE_URL", () => {
    // Every `>{name}<` text child the card renders, in order.
    const drawn = [...head.card.matchAll(/>\s*\{(\w+)\}\s*</g)].map((m) => m[1]);
    assert.ok(drawn.includes("WORDMARK") && drawn.includes("payoff"), `card text children not parsed: ${drawn.join(", ")}`);
    // The footer is the container drawn with the hairline. Its right-hand slot used to be a second copy of the host.
    const hairline = head.card.indexOf("borderTop");
    assert.ok(hairline >= 0, "card footer (the borderTop container) not found");
    const footer = [...head.card.slice(hairline).matchAll(/>\s*\{(\w+)\}\s*</g)].map((m) => m[1]);
    assert.deepEqual(footer, ["DOMAIN"], `the card footer must draw the host once and nothing else: ${footer.join(", ")}`);
    assert.equal(new Set(drawn).size, drawn.length, `the card draws a value twice: ${drawn.join(", ")}`);
    assert.doesNotMatch(
      head.card,
      /["'`][^"'`\n]*stonkhouse\.fun/,
      "the host is hard-coded in the card; derive it from SITE_URL so a preview build labels itself honestly",
    );
  });

  it("JetBrains Mono is not preloaded; Plus Jakarta Sans, the LCP text, still is", () => {
    const mono = callArgs(head.layout, "JetBrains_Mono");
    const sans = callArgs(head.layout, "Plus_Jakarta_Sans");
    assert.ok(mono !== null && sans !== null, "a next/font call was not found in app/layout.tsx");
    assert.match(mono, /\bweight:/, "parsed the wrong span for JetBrains_Mono");
    assert.match(mono, /\bpreload:\s*false\b/, "JetBrains_Mono must pass preload: false");
    assert.doesNotMatch(sans, /\bpreload:/, "Plus Jakarta Sans must keep next/font's default preload");
  });

  it("the wordmark link does not prefetch the home page", () => {
    const links = [...head.brand.matchAll(/<Link\b([^>]*)>/g)].map((m) => m[1]);
    assert.equal(links.length, 1, `expected one <Link> in components/ui/Brand.tsx, found ${links.length}`);
    const [wordmark] = links;
    assert.ok(wordmark !== undefined);
    assert.match(wordmark, /\bhref="\/"/, "the Brand <Link> is not the home link");
    assert.match(wordmark, /\bprefetch=\{false\}/, "the wordmark <Link> must set prefetch={false}");
  });
});
