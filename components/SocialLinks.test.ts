/**
 * SocialLinks' header comment used to say the GitBook was "linked as legacy v1 in the footer only". The docs
 * describe the v8 contracts and are linked from the header and the footer, so the comment now says so. These checks
 * hold the component to what that comment claims: X and GitHub are its only marks, and the docs are a text link in
 * the header's NavLinks and in the footer, not here.
 *
 * Source-level checks: this package's runner (`node --experimental-strip-types --test`) does not load TSX.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const social = read("./SocialLinks.tsx");

/** Drop block and line comments so a link named only in prose cannot satisfy a check. */
const code = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

describe("SocialLinks", () => {
  it("renders exactly the X, Telegram and GitHub marks, and no docs link", () => {
    // Telegram sits between X and GitHub, same size, style and hover.
    const hrefs = [...code(social).matchAll(/href=\{(\w+)\}/g)].map((m) => m[1]);
    assert.deepEqual(hrefs, ["X_URL", "TELEGRAM_URL", "GITHUB_URL"]);
    assert.ok(code(social).includes('aria-label="Telegram (opens in a new tab)"'));
    assert.equal(code(social).includes("DOCS_URL"), false, "the docs are not a mark");
  });

  it("the docs are linked as text from the header and the footer, as the comment says", () => {
    assert.ok(code(read("./NavLinks.tsx")).includes("Docs"), "NavLinks renders the Docs text link");
    assert.ok(code(read("./Nav.tsx")).includes("<NavLinks docsHref={DOCS_URL} />"), "the header passes DOCS_URL");
    assert.ok(code(read("./Footer.tsx")).includes("href={DOCS_URL}"), "the footer links DOCS_URL");
  });

  it("no longer calls the docs legacy v1", () => {
    assert.equal(/legacy/i.test(social), false);
  });
});
