// Content hashes and review records for coding and debug items (docs/ai-context/coding-item-checks.md, "Review
// record and push gate"). A hash covers what a solver sees and what a solution is judged by, so a metadata edit
// (tags, sources, SEO, difficulty) needs no new review. Readers take a readText(repoRelativePath) callback that
// returns null for a missing file, so the same code hashes the working tree for the review command and a git
// revision for the pre-push gate. Node built-ins only: the gate runs inside the hook.
import crypto from 'node:crypto';

export const HASH_VERSION = 1;
export const REVIEW_TECHS = ['javascript', 'react', 'angular', 'vue', 'html', 'css'];
export const REVIEW_KINDS = ['coding', 'debug'];
export const RULE_IDS = ['A1', 'A2', 'A3', 'A4', 'A5', 'B1', 'B2', 'B3', 'B4', 'B5', 'C1', 'C2', 'C3', 'C4', 'C5'];

export const catalogPath = (tech, kind) => `cdn/questions/${tech}/${kind}.json`;
export const recordPath = (tech, id) => `content-reviews/coding/${tech}/${id}.json`;
/** Catalog entries point at `assets/...`; the canonical copy lives under `cdn/`. */
export const assetSourcePath = (asset) => `cdn/${String(asset).replace(/^\/?assets\//, '')}`;

const CATALOG_PATH_RE = /^cdn\/questions\/[^/]+\/(?:coding|debug)\.json$/;

/** Whether a changed path can change an item's hash: a catalog, a sandbox asset or a pressure mode. */
export function isReviewRelevantPath(filePath) {
  return CATALOG_PATH_RE.test(filePath) || filePath.startsWith('cdn/sb/') || filePath.startsWith('cdn/questions/pressure-modes/');
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  }
  return value;
}

const sha256 = (text) => crypto.createHash('sha256').update(text).digest('hex');
const digest = (value) => sha256(JSON.stringify(canonical(value ?? null)));

function parseAsset(text) {
  if (text == null) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/** The asset files an item's hash reads, as repo paths. */
export function assetSourcePaths(item) {
  return [item?.sdk?.asset, item?.solutionAsset, item?.pressureModeAsset].filter(Boolean).map(assetSourcePath);
}

/** What a solver sees (`page`) and what a solution is judged by (`checks`). Everything else is left out. */
export function hashParts(item, readText) {
  const asset = (ref) => (ref ? { ref, content: parseAsset(readText(assetSourcePath(ref))) } : null);
  const page = {
    title: item.title ?? null,
    description: item.description ?? null,
    starterCode: item.starterCode ?? null,
    starterCodeTs: item.starterCodeTs ?? null,
    starterAsset: asset(item.sdk?.asset),
    starterHtml: item.web?.starterHtml ?? null,
    starterCss: item.web?.starterCss ?? null,
  };
  const checks = {
    tests: item.tests ?? null,
    testsTs: item.testsTs ?? null,
    frameworkTests: item.frameworkTests ?? null,
    checkCoverage: item.checkCoverage ?? null,
    approaches: (item.solutionBlock?.approaches ?? []).map((approach) => ({
      codeJs: approach?.codeJs ?? null,
      codeTs: approach?.codeTs ?? null,
    })),
    solution: item.solution ?? null,
    solutionAsset: asset(item.solutionAsset),
    solutionHtml: item.webSolutionHtml ?? null,
    solutionCss: item.webSolutionCss ?? null,
    pressureMode: asset(item.pressureModeAsset),
  };
  return { page, checks };
}

export function itemHashes(item, readText) {
  const { page, checks } = hashParts(item, readText);
  const pageHash = digest(page);
  const checksHash = digest(checks);
  return { hashVersion: HASH_VERSION, hash: sha256(`${HASH_VERSION}:${pageHash}:${checksHash}`), pageHash, checksHash };
}

const itemKey = (entry) => `${entry.tech}/${entry.kind}/${entry.id}`;

/** Every coding and debug item, as `{ tech, kind, id, item }`. */
export function readCatalogItems(readText) {
  const entries = [];
  for (const tech of REVIEW_TECHS) {
    for (const kind of REVIEW_KINDS) {
      const text = readText(catalogPath(tech, kind));
      if (text == null) continue;
      for (const item of JSON.parse(text)) entries.push({ tech, kind, id: item.id, item });
    }
  }
  return entries;
}

/**
 * The items whose hash differs between two revisions, new items included; removed items are not listed. Items whose
 * entry and assets did not change are skipped without hashing, so only touched items read their assets.
 */
export function findChangedItems({ readBase, readHead, changedPaths }) {
  const changed = new Set(changedPaths);
  if (![...changed].some(isReviewRelevantPath)) return [];
  const before = new Map(readCatalogItems(readBase).map((entry) => [itemKey(entry), entry]));
  const result = [];
  for (const entry of readCatalogItems(readHead)) {
    const previous = before.get(itemKey(entry));
    const assetsTouched = assetSourcePaths(entry.item).some((filePath) => changed.has(filePath));
    if (previous && !assetsTouched && JSON.stringify(previous.item) === JSON.stringify(entry.item)) continue;
    const hashes = itemHashes(entry.item, readHead);
    if (previous && itemHashes(previous.item, readBase).hash === hashes.hash) continue;
    result.push({ ...entry, hashes, isNew: !previous });
  }
  return result;
}

/** Rules a person still has to look at: marked `review` and not accepted with a reason. */
export function openReviewRules(record) {
  return Object.entries(record?.rules ?? {})
    .filter(([rule, status]) => status === 'review' && !String(record?.accepted?.[rule] ?? '').trim())
    .map(([rule]) => rule);
}

/** Why a record does not cover the item's current content, or null when it does. */
export function recordProblem(entry, recordText) {
  if (recordText == null) return 'no review record';
  let record;
  try {
    record = JSON.parse(recordText);
  } catch {
    return 'the review record is not valid JSON';
  }
  if (record.hash !== entry.hashes.hash) return 'the review record is for other content (hash differs)';
  if (record.mode === 'skip') {
    return String(record.skipReason ?? '').trim() ? null : 'a skipped review needs a skipReason';
  }
  if (record.mode !== 'full') return `unknown review mode "${record.mode}"`;
  // Read the rules as well as the result, so a hand-edited result cannot hide a failed rule or an open finding.
  const failed = Object.entries(record.rules ?? {}).filter(([, status]) => status === 'fail').map(([rule]) => rule);
  if (failed.length) return `failed rules: ${failed.join(', ')}`;
  const open = openReviewRules(record);
  if (open.length) return `review findings not accepted: ${open.join(', ')}`;
  if (record.result !== 'pass') return `the review result is "${record.result}"`;
  return null;
}

/** The record as committed: stable key order, two-space indent, trailing newline. */
export function formatRecord(record) {
  return `${JSON.stringify(record, null, 2)}\n`;
}
