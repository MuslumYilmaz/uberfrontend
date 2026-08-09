#!/usr/bin/env node

import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(scriptDir, '..');
const repoRoot = path.resolve(frontendRoot, '..');
const checkedInManifestPath = 'backend/content/seo/page-manifest.json';
const workingManifestPath = path.join(repoRoot, checkedInManifestPath);

const EXPECTED_CONTRACTS = Object.freeze({
  buildMarkerVersion: 'seo-build-marker.v1',
  manifestVersion: 'seo-page-manifest.v1',
  fingerprintVersion: 'seo-page-fingerprints.v2',
  provenanceVersion: 'seo-build-provenance.v1',
});

class SeoManifestParityError extends Error {
  constructor(code, message, details = []) {
    super(message);
    this.name = 'SeoManifestParityError';
    this.code = code;
    this.details = details;
  }
}

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function requireContractString(document, field, label) {
  const value = document[field];
  if (typeof value !== 'string' || !value.trim()) {
    throw new SeoManifestParityError(
      'INVALID_ARTIFACT',
      `${label} is invalid: ${field} must be a non-empty string.`,
    );
  }
  return value.trim();
}

function requireSourceHash(document, label) {
  const value = requireContractString(document, 'sourceHash', label);
  if (!/^[a-f0-9]{64}$/.test(value)) {
    throw new SeoManifestParityError(
      'INVALID_ARTIFACT',
      `${label} is invalid: sourceHash must be a lowercase SHA-256 value.`,
    );
  }
  return value;
}

function shortened(value) {
  const normalized = String(value || 'missing');
  return normalized.length > 16 ? `${normalized.slice(0, 12)}…${normalized.slice(-4)}` : normalized;
}

function parseJsonDocument(raw, label) {
  try {
    const parsed = JSON.parse(raw);
    if (!isRecord(parsed)) {
      throw new Error('the JSON root must be an object');
    }
    return parsed;
  } catch (error) {
    throw new SeoManifestParityError(
      'INVALID_JSON',
      `${label} is not valid JSON: ${error?.message || error}`,
    );
  }
}

function readJsonFile(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new SeoManifestParityError(
      'MISSING_ARTIFACT',
      `${label} is missing at ${filePath}.`,
    );
  }
  return parseJsonDocument(fs.readFileSync(filePath, 'utf8'), label);
}

function readCheckedInManifest(gitRef = 'HEAD') {
  const ref = String(gitRef || '').trim();
  if (!ref) {
    throw new SeoManifestParityError('INVALID_GIT_REF', 'Git ref must not be empty.');
  }

  try {
    const raw = execFileSync(
      'git',
      ['show', `${ref}:${checkedInManifestPath}`],
      {
        cwd: repoRoot,
        encoding: 'utf8',
        maxBuffer: 64 * 1024 * 1024,
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );
    return parseJsonDocument(raw, `Checked-in backend manifest (${ref})`);
  } catch (error) {
    if (error instanceof SeoManifestParityError) throw error;
    const detail = String(error?.stderr || error?.message || error).trim();
    throw new SeoManifestParityError(
      'CHECKED_IN_MANIFEST_UNAVAILABLE',
      `Could not read ${checkedInManifestPath} from Git ${ref}${detail ? `: ${detail}` : '.'}`,
    );
  }
}

function verifySeoManifestParity(marker, manifest) {
  if (!isRecord(marker)) {
    throw new SeoManifestParityError(
      'INVALID_ARTIFACT',
      'Frontend build marker is invalid: the JSON root must be an object.',
    );
  }
  if (!isRecord(manifest)) {
    throw new SeoManifestParityError(
      'INVALID_ARTIFACT',
      'Checked-in backend manifest is invalid: the JSON root must be an object.',
    );
  }

  const values = {
    markerVersion: requireContractString(marker, 'version', 'Frontend build marker'),
    markerManifestVersion: requireContractString(
      marker,
      'manifestVersion',
      'Frontend build marker',
    ),
    markerFingerprintVersion: requireContractString(
      marker,
      'fingerprintVersion',
      'Frontend build marker',
    ),
    markerProvenanceVersion: requireContractString(
      marker,
      'provenanceVersion',
      'Frontend build marker',
    ),
    markerSourceHash: requireSourceHash(marker, 'Frontend build marker'),
    manifestVersion: requireContractString(manifest, 'version', 'Checked-in backend manifest'),
    manifestFingerprintVersion: requireContractString(
      manifest,
      'fingerprintVersion',
      'Checked-in backend manifest',
    ),
    manifestProvenanceVersion: requireContractString(
      manifest,
      'provenanceVersion',
      'Checked-in backend manifest',
    ),
    manifestSourceHash: requireSourceHash(manifest, 'Checked-in backend manifest'),
  };

  const mismatches = [];
  const compare = (label, actual, expected) => {
    if (actual !== expected) mismatches.push(`${label}: ${actual} (expected ${expected})`);
  };

  compare(
    'Build marker contract',
    values.markerVersion,
    EXPECTED_CONTRACTS.buildMarkerVersion,
  );
  compare(
    'Backend manifest contract',
    values.manifestVersion,
    EXPECTED_CONTRACTS.manifestVersion,
  );
  compare(
    'Frontend marker manifest contract',
    values.markerManifestVersion,
    values.manifestVersion,
  );
  compare(
    'Backend fingerprint contract',
    values.manifestFingerprintVersion,
    EXPECTED_CONTRACTS.fingerprintVersion,
  );
  compare(
    'Frontend marker fingerprint contract',
    values.markerFingerprintVersion,
    values.manifestFingerprintVersion,
  );
  compare(
    'Backend provenance contract',
    values.manifestProvenanceVersion,
    EXPECTED_CONTRACTS.provenanceVersion,
  );
  compare(
    'Frontend marker provenance contract',
    values.markerProvenanceVersion,
    values.manifestProvenanceVersion,
  );
  if (values.markerSourceHash !== values.manifestSourceHash) {
    mismatches.push(
      `Source hash: frontend ${shortened(values.markerSourceHash)}; checked-in backend ${shortened(values.manifestSourceHash)}`,
    );
  }

  if (mismatches.length) {
    throw new SeoManifestParityError(
      'PARITY_MISMATCH',
      'Fresh frontend SEO evidence does not match the checked-in backend manifest.',
      mismatches,
    );
  }

  return {
    sourceHash: values.markerSourceHash,
    contracts: {
      buildMarkerVersion: values.markerVersion,
      manifestVersion: values.manifestVersion,
      fingerprintVersion: values.manifestFingerprintVersion,
      provenanceVersion: values.manifestProvenanceVersion,
    },
  };
}

function parseArguments(argv) {
  const options = {
    committed: false,
    gitRef: 'HEAD',
    gitRefSpecified: false,
    manifestPath: '',
    markerPath: '',
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--help') return { ...options, help: true };
    if (argument === '--committed') {
      options.committed = true;
      continue;
    }
    if (!['--git-ref', '--manifest', '--marker'].includes(argument)) {
      throw new SeoManifestParityError('INVALID_ARGUMENT', `Unknown argument: ${argument}`);
    }
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) {
      throw new SeoManifestParityError('INVALID_ARGUMENT', `${argument} requires a value.`);
    }
    if (argument === '--git-ref') {
      options.gitRef = value;
      options.gitRefSpecified = true;
    }
    if (argument === '--manifest') options.manifestPath = path.resolve(value);
    if (argument === '--marker') options.markerPath = path.resolve(value);
    index += 1;
  }
  return options;
}

function mustUseCheckedInManifest(options, env = process.env) {
  if (options.manifestPath) return false;
  const ciEnabled = ['1', 'true', 'yes', 'on'].includes(
    String(env.CI || '').trim().toLowerCase(),
  );
  return options.committed
    || options.gitRefSpecified
    || String(env.VERCEL || '').trim() === '1'
    || ciEnabled;
}

function defaultMarkerPath() {
  const buildDir = path.resolve(
    process.env.SEO_BUILD_DIR || path.join(frontendRoot, 'dist', 'frontendatlas', 'browser'),
  );
  return path.join(buildDir, 'seo-intelligence-build.json');
}

function printHelp() {
  console.log(`Usage: node scripts/check-seo-intelligence-manifest-parity.mjs [options]

Options:
  --marker <path>    Generated frontend build marker (defaults to dist build output)
  --manifest <path>  Manifest file override
  --committed        Force comparison with the manifest stored in Git
  --git-ref <ref>    Checked-in manifest Git ref (default: HEAD)
  --help             Show this help

Vercel and CI builds always compare against Git so the frontend generator cannot hide
drift by overwriting its working tree. Local builds compare the generated working-tree
artifacts; use --committed to run the deployment check explicitly.`);
}

function main(argv = process.argv.slice(2)) {
  const options = parseArguments(argv);
  if (options.help) {
    printHelp();
    return;
  }

  const markerPath = options.markerPath || defaultMarkerPath();
  const marker = readJsonFile(markerPath, 'Frontend build marker');
  const manifest = options.manifestPath
    ? readJsonFile(options.manifestPath, 'Backend manifest override')
    : mustUseCheckedInManifest(options)
      ? readCheckedInManifest(options.gitRef)
      : readJsonFile(workingManifestPath, 'Generated backend manifest');
  const result = verifySeoManifestParity(marker, manifest);
  console.log(
    `[seo-manifest-parity] passed: sourceHash=${result.sourceHash.slice(0, 12)} marker=${markerPath}`,
  );
}

const invokedDirectly = process.argv[1]
  && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (invokedDirectly) {
  try {
    main();
  } catch (error) {
    const code = error?.code ? ` (${error.code})` : '';
    console.error(`[seo-manifest-parity] ERROR${code}: ${error?.message || error}`);
    for (const detail of error?.details || []) console.error(`  - ${detail}`);
    console.error(
      '[seo-manifest-parity] Rebuild the frontend, regenerate and commit the backend manifest, then deploy both from that commit.',
    );
    process.exitCode = 1;
  }
}

export {
  EXPECTED_CONTRACTS,
  SeoManifestParityError,
  parseJsonDocument,
  readCheckedInManifest,
  readJsonFile,
  mustUseCheckedInManifest,
  verifySeoManifestParity,
};
