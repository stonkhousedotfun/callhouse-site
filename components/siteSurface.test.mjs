import assert from "node:assert/strict";
import test from "node:test";

import { assertSiteSurface, readSiteSurface } from "./siteSurface.mjs";

test("favicon and Open Graph alt remain present, and no page carries the removed chrome or status copy", () => {
  const surface = readSiteSurface();
  assert.ok(Object.keys(surface.pages).length > 20, "the site-wide scan must actually read the pages");
  assert.ok("app/risks/page.tsx" in surface.pages && "app/legal/page.tsx" in surface.pages && "lib/site.ts" in surface.pages);
  assertSiteSurface(surface);
});

// The guard fails in every direction it is meant to hold (positive controls).
test("a footer that brings back the disclaimer or the audit line fails", () => {
  const surface = readSiteSurface();
  for (const back of ["<p>Not available to US persons.</p>", "<p>{STATUS.phase}. {STATUS.auditLine}</p>"]) {
    assert.throws(() => assertSiteSurface({ ...surface, footer: surface.footer + back }), /removed chrome copy/);
  }
  assert.throws(() => assertSiteSurface({ ...surface, layout: "" }), /not rendered/);
});

test("a beta, audit or Dev preview label on any page fails; the same words in a comment do not", () => {
  const surface = readSiteSurface();
  for (const back of [
    `<Chip tone="warn">Beta</Chip>`,
    `<p>No external audit report has been published.</p>`,
    `const audit = "Unaudited";`,
    `<div role="status">DEV PREVIEW · This is a test site.</div>`,
    `<p>No bug bounty is active.</p>`,
    `const appAction = DEV_PREVIEW ? "Open dev app" : "See today's contracts";`,
  ]) {
    const pages = { ...surface.pages, "app/risks/page.tsx": surface.pages["app/risks/page.tsx"] + back };
    assert.throws(() => assertSiteSurface({ ...surface, pages }), /app\/risks\/page\.tsx carries removed status copy/, back);
  }
  assert.throws(() => assertSiteSurface({ ...surface, layout: surface.layout + "<p>Beta</p>" }), /app\/layout\.tsx carries/);
  const commented = { ...surface.pages, "lib/site.ts": surface.pages["lib/site.ts"] + "\n// an external audit is pending\n/* Beta */\n" };
  assertSiteSurface({ ...surface, pages: commented });
});

// The v1 legacy-account copy stays off /legal, /terms and /risks. In a comment it is history, not copy.
test("v1 legacy-account copy on /legal, /terms or /risks fails; the same words in a comment do not", () => {
  const surface = readSiteSurface();
  for (const path of ["app/legal/page.tsx", "app/terms/page.tsx", "app/risks/page.tsx"]) {
    for (const back of [
      "<li>Legacy v1 accounts use Seaport and Valorem Clear.</li>",
      "<p>Valorem&apos;s fee switch is held by a separate Safe with one owner.</p>",
      "<p>Legacy contracts remain relevant during run-off.</p>",
      "<p>Those dependencies remain relevant until the last v1 position is closed.</p>",
    ]) {
      const pages = { ...surface.pages, [path]: surface.pages[path] + back };
      const where = new RegExp(`${path.replace(/[./]/g, "\\$&")} carries removed legacy-account copy`);
      assert.throws(() => assertSiteSurface({ ...surface, pages }), where, `${path}: ${back}`);
    }
  }
  const commented = {
    ...surface.pages,
    "app/terms/page.tsx": surface.pages["app/terms/page.tsx"] + "\n/* the Valorem / Seaport run-off was removed */\n",
  };
  assertSiteSurface({ ...surface, pages: commented });
  const missing = { ...surface.pages };
  delete missing["app/terms/page.tsx"];
  assert.throws(() => assertSiteSurface({ ...surface, pages: missing }), /app\/terms\/page\.tsx was not read/);
});
