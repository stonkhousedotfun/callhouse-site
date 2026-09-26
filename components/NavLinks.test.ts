/**
 * The top bar matches the Neon mockup: How it works, Risks and Docs in the link list
 * (with FAQ after How it works), then the theme toggle, X, GitHub and Launch App. Risks stays in the
 * footer too; Legal stays footer only.
 *
 * This package's runner is `node --experimental-strip-types --test`, which does not load TSX (a `.test.tsx` file is
 * not even collected), so these are SOURCE-level checks, the same approach as app/_components/ThemeToggle.test.ts.
 * The link list is read out of NavLinks.tsx's LINKS literal and compared as data, in order.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const navLinks = read("./NavLinks.tsx");
const nav = read("./Nav.tsx");
const footer = read("./Footer.tsx");

/** Drop block and line comments so a link named only in prose cannot satisfy a check. */
const code = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

/** The in-site links, in order, from `const LINKS = [ ... ] as const;`. */
function linkList(src: string): { href: string; label: string }[] {
  const block = /const LINKS = \[([\s\S]*?)\] as const;/.exec(code(src));
  assert.ok(block, "NavLinks.tsx declares `const LINKS = [...] as const`");
  return [...block[1]!.matchAll(/\{\s*href:\s*"([^"]+)",\s*label:\s*"([^"]+)"\s*\}/g)].map((m) => ({
    href: m[1]!,
    label: m[2]!,
  }));
}

describe("site header links", () => {
  it("lists How it works, FAQ and Risks as in-site links, in that order", () => {
    assert.deepEqual(linkList(navLinks), [
      { href: "/how-it-works", label: "How it works" },
      { href: "/faq", label: "FAQ" },
      { href: "/risks", label: "Risks" },
    ]);
  });

  it("links Docs last, as a new-tab ExternalLink with an arrow, to the URL Nav passes in", () => {
    const src = code(navLinks);
    const docs = /<ExternalLink href=\{docsHref\} arrow className=\{[^}]+\}>\s*Docs\s*<\/ExternalLink>/.exec(src);
    assert.ok(docs, "NavLinks renders <ExternalLink href={docsHref} arrow ...>Docs</ExternalLink>");
    assert.ok(docs.index > src.indexOf("LINKS.map("), "Docs comes after the in-site links");
    assert.ok(src.includes("export function NavLinks({ docsHref }: { docsHref: string })"), "docsHref is a required prop");
    assert.ok(src.includes('from "@/components/ui/ExternalLink"'), "the new-tab, rel=noreferrer link component");
    assert.equal(src.includes("@/lib/site"), false, "the client island does not import lib/site");
  });

  it("Nav passes DOCS_URL, the docs origin the footer also links", () => {
    const src = code(nav);
    assert.ok(src.includes("<NavLinks docsHref={DOCS_URL} />"), "Nav.tsx renders <NavLinks docsHref={DOCS_URL} />");
    assert.ok(/import \{[^}]*\bDOCS_URL\b[^}]*\} from "@\/lib\/site";/.test(src), "DOCS_URL comes from lib/site");
    assert.ok(code(footer).includes("href={DOCS_URL}"), "the footer links the same DOCS_URL");
  });

  it("puts the links, then the theme toggle, X / GitHub and Launch App, in that order", () => {
    const src = code(nav);
    const order = ["<NavLinks ", "<ThemeToggle />", "<SocialLinks />", "Launch App"].map((m) => src.indexOf(m));
    for (const [i, at] of order.entries()) assert.ok(at >= 0, `Nav.tsx renders marker ${i}`);
    assert.deepEqual([...order].sort((a, b) => a - b), order, "links, toggle, marks, Launch App");
    const social = code(read("./SocialLinks.tsx"));
    assert.ok(social.includes("href={X_URL}") && social.indexOf("href={X_URL}") < social.indexOf("href={GITHUB_URL}"), "X before GitHub");
  });

  it("keeps Legal, Terms and Privacy out of the top bar and keeps Risks and Legal in the footer", () => {
    const hrefs = linkList(navLinks).map((l) => l.href);
    for (const footerOnly of ["/legal", "/terms", "/privacy"]) {
      assert.equal(hrefs.includes(footerOnly), false, `${footerOnly} is footer only`);
      assert.equal(code(navLinks).includes(`"${footerOnly}"`), false, `${footerOnly} is not linked from NavLinks`);
    }
    for (const kept of ['{ href: "/risks", label: "Risks" }', '{ href: "/legal", label: "Legal" }']) {
      assert.ok(footer.includes(kept), `Footer.tsx still has ${kept}`);
    }
  });

  it("marks only in-site links aria-current, by exact match", () => {
    const src = code(navLinks);
    assert.ok(src.includes("const active = pathname === link.href;"), "exact-match active test");
    assert.equal((src.match(/aria-current=/g) ?? []).length, 1, "only the mapped in-site links carry aria-current");
  });

  it("states the current reasoning: Docs is linked because the published docs describe v8", () => {
    assert.equal(navLinks.includes("the existing GitBook is legacy v1"), false, "the stale reason for leaving Docs out is gone");
    assert.ok(navLinks.includes("rewritten for v8"), "the comment says why Docs is now linked");
    assert.ok(navLinks.includes("Interface v8 is deployed on"), "the comment quotes what was checked on the published docs");
  });
});

/**
 * next/link prefetches every link in the
 * viewport, and the header is in the viewport on every page. The active link must not prefetch the page already shown,
 * and /risks (the site's largest RSC payload) must not be fetched from every page. The fix is per link, never global.
 *
 * TSX cannot be loaded here, so the Link's `prefetch={...}` expression is read out of the source and evaluated against
 * the NO_PREFETCH set the same file declares. That checks what the expression does, not how it is spelled.
 */
describe("header link prefetch", () => {
  /** The members of `const NO_PREFETCH: ReadonlySet<string> = new Set([...]);`. */
  function noPrefetch(): string[] {
    const decl = /const NO_PREFETCH: ReadonlySet<string> = new Set\(\[([^\]]*)\]\);/.exec(code(navLinks));
    assert.ok(decl, "NavLinks.tsx declares `const NO_PREFETCH: ReadonlySet<string> = new Set([...])`");
    return [...decl[1]!.matchAll(/"([^"]+)"/g)].map((m) => m[1]!);
  }

  /** The in-site Link's prefetch prop as a function of (active, href). */
  function prefetchOf(): (active: boolean, href: string) => unknown {
    const props = [...code(navLinks).matchAll(/\bprefetch=\{([^}]*)\}/g)];
    assert.equal(props.length, 1, "exactly one prefetch prop, on the mapped in-site <Link>");
    const expr = props[0]![1]!;
    assert.ok(/^[\w\s.|&!?:()"/-]+$/.test(expr), `prefetch expression is a plain boolean expression: ${expr}`);
    const set = new Set(noPrefetch());
    const fn = new Function("active", "link", "NO_PREFETCH", `return (${expr});`) as (
      active: boolean,
      link: { href: string },
      set: ReadonlySet<string>,
    ) => unknown;
    return (active, href) => fn(active, { href }, set);
  }

  it("opts /risks out, and only links the header actually renders", () => {
    assert.deepEqual(noPrefetch(), ["/risks"]);
    const hrefs = linkList(navLinks).map((l) => l.href);
    for (const href of noPrefetch()) assert.ok(hrefs.includes(href), `${href} is a header link`);
  });

  it("the active link never prefetches, /risks never prefetches, the rest keep Next's default", () => {
    const prefetch = prefetchOf();
    for (const { href } of linkList(navLinks)) {
      assert.equal(prefetch(true, href), false, `${href} does not prefetch itself when it is the current page`);
    }
    assert.equal(prefetch(false, "/risks"), false, "/risks does not prefetch from another page");
    assert.equal(prefetch(false, "/how-it-works"), undefined, "/how-it-works keeps the default prefetch");
    assert.equal(prefetch(false, "/faq"), undefined, "/faq keeps the default prefetch");
  });

  it("is per link: next.config.mjs does not switch prefetch off for the whole site", () => {
    assert.equal(/prefetch/i.test(read("../next.config.mjs")), false, "next.config.mjs does not mention prefetch");
  });
});
