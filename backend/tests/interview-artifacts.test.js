'use strict';

const {
  InterviewContentError,
  loadInterviewArtifacts,
  resetInterviewArtifactsCache,
} = require('../services/interview/artifacts');

describe('interview runtime artifact gate', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalCandidate = process.env.INTERVIEW_ALLOW_CANDIDATE_BANK;
  const originalAccess = process.env.INTERVIEW_MODE_ACCESS;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalCandidate == null) delete process.env.INTERVIEW_ALLOW_CANDIDATE_BANK;
    else process.env.INTERVIEW_ALLOW_CANDIDATE_BANK = originalCandidate;
    if (originalAccess == null) delete process.env.INTERVIEW_MODE_ACCESS;
    else process.env.INTERVIEW_MODE_ACCESS = originalAccess;
    resetInterviewArtifactsCache();
  });

  test('loads the approved MCQ bank and explicit development candidate coding registry', () => {
    process.env.NODE_ENV = 'test';
    process.env.INTERVIEW_ALLOW_CANDIDATE_BANK = 'true';
    resetInterviewArtifactsCache();
    const artifacts = loadInterviewArtifacts({ force: true });
    expect(artifacts.bank.status).toBe('editorial-gold');
    expect(artifacts.bank.questions).toHaveLength(60);
    expect(artifacts.coding.status).toBe('candidate');
    expect(artifacts.coding.variants.filter((variant) => variant.enabled)).not.toHaveLength(0);
  });

  test('production rejects a candidate coding registry even if candidate override is set', () => {
    process.env.NODE_ENV = 'production';
    process.env.INTERVIEW_MODE_ACCESS = 'public';
    process.env.INTERVIEW_ALLOW_CANDIDATE_BANK = 'true';
    resetInterviewArtifactsCache();
    expect(() => loadInterviewArtifacts({ force: true })).toThrow(InterviewContentError);
    expect(() => loadInterviewArtifacts({ force: true })).toThrow(
      'coding registry artifact is not approved for runtime use'
    );
  });

  test('production internal preview can load candidate artifacts only with server authorization', () => {
    process.env.NODE_ENV = 'production';
    process.env.INTERVIEW_MODE_ACCESS = 'internal';
    process.env.INTERVIEW_ALLOW_CANDIDATE_BANK = 'false';
    resetInterviewArtifactsCache();

    expect(() => loadInterviewArtifacts({ force: true })).toThrow(
      'coding registry artifact is not approved for runtime use'
    );

    const artifacts = loadInterviewArtifacts({
      force: true,
      allowInternalCandidate: true,
    });
    expect(artifacts.bank.status).toBe('editorial-gold');
    expect(artifacts.coding.status).toBe('candidate');
  });

  test('an internal candidate cache cannot bleed into public mode', () => {
    process.env.NODE_ENV = 'production';
    process.env.INTERVIEW_MODE_ACCESS = 'internal';
    process.env.INTERVIEW_ALLOW_CANDIDATE_BANK = 'false';
    resetInterviewArtifactsCache();

    expect(loadInterviewArtifacts({
      allowInternalCandidate: true,
    }).coding.status).toBe('candidate');

    process.env.INTERVIEW_MODE_ACCESS = 'public';
    let publicError = null;
    try {
      loadInterviewArtifacts({ allowInternalCandidate: true });
    } catch (error) {
      publicError = error;
    }
    expect(publicError).toEqual(expect.objectContaining({
      code: 'INTERVIEW_CONTENT_UNAVAILABLE',
      statusCode: 503,
    }));
    expect(publicError.message).toContain(
      'coding registry artifact is not approved for runtime use'
    );
  });

  test('the standalone candidate override requires an exact development or test environment', () => {
    process.env.NODE_ENV = 'staging';
    process.env.INTERVIEW_MODE_ACCESS = 'public';
    process.env.INTERVIEW_ALLOW_CANDIDATE_BANK = 'true';
    resetInterviewArtifactsCache();

    expect(() => loadInterviewArtifacts()).toThrow(
      'coding registry artifact is not approved for runtime use'
    );

    process.env.NODE_ENV = 'development';
    resetInterviewArtifactsCache();
    expect(loadInterviewArtifacts().coding.status).toBe('candidate');
  });
});
