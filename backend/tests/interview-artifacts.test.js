'use strict';

const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  InterviewContentError,
  loadInterviewArtifacts,
  loadSystemDesignArtifacts,
  resetInterviewArtifactsCache,
} = require('../services/interview/artifacts');

describe('interview runtime artifact gate', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalCandidate = process.env.INTERVIEW_ALLOW_CANDIDATE_BANK;
  const originalAccess = process.env.INTERVIEW_MODE_ACCESS;
  const originalBankPublicPath = process.env.INTERVIEW_BANK_PUBLIC_PATH;
  const originalBankPrivatePath = process.env.INTERVIEW_BANK_PRIVATE_PATH;
  const originalBankReleasePath = process.env.INTERVIEW_BANK_RELEASE_PATH;
  const originalDesignPublicPath = process.env.INTERVIEW_SYSTEM_DESIGN_PUBLIC_PATH;
  const temporaryDirectories = [];

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalCandidate == null) delete process.env.INTERVIEW_ALLOW_CANDIDATE_BANK;
    else process.env.INTERVIEW_ALLOW_CANDIDATE_BANK = originalCandidate;
    if (originalAccess == null) delete process.env.INTERVIEW_MODE_ACCESS;
    else process.env.INTERVIEW_MODE_ACCESS = originalAccess;
    if (originalBankPublicPath == null) delete process.env.INTERVIEW_BANK_PUBLIC_PATH;
    else process.env.INTERVIEW_BANK_PUBLIC_PATH = originalBankPublicPath;
    if (originalBankPrivatePath == null) delete process.env.INTERVIEW_BANK_PRIVATE_PATH;
    else process.env.INTERVIEW_BANK_PRIVATE_PATH = originalBankPrivatePath;
    if (originalBankReleasePath == null) delete process.env.INTERVIEW_BANK_RELEASE_PATH;
    else process.env.INTERVIEW_BANK_RELEASE_PATH = originalBankReleasePath;
    if (originalDesignPublicPath == null) delete process.env.INTERVIEW_SYSTEM_DESIGN_PUBLIC_PATH;
    else process.env.INTERVIEW_SYSTEM_DESIGN_PUBLIC_PATH = originalDesignPublicPath;
    temporaryDirectories.splice(0).forEach((directory) => {
      fs.rmSync(directory, { force: true, recursive: true });
    });
    resetInterviewArtifactsCache();
  });

  test('loads the approved MCQ bank and explicit development candidate coding registry', () => {
    process.env.NODE_ENV = 'test';
    process.env.INTERVIEW_ALLOW_CANDIDATE_BANK = 'true';
    resetInterviewArtifactsCache();
    const artifacts = loadInterviewArtifacts({ force: true });
    expect(artifacts.bank.status).toBe('editorial-gold');
    expect(artifacts.bank.questions).toHaveLength(120);
    const snippets = artifacts.bank.questions.filter((question) => question.code);
    expect(snippets).not.toHaveLength(0);
    expect(snippets.every((question) => (
      typeof question.code === 'string'
      && typeof question.codeLanguage === 'string'
    ))).toBe(true);
    expect(artifacts.coding.status).toBe('candidate');
    expect(artifacts.coding.variants.filter((variant) => variant.enabled)).not.toHaveLength(0);
    const systemDesign = loadSystemDesignArtifacts({ force: true });
    expect(systemDesign.status).toBe('candidate');
    expect(systemDesign.scenarios).toHaveLength(8);
    expect(systemDesign.scenarios.every((scenario) => scenario.enabled)).toBe(true);
  });

  test('loads the explicit 170-question MCQ candidate only in authorized test mode', () => {
    const candidateRoot = path.resolve(
      __dirname,
      '../../content-drafts/interview-mcq/generated/candidate-1.2.0'
    );
    process.env.NODE_ENV = 'test';
    process.env.INTERVIEW_ALLOW_CANDIDATE_BANK = 'true';
    process.env.INTERVIEW_BANK_PUBLIC_PATH = path.join(
      candidateRoot,
      'frontend-interview-bank-v1.public.json'
    );
    process.env.INTERVIEW_BANK_PRIVATE_PATH = path.join(
      candidateRoot,
      'frontend-interview-bank-v1.private.json'
    );
    process.env.INTERVIEW_BANK_RELEASE_PATH = path.join(
      candidateRoot,
      'frontend-interview-bank-v1.release.json'
    );
    resetInterviewArtifactsCache();

    const artifacts = loadInterviewArtifacts({ force: true });
    expect(artifacts.bank.version).toBe('1.2.0');
    expect(artifacts.bank.status).toBe('candidate');
    expect(artifacts.bank.questions).toHaveLength(170);
    expect(fs.readFileSync(process.env.INTERVIEW_BANK_PUBLIC_PATH, 'utf8'))
      .not.toMatch(/correctOptionId|answerProof|optionRationales|provenance/);
  });

  test('production public mode rejects the staged 170-question MCQ candidate', () => {
    const candidateRoot = path.resolve(
      __dirname,
      '../../content-drafts/interview-mcq/generated/candidate-1.2.0'
    );
    process.env.NODE_ENV = 'production';
    process.env.INTERVIEW_MODE_ACCESS = 'public';
    process.env.INTERVIEW_ALLOW_CANDIDATE_BANK = 'true';
    process.env.INTERVIEW_BANK_PUBLIC_PATH = path.join(
      candidateRoot,
      'frontend-interview-bank-v1.public.json'
    );
    process.env.INTERVIEW_BANK_PRIVATE_PATH = path.join(
      candidateRoot,
      'frontend-interview-bank-v1.private.json'
    );
    process.env.INTERVIEW_BANK_RELEASE_PATH = path.join(
      candidateRoot,
      'frontend-interview-bank-v1.release.json'
    );
    resetInterviewArtifactsCache();

    expect(() => loadInterviewArtifacts({ force: true })).toThrow(
      'bank artifact is not approved for runtime use'
    );
  });

  test.each([
    [
      'missing source',
      { language: 'javascript', runtime: 'browser' },
      'code.source is required',
    ],
    [
      'non-string language',
      { language: 42, runtime: 'browser', source: 'const value = true;' },
      'code.language must be a non-empty string',
    ],
    [
      'non-string runtime',
      { language: 'javascript', runtime: {}, source: 'const value = true;' },
      'code.runtime must be a non-empty string',
    ],
  ])('rejects a malformed structured question snippet: %s', (
    _caseName,
    malformedCode,
    expectedError
  ) => {
    process.env.NODE_ENV = 'test';
    process.env.INTERVIEW_ALLOW_CANDIDATE_BANK = 'true';
    const contentRoot = path.resolve(__dirname, '../content/interview');
    const publicArtifact = JSON.parse(fs.readFileSync(
      path.join(contentRoot, 'frontend-interview-bank-v1.public.json'),
      'utf8'
    ));
    const releaseArtifact = JSON.parse(fs.readFileSync(
      path.join(contentRoot, 'frontend-interview-bank-v1.release.json'),
      'utf8'
    ));
    const question = publicArtifact.items.find((item) => item.code);
    question.code = malformedCode;

    const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'interview-bank-'));
    temporaryDirectories.push(temporaryDirectory);
    const publicPath = path.join(temporaryDirectory, 'bank.public.json');
    const releasePath = path.join(temporaryDirectory, 'bank.release.json');
    const publicRaw = `${JSON.stringify(publicArtifact, null, 2)}\n`;
    releaseArtifact.artifacts.public.sha256 = crypto
      .createHash('sha256')
      .update(publicRaw)
      .digest('hex');
    fs.writeFileSync(publicPath, publicRaw);
    fs.writeFileSync(releasePath, `${JSON.stringify(releaseArtifact, null, 2)}\n`);
    process.env.INTERVIEW_BANK_PUBLIC_PATH = publicPath;
    process.env.INTERVIEW_BANK_RELEASE_PATH = releasePath;
    resetInterviewArtifactsCache();

    expect(() => loadInterviewArtifacts({ force: true })).toThrow(expectedError);
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

  test('a broken System Design artifact cannot make Coding Mock artifacts unavailable', () => {
    process.env.NODE_ENV = 'test';
    process.env.INTERVIEW_ALLOW_CANDIDATE_BANK = 'true';
    process.env.INTERVIEW_SYSTEM_DESIGN_PUBLIC_PATH = '/missing/system-design-public.json';
    resetInterviewArtifactsCache();

    expect(() => loadSystemDesignArtifacts({ force: true })).toThrow(
      'system design public artifact is unavailable'
    );
    const coding = loadInterviewArtifacts({ force: true });
    expect(coding.bank.questions).toHaveLength(120);
    expect(coding.coding.variants.length).toBeGreaterThan(0);
  });
});
