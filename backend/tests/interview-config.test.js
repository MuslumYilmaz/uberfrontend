'use strict';

const {
  interviewConfig,
  interviewModeAccess,
  interviewModeAccessMode,
  interviewModeEnabled,
} = require('../services/interview/config');

describe('interview access configuration', () => {
  const originalAccess = process.env.INTERVIEW_MODE_ACCESS;
  const originalEnabled = process.env.INTERVIEW_MODE_ENABLED;
  const originalNodeEnv = process.env.NODE_ENV;
  const originalCandidate = process.env.INTERVIEW_ALLOW_CANDIDATE_BANK;
  const originalDraftTotal = process.env.INTERVIEW_MAX_DRAFT_TOTAL_BYTES;

  afterEach(() => {
    if (originalAccess == null) delete process.env.INTERVIEW_MODE_ACCESS;
    else process.env.INTERVIEW_MODE_ACCESS = originalAccess;
    if (originalEnabled == null) delete process.env.INTERVIEW_MODE_ENABLED;
    else process.env.INTERVIEW_MODE_ENABLED = originalEnabled;
    process.env.NODE_ENV = originalNodeEnv;
    if (originalCandidate == null) delete process.env.INTERVIEW_ALLOW_CANDIDATE_BANK;
    else process.env.INTERVIEW_ALLOW_CANDIDATE_BANK = originalCandidate;
    if (originalDraftTotal == null) delete process.env.INTERVIEW_MAX_DRAFT_TOTAL_BYTES;
    else process.env.INTERVIEW_MAX_DRAFT_TOTAL_BYTES = originalDraftTotal;
  });

  test('defaults to off and fails closed for an invalid explicit mode', () => {
    delete process.env.INTERVIEW_MODE_ACCESS;
    delete process.env.INTERVIEW_MODE_ENABLED;
    expect(interviewModeAccessMode()).toBe('off');
    expect(interviewModeEnabled()).toBe(false);

    process.env.INTERVIEW_MODE_ACCESS = 'unexpected';
    process.env.INTERVIEW_MODE_ENABLED = 'true';
    expect(interviewModeAccessMode()).toBe('off');
    expect(interviewModeAccess('admin')).toEqual({
      mode: 'off',
      enabled: false,
      internalPreview: false,
    });

    process.env.INTERVIEW_MODE_ACCESS = '   ';
    expect(interviewModeAccessMode()).toBe('off');
  });

  test('an explicit off overrides the legacy boolean', () => {
    process.env.INTERVIEW_MODE_ACCESS = 'off';
    process.env.INTERVIEW_MODE_ENABLED = 'true';
    expect(interviewModeAccessMode()).toBe('off');
    expect(interviewConfig()).toEqual(expect.objectContaining({
      accessMode: 'off',
      enabled: false,
    }));
  });

  test('legacy true conservatively maps to admin-only internal preview', () => {
    delete process.env.INTERVIEW_MODE_ACCESS;
    process.env.INTERVIEW_MODE_ENABLED = 'true';
    expect(interviewModeAccessMode()).toBe('internal');
    expect(interviewModeAccess('user')).toEqual({
      mode: 'internal',
      enabled: false,
      internalPreview: false,
    });
    expect(interviewModeAccess('admin')).toEqual({
      mode: 'internal',
      enabled: true,
      internalPreview: true,
    });
  });

  test('internal is admin-only while public enables authenticated users', () => {
    process.env.INTERVIEW_MODE_ACCESS = 'internal';
    expect(interviewModeAccess('user').enabled).toBe(false);
    expect(interviewModeAccess('admin').internalPreview).toBe(true);

    process.env.INTERVIEW_MODE_ACCESS = 'public';
    expect(interviewModeAccess('user')).toEqual({
      mode: 'public',
      enabled: true,
      internalPreview: false,
    });
    expect(interviewModeAccess('admin')).toEqual({
      mode: 'public',
      enabled: true,
      internalPreview: false,
    });
  });

  test('candidate override is explicit and limited to development or test', () => {
    process.env.INTERVIEW_ALLOW_CANDIDATE_BANK = 'true';
    process.env.NODE_ENV = 'staging';
    expect(interviewConfig().allowCandidate).toBe(false);
    process.env.NODE_ENV = 'production';
    expect(interviewConfig().allowCandidate).toBe(false);
    process.env.NODE_ENV = 'development';
    expect(interviewConfig().allowCandidate).toBe(true);
    process.env.NODE_ENV = 'test';
    expect(interviewConfig().allowCandidate).toBe(true);
  });

  test('bounds the draft contract inside a worst-case JSON request envelope', () => {
    process.env.INTERVIEW_MAX_DRAFT_TOTAL_BYTES = String(8 * 1024 * 1024);
    const config = interviewConfig();
    expect(config.maxDraftTotalBytes).toBe(500 * 1024);
    expect(config.httpBodyLimitBytes).toBe(
      (config.maxDraftTotalBytes * 6) + (64 * 1024)
    );
    expect(config.httpBodyLimitBytes).toBeLessThan(4 * 1024 * 1024);
  });
});
