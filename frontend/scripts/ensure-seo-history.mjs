import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function vercelGithubRepository(env) {
  const owner = env.VERCEL_GIT_REPO_OWNER || '';
  const slug = env.VERCEL_GIT_REPO_SLUG || '';
  if (env.VERCEL !== '1' || env.VERCEL_GIT_PROVIDER !== 'github'
    || !/^[a-z\d][a-z\d-]{0,38}$/i.test(owner)
    || !/^[a-z\d._-]{1,100}$/i.test(slug) || ['.', '..'].includes(slug)) return null;
  return `https://github.com/${owner}/${slug}.git`;
}

export function ensureSeoHistory({ repoRoot, check = false, env = process.env } = {}) {
  const run = (args) => execFileSync('git', ['-C', repoRoot, ...args], {
    encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 32 * 1024 * 1024,
    env: { ...env, GIT_TERMINAL_PROMPT: '0' },
  }).trim();
  try {
    const revision = run(['rev-parse', '--verify', 'HEAD']);
    if (run(['rev-parse', '--is-shallow-repository']) !== 'true') return { complete: true, fetched: false };
    if (check) throw new Error('Checkout is shallow. Run node scripts/ensure-seo-history.mjs to fetch complete history.');
    const hasOrigin = run(['remote']).split(/\r?\n/).includes('origin');
    const source = hasOrigin ? 'origin' : vercelGithubRepository(env);
    if (!source) {
      throw new Error('Shallow checkout has no origin remote. Provide a full Git checkout or an authenticated origin; '
        + 'originless Vercel builds require valid VERCEL_GIT_PROVIDER=github, VERCEL_GIT_REPO_OWNER and VERCEL_GIT_REPO_SLUG metadata.');
    }
    // Preserve configured authentication. Vercel may omit origin; fetch its exact
    // checked-out commit without adding a remote or relying on the default branch.
    try {
      run(['fetch', '--unshallow', '--no-tags', source, ...(hasOrigin ? [] : [revision])]);
    } catch {
      throw new Error(`Could not fetch complete Git history from ${hasOrigin ? 'the configured origin' : 'the Vercel GitHub repository'}. `
        + 'Check repository access and network connectivity. Private repositories require an authenticated origin or a full Git checkout.');
    }
    if (run(['rev-parse', '--is-shallow-repository']) === 'true') throw new Error('Fetch did not provide complete history.');
    return { complete: true, fetched: true };
  } catch (error) {
    throw new Error(`[seo-history] Git history prerequisite failed: ${String(error.stderr || error.message).trim()}`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
    const result = ensureSeoHistory({ repoRoot, check: process.argv.includes('--check') });
    console.log(`[seo-history] Complete Git history (${result.fetched ? 'fetched from repository' : 'already available'}).`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
