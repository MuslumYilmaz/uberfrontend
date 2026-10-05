import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import { createBaseline, createGitReader, createIndexReader, resolveContentDates, validateStagedContent } from './seo-content-history.mjs';
import { ensureSeoHistory } from './ensure-seo-history.mjs';

function git(root, args, env = {}) {
  return execFileSync('git', ['-C', root, ...args], {
    encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, ...env },
  }).trim();
}

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'seo-history-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  git(root, ['init', '--initial-branch=main']);
  const write = (file, value) => {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), typeof value === 'string' ? value : JSON.stringify(value));
  };
  const commit = (day, message = day) => {
    git(root, ['add', '-A']);
    git(root, ['-c', 'user.name=SEO Test', '-c', 'user.email=seo@example.invalid', 'commit', '-m', message], {
      GIT_AUTHOR_DATE: `${day}T12:00:00+00:00`, GIT_COMMITTER_DATE: `${day}T12:00:00+00:00`,
    });
    return git(root, ['rev-parse', 'HEAD']);
  };
  const resolve = (options = {}) => resolveContentDates({
    repoRoot: root, inventoryBuilder: inventory, projectionVersion: 'fixture-v1',
    snapshot: 'commit', now: '2026-10-05', ...options,
  });
  return { root, write, commit, resolve };
}

function inventory(reader) {
  const source = reader.read('route-source.txt')?.trim() || 'content.json';
  const raw = reader.read(source);
  const entries = new Map();
  if (!raw) return entries;
  for (const item of JSON.parse(raw)) {
    const semantic = { id: item.id, title: item.title, body: item.body };
    entries.set(`/${item.id}`, {
      fingerprint: crypto.createHash('sha256').update(JSON.stringify(semantic)).digest('hex'),
      sources: [source, 'route-source.txt'],
    });
  }
  return entries;
}

const twoItems = () => [{ id: 'a', title: 'A', body: 'First' }, { id: 'b', title: 'B', body: 'Second' }];

test('one object changes without redating siblings; formatting, metadata and styles are ignored', (t) => {
  const f = fixture(t);
  f.write('content.json', twoItems());
  const initial = f.commit('2026-01-01');
  const changed = twoItems(); changed[0].body = 'Corrected explanation';
  f.write('content.json', changed);
  const edited = f.commit('2026-02-02');
  changed[0].updatedAt = '2026-03-03';
  f.write('content.json', JSON.stringify(changed, null, 4));
  f.write('styles.css', 'main { color: red; }');
  f.commit('2026-03-03');
  const result = f.resolve();
  assert.equal(result.routes['/a'].sourceCommit, edited);
  assert.equal(result.routes['/a'].lastmod, '2026-02-02');
  assert.equal(result.routes['/b'].sourceCommit, initial);
  assert.equal(result.routes['/b'].lastmod, '2026-01-01');
  assert.deepEqual(result.unresolved, []);
});

test('checkpoint cache preserves dates and detects a later revert to identical content', (t) => {
  const f = fixture(t);
  f.write('content.json', twoItems());
  f.commit('2026-01-01');
  const baseline = createBaseline({ repoRoot: f.root, inventoryBuilder: inventory, projectionVersion: 'fixture-v1', now: '2026-10-05' });
  f.write('baseline.json', baseline);
  f.commit('2026-01-02');
  assert.equal(f.resolve({ baselinePath: 'baseline.json' }).routes['/a'].lastmod, '2026-01-01');
  const changed = twoItems(); changed[0].body = 'Temporary correction';
  f.write('content.json', changed); f.commit('2026-02-01');
  f.write('content.json', twoItems());
  const revert = f.commit('2026-03-01');
  const result = f.resolve({ baselinePath: 'baseline.json' });
  assert.equal(result.routes['/a'].sourceCommit, revert);
  assert.equal(result.routes['/a'].lastmod, '2026-03-01');
  assert.equal(result.routes['/b'].lastmod, '2026-01-01');
});

test('a projection version change backfills real semantic dates without changing the checkpoint file', (t) => {
  const f = fixture(t);
  f.write('content.json', twoItems());
  const initial = f.commit('2026-01-01');
  const baseline = createBaseline({ repoRoot: f.root, inventoryBuilder: inventory, projectionVersion: 'fixture-v1', now: '2026-10-05' });
  f.write('baseline.json', baseline); f.commit('2026-02-01');
  const before = fs.readFileSync(path.join(f.root, 'baseline.json'));
  const result = f.resolve({ baselinePath: 'baseline.json', projectionVersion: 'fixture-v2' });
  assert.equal(result.projectionVersion, 'fixture-v2');
  assert.equal(result.routes['/a'].lastmod, '2026-01-01');
  assert.equal(result.routes['/a'].sourceCommit, initial);
  assert.deepEqual(fs.readFileSync(path.join(f.root, 'baseline.json')), before);
});

test('a moved source keeps its semantic date and historical reads follow the prior location', (t) => {
  const f = fixture(t);
  f.write('content.json', twoItems());
  const initial = f.commit('2026-01-01');
  fs.renameSync(path.join(f.root, 'content.json'), path.join(f.root, 'moved.json'));
  f.write('route-source.txt', 'moved.json');
  f.commit('2026-02-01');
  const result = f.resolve();
  assert.equal(result.routes['/a'].sourceCommit, initial);
  assert.equal(result.routes['/b'].lastmod, '2026-01-01');
});

test('local dirty routes omit dates; strict mode rejects them; staged validation only reads the index', (t) => {
  const f = fixture(t);
  f.write('content.json', twoItems()); f.commit('2026-01-01');
  const changed = twoItems(); changed[0].body = 'Unstaged';
  f.write('content.json', changed);
  const indexBefore = fs.readFileSync(path.join(f.root, '.git/index'));
  const indexResult = f.resolve({ snapshot: 'index' });
  assert.deepEqual(indexResult.pending, []);
  assert.equal(indexResult.routes['/a'].lastmod, '2026-01-01');
  const local = f.resolve({ snapshot: 'worktree' });
  assert.deepEqual(local.pending, ['/a']);
  assert.equal(local.routes['/a'].lastmod, undefined);
  assert.equal(local.routes['/b'].lastmod, '2026-01-01');
  assert.throws(() => f.resolve({ snapshot: 'worktree', mode: 'strict' }), /Uncommitted semantic content/);
  assert.deepEqual(fs.readFileSync(path.join(f.root, '.git/index')), indexBefore);
  git(f.root, ['add', 'content.json']);
  assert.deepEqual(f.resolve({ snapshot: 'index' }).pending, ['/a']);
});

test('dedicated staged validation ignores broken unstaged content and baseline without writes', (t) => {
  const f = fixture(t);
  f.write('content.json', twoItems()); f.commit('2026-01-01');
  const changed = twoItems(); changed[0].body = 'Staged correction';
  f.write('content.json', changed);
  git(f.root, ['add', 'content.json']);
  f.write('content.json', '{broken unstaged JSON');
  f.write('frontend/scripts/seo-content-baseline.json', '{broken unstaged baseline');
  const treeBefore = git(f.root, ['status', '--porcelain=v1', '--untracked-files=all']);
  const indexBefore = fs.readFileSync(path.join(f.root, '.git/index'));
  const result = validateStagedContent({ repoRoot: f.root, inventoryBuilder: inventory, projectionVersion: 'fixture-v1' });
  assert.deepEqual(result.pending, ['/a']);
  assert.equal(result.routes['/a'].lastmod, undefined);
  assert.equal(result.routes['/b'].lastmod, undefined);
  assert.deepEqual(fs.readFileSync(path.join(f.root, '.git/index')), indexBefore);
  assert.equal(git(f.root, ['status', '--porcelain=v1', '--untracked-files=all']), treeBefore);
  assert.equal(fs.readFileSync(path.join(f.root, 'content.json'), 'utf8'), '{broken unstaged JSON');
});

test('merge dates reflect the first-parent integration commit', (t) => {
  const f = fixture(t);
  f.write('content.json', twoItems()); f.commit('2026-01-01');
  git(f.root, ['checkout', '-b', 'feature']);
  const changed = twoItems(); changed[0].body = 'Feature article';
  f.write('content.json', changed); f.commit('2026-02-01');
  git(f.root, ['checkout', 'main']);
  git(f.root, ['-c', 'user.name=SEO Test', '-c', 'user.email=seo@example.invalid', 'merge', '--no-ff', 'feature', '-m', 'Publish feature'], {
    GIT_AUTHOR_DATE: '2026-03-01T12:00:00+00:00', GIT_COMMITTER_DATE: '2026-03-01T12:00:00+00:00',
  });
  const result = f.resolve();
  assert.equal(result.routes['/a'].lastmod, '2026-03-01');
  assert.equal(result.routes['/b'].lastmod, '2026-01-01');
});

test('a checkpoint received through a merged branch is verified then bypassed for first-parent backfill', (t) => {
  const f = fixture(t);
  f.write('content.json', twoItems()); f.commit('2026-01-01');
  git(f.root, ['checkout', '-b', 'feature']);
  const changed = twoItems(); changed[0].body = 'Feature article';
  f.write('content.json', changed); f.commit('2026-02-01');
  f.write('baseline.json', createBaseline({ repoRoot: f.root, inventoryBuilder: inventory, projectionVersion: 'fixture-v1', now: '2026-10-05' }));
  f.commit('2026-02-02');
  git(f.root, ['checkout', 'main']);
  git(f.root, ['-c', 'user.name=SEO Test', '-c', 'user.email=seo@example.invalid', 'merge', '--no-ff', 'feature', '-m', 'Publish feature'], {
    GIT_AUTHOR_DATE: '2026-03-01T12:00:00+00:00', GIT_COMMITTER_DATE: '2026-03-01T12:00:00+00:00',
  });
  const result = f.resolve({ baselinePath: 'baseline.json' });
  assert.equal(result.routes['/a'].lastmod, '2026-03-01');
  assert.equal(result.routes['/b'].lastmod, '2026-01-01');
});

test('full target history replaces an unavailable squashed checkpoint without trusting cached dates', (t) => {
  const f = fixture(t);
  f.write('content.json', twoItems());
  const actualCommit = f.commit('2026-01-01');
  const baseline = createBaseline({ repoRoot: f.root, inventoryBuilder: inventory, projectionVersion: 'fixture-v1', now: '2026-10-05' });
  baseline.checkpointCommit = 'e'.repeat(40);
  for (const entry of Object.values(baseline.routes)) {
    entry.lastmod = '2026-09-30';
    entry.sourceCommit = 'f'.repeat(40);
  }
  f.write('baseline.json', baseline);
  const result = f.resolve({ baselinePath: 'baseline.json', mode: 'strict' });
  assert.equal(result.routes['/a'].sourceCommit, actualCommit);
  assert.equal(result.routes['/a'].lastmod, '2026-01-01');
  assert.equal(result.routes['/b'].lastmod, '2026-01-01');
  baseline.schemaVersion = 999;
  f.write('baseline.json', baseline);
  assert.throws(() => f.resolve({ baselinePath: 'baseline.json' }), /Baseline schema/);
});

test('committer dates use UTC; future dates never enter generated metadata', (t) => {
  const f = fixture(t);
  f.write('content.json', twoItems());
  git(f.root, ['add', '-A']);
  git(f.root, ['-c', 'user.name=SEO Test', '-c', 'user.email=seo@example.invalid', 'commit', '-m', 'UTC boundary'], {
    GIT_AUTHOR_DATE: '2026-01-02T01:00:00+03:00', GIT_COMMITTER_DATE: '2026-01-02T01:00:00+03:00',
  });
  assert.equal(f.resolve().routes['/a'].lastmod, '2026-01-01');
  const changed = twoItems(); changed[0].body = 'Future';
  f.write('content.json', changed); f.commit('2027-01-01');
  assert.throws(() => f.resolve(), /Invalid or future commit date/);
});

test('baseline rejects invalid schema, dates and provenance', (t) => {
  const f = fixture(t);
  f.write('content.json', twoItems()); f.commit('2026-01-01');
  const baseline = createBaseline({ repoRoot: f.root, inventoryBuilder: inventory, projectionVersion: 'fixture-v1', now: '2026-10-05' });
  f.write('baseline.json', { ...baseline, schemaVersion: 999 });
  assert.throws(() => f.resolve({ baselinePath: 'baseline.json' }), /Baseline schema/);
  baseline.routes['/a'].lastmod = '2026-02-31';
  f.write('baseline.json', baseline);
  assert.throws(() => f.resolve({ baselinePath: 'baseline.json' }), /Invalid baseline date/);
  baseline.routes['/a'].lastmod = '2026-02-01';
  f.write('baseline.json', baseline);
  assert.throws(() => f.resolve({ baselinePath: 'baseline.json' }), /Baseline date\/provenance mismatch/);
  baseline.routes['/a'].lastmod = '2026-01-01';
  baseline.routes['/a'].sourceCommit = 'f'.repeat(40);
  f.write('baseline.json', baseline);
  assert.throws(() => f.resolve({ baselinePath: 'baseline.json' }), /Baseline provenance/);
});

test('shallow history fails closed; read-only prerequisite check does not fetch', (t) => {
  const f = fixture(t);
  f.write('content.json', twoItems()); f.commit('2026-01-01');
  f.write('styles.css', 'body {}'); f.commit('2026-02-01');
  const clone = fs.mkdtempSync(path.join(os.tmpdir(), 'seo-shallow-'));
  t.after(() => fs.rmSync(clone, { recursive: true, force: true }));
  execFileSync('git', ['clone', '--depth=1', pathToFileURL(f.root).href, clone], { stdio: 'pipe' });
  const shallowBefore = fs.readFileSync(path.join(clone, '.git/shallow'));
  assert.throws(() => ensureSeoHistory({ repoRoot: clone, check: true }), /shallow/);
  assert.deepEqual(validateStagedContent({ repoRoot: clone, inventoryBuilder: inventory, projectionVersion: 'fixture-v1' }).pending, []);
  assert.deepEqual(fs.readFileSync(path.join(clone, '.git/shallow')), shallowBefore);
  assert.throws(() => resolveContentDates({ repoRoot: clone, inventoryBuilder: inventory, projectionVersion: 'fixture-v1', snapshot: 'commit' }), /Complete Git history/);
  const unavailable = createBaseline({ repoRoot: f.root, inventoryBuilder: inventory, projectionVersion: 'fixture-v1' });
  unavailable.checkpointCommit = 'e'.repeat(40);
  fs.writeFileSync(path.join(clone, 'baseline.json'), JSON.stringify(unavailable));
  assert.throws(() => resolveContentDates({ repoRoot: clone, inventoryBuilder: inventory, projectionVersion: 'fixture-v1', snapshot: 'commit', baselinePath: 'baseline.json' }), /Complete Git history/);
  assert.deepEqual(ensureSeoHistory({ repoRoot: clone }), { complete: true, fetched: true });
  assert.equal(resolveContentDates({ repoRoot: clone, inventoryBuilder: inventory, projectionVersion: 'fixture-v1', snapshot: 'commit' }).routes['/a'].lastmod, '2026-01-01');
});

test('revision/index readers preserve UTF-8 and newline content and reject traversal', (t) => {
  const f = fixture(t);
  f.write('content.json', twoItems());
  f.write('nested/a.txt', 'Türkçe içerik\nSecond line\n'); f.commit('2026-01-01');
  const reader = createGitReader(f.root);
  assert.equal(reader.read('nested/a.txt'), 'Türkçe içerik\nSecond line\n');
  assert.deepEqual(reader.list('nested'), ['nested/a.txt']);
  assert.equal(reader.read('missing.txt'), null);
  assert.throws(() => reader.read('../outside'), /repository-relative/);
  assert.equal(createIndexReader(f.root).read('nested/a.txt'), reader.read('nested/a.txt'));
});

test('adding a formerly missing referenced asset is a known semantic transition', (t) => {
  const f = fixture(t);
  const withAsset = (reader) => {
    const entries = inventory(reader);
    if (!entries.has('/a')) return entries;
    const asset = reader.read('asset.json');
    if (asset === null) {
      reader.report({ route: '/a', reason: 'Missing referenced asset', file: 'asset.json' });
      entries.delete('/a');
    } else {
      const entry = entries.get('/a');
      entry.fingerprint += asset;
      entry.sources.push('asset.json');
    }
    return entries;
  };
  f.write('content.json', twoItems()); f.commit('2026-01-01');
  assert.throws(() => f.resolve({ inventoryBuilder: withAsset }), /Current content inventory is incomplete/);
  f.write('asset.json', { explanation: 'Now available' });
  const added = f.commit('2026-02-01');
  const result = f.resolve({ inventoryBuilder: withAsset });
  assert.equal(result.routes['/a'].sourceCommit, added);
  assert.equal(result.routes['/a'].lastmod, '2026-02-01');
  assert.deepEqual(result.unresolved, []);
});
