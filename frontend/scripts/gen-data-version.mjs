#!/usr/bin/env node
import crypto from 'node:crypto';
import fg from 'fast-glob';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { cdnDataVersionPath, frontendRoot, repoRoot } from './content-paths.mjs';

const CONTENT_INPUTS = [
  '../cdn/questions/**/*.{json,md}',
  '../cdn/incidents/**/*.{json,md}',
  '../cdn/tradeoff-battles/**/*.{json,md}',
  '../cdn/practice/**/*.{json,md}',
  'src/app/**/*.ts',
  // This build-only map gets its final dates after a content commit exists.
  // Including it would make tracked data-version stale after every such commit.
  '!src/app/generated/seo-content-dates.ts',
  'package.json',
  'angular.json',
];

export async function computeDataVersion(projectRoot = frontendRoot) {
  const files = await fg(CONTENT_INPUTS, { cwd: projectRoot, dot: false });
  const hash = crypto.createHash('sha1');
  for (const relative of files.sort()) {
    hash.update(relative);
    hash.update(await fs.readFile(path.join(projectRoot, relative)));
  }
  return hash.digest('hex').slice(0, 12);
}

async function main() {
  const dataVersion = await computeDataVersion();
  const text = JSON.stringify({ dataVersion }, null, 2) + '\n';
  if (process.argv.includes('--check')) {
    let previous = '';
    try { previous = await fs.readFile(cdnDataVersionPath, 'utf8'); } catch {}
    if (previous !== text) {
      console.error('[gen-data] ERROR: data version is stale.');
      console.error('[gen-data] Run: node scripts/gen-data-version.mjs');
      console.error(`  - ${path.relative(repoRoot, cdnDataVersionPath)}`);
      process.exitCode = 1;
    } else console.log(`[gen-data] check passed: ${path.relative(repoRoot, cdnDataVersionPath)} = ${dataVersion}`);
    return;
  }
  await fs.mkdir(path.dirname(cdnDataVersionPath), { recursive: true });
  await fs.writeFile(cdnDataVersionPath, text, 'utf8');
  console.log(`[gen-data] wrote ${path.relative(repoRoot, cdnDataVersionPath)} = ${dataVersion}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => { console.error(`[gen-data] ${error.message}`); process.exitCode = 1; });
}
