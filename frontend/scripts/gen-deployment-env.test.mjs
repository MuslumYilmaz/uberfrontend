import assert from 'node:assert/strict';
import test from 'node:test';

import {
  normalizePreviewApiBase,
  renderDeploymentConfig,
  resolveDeploymentConfig,
} from './gen-deployment-env.mjs';

const VALID_PREVIEW_API =
  'https://frontendatlas-be-git-interview-staging-muslumyilmazs-projects.vercel.app';

test('requires an explicit API origin for Vercel Preview builds', () => {
  assert.throws(
    () => resolveDeploymentConfig({ VERCEL: '1', VERCEL_ENV: 'preview' }),
    /NG_APP_PREVIEW_API_BASE is required/
  );
});

test('accepts only the FrontendAtlas backend deployment in the expected Vercel team', () => {
  assert.equal(normalizePreviewApiBase(`${VALID_PREVIEW_API}/`), VALID_PREVIEW_API);
  assert.throws(
    () => normalizePreviewApiBase('https://api.frontendatlas.com'),
    /backend Preview deployment/
  );
  assert.throws(
    () => normalizePreviewApiBase('https://frontendatlas-be-attacker.vercel.app'),
    /backend Preview deployment/
  );
  assert.throws(
    () => normalizePreviewApiBase(`${VALID_PREVIEW_API}/api`),
    /origin without a path/
  );
});

test('renders a fixed runtime API override for Preview without exposing arbitrary input', () => {
  const config = resolveDeploymentConfig({
    VERCEL: '1',
    VERCEL_ENV: 'preview',
    NG_APP_PREVIEW_API_BASE: VALID_PREVIEW_API,
  });
  const output = renderDeploymentConfig(config);

  assert.match(output, /__FA_API_BASE__/);
  assert.match(output, new RegExp(VALID_PREVIEW_API.replaceAll('.', '\\.')));
  assert.doesNotMatch(output, /NG_APP_PREVIEW_API_BASE/);
});

test('never applies the Preview API override to a Production build', () => {
  const config = resolveDeploymentConfig({
    VERCEL: '1',
    VERCEL_ENV: 'production',
    NG_APP_PREVIEW_API_BASE: VALID_PREVIEW_API,
  });
  const output = renderDeploymentConfig(config);

  assert.deepEqual(config, { environment: 'production', apiBase: '' });
  assert.doesNotMatch(output, /__FA_API_BASE__/);
  assert.doesNotMatch(output, /frontendatlas-be-/);
});
