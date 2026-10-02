#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cdnRoot, frontendRoot } from './content-paths.mjs';

const publicEntries = ['questions', 'incidents', 'tradeoff-battles', 'practice', 'data-version.json'];

/** Angular 21 restricts asset inputs to the workspace. CDN remains the source of truth. */
export async function syncCdnAssets(sourceRoot, destinationRoot) {
  // Validate every source before replacing a previously usable staging directory.
  await Promise.all(publicEntries.map((entry) => fs.access(path.join(sourceRoot, entry))));
  await fs.rm(destinationRoot, { recursive: true, force: true });
  await fs.mkdir(destinationRoot, { recursive: true });
  await Promise.all(publicEntries.map((entry) => fs.cp(
    path.join(sourceRoot, entry), path.join(destinationRoot, entry), { recursive: true },
  )));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await syncCdnAssets(cdnRoot, path.join(frontendRoot, '.angular', 'cdn-assets'));
  console.log('[sync-cdn-assets] staged canonical CDN content within the Angular workspace');
}
