#!/usr/bin/env node
// Push gate for coding and debug items: every item whose content hash changed in the pushed range needs a review record
// (content-reviews/coding/<tech>/<id>.json) committed for that exact hash. It reads git only; it never runs a model, so
// retrying a push after an unrelated failure costs nothing. Usage:
//   node scripts/check-coding-review-records.mjs --ranges <file of "base head" lines>
//   node scripts/check-coding-review-records.mjs --base <rev> --head <rev>
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { findChangedItems, recordPath, recordProblem } from './coding-review-lib.mjs';

function readArg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
}

function revisionReader(revision) {
  const cache = new Map();
  return (filePath) => {
    if (!cache.has(filePath)) {
      let text = null;
      try {
        text = git(['show', `${revision}:${filePath}`]);
      } catch {
        // Missing at this revision.
      }
      cache.set(filePath, text);
    }
    return cache.get(filePath);
  };
}

function readRanges() {
  const rangesFile = readArg('--ranges');
  if (rangesFile) {
    return fs.readFileSync(rangesFile, 'utf8').split('\n').map((line) => line.trim().split(/\s+/)).filter((parts) => parts[0]);
  }
  const base = readArg('--base');
  const head = readArg('--head');
  if (base && head) return [[base, head]];
  console.error('[coding-review] Usage: check-coding-review-records.mjs --ranges <file> | --base <rev> --head <rev>');
  process.exit(2);
}

const problems = new Map();
let checked = 0;
for (const [base, head] of readRanges()) {
  if (!head) {
    // A new branch with no commit on any remote below it: there is nothing to compare against.
    console.warn(`[coding-review] WARN: no base for ${base}; skipping the review record check for it.`);
    continue;
  }
  const changedPaths = git(['diff', '--name-only', base, head]).split('\n').filter(Boolean);
  const readHead = revisionReader(head);
  const changed = findChangedItems({ readBase: revisionReader(base), readHead, changedPaths });
  for (const entry of changed) {
    checked += 1;
    const problem = recordProblem(entry, readHead(recordPath(entry.tech, entry.id)));
    if (problem) problems.set(`${entry.tech}/${entry.id}`, { entry, problem });
  }
}

if (problems.size) {
  console.error('[coding-review] These coding items changed without a matching review record:');
  for (const [key, { entry, problem }] of problems) {
    console.error(`  - ${key} (${entry.kind}${entry.isNew ? ', new' : ''}): ${problem}`);
  }
  console.error('[coding-review] Run, from frontend/, then commit the record:');
  for (const key of problems.keys()) {
    console.error(`    npm run review:coding-item -- ${key}`);
  }
  console.error('[coding-review] For an edit a solver would not notice: npm run review:coding-item -- <tech>/<id> --skip "<reason>"');
  console.error('[coding-review] For findings read and kept on purpose: npm run review:coding-item -- <tech>/<id> --accept A4,B2 "<reason>"');
  process.exit(1);
}
console.log(`[coding-review] OK: ${checked} changed coding item(s), all with a matching review record.`);
