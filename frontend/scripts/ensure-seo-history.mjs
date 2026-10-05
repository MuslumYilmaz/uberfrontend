import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function ensureSeoHistory({ repoRoot, check = false } = {}) {
  const run = (args) => execFileSync('git', ['-C', repoRoot, ...args], {
    encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 32 * 1024 * 1024,
  }).trim();
  try {
    run(['rev-parse', '--verify', 'HEAD']);
    if (run(['rev-parse', '--is-shallow-repository']) !== 'true') return { complete: true, fetched: false };
    if (check) throw new Error('Checkout is shallow. Run node scripts/ensure-seo-history.mjs to fetch origin history.');
    // Use the configured origin and its existing authentication. Never alter remotes or credentials.
    run(['fetch', '--unshallow', '--no-tags', 'origin']);
    if (run(['rev-parse', '--is-shallow-repository']) === 'true') throw new Error('Origin did not provide complete history.');
    return { complete: true, fetched: true };
  } catch (error) {
    throw new Error(`[seo-history] Git history prerequisite failed: ${String(error.stderr || error.message).trim()}`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
    const result = ensureSeoHistory({ repoRoot, check: process.argv.includes('--check') });
    console.log(`[seo-history] Complete Git history (${result.fetched ? 'fetched from origin' : 'already available'}).`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
