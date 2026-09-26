import { existsSync, readdirSync, readFileSync } from "node:fs";

const ROOT = new URL("../", import.meta.url);

/** Every source file that can put words on a page: routes, components and lib, tests excluded. */
function pageSources() {
  const sources = {};
  for (const dir of ["app", "components", "lib"]) {
    for (const name of readdirSync(new URL(dir, ROOT), { recursive: true })) {
      if (!/\.(tsx?|mjs)$/.test(name) || /\.test\.|\.generated\./.test(name)) continue;
      const path = `${dir}/${name}`;
      sources[path] = readFileSync(new URL(path, ROOT), "utf8");
    }
  }
  sources["public/llms.txt"] = readFileSync(new URL("public/llms.txt", ROOT), "utf8");
  return sources;
}

export function readSiteSurface() {
  const read = (path) => readFileSync(new URL(path, ROOT), "utf8");
  const iconPath = new URL("app/icon.svg", ROOT);
  return {
    icon: existsSync(iconPath) ? read("app/icon.svg") : "",
    image: read("app/opengraph-image.tsx"),
    footer: read("components/Footer.tsx"),
    layout: read("app/layout.tsx"),
    pages: pageSources(),
  };
}

/** Block comments (JS and JSX) and whole-line // comments. What is left is code and the words it renders. */
function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

/**
 * Beta, audit and "Dev preview" labels were removed from the site. Matched anywhere outside a
 * comment, so a string constant that would render the label counts too. This guard file is not scanned: it has to
 * name the words.
 */
export const REMOVED_STATUS_COPY =
  /\bbeta\b|\baudit(s|ed|or|ors)?\b|\bunaudited\b|dev preview|\bdev (app|book|contracts?|site)\b|test site|bug bounty/i;

/**
 * The v1 legacy-account material (Valorem Clear,
 * Seaport 1-lot listings, the run-off, the Valorem fee-switch Safe) is gone from the pages that carried it: /risks,
 * /legal and /terms. Those three pages only: lib/site.ts still holds the v1 contract constants other routes
 * read, which is a separate decision. Outside comments, like REMOVED_STATUS_COPY.
 */
export const LEGACY_ACCOUNT_PAGES = ["app/risks/page.tsx", "app/legal/page.tsx", "app/terms/page.tsx"];
export const LEGACY_ACCOUNT_COPY = /\bvalorem\b|\bseaport\b|\blegacy v1\b|\brun-off\b|\bv1 (accounts?|positions?)\b/i;

/**
 * Assertions for metadata and the site chrome that copy-lint does not cover.
 *
 * The footer carries no disclaimer paragraph ("Not available to US persons ... Nothing
 * here is financial advice ...") and no "Beta. No external audit ..." line, and no page says beta, audit or "Dev
 * preview". This guard used to REQUIRE the footer lines; it now holds their removal instead, so the copy cannot
 * creep back without a deliberate change here.
 */
export function assertSiteSurface({ icon, image, footer, layout, pages = {} }) {
  if (!/<svg\b/.test(icon)) throw new Error("Site favicon is missing");

  const imageCode = image.replace(/\/\*[\s\S]*?\*\//g, "");
  const alt = imageCode.match(/export const alt\s*=\s*(["'`])([^"'`]+)\1/);
  if (!alt?.[2]?.trim()) throw new Error("Open Graph image alt text is missing");

  const footerCode = stripComments(footer);
  for (const removed of ["Not available to US persons", "financial advice", "STATUS.auditLine", "STATUS.phase"]) {
    if (footerCode.includes(removed)) throw new Error(`Footer carries removed chrome copy: ${removed}`);
  }
  if (!/<Footer\s*\/>/.test(layout)) throw new Error("Standing footer is not rendered");

  for (const [path, source] of Object.entries({ ...pages, "app/layout.tsx": layout, "components/Footer.tsx": footer })) {
    if (path === "components/siteSurface.mjs") continue;
    const hit = stripComments(source).match(REMOVED_STATUS_COPY);
    if (hit) throw new Error(`${path} carries removed status copy: ${hit[0]}`);
  }

  // Fail closed: a page this rule cannot read is a failure, not a pass.
  for (const path of LEGACY_ACCOUNT_PAGES) {
    const source = pages[path];
    if (source === undefined) throw new Error(`${path} was not read`);
    const hit = stripComments(source).match(LEGACY_ACCOUNT_COPY);
    if (hit) throw new Error(`${path} carries removed legacy-account copy: ${hit[0]}`);
  }
}
