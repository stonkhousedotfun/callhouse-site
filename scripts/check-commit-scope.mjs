#!/usr/bin/env node
// Commit-time guard for accidentally publishing local release/development state.
// The release manifest still requires human review; this guard is not an allowlist.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const git = process.env.GIT ?? 'git';

function forbiddenPath(file) {
  const name = file.split('/').at(-1);
  if (/\.(?:md|mdx|markdown)$/i.test(file)) return 'Markdown file (excluded from this migration)';
  if ((/^\.env(?:\..+)?$/i.test(name) || /\.env$/i.test(name)) && !/\.(?:example|sample|template)$/i.test(name)) return 'non-template environment file';
  if (/(^|\/)(?:broadcast|env-dev|rehearsal-logs?|\.env-dev)(\/|$)/i.test(file)) return 'development deployment artifact';
  if (/(^|\/)(?:\.next|node_modules|\.turbo|coverage|dist|out|cache)(\/|$)/i.test(file)) return 'generated build/cache artifact';
  if (/(^|\/)(?:dev\.json|rehearsal-passed\.json|deploy\.log)$/i.test(file)) return 'development deployment artifact';
  if (/\.(?:pem|key|p12|pfx|sqlite|db|log)$/i.test(file)) return 'key, database, or runtime log';
  return null;
}

function forbiddenText(value) {
  if (/\/Users\/[^\s/]+\/Desktop\/robinhood-dev|\/private\/tmp\/|wt\/callhouse|github\.com\/leekzor\//i.test(value)) {
    return 'private workspace or remote reference';
  }
  return null;
}

if (process.argv.includes('--self-test')) {
  assert.equal(forbiddenPath('README.md'), 'Markdown file (excluded from this migration)');
  assert.equal(forbiddenPath('app/notes.MDX'), 'Markdown file (excluded from this migration)');
  assert.equal(forbiddenPath('notes.MARKDOWN'), 'Markdown file (excluded from this migration)');
  assert.equal(forbiddenPath('AGENTS.md'), 'Markdown file (excluded from this migration)');
  assert.equal(forbiddenPath('app/.env.production'), 'non-template environment file');
  assert.equal(forbiddenPath('ops/service.env'), 'non-template environment file');
  assert.equal(forbiddenPath('.env.example'), null);
  assert.equal(forbiddenPath('ops/markets/dev.json'), 'development deployment artifact');
  assert.equal(forbiddenPath('.next/cache/preview.json'), 'generated build/cache artifact');
  assert.equal(forbiddenPath('app/page.tsx'), null);
  assert.equal(forbiddenText('see wt/' + 'callhouse-private'), 'private workspace or remote reference');
  assert.equal(forbiddenText('public release'), null);
  console.log('scope guard self-test passed');
  process.exit(0);
}

const failures = [];
try {
  const paths = execFileSync(git, ['diff', '--cached', '--name-only', '--no-renames', '-z'])
    .toString('utf8').split('\0').filter(Boolean);
  for (const file of paths) {
    const reason = forbiddenPath(file);
    if (reason) failures.push(`${file}: ${reason}`);
  }
  const contentPaths = execFileSync(git, ['diff', '--cached', '--name-only', '--diff-filter=ACMR', '--no-renames', '-z'])
    .toString('utf8').split('\0').filter(Boolean);
  for (const file of contentPaths) {
    if (!/\.(?:md|mdx|txt|json|ya?ml|toml|[cm]?js|tsx?|html|css|sh)$/i.test(file) && !file.startsWith('.env')) continue;
    const content = execFileSync(git, ['show', `:${file}`], { maxBuffer: 20 * 1024 * 1024 });
    if (content.includes(0)) continue;
    const textReason = forbiddenText(content.toString('utf8'));
    if (textReason) failures.push(`${file}: ${textReason}`);
  }
  execFileSync(git, ['diff', '--cached', '--check'], { stdio: 'pipe' });
} catch (error) {
  console.error(`scope guard could not inspect the staged snapshot: ${error.message}`);
  process.exit(2);
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('staged scope and whitespace OK');
