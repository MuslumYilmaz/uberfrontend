import fs from 'node:fs';
import path from 'node:path';

const dsn = process.env.NG_APP_SENTRY_DSN || '';
const release = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || '';
const rateRaw = process.env.NG_APP_SENTRY_TRACES_SAMPLE_RATE || '';
const debugRaw = process.env.NG_APP_SENTRY_DEBUG || '';
const parsedRate = Number.parseFloat(rateRaw);
const tracesSampleRate = Number.isFinite(parsedRate) ? parsedRate : 0.05;
const sentryDebug = debugRaw === 'true' || debugRaw === '1';

const outPath = path.resolve('src/environments/sentry.env.ts');
const contents = [
  `export const SENTRY_DSN = ${JSON.stringify(dsn)};`,
  `export const SENTRY_RELEASE = ${JSON.stringify(release)};`,
  `export const SENTRY_TRACES_SAMPLE_RATE = ${tracesSampleRate};`,
  `export const SENTRY_DEBUG = ${sentryDebug};`,
  '',
].join('\n');

fs.writeFileSync(outPath, contents);

const dsnState = dsn ? `present (len=${dsn.length})` : 'missing';
const releaseState = release ? 'set' : 'missing';
console.log(`[sentry] env snapshot: NG_APP_SENTRY_DSN=${dsnState} NG_APP_SENTRY_DEBUG=${sentryDebug} RELEASE=${releaseState}`);

if (!dsn) {
  console.log('[sentry] NG_APP_SENTRY_DSN not set; Sentry will be disabled.');
}
