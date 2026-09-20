#!/usr/bin/env node
'use strict';

const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env'), quiet: true });

const {
  captureInterviewIssueSignal,
  captureMetric,
  flushSentry,
  initSentry,
  isSentryConfigured,
  resetInterviewIssueSignalThrottle,
} = require('../config/sentry');

const EXECUTE_CONFIRMATION = 'VERIFY_INTERVIEW_SENTRY';
const SAFE_COMMIT_SHA_PATTERN = /^[a-f0-9]{7,64}$/i;

function parseArguments(argv = []) {
  const args = new Set(argv);
  const confirmArg = argv.find((arg) => String(arg).startsWith('--confirm='));
  return {
    execute: args.has('--execute'),
    confirmation: confirmArg ? String(confirmArg).slice('--confirm='.length) : '',
  };
}

function validatePreviewExecutionScope(env = process.env) {
  const sentryEnvironment = String(env.SENTRY_ENVIRONMENT || '').trim().toLowerCase();
  if (sentryEnvironment !== 'preview') {
    return { ok: false, code: 'preview_sentry_environment_required' };
  }
  if (String(env.INTERVIEW_MODE_ACCESS || '').trim().toLowerCase() !== 'preflight') {
    return { ok: false, code: 'preview_preflight_access_required' };
  }

  const vercelEnvironment = String(env.VERCEL_ENV || '').trim().toLowerCase();
  if (vercelEnvironment !== 'preview') {
    return { ok: false, code: 'preview_runtime_required' };
  }

  const release = String(env.SENTRY_RELEASE || '').trim();
  if (!SAFE_COMMIT_SHA_PATTERN.test(release)) {
    return { ok: false, code: 'preview_release_required' };
  }
  const expectedRelease = String(env.VERCEL_GIT_COMMIT_SHA || '').trim();
  if (!SAFE_COMMIT_SHA_PATTERN.test(expectedRelease)) {
    return { ok: false, code: 'preview_commit_sha_required' };
  }
  if (release !== expectedRelease) {
    return { ok: false, code: 'preview_release_mismatch' };
  }
  return { ok: true, code: 'ready' };
}

async function verifyInterviewSentry({
  argv = process.argv.slice(2),
  env = process.env,
  output = (value) => console.log(JSON.stringify(value)),
} = {}) {
  const { execute, confirmation } = parseArguments(argv);
  const executionScope = validatePreviewExecutionScope(env);
  if (!execute) {
    const result = {
      ok: true,
      mode: 'dry-run',
      configured: isSentryConfigured(env),
      executionScopeReady: executionScope.ok,
      scopeCode: executionScope.code,
      wouldSend: {
        issue: 'readiness_blocked',
        metric: 'interview.readiness.ready',
      },
    };
    output(result);
    return result;
  }
  if (confirmation !== EXECUTE_CONFIRMATION) {
    const result = {
      ok: false,
      mode: 'execute',
      code: 'confirmation_required',
    };
    output(result);
    return result;
  }
  if (!executionScope.ok) {
    const result = {
      ok: false,
      mode: 'execute',
      code: executionScope.code,
    };
    output(result);
    return result;
  }
  if (!initSentry(env)) {
    const result = {
      ok: false,
      mode: 'execute',
      code: 'sentry_not_configured',
    };
    output(result);
    return result;
  }

  resetInterviewIssueSignalThrottle();
  const issueCaptured = captureInterviewIssueSignal('readiness_blocked', {
    operation: 'release-gate',
    code: 'interview_dependencies_blocked',
    status: 503,
  });
  const metricCaptured = captureMetric('gauge', 'interview.readiness.ready', 0, {
    attributes: {
      access_mode: 'preflight',
      exposure_code: 'indexes_missing',
      gate_profile: 'preflight',
      monitoring_code: 'ready',
      operational_state: 'normal',
      readiness_code: 'interview_dependencies_blocked',
      redis_code: 'ready',
      signal: 'readiness_blocked',
    },
  });
  const flushed = await flushSentry(5_000);
  const result = {
    ok: issueCaptured && metricCaptured && flushed,
    mode: 'execute',
    issueCaptured,
    metricCaptured,
    flushed,
  };
  output(result);
  return result;
}

if (require.main === module) {
  verifyInterviewSentry().then((result) => {
    if (!result.ok) process.exitCode = 1;
  }).catch(() => {
    console.error(JSON.stringify({
      ok: false,
      mode: 'execute',
      code: 'verification_failed',
    }));
    process.exitCode = 1;
  });
}

module.exports = {
  EXECUTE_CONFIRMATION,
  parseArguments,
  validatePreviewExecutionScope,
  verifyInterviewSentry,
};
