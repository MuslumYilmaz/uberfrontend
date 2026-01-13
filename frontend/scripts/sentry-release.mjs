import fs from 'node:fs';
import path from 'node:path';
import SentryCli from '@sentry/cli';

const authToken = process.env.SENTRY_AUTH_TOKEN || '';
const org = process.env.SENTRY_ORG || '';
const project = process.env.SENTRY_PROJECT || '';
const release = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || '';

if (!authToken || !org || !project || !release) {
  console.log('[sentry] Missing Sentry env; skipping sourcemap upload.');
  process.exit(0);
}

const angularJsonPath = path.resolve('angular.json');
let outputBase = 'dist/frontendatlas';
let outputBrowser = 'browser';

if (fs.existsSync(angularJsonPath)) {
  try {
    const angularJson = JSON.parse(fs.readFileSync(angularJsonPath, 'utf8'));
    const buildOptions = angularJson?.projects?.frontendatlas?.architect?.build?.options;
    const outputPath = buildOptions?.outputPath;

    if (typeof outputPath === 'string') {
      outputBase = outputPath;
    } else if (outputPath && typeof outputPath === 'object') {
      outputBase = outputPath.base || outputBase;
      outputBrowser = outputPath.browser || outputBrowser;
    }
  } catch {
    // fall back to defaults
  }
}

const browserOutDir = path.resolve(outputBase, outputBrowser);
if (!fs.existsSync(browserOutDir)) {
  console.log(`[sentry] Build output not found at ${browserOutDir}; skipping sourcemap upload.`);
  process.exit(0);
}

const cli = new SentryCli(undefined, { authToken, org, project });

try {
  await cli.releases.new(release);
} catch (err) {
  console.log('[sentry] Release already exists or could not be created; continuing.');
}

await cli.releases.uploadSourceMaps(release, {
  include: [browserOutDir],
  urlPrefix: '~/',
});

await cli.releases.finalize(release);

console.log(`[sentry] Uploaded sourcemaps for release ${release}.`);
