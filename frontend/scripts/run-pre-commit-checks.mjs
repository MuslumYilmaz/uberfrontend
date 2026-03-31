#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { frontendRoot, repoRoot } from './content-paths.mjs';

const MAX_FRONTEND_SPECS = 12;
const EXPLAIN_ARTIFACT_FILES = new Set([
  'frontend/src/app/core/utils/failure-explain-rules.ts',
  'frontend/src/app/core/utils/failure-explain-content.json',
]);
const CONTENT_PIPELINE_SCRIPTS = new Set([
  'frontend/scripts/content-paths.mjs',
  'frontend/scripts/gen-content-metadata.mjs',
  'frontend/scripts/gen-data-version.mjs',
  'frontend/scripts/gen-showcase-stats.mjs',
  'frontend/scripts/generate-practice-registry.mjs',
  'frontend/scripts/lint-practice-registry.mjs',
  'frontend/scripts/lint-questions.mjs',
  'frontend/scripts/lint-incidents.mjs',
  'frontend/scripts/lint-tradeoff-battles.mjs',
  'frontend/scripts/question-identity-lib.mjs',
  'frontend/scripts/sync-tradeoff-battle-access.mjs',
  'frontend/scripts/tradeoff-battle-access-policy.mjs',
  'frontend/scripts/trivia-incident-balance-lib.mjs',
  'frontend/scripts/update-question-id-manifest.mjs',
  'frontend/scripts/validate-question-access.mjs',
  'frontend/scripts/validate-question-identities.mjs',
  'frontend/scripts/validate-trivia-incident-balance.mjs',
]);

function readArg(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}

function readLines(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return [];
  return fs
    .readFileSync(filePath, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function unique(items) {
  return [...new Set(items)];
}

function relToFrontend(filePath) {
  return filePath.replace(/^frontend\//, '');
}

function fileExists(repoRelativePath) {
  return fs.existsSync(path.join(repoRoot, repoRelativePath));
}

function matchesAny(filePath, matchers) {
  return matchers.some((matcher) => matcher.test(filePath));
}

function runCommand(label, command, args, cwd = repoRoot) {
  console.log(`[pre-commit] ${label}`);
  const result = spawnSync(command, args, {
    cwd,
    env: process.env,
    stdio: 'inherit',
  });

  if (result.error) {
    console.error(`[pre-commit] ERROR: ${label} could not start: ${result.error.message}`);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(`[pre-commit] ERROR: ${label} failed.`);
    process.exit(result.status ?? 1);
  }
}

function collectFrontendSpecCandidates(stagedFiles) {
  const specs = new Set();

  for (const file of stagedFiles) {
    if (!file.startsWith('frontend/src/app/')) continue;

    if (file.endsWith('.spec.ts')) {
      specs.add(relToFrontend(file));
      continue;
    }

    if (!/\.(ts|html|scss|css)$/.test(file) || file.endsWith('.d.ts')) continue;

    const candidate = relToFrontend(file).replace(/\.(ts|html|scss|css)$/, '.spec.ts');
    if (fs.existsSync(path.join(frontendRoot, candidate))) {
      specs.add(candidate);
    }
  }

  return [...specs].sort();
}

function main() {
  const stagedFilesArg = readArg('--staged-files');
  if (!stagedFilesArg) {
    console.error('[pre-commit] ERROR: Missing --staged-files argument.');
    process.exit(1);
  }

  const stagedFiles = unique(readLines(stagedFilesArg));
  if (stagedFiles.length === 0) {
    console.log('[pre-commit] No staged files. Skipping checks.');
    return;
  }

  const hookShellFiles = stagedFiles.filter((file) => file.startsWith('.githooks/'));
  const nodeSyntaxFiles = stagedFiles.filter((file) => {
    if (!/\.(js|mjs|cjs)$/.test(file)) return false;
    return file.startsWith('frontend/scripts/')
      || !file.includes('/');
  });
  const backendJsFiles = stagedFiles.filter((file) => /^backend\/.+\.(js|mjs|cjs)$/.test(file));
  const contentTouched = stagedFiles.some((file) => {
    return file.startsWith('cdn/questions/')
      || file.startsWith('cdn/incidents/')
      || file.startsWith('cdn/tradeoff-battles/')
      || file.startsWith('cdn/practice/')
      || file === 'cdn/data-version.json'
      || file === 'frontend/package.json'
      || file === 'frontend/angular.json'
      || file === 'frontend/src/app/generated/content-metadata.ts'
      || CONTENT_PIPELINE_SCRIPTS.has(file);
  });
  const assistTouched = stagedFiles.some((file) => {
    return /^cdn\/questions\/[^/]+\/coding\.json$/.test(file)
      || /^cdn\/questions\/[^/]+\/decision-graphs\/.+\.json$/.test(file)
      || EXPLAIN_ARTIFACT_FILES.has(file);
  });
  const designTouched = stagedFiles.some((file) => {
    return /^frontend\/src\/app\/.+\.(html|scss|css)$/.test(file)
      || file.startsWith('frontend/src/styles/')
      || /^frontend\/src\/app\/shared\/ui\/.+\.ts$/.test(file)
      || /^frontend\/src\/app\/shared\/components\/.+\.ts$/.test(file);
  });
  const frontendSpecs = collectFrontendSpecCandidates(stagedFiles);
  const frontendSubsetEligible = frontendSpecs.length > 0 && frontendSpecs.length <= MAX_FRONTEND_SPECS;
  const hasRelevantChecks = hookShellFiles.length > 0
    || nodeSyntaxFiles.length > 0
    || contentTouched
    || assistTouched
    || designTouched
    || backendJsFiles.length > 0
    || frontendSpecs.length > 0;

  if (!hasRelevantChecks) {
    console.log('[pre-commit] No relevant staged files. Skipping checks.');
    return;
  }

  for (const file of hookShellFiles) {
    if (!fileExists(file)) continue;
    runCommand(`Shell syntax check: ${file}`, 'bash', ['-n', file]);
  }

  for (const file of nodeSyntaxFiles) {
    if (!fileExists(file)) continue;
    runCommand(`Node syntax check: ${file}`, process.execPath, ['--check', file]);
  }

  if (contentTouched) {
    runCommand(
      'Running frontend content checks',
      'npm',
      ['-C', 'frontend', 'run', 'lint:questions:check'],
    );
  }

  if (assistTouched) {
    runCommand(
      'Validating staged coding assist sync',
      process.execPath,
      ['frontend/scripts/validate-coding-assist-sync.mjs', '--staged-files', stagedFilesArg],
    );
  }

  if (designTouched) {
    runCommand(
      'Running design-system strict lint',
      'npm',
      ['-C', 'frontend', 'run', 'lint:design-system:strict'],
    );
  }

  if (frontendSubsetEligible) {
    const args = ['ng', 'test', '--watch=false', '--browsers=ChromeHeadless'];
    for (const spec of frontendSpecs) {
      args.push('--include', spec);
    }
    runCommand(
      `Running targeted frontend unit tests (${frontendSpecs.length} spec${frontendSpecs.length === 1 ? '' : 's'})`,
      'npx',
      args,
      frontendRoot,
    );
  } else if (frontendSpecs.length > MAX_FRONTEND_SPECS) {
    console.log(
      `[pre-commit] Skipping targeted frontend unit tests: ${frontendSpecs.length} specs matched staged files. Full coverage remains in pre-push.`,
    );
  } else if (stagedFiles.some((file) => file.startsWith('frontend/src/app/'))) {
    console.log('[pre-commit] No matching frontend specs found for staged app changes. Skipping targeted frontend unit tests.');
  }

  if (backendJsFiles.length > 0) {
    const backendRelativeFiles = [];
    for (const file of backendJsFiles) {
      if (!fileExists(file)) continue;
      runCommand(`Backend syntax check: ${file}`, process.execPath, ['--check', file]);
      backendRelativeFiles.push(file.replace(/^backend\//, ''));
    }

    if (backendRelativeFiles.length > 0) {
      runCommand(
        `Running related backend tests (${backendRelativeFiles.length} file${backendRelativeFiles.length === 1 ? '' : 's'})`,
        'npx',
        ['jest', '--findRelatedTests', '--passWithNoTests', ...backendRelativeFiles],
        path.join(repoRoot, 'backend'),
      );
    }
  }

  console.log('[pre-commit] OK: staged checks passed.');
}

main();
