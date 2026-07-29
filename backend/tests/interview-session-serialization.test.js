'use strict';

const { serializeSession } = require('../services/interview/session-service');

describe('interview session serialization', () => {
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
