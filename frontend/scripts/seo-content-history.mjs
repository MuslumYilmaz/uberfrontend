import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildSeoInventory, PROJECTION_VERSION } from './seo-content-inventory.mjs';

export const BASELINE_SCHEMA_VERSION = 1;
const DEFAULT_BASELINE = 'frontend/scripts/seo-content-baseline.json';
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const HASH = /^[a-f0-9]{40,64}$/;

function git(repoRoot, args, options = {}) {
  try {
    return execFileSync('git', ['-C', repoRoot, ...args], {
      encoding: 'utf8', maxBuffer: 256 * 1024 * 1024,
      stdio: ['pipe', 'pipe', 'pipe'], ...options,
    });
  } catch (error) {
    const detail = String(error.stderr || error.message).trim();
    throw new Error(`[seo-history] git ${args[0]} failed: ${detail}`, { cause: error });
  }
}

function repoPath(value) {
  const normalized = String(value).replaceAll('\\', '/').replace(/^\.\//, '');
  if (path.posix.isAbsolute(normalized) || normalized.split('/').includes('..')) {
    throw new Error(`[seo-history] Expected a repository-relative path: ${value}`);
  }
  return normalized;
}

function isProjectionFile(file) {
  return /^(?:cdn\/(?:questions|incidents|tradeoff-battles|practice|sb)\/|frontend\/src\/app\/)/.test(file)
    && /\.(?:json|md|ts|html|[cm]?js)$/.test(file) && !file.endsWith('.spec.ts');
}

/** Immutable blob content is shared by every historical reader in one resolution. */
export class GitObjectStore {
  constructor(repoRoot) {
    this.repoRoot = path.resolve(repoRoot);
    this.blobs = new Map();
    this.trees = new Map();
  }

  tree(revision) {
    if (!this.trees.has(revision)) {
      const tree = new Map();
      const records = git(this.repoRoot, ['ls-tree', '-r', '-z', revision]).split('\0');
      for (const record of records) {
        if (!record) continue;
        const tab = record.indexOf('\t');
        const [, kind, oid] = record.slice(0, tab).split(' ');
        if (kind === 'blob') tree.set(record.slice(tab + 1), oid);
      }
      this.trees.set(revision, tree);
    }
    return this.trees.get(revision);
  }

  preload(tree) {
    this.readBlobs([...new Set([...tree].filter(([file]) => isProjectionFile(file)).map(([, oid]) => oid))]);
  }

  readBlobs(oids) {
    const missing = oids.filter((oid) => !this.blobs.has(oid));
    if (!missing.length) return;
    const buffer = git(this.repoRoot, ['cat-file', '--batch'], {
      input: `${missing.join('\n')}\n`, encoding: null,
    });
    let offset = 0;
    for (const expected of missing) {
      const end = buffer.indexOf(10, offset);
      const [oid, type, sizeText] = buffer.subarray(offset, end).toString('utf8').split(' ');
      const size = Number(sizeText);
      if (oid !== expected || type !== 'blob' || !Number.isSafeInteger(size)) {
        throw new Error(`[seo-history] Cannot read Git blob ${expected}`);
      }
      offset = end + 1;
      this.blobs.set(oid, buffer.subarray(offset, offset + size).toString('utf8'));
      offset += size + 1;
    }
  }

  read(oid) {
    if (!this.blobs.has(oid)) this.readBlobs([oid]);
    return this.blobs.get(oid);
  }
}

function readerFromTree(store, tree, { strict = true, revision } = {}) {
  let preloaded = false;
  const diagnostics = [];
  return {
    strict, revision, diagnostics,
    report: (diagnostic) => diagnostics.push(diagnostic),
    read(file) {
      const oid = tree.get(repoPath(file));
      if (!oid) return null;
      if (!preloaded) { store.preload(tree); preloaded = true; }
      return store.read(oid);
    },
    list(prefix = '') {
      const normalized = repoPath(prefix).replace(/\/$/, '');
      return [...tree.keys()].filter((file) => !normalized || file === normalized || file.startsWith(`${normalized}/`)).sort();
    },
    cacheKey: (file) => tree.get(repoPath(file)) || null,
  };
}

export function createGitReader(repoRoot, revision = 'HEAD', options = {}) {
  const store = options.store || new GitObjectStore(repoRoot);
  return readerFromTree(store, store.tree(revision), { ...options, revision });
}

export function createIndexReader(repoRoot, options = {}) {
  const store = options.store || new GitObjectStore(repoRoot);
  const tree = new Map();
  for (const record of git(repoRoot, ['ls-files', '--stage', '-z']).split('\0')) {
    if (!record) continue;
    const tab = record.indexOf('\t');
    const [, oid, stage] = record.slice(0, tab).split(' ');
    if (stage !== '0') throw new Error('[seo-history] Resolve index conflicts before validating SEO content.');
    tree.set(record.slice(tab + 1), oid);
  }
  return readerFromTree(store, tree, { ...options, revision: 'index' });
}

export function createWorktreeReader(repoRoot, options = {}) {
  const root = path.resolve(repoRoot);
  const diagnostics = [];
  let files;
  return {
    strict: options.strict ?? true, revision: 'worktree', diagnostics,
    report: (diagnostic) => diagnostics.push(diagnostic),
    read(file) {
      try { return fs.readFileSync(path.join(root, repoPath(file)), 'utf8'); }
      catch (error) { if (error.code === 'ENOENT' || error.code === 'EISDIR') return null; throw error; }
    },
    list(prefix = '') {
      const normalized = repoPath(prefix).replace(/\/$/, '');
      files ||= [...new Set(git(root, ['ls-files', '--cached', '--others', '--exclude-standard', '-z']).split('\0').filter(Boolean))];
      return files.filter((file) => (!normalized || file === normalized || file.startsWith(`${normalized}/`))
        && fs.existsSync(path.join(root, file))).sort();
    },
  };
}

function history(repoRoot, revision) {
  const raw = git(repoRoot, [
    'log', '--first-parent', '--root', '--diff-merges=first-parent',
    '--format=%x1e%H%x00%P%x00%cI%x00', '--name-only', '-z', revision,
  ]);
  return raw.split('\x1e').filter(Boolean).map((record) => {
    const [commit, parents, committedAt, ...names] = record.split('\0');
    return {
      commit: commit.trim(), parent: parents.split(' ')[0] || null, committedAt,
      files: names.map((name) => name.replace(/^\n+/, '')).filter(Boolean),
    };
  });
}

function validDay(value, today) {
  return typeof value === 'string' && DAY.test(value)
    && !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`))
    && new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value
    && value <= today;
}

function commitDay(value, today) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const day = date.toISOString().slice(0, 10);
  return validDay(day, today) ? day : null;
}

function readBaseline(file, today) {
  if (!file || !fs.existsSync(file)) return null;
  const baseline = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (baseline.schemaVersion !== BASELINE_SCHEMA_VERSION || typeof baseline.projectionVersion !== 'string' || !baseline.projectionVersion
    || !HASH.test(baseline.checkpointCommit || '') || !baseline.routes || typeof baseline.routes !== 'object' || Array.isArray(baseline.routes)) {
    throw new Error('[seo-history] Baseline schema is invalid. Rebuild it from Git history.');
  }
  for (const [route, entry] of Object.entries(baseline.routes)) {
    if (!route.startsWith('/') || typeof entry?.fingerprint !== 'string' || !entry.fingerprint
      || (entry.lastmod !== undefined && (!validDay(entry.lastmod, today) || !HASH.test(entry.sourceCommit || '')))
      || (entry.lastmod === undefined && entry.sourceCommit !== undefined)) {
      throw new Error(`[seo-history] Invalid baseline date or provenance for ${route}`);
    }
  }
  return baseline;
}

function hasCheckpointCommit(repoRoot, revision) {
  let type;
  try { type = git(repoRoot, ['cat-file', '-t', revision]).trim(); }
  catch (error) {
    // A squash merge may retain the cache file while discarding its old branch.
    // Full target history, not an unavailable cache, remains authoritative.
    if ([1, 128].includes(error.cause?.status)) return false;
    throw error;
  }
  if (type !== 'commit') throw new Error('[seo-history] Baseline checkpoint must identify a Git commit.');
  return true;
}

function affected(sources, files) {
  return files.some((file) => sources.some((source) => {
    const normalized = source.replace(/\/$/, '');
    return file === normalized || file.startsWith(`${normalized}/`);
  }));
}

/** Dates describe the latest semantic transition on the selected first-parent branch. */
export function resolveContentDates({
  repoRoot, target = 'HEAD', baselinePath, mode = 'local', snapshot = 'worktree',
  inventoryBuilder = buildSeoInventory, projectionVersion = PROJECTION_VERSION,
  now = new Date(),
} = {}) {
  if (!repoRoot) throw new Error('[seo-history] repoRoot is required');
  if (!['local', 'strict'].includes(mode) || !['worktree', 'index', 'commit'].includes(snapshot)) {
    throw new Error('[seo-history] Invalid mode or snapshot');
  }
  const root = path.resolve(repoRoot);
  const today = new Date(now).toISOString().slice(0, 10);
  const revision = git(root, ['rev-parse', '--verify', '--end-of-options', `${target}^{commit}`]).trim();
  const store = new GitObjectStore(root);
  const inventoryCache = new Map();
  const inventoryAt = (commit, strict = false) => {
    if (!inventoryCache.has(commit)) {
      const reader = createGitReader(root, commit, { store, strict });
      inventoryCache.set(commit, { entries: inventoryBuilder(reader), diagnostics: reader.diagnostics });
    }
    return inventoryCache.get(commit);
  };
  // A newly introduced projection can refer to files not yet present in HEAD.
  const committed = inventoryAt(revision, snapshot === 'commit').entries;
  const workingReader = snapshot === 'index' ? createIndexReader(root, { store }) : createWorktreeReader(root);
  const current = snapshot === 'commit' ? committed : inventoryBuilder(workingReader);
  const currentDiagnostics = snapshot === 'commit' ? inventoryCache.get(revision).diagnostics : workingReader.diagnostics;
  if (currentDiagnostics.length) {
    throw new Error(`[seo-history] Current content inventory is incomplete: ${currentDiagnostics.map((item) => `${item.route || '(unknown route)'}: ${item.reason}`).join('; ')}`);
  }
  const routes = {};
  const pending = [];
  const unresolved = [];
  const remaining = new Map();
  for (const [route, entry] of [...current].sort(([a], [b]) => a.localeCompare(b))) {
    routes[route] = { fingerprint: entry.fingerprint };
    if (committed.get(route)?.fingerprint !== entry.fingerprint) {
      pending.push(route);
      routes[route].reason = `uncommitted-${snapshot}-content`;
    } else {
      remaining.set(route, committed.get(route));
    }
  }
  // A removed public route is also a semantic worktree/index change.
  for (const route of committed.keys()) if (!current.has(route)) pending.push(route);
  pending.sort();
  if (mode === 'strict' && pending.length) {
    throw new Error(`[seo-history] Uncommitted semantic content (${snapshot}): ${pending.join(', ')}`);
  }
  const baselineFile = baselinePath === null ? null : path.resolve(root, baselinePath || DEFAULT_BASELINE);
  const baseline = readBaseline(baselineFile, today);
  const records = history(root, revision);
  const checkpointIndex = baseline ? records.findIndex((record) => record.commit === baseline.checkpointCommit) : -1;
  const shallow = git(root, ['rev-parse', '--is-shallow-repository']).trim() === 'true';
  const canUseCache = baseline?.projectionVersion === projectionVersion && checkpointIndex >= 0;
  if (shallow && !canUseCache) {
    throw new Error('[seo-history] Complete Git history is required for backfill. Run node scripts/ensure-seo-history.mjs.');
  }
  const checkpointAvailable = baseline && (checkpointIndex >= 0 || hasCheckpointCommit(root, baseline.checkpointCommit));
  if (baseline && checkpointAvailable) {
    // The cache may arrive through a merged feature branch or from another branch.
    // Its own provenance still must be valid; only its optimization is optional.
    const checkpointRecords = checkpointIndex >= 0
      ? records.slice(checkpointIndex) : history(root, baseline.checkpointCommit);
    const checkpointHistory = new Map(checkpointRecords.map((record) => [record.commit, record]));
    for (const [route, entry] of Object.entries(baseline.routes)) {
      if (!entry.lastmod) continue;
      const source = checkpointHistory.get(entry.sourceCommit);
      if (!source) {
        throw new Error(`[seo-history] Baseline provenance for ${route} is not in the available checkpoint first-parent history. Fetch complete history or rebuild the baseline.`);
      }
      if (commitDay(source.committedAt, today) !== entry.lastmod) {
        throw new Error(`[seo-history] Baseline date/provenance mismatch for ${route}: ${entry.lastmod} does not match ${entry.sourceCommit}`);
      }
    }
  }
  const activeBaseline = canUseCache ? baseline : null;

  for (const record of records) {
    if (!remaining.size) break;
    if (activeBaseline && record.commit === activeBaseline.checkpointCommit) {
      for (const [route, entry] of remaining) {
        const saved = activeBaseline.routes[route];
        if (!saved || saved.fingerprint !== entry.fingerprint) {
          throw new Error(`[seo-history] Baseline fingerprint is stale for ${route}. Rebuild the baseline from its checkpoint.`);
        }
        Object.assign(routes[route], saved.lastmod
          ? { lastmod: saved.lastmod, sourceCommit: saved.sourceCommit }
          : { reason: saved.reason || 'historical-content-unresolved' });
        if (!saved.lastmod) unresolved.push({ route, reason: routes[route].reason });
      }
      remaining.clear();
      break;
    }
    const candidates = [...remaining].filter(([, entry]) => affected(entry.sources || [], record.files));
    if (!candidates.length) continue;
    const previous = record.parent ? inventoryAt(record.parent) : { entries: new Map(), diagnostics: [] };
    for (const [route, entry] of candidates) {
      const before = previous.entries.get(route);
      const diagnostic = previous.diagnostics.find((item) => item.route === route);
      const addedDependency = diagnostic?.file && record.files.includes(diagnostic.file)
        && (entry.sources || []).includes(diagnostic.file)
        && !store.tree(record.parent).has(diagnostic.file) && store.tree(record.commit).has(diagnostic.file);
      if (!before && diagnostic && !addedDependency) {
        const reason = `historical-content-unresolved: ${diagnostic.reason}`;
        routes[route].reason = reason;
        unresolved.push({ route, reason });
        remaining.delete(route);
      } else if (!before || before.fingerprint !== entry.fingerprint) {
        const lastmod = commitDay(record.committedAt, today);
        if (!lastmod) {
          throw new Error(`[seo-history] Invalid or future commit date for ${route}: ${record.committedAt} (${record.commit})`);
        }
        Object.assign(routes[route], { lastmod, sourceCommit: record.commit });
        remaining.delete(route);
      } else {
        // Source moves do not change the date, but older transitions must follow the old path.
        remaining.set(route, before);
      }
    }
  }
  for (const route of remaining.keys()) {
    routes[route].reason = 'historical-content-unresolved: no semantic transition found';
    unresolved.push({ route, reason: routes[route].reason });
  }
  return { revision, projectionVersion, routes, pending, unresolved };
}

export function createBaseline(options) {
  const result = resolveContentDates({ ...options, baselinePath: null, snapshot: 'commit', mode: 'strict' });
  return {
    schemaVersion: BASELINE_SCHEMA_VERSION,
    projectionVersion: result.projectionVersion,
    checkpointCommit: result.revision,
    routes: result.routes,
  };
}

/** Pre-commit validation reads the index only; publication dates belong to committed builds. */
export function validateStagedContent({
  repoRoot, target = 'HEAD', inventoryBuilder = buildSeoInventory, projectionVersion = PROJECTION_VERSION,
} = {}) {
  if (!repoRoot) throw new Error('[seo-history] repoRoot is required');
  const root = path.resolve(repoRoot);
  const revision = git(root, ['rev-parse', '--verify', '--end-of-options', `${target}^{commit}`]).trim();
  const store = new GitObjectStore(root);
  const committed = inventoryBuilder(createGitReader(root, revision, { store, strict: false }));
  const stagedReader = createIndexReader(root, { store });
  const staged = inventoryBuilder(stagedReader);
  if (stagedReader.diagnostics.length) {
    throw new Error(`[seo-history] Staged content inventory is incomplete: ${stagedReader.diagnostics.map((item) => `${item.route || '(unknown route)'}: ${item.reason}`).join('; ')}`);
  }
  const routes = {};
  const pending = [];
  for (const [route, entry] of [...staged].sort(([a], [b]) => a.localeCompare(b))) {
    routes[route] = { fingerprint: entry.fingerprint };
    if (committed.get(route)?.fingerprint !== entry.fingerprint) {
      pending.push(route);
      routes[route].reason = 'uncommitted-index-content';
    }
  }
  for (const route of committed.keys()) if (!staged.has(route)) pending.push(route);
  return { revision, projectionVersion, routes, pending: pending.sort(), unresolved: [] };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  if (process.argv.includes('--baseline')) {
    const targetIndex = process.argv.indexOf('--target');
    const baseline = createBaseline({ repoRoot, target: targetIndex < 0 ? 'HEAD' : process.argv[targetIndex + 1] });
    fs.writeFileSync(path.join(repoRoot, DEFAULT_BASELINE), `${JSON.stringify(baseline, null, 2)}\n`);
    console.log(`[seo-history] Baseline: ${Object.keys(baseline.routes).length} routes at ${baseline.checkpointCommit}`);
  } else {
    const result = resolveContentDates({ repoRoot, mode: process.argv.includes('--strict') ? 'strict' : 'local' });
    console.log(JSON.stringify(result, null, 2));
  }
}
