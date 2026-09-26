import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const GUARD = join(dirname(fileURLToPath(import.meta.url)), "check-commit-scope.mjs");
const REASON = "private workspace or remote reference";
// The staged text names an organisation that only a names file makes private.
const STAGED = "cloned from github.com/Example-Org/site\n";

// A hook or an outer repository can export GIT_DIR, GIT_INDEX_FILE and friends; the scratch repos must not inherit them.
const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith("GIT_")));
const gitIn = (dir, ...args) =>
  execFileSync("git", ["-C", dir, "-c", "core.hooksPath=/dev/null", "-c", "commit.gpgsign=false",
    "-c", "user.name=scope-guard-test", "-c", "user.email=scope-guard-test@example.invalid", ...args], { encoding: "utf8", env });

/** Run the real guard, main path included, as the pre-commit hook does: from the root of the tree being committed. */
const guardIn = (dir) => spawnSync(process.execPath, [GUARD], { cwd: dir, encoding: "utf8", env });

function scratchRepo() {
  const root = mkdtempSync(join(tmpdir(), "scope-guard-"));
  const repo = join(root, "repo");
  execFileSync("git", ["init", "-q", repo], { env });
  return { root, repo };
}

test("a name in the worktree's .scope-guard.local refuses a staged file that contains it", () => {
  const { root, repo } = scratchRepo();
  try {
    writeFileSync(join(repo, "notes.txt"), STAGED);
    gitIn(repo, "add", "notes.txt");
    const without = guardIn(repo);
    assert.equal(without.status, 0, `no names file, so the name is not private: ${without.stderr}`);

    writeFileSync(join(repo, ".scope-guard.local"), "# private names\nexample-org\n");
    const refused = guardIn(repo);
    assert.equal(refused.status, 1, refused.stdout);
    assert.match(refused.stderr, new RegExp(`^notes\\.txt: ${REASON}$`, "m"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("one .scope-guard.local in the git common dir serves a linked worktree that has none of its own", () => {
  const { root, repo } = scratchRepo();
  try {
    gitIn(repo, "commit", "-q", "--allow-empty", "--no-verify", "-m", "base");
    const linked = join(root, "linked");
    gitIn(repo, "worktree", "add", "-q", linked);
    writeFileSync(join(linked, "notes.txt"), STAGED);
    gitIn(linked, "add", "notes.txt");
    assert.equal(guardIn(linked).status, 0, "no names file anywhere yet");

    writeFileSync(join(repo, ".git", ".scope-guard.local"), "example-org\n");
    const refused = guardIn(linked);
    assert.equal(refused.status, 1, refused.stdout);
    assert.match(refused.stderr, new RegExp(`^notes\\.txt: ${REASON}$`, "m"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("force-staging a .scope-guard.local is refused by path", () => {
  const { root, repo } = scratchRepo();
  try {
    writeFileSync(join(repo, ".scope-guard.local"), "example-org\n");
    gitIn(repo, "add", "-f", ".scope-guard.local");
    const refused = guardIn(repo);
    assert.equal(refused.status, 1, refused.stdout);
    assert.match(refused.stderr, /^\.scope-guard\.local: local private-name list$/m);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
