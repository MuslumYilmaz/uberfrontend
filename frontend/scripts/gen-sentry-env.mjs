import fs from 'node:fs';
import path from 'node:path';

const dsn = process.env.NG_APP_SENTRY_DSN || '';
const release = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || '';
const rateRaw = process.env.NG_APP_SENTRY_TRACES_SAMPLE_RATE || '';
const parsedRate = Number.parseFloat(rateRaw);
const tracesSampleRate = Number.isFinite(parsedRate) ? parsedRate : 0.05;

const outPath = path.resolve('src/environments/sentry.env.ts');
const contents = [
  `export const SENTRY_DSN = ${JSON.stringify(dsn)};`,
  `export const SENTRY_RELEASE = ${JSON.stringify(release)};`,
  `export const SENTRY_TRACES_SAMPLE_RATE = ${tracesSampleRate};`,
  '',
].join('\n');

fs.writeFileSync(outPath, contents);

if (!dsn) {
  console.log('[sentry] NG_APP_SENTRY_DSN not set; Sentry will be disabled.');
}
