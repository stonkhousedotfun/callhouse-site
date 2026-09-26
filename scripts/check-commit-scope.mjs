#!/usr/bin/env node
// Commit-time guard for accidentally publishing local release/development state.
// The release manifest still requires human review; this guard is not an allowlist.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const git = process.env.GIT ?? 'git';

// Private names (an organisation, a workspace folder, a person) that must never be committed, one per line, `#` for
// a comment. Read from this file at the root of the worktree being committed AND in the git common directory
// (`git rev-parse --git-common-dir`, the main checkout's .git), so one file there serves every linked worktree. The
// root copy is git-ignored and the common-dir copy sits outside the tree, so the names never enter the repository;
// with neither file only the generic patterns in forbiddenText apply.
const PRIVATE_NAMES_FILE = '.scope-guard.local';

function parsePrivateNames(text) {
  return text.split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith('#'));
}

function readPrivateNames() {
  const [top, common] = execFileSync(git, ['rev-parse', '--path-format=absolute', '--show-toplevel', '--git-common-dir'])
    .toString('utf8').trim().split('\n');
  const names = [];
  for (const dir of new Set([top, common])) {
    try {
      names.push(...parsePrivateNames(readFileSync(join(dir, PRIVATE_NAMES_FILE), 'utf8')));
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  return names;
}

function forbiddenPath(file) {
  const name = file.split('/').at(-1);
  if (name === PRIVATE_NAMES_FILE) return 'local private-name list';
  if ((/^\.env(?:\..+)?$/i.test(name) || /\.env$/i.test(name)) && !/\.(?:example|sample|template)$/i.test(name)) return 'non-template environment file';
  if (/(^|\/)(?:broadcast|env-dev|rehearsal-logs?|\.env-dev)(\/|$)/i.test(file)) return 'development deployment artifact';
  if (/(^|\/)(?:\.next|node_modules|\.turbo|coverage|dist|out|cache)(\/|$)/i.test(file)) return 'generated build/cache artifact';
  if (/(^|\/)(?:dev\.json|rehearsal-passed\.json|deploy\.log)$/i.test(file)) return 'development deployment artifact';
  if (/\.(?:pem|key|p12|pfx|sqlite|db|log)$/i.test(file)) return 'key, database, or runtime log';
  return null;
}

// Any macOS home-directory path, the macOS temp directory, a local worktree folder, or a private name. Case-sensitive:
// a lowercase /users/<id>/ is an ordinary URL path, not a home directory.
function forbiddenText(value, privateNames) {
  if (/\/Users\/[^\s/]+\/|\/private\/tmp\/|wt\/callhouse/.test(value)) {
    return 'private workspace or remote reference';
  }
  const lower = value.toLowerCase();
  if (privateNames.some((name) => lower.includes(name.toLowerCase()))) {
    return 'private workspace or remote reference';
  }
  return null;
}

if (process.argv.includes('--self-test')) {
  assert.equal(forbiddenPath('README.md'), null);
  assert.equal(forbiddenPath('app/notes.MDX'), null);
  assert.equal(forbiddenPath('notes.MARKDOWN'), null);
  assert.equal(forbiddenPath('AGENTS.md'), null);
  assert.equal(forbiddenPath('app/.env.production'), 'non-template environment file');
  assert.equal(forbiddenPath('ops/service.env'), 'non-template environment file');
  assert.equal(forbiddenPath('.env.example'), null);
  assert.equal(forbiddenPath('ops/markets/dev.json'), 'development deployment artifact');
  assert.equal(forbiddenPath('.next/cache/preview.json'), 'generated build/cache artifact');
  assert.equal(forbiddenPath('app/page.tsx'), null);
  assert.equal(forbiddenPath('.scope-guard.local'), 'local private-name list');
  // Built from pieces, so this file itself carries no home path or private name for the scan to find.
  const reason = 'private workspace or remote reference';
  assert.equal(forbiddenText('see wt/' + 'callhouse-private', []), reason);
  assert.equal(forbiddenText('/Us' + 'ers/someone/Desktop/project/app.ts', []), reason);
  assert.equal(forbiddenText('/priv' + 'ate/tmp/scratch.json', []), reason);
  assert.equal(forbiddenText('public release', []), null);
  assert.equal(forbiddenText('GET https://api.example.com/users/42/profile', []), null);
  const remote = 'cloned from github.com/Example-Org/site';
  assert.equal(forbiddenText(remote, []), null);
  assert.equal(forbiddenText(remote, ['example-org']), reason);
  assert.equal(forbiddenText(remote, ['someone-else']), null);
  assert.deepEqual(parsePrivateNames('# comment\n\n  Example-Org \r\nA Person\n'), ['Example-Org', 'A Person']);
  console.log('scope guard self-test passed');
  process.exit(0);
}

const failures = [];
try {
  const privateNames = readPrivateNames();
  const paths = execFileSync(git, ['diff', '--cached', '--name-only', '--no-renames', '-z'])
    .toString('utf8').split('\0').filter(Boolean);
  for (const file of paths) {
    const reason = forbiddenPath(file);
    if (reason) failures.push(`${file}: ${reason}`);
  }
  const contentPaths = execFileSync(git, ['diff', '--cached', '--name-only', '--diff-filter=ACMR', '--no-renames', '-z'])
    .toString('utf8').split('\0').filter(Boolean);
  for (const file of contentPaths) {
    if (!/\.(?:md|mdx|markdown|txt|json|ya?ml|toml|[cm]?js|tsx?|html|css|sh)$/i.test(file) && !file.startsWith('.env')) continue;
    const content = execFileSync(git, ['show', `:${file}`], { maxBuffer: 20 * 1024 * 1024 });
    if (content.includes(0)) continue;
    const textReason = forbiddenText(content.toString('utf8'), privateNames);
    if (textReason) failures.push(`${file}: ${textReason}`);
  }
  try {
    execFileSync(git, ['diff', '--cached', '--check'], { stdio: 'pipe' });
  } catch (error) {
    const report = error.stdout?.toString('utf8').replace(/\r?\n$/, '');
    if (error.status !== 2 || !report || error.stderr?.length) throw error;
    failures.push(report);
  }
} catch (error) {
  console.error(`scope guard could not inspect the staged snapshot: ${error.message}`);
  process.exit(2);
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('staged scope and whitespace OK');
