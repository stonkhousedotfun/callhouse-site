/**
 * ThemeToggle on the site. The component is a copy of callhouse web/components/ThemeToggle.tsx,
 * whose vitest suite renders it. This package's runner is `node --experimental-strip-types --test`,
 * which cannot load TSX, so these are SOURCE-level checks: the behaviour the button relies on (its label, the
 * mode flip, storage) is exercised through lib/theme.ts in lib/theme.test.ts, and here we pin that the component
 * still uses those functions, keeps the 44px target and the aria-label, and is mounted in the site header.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const src = readFileSync(new URL("./ThemeToggle.tsx", import.meta.url), "utf8");

describe("ThemeToggle", () => {
  it("is a client component built on lib/theme", () => {
    assert.ok(src.trimStart().startsWith('"use client"'), "client island");
    for (const fn of ["applyTheme", "otherTheme", "resolveTheme", "toggleLabel"]) assert.ok(src.includes(fn), fn);
    assert.ok(src.includes('from "@/lib/theme"'));
  });
  it("is a real button with a 44px target and an aria-label naming the target mode", () => {
    assert.ok(src.includes('type="button"'));
    assert.ok(src.includes("min-h-11") && src.includes("min-w-11"), "44px target");
    assert.ok(/aria-label=\{/.test(src), "aria-label is computed (toggleLabel)");
  });
  it("subscribes to <html data-theme> instead of setting state in an effect (site lint rule)", () => {
    assert.ok(src.includes("useSyncExternalStore(subscribe, currentTheme, serverTheme)"));
    assert.ok(src.includes('attributeFilter: ["data-theme"]'));
    assert.equal(/useEffect\(/.test(src), false, "no effect-time setState");
  });
  it("draws both icons: the sun (circle) and the moon (path)", () => {
    assert.ok(src.includes("<circle"), "sun");
    assert.ok(src.includes("<path"), "moon");
  });
  it("is mounted in the site header", () => {
    const nav = readFileSync(new URL("../../components/Nav.tsx", import.meta.url), "utf8");
    assert.ok(nav.includes("<ThemeToggle"), "components/Nav.tsx renders <ThemeToggle />");
  });
});
