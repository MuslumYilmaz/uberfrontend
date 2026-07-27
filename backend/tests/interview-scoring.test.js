'use strict';

const { buildResultSnapshot } = require('../services/interview/scoring');

function scoringFixture(overrides = {}) {
  const startedAt = new Date('2026-07-27T12:00:00.000Z');
  return {
    _id: 'interview-scoring-fixture',
    level: 'mid',
    track: 'react',
    timingMode: 'standard',
    questions: [{
      id: 'question-1',
      revision: 1,
      technology: 'javascript',
      competency: 'event-loop',
      prompt: 'Which callback runs first?',
      options: [
        { id: 'option-a', label: 'The queued microtask.' },
        { id: 'option-b', label: 'The queued timer.' },
        { id: 'option-c', label: 'They run together.' },
      ],
    }],
    answerKey: [{
      id: 'question-1',
      correctOptionId: 'option-a',
      explanation: 'Microtasks drain before the next timer task.',
      optionRationales: [],
      remediationTopics: ['JavaScript event loop'],
    }],
    mcqResponses: [{
      questionId: 'question-1',
      selectedOptionId: 'option-a',
      answeredAt: new Date('2026-07-27T12:00:30.000Z'),
    }],
    mcqStartedAt: startedAt,
    mcqDeadlineAt: new Date('2026-07-27T12:10:00.000Z'),
    mcqSubmittedAt: new Date('2026-07-27T12:01:00.000Z'),
    codingVariant: {
      id: 'coding-1',
      timeLimitSeconds: 900,
      publicRequirements: [{ id: 'behavior', title: 'Behavior' }],
    },
    codingPrivate: {
      remediationTopics: ['React async ownership'],
      rubric: {
        groups: [{
          id: 'behavior',
          title: 'Behavior',
          criteria: ['Keep the latest request authoritative.'],
          checkIds: ['latest-request-wins'],
        }],
      },
    },
    codingOutcome: 'abandoned',
    codingCheckRuns: [],
    codingStartedAt: null,
    codingDeadlineAt: null,
    codingSubmittedAt: null,
    submittedDraftHash: null,
    completedAt: null,
    ...overrides,
  };
}

describe('Interview result remediation', () => {
  test('does not recommend coding topics when coding was never evaluated', () => {
    const results = buildResultSnapshot(scoringFixture(), {
      finalizedAt: new Date('2026-07-27T12:02:00.000Z'),
    });

    expect(results.reviewNext).toEqual([]);
    expect(results.coding.rubric).toEqual([
      expect.objectContaining({ id: 'behavior', status: 'not_evaluated' }),
    ]);
  });

  test('keeps client-forgeable browser checks as non-evaluative practice evidence', () => {
    const results = buildResultSnapshot(scoringFixture({
      codingOutcome: 'submitted',
      codingStartedAt: new Date('2026-07-27T12:01:00.000Z'),
      codingSubmittedAt: new Date('2026-07-27T12:05:00.000Z'),
      submittedDraftHash: 'draft-hash',
      codingCheckRuns: [{
        draftHash: 'draft-hash',
        passedCount: 0,
        totalCount: 1,
        ranAt: new Date('2026-07-27T12:04:55.000Z'),
        checks: [{ id: 'latest-request-wins', passed: false }],
      }],
    }), {
      finalizedAt: new Date('2026-07-27T12:05:00.000Z'),
    });

    expect(results.reviewNext).toEqual([]);
    expect(results.coding.rubric).toEqual([
      expect.objectContaining({
        id: 'behavior',
        status: 'not_evaluated',
        checkIds: [],
      }),
    ]);
    expect(results.coding).toEqual(expect.objectContaining({
      locallyVerified: true,
      authoritativeEvaluation: false,
      evidenceMode: 'client-self-report',
      checkRun: expect.objectContaining({
        evidenceSource: 'client-self-report',
        authoritative: false,
      }),
    }));
    expect(JSON.stringify(results)).not.toContain('Keep the latest request authoritative.');
    expect(JSON.stringify(results)).not.toContain('React async ownership');
  });

  test('uses the actual end time when coding is abandoned before its deadline', () => {
    const results = buildResultSnapshot(scoringFixture({
      codingStartedAt: new Date('2026-07-27T12:01:00.000Z'),
      codingDeadlineAt: new Date('2026-07-27T12:16:00.000Z'),
      abandonedAt: new Date('2026-07-27T12:04:00.000Z'),
    }), {
      finalizedAt: new Date('2026-07-27T12:04:00.000Z'),
    });

    expect(results.coding.timing).toEqual({
      usedSeconds: 180,
      allowedSeconds: 900,
    });
  });
});
