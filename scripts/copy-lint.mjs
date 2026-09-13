#!/usr/bin/env node
/**
 * copy-lint — enforces the frontend copy rules from README "Frontend copy" and
 * TECHSPEC 7.3 (both in leekzor/callhouse). These are compliance rules, not style
 * rules. They fail CI.
 *
 * This repo is callhouse.finance, the public marketing landing. It is the surface the
 * rules were actually written about: the page a stranger reads before they have
 * connected anything, so every forbidden claim and every required disclosure
 * matters most here. The package root is the repo root; node_modules, .next and
 * other build output are skipped. The dapp (app.callhouse.finance) lives in
 * leekzor/callhouse, carries its own copy of this script, and is linted there with
 * the same FORBIDDEN table.
 *
 * ORIGIN: split out of leekzor/callhouse `scripts/copy-lint.mjs`, which linted both
 * web/ and site/. FORBIDDEN is byte-identical to that file's table and REQUIRED is
 * exactly its `pkg: "site"` rows. Change a rule here and change it there in a paired
 * commit, or the two domains are held to different compliance standards.
 *
 * FORBIDDEN: marketing claims we are not allowed to make. Checked twice per file:
 *   once per line (so the report names the line), and once against the whole file
 *   flattened to one line, because JSX copy wraps and a phrase split at a line
 *   break ("projected\nyield") is invisible to a per-line scan. The flattened pass
 *   only reports what the per-line pass did not already catch.
 * REQUIRED:  disclosures that must be literally present on specific pages. Also
 *   checked against the flattened file, so a disclosure may itself wrap.
 *
 * SELF-TEST: every run first lints synthetic trees in a temp directory and asserts
 * the linter still fails where it must and passes where it must. A gate that
 * cannot demonstrate it fails on known-bad input proves nothing when it is green,
 * and this file was once green while both of its passes were blind. The self-test
 * is not optional and has no flag; it costs milliseconds and no dependencies.
 *
 * DELIBERATELY ABSENT: no dependencies (this runs in CI before any install), no
 * auto-fix, no severity levels, no per-file rule overrides.
 *
 * Escape hatch: put `copy-lint-allow` in a comment on the same line. Use it only
 * where the forbidden phrase appears inside an explicit negation, e.g. a docs page
 * saying "we do not publish an APY". Allowed lines are also excluded from the
 * flattened pass.
 */
import {readFileSync, readdirSync, statSync, mkdtempSync, mkdirSync, rmSync, writeFileSync} from "node:fs";
import {join, dirname, relative, extname} from "node:path";
import {tmpdir} from "node:os";
import {fileURLToPath} from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const EXT = new Set([".tsx", ".ts", ".jsx", ".js", ".md", ".mdx", ".html", ".json"]);
const SKIP_DIR = new Set(["node_modules", ".next", "dist", "out", ".git", "coverage"]);

/** The package under compliance: this repo, rooted at the repo root. It must exist. */
const PACKAGES = [{name: "site", dir: ROOT}];

/** Phrases that must never appear on the marketing surface. */
const FORBIDDEN = [
  {re: /\bAPY\b/i, why: 'README "Frontend copy": APY is not allowed on the marketing surface'},
  {re: /\bAPR\b/i, why: "annualized-return claims are not allowed; show last week realized USDG only"},
  {re: /10\s*%\s*weekly/i, why: 'README "Frontend copy": "10% weekly" is not allowed'},
  {re: /projected\s+(yield|return|apy|income)/i, why: "TECHSPEC 7.3: projected yield is not allowed"},
  {re: /annuali[sz]ed/i, why: "TECHSPEC 8: do not annualize on the page"},
  {re: /backed\s+by\s+nvidia/i, why: 'TECHSPEC 7.3: "backed by Nvidia the company" is not allowed'},
  {re: /dividend\s+paid\s+(in\s+cash\s+)?by\s+nvidia/i, why: "TECHSPEC 7.3: Nvidia does not pay you a dividend"},
  {re: /guaranteed\s+(yield|return|premium)/i, why: "premium is paid only if a buyer fills; nothing is guaranteed"},
  {re: /risk[-\s]?free/i, why: "assignment and issuer freeze are real risks"},
];

/**
 * Disclosures required on specific routes. `pkg` names the package the page lives
 * in (always "site" in this repo; kept so these rows stay identical to the site rows
 * in leekzor/callhouse); `page` is matched against the POSIX relative path of the
 * file inside it.
 *
 * The assignment wording differs by surface on purpose. On the dapp the reader is a
 * depositor, so it is "your tokens". Here nobody has deposited yet, so it is
 * "the collateral". Do not unify them.
 */
const REQUIRED = [
  {
    pkg: "site",
    page: "app/legal/page.tsx",
    phrases: ["not available to US persons", "Robinhood Assets (Jersey) Limited"],
  },
  {
    // The Terms of Use restate the perimeter verbatim. "Draft" here only proves the draft-marker
    // code is still in the file; whether it renders is decided by LEGAL_DOCS_VERSION in
    // lib/legal.ts.
    pkg: "site",
    page: "app/terms/page.tsx",
    phrases: ["not available to US persons", "Draft"],
  },
  {
    pkg: "site",
    page: "app/privacy/page.tsx",
    phrases: ["Draft"],
  },
  {
    pkg: "site",
    page: "app/page.tsx",
    phrases: [
      "Premium is paid only if a buyer fills",
      "Assignment can take the collateral at the strike",
      "Stock Tokens are debt securities",
    ],
  },
  {
    pkg: "site",
    page: "app/risks/page.tsx",
    phrases: ["Premium is paid only if a buyer fills"],
  },
];

function walk(dir, acc = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return acc;
  }
  for (const name of entries) {
    if (SKIP_DIR.has(name)) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else if (EXT.has(extname(p))) acc.push(p);
  }
  return acc;
}

function isDir(p) {
  try {
    return statSync(p).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Lints `packages` against FORBIDDEN and `required`, returning every violation as a
 * string plus the scanned-file count per package. Pure with respect to its inputs —
 * the self-test drives it with synthetic trees before the real run trusts it.
 */
function lintPackages(packages, required) {
  const errors = [];
  const counts = new Map();
  const present = new Set();

  for (const {name, dir} of packages) {
    counts.set(name, 0);
    if (!isDir(dir)) {
      errors.push(`${name}/  MISSING — package root does not exist; nothing to scan is a failure, not a pass`);
      continue;
    }
    present.add(name);

    const files = walk(dir);
    counts.set(name, files.length);
    if (files.length === 0) {
      errors.push(`${name}/  scanned 0 files — is the ${name} package scaffolded?`);
      continue;
    }

    for (const file of files) {
      const rel = relative(dir, file).split("\\").join("/");
      const lines = readFileSync(file, "utf8").split("\n");
      const caught = new Set();
      lines.forEach((line, i) => {
        if (line.includes("copy-lint-allow")) return;
        for (const rule of FORBIDDEN) {
          const m = line.match(rule.re);
          if (m) {
            caught.add(rule);
            errors.push(`${name}/${rel}:${i + 1}  forbidden copy ${JSON.stringify(m[0])} — ${rule.why}`);
          }
        }
      });
      // Second pass over the file flattened to one line: a forbidden phrase split at a
      // JSX line wrap matches no single line. Rules already caught above are skipped so
      // a hit is not reported twice. Allowed lines are left out of the flattening.
      const flat = lines
        .filter((line) => !line.includes("copy-lint-allow"))
        .join(" ")
        .replace(/\s+/g, " ");
      for (const rule of FORBIDDEN) {
        if (caught.has(rule)) continue;
        const m = flat.match(rule.re);
        if (m) {
          errors.push(
            `${name}/${rel}  forbidden copy ${JSON.stringify(m[0])} spans a line break — ${rule.why}`,
          );
        }
      }
    }
  }

  for (const {pkg, page, phrases} of required) {
    // A missing package is already reported once; do not repeat it per page.
    if (!present.has(pkg)) continue;
    const dir = packages.find((p) => p.name === pkg).dir;
    let body;
    try {
      body = readFileSync(join(dir, page), "utf8");
    } catch {
      errors.push(`${pkg}/${page}  MISSING — required disclosure page does not exist`);
      continue;
    }
    const flat = body.replace(/\s+/g, " ");
    for (const phrase of phrases) {
      if (!flat.includes(phrase.replace(/\s+/g, " "))) {
        errors.push(`${pkg}/${page}  missing required disclosure: ${JSON.stringify(phrase)}`);
      }
    }
  }

  return {errors, counts};
}

/**
 * Proves the linter can still fail before any green result is believed. Each case
 * builds a tree under a fresh temp dir and asserts on the error list; the required
 * pages of the clean tree are generated from REQUIRED itself, so the test exercises
 * the real rule set rather than a copy of it that could drift.
 */
function selfTest() {
  const tmp = mkdtempSync(join(tmpdir(), "copy-lint-"));
  const site = join(tmp, "site");
  const packages = [{name: "site", dir: site}];
  const writeCleanTree = () => {
    mkdirSync(site, {recursive: true});
    writeFileSync(join(site, "prose.tsx"), "export const Prose = () => <>ordinary descriptive copy</>;\n");
    for (const {pkg, page, phrases} of REQUIRED) {
      const f = join(tmp, pkg, page);
      mkdirSync(dirname(f), {recursive: true});
      writeFileSync(f, phrases.join("\n") + "\n");
    }
  };
  let ran = 0;
  const expect = (label, mutate, ok) => {
    ran += 1;
    rmSync(tmp, {recursive: true, force: true});
    mkdirSync(tmp, {recursive: true});
    writeCleanTree();
    if (mutate) mutate();
    const {errors} = lintPackages(packages, REQUIRED);
    if (!ok(errors)) {
      console.error(`copy-lint self-test FAILED — ${label}\n  got: ${JSON.stringify(errors)}`);
      rmSync(tmp, {recursive: true, force: true});
      process.exit(1);
    }
  };
  try {
    expect("a clean tree passes", null, (e) => e.length === 0);
    expect(
      "a forbidden phrase on one line is caught",
      () => writeFileSync(join(site, "prose.tsx"), "earn a steady APY here\n"),
      (e) => e.some((x) => x.includes("forbidden copy")),
    );
    expect(
      "a forbidden phrase wrapped across lines is caught",
      () => writeFileSync(join(site, "prose.tsx"), "the projected\n   yield on offer\n"),
      (e) => e.some((x) => x.includes("spans a line break")),
    );
    expect(
      "copy-lint-allow escapes a negation",
      () => writeFileSync(join(site, "prose.tsx"), "we do not publish an APY // copy-lint-allow\n"),
      (e) => e.length === 0,
    );
    expect(
      "a missing required disclosure is caught",
      () => writeFileSync(join(site, "app", "risks", "page.tsx"), "nothing disclosed here\n"),
      (e) => e.some((x) => x.includes("missing required disclosure")),
    );
    expect(
      "a required disclosure may itself wrap lines",
      () => writeFileSync(join(site, "app", "risks", "page.tsx"), "Premium is paid only if\n  a buyer fills\n"),
      (e) => !e.some((x) => x.includes("missing required disclosure")),
    );
    expect(
      // The package root is the repo root here, so dependencies and build output sit INSIDE
      // the scanned tree. They must be skipped, or every install would fail the gate.
      "node_modules and .next under the package root are not scanned",
      () => {
        for (const d of ["node_modules/some-dep", ".next/server"]) {
          mkdirSync(join(site, d), {recursive: true});
          writeFileSync(join(site, d, "index.js"), "a guaranteed yield, risk-free\n");
        }
      },
      (e) => e.length === 0,
    );
    expect(
      "a vanished package root is a hard failure",
      () => rmSync(site, {recursive: true, force: true}),
      (e) => e.some((x) => x.includes("MISSING")),
    );
  } finally {
    rmSync(tmp, {recursive: true, force: true});
  }
  console.log(`copy-lint self-test OK — ${ran} cases`);
}

selfTest();

const {errors, counts} = lintPackages(PACKAGES, REQUIRED);
const tally = PACKAGES.map(({name}) => `${counts.get(name)} files in ${name}`).join(", ");

if (errors.length) {
  console.error(`\ncopy-lint FAILED — ${errors.length} violation(s) across ${tally}:\n`);
  for (const e of errors) console.error("  " + e);
  console.error("\nThese are compliance rules from README 'Frontend copy' and TECHSPEC 7.3 (leekzor/callhouse).");
  console.error("This repo is callhouse.finance, the public landing these rules exist for. It is not exempt.");
  console.error("If a hit is inside an explicit negation, add a `copy-lint-allow` comment on that line.\n");
  process.exit(1);
}

console.log(`copy-lint OK — ${tally}, 0 violations.`);
