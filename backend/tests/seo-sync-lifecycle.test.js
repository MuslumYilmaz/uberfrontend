'use strict';

const {
  analysisRefreshState,
  analysisSummary,
  persistAnalysisLifecycle,
} = require('../services/seo/sync');
const {
  analysisCompletionState,
  migrationClearTypes,
} = require('../services/seo/analysis');

describe('balanced-v2 sync analysis lifecycle', () => {
  test('prioritizes analysis only for a ready window with missing or stale current assessments', async () => {
    const common = {
      siteUrl: 'sc-domain:frontendatlas.com',
      endDate: '2026-08-04',
      loadTotalPages: async () => 435,
      loadAssessmentCount: async () => 435,
    };

    await expect(analysisRefreshState({
      ...common,
      loadReadiness: async () => ({ completedDays: 55, requiredDays: 56 }),
      loadLatestRun: async () => null,
    })).resolves.toEqual(expect.objectContaining({
      prioritize: false,
      reason: 'analysis_window_not_ready',
    }));

    await expect(analysisRefreshState({
      ...common,
      loadReadiness: async () => ({ completedDays: 56, requiredDays: 56 }),
      loadLatestRun: async () => null,
    })).resolves.toEqual(expect.objectContaining({
      prioritize: true,
      reason: 'current_analysis_missing',
    }));

    await expect(analysisRefreshState({
      ...common,
      loadReadiness: async () => ({ completedDays: 56, requiredDays: 56 }),
      loadLatestRun: async () => ({ analysis: { status: 'failed', ruleVersion: 'balanced-v2.1' } }),
    })).resolves.toEqual(expect.objectContaining({
      prioritize: true,
      reason: 'current_analysis_missing',
    }));

    await expect(analysisRefreshState({
      ...common,
      loadReadiness: async () => ({ completedDays: 56, requiredDays: 56 }),
      loadLatestRun: async () => ({
        analysis: {
          status: 'complete',
          ruleVersion: 'balanced-v2.1',
          endDate: '2026-08-04',
          evaluatedPages: 435,
          totalPages: 435,
        },
      }),
      loadAssessmentCount: async () => 434,
    })).resolves.toEqual(expect.objectContaining({
      prioritize: true,
      reason: 'current_assessments_stale',
      assessmentPages: 434,
    }));

    await expect(analysisRefreshState({
      ...common,
      loadReadiness: async () => ({ completedDays: 56, requiredDays: 56 }),
      loadLatestRun: async () => ({
        analysis: {
          status: 'complete',
          ruleVersion: 'balanced-v2.1',
          endDate: '2026-08-04',
          evaluatedPages: 435,
          totalPages: 435,
        },
      }),
    })).resolves.toEqual(expect.objectContaining({
      prioritize: false,
      reason: 'current_analysis_complete',
      assessmentPages: 435,
    }));
  });

  test('does not report complete until actions, reconciliation, and assessment persistence finish', () => {
    expect(analysisCompletionState({
      evaluatedPages: 435,
      totalPages: 435,
      actionUpsertComplete: false,
      reconciliationComplete: true,
      assessmentWriteComplete: true,
    })).toEqual({ status: 'partial', reason: 'analysis_deadline' });
    expect(analysisCompletionState({
      evaluatedPages: 435,
      totalPages: 435,
      actionUpsertComplete: true,
      reconciliationComplete: false,
      assessmentWriteComplete: true,
    })).toEqual({ status: 'partial', reason: 'analysis_deadline' });
    expect(analysisCompletionState({
      evaluatedPages: 435,
      totalPages: 435,
      actionUpsertComplete: true,
      reconciliationComplete: true,
      assessmentWriteComplete: false,
    })).toEqual({ status: 'partial', reason: 'analysis_deadline' });
    expect(analysisCompletionState({
      evaluatedPages: 435,
      totalPages: 435,
      actionUpsertComplete: true,
      reconciliationComplete: true,
      assessmentWriteComplete: true,
    })).toEqual({ status: 'complete', reason: 'analysis_complete' });
  });

  test('only lets definitive clear v2 evidence close legacy detector proposals', () => {
    const detectors = [
      { type: 'content_decay', state: 'watch' },
      { type: 'ctr_snippet', state: 'clear' },
      { type: 'intent_mismatch', state: 'clear' },
      { type: 'technical_indexing', state: 'clear' },
    ];

    expect([...migrationClearTypes(detectors, { state: 'eligible' }, false)].sort())
      .toEqual(['ctr_snippet', 'technical_indexing']);
    expect([...migrationClearTypes(detectors, { state: 'eligible' }, true)].sort())
      .toEqual(['ctr_snippet', 'intent_mismatch', 'technical_indexing']);
    expect([...migrationClearTypes(detectors, { state: 'observing' }, true)])
      .toEqual([]);
  });

  test('persists a complete normalized analysis summary', () => {
    const startedAt = new Date('2026-08-07T10:00:00.000Z');
    const completedAt = new Date('2026-08-07T10:01:00.000Z');
    expect(analysisSummary({
      result: {
        evaluatedPages: 2,
        committedAssessmentPages: 2,
        eligiblePages: 1,
        proposed: 1,
        cleared: 2,
        cooldown: { awaitingRecrawl: 1, eligible: 1 },
        dataQualityBlockedPages: 1,
        decisionBlockedPages: 1,
      },
      endDate: '2026-08-04',
      readiness: { completedDays: 56, requiredDays: 56 },
      totalPages: 2,
      startedAt,
      completedAt,
    })).toEqual({
      status: 'complete',
      reason: '',
      ruleVersion: 'balanced-v2.1',
      endDate: '2026-08-04',
      windowDays: 28,
      completedDays: 56,
      requiredDays: 56,
      evaluatedPages: 2,
      committedAssessmentPages: 2,
      totalPages: 2,
      eligiblePages: 1,
      proposedActions: 1,
      clearedActions: 2,
      cooldown: { awaitingRecrawl: 1, observing: 0, directional: 0, eligible: 1 },
      dataQualityBlockedPages: 1,
      decisionBlockedPages: 1,
      startedAt,
      completedAt,
    });
  });

  test('contains analysis exceptions without downgrading the committed metric run', async () => {
    const saves = [];
    const run = {
      status: 'complete',
      analysis: null,
      save: jest.fn(async function save() {
        saves.push(JSON.parse(JSON.stringify(this.analysis)));
        return this;
      }),
    };
    const now = new Date('2026-08-07T10:00:00.000Z');
    const result = await persistAnalysisLifecycle({
      run,
      siteUrl: 'sc-domain:frontendatlas.com',
      endDate: '2026-08-04',
      deadlineMs: now.getTime() + 30_000,
      loadReadiness: async () => ({ completedDays: 56, requiredDays: 56 }),
      loadTotalPages: async () => 435,
      analyze: async () => { throw new Error('private detector payload'); },
      now: () => now,
    });

    expect(saves[0]).toEqual(expect.objectContaining({ status: 'running', totalPages: 435 }));
    expect(result).toEqual(expect.objectContaining({
      status: 'failed',
      reason: 'analysis_failed',
      completedDays: 56,
      totalPages: 435,
    }));
    expect(run.status).toBe('complete');
    expect(JSON.stringify(result)).not.toContain('private detector payload');
  });
});
