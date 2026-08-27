'use strict';

const path = require('path');

const {
  loadInterviewArtifacts,
  resetInterviewArtifactsCache,
} = require('../services/interview/artifacts');
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
      code: 'queueMicrotask(run); setTimeout(run, 0);',
      codeLanguage: 'javascript',
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
  test('scores an opaque answer from the approved 185-question bank', () => {
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

      const artifacts = loadInterviewArtifacts({ force: true });
      const question = artifacts.bank.questions.find(
        (entry) => entry.id === 'int-js-number-finite-input-validation-jr-v1'
      );
      const answer = artifacts.bank.answerByKey.get(
        `${question.id}@${question.revision}`
      );
      const results = buildResultSnapshot(scoringFixture({
        questions: [question],
        answerKey: [{ id: question.id, ...answer }],
        mcqResponses: [{
          questionId: question.id,
          selectedOptionId: answer.correctOptionId,
          answeredAt: new Date('2026-08-05T12:00:30.000Z'),
        }],
      }), { finalizedAt: new Date('2026-08-05T12:01:00.000Z') });

      expect(artifacts.bank.version).toBe('1.3.0');
      expect(results.mcq).toEqual(expect.objectContaining({
        total: 1,
        correct: 1,
        incorrect: 0,
        unanswered: 0,
      }));
      expect(results.mcq.questions[0]).toEqual(expect.objectContaining({
        id: question.id,
        selectedOptionId: answer.correctOptionId,
        outcome: 'correct',
      }));
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

  test('does not recommend coding topics when coding was never evaluated', () => {
    const results = buildResultSnapshot(scoringFixture(), {
      finalizedAt: new Date('2026-07-27T12:02:00.000Z'),
    });

    expect(results.reviewNext).toEqual([]);
    expect(results.mcq.questions[0]).toEqual(expect.objectContaining({
      code: 'queueMicrotask(run); setTimeout(run, 0);',
      codeLanguage: 'javascript',
    }));
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

describe('Guided System Design scoring', () => {
  test('evaluates allowlisted evidence while keeping rules and numeric weights private', () => {
    const criterion = (id, evidence, rule) => ({
      id,
      weight: 1,
      evidence,
      rule,
    });
    const axes = [
      ['requirements', { predicate: 'clarificationSelected', clarificationId: 'clarify-scale' }],
      ['architecture', {
        predicate: 'cardInLane',
        cardId: 'controller',
        laneId: 'state',
      }],
      ['interfaces', {
        predicate: 'decisionSelected',
        decisionId: 'cache',
        optionId: 'keyed',
      }],
      ['resilience', { predicate: 'twistActionSelected', actionId: 'abort-stale' }],
      ['accessibility', {
        when: {
          if: { predicate: 'requirementPrioritized', requirementId: 'screen-reader' },
          then: { predicate: 'decisionSelected', decisionId: 'announce', optionId: 'live' },
        },
      }],
      ['tradeoffs', {
        when: {
          if: { predicate: 'requirementPrioritized', requirementId: 'offline' },
          then: {
            predicate: 'rationaleSelected',
            decisionId: 'cache',
            rationaleId: 'offline-safe',
          },
        },
      }],
    ].map(([id, rule]) => ({
      id,
      title: id,
      remediationTopics: [`Review ${id}`],
      criteria: [criterion(`${id}-criterion`, `Evidence for ${id}`, rule)],
    }));
    const startedAt = new Date('2026-07-29T10:00:00.000Z');
    const result = buildResultSnapshot({
      _id: 'system-design-result',
      format: 'system-design',
      level: 'mid',
      track: 'react',
      timingMode: 'standard',
      timingPolicy: { systemDesignSeconds: 900 },
      systemDesignScenario: {
        id: 'int-sd-autocomplete-race-mid-v1',
        title: 'Reliable autocomplete',
        timeLimitSeconds: 900,
        selectionLimits: { clarifications: 1, priorities: 1 },
        decisions: [{ id: 'cache' }],
        frameworkLenses: {
          react: { title: 'React lens', prompt: 'Discuss ownership.' },
        },
      },
      systemDesignPrivate: {
        sourceEvidence: { sourceContentId: 'realtime-search-debounce-cache' },
        rubric: {
          axes,
          contradictions: [{
            id: 'critical-inactive-axis',
            severity: 'critical',
            axisIds: ['accessibility'],
            summary: 'The selected response creates a critical accessibility conflict.',
            rule: { predicate: 'twistActionSelected', actionId: 'abort-stale' },
          }],
        },
      },
      systemDesignDraft: {
        currentStep: 'twist',
        clarificationIds: ['clarify-scale'],
        priorityRequirementIds: ['latency'],
        placements: [{ cardId: 'controller', laneId: 'state', order: 0 }],
        connections: [],
        decisions: [{ decisionId: 'cache', optionId: 'keyed', rationaleIds: [] }],
        twistResponseActionIds: ['abort-stale'],
        scratchpad: '',
      },
      systemDesignBaseline: {
        currentStep: 'decisions',
        clarificationIds: ['clarify-scale'],
        priorityRequirementIds: ['latency'],
        placements: [{ cardId: 'controller', laneId: 'state', order: 0 }],
        connections: [],
        decisions: [{ decisionId: 'cache', optionId: 'none', rationaleIds: [] }],
        twistResponseActionIds: [],
        scratchpad: '',
      },
      systemDesignStartedAt: startedAt,
      systemDesignSubmittedAt: new Date('2026-07-29T10:08:00.000Z'),
      systemDesignTwistRevealedAt: new Date('2026-07-29T10:06:00.000Z'),
      systemDesignOutcome: 'submitted',
    }, {
      finalizedAt: new Date('2026-07-29T10:08:00.000Z'),
    });

    expect(result).toEqual(expect.objectContaining({
      interviewFormat: 'system-design',
      xpAwarded: 0,
      employmentPrediction: null,
      mcq: null,
      coding: null,
      systemDesign: expect.objectContaining({
        scenarioId: 'int-sd-autocomplete-race-mid-v1',
        scenarioTitle: 'Reliable autocomplete',
        sourceContentId: 'realtime-search-debounce-cache',
        practiceSignal: 'needs-focus',
        frameworkLens: { title: 'React lens', prompt: 'Discuss ownership.' },
        summary: expect.objectContaining({
          priorities: expect.any(Array),
          lanes: expect.any(Array),
          connections: expect.any(Array),
          decisions: expect.any(Array),
          twistActions: expect.any(Array),
        }),
      }),
    }));
    expect(result.systemDesign.axes.map((axis) => axis.status)).toEqual([
      'strong-evidence',
      'strong-evidence',
      'strong-evidence',
      'strong-evidence',
      'needs-focus',
      'not-evaluated',
    ]);
    expect(result.systemDesign.timing).toEqual({
      usedSeconds: 480,
      allowedSeconds: 900,
    });
    expect(result.systemDesign.partialEvidence).toBe(true);
    expect(JSON.stringify(result)).not.toContain('weight');
    expect(JSON.stringify(result)).not.toContain('predicate');
    expect(JSON.stringify(result)).not.toContain('rule');
    expect(result.systemDesign.design.scratchpad).toBeUndefined();
  });
});
