'use strict';

const mockCaptureInterviewIssueSignal = jest.fn();
const mockCaptureMetric = jest.fn();
const mockFlushSentry = jest.fn();
const mockInitSentry = jest.fn();
const mockIsSentryConfigured = jest.fn();
const mockResetInterviewIssueSignalThrottle = jest.fn();

jest.mock('../config/sentry', () => ({
  captureInterviewIssueSignal: mockCaptureInterviewIssueSignal,
  captureMetric: mockCaptureMetric,
  flushSentry: mockFlushSentry,
  initSentry: mockInitSentry,
  isSentryConfigured: mockIsSentryConfigured,
  resetInterviewIssueSignalThrottle: mockResetInterviewIssueSignalThrottle,
}));

const {
  EXECUTE_CONFIRMATION,
  parseArguments,
  validatePreviewExecutionScope,
  verifyInterviewSentry,
} = require('../scripts/verify-interview-sentry');

describe('Interview Sentry verifier', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsSentryConfigured.mockReturnValue(true);
    mockInitSentry.mockReturnValue(true);
    mockCaptureInterviewIssueSignal.mockReturnValue(true);
    mockCaptureMetric.mockReturnValue(true);
    mockFlushSentry.mockResolvedValue(true);
  });

  test('is side-effect free by default and reports only aggregate intent', async () => {
    const output = jest.fn();

    await expect(verifyInterviewSentry({ argv: [], env: {}, output })).resolves.toEqual({
      ok: true,
      mode: 'dry-run',
      configured: true,
      executionScopeReady: false,
      scopeCode: 'preview_sentry_environment_required',
      wouldSend: {
        issue: 'readiness_blocked',
        metric: 'interview.readiness.ready',
      },
    });
    expect(mockInitSentry).not.toHaveBeenCalled();
    expect(mockCaptureInterviewIssueSignal).not.toHaveBeenCalled();
    expect(mockCaptureMetric).not.toHaveBeenCalled();
    expect(mockFlushSentry).not.toHaveBeenCalled();
  });

  test('requires the exact confirmation before sending', async () => {
    expect(parseArguments([
      '--execute',
      `--confirm=${EXECUTE_CONFIRMATION}`,
    ])).toEqual({ execute: true, confirmation: EXECUTE_CONFIRMATION });

    await expect(verifyInterviewSentry({
      argv: ['--execute', '--confirm=wrong'],
      output: jest.fn(),
    })).resolves.toEqual({
      ok: false,
      mode: 'execute',
      code: 'confirmation_required',
    });
    expect(mockInitSentry).not.toHaveBeenCalled();
  });

  test('sends one fixed issue and metric, flushes, and returns no secret data', async () => {
    const output = jest.fn();
    const env = {
      SENTRY_DSN: 'https://secret@example.ingest.sentry.io/1',
      SENTRY_AUTH_TOKEN: 'secret-token',
      SENTRY_ENVIRONMENT: 'preview',
      SENTRY_RELEASE: 'abcdef123456',
      INTERVIEW_MODE_ACCESS: 'preflight',
      VERCEL_ENV: 'preview',
      VERCEL_GIT_COMMIT_SHA: 'abcdef123456',
    };

    const result = await verifyInterviewSentry({
      argv: ['--execute', `--confirm=${EXECUTE_CONFIRMATION}`],
      env,
      output,
    });

    expect(mockInitSentry).toHaveBeenCalledWith(env);
    expect(mockResetInterviewIssueSignalThrottle).toHaveBeenCalledTimes(1);
    expect(mockCaptureInterviewIssueSignal).toHaveBeenCalledWith('readiness_blocked', {
      operation: 'release-gate',
      code: 'interview_dependencies_blocked',
      status: 503,
    });
    expect(mockCaptureMetric).toHaveBeenCalledWith(
      'gauge',
      'interview.readiness.ready',
      0,
      expect.objectContaining({
        attributes: expect.objectContaining({
          access_mode: 'preflight',
          exposure_code: 'indexes_missing',
          gate_profile: 'preflight',
          signal: 'readiness_blocked',
        }),
      }),
    );
    expect(mockFlushSentry).toHaveBeenCalledWith(5_000);
    expect(result).toEqual({
      ok: true,
      mode: 'execute',
      issueCaptured: true,
      metricCaptured: true,
      flushed: true,
    });
    expect(JSON.stringify(output.mock.calls)).not.toMatch(/secret-token|secret@example/);
  });

  test('fails closed when effective Sentry configuration is absent', async () => {
    mockInitSentry.mockReturnValue(false);
    await expect(verifyInterviewSentry({
      argv: ['--execute', `--confirm=${EXECUTE_CONFIRMATION}`],
      env: {
        SENTRY_ENVIRONMENT: 'preview',
        SENTRY_RELEASE: 'abcdef123456',
        INTERVIEW_MODE_ACCESS: 'preflight',
        VERCEL_ENV: 'preview',
        VERCEL_GIT_COMMIT_SHA: 'abcdef123456',
      },
      output: jest.fn(),
    })).resolves.toEqual({
      ok: false,
      mode: 'execute',
      code: 'sentry_not_configured',
    });
    expect(mockCaptureInterviewIssueSignal).not.toHaveBeenCalled();
    expect(mockCaptureMetric).not.toHaveBeenCalled();
  });

  test('fails closed before initialization outside the Preview Sentry scope', async () => {
    const env = {
      SENTRY_ENVIRONMENT: 'production',
      SENTRY_RELEASE: 'abcdef123456',
      INTERVIEW_MODE_ACCESS: 'preflight',
      VERCEL_ENV: 'production',
    };

    expect(validatePreviewExecutionScope(env)).toEqual({
      ok: false,
      code: 'preview_sentry_environment_required',
    });
    await expect(verifyInterviewSentry({
      argv: ['--execute', `--confirm=${EXECUTE_CONFIRMATION}`],
      env,
      output: jest.fn(),
    })).resolves.toEqual({
      ok: false,
      mode: 'execute',
      code: 'preview_sentry_environment_required',
    });
    expect(mockInitSentry).not.toHaveBeenCalled();
  });

  test('binds execution to the exact candidate commit SHA', () => {
    expect(validatePreviewExecutionScope({
      SENTRY_ENVIRONMENT: 'preview',
      SENTRY_RELEASE: 'abc1234',
      VERCEL_GIT_COMMIT_SHA: 'def5678',
      INTERVIEW_MODE_ACCESS: 'preflight',
      VERCEL_ENV: 'preview',
    })).toEqual({
      ok: false,
      code: 'preview_release_mismatch',
    });
    expect(validatePreviewExecutionScope({
      SENTRY_ENVIRONMENT: 'preview',
      SENTRY_RELEASE: 'abc1234',
      VERCEL_GIT_COMMIT_SHA: 'abc1234',
      INTERVIEW_MODE_ACCESS: 'preflight',
      VERCEL_ENV: 'preview',
    })).toEqual({ ok: true, code: 'ready' });
  });

  test('requires the exact Preview runtime, preflight access, and Vercel commit SHA', () => {
    const baseEnv = {
      SENTRY_ENVIRONMENT: 'preview',
      SENTRY_RELEASE: 'abc1234',
      INTERVIEW_MODE_ACCESS: 'preflight',
      VERCEL_ENV: 'preview',
      VERCEL_GIT_COMMIT_SHA: 'abc1234',
    };

    expect(validatePreviewExecutionScope({
      ...baseEnv,
      VERCEL_ENV: '',
    })).toEqual({ ok: false, code: 'preview_runtime_required' });
    expect(validatePreviewExecutionScope({
      ...baseEnv,
      INTERVIEW_MODE_ACCESS: 'internal',
    })).toEqual({ ok: false, code: 'preview_preflight_access_required' });
    expect(validatePreviewExecutionScope({
      ...baseEnv,
      VERCEL_GIT_COMMIT_SHA: '',
    })).toEqual({ ok: false, code: 'preview_commit_sha_required' });
    expect(validatePreviewExecutionScope({
      ...baseEnv,
      VERCEL_GIT_COMMIT_SHA: undefined,
      GITHUB_SHA: 'abc1234',
    })).toEqual({ ok: false, code: 'preview_commit_sha_required' });
  });
});
