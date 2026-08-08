'use strict';

const {
  cooldownForDetector,
  cooldownForPage,
  cooldownsForPage,
  eligibleTypesForCooldown,
  synthesizePageAssessment,
} = require('../services/seo/assessment');
const SeoPage = require('../models/SeoPage');

const changedPage = {
  pageKey: 'page-key',
  canonicalUrl: 'https://frontendatlas.com/angular/trivia/example',
  changeTracking: {
    materialChangedAt: new Date('2026-08-03T00:00:00.000Z'),
    lastGoogleCrawlAt: new Date('2026-08-04T08:09:35.000Z'),
    crawlConfirmationRequired: false,
  },
};

describe('SEO page assessment synthesis', () => {
  test.each([
    ['2026-08-04', 'observing', 0, '2026-09-04'],
    ['2026-08-18', 'directional', 14, '2026-09-04'],
    ['2026-09-01', 'eligible', 28, '2026-09-04'],
  ])('calculates crawl-aware clean windows through %s', (endDate, state, days, nextReviewDate) => {
    expect(cooldownForPage({ page: changedPage, endDate, finalizedLagDays: 3 })).toEqual(expect.objectContaining({
      state,
      cleanFinalizedDays: days,
      cleanWindowStartDate: '2026-08-05',
      decisionDataThrough: '2026-09-01',
      nextReviewDate,
    }));
  });

  test('awaits a crawl observed after the material change', () => {
    const cooldown = cooldownForPage({
      page: {
        ...changedPage,
        changeTracking: {
          ...changedPage.changeTracking,
          lastGoogleCrawlAt: new Date('2026-08-02T00:00:00.000Z'),
        },
      },
      endDate: '2026-08-20',
    });
    expect(cooldown.state).toBe('awaiting_recrawl');
    expect([...eligibleTypesForCooldown(cooldown)]).toEqual([]);
  });

  test('keeps legacy cooldown when a hydrated document materializes null detector keys', () => {
    const hydrated = SeoPage.hydrate({
      pageKey: 'hydrated-page',
      canonicalUrl: 'https://frontendatlas.com/hydrated-page',
      changeTracking: changedPage.changeTracking,
    }).toObject();
    expect(Object.keys(hydrated.changeTracking.detectors)).toHaveLength(6);
    expect(Object.values(hydrated.changeTracking.detectors).every((value) => value === null)).toBe(true);
    expect(cooldownForPage({ page: hydrated, endDate: '2026-08-18' })).toEqual(expect.objectContaining({
      state: 'directional', cleanFinalizedDays: 14,
    }));
  });

  test('keeps actionable performance evidence observational during cooldown', () => {
    const packet = synthesizePageAssessment({
      page: changedPage,
      endDate: '2026-08-18',
      cooldown: cooldownForPage({ page: changedPage, endDate: '2026-08-18' }),
      detectorAssessments: {
        content_decay: {
          state: 'actionable', reasonCodes: ['persistent_decay'], confidence: 0.8,
          evidence: { summary: 'Persistent decline.' },
          action: { type: 'content_decay', priorityScore: 5 },
        },
      },
    });
    expect(packet.primaryState).toBe('watch');
    expect(packet.selectedActionType).toBeNull();
  });

  test('uses strict post-production crawl confirmation and scopes cooldown by detector', () => {
    const productionEffectiveAt = new Date('2026-08-04T08:00:00.000Z');
    const page = {
      ...changedPage,
      changeTracking: {
        currentVersionKey: 'version-two',
        lastGoogleCrawlAt: productionEffectiveAt,
        detectors: {
          ctr_snippet: {
            versionKey: 'version-two',
            productionEffectiveAt,
            productionPrecision: 'exact',
            productionSource: 'manifest_ready_at',
            changedComponents: ['title'],
            crawlConfirmationRequired: true,
          },
        },
      },
    };
    const cooldowns = cooldownsForPage({ page, endDate: '2026-08-20' });
    expect(cooldowns.ctr_snippet).toEqual(expect.objectContaining({ state: 'awaiting_recrawl' }));
    expect(cooldowns.intent_mismatch).toEqual(expect.objectContaining({ state: 'eligible' }));
    expect(cooldowns.technical_indexing).toEqual(expect.objectContaining({ state: 'eligible' }));

    const after = cooldownForDetector({
      page: {
        ...page,
        changeTracking: {
          ...page.changeTracking,
          lastGoogleCrawlAt: new Date('2026-08-04T08:00:00.001Z'),
          detectors: {
            ctr_snippet: {
              ...page.changeTracking.detectors.ctr_snippet,
              crawlConfirmationRequired: false,
              confirmedCrawlAt: new Date('2026-08-04T08:00:00.001Z'),
            },
          },
        },
      },
      detector: 'ctr_snippet',
      endDate: '2026-08-20',
    });
    expect(after.state).toBe('directional');
  });
});
