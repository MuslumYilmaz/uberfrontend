'use strict';

const path = require('path');

const {
  loadInterviewArtifacts,
  resetInterviewArtifactsCache,
} = require('../services/interview/artifacts');
const { selectQuestions } = require('../services/interview/selection');
const { serializeSession } = require('../services/interview/session-service');

describe('interview session serialization', () => {
  test('marks abandoned sessions as having no result and exposes no answer material', () => {
    const serialized = serializeSession({
      _id: 'abandoned-session',
      __v: 4,
      format: 'coding',
      status: 'abandoned',
      active: false,
      level: 'mid',
      track: 'react',
      timingMode: 'standard',
      bank: {
        id: 'frontend-interview-bank',
        version: '1.0.0',
        contentHash: 'bank-hash',
      },
      questions: [{
        id: 'question-one',
        revision: 1,
        contentHash: 'question-hash',
        technology: 'react',
        level: 'mid',
        difficultyBand: 'core',
        format: 'production-scenario',
        competency: 'effect-ownership',
        prompt: 'Which owner should release the resource?',
        estimatedSeconds: 90,
        options: [
          { id: 'option-one', label: 'The resource owner.' },
          { id: 'option-two', label: 'An unrelated render.' },
        ],
      }],
      answerKey: [{
        id: 'question-one',
        correctOptionId: 'option-one',
        explanation: 'Private answer explanation.',
      }],
      resultSnapshot: {
        mcq: {
          correct: 1,
          questions: [{
            correctOptionId: 'option-one',
            explanation: 'Private answer explanation.',
          }],
        },
      },
      mcqResponses: [{
        questionId: 'question-one',
        selectedOptionId: 'option-one',
        answeredAt: new Date('2026-08-24T08:00:00.000Z'),
      }],
      codingOutcome: 'abandoned',
      entitlementSnapshot: {
        tier: 'premium',
        capturedAt: new Date('2026-08-24T08:00:00.000Z'),
      },
    }, { now: new Date('2026-08-24T08:01:00.000Z') });

    expect(serialized.resultAvailable).toBe(false);
    expect(JSON.stringify(serialized)).not.toMatch(
      /correctOptionId|explanation|Private answer explanation/
    );
  });

  test('serializes a selected five-question approved snapshot without answer data', () => {
    const original = {
      nodeEnv: process.env.NODE_ENV,
      allowCandidate: process.env.INTERVIEW_ALLOW_CANDIDATE_BANK,
      publicPath: process.env.INTERVIEW_BANK_PUBLIC_PATH,
      privatePath: process.env.INTERVIEW_BANK_PRIVATE_PATH,
      releasePath: process.env.INTERVIEW_BANK_RELEASE_PATH,
    };
    const approvedRoot = path.resolve(__dirname, '../content/interview');
    try {
      process.env.NODE_ENV = 'test';
      process.env.INTERVIEW_ALLOW_CANDIDATE_BANK = 'false';
      process.env.INTERVIEW_BANK_PUBLIC_PATH = path.join(
        approvedRoot,
        'frontend-interview-bank-v1.public.json'
      );
      process.env.INTERVIEW_BANK_PRIVATE_PATH = path.join(
        approvedRoot,
        'frontend-interview-bank-v1.private.json'
      );
      process.env.INTERVIEW_BANK_RELEASE_PATH = path.join(
        approvedRoot,
        'frontend-interview-bank-v1.release.json'
      );
      resetInterviewArtifactsCache();
      const bank = loadInterviewArtifacts({ force: true }).bank;
      const questions = selectQuestions({
        questions: bank.questions,
        track: 'core-web',
        level: 'junior',
        seed: 'approved-1.3.0:serialization',
      });
      const serialized = serializeSession({
        _id: 'candidate-session-snapshot',
        __v: 1,
        format: 'coding',
        status: 'mcq_active',
        active: true,
        level: 'junior',
        track: 'core-web',
        timingMode: 'standard',
        bank: {
          id: bank.id,
          version: bank.version,
          contentHash: bank.contentHash,
        },
        questions,
        mcqResponses: [],
        codingOutcome: 'pending',
        entitlementSnapshot: {
          tier: 'free',
          capturedAt: new Date('2026-08-05T12:00:00.000Z'),
        },
      }, { now: new Date('2026-08-05T12:00:00.000Z') });

      expect(serialized.bank).toEqual(expect.objectContaining({
        version: '1.3.0',
        contentHash: bank.contentHash,
      }));
      expect(serialized.questions).toHaveLength(5);
      expect(JSON.stringify(serialized.questions)).not.toMatch(
        /correctOptionId|answerProof|optionRationales|provenance/
      );
    } finally {
      const restore = (name, value) => {
        if (value == null) delete process.env[name];
        else process.env[name] = value;
      };
      restore('NODE_ENV', original.nodeEnv);
      restore('INTERVIEW_ALLOW_CANDIDATE_BANK', original.allowCandidate);
      restore('INTERVIEW_BANK_PUBLIC_PATH', original.publicPath);
      restore('INTERVIEW_BANK_PRIVATE_PATH', original.privatePath);
      restore('INTERVIEW_BANK_RELEASE_PATH', original.releasePath);
      resetInterviewArtifactsCache();
    }
  });

  test('preserves flattened snippet source and language without exposing runtime metadata', () => {
    const serialized = serializeSession({
      _id: 'session-with-snippet',
      __v: 2,
      format: 'coding',
      status: 'mcq_active',
      active: true,
      level: 'mid',
      track: 'core-web',
      timingMode: 'standard',
      bank: {
        id: 'frontend-interview-gold-bank',
        version: '1.0.0',
        contentHash: 'bank-hash',
      },
      questions: [
        {
          id: 'question-with-snippet',
          revision: 1,
          contentHash: 'question-hash',
          technology: 'javascript',
          level: 'mid',
          difficultyBand: 'core',
          format: 'production-scenario',
          competency: 'snippet-contract',
          prompt: 'Which implementation preserves the runtime contract?',
          code: 'const value = compute();',
          codeLanguage: 'javascript',
          estimatedSeconds: 90,
          options: [
            { id: 'choice-one', label: 'First approach' },
            { id: 'choice-two', label: 'Second approach' },
            { id: 'choice-three', label: 'Third approach' },
          ],
        },
        {
          id: 'legacy-question-with-snippet',
          revision: 1,
          contentHash: 'legacy-question-hash',
          technology: 'javascript',
          level: 'mid',
          difficultyBand: 'core',
          format: 'production-scenario',
          competency: 'legacy-snippet-contract',
          prompt: 'How is a legacy session snapshot serialized?',
          code: 'const legacy = true;',
          estimatedSeconds: 60,
          options: [
            { id: 'legacy-one', label: 'First legacy approach' },
            { id: 'legacy-two', label: 'Second legacy approach' },
            { id: 'legacy-three', label: 'Third legacy approach' },
          ],
        },
      ],
      mcqResponses: [],
      codingOutcome: 'pending',
      entitlementSnapshot: {
        tier: 'free',
        capturedAt: new Date('2026-07-29T12:00:00.000Z'),
      },
    }, {
      now: new Date('2026-07-29T12:00:00.000Z'),
    });

    expect(serialized.questions[0]).toEqual(expect.objectContaining({
      code: 'const value = compute();',
      codeLanguage: 'javascript',
    }));
    expect(serialized.questions[0]).not.toHaveProperty('runtime');
    expect(serialized.questions[1]).toEqual(expect.objectContaining({
      code: 'const legacy = true;',
    }));
    expect(serialized.questions[1]).not.toHaveProperty('codeLanguage');
  });
});
