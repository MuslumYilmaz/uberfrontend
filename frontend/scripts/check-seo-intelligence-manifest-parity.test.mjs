#!/usr/bin/env node

import assert from 'assert/strict';
import { execFileSync, spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  EXPECTED_CONTRACTS,
  mustUseCheckedInManifest,
  verifySeoManifestParity,
} from './check-seo-intelligence-manifest-parity.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const guardPath = path.join(scriptDir, 'check-seo-intelligence-manifest-parity.mjs');
const fixtureHash = 'a'.repeat(64);

const manifestFixture = (overrides = {}) => ({
  version: EXPECTED_CONTRACTS.manifestVersion,
  fingerprintVersion: EXPECTED_CONTRACTS.fingerprintVersion,
  provenanceVersion: EXPECTED_CONTRACTS.provenanceVersion,
  sourceHash: fixtureHash,
  ...overrides,
});

const markerFixture = (overrides = {}) => ({
  version: EXPECTED_CONTRACTS.buildMarkerVersion,
  manifestVersion: EXPECTED_CONTRACTS.manifestVersion,
  fingerprintVersion: EXPECTED_CONTRACTS.fingerprintVersion,
  provenanceVersion: EXPECTED_CONTRACTS.provenanceVersion,
  sourceHash: fixtureHash,
  ...overrides,
});

const result = verifySeoManifestParity(markerFixture(), manifestFixture());
assert.equal(result.sourceHash, fixtureHash);
assert.deepEqual(result.contracts, EXPECTED_CONTRACTS);

const defaultOptions = {
  committed: false,
  gitRefSpecified: false,
  manifestPath: '',
};
assert.equal(mustUseCheckedInManifest(defaultOptions, {}), false);
assert.equal(mustUseCheckedInManifest(defaultOptions, { VERCEL: '1' }), true);
assert.equal(mustUseCheckedInManifest(defaultOptions, { CI: 'true' }), true);
assert.equal(mustUseCheckedInManifest(defaultOptions, { CI: '1' }), true);
assert.equal(mustUseCheckedInManifest(defaultOptions, { CI: 'yes' }), true);
assert.equal(mustUseCheckedInManifest(defaultOptions, { CI: 'on' }), true);
assert.equal(
  mustUseCheckedInManifest({ ...defaultOptions, committed: true }, {}),
  true,
);
assert.equal(
  mustUseCheckedInManifest({ ...defaultOptions, manifestPath: '/fixture/manifest.json' }, {
    VERCEL: '1',
  }),
  false,
);

assert.throws(
  () => verifySeoManifestParity(
    markerFixture({ sourceHash: 'b'.repeat(64) }),
    manifestFixture(),
  ),
  (error) => error.code === 'PARITY_MISMATCH'
    && error.details.some((detail) => detail.includes('Source hash')),
  'a source hash mismatch must fail with actionable detail',
);

assert.throws(
  () => verifySeoManifestParity(
    markerFixture({ fingerprintVersion: 'seo-page-fingerprints.v999' }),
    manifestFixture(),
  ),
  (error) => error.code === 'PARITY_MISMATCH'
    && error.details.some((detail) => detail.includes('fingerprint contract')),
  'a contract mismatch must fail independently from source hash parity',
);

assert.throws(
  () => verifySeoManifestParity(markerFixture({ sourceHash: 'not-a-hash' }), manifestFixture()),
  (error) => error.code === 'INVALID_ARTIFACT' && error.message.includes('SHA-256'),
  'malformed contract fields must not be treated as ordinary mismatches',
);

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'seo-manifest-parity-'));
try {
  const markerPath = path.join(tempDir, 'marker.json');
  const manifestPath = path.join(tempDir, 'manifest.json');
  fs.writeFileSync(markerPath, `${JSON.stringify(markerFixture())}\n`, 'utf8');
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifestFixture())}\n`, 'utf8');

  const successOutput = execFileSync(
    process.execPath,
    [guardPath, '--marker', markerPath, '--manifest', manifestPath],
    { encoding: 'utf8' },
  );
  assert.match(successOutput, /\[seo-manifest-parity\] passed/);

  const missing = spawnSync(
    process.execPath,
    [guardPath, '--marker', path.join(tempDir, 'missing.json'), '--manifest', manifestPath],
    { encoding: 'utf8' },
  );
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /MISSING_ARTIFACT/);
  assert.match(missing.stderr, /Frontend build marker is missing/);

  fs.writeFileSync(markerPath, '{ definitely not json', 'utf8');
  const invalid = spawnSync(
    process.execPath,
    [guardPath, '--marker', markerPath, '--manifest', manifestPath],
    { encoding: 'utf8' },
  );
  assert.equal(invalid.status, 1);
  assert.match(invalid.stderr, /INVALID_JSON/);
  assert.match(invalid.stderr, /Frontend build marker is not valid JSON/);

  fs.writeFileSync(
    markerPath,
    `${JSON.stringify(markerFixture({ sourceHash: 'b'.repeat(64) }))}\n`,
    'utf8',
  );
  const mismatch = spawnSync(
    process.execPath,
    [guardPath, '--marker', markerPath, '--manifest', manifestPath],
    { encoding: 'utf8' },
  );
  assert.equal(mismatch.status, 1);
  assert.match(mismatch.stderr, /PARITY_MISMATCH/);
  assert.match(mismatch.stderr, /Source hash: frontend/);
  assert.match(mismatch.stderr, /regenerate and commit the backend manifest/);
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

console.log('SEO intelligence manifest parity tests passed.');
