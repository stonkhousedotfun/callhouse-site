/**
 * Night / day mode on the site, the node:test port of callhouse web/lib/theme.test.ts.
 * lib/theme.ts is a byte-for-byte twin of the app's (scripts/check-twins.mjs), so the behaviour tests are the same
 * cases; the globals.css guards run against THIS repo's app/globals.css, whose TWIN BLOCK must equal the app's.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import {
  applyTheme, contrastRatio, otherTheme, parseTheme, readStoredTheme, resolveTheme, storeTheme, THEME_INIT_SCRIPT,
  THEME_STORAGE_KEY, toggleLabel, type Theme,
} from "./theme.ts";

const memory = (initial: Record<string, string> = {}) => {
  const m = new Map(Object.entries(initial));
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, v); }, m };
};
const throwing = { getItem: () => { throw new Error("SecurityError"); }, setItem: () => { throw new Error("QuotaExceededError"); } };

describe("theme resolve and store", () => {
  it("a stored night or day wins over the system", () => {
    assert.equal(resolveTheme(readStoredTheme(memory({ [THEME_STORAGE_KEY]: "night" })), false), "night");
    assert.equal(resolveTheme(readStoredTheme(memory({ [THEME_STORAGE_KEY]: "day" })), true), "day");
  });
  it("nothing stored (or junk stored) follows the system", () => {
    assert.equal(resolveTheme(readStoredTheme(memory()), true), "night");
    assert.equal(resolveTheme(readStoredTheme(memory()), false), "day");
    assert.equal(readStoredTheme(memory({ [THEME_STORAGE_KEY]: "dark" })), null);
    assert.equal(parseTheme("NIGHT"), null);
  });
  it("storage that throws falls back to the system and never throws itself", () => {
    assert.equal(readStoredTheme(throwing), null);
    assert.equal(resolveTheme(readStoredTheme(throwing), true), "night");
    assert.equal(storeTheme("day", throwing), false);
    assert.equal(readStoredTheme(null), null);
  });
  it("applyTheme switches the page even when the write is refused, and persists when it is not", () => {
    const attrs: Record<string, string> = {};
    const root = { setAttribute: (k: string, v: string) => { attrs[k] = v; } };
    assert.equal(applyTheme("day", root, throwing), false);
    assert.equal(attrs["data-theme"], "day");
    const s = memory();
    assert.equal(applyTheme("night", root, s), true);
    assert.equal(s.m.get(THEME_STORAGE_KEY), "night");
  });
  it("the toggle names the mode it switches to, and the key is the app's", () => {
    assert.equal(toggleLabel("night"), "Switch to day mode");
    assert.equal(toggleLabel("day"), "Switch to night mode");
    assert.equal(otherTheme("night"), "day");
    assert.equal(THEME_STORAGE_KEY, "stonkhouse-theme");
  });
});

/** The pre-paint script is a string; it is EXECUTED here against a fake page so it cannot disagree with resolveTheme. */
describe("THEME_INIT_SCRIPT", () => {
  const run = (stored: string | null | "throw", systemDark: boolean | "throw") => {
    const attrs: Record<string, string> = {};
    const localStorage = stored === "throw" ? throwing : memory(stored === null ? {} : { [THEME_STORAGE_KEY]: stored });
    const window = { matchMedia: () => { if (systemDark === "throw") throw new Error("no matchMedia"); return { matches: systemDark }; } };
    const document = { documentElement: { setAttribute: (k: string, v: string) => { attrs[k] = v; } } };
    new Function("document", "window", "localStorage", THEME_INIT_SCRIPT)(document, window, localStorage);
    return attrs["data-theme"] ?? null;
  };
  it("agrees with resolveTheme for every stored value and system setting", () => {
    for (const stored of ["night", "day", null, "junk"] as const) {
      for (const dark of [true, false]) {
        assert.equal(run(stored, dark), resolveTheme(parseTheme(stored), dark), `stored ${stored}, dark ${dark}`);
      }
    }
  });
  it("storage throwing falls back to the system; both failing leaves the attribute unset for the CSS fallback", () => {
    assert.equal(run("throw", true), "night");
    assert.equal(run("throw", false), "day");
    assert.equal(run("throw", "throw"), null);
  });
  it("app/layout.tsx renders it in <head> and marks <html> suppressHydrationWarning", () => {
    const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
    assert.ok(layout.includes("dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}"), "the script is rendered");
    assert.ok(layout.indexOf("<head>") > -1 && layout.indexOf("THEME_INIT_SCRIPT }}") < layout.indexOf("</head>"), "inside <head>");
    assert.ok(/<html[^>]*suppressHydrationWarning/.test(layout), "html suppresses the one-attribute hydration diff");
  });
});

/*//////////////////////////////////////////////////////////////
                    globals.css GUARDS (this repo's file)
//////////////////////////////////////////////////////////////*/

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
/** The declarations of the FIRST rule whose selector text is exactly `selector` followed by " {". */
const rule = (selector: string): Record<string, string> => {
  const at = css.indexOf(`${selector} {`);
  assert.ok(at > -1, `rule ${selector} not found`);
  const body = css.slice(css.indexOf("{", at) + 1, css.indexOf("}", at));
  return Object.fromEntries([...body.matchAll(/--([a-z0-9-]+):\s*([^;]+);/gi)].map((m) => [m[1]!, m[2]!.trim()]));
};
const day = rule(':root,\n:root[data-theme="day"]');
const nightExplicit = rule(':root[data-theme="night"]');
const nightFallback = rule(':root:not([data-theme="day"])');

describe("globals.css tokens", () => {
  it("the two NIGHT copies (system fallback and explicit) are identical", () => {
    assert.deepEqual(nightFallback, nightExplicit);
  });
  it("night and day define the same names, keep every Daylight name and add the Neon ones", () => {
    assert.deepEqual(Object.keys(nightExplicit).sort(), Object.keys(day).sort());
    for (const name of ["ground", "surface", "surface-2", "ink", "ink-2", "ink-3", "line", "line-2", "accent", "accent-hover",
      "accent-ink", "accent-soft", "accent-text", "usdg", "usdg-soft", "warn", "warn-soft", "danger", "elevation-lift", "elevation-soft",
      "field", "danger-text", "danger-soft", "select-bg", "select-ink", "inverse-bg", "inverse-ink", "row-selected"]) {
      assert.ok(name in day, `--${name} missing`);
    }
  });
  it("pins the ground and accent anchor values in both modes and maps the fonts", () => {
    assert.equal(nightExplicit.ground, "#000000");
    assert.equal(nightExplicit.accent, "#c8ff2e");
    assert.equal(day.ground, "#ffffff");
    assert.equal(day.accent, "#0a7f55");
    assert.ok(css.includes("var(--font-plus-jakarta-sans)"));
    assert.ok(css.includes("--font-mono: var(--font-jetbrains-mono)"));
  });
  it("the TWIN BLOCK markers appear exactly once each, BEGIN first, the site tail after END", () => {
    const begin = css.indexOf("/* ==== TWIN BLOCK BEGIN ==== */");
    const end = css.indexOf("/* ==== TWIN BLOCK END ==== */");
    assert.equal(css.split("TWIN BLOCK BEGIN ====").length - 1, 1);
    assert.equal(css.split("TWIN BLOCK END ====").length - 1, 1);
    assert.ok(begin > -1 && end > begin);
    assert.ok(css.indexOf("SITE-ONLY TAIL") > end);
  });
});

/** Every text token on every ground, and each ink-on-fill pair, at least 4.5:1, in both modes. */
describe("contrast (WCAG 2.x)", () => {
  const TEXT = ["ink", "ink-2", "ink-3", "accent-text", "danger-text", "danger", "warn", "usdg", "accent"];
  const GROUNDS = ["ground", "surface", "surface-2", "field"];
  const FILLS = [["accent-ink", "accent"], ["select-ink", "select-bg"], ["inverse-ink", "inverse-bg"], ["accent-text", "accent-soft"],
    ["danger-text", "danger-soft"], ["warn", "warn-soft"], ["usdg", "usdg-soft"], ["ink", "row-selected"]] as const;
  for (const [mode, tokens] of [["day", day], ["night", nightExplicit]] as const) {
    it(`${mode}: all 44 pairs pass 4.5:1`, () => {
      const rows = [...TEXT.flatMap((f) => GROUNDS.map((g) => [f, g] as const)), ...FILLS]
        .map(([f, g]) => ({ pair: `${f} on ${g}`, ratio: contrastRatio(tokens[f]!, tokens[g]!) }));
      assert.equal(rows.length, 44);
      assert.deepEqual(rows.filter((r) => r.ratio < 4.5), []);
    });
  }
  it("pins the two lowest contrast ratios: day accent on field and night danger on surface-2", () => {
    assert.equal(contrastRatio(day.accent!, day.field!).toFixed(2), "4.66");
    assert.equal(contrastRatio(nightExplicit.danger!, nightExplicit["surface-2"]!).toFixed(2), "5.66");
  });
});

// Type-only use so an unused-import lint cannot drop the Theme union from this file's contract.
const _t: Theme = "night";
void _t;
