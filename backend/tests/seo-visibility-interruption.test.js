'use strict';

const {
  assessVisibilityInterruption,
} = require('../services/seo/visibility-interruption');

const DAY_MS = 24 * 60 * 60 * 1000;

function dateKey(offset) {
  return new Date(Date.UTC(2026, 0, 1) + offset * DAY_MS).toISOString().slice(0, 10);
}

function completeDay(offset, pageImpressions, propertyImpressions = 1000) {
  return {
    date: dateKey(offset),
    pageImpressions,
    propertyImpressions,
    pagePartitionComplete: true,
    propertyPartitionComplete: true,
  };
}

function matureInterruptionDays() {
  return [
    // NgRx golden: 417 -> 179 page impressions while the property remains
    // active (and grows), followed by seventeen explicit complete zero days.
    ...Array.from({ length: 28 }, (_, index) => completeDay(index, index === 27 ? 12 : 15, 1000)),
    ...Array.from({ length: 11 }, (_, index) => completeDay(28 + index, index === 10 ? 19 : 16, 2000)),
    ...Array.from({ length: 17 }, (_, index) => completeDay(39 + index, 0, 2000)),
  ];
}

function inspectionSnapshot({ observedAt, status = 'PASS', crawlAt = '2026-02-20T12:00:00.000Z' }) {
  return {
    observedAt: new Date(observedAt),
    data: {
      pageVersionKey: 'version-current',
      indexStatus: status,
      robots: 'ALLOWED',
      canonicalVerdict: 'match',
      lastCrawlTime: crawlAt,
    },
  };
}

function interruptionRun({ previousVisibility = null, evaluatedAt, inspection = null }) {
  return assessVisibilityInterruption({
    days: matureInterruptionDays(),
    previousStart: dateKey(0),
    currentStart: dateKey(28),
    endDate: dateKey(55),
    currentVersionKey: 'version-current',
    productionEffectiveAt: new Date('2026-01-15T12:00:00.000Z'),
    previousInterruptionEvaluatedAt: previousVisibility?.evaluatedAt || null,
    previousVisibility,
    evaluatedAt: new Date(evaluatedAt),
    inspection,
  });
}

describe('visibility interruption detector', () => {
  test('flags the NgRx 417 -> 179 golden interruption while the property stays active', () => {
    const result = assessVisibilityInterruption({
      days: matureInterruptionDays(),
      previousStart: dateKey(0),
      currentStart: dateKey(28),
      endDate: dateKey(55),
    });

    expect(result).toEqual(expect.objectContaining({
      state: 'watch',
      disposition: 'investigate',
      interrupted: true,
      requiresInspection: true,
      reasonCodes: ['visibility_interruption', 'url_inspection_required'],
      nextReview: {
        mode: 'event',
        event: 'url_inspection',
        rationale: 'confirm_index_and_crawl_state',
      },
    }));
    expect(result.evidence).toEqual(expect.objectContaining({
      mature: true,
      zeroImpressionStreak: 17,
      trailingZeroImpressionStreak: 17,
      completePreviousDays: 28,
      completeCurrentDays: 28,
      previous: expect.objectContaining({ pageImpressions: 417 }),
      current: expect.objectContaining({ pageImpressions: 179 }),
    }));
    expect(result.evidence.shareDrop).toBeGreaterThan(0.7);
  });

  test('never turns a missing or truncated NgRx partition into a zero-impression day', () => {
    const days = matureInterruptionDays();
    days[45] = { ...days[45], pagePartitionComplete: false };
    const result = assessVisibilityInterruption({
      days,
      previousStart: dateKey(0),
      currentStart: dateKey(28),
      endDate: dateKey(55),
    });

    expect(result).toEqual(expect.objectContaining({
      state: 'not_evaluable',
      interrupted: false,
      reasonCodes: ['visibility_partitions_incomplete'],
    }));
    expect(result.evidence.completeCurrentDays).toBe(27);
  });

  test('keeps newly visible or low-history pages out of classic interruption logic', () => {
    const days = [
      ...Array.from({ length: 28 }, (_, index) => completeDay(index, 0)),
      ...Array.from({ length: 28 }, (_, index) => completeDay(28 + index, index < 3 ? 10 : 0)),
    ];
    const result = assessVisibilityInterruption({
      days,
      previousStart: dateKey(0),
      currentStart: dateKey(28),
      endDate: dateKey(55),
    });

    expect(result).toEqual(expect.objectContaining({
      state: 'not_evaluable',
      interrupted: false,
      reasonCodes: ['new_or_ramping_page'],
    }));
  });

  test('moves a current-version PASS into a post-crawl monitor window', () => {
    const result = assessVisibilityInterruption({
      days: matureInterruptionDays(),
      previousStart: dateKey(0),
      currentStart: dateKey(28),
      endDate: dateKey(55),
      currentVersionKey: 'version-current',
      productionEffectiveAt: new Date('2026-01-15T12:00:00.000Z'),
      previousInterruptionEvaluatedAt: new Date('2026-02-26T12:00:00.000Z'),
      inspection: {
        observedAt: new Date('2026-02-27T12:00:00.000Z'),
        data: {
          pageVersionKey: 'version-current',
          indexStatus: 'PASS',
          robots: 'ALLOWED',
          canonicalVerdict: 'match',
          lastCrawlTime: '2026-02-20T12:00:00.000Z',
        },
      },
    });

    expect(result).toEqual(expect.objectContaining({
      state: 'watch',
      disposition: 'monitor',
      interrupted: true,
      requiresInspection: false,
      decisionGate: 'post_inspection_14_finalized_days',
      reasonCodes: [
        'visibility_interruption',
        'visibility_inspection_passed',
        'post_inspection_14_finalized_days',
      ],
      nextReview: {
        mode: 'event',
        event: '14_finalized_days',
        rationale: 'observe_initial_post_inspection_recovery_window',
      },
    }));
    expect(result.evidence).toEqual(expect.objectContaining({
      inspectionCurrent: true,
      inspectionPass: true,
      cleanWindowStartDate: '2026-02-21',
      cleanFinalizedDays: 5,
    }));
  });

  test('requires diagnosis instead of opening an action when interruption persists after 28 clean days', () => {
    const result = assessVisibilityInterruption({
      days: matureInterruptionDays(),
      previousStart: dateKey(0),
      currentStart: dateKey(28),
      endDate: dateKey(55),
      currentVersionKey: 'version-current',
      productionEffectiveAt: new Date('2025-12-01T12:00:00.000Z'),
      previousInterruptionEvaluatedAt: new Date('2026-02-26T12:00:00.000Z'),
      inspection: {
        observedAt: new Date('2026-02-27T12:00:00.000Z'),
        data: {
          pageVersionKey: 'version-current',
          indexStatus: 'PASS',
          robots: 'ALLOWED',
          canonicalVerdict: 'match',
          lastCrawlTime: '2026-01-20T12:00:00.000Z',
        },
      },
    });

    expect(result).toEqual(expect.objectContaining({
      state: 'watch',
      disposition: 'investigate',
      interrupted: true,
      requiresInspection: false,
      decisionGate: 'visibility_interruption_requires_diagnosis',
      nextReview: {
        mode: 'event',
        event: 'next_finalized_sync',
        rationale: 'diagnose_persistent_visibility_interruption',
      },
    }));
    expect(result.evidence.cleanFinalizedDays).toBeGreaterThanOrEqual(28);
    expect(result).not.toHaveProperty('action');
  });

  test('rejects a stale PASS captured before the interruption packet', () => {
    const result = assessVisibilityInterruption({
      days: matureInterruptionDays(),
      previousStart: dateKey(0),
      currentStart: dateKey(28),
      endDate: dateKey(55),
      currentVersionKey: 'version-current',
      productionEffectiveAt: new Date('2026-01-15T12:00:00.000Z'),
      previousInterruptionEvaluatedAt: new Date('2026-02-26T12:00:00.000Z'),
      inspection: {
        observedAt: new Date('2026-02-25T12:00:00.000Z'),
        data: {
          pageVersionKey: 'version-current',
          indexStatus: 'PASS',
          robots: 'ALLOWED',
          canonicalVerdict: 'match',
          lastCrawlTime: '2026-02-20T12:00:00.000Z',
        },
      },
    });

    expect(result).toEqual(expect.objectContaining({
      state: 'watch',
      disposition: 'investigate',
      requiresInspection: true,
      reasonCodes: ['visibility_interruption', 'url_inspection_required'],
      nextReview: expect.objectContaining({ event: 'url_inspection' }),
    }));
    expect(result.evidence).not.toHaveProperty('inspectionCurrent');
  });

  test('requires a fresh inspection after the first interruption packet even for an exact-version PASS', () => {
    const result = assessVisibilityInterruption({
      days: matureInterruptionDays(),
      previousStart: dateKey(0),
      currentStart: dateKey(28),
      endDate: dateKey(55),
      currentVersionKey: 'version-current',
      productionEffectiveAt: new Date('2026-01-15T12:00:00.000Z'),
      inspection: {
        observedAt: new Date('2026-02-25T12:00:00.000Z'),
        data: {
          pageVersionKey: 'version-current',
          indexStatus: 'PASS',
          robots: 'ALLOWED',
          canonicalVerdict: 'match',
          lastCrawlTime: '2026-02-20T12:00:00.000Z',
        },
      },
    });

    expect(result).toEqual(expect.objectContaining({
      state: 'watch',
      disposition: 'investigate',
      interrupted: true,
      requiresInspection: true,
      reasonCodes: ['visibility_interruption', 'url_inspection_required'],
      nextReview: expect.objectContaining({ event: 'url_inspection' }),
    }));
    expect(result.evidence).not.toHaveProperty('inspectionCurrent');
  });

  test('keeps a current but inconclusive inspection unverified', () => {
    const result = assessVisibilityInterruption({
      days: matureInterruptionDays(),
      previousStart: dateKey(0),
      currentStart: dateKey(28),
      endDate: dateKey(55),
      currentVersionKey: 'version-current',
      previousInterruptionEvaluatedAt: new Date('2026-02-26T12:00:00.000Z'),
      inspection: {
        observedAt: new Date('2026-02-27T12:00:00.000Z'),
        data: {
          pageVersionKey: 'version-current',
          indexStatus: 'NEUTRAL',
          robots: 'UNKNOWN',
          canonicalVerdict: 'unavailable',
        },
      },
    });

    expect(result).toEqual(expect.objectContaining({
      disposition: 'investigate',
      requiresInspection: true,
      reasonCodes: ['visibility_interruption', 'url_inspection_required'],
      nextReview: expect.objectContaining({ event: 'url_inspection' }),
    }));
    expect(result.evidence).not.toHaveProperty('inspectionCurrent');
  });

  test('routes a fresh current-version FAIL to technical investigation without re-requesting inspection', () => {
    const result = assessVisibilityInterruption({
      days: matureInterruptionDays(),
      previousStart: dateKey(0),
      currentStart: dateKey(28),
      endDate: dateKey(55),
      currentVersionKey: 'version-current',
      productionEffectiveAt: new Date('2026-01-15T12:00:00.000Z'),
      previousInterruptionEvaluatedAt: new Date('2026-02-26T12:00:00.000Z'),
      inspection: {
        observedAt: new Date('2026-02-27T12:00:00.000Z'),
        data: {
          pageVersionKey: 'version-current',
          indexStatus: 'FAIL',
          robots: 'ALLOWED',
          canonicalVerdict: 'match',
          lastCrawlTime: '2026-02-24T12:00:00.000Z',
        },
      },
    });

    expect(result).toEqual(expect.objectContaining({
      state: 'watch',
      disposition: 'investigate',
      interrupted: true,
      requiresInspection: false,
      decisionGate: 'technical_indexing_anomaly',
      reasonCodes: ['visibility_interruption', 'visibility_inspection_anomaly'],
      nextReview: {
        mode: 'event',
        event: 'post_deploy_crawl',
        rationale: 'resolve_inspection_anomaly_then_confirm_crawl',
      },
    }));
    expect(result.evidence).toEqual(expect.objectContaining({
      inspectionCurrent: true,
      inspectionPass: false,
    }));
  });

  test('keeps an accepted PASS stable across a third analysis without requesting another inspection', () => {
    const stale = inspectionSnapshot({ observedAt: '2026-02-25T12:00:00.000Z' });
    const first = interruptionRun({
      evaluatedAt: '2026-02-26T12:00:00.000Z',
      inspection: stale,
    });
    expect(first).toEqual(expect.objectContaining({
      disposition: 'investigate',
      requiresInspection: true,
    }));

    const fresh = inspectionSnapshot({ observedAt: '2026-02-27T12:00:00.000Z' });
    const second = interruptionRun({
      previousVisibility: { ...first, evaluatedAt: new Date('2026-02-26T12:00:00.000Z') },
      evaluatedAt: '2026-02-27T13:00:00.000Z',
      inspection: fresh,
    });
    expect(second).toEqual(expect.objectContaining({
      disposition: 'monitor',
      requiresInspection: false,
      inspectionLifecycle: expect.objectContaining({
        requestBoundaryAt: new Date('2026-02-26T12:00:00.000Z'),
        accepted: expect.objectContaining({
          observedAt: new Date('2026-02-27T12:00:00.000Z'),
          verdict: 'pass',
        }),
      }),
    }));

    const third = interruptionRun({
      previousVisibility: { ...second, evaluatedAt: new Date('2026-02-27T13:00:00.000Z') },
      evaluatedAt: '2026-02-28T13:00:00.000Z',
      // The diagnostic TTL query may no longer return the accepted snapshot;
      // the persisted identity must keep the packet stable.
      inspection: null,
    });
    expect(third).toEqual(expect.objectContaining({
      disposition: 'monitor',
      requiresInspection: false,
      decisionGate: 'post_inspection_14_finalized_days',
      inspectionLifecycle: second.inspectionLifecycle,
    }));
    expect(third.evidence).toEqual(expect.objectContaining({
      inspectionCurrent: true,
      inspectionPass: true,
    }));
  });

  test('keeps an accepted FAIL stable and lets a newer PASS supersede it', () => {
    const first = interruptionRun({
      evaluatedAt: '2026-02-26T12:00:00.000Z',
      inspection: inspectionSnapshot({ observedAt: '2026-02-25T12:00:00.000Z', status: 'FAIL' }),
    });
    const fail = inspectionSnapshot({
      observedAt: '2026-02-27T12:00:00.000Z',
      status: 'FAIL',
      crawlAt: '2026-02-24T12:00:00.000Z',
    });
    const second = interruptionRun({
      previousVisibility: { ...first, evaluatedAt: new Date('2026-02-26T12:00:00.000Z') },
      evaluatedAt: '2026-02-27T13:00:00.000Z',
      inspection: fail,
    });
    expect(second).toEqual(expect.objectContaining({
      disposition: 'investigate',
      requiresInspection: false,
      decisionGate: 'technical_indexing_anomaly',
      inspectionLifecycle: expect.objectContaining({
        accepted: expect.objectContaining({ verdict: 'anomaly' }),
      }),
    }));

    const third = interruptionRun({
      previousVisibility: { ...second, evaluatedAt: new Date('2026-02-27T13:00:00.000Z') },
      evaluatedAt: '2026-02-28T13:00:00.000Z',
      // A newer inconclusive snapshot cannot erase an accepted definitive FAIL.
      inspection: inspectionSnapshot({
        observedAt: '2026-02-28T12:00:00.000Z',
        status: 'NEUTRAL',
        crawlAt: '2026-02-27T12:00:00.000Z',
      }),
    });
    expect(third).toEqual(expect.objectContaining({
      disposition: 'investigate',
      requiresInspection: false,
      decisionGate: 'technical_indexing_anomaly',
      inspectionLifecycle: second.inspectionLifecycle,
    }));
    expect(third.evidence).toEqual(expect.objectContaining({
      inspectionCurrent: true,
      inspectionPass: false,
    }));

    const newerPass = inspectionSnapshot({
      observedAt: '2026-03-01T12:00:00.000Z',
      status: 'PASS',
      crawlAt: '2026-02-28T12:00:00.000Z',
    });
    const fourth = interruptionRun({
      previousVisibility: { ...third, evaluatedAt: new Date('2026-02-28T13:00:00.000Z') },
      evaluatedAt: '2026-03-01T13:00:00.000Z',
      inspection: newerPass,
    });
    expect(fourth).toEqual(expect.objectContaining({
      disposition: 'monitor',
      requiresInspection: false,
      inspectionLifecycle: expect.objectContaining({
        accepted: expect.objectContaining({
          observedAt: new Date('2026-03-01T12:00:00.000Z'),
          verdict: 'pass',
        }),
      }),
    }));
  });
});
