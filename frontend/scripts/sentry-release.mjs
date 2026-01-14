import fs from 'node:fs';
import path from 'node:path';
import { SentryCli } from '@sentry/cli';

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

function listMapFiles(rootDir) {
  const out = [];
  const stack = [rootDir];
  while (stack.length) {
    const dir = stack.pop();
    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.isFile() && entry.name.endsWith('.map')) {
        out.push(full);
      }
    }
  }
  return out;
}

const mapFiles = listMapFiles(browserOutDir);
console.log(`[sentry] Build output dir: ${browserOutDir}`);
console.log(`[sentry] Sourcemap files found: ${mapFiles.length}`);
if (mapFiles.length) {
  const preview = mapFiles
    .slice(0, 5)
    .map((p) => path.relative(browserOutDir, p));
  console.log(`[sentry] Sample sourcemaps: ${preview.join(', ')}`);
}

if (mapFiles.length === 0) {
  console.log('[sentry] No sourcemaps found; skipping upload.');
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
  rewrite: true,
  validate: true,
  ext: ['js', 'map'],
});

await cli.releases.finalize(release);

console.log(`[sentry] Uploaded sourcemaps for release ${release}.`);
