'use strict';

const SeoAction = require('../models/SeoAction');
const SeoOpportunityReview = require('../models/SeoOpportunityReview');
const SeoMetricPartition = require('../models/SeoMetricPartition');
const SeoPage = require('../models/SeoPage');
const SeoPageAssessment = require('../models/SeoPageAssessment');
const SeoQueryPageDailyMetric = require('../models/SeoQueryPageDailyMetric');
const SeoSyncRun = require('../models/SeoSyncRun');
const {
  sanitizeExpectedImpact,
  sanitizeNextReview,
} = require('../services/seo/actions');
const {
  getQueryOpportunityExamples,
  listOpportunities,
  promoteOpportunity,
  promotionFailure,
  putSerpReview,
  reviewsForAssessment,
  serializeOpportunity,
  serializeReview,
  upsertPromotedAction,
  validateReviewInput,
} = require('../services/seo/opportunity-api');

const HASH_A = 'a'.repeat(64);
const HASH_B = 'b'.repeat(64);
const HASH_C = 'c'.repeat(64);
const ASSESSMENT_EVALUATED_AT = new Date('2026-08-10T10:00:00.000Z');

function opportunity(overrides = {}) {
  return {
    key: HASH_A,
    clusterKey: HASH_B,
    safeLabel: 'React · direct answer',
    classification: 'snippet_gap',
    state: 'watch',
    disposition: 'investigate',
    patternConfidence: 0.93,
    causeConfidence: 0.81,
    current: { clicks: 0, impressions: 1000, ctr: 0, position: 5.5 },
    previous: { clicks: 2, impressions: 900, ctr: 2 / 900, position: 5.4 },
    coverage: { query: 0.8, semantic: 0.95, device: 0.75 },
    persistence: { stableWeeks: 3, requiredWeeks: 3, totalWeeks: 4 },
    recommendedSurface: 'serp_review',
    blockers: ['serp_review_required'],
    reviewReady: true,
    expectedImpact: {
      metric: 'clicks', low: 2, point: 4, high: 7, windowDays: 28, quality: 'modeled',
    },
    nextReview: { mode: 'event', event: 'serp_review', rationale: 'owner_review_required' },
    ...overrides,
  };
}

describe('balanced-v2.2 opportunity API safety contracts', () => {
  beforeEach(() => {
    jest.spyOn(SeoPage, 'countDocuments').mockResolvedValue(435);
    jest.spyOn(SeoPageAssessment, 'aggregate').mockResolvedValue([{ count: 435 }]);
  });

  afterEach(() => jest.restoreAllMocks());

  test('serializes only safe cluster evidence and never leaks raw query members', () => {
    const secret = 'exact secret raw query';
    const serialized = serializeOpportunity({
      ...opportunity(),
      query: secret,
      rawQuery: secret,
      memberQueryKeys: [HASH_C],
      memberQueries: [secret],
      competitorHtml: `<main>${secret}</main>`,
      arbitrary: { queryText: secret },
    });

    expect(serialized).toEqual(expect.objectContaining({
      key: HASH_A,
      clusterKey: HASH_B,
      safeLabel: 'React · direct answer',
      classification: 'snippet_gap',
      reviewReady: true,
    }));
    expect(JSON.stringify(serialized)).not.toContain(secret);
    expect(serialized).not.toHaveProperty('memberQueryKeys');
    expect(serialized).not.toHaveProperty('memberQueries');
  });

  test('keeps unknown impact nullable instead of turning it into zero', () => {
    expect(sanitizeExpectedImpact({
      metric: 'clicks', low: null, point: null, high: null, quality: 'not_estimated',
    })).toEqual({
      metric: 'clicks', low: null, point: null, high: null,
      windowDays: 28, quality: 'not_estimated',
    });
    expect(sanitizeExpectedImpact({
      metric: 'clicks', low: 5, point: 4, high: 9, quality: 'modeled',
    })).toEqual(expect.objectContaining({
      low: null, point: null, high: null, quality: 'not_estimated',
    }));
  });

  test('rejects arbitrary SERP review text and serializes only a structured reason', () => {
    expect(() => validateReviewInput({
      locale: 'en-US',
      device: 'desktop',
      dominantResultType: 'publisher',
      ownResultStatus: 'present_weak',
      outcome: 'snippet_test',
      serpFeatures: ['none'],
      notes: '<a href="https://competitor.example?q=raw-query">copied result</a>',
    }, new Date('2026-08-10T12:00:00.000Z'))).toThrow(expect.objectContaining({
      code: 'SEO_SERP_REVIEW_FREE_TEXT_REJECTED',
    }));

    const validated = validateReviewInput({
      locale: 'en-US',
      device: 'desktop',
      dominantResultType: 'publisher',
      ownResultStatus: 'present_weak',
      outcome: 'snippet_test',
      serpFeatures: ['none'],
      reasonCode: 'snippet_not_specific',
    }, new Date('2026-08-10T12:00:00.000Z'));
    expect(validated.reasonCode).toBe('snippet_not_specific');
    const serialized = serializeReview({
      ...validated,
      notes: 'legacy raw query must not be returned',
      expiresAt: new Date('2027-01-01T00:00:00.000Z'),
    });
    expect(serialized.reasonCode).toBe('snippet_not_specific');
    expect(serialized).not.toHaveProperty('notes');
    expect(JSON.stringify(serialized)).not.toContain('legacy raw query');
  });

  test('accepts only the typed date-or-event next-review contract', () => {
    expect(sanitizeNextReview({
      mode: 'date',
      at: '2026-09-04T00:00:00.000Z',
      rationale: 'post crawl measurement',
      rawQuery: 'must not persist',
    })).toEqual({
      mode: 'date',
      at: '2026-09-04T00:00:00.000Z',
      rationale: 'post crawl measurement',
    });
    expect(sanitizeNextReview({
      mode: 'date', at: '2026-09-04T00:00:00.000Z', event: '28_finalized_days',
    })).toBeNull();
    expect(sanitizeNextReview({
      mode: 'event', event: 'serp_review', at: '2026-09-04T00:00:00.000Z',
    })).toBeNull();
    expect(sanitizeNextReview({ mode: 'event', event: 'not-allowlisted', at: null })).toBeNull();
    expect(sanitizeNextReview({ mode: 'date', event: 'serp_review' })).toBeNull();
  });

  test('rejects raw examples when a newer finalized partition makes the assessment stale', async () => {
    const assessment = {
      siteUrl: 'sc-domain:frontendatlas.com', pageKey: HASH_C, inputHash: HASH_B,
      pageVersionKey: HASH_A, endDate: '2026-08-06', ruleVersion: 'balanced-v2.2',
      evaluatedAt: ASSESSMENT_EVALUATED_AT,
      queryOpportunities: [opportunity()],
    };
    jest.spyOn(SeoPageAssessment, 'findOne').mockReturnValue({
      lean: jest.fn().mockResolvedValue(assessment),
    });
    jest.spyOn(SeoMetricPartition, 'findOne').mockReturnValue({
      sort: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({ date: '2026-08-07' }),
    });
    jest.spyOn(SeoSyncRun, 'findOne').mockReturnValue({
      sort: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({ analysis: {
        totalPages: 435, evaluatedPages: 435, committedAssessmentPages: 435,
      } }),
    });
    jest.spyOn(SeoPage, 'findOne').mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        pageKey: HASH_C,
        changeTracking: { analysisInputHash: HASH_B, currentVersionKey: HASH_A },
      }),
    });
    const aggregate = jest.spyOn(SeoQueryPageDailyMetric, 'aggregate');

    await expect(getQueryOpportunityExamples({
      config: { siteUrl: 'sc-domain:frontendatlas.com' },
      pageKey: HASH_C,
      opportunityKey: HASH_A,
      assessmentInputHash: HASH_B,
    })).rejects.toEqual(expect.objectContaining({
      status: 409,
      code: 'SEO_OPPORTUNITY_STALE_ASSESSMENT',
    }));
    expect(aggregate).not.toHaveBeenCalled();
  });

  test('rejects raw examples when any query partition in the 56-day window is missing or truncated', async () => {
    const assessment = {
      siteUrl: 'sc-domain:frontendatlas.com', pageKey: HASH_C, inputHash: HASH_B,
      pageVersionKey: HASH_A, endDate: '2026-08-06', ruleVersion: 'balanced-v2.2',
      metrics: { current: { impressions: 1000 }, previous: { impressions: 900 } },
      queryOpportunities: [opportunity()],
    };
    jest.spyOn(SeoPageAssessment, 'findOne').mockReturnValue({
      lean: jest.fn().mockResolvedValue(assessment),
    });
    jest.spyOn(SeoMetricPartition, 'findOne').mockReturnValue({
      sort: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({ date: '2026-08-06' }),
    });
    jest.spyOn(SeoMetricPartition, 'distinct').mockResolvedValue([]);
    jest.spyOn(SeoSyncRun, 'findOne').mockReturnValue({
      sort: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({ analysis: {
        totalPages: 435, evaluatedPages: 435, committedAssessmentPages: 435,
      } }),
    });
    jest.spyOn(SeoPage, 'findOne').mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        pageKey: HASH_C, title: 'React example', tech: 'react',
        changeTracking: { analysisInputHash: HASH_B, currentVersionKey: HASH_A },
      }),
    });
    const aggregate = jest.spyOn(SeoQueryPageDailyMetric, 'aggregate');

    await expect(getQueryOpportunityExamples({
      config: { siteUrl: 'sc-domain:frontendatlas.com' },
      pageKey: HASH_C,
      opportunityKey: HASH_A,
      assessmentInputHash: HASH_B,
    })).rejects.toEqual(expect.objectContaining({
      status: 409,
      code: 'SEO_OPPORTUNITY_QUERY_EVIDENCE_NOT_READY',
    }));
    expect(SeoMetricPartition.distinct).toHaveBeenCalledWith('date', expect.objectContaining({
      slice: 'queryPage', status: 'complete', truncated: false,
    }));
    expect(aggregate).not.toHaveBeenCalled();
  });

  test('rejects a SERP review when the assessment is no longer the current complete analysis', async () => {
    const assessment = {
      siteUrl: 'sc-domain:frontendatlas.com', pageKey: HASH_C, inputHash: HASH_B,
      pageVersionKey: HASH_A, endDate: '2026-08-06', ruleVersion: 'balanced-v2.2',
      evaluatedAt: ASSESSMENT_EVALUATED_AT,
      queryOpportunities: [opportunity()],
    };
    jest.spyOn(SeoPageAssessment, 'findOne').mockReturnValue({
      lean: jest.fn().mockResolvedValue(assessment),
    });
    jest.spyOn(SeoMetricPartition, 'findOne').mockReturnValue({
      sort: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({ date: '2026-08-07' }),
    });
    jest.spyOn(SeoSyncRun, 'findOne').mockReturnValue({
      sort: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(null),
    });
    jest.spyOn(SeoPage, 'findOne').mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        pageKey: HASH_C,
        changeTracking: { analysisInputHash: HASH_B, currentVersionKey: HASH_A },
      }),
    });
    const upsert = jest.spyOn(SeoOpportunityReview, 'findOneAndUpdate');

    await expect(putSerpReview({
      config: { siteUrl: 'sc-domain:frontendatlas.com' },
      pageKey: HASH_C,
      opportunityKey: HASH_A,
      assessmentInputHash: HASH_B,
      actorUserId: null,
      input: {
        locale: 'en-US', device: 'desktop', dominantResultType: 'publisher',
        ownResultStatus: 'present_weak', outcome: 'snippet_test', serpFeatures: ['none'],
      },
    })).rejects.toEqual(expect.objectContaining({
      status: 409,
      code: 'SEO_OPPORTUNITY_STALE_ASSESSMENT',
    }));
    expect(upsert).not.toHaveBeenCalled();
  });

  test('rejects a SERP review when the manifest changed after the last complete analysis', async () => {
    const assessment = {
      siteUrl: 'sc-domain:frontendatlas.com', pageKey: HASH_C, inputHash: HASH_B,
      pageVersionKey: HASH_A, endDate: '2026-08-06', ruleVersion: 'balanced-v2.2',
      evaluatedAt: new Date('2026-06-01T00:00:00.000Z'),
      queryOpportunities: [opportunity()],
    };
    jest.spyOn(SeoPageAssessment, 'findOne').mockReturnValue({
      lean: jest.fn().mockResolvedValue(assessment),
    });
    jest.spyOn(SeoMetricPartition, 'findOne').mockReturnValue({
      sort: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({ date: '2026-08-06' }),
    });
    jest.spyOn(SeoSyncRun, 'findOne').mockReturnValue({
      sort: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({ analysis: {
        totalPages: 435, evaluatedPages: 435, committedAssessmentPages: 435,
      } }),
    });
    SeoPage.countDocuments.mockResolvedValue(436);
    SeoPageAssessment.aggregate.mockResolvedValue([{ count: 435 }]);
    jest.spyOn(SeoPage, 'findOne').mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        pageKey: HASH_C, manifest: { present: true },
        changeTracking: { analysisInputHash: HASH_B, currentVersionKey: HASH_A },
      }),
    });
    const upsert = jest.spyOn(SeoOpportunityReview, 'findOneAndUpdate');

    await expect(putSerpReview({
      config: { siteUrl: 'sc-domain:frontendatlas.com' },
      pageKey: HASH_C,
      opportunityKey: HASH_A,
      assessmentInputHash: HASH_B,
      actorUserId: null,
      input: {
        locale: 'en-US', device: 'desktop', dominantResultType: 'publisher',
        ownResultStatus: 'present_weak', outcome: 'snippet_test', serpFeatures: ['none'],
      },
    })).rejects.toEqual(expect.objectContaining({
      status: 409,
      code: 'SEO_OPPORTUNITY_STALE_ASSESSMENT',
    }));
    expect(upsert).not.toHaveBeenCalled();
  });

  test('requires strong modeled evidence for a snippet promotion', () => {
    const assessment = {
      decisionGates: ['serp_review_required'],
      ctrBaseline: { quality: 'medium', lower90: 0.02 },
    };
    expect(promotionFailure(serializeOpportunity(opportunity()), assessment)).toBeNull();
    expect(promotionFailure(serializeOpportunity(opportunity({
      expectedImpact: { metric: 'clicks', low: null, point: null, high: null, quality: 'not_estimated' },
    })), assessment)).toBe('modeled_impact_not_positive');
    expect(promotionFailure(serializeOpportunity(opportunity()), {
      ...assessment,
      decisionGates: ['serp_review_required', 'query_coverage_below_threshold'],
    })).toBe('query_coverage_below_threshold');
    expect(promotionFailure(serializeOpportunity(opportunity()), {
      ...assessment,
      decisionGates: ['serp_review_required', 'ranking_effect_not_estimated', 'internal_link_structural_review'],
    })).toBeNull();
    expect(promotionFailure(serializeOpportunity(opportunity()), {
      ...assessment,
      decisionGates: ['serp_review_required', 'post_deploy_crawl_required'],
    })).toBe('post_deploy_crawl_required');
  });

  test('rejects stale SERP observations and caps TTL from the observation time', async () => {
    const now = new Date('2026-08-10T12:00:00.000Z');
    expect(() => validateReviewInput({
      observedAt: '2025-01-01T00:00:00.000Z',
      locale: 'en-US',
      device: 'desktop',
      dominantResultType: 'publisher',
      ownResultStatus: 'present_weak',
      outcome: 'snippet_test',
      serpFeatures: ['none'],
    }, now)).toThrow('observedAt must be within the last 18 months');

    const observedAt = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const assessment = {
      siteUrl: 'sc-domain:frontendatlas.com', pageKey: HASH_C, inputHash: HASH_B,
      pageVersionKey: HASH_A, endDate: '2026-08-06', ruleVersion: 'balanced-v2.2',
      evaluatedAt: new Date('2026-06-01T00:00:00.000Z'),
      queryOpportunities: [opportunity()],
    };
    jest.spyOn(SeoPageAssessment, 'findOne').mockReturnValue({
      lean: jest.fn().mockResolvedValue(assessment),
    });
    jest.spyOn(SeoMetricPartition, 'findOne').mockReturnValue({
      sort: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({ date: '2026-08-06' }),
    });
    jest.spyOn(SeoSyncRun, 'findOne').mockReturnValue({
      sort: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({ analysis: {
        totalPages: 435, evaluatedPages: 435, committedAssessmentPages: 435,
      } }),
    });
    jest.spyOn(SeoPage, 'findOne').mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        pageKey: HASH_C,
        changeTracking: { analysisInputHash: HASH_B, currentVersionKey: HASH_A },
      }),
    });
    const upsert = jest.spyOn(SeoOpportunityReview, 'findOneAndUpdate')
      .mockImplementation(async (_filter, update) => ({
        ...update.$set,
        updatedAt: now,
      }));

    await putSerpReview({
      config: { siteUrl: 'sc-domain:frontendatlas.com' },
      pageKey: HASH_C,
      opportunityKey: HASH_A,
      assessmentInputHash: HASH_B,
      actorUserId: 'owner-1',
      now,
      input: {
        observedAt,
        locale: 'en-US', device: 'desktop', dominantResultType: 'publisher',
        ownResultStatus: 'present_weak', outcome: 'snippet_test', serpFeatures: ['none'],
      },
    });

    const storedExpiry = upsert.mock.calls[0][1].$set.expiresAt;
    expect(storedExpiry).toEqual(new Date(
      observedAt.getTime() + SeoOpportunityReview.REVIEW_TTL_MS
    ));
    expect(storedExpiry.getTime()).toBeLessThan(now.getTime() + SeoOpportunityReview.REVIEW_TTL_MS);
    expect(upsert.mock.calls[0][1]).toEqual(expect.objectContaining({
      $unset: { notes: 1 },
      $set: expect.objectContaining({ reasonCode: 'none' }),
    }));
  });

  test('rejects a SERP observation that predates the current assessment evaluation', async () => {
    const now = new Date('2026-08-10T12:00:00.000Z');
    const assessment = {
      siteUrl: 'sc-domain:frontendatlas.com', pageKey: HASH_C, inputHash: HASH_B,
      pageVersionKey: HASH_A, endDate: '2026-08-06', ruleVersion: 'balanced-v2.2',
      evaluatedAt: ASSESSMENT_EVALUATED_AT,
      queryOpportunities: [opportunity()],
    };
    jest.spyOn(SeoPageAssessment, 'findOne').mockReturnValue({
      lean: jest.fn().mockResolvedValue(assessment),
    });
    jest.spyOn(SeoMetricPartition, 'findOne').mockReturnValue({
      sort: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({ date: '2026-08-06' }),
    });
    jest.spyOn(SeoSyncRun, 'findOne').mockReturnValue({
      sort: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({ analysis: {
        totalPages: 435, evaluatedPages: 435, committedAssessmentPages: 435,
      } }),
    });
    jest.spyOn(SeoPage, 'findOne').mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        pageKey: HASH_C,
        changeTracking: { analysisInputHash: HASH_B, currentVersionKey: HASH_A },
      }),
    });
    const upsert = jest.spyOn(SeoOpportunityReview, 'findOneAndUpdate');

    await expect(putSerpReview({
      config: { siteUrl: 'sc-domain:frontendatlas.com' },
      pageKey: HASH_C,
      opportunityKey: HASH_A,
      assessmentInputHash: HASH_B,
      actorUserId: 'owner-1',
      now,
      input: {
        observedAt: new Date(ASSESSMENT_EVALUATED_AT.getTime() - 1),
        locale: 'en-US', device: 'desktop', dominantResultType: 'publisher',
        ownResultStatus: 'present_weak', outcome: 'snippet_test', serpFeatures: ['none'],
        reasonCode: 'snippet_not_specific',
      },
    })).rejects.toEqual(expect.objectContaining({
      status: 409,
      code: 'SEO_SERP_REVIEW_STALE',
    }));
    expect(upsert).not.toHaveBeenCalled();
  });

  test('allows a reviewed content experiment to remain unmodeled and outside Act now', () => {
    const ranking = serializeOpportunity(opportunity({
      classification: 'ranking_gap',
      expectedImpact: { metric: 'clicks', low: null, point: null, high: null, quality: 'not_estimated' },
    }));
    expect(promotionFailure(ranking, { decisionGates: ['serp_review_required'] })).toBeNull();
  });

  test('rechecks SERP review freshness before promotion even if persistence returns a stale row', async () => {
    const now = new Date('2026-08-10T12:00:00.000Z');
    const assessment = {
      siteUrl: 'sc-domain:frontendatlas.com',
      pageKey: HASH_C,
      canonicalUrl: 'https://frontendatlas.com/react/trivia/example',
      inputHash: HASH_B,
      pageVersionKey: HASH_A,
      endDate: '2026-08-06',
      ruleVersion: 'balanced-v2.2',
      evaluatedAt: ASSESSMENT_EVALUATED_AT,
      decisionGates: ['serp_review_required'],
      ctrBaseline: { quality: 'medium', lower90: 0.02 },
      queryOpportunities: [opportunity()],
    };
    jest.spyOn(SeoPageAssessment, 'findOne').mockReturnValue({
      lean: jest.fn().mockResolvedValue(assessment),
    });
    jest.spyOn(SeoMetricPartition, 'findOne').mockReturnValue({
      sort: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({ date: '2026-08-06' }),
    });
    jest.spyOn(SeoSyncRun, 'findOne').mockReturnValue({
      sort: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({ analysis: {
        totalPages: 435, evaluatedPages: 435, committedAssessmentPages: 435,
      } }),
    });
    jest.spyOn(SeoPage, 'findOne').mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        pageKey: HASH_C,
        changeTracking: { analysisInputHash: HASH_B, currentVersionKey: HASH_A },
      }),
    });
    const reviewFind = jest.spyOn(SeoOpportunityReview, 'findOne').mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        outcome: 'snippet_test',
        // Still within the 18-month TTL and keyed to the same input hash, but
        // older than the newest assessment evaluation.
        observedAt: new Date('2026-08-10T09:59:59.999Z'),
        expiresAt: new Date('2027-01-01T00:00:00.000Z'),
      }),
    });
    const actionFind = jest.spyOn(SeoAction, 'findOne');

    await expect(promoteOpportunity({
      config: { siteUrl: 'sc-domain:frontendatlas.com' },
      pageKey: HASH_C,
      opportunityKey: HASH_A,
      assessmentInputHash: HASH_B,
      actorUserId: 'owner-1',
      now,
    })).rejects.toEqual(expect.objectContaining({
      status: 409,
      code: 'SEO_OPPORTUNITY_REVIEW_REQUIRED',
    }));
    expect(reviewFind).toHaveBeenCalledWith(expect.objectContaining({
      expiresAt: { $gt: now },
      observedAt: expect.objectContaining({
        $gte: ASSESSMENT_EVALUATED_AT,
        $lte: expect.any(Date),
      }),
    }));
    expect(actionFind).not.toHaveBeenCalled();
  });

  test('fails closed when a production Mongo target cannot provide a promotion transaction', async () => {
    const previousTarget = process.env.MONGO_TARGET;
    process.env.MONGO_TARGET = 'production';
    const assessmentFind = jest.spyOn(SeoPageAssessment, 'findOne');
    try {
      await expect(promoteOpportunity({
        config: { siteUrl: 'sc-domain:frontendatlas.com' },
        pageKey: HASH_C,
        opportunityKey: HASH_A,
        assessmentInputHash: HASH_B,
        actorUserId: 'owner-1',
      })).rejects.toEqual(expect.objectContaining({
        status: 503,
        code: 'SEO_OPPORTUNITY_TRANSACTION_REQUIRED',
      }));
      expect(assessmentFind).not.toHaveBeenCalled();
    } finally {
      if (previousTarget === undefined) delete process.env.MONGO_TARGET;
      else process.env.MONGO_TARGET = previousTarget;
    }
  });

  test('persists an explicitly promoted experiment as owner-managed, not detector-owned', async () => {
    const assessment = {
      siteUrl: 'sc-domain:frontendatlas.com',
      pageKey: HASH_C,
      canonicalUrl: 'https://frontendatlas.com/react/trivia/example',
      inputHash: HASH_B,
      pageVersionKey: HASH_A,
      endDate: '2026-08-06',
      ruleVersion: 'balanced-v2.2',
      evaluatedAt: ASSESSMENT_EVALUATED_AT,
      totalPages: 435,
      decisionGates: ['serp_review_required'],
      ctrBaseline: { quality: 'medium', lower90: 0.02 },
      queryOpportunities: [opportunity()],
    };
    jest.spyOn(SeoPageAssessment, 'findOne').mockReturnValue({
      lean: jest.fn().mockResolvedValue(assessment),
    });
    jest.spyOn(SeoMetricPartition, 'findOne').mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({ date: '2026-08-06' }),
    });
    jest.spyOn(SeoSyncRun, 'findOne').mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({
        analysis: {
          status: 'complete',
          ruleVersion: 'balanced-v2.2',
          endDate: '2026-08-06',
          totalPages: 435,
          evaluatedPages: 435,
          committedAssessmentPages: 435,
        },
      }),
    });
    jest.spyOn(SeoPage, 'findOne').mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        pageKey: HASH_C,
        title: 'React example',
        changeTracking: { analysisInputHash: HASH_B, currentVersionKey: HASH_A },
      }),
    });
    const promotionNow = new Date('2026-08-10T12:00:00.000Z');
    jest.spyOn(SeoOpportunityReview, 'findOne').mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        outcome: 'snippet_test',
        observedAt: new Date('2026-08-10T11:00:00.000Z'),
        expiresAt: new Date('2027-01-01T00:00:00.000Z'),
      }),
    });
    const upsert = jest.spyOn(SeoAction, 'findOneAndUpdate').mockImplementation(async (_filter, update) => ({
      _id: 'action-1',
      version: 0,
      ...update.$setOnInsert,
      ...update.$set,
    }));

    await promoteOpportunity({
      config: { siteUrl: 'sc-domain:frontendatlas.com' },
      pageKey: HASH_C,
      opportunityKey: HASH_A,
      assessmentInputHash: HASH_B,
      actorUserId: null,
      now: promotionNow,
    });

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ $or: expect.any(Array) }),
      expect.objectContaining({
        $set: { ownerPromotionKey: expect.stringMatching(/^[a-f0-9]{64}$/) },
        $setOnInsert: expect.objectContaining({
          source: 'owner',
          ruleVersion: 'balanced-v2.2',
          detectorActive: false,
          queueKind: 'performance',
          expectedImpact: expect.objectContaining({ quality: 'modeled', point: 4 }),
        }),
      }),
      expect.objectContaining({ upsert: true, new: true })
    );
  });

  test('adopts a prior owner promotion without changing its lifecycle fields', async () => {
    const existing = {
      _id: 'existing-action',
      state: 'dismissed',
      version: 4,
      events: [{ event: 'dismiss', note: 'Owner decision' }],
    };
    const findOneAndUpdate = jest.spyOn(SeoAction, 'findOneAndUpdate').mockResolvedValue(existing);

    const result = await upsertPromotedAction({
      promotionKey: HASH_A,
      fingerprint: HASH_A,
      payload: {
        pageKey: HASH_C,
        canonicalUrl: 'https://frontendatlas.com/react/trivia/example',
        type: 'ctr_snippet',
        state: 'proposed',
        source: 'owner',
        summary: 'New payload must not reopen the action.',
      },
    });

    expect(result).toBe(existing);
    expect(findOneAndUpdate.mock.calls[0][1].$set).toEqual({ ownerPromotionKey: HASH_A });
    expect(findOneAndUpdate.mock.calls[0][1].$setOnInsert).toEqual(expect.objectContaining({
      state: 'proposed',
      fingerprint: HASH_A,
    }));
    expect(findOneAndUpdate.mock.calls[0][1].$setOnInsert).not.toHaveProperty('version');
  });

  test('builds the structural lane from current assessment evidence with safe donor details', async () => {
    const partitionQuery = {
      sort: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({ date: '2026-08-06' }),
    };
    const runQuery = {
      sort: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({
        analysis: {
          status: 'complete',
          ruleVersion: 'balanced-v2.2',
          endDate: '2026-08-06',
          totalPages: 435,
          evaluatedPages: 435,
          committedAssessmentPages: 435,
        },
      }),
    };
    const assessmentQuery = {
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([{
        siteUrl: 'sc-domain:frontendatlas.com',
        pageKey: HASH_C,
        canonicalUrl: 'https://frontendatlas.com/react/trivia/example',
        inputHash: HASH_B,
        ruleVersion: 'balanced-v2.2',
        endDate: '2026-08-06',
        disposition: 'structural_review',
        patternConfidence: 0.76,
        causeConfidence: 0.3,
        detectorAssessments: {
          internal_link: {
            state: 'watch',
            disposition: 'structural_review',
            reasonCodes: ['internal_link_structural_review'],
            decisionGates: ['ranking_effect_not_estimated'],
            evidence: {
              position: 10.4,
              impressions: 900,
              inboundCount: 1,
              cohortP25: 4,
              peerCount: 18,
              linkDeficit: 3,
              donorPageCount: 3,
              rawQuery: 'must never escape',
              qualifiedDonors: [
                {
                  title: 'Safe donor',
                  canonicalUrl: 'https://frontendatlas.com/react/trivia/safe-donor',
                  relevanceScore: 0.62,
                  reasonCodes: ['semantic_overlap', 'visible_donor'],
                  anchorDirection: 'React rendering behavior',
                  rawQuery: 'must never escape',
                },
                {
                  title: 'External donor',
                  canonicalUrl: 'https://example.com/not-allowed',
                  relevanceScore: 0.99,
                },
              ],
            },
          },
        },
      }]),
    };
    const pageQuery = {
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([{ pageKey: HASH_C, title: 'Structural target' }]),
    };
    jest.spyOn(SeoMetricPartition, 'findOne').mockReturnValue(partitionQuery);
    jest.spyOn(SeoSyncRun, 'findOne').mockReturnValue(runQuery);
    jest.spyOn(SeoPageAssessment, 'find').mockReturnValue(assessmentQuery);
    jest.spyOn(SeoPage, 'find').mockReturnValue(pageQuery);

    const result = await listOpportunities({
      config: { siteUrl: 'sc-domain:frontendatlas.com' },
      lane: 'structural',
    });

    expect(SeoPageAssessment.find).toHaveBeenCalledWith(expect.objectContaining({
      ruleVersion: 'balanced-v2.2',
      endDate: '2026-08-06',
    }));
    expect(result).toEqual(expect.objectContaining({ lane: 'structural', total: 1 }));
    expect(result.items[0]).toEqual(expect.objectContaining({
      kind: 'structural_finding',
      pageKey: HASH_C,
      pageTitle: 'Structural target',
      assessmentInputHash: HASH_B,
    }));
    expect(result.items[0].finding.evidence.qualifiedDonors).toEqual([{
      title: 'Safe donor',
      canonicalUrl: 'https://frontendatlas.com/react/trivia/safe-donor',
      relevanceScore: 0.62,
      reasonCodes: ['semantic_overlap', 'visible_donor'],
      anchorDirection: 'React rendering behavior',
    }]);
    expect(result.items[0].finding.nextReview).toEqual({
      mode: 'event', event: 'structural_review', rationale: 'review_qualified_donors',
    });
    expect(result.items[0].finding.decisionGates).toEqual(['ranking_effect_not_estimated']);
    expect(JSON.stringify(result)).not.toContain('must never escape');
    expect(JSON.stringify(result)).not.toContain('example.com');
  });

  test('returns an empty fail-closed lane until the latest v2.2 analysis is fully committed', async () => {
    const partitionQuery = {
      sort: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({ date: '2026-08-06' }),
    };
    const runQuery = {
      sort: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({
        analysis: {
          status: 'complete',
          ruleVersion: 'balanced-v2.2',
          endDate: '2026-08-06',
          totalPages: 435,
          evaluatedPages: 435,
          committedAssessmentPages: 434,
        },
      }),
    };
    jest.spyOn(SeoMetricPartition, 'findOne').mockReturnValue(partitionQuery);
    jest.spyOn(SeoSyncRun, 'findOne').mockReturnValue(runQuery);
    const assessmentFind = jest.spyOn(SeoPageAssessment, 'find');

    await expect(listOpportunities({
      config: { siteUrl: 'sc-domain:frontendatlas.com' },
      lane: 'investigate',
    })).resolves.toEqual({
      lane: 'investigate',
      items: [],
      total: 0,
      nextCursor: null,
      readiness: {
        status: 'not_ready',
        ruleVersion: 'balanced-v2.2',
        endDate: '2026-08-06',
        reason: 'analysis_not_fully_committed',
        totalPages: 435,
        evaluatedPages: 435,
        committedAssessmentPages: 434,
      },
    });
    expect(assessmentFind).not.toHaveBeenCalled();
  });

  test('returns an empty fail-closed lane when the current manifest outgrows the last complete analysis', async () => {
    jest.spyOn(SeoMetricPartition, 'findOne').mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({ date: '2026-08-06' }),
    });
    jest.spyOn(SeoSyncRun, 'findOne').mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({
        analysis: {
          status: 'complete',
          ruleVersion: 'balanced-v2.2',
          endDate: '2026-08-06',
          totalPages: 435,
          evaluatedPages: 435,
          committedAssessmentPages: 435,
        },
      }),
    });
    SeoPage.countDocuments.mockResolvedValue(436);
    SeoPageAssessment.aggregate.mockResolvedValue([{ count: 435 }]);
    const assessmentFind = jest.spyOn(SeoPageAssessment, 'find');

    await expect(listOpportunities({
      config: { siteUrl: 'sc-domain:frontendatlas.com' },
      lane: 'investigate',
    })).resolves.toEqual({
      lane: 'investigate',
      items: [],
      total: 0,
      nextCursor: null,
      readiness: {
        status: 'not_ready',
        ruleVersion: 'balanced-v2.2',
        endDate: '2026-08-06',
        reason: 'analysis_manifest_out_of_date',
        totalPages: 435,
        evaluatedPages: 435,
        committedAssessmentPages: 435,
        manifestPages: 436,
        currentAssessmentPages: 435,
      },
    });
    expect(assessmentFind).not.toHaveBeenCalled();
  });

  test('returns an empty fail-closed lane when a page version changes without changing manifest count', async () => {
    jest.spyOn(SeoMetricPartition, 'findOne').mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({ date: '2026-08-06' }),
    });
    jest.spyOn(SeoSyncRun, 'findOne').mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({
        analysis: {
          status: 'complete',
          ruleVersion: 'balanced-v2.2',
          endDate: '2026-08-06',
          totalPages: 435,
          evaluatedPages: 435,
          committedAssessmentPages: 435,
        },
      }),
    });
    SeoPage.countDocuments.mockResolvedValue(435);
    SeoPageAssessment.aggregate.mockResolvedValue([{ count: 434 }]);
    const assessmentFind = jest.spyOn(SeoPageAssessment, 'find');

    const result = await listOpportunities({
      config: { siteUrl: 'sc-domain:frontendatlas.com' },
      lane: 'investigate',
    });

    expect(result.readiness).toEqual(expect.objectContaining({
      status: 'not_ready',
      reason: 'analysis_manifest_out_of_date',
      manifestPages: 435,
      currentAssessmentPages: 434,
    }));
    expect(result.items).toEqual([]);
    expect(assessmentFind).not.toHaveBeenCalled();
    expect(JSON.stringify(SeoPageAssessment.aggregate.mock.calls[0][0]))
      .toContain('analysisInputHash');
    expect(JSON.stringify(SeoPageAssessment.aggregate.mock.calls[0][0]))
      .toContain('currentVersionKey');
  });

  test('only joins unexpired reviews into the investigate lane', async () => {
    const now = new Date('2026-08-10T12:00:00.000Z');
    jest.spyOn(SeoMetricPartition, 'findOne').mockReturnValue({
      sort: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({ date: '2026-08-06' }),
    });
    jest.spyOn(SeoSyncRun, 'findOne').mockReturnValue({
      sort: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({ analysis: {
        totalPages: 1, evaluatedPages: 1, committedAssessmentPages: 1,
      } }),
    });
    SeoPage.countDocuments.mockResolvedValue(1);
    SeoPageAssessment.aggregate.mockResolvedValue([{ count: 1 }]);
    jest.spyOn(SeoPageAssessment, 'find').mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([{
        siteUrl: 'sc-domain:frontendatlas.com', pageKey: HASH_C,
        canonicalUrl: 'https://frontendatlas.com/react/trivia/example',
        inputHash: HASH_B, ruleVersion: 'balanced-v2.2', endDate: '2026-08-06',
        evaluatedAt: ASSESSMENT_EVALUATED_AT,
        disposition: 'investigate', queryOpportunities: [opportunity()],
      }]),
    });
    jest.spyOn(SeoPage, 'find').mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([{ pageKey: HASH_C, title: 'Example' }]),
    });
    const reviewFind = jest.spyOn(SeoOpportunityReview, 'find').mockReturnValue({
      lean: jest.fn().mockResolvedValue([{
        siteUrl: 'sc-domain:frontendatlas.com', pageKey: HASH_C,
        assessmentInputHash: HASH_B, opportunityKey: HASH_A,
        outcome: 'snippet_test', reasonCode: 'snippet_not_specific',
        observedAt: new Date('2026-08-10T09:59:59.999Z'),
        expiresAt: new Date('2027-01-01T00:00:00.000Z'),
      }]),
    });

    const result = await listOpportunities({
      config: { siteUrl: 'sc-domain:frontendatlas.com' },
      lane: 'investigate',
      now,
    });

    expect(result.total).toBe(1);
    // A same-hash review from an older evaluation must not appear to unlock
    // the current opportunity in the lane response.
    expect(result.items[0].review).toBeNull();
    expect(reviewFind).toHaveBeenCalledWith(expect.objectContaining({
      siteUrl: 'sc-domain:frontendatlas.com',
      expiresAt: { $gt: now },
    }));
  });

  test('page-detail review lookup excludes a same-hash review from an older evaluation', async () => {
    const now = new Date('2026-08-10T12:00:00.000Z');
    const staleReview = {
      opportunityKey: HASH_A,
      observedAt: new Date('2026-08-10T09:59:59.999Z'),
      expiresAt: new Date('2027-01-01T00:00:00.000Z'),
      locale: 'en-US',
      device: 'desktop',
      dominantResultType: 'publisher',
      serpFeatures: ['none'],
      ownResultStatus: 'present_weak',
      outcome: 'snippet_test',
      reasonCode: 'snippet_not_specific',
    };
    const find = jest.spyOn(SeoOpportunityReview, 'find').mockReturnValue({
      lean: jest.fn().mockResolvedValue([staleReview]),
    });

    const result = await reviewsForAssessment({
      siteUrl: 'sc-domain:frontendatlas.com',
      pageKey: HASH_C,
      assessmentInputHash: HASH_B,
      assessmentEvaluatedAt: ASSESSMENT_EVALUATED_AT,
      now,
    });

    expect(result.size).toBe(0);
    expect(find).toHaveBeenCalledWith(expect.objectContaining({
      observedAt: expect.objectContaining({
        $gte: ASSESSMENT_EVALUATED_AT,
        $lte: expect.any(Date),
      }),
    }));
  });

  test('defines an 18-month TTL review collection with a unique current-assessment key', () => {
    const indexes = SeoOpportunityReview.schema.indexes();
    expect(indexes).toEqual(expect.arrayContaining([
      [
        { siteUrl: 1, pageKey: 1, assessmentInputHash: 1, opportunityKey: 1 },
        expect.objectContaining({ unique: true }),
      ],
      [
        { expiresAt: 1 },
        expect.objectContaining({ expireAfterSeconds: 0 }),
      ],
    ]));
  });

  test('defines a unique owner-promotion key independently from active experiment locking', () => {
    expect(SeoAction.schema.indexes()).toEqual(expect.arrayContaining([
      [
        { ownerPromotionKey: 1 },
        expect.objectContaining({
          unique: true,
          partialFilterExpression: { ownerPromotionKey: { $type: 'string' } },
        }),
      ],
    ]));
  });
});
