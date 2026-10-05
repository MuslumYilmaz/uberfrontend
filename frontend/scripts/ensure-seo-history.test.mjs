import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import { ensureSeoHistory } from './ensure-seo-history.mjs';

const vercelEnv = {
  ...process.env,
  VERCEL: '1',
  VERCEL_GIT_PROVIDER: 'github',
  VERCEL_GIT_REPO_OWNER: 'seo-history-test',
  VERCEL_GIT_REPO_SLUG: 'content',
};
const githubUrl = 'https://github.com/seo-history-test/content.git';

function git(root, args) {
  return execFileSync('git', ['-C', root, ...args], {
    encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function fixture(t, { origin = true } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ensure-seo-history-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const source = path.join(root, 'source');
  const checkout = path.join(root, 'checkout');
  fs.mkdirSync(source);
  git(source, ['init', '--initial-branch=main']);
  for (const [index, content] of ['Original', 'Main change', 'Feature change'].entries()) {
    if (index === 2) git(source, ['checkout', '-b', 'feature']);
    fs.writeFileSync(path.join(source, 'content.txt'), content);
    git(source, ['add', 'content.txt']);
    git(source, ['-c', 'user.name=SEO Test', '-c', 'user.email=seo@example.invalid', 'commit', '-m', content]);
  }
  const revision = git(source, ['rev-parse', 'HEAD']);
  git(source, ['checkout', 'main']);
  git(root, ['clone', '--depth=1', '--branch=feature', pathToFileURL(source).href, checkout]);
  // Vercel deploys a detached shallow checkout; the feature commit is not on main.
  git(checkout, ['checkout', '--detach']);
  if (!origin) git(checkout, ['remote', 'remove', 'origin']);
  // Exercise the real fetch without network or changes to machine-wide Git config.
  git(checkout, ['config', `url.${pathToFileURL(source).href}.insteadOf`, githubUrl]);
  return { root, source, checkout, revision };
}

test('existing origin completes shallow history without changing checkout or configuration', (t) => {
  const { checkout, revision } = fixture(t);
  const config = git(checkout, ['config', '--local', '--list']);
  assert.equal(git(checkout, ['rev-parse', '--is-shallow-repository']), 'true');
  assert.deepEqual(ensureSeoHistory({ repoRoot: checkout, env: vercelEnv }), { complete: true, fetched: true });
  assert.equal(git(checkout, ['rev-parse', '--is-shallow-repository']), 'false');
  assert.equal(git(checkout, ['rev-parse', 'HEAD']), revision);
  assert.equal(git(checkout, ['rev-list', '--count', 'HEAD']), '3');
  assert.equal(git(checkout, ['config', '--local', '--list']), config);
  assert.equal(git(checkout, ['status', '--porcelain']), '');
});

test('originless Vercel fetches exact feature commit history without adding a remote', (t) => {
  const { checkout, revision } = fixture(t, { origin: false });
  const config = git(checkout, ['config', '--local', '--list']);
  assert.deepEqual(ensureSeoHistory({ repoRoot: checkout, env: vercelEnv }), { complete: true, fetched: true });
  assert.equal(git(checkout, ['rev-parse', '--is-shallow-repository']), 'false');
  assert.equal(git(checkout, ['rev-parse', 'HEAD']), revision);
  assert.equal(git(checkout, ['rev-list', '--count', 'HEAD']), '3');
  assert.equal(git(checkout, ['remote']), '');
  assert.equal(git(checkout, ['config', '--local', '--list']), config);
  assert.equal(git(checkout, ['status', '--porcelain']), '');
  assert.deepEqual(ensureSeoHistory({ repoRoot: checkout, env: {} }), { complete: true, fetched: false });
});

test('read-only check never fetches an originless Vercel checkout', (t) => {
  const { checkout } = fixture(t, { origin: false });
  assert.throws(() => ensureSeoHistory({ repoRoot: checkout, env: vercelEnv, check: true }), /Checkout is shallow/);
  assert.equal(git(checkout, ['rev-parse', '--is-shallow-repository']), 'true');
  assert.equal(fs.existsSync(path.join(checkout, '.git', 'FETCH_HEAD')), false);
});

test('missing, foreign or malformed Vercel metadata cannot select a fetch source', (t) => {
  const { checkout } = fixture(t, { origin: false });
  for (const overrides of [
    { VERCEL: '' },
    { VERCEL_GIT_PROVIDER: 'gitlab' },
    { VERCEL_GIT_REPO_OWNER: '' },
    { VERCEL_GIT_REPO_OWNER: 'owner/../../foreign' },
    { VERCEL_GIT_REPO_SLUG: '' },
    { VERCEL_GIT_REPO_SLUG: '..' },
    { VERCEL_GIT_REPO_SLUG: 'repo?other=source' },
  ]) {
    assert.throws(() => ensureSeoHistory({ repoRoot: checkout, env: { ...vercelEnv, ...overrides } }), /no origin remote/);
  }
  assert.equal(git(checkout, ['rev-parse', '--is-shallow-repository']), 'true');
  assert.equal(fs.existsSync(path.join(checkout, '.git', 'FETCH_HEAD')), false);
});

test('unavailable Vercel history fails with private-repository guidance and stays shallow', (t) => {
  const { checkout, source, root } = fixture(t, { origin: false });
  fs.renameSync(source, path.join(root, 'unavailable'));
  assert.throws(() => ensureSeoHistory({ repoRoot: checkout, env: vercelEnv }),
    /Vercel GitHub repository.*Private repositories require an authenticated origin or a full Git checkout/);
  assert.equal(git(checkout, ['rev-parse', '--is-shallow-repository']), 'true');
  assert.equal(git(checkout, ['remote']), '');
});

test('an existing inaccessible origin fails rather than switching repository sources', (t) => {
  const { checkout, root } = fixture(t);
  git(checkout, ['remote', 'set-url', 'origin', pathToFileURL(path.join(root, 'missing')).href]);
  assert.throws(() => ensureSeoHistory({ repoRoot: checkout, env: vercelEnv }), /the configured origin/);
  assert.equal(git(checkout, ['rev-parse', '--is-shallow-repository']), 'true');
});
