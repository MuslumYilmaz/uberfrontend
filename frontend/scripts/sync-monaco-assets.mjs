#!/usr/bin/env node

import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const frontendRoot = path.resolve(path.dirname(scriptPath), '..');
const frontendManifestPath = path.join(frontendRoot, 'package.json');
const installedManifestPath = path.join(
  frontendRoot,
  'node_modules',
  'monaco-editor',
  'package.json',
);
const sourceRoot = path.join(
  frontendRoot,
  'node_modules',
  'monaco-editor',
  'min',
  'vs',
);
const destinationRelativePath = path.join('src', 'assets', 'monaco', 'min', 'vs');
const destinationRoot = path.join(frontendRoot, destinationRelativePath);
const syncLockName = '.monaco-vs-sync.lock';
const staleLockAgeMs = 10 * 60 * 1000;
const exactSemverPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

function usage() {
  console.log(`Usage: node scripts/sync-monaco-assets.mjs [--check]

Without arguments, replaces ${destinationRelativePath} with the complete
node_modules/monaco-editor/min/vs tree.

Options:
  --check  Read-only verification of file names and byte contents
  --help   Show this help`);
}

function parseArguments(args) {
  const supportedArguments = new Set(['--check', '--help']);
  const unexpectedArguments = args.filter((argument) => !supportedArguments.has(argument));

  if (unexpectedArguments.length > 0) {
    throw new Error(`Unknown argument(s): ${unexpectedArguments.join(', ')}`);
  }

  return {
    check: args.includes('--check'),
    help: args.includes('--help'),
  };
}

async function readJson(filePath, label) {
  let raw;
  try {
    raw = await fs.readFile(filePath, 'utf8');
  } catch (error) {
    throw new Error(`Unable to read ${label} at ${filePath}: ${error.message}`);
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`Invalid JSON in ${label} at ${filePath}: ${error.message}`);
  }
}

async function validateMonacoVersion() {
  const frontendManifest = await readJson(frontendManifestPath, 'frontend package manifest');
  const declaredVersion = frontendManifest.devDependencies?.['monaco-editor'];

  if (typeof declaredVersion !== 'string' || !exactSemverPattern.test(declaredVersion)) {
    throw new Error(
      `frontend/package.json must pin devDependencies.monaco-editor to an exact version ` +
        `(for example "0.52.2"); found ${JSON.stringify(declaredVersion)}.`,
    );
  }

  const installedManifest = await readJson(installedManifestPath, 'installed Monaco package manifest');
  const installedVersion = installedManifest.version;

  if (installedVersion !== declaredVersion) {
    throw new Error(
      `Installed monaco-editor version ${JSON.stringify(installedVersion)} does not match ` +
        `the exact frontend/package.json version ${JSON.stringify(declaredVersion)}. ` +
        'Install frontend dependencies before syncing assets.',
    );
  }

  return declaredVersion;
}

function compareNames(left, right) {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

async function listRelativeFiles(root) {
  const files = [];

  async function visit(directory, relativeDirectory = '') {
    let entries;
    try {
      entries = await fs.readdir(directory, { withFileTypes: true });
    } catch (error) {
      const wrappedError = new Error(
        `Unable to read asset directory ${directory}: ${error.message}`,
      );
      wrappedError.code = error.code;
      throw wrappedError;
    }

    entries.sort((left, right) => compareNames(left.name, right.name));

    for (const entry of entries) {
      const relativePath = relativeDirectory
        ? path.join(relativeDirectory, entry.name)
        : entry.name;
      const absolutePath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        await visit(absolutePath, relativePath);
      } else if (entry.isFile()) {
        files.push(relativePath);
      } else {
        throw new Error(
          `Unsupported asset entry at ${absolutePath}; only regular files and directories are allowed.`,
        );
      }
    }
  }

  await visit(root);
  return files;
}

async function assertSafeReplacementTarget() {
  const expectedRoot = path.resolve(
    frontendRoot,
    'src',
    'assets',
    'monaco',
    'min',
    'vs',
  );
  const resolvedRoot = path.resolve(destinationRoot);

  if (resolvedRoot !== expectedRoot) {
    throw new Error(
      `Refusing to replace unexpected destination ${resolvedRoot}; expected ${expectedRoot}.`,
    );
  }

  const relativeRoot = path.relative(frontendRoot, resolvedRoot);
  if (
    relativeRoot !== destinationRelativePath ||
    relativeRoot === '' ||
    path.isAbsolute(relativeRoot) ||
    relativeRoot.startsWith(`..${path.sep}`)
  ) {
    throw new Error(`Refusing unsafe Monaco asset destination ${resolvedRoot}.`);
  }

  const segments = relativeRoot.split(path.sep);
  let currentPath = frontendRoot;

  for (let index = 0; index < segments.length; index += 1) {
    currentPath = path.join(currentPath, segments[index]);

    let stats;
    try {
      stats = await fs.lstat(currentPath);
    } catch (error) {
      if (error.code === 'ENOENT') break;
      throw new Error(`Unable to validate replacement path ${currentPath}: ${error.message}`);
    }

    if (stats.isSymbolicLink()) {
      throw new Error(`Refusing to replace a path containing a symbolic link: ${currentPath}.`);
    }

    if (!stats.isDirectory()) {
      throw new Error(`Refusing to replace a path containing a non-directory: ${currentPath}.`);
    }
  }
}

function toDisplayPath(relativePath) {
  return relativePath.split(path.sep).join('/');
}

async function compareTrees(sourceFiles, destinationFiles, comparisonRoot = destinationRoot) {
  const sourceSet = new Set(sourceFiles);
  const destinationSet = new Set(destinationFiles);
  const missingFiles = sourceFiles.filter((filePath) => !destinationSet.has(filePath));
  const unexpectedFiles = destinationFiles.filter((filePath) => !sourceSet.has(filePath));
  const changedFiles = [];

  for (const relativePath of sourceFiles) {
    if (!destinationSet.has(relativePath)) continue;

    const [sourceContents, destinationContents] = await Promise.all([
      fs.readFile(path.join(sourceRoot, relativePath)),
      fs.readFile(path.join(comparisonRoot, relativePath)),
    ]);

    if (!sourceContents.equals(destinationContents)) {
      changedFiles.push(relativePath);
    }
  }

  return { missingFiles, unexpectedFiles, changedFiles };
}

function formatMismatchGroup(label, filePaths) {
  if (filePaths.length === 0) return [];
  return [label, ...filePaths.map((filePath) => `  - ${toDisplayPath(filePath)}`)];
}

function assertTreesMatch(comparison) {
  const { missingFiles, unexpectedFiles, changedFiles } = comparison;
  if (
    missingFiles.length === 0 &&
    unexpectedFiles.length === 0 &&
    changedFiles.length === 0
  ) {
    return;
  }

  const details = [
    ...formatMismatchGroup('Missing from self-hosted assets:', missingFiles),
    ...formatMismatchGroup('Unexpected in self-hosted assets:', unexpectedFiles),
    ...formatMismatchGroup('Byte content differs:', changedFiles),
  ];

  throw new Error(
    `Self-hosted Monaco assets do not match the installed package.\n${details.join('\n')}\n` +
      'Run: node scripts/sync-monaco-assets.mjs',
  );
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function isSyncLocked() {
  try {
    await fs.lstat(path.join(path.dirname(destinationRoot), syncLockName));
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

async function waitForNoActiveSync() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (!(await isSyncLocked())) return;
    await delay(100);
  }

  throw new Error('Cannot check Monaco assets while another sync is running.');
}

async function compareSelfHostedAssets(sourceFiles) {
  let destinationFiles;
  try {
    destinationFiles = await listRelativeFiles(destinationRoot);
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(
        `Self-hosted Monaco assets are missing at ${destinationRelativePath}.\n` +
          'Run: node scripts/sync-monaco-assets.mjs',
      );
    }
    throw error;
  }

  const comparison = await compareTrees(sourceFiles, destinationFiles);
  assertTreesMatch(comparison);
}

async function checkAssets(sourceFiles, monacoVersion) {
  let lastError = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    await waitForNoActiveSync();

    try {
      await compareSelfHostedAssets(sourceFiles);
      if (await isSyncLocked()) {
        throw new Error('Monaco assets changed while the check was running.');
      }

      console.log(
        `[sync-monaco-assets] check passed: ${sourceFiles.length} files match monaco-editor ${monacoVersion}.`,
      );
      return;
    } catch (error) {
      lastError = error;
      if (attempt === 0) {
        await delay(100);
        continue;
      }
    }
  }

  throw lastError;
}

function appendFailure(primaryError, label, error) {
  const detail = error instanceof Error ? error.message : String(error);
  if (!primaryError) return new Error(`${label}: ${detail}`);
  primaryError.message += ` ${label}: ${detail}`;
  return primaryError;
}

async function acquireSyncLock(destinationParent) {
  const lockPath = path.join(destinationParent, syncLockName);
  const ownerToken = randomUUID();
  const ownerDirectory = await fs.mkdtemp(
    path.join(destinationParent, '.monaco-vs-lock-owner-'),
  );
  const ownerMarkerName = `owner-${ownerToken}.json`;
  const ownerMarkerPath = path.join(ownerDirectory, ownerMarkerName);
  let acquired = false;

  await fs.writeFile(
    ownerMarkerPath,
    `${JSON.stringify({ ownerToken, pid: process.pid, createdAt: new Date().toISOString() })}\n`,
    { mode: 0o600 },
  );

  try {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        await fs.rename(ownerDirectory, lockPath);
        acquired = true;
      } catch (error) {
        if (error.code !== 'EEXIST' && error.code !== 'ENOTEMPTY') throw error;

        let stats;
        try {
          stats = await fs.lstat(lockPath);
        } catch (statError) {
          if (statError.code === 'ENOENT') continue;
          throw statError;
        }

        if (!stats.isDirectory() || stats.isSymbolicLink()) {
          throw new Error(`Refusing unsafe Monaco sync lock at ${lockPath}.`);
        }

        const lockAgeMs = Date.now() - stats.mtimeMs;
        if (lockAgeMs <= staleLockAgeMs) {
          throw new Error(
            `Another Monaco asset sync is already running (lock: ${lockPath}).`,
          );
        }

        const staleLockPath = `${lockPath}.stale-${randomUUID()}`;
        try {
          await fs.rename(lockPath, staleLockPath);
        } catch (renameError) {
          if (renameError.code === 'ENOENT') continue;
          throw renameError;
        }
        await fs.rm(staleLockPath, { recursive: true, force: true });
        continue;
      }

      return async () => {
        const installedMarkerPath = path.join(lockPath, ownerMarkerName);
        let releaseError = null;
        let markerRemoved = false;

        try {
          await fs.unlink(installedMarkerPath);
          markerRemoved = true;
        } catch (error) {
          releaseError = appendFailure(
            releaseError,
            'Monaco sync lock ownership was lost before release',
            error,
          );
        }

        if (markerRemoved) {
          try {
            await fs.rmdir(lockPath);
          } catch (error) {
            releaseError = appendFailure(
              releaseError,
              'Unable to remove Monaco sync lock directory',
              error,
            );
          }
        }

        if (releaseError) throw releaseError;
      };
    }

    throw new Error(`Unable to acquire Monaco sync lock at ${lockPath}.`);
  } finally {
    if (!acquired) {
      await fs.rm(ownerDirectory, { recursive: true, force: true });
    }
  }
}

async function cleanupOrphanedWorkDirectories(destinationParent) {
  const removablePrefixes = [
    '.monaco-vs-sync-',
    '.monaco-vs-backup-',
    `${syncLockName}.stale-`,
  ];
  const entries = await fs.readdir(destinationParent, { withFileTypes: true });

  for (const entry of entries) {
    if (!removablePrefixes.some((prefix) => entry.name.startsWith(prefix))) continue;

    const candidate = path.join(destinationParent, entry.name);
    const stats = await fs.lstat(candidate);
    if (!stats.isDirectory() || stats.isSymbolicLink()) {
      throw new Error(`Refusing to remove unsafe Monaco work path ${candidate}.`);
    }

    await fs.rm(candidate, { recursive: true, force: true });
  }
}

async function syncAssets(sourceFiles, monacoVersion) {
  await assertSafeReplacementTarget();
  const destinationParent = path.dirname(destinationRoot);
  await fs.mkdir(destinationParent, { recursive: true });
  const releaseSyncLock = await acquireSyncLock(destinationParent);

  let stagingContainer = null;
  let stagedRoot = null;
  let backupContainer = null;
  let backupRoot = null;
  let previousTreeMoved = false;
  let stagedTreeInstalled = false;
  let committed = false;
  let failure = null;

  try {
    stagingContainer = await fs.mkdtemp(
      path.join(destinationParent, '.monaco-vs-sync-'),
    );
    stagedRoot = path.join(stagingContainer, 'vs');
    await fs.cp(sourceRoot, stagedRoot, { recursive: true, force: true });

    const stagedFiles = await listRelativeFiles(stagedRoot);
    const stagedComparison = await compareTrees(sourceFiles, stagedFiles, stagedRoot);
    assertTreesMatch(stagedComparison);

    try {
      await fs.lstat(destinationRoot);
      backupContainer = await fs.mkdtemp(
        path.join(destinationParent, '.monaco-vs-backup-'),
      );
      backupRoot = path.join(backupContainer, 'vs');
      await fs.rename(destinationRoot, backupRoot);
      previousTreeMoved = true;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }

    await fs.rename(stagedRoot, destinationRoot);
    stagedTreeInstalled = true;

    const destinationFiles = await listRelativeFiles(destinationRoot);
    const comparison = await compareTrees(sourceFiles, destinationFiles);
    assertTreesMatch(comparison);
    committed = true;
  } catch (error) {
    failure = error;

    if (!committed && stagedTreeInstalled) {
      try {
        await fs.rm(destinationRoot, { recursive: true, force: true });
        stagedTreeInstalled = false;
      } catch (rollbackError) {
        failure = appendFailure(failure, 'Unable to remove failed Monaco tree', rollbackError);
      }
    }

    if (!committed && previousTreeMoved && !stagedTreeInstalled && backupRoot) {
      try {
        await fs.rename(backupRoot, destinationRoot);
        previousTreeMoved = false;
      } catch (rollbackError) {
        failure = appendFailure(
          failure,
          `Unable to restore previous Monaco tree from ${backupRoot}`,
          rollbackError,
        );
      }
    }
  } finally {
    if (stagingContainer) {
      try {
        await fs.rm(stagingContainer, { recursive: true, force: true });
      } catch (error) {
        failure = appendFailure(failure, 'Unable to remove Monaco staging directory', error);
      }
    }

    if (backupContainer && (committed || !previousTreeMoved)) {
      try {
        await fs.rm(backupContainer, { recursive: true, force: true });
        previousTreeMoved = false;
      } catch (error) {
        failure = appendFailure(failure, 'Unable to remove Monaco backup directory', error);
      }
    }

    if (committed) {
      try {
        await cleanupOrphanedWorkDirectories(destinationParent);
      } catch (error) {
        failure = appendFailure(failure, 'Unable to clean Monaco work directories', error);
      }
    }

    try {
      await releaseSyncLock();
    } catch (error) {
      failure = appendFailure(failure, 'Unable to release Monaco sync lock', error);
    }
  }

  if (failure) throw failure;

  console.log(
    `[sync-monaco-assets] synced ${sourceFiles.length} files from monaco-editor ${monacoVersion} ` +
      `to ${destinationRelativePath}.`,
  );
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    usage();
    return;
  }

  const monacoVersion = await validateMonacoVersion();
  const sourceFiles = await listRelativeFiles(sourceRoot);
  if (sourceFiles.length === 0) {
    throw new Error(`Installed Monaco asset tree is empty at ${sourceRoot}.`);
  }

  if (options.check) {
    await checkAssets(sourceFiles, monacoVersion);
  } else {
    await syncAssets(sourceFiles, monacoVersion);
  }
}

main().catch((error) => {
  console.error(`[sync-monaco-assets] ERROR: ${error.message}`);
  console.error('[sync-monaco-assets] Usage: node scripts/sync-monaco-assets.mjs [--check]');
  process.exitCode = 1;
});
