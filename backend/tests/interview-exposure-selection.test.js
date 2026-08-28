'use strict';

const {
  EXPOSURE_RETENTION_DAYS,
  buildExposurePayload,
  buildSelectionContextFromExposures,
  selectionOverlapTelemetry,
} = require('../services/interview/exposure');

function exposure(index, overrides = {}) {
  return {
    sessionId: `session-${index}`,
    exposedAt: new Date(`2026-08-${String(20 - index).padStart(2, '0')}T00:00:00.000Z`),
    mcq: [{
      id: `question-${index}`,
      revision: 1,
      contentHash: `question-hash-${index}`,
      conceptId: `question-concept-${index}`,
    }],
    coding: {
      id: `coding-${index}`,
      conceptId: `coding-concept-${index}`,
      sourceContentId: `source-${index}`,
      contentHash: `coding-hash-${index}`,
    },
    systemDesign: null,
    ...overrides,
  };
}

describe('interview exposure selection policy', () => {
  test('hard-excludes all target identities for mocks two through five', () => {
    const history = [exposure(3), exposure(2), exposure(1)];
    const context = buildSelectionContextFromExposures({
      format: 'coding',
      targetHistory: history,
      userCodingHistory: history,
    });

    expect(context.targetExposureCount).toBe(3);
    expect(context.mcq.excludedIds).toEqual(new Set([
      'question-3', 'question-2', 'question-1',
    ]));
    expect(context.coding.excludedConceptIds).toEqual(new Set([
      'coding-concept-3', 'coding-concept-2', 'coding-concept-1',
    ]));
  });

  test('after five target exposures keeps adjacent overlap at zero and excludes last cross-track concept', () => {
    const history = [5, 4, 3, 2, 1].map(exposure);
    const crossTrack = exposure(9, {
      coding: {
        id: 'angular-pagination-v2',
        conceptId: 'pagination-state-machine',
        sourceContentId: 'angular-pagination',
        contentHash: 'cross-track-hash',
      },
    });
    const context = buildSelectionContextFromExposures({
      format: 'coding',
      targetHistory: history,
      userCodingHistory: [crossTrack],
    });

    expect(context.mcq.excludedIds).toEqual(new Set(['question-5']));
    expect(context.coding.excludedIds).toEqual(new Set([
      'coding-5', 'angular-pagination-v2',
    ]));
    expect(context.coding.excludedConceptIds).toContain('pagination-state-machine');
    expect(context.mcq.seenIds.get('question-1').count).toBe(1);
  });

  test('builds an identity-only record retained for 365 days', () => {
    const payload = buildExposurePayload({
      userId: '507f1f77bcf86cd799439011',
      sessionId: '507f191e810c19729de860ea',
      format: 'coding',
      track: 'react',
      level: 'mid',
      selectedQuestions: [{
        id: 'q-1', revision: 2, contentHash: 'q-hash', conceptId: 'event-loop-order',
      }],
      selectedCoding: {
        id: 'coding-1', conceptId: 'abortable-search', sourceQuestionId: 'search-source',
        contentHash: 'coding-hash',
      },
      artifacts: {
        bank: { id: 'bank', version: '1.2.0', contentHash: 'bank-hash' },
        coding: { id: 'coding', version: '2.0.0', contentHash: 'registry-hash' },
      },
      now: new Date('2026-08-24T00:00:00.000Z'),
    });

    expect(payload.expiresAt.toISOString()).toBe('2027-08-24T00:00:00.000Z');
    expect(EXPOSURE_RETENTION_DAYS).toBe(365);
    expect(JSON.stringify(payload)).not.toMatch(/prompt|answer|draft|resultSnapshot/i);
    expect(payload.coding.conceptId).toBe('abortable-search');
  });

  test('reports literal and semantic adjacent overlap without identifiers', () => {
    const previous = exposure(1, {
      mcq: [
        { id: 'same-id', conceptId: 'same-concept' },
        { id: 'old-id', conceptId: 'shared-concept' },
      ],
      coding: {
        id: 'react-pagination',
        conceptId: 'coding-ui-pagination',
      },
    });
    const context = buildSelectionContextFromExposures({
      format: 'coding',
      targetHistory: [previous],
      userCodingHistory: [previous],
    });
    const telemetry = selectionOverlapTelemetry({
      format: 'coding',
      context,
      selectedQuestions: [
        { id: 'same-id', conceptId: 'same-concept' },
        { id: 'new-id', conceptId: 'shared-concept' },
      ],
      selectedCoding: {
        id: 'angular-pagination',
        conceptId: 'coding-ui-pagination',
      },
    });

    expect(telemetry).toEqual({
      count: 3,
      literalOverlap: 1,
      semanticOverlap: 3,
      selectionPolicyVersion: 2,
      targetExposureCount: 1,
      protectedWindow: true,
    });
    expect(JSON.stringify(telemetry)).not.toMatch(/same-id|pagination/);
  });
});
