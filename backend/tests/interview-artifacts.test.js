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
  const originalCodingPublicPath = process.env.INTERVIEW_CODING_PUBLIC_PATH;
  const originalCodingPrivatePath = process.env.INTERVIEW_CODING_PRIVATE_PATH;
  const originalCodingReleasePath = process.env.INTERVIEW_CODING_RELEASE_PATH;
  const originalDesignPublicPath = process.env.INTERVIEW_SYSTEM_DESIGN_PUBLIC_PATH;
  const temporaryDirectories = [];

  afterEach(() => {
    jest.restoreAllMocks();
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
    if (originalCodingPublicPath == null) delete process.env.INTERVIEW_CODING_PUBLIC_PATH;
    else process.env.INTERVIEW_CODING_PUBLIC_PATH = originalCodingPublicPath;
    if (originalCodingPrivatePath == null) delete process.env.INTERVIEW_CODING_PRIVATE_PATH;
    else process.env.INTERVIEW_CODING_PRIVATE_PATH = originalCodingPrivatePath;
    if (originalCodingReleasePath == null) delete process.env.INTERVIEW_CODING_RELEASE_PATH;
    else process.env.INTERVIEW_CODING_RELEASE_PATH = originalCodingReleasePath;
    if (originalDesignPublicPath == null) delete process.env.INTERVIEW_SYSTEM_DESIGN_PUBLIC_PATH;
    else process.env.INTERVIEW_SYSTEM_DESIGN_PUBLIC_PATH = originalDesignPublicPath;
    temporaryDirectories.splice(0).forEach((directory) => {
      fs.rmSync(directory, { force: true, recursive: true });
    });
    resetInterviewArtifactsCache();
  });

  function stageCandidateCodingRegistry() {
    const contentRoot = path.resolve(__dirname, '../content/interview');
    const publicArtifact = JSON.parse(fs.readFileSync(
      path.join(contentRoot, 'interview-coding-registry-v1.public.json'),
      'utf8'
    ));
    const privateArtifact = JSON.parse(fs.readFileSync(
      path.join(contentRoot, 'interview-coding-registry-v1.private.json'),
      'utf8'
    ));
    const releaseArtifact = JSON.parse(fs.readFileSync(
      path.join(contentRoot, 'interview-coding-registry-v1.release.json'),
      'utf8'
    ));
    publicArtifact.status = 'candidate';
    privateArtifact.status = 'candidate';
    privateArtifact.finalApproval = null;
    releaseArtifact.status = 'candidate';
    releaseArtifact.finalApproval = null;

    const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'interview-coding-'));
    temporaryDirectories.push(temporaryDirectory);
    const publicPath = path.join(temporaryDirectory, 'coding.public.json');
    const privatePath = path.join(temporaryDirectory, 'coding.private.json');
    const releasePath = path.join(temporaryDirectory, 'coding.release.json');
    const publicRaw = `${JSON.stringify(publicArtifact, null, 2)}\n`;
    const privateRaw = `${JSON.stringify(privateArtifact, null, 2)}\n`;
    releaseArtifact.artifacts.public.sha256 = crypto
      .createHash('sha256')
      .update(publicRaw)
      .digest('hex');
    releaseArtifact.artifacts.private.sha256 = crypto
      .createHash('sha256')
      .update(privateRaw)
      .digest('hex');
    fs.writeFileSync(publicPath, publicRaw);
    fs.writeFileSync(privatePath, privateRaw);
    fs.writeFileSync(releasePath, `${JSON.stringify(releaseArtifact, null, 2)}\n`);
    process.env.INTERVIEW_CODING_PUBLIC_PATH = publicPath;
    process.env.INTERVIEW_CODING_PRIVATE_PATH = privatePath;
    process.env.INTERVIEW_CODING_RELEASE_PATH = releasePath;
  }

  function stageCandidateBank(mutator = () => {}) {
    const contentRoot = path.resolve(__dirname, '../content/interview');
    const publicArtifact = JSON.parse(fs.readFileSync(
      path.join(contentRoot, 'frontend-interview-bank-v1.public.json'),
      'utf8'
    ));
    const privateArtifact = JSON.parse(fs.readFileSync(
      path.join(contentRoot, 'frontend-interview-bank-v1.private.json'),
      'utf8'
    ));
    const releaseArtifact = JSON.parse(fs.readFileSync(
      path.join(contentRoot, 'frontend-interview-bank-v1.release.json'),
      'utf8'
    ));
    publicArtifact.status = 'candidate';
    privateArtifact.status = 'candidate';
    privateArtifact.finalApproval = null;
    releaseArtifact.status = 'candidate';
    releaseArtifact.finalApproval = null;
    mutator({ publicArtifact, privateArtifact, releaseArtifact });

    const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'interview-bank-'));
    temporaryDirectories.push(temporaryDirectory);
    const publicPath = path.join(temporaryDirectory, 'bank.public.json');
    const privatePath = path.join(temporaryDirectory, 'bank.private.json');
    const releasePath = path.join(temporaryDirectory, 'bank.release.json');
    const publicRaw = `${JSON.stringify(publicArtifact, null, 2)}\n`;
    const privateRaw = `${JSON.stringify(privateArtifact, null, 2)}\n`;
    releaseArtifact.artifacts.public.sha256 = crypto
      .createHash('sha256')
      .update(publicRaw)
      .digest('hex');
    releaseArtifact.artifacts.private.sha256 = crypto
      .createHash('sha256')
      .update(privateRaw)
      .digest('hex');
    fs.writeFileSync(publicPath, publicRaw);
    fs.writeFileSync(privatePath, privateRaw);
    fs.writeFileSync(releasePath, `${JSON.stringify(releaseArtifact, null, 2)}\n`);
    process.env.INTERVIEW_BANK_PUBLIC_PATH = publicPath;
    process.env.INTERVIEW_BANK_PRIVATE_PATH = privatePath;
    process.env.INTERVIEW_BANK_RELEASE_PATH = releasePath;
  }

  test('loads the pinned approved MCQ and coding artifacts in production public mode', () => {
    process.env.NODE_ENV = 'production';
    process.env.INTERVIEW_MODE_ACCESS = 'public';
    process.env.INTERVIEW_ALLOW_CANDIDATE_BANK = 'false';
    resetInterviewArtifactsCache();
    const artifacts = loadInterviewArtifacts({ force: true });
    expect(artifacts.bank.status).toBe('editorial-gold');
    expect(artifacts.bank.version).toBe('1.3.0');
    expect(artifacts.bank.contentHash)
      .toBe('9e2aed2606cf0fbaa54cad46c890d48e518be0266a3a91cb95cfb4777038a4e8');
    expect(artifacts.bank.questions).toHaveLength(185);
    const snippets = artifacts.bank.questions.filter((question) => question.code);
    expect(snippets).not.toHaveLength(0);
    expect(snippets.every((question) => (
      typeof question.code === 'string'
      && typeof question.codeLanguage === 'string'
    ))).toBe(true);
    expect(artifacts.coding.status).toBe('editorial-gold');
    expect(artifacts.coding.version).toBe('1.1.0');
    expect(artifacts.coding.contentHash)
      .toBe('d84c6c6f733ae9aff4b4f516656bc93a10643f570ea85034d5cf1e924e35dae8');
    expect(artifacts.coding.variants).toHaveLength(60);
    expect(artifacts.coding.variants.every((variant) => variant.enabled)).toBe(true);
  });

  test('keeps the System Design candidate independent from approved coding artifacts', () => {
    process.env.NODE_ENV = 'test';
    process.env.INTERVIEW_ALLOW_CANDIDATE_BANK = 'true';
    resetInterviewArtifactsCache();
    const systemDesign = loadSystemDesignArtifacts({ force: true });
    expect(systemDesign.status).toBe('candidate');
    expect(systemDesign.scenarios).toHaveLength(8);
    expect(systemDesign.scenarios.every((scenario) => scenario.enabled)).toBe(true);
  });

  test('loads the explicit 185-question MCQ candidate only in authorized test mode', () => {
    stageCandidateBank();
    process.env.NODE_ENV = 'test';
    process.env.INTERVIEW_ALLOW_CANDIDATE_BANK = 'true';
    resetInterviewArtifactsCache();

    const artifacts = loadInterviewArtifacts({ force: true });
    expect(artifacts.bank.version).toBe('1.3.0');
    expect(artifacts.bank.status).toBe('candidate');
    expect(artifacts.bank.questions).toHaveLength(185);
    expect(fs.readFileSync(process.env.INTERVIEW_BANK_PUBLIC_PATH, 'utf8'))
      .not.toMatch(/correctOptionId|answerProof|optionRationales|provenance/);
  });

  test('production public mode rejects the staged 185-question MCQ candidate', () => {
    stageCandidateBank();
    process.env.NODE_ENV = 'production';
    process.env.INTERVIEW_MODE_ACCESS = 'public';
    process.env.INTERVIEW_ALLOW_CANDIDATE_BANK = 'true';
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
    stageCandidateBank(({ publicArtifact }) => {
      const question = publicArtifact.items.find((item) => item.code);
      question.code = malformedCode;
    });
    resetInterviewArtifactsCache();

    expect(() => loadInterviewArtifacts({ force: true })).toThrow(expectedError);
  });

  test('rejects an otherwise valid Gold coding release whose definition pin drifts', () => {
    const contentRoot = path.resolve(__dirname, '../content/interview');
    const releaseArtifact = JSON.parse(fs.readFileSync(
      path.join(contentRoot, 'interview-coding-registry-v1.release.json'),
      'utf8'
    ));
    releaseArtifact.definitionHash = '0'.repeat(64);
    const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'interview-coding-pin-'));
    temporaryDirectories.push(temporaryDirectory);
    const releasePath = path.join(temporaryDirectory, 'coding.release.json');
    fs.writeFileSync(releasePath, `${JSON.stringify(releaseArtifact, null, 2)}\n`);
    process.env.INTERVIEW_CODING_RELEASE_PATH = releasePath;
    process.env.NODE_ENV = 'production';
    process.env.INTERVIEW_MODE_ACCESS = 'public';
    process.env.INTERVIEW_ALLOW_CANDIDATE_BANK = 'false';
    resetInterviewArtifactsCache();

    expect(() => loadInterviewArtifacts({ force: true })).toThrow(
      'coding registry release does not match the approved artifact pins'
    );
  });

  test('rejects a self-consistent Gold MCQ artifact rewrite outside the external pins', () => {
    const contentRoot = path.resolve(__dirname, '../content/interview');
    const publicArtifact = JSON.parse(fs.readFileSync(
      path.join(contentRoot, 'frontend-interview-bank-v1.public.json'),
      'utf8'
    ));
    const releaseArtifact = JSON.parse(fs.readFileSync(
      path.join(contentRoot, 'frontend-interview-bank-v1.release.json'),
      'utf8'
    ));
    publicArtifact.items[0].prompt = `${publicArtifact.items[0].prompt} Tampered.`;
    const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'interview-bank-pin-'));
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
    process.env.NODE_ENV = 'production';
    process.env.INTERVIEW_MODE_ACCESS = 'public';
    process.env.INTERVIEW_ALLOW_CANDIDATE_BANK = 'false';
    resetInterviewArtifactsCache();

    expect(() => loadInterviewArtifacts({ force: true })).toThrow(
      'bank public artifact does not match the approved artifact pins'
    );
  });

  test('rejects a self-consistent Gold coding artifact rewrite outside the external pins', () => {
    const contentRoot = path.resolve(__dirname, '../content/interview');
    const privateArtifact = JSON.parse(fs.readFileSync(
      path.join(contentRoot, 'interview-coding-registry-v1.private.json'),
      'utf8'
    ));
    const releaseArtifact = JSON.parse(fs.readFileSync(
      path.join(contentRoot, 'interview-coding-registry-v1.release.json'),
      'utf8'
    ));
    privateArtifact.variants[0].conceptId = 'coding-tampered-family';
    const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'interview-coding-pin-'));
    temporaryDirectories.push(temporaryDirectory);
    const privatePath = path.join(temporaryDirectory, 'coding.private.json');
    const releasePath = path.join(temporaryDirectory, 'coding.release.json');
    const privateRaw = `${JSON.stringify(privateArtifact, null, 2)}\n`;
    releaseArtifact.artifacts.private.sha256 = crypto
      .createHash('sha256')
      .update(privateRaw)
      .digest('hex');
    fs.writeFileSync(privatePath, privateRaw);
    fs.writeFileSync(releasePath, `${JSON.stringify(releaseArtifact, null, 2)}\n`);
    process.env.INTERVIEW_CODING_PRIVATE_PATH = privatePath;
    process.env.INTERVIEW_CODING_RELEASE_PATH = releasePath;
    process.env.NODE_ENV = 'production';
    process.env.INTERVIEW_MODE_ACCESS = 'public';
    process.env.INTERVIEW_ALLOW_CANDIDATE_BANK = 'false';
    resetInterviewArtifactsCache();

    expect(() => loadInterviewArtifacts({ force: true })).toThrow(
      'coding registry private artifact does not match the approved artifact pins'
    );
  });

  test('production rejects a candidate coding registry even if candidate override is set', () => {
    stageCandidateCodingRegistry();
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
    stageCandidateCodingRegistry();
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
    stageCandidateCodingRegistry();
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

  test('returns a warm artifact cache hit before synchronous file reads', () => {
    process.env.NODE_ENV = 'test';
    process.env.INTERVIEW_ALLOW_CANDIDATE_BANK = 'true';
    resetInterviewArtifactsCache();
    const readSpy = jest.spyOn(fs, 'readFileSync');

    const first = loadInterviewArtifacts();
    const readsAfterColdLoad = readSpy.mock.calls.length;
    const second = loadInterviewArtifacts();

    expect(readsAfterColdLoad).toBe(6);
    expect(readSpy).toHaveBeenCalledTimes(readsAfterColdLoad);
    expect(second).toBe(first);
  });

  test('keys warm caches by resolved paths and candidate policy', () => {
    process.env.NODE_ENV = 'test';
    process.env.INTERVIEW_ALLOW_CANDIDATE_BANK = 'true';
    resetInterviewArtifactsCache();
    const readSpy = jest.spyOn(fs, 'readFileSync');

    loadInterviewArtifacts();
    expect(readSpy).toHaveBeenCalledTimes(6);
    loadSystemDesignArtifacts();
    expect(readSpy).toHaveBeenCalledTimes(9);
    loadInterviewArtifacts();
    loadSystemDesignArtifacts();
    expect(readSpy).toHaveBeenCalledTimes(9);
  });

  test('the standalone candidate override requires an exact development or test environment', () => {
    stageCandidateCodingRegistry();
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
    expect(coding.bank.questions).toHaveLength(185);
    expect(coding.coding.status).toBe('editorial-gold');
    expect(coding.coding.variants.length).toBeGreaterThan(0);
  });
});
