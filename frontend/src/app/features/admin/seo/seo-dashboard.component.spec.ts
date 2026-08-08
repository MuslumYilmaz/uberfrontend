import { WritableSignal, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { NEVER, Observable, Subject, of, throwError } from 'rxjs';
import {
  SeoAction,
  SeoAnalyzeResponse,
  SeoOverview,
  SeoPageDetail,
} from '../../../core/models/seo-admin.model';
import { AuthService } from '../../../core/services/auth.service';
import { SeoAdminService } from '../../../core/services/seo-admin.service';
import { FaDialogComponent } from '../../../shared/ui';
import { SeoDashboardComponent } from './seo-dashboard.component';

describe('SeoDashboardComponent', () => {
  let fixture: ComponentFixture<SeoDashboardComponent>;
  let component: SeoDashboardComponent;
  let seoAdmin: jasmine.SpyObj<SeoAdminService>;
  let ownerAllowed: WritableSignal<boolean>;
  let accessChecked: WritableSignal<boolean>;
  let manualAnalysisAvailable: WritableSignal<boolean>;
  let authUser: WritableSignal<any>;
  let router: jasmine.SpyObj<Router>;

  const action: SeoAction = {
    id: 'action-1',
    version: 1,
    pageKey: 'page-1',
    url: 'https://frontendatlas.com/javascript/coding',
    pageTitle: 'JavaScript coding interview questions',
    type: 'ctr_snippet',
    status: 'proposed',
    verdict: null,
    title: 'Clarify the snippet promise',
    priorityScore: 18.4,
    confidence: 0.82,
    expectedAdditionalClicks: 12,
    effort: 'low',
    risk: 'low',
    detectedAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-05T00:00:00.000Z',
    evidence: {
      summary: 'CTR trails the page family baseline at a stable top-five position.',
      queryCoveragePercent: 88,
      queryClusters: [{
        label: 'javascript coding interview',
        clicks: 4,
        impressions: 125,
        ctr: 0.032,
        averagePosition: 4.2,
      }],
    },
    recommendation: {
      hypothesis: 'A more specific promise will win more qualified clicks.',
      checklist: ['Confirm the live title and H1.', 'Draft one materially different promise.'],
      copyDirection: 'Lead with hands-on JavaScript coding practice.',
      successCriteria: 'CTR improves by at least 15% without a position loss.',
    },
    events: [],
  };

  const page: SeoPageDetail = {
    pageKey: 'page-1',
    canonicalUrl: action.url,
    path: '/javascript/coding',
    family: 'coding',
    tech: 'javascript',
    title: 'JavaScript coding interview questions',
    description: 'Practice JavaScript coding questions.',
    h1: 'JavaScript coding interview questions',
    targetKeyword: 'javascript coding interview questions',
    intendedIntent: 'Hands-on JavaScript coding interview practice',
    readerPromise: 'Practice runnable JavaScript problems.',
    intentSource: 'derived',
    intentConfirmed: false,
    indexable: true,
    recentActions: [action],
    clicks: 4,
    impressions: 125,
    ctr: 0.032,
    averagePosition: 4.2,
    metricWindow: {
      startDate: '2026-07-07',
      endDate: '2026-08-03',
      complete: true,
      availableDays: 28,
      expectedDays: 28,
    },
    assessment: {
      primaryState: 'watch',
      summary: 'A recent title change is still inside its clean measurement window.',
      evidenceLevel: 'directional',
      confidence: 0.68,
      currentForLatestData: true,
      ruleVersion: 'balanced-v2.1',
      semanticVersion: 'semantic-clusters.v2',
      input: {
        version: 'page-assessment-input.v2',
        hash: 'assessment-input-hash',
        pageVersionKey: 'a1b2c3d4e5f678901234567890abcdef',
        valid: true,
      },
      reasonCodes: ['low_sample'],
      endDate: '2026-08-04',
      nextReviewDate: '2026-09-04',
      cooldown: {
        state: 'observing',
        cleanFinalizedDays: 0,
        materialChangedAt: '2026-08-03T00:00:00.000Z',
        lastGoogleCrawlAt: '2026-08-04T01:09:35.000Z',
        decisionDataThrough: '2026-08-04',
        nextReviewDate: '2026-09-04',
      },
      ctrBaseline: {
        quality: 'insufficient',
        cohort: 'family_position',
        peerPageCount: 9,
        peerClicks: 10,
        peerImpressions: 9393,
        zeroClickPeerShare: 0.82,
        ctr: 0.0011,
      },
      semanticClusters: [{
        key: 'http-cancellation',
        label: 'HTTP cancellation',
        facet: 'official_reference',
        clicks: 0,
        impressions: 749,
        ctr: 0,
        averagePosition: 6.1,
        visibleShare: 0.987,
        fullPageLowerBoundShare: 0.293,
        topicAlignment: 0.92,
        sourcePreferenceShare: 0.614,
      }],
      findings: [{
        code: 'source_preference',
        detector: 'semantic_intent',
        state: 'watch',
        confidence: 0.72,
        summary: 'Visible queries align with the topic, with a strong official-reference preference.',
      }],
      counterEvidence: [{
        code: 'low_sample',
        detector: 'content_decay',
        state: 'not_evaluable',
        summary: 'The click change is too small to establish content decay.',
      }],
    },
    reconciliation: {
      window: {
        startDate: '2026-07-08',
        endDate: '2026-08-04',
        days: 28,
      },
      pageTotal: {
        status: 'complete',
        metrics: { clicks: 3, impressions: 2519, ctr: 3 / 2519, averagePosition: 6.65 },
        partitionWindow: { completedDays: 28, requiredDays: 28, truncatedDays: 0, complete: true },
      },
      visibleQuerySubset: {
        status: 'partial',
        metrics: { clicks: 0, impressions: 749, ctr: 0, averagePosition: 6.1 },
        coveragePercent: 29.7,
        fullWindowLowerBoundPercent: 29.7,
        coverageSufficient: false,
        partitionWindow: { completedDays: 28, requiredDays: 28, truncatedDays: 0, complete: true },
      },
      visibleDeviceSubset: {
        status: 'partial',
        metrics: { clicks: 0, impressions: 749, ctr: 0, averagePosition: 6.1 },
        coveragePercent: 29.7,
        fullWindowLowerBoundPercent: 29.7,
        coverageSufficient: false,
        partitionWindow: { completedDays: 28, requiredDays: 28, truncatedDays: 0, complete: true },
      },
    },
    lineage: {
      currentVersion: {
        versionKey: 'a1b2c3d4e5f678901234567890abcdef',
        occurrenceKey: 'occurrence-a1b2c3d4-20260803',
        inputHash: 'input-hash-current',
        fingerprintVersion: 'seo-page-fingerprints.v1',
        observedAt: '2026-08-03T10:00:00.000Z',
        changedComponents: ['title', 'mainContent', 'headingOutline'],
        manifest: {
          version: 'manifest-2026.08.03-production',
          sourceHash: 'manifest-source-hash',
          generatedAt: '2026-08-03T09:55:00.000Z',
        },
        production: {
          effectiveAt: '2026-08-03T12:00:00.000Z',
          precision: 'upper_bound',
          source: 'runtime_observed',
          deploymentId: 'dpl_frontendatlas_20260803',
          gitCommitSha: 'abcdef1234567890fedcba',
          gitDiffBaseSha: '1234567890abcdef1234567890abcdef12345678',
        },
        fingerprintEvidence: {
          source: 'prerendered_production_html',
          prerenderedAvailable: true,
          limitations: ['client_only_runtime_content_not_observed'],
          statuses: {
            seoMetadata: 'complete',
            mainContent: 'partial',
            headingOutline: 'complete',
            structuredData: 'complete',
            internalLinks: 'complete',
            intent: 'complete',
          },
        },
        gitCandidate: {
          authority: 'corroborating_only',
          status: 'available',
          scope: 'first_parent',
          confidence: 'low',
          diffBaseKind: 'first_parent',
          diffBaseConfidence: 'low',
          changedFileCount: 2,
          returnedEntryCount: 2,
          entryLimit: 24,
          truncated: false,
          changeTypes: { modified: 2 },
          areas: { frontend: 2 },
          candidateSignals: ['rendered_application_source_changed'],
          signals: ['rendered_application_source_changed'],
        },
        crawl: {
          lastGoogleCrawlAt: '2026-08-04T01:09:35.000Z',
          confirmedAfterProduction: true,
          confirmedAt: '2026-08-04T01:09:35.000Z',
        },
      },
      timeline: [{
        versionKey: 'a1b2c3d4e5f678901234567890abcdef',
        occurrenceKey: 'occurrence-a1b2c3d4-20260803',
        inputHash: 'input-hash-current',
        observedAt: '2026-08-03T10:00:00.000Z',
        effectiveAt: '2026-08-03T12:00:00.000Z',
        precision: 'upper_bound',
        source: 'runtime_observed',
        changedComponents: ['title', 'mainContent', 'headingOutline'],
        affectedDetectors: ['ctr_snippet', 'intent_mismatch', 'content_decay'],
        deploymentId: 'dpl_frontendatlas_20260803',
        gitCommitSha: 'abcdef1234567890fedcba',
        gitCandidate: {
          authority: 'corroborating_only',
          status: 'available',
          scope: 'first_parent',
          confidence: 'low',
          changedFileCount: 2,
          returnedEntryCount: 2,
          entryLimit: 24,
          truncated: false,
          changeTypes: { modified: 2 },
          areas: { frontend: 2 },
          candidateSignals: ['rendered_application_source_changed'],
          signals: ['rendered_application_source_changed'],
        },
        crawlConfirmedAt: '2026-08-04T01:09:35.000Z',
        googleCrawlAt: '2026-08-04T01:09:35.000Z',
        crawlConfirmedDetectors: ['ctr_snippet', 'intent_mismatch', 'content_decay'],
      }, {
        versionKey: '09f8e7d6c5b432109876543210fedcba',
        occurrenceKey: 'occurrence-09f8e7d6-20260701',
        inputHash: 'input-hash-prior',
        observedAt: '2026-07-01T09:00:00.000Z',
        effectiveAt: '2026-07-01T09:30:00.000Z',
        precision: 'exact',
        source: 'manifest_ready_at',
        changedComponents: ['description'],
        affectedDetectors: ['ctr_snippet'],
        deploymentId: 'dpl_frontendatlas_20260701',
        gitCommitSha: '9876543210abcdef123456',
        googleCrawlAt: '2026-07-02T08:00:00.000Z',
        crawlConfirmedAt: '2026-07-02T08:00:00.000Z',
        crawlConfirmedDetectors: ['ctr_snippet'],
      }],
      detectorStates: {
        technical_indexing: {
          affected: false,
          versionKey: null,
          occurrenceKey: null,
          changedComponents: [],
          productionPrecision: 'unknown',
          productionSource: 'unknown',
          crawlRequired: false,
          crawlConfirmed: true,
          cooldown: { state: 'eligible', cleanFinalizedDays: 28 },
        },
        ctr_snippet: {
          affected: true,
          versionKey: 'a1b2c3d4e5f678901234567890abcdef',
          occurrenceKey: 'occurrence-a1b2c3d4-20260803',
          changedComponents: ['title'],
          changeEffectiveAt: '2026-08-03T12:00:00.000Z',
          productionPrecision: 'upper_bound',
          productionSource: 'runtime_observed',
          crawlRequired: true,
          crawlConfirmed: true,
          lastGoogleCrawlAt: '2026-08-04T01:09:35.000Z',
          confirmedCrawlAt: '2026-08-04T01:09:35.000Z',
          cooldown: {
            state: 'observing',
            cleanFinalizedDays: 0,
            cleanWindowStartDate: '2026-08-04',
            decisionDataThrough: '2026-08-04',
            nextReviewDate: '2026-09-04',
          },
        },
        intent_mismatch: {
          affected: true,
          versionKey: 'a1b2c3d4e5f678901234567890abcdef',
          occurrenceKey: 'occurrence-a1b2c3d4-20260803',
          changedComponents: ['headingOutline', 'mainContent'],
          changeEffectiveAt: '2026-08-03T12:00:00.000Z',
          productionPrecision: 'upper_bound',
          productionSource: 'runtime_observed',
          crawlRequired: true,
          crawlConfirmed: true,
          lastGoogleCrawlAt: '2026-08-04T01:09:35.000Z',
          confirmedCrawlAt: '2026-08-04T01:09:35.000Z',
          cooldown: {
            state: 'observing',
            cleanFinalizedDays: 0,
            nextReviewDate: '2026-09-04',
          },
        },
        content_decay: {
          affected: true,
          versionKey: 'a1b2c3d4e5f678901234567890abcdef',
          occurrenceKey: 'occurrence-a1b2c3d4-20260803',
          changedComponents: ['mainContent'],
          changeEffectiveAt: '2026-08-03T12:00:00.000Z',
          productionPrecision: 'upper_bound',
          productionSource: 'runtime_observed',
          crawlRequired: true,
          crawlConfirmed: true,
          lastGoogleCrawlAt: '2026-08-04T01:09:35.000Z',
          confirmedCrawlAt: '2026-08-04T01:09:35.000Z',
          cooldown: {
            state: 'observing',
            cleanFinalizedDays: 0,
            nextReviewDate: '2026-09-04',
          },
        },
      },
      assessmentInput: {
        hash: 'assessment-input-hash',
        version: 'page-assessment-input.v2',
        semanticVersion: 'semantic-clusters.v2',
        ruleVersion: 'balanced-v2.1',
        pageVersionKey: 'a1b2c3d4e5f678901234567890abcdef',
        currentHash: 'input-hash-current',
        currentPageVersionKey: 'a1b2c3d4e5f678901234567890abcdef',
        valid: true,
        current: true,
      },
      gitCandidate: {
        authority: 'corroborating_only',
        status: 'available',
        scope: 'first_parent',
        confidence: 'low',
        diffBaseKind: 'first_parent',
        diffBaseConfidence: 'low',
        changedFileCount: 2,
        returnedEntryCount: 2,
        entryLimit: 24,
        truncated: false,
        changeTypes: { modified: 2 },
        areas: { frontend: 2 },
        candidateSignals: ['rendered_application_source_changed'],
        signals: ['rendered_application_source_changed'],
      },
    },
  };

  const overview: SeoOverview = {
    generatedAt: '2026-08-06T06:00:00.000Z',
    windowDays: 28,
    segment: 'all',
    dataHealth: {
      siteUrl: 'sc-domain:frontendatlas.com',
      latestFinalizedDate: '2026-08-04',
      lastSuccessfulSyncAt: '2026-08-04T04:15:00.000Z',
      nextScheduledSyncAt: '2026-08-07T04:15:00.000Z',
      backfillPercent: 64,
      backfill: {
        completedDays: 58,
        expectedDays: 90,
        percent: 64.4,
        nextDate: '2026-06-06',
        complete: false,
      },
      recommendationReadiness: {
        completedDays: 56,
        requiredDays: 56,
        ready: true,
      },
      queryCoveragePercent: 14.5,
      queryCoverageStatus: 'limited',
      queryCoverageSufficient: false,
      deviceCoveragePercent: 14.3,
      deviceCoverageStatus: 'limited',
      deviceCoverageSufficient: false,
      storageUsedBytes: 1024,
      storageBudgetBytes: 1024 * 1024,
      truncated: false,
      stale: true,
      syncStatus: 'idle',
    },
    analysis: {
      status: 'complete',
      ruleVersion: 'balanced-v2.1',
      endDate: '2026-08-04',
      currentForLatestData: true,
      completedDays: 56,
      requiredDays: 56,
      evaluatedPages: 1,
      totalPages: 1,
      eligiblePages: 1,
      proposedActions: 1,
      clearedActions: 0,
      cooldown: { awaitingRecrawl: 0, observing: 0, directional: 0, eligible: 1 },
      dataQualityBlockedPages: 0,
      decisionBlockedPages: 0,
      completedAt: '2026-08-06T06:00:00.000Z',
    },
    kpis: {
      clicks: { value: 31, previousValue: 24, deltaPercent: 29.2 },
      impressions: { value: 970, previousValue: 850, deltaPercent: 14.1 },
      ctr: { value: 0.032, previousValue: 0.028, deltaPercent: 14.3 },
      averagePosition: { value: 8.4, previousValue: 8.9, deltaPercent: -5.6 },
    },
    trend: [
      { date: '2026-08-03', clicks: 0, impressions: 20, ctr: 0, averagePosition: 9.1 },
      { date: '2026-08-04', clicks: 10, impressions: 110, ctr: 0.091, averagePosition: 8.2 },
    ],
    actionSummary: { nowCount: 1, backlogCount: 1, measuringCount: 0 },
  };

  async function create(options?: {
    loading?: boolean;
    overviewError?: boolean;
    empty?: boolean;
    partialWindow?: boolean;
    partialPageWindow?: boolean;
  }): Promise<void> {
    seoAdmin = jasmine.createSpyObj<SeoAdminService>('SeoAdminService', [
      'getOverview',
      'getActions',
      'getAction',
      'createAction',
      'transitionAction',
      'getPages',
      'getPage',
      'updateIntent',
      'checkAccess',
      'requestSync',
      'requestAnalysis',
      'getSyncRuns',
    ]);
    ownerAllowed = signal(true);
    accessChecked = signal(true);
    manualAnalysisAvailable = signal(true);
    Object.defineProperty(seoAdmin, 'ownerAllowed', { value: ownerAllowed.asReadonly() });
    Object.defineProperty(seoAdmin, 'accessChecked', { value: accessChecked.asReadonly() });
    Object.defineProperty(seoAdmin, 'manualAnalysisAvailable', { value: manualAnalysisAvailable.asReadonly() });
    authUser = signal({ _id: 'owner-1', role: 'admin', email: 'owner@example.com' });
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    router.navigate.and.returnValue(Promise.resolve(true));
    const overviewValue: SeoOverview = options?.partialWindow
      ? {
        ...overview,
        dataHealth: {
          ...overview.dataHealth,
          windowCompleteness: {
            slice: 'queryPage',
            current: { complete: false, availableDays: 12, expectedDays: 28 },
            previous: { complete: false, availableDays: 0, expectedDays: 28 },
          },
        },
      }
      : overview;
    const overviewResponse: Observable<SeoOverview> = options?.loading
      ? NEVER
      : options?.overviewError
        ? throwError(() => new Error('unavailable'))
        : of(overviewValue);
    seoAdmin.getOverview.and.returnValue(overviewResponse);
    seoAdmin.getActions.and.callFake((query) => of({
      items: options?.empty ? [] : [action],
      total: options?.empty ? 0 : 1,
      nextCursor: null,
    }));
    seoAdmin.getAction.and.returnValue(of(action));
    seoAdmin.createAction.and.returnValue(of(action));
    seoAdmin.transitionAction.and.returnValue(of({ ...action, status: 'approved', version: 2 }));
    const pageMetricWindow = options?.partialPageWindow
      ? { startDate: '2026-07-07', endDate: '2026-08-03', complete: false, availableDays: 12, expectedDays: 28 }
      : page.metricWindow!;
    const pageResponse = options?.partialPageWindow
      ? { ...page, clicks: undefined, impressions: undefined, ctr: undefined, averagePosition: undefined, metricWindow: pageMetricWindow }
      : page;
    seoAdmin.getPages.and.returnValue(of({
      items: options?.empty ? [] : [pageResponse],
      total: options?.empty ? 0 : 1,
      nextCursor: null,
      metricWindow: pageMetricWindow,
    }));
    seoAdmin.getPage.and.returnValue(of(pageResponse));
    seoAdmin.updateIntent.and.returnValue(of({ ...page, intentConfirmed: true }));
    seoAdmin.checkAccess.and.callFake(() => of({
      allowed: ownerAllowed(),
      enabled: true,
      capabilities: manualAnalysisAvailable()
        ? { contractVersion: 'seo-admin.v2', manualAnalysis: true }
        : undefined,
    }));
    seoAdmin.requestSync.and.returnValue(of({
      accepted: true,
      status: 'partial',
      datesCompleted: ['2026-08-02', '2026-08-01'],
      message: '2 finalized GSC dates synchronized. Any remaining backfill will resume from the next missing date.',
    }));
    seoAdmin.requestAnalysis.and.returnValue(of({
      accepted: true,
      runId: 'analysis-1',
      status: 'complete',
      analysis: overview.analysis,
      message: 'Balanced-v2.1 analysis completed.',
    }));
    seoAdmin.getSyncRuns.and.returnValue(of({
      items: options?.empty ? [] : [{
        id: 'sync-1',
        status: 'complete',
        trigger: 'cron',
        startedAt: '2026-08-04T04:15:00.000Z',
        completedAt: '2026-08-04T04:16:00.000Z',
        datesAttempted: ['2026-08-04', '2026-08-03'],
        datesCompleted: ['2026-08-04', '2026-08-03'],
        rowsWritten: 100,
        truncated: false,
        detailSlicesSkipped: false,
        error: null,
      }],
      total: options?.empty ? 0 : 1,
      nextCursor: null,
    }));

    await TestBed.configureTestingModule({
      imports: [SeoDashboardComponent, NoopAnimationsModule],
      providers: [
        { provide: SeoAdminService, useValue: seoAdmin },
        { provide: AuthService, useValue: { user: authUser } },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(SeoDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  afterEach(() => TestBed.resetTestingModule());

  it('renders data health, ratio-based CTR, priority actions, sync history, and pages', async () => {
    await create();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('[data-testid="seo-stale-warning"]')).toBeTruthy();
    expect(root.querySelector('[data-testid="seo-kpi-ctr"] strong')?.textContent).toContain('3.20%');
    expect(root.querySelector('[data-testid="seo-now-action-action-1"]')).toBeTruthy();
    expect(root.querySelector('[data-testid="seo-sync-history"]')?.textContent).toContain('100 rows');
    expect(root.querySelector('[data-testid="seo-sync-history"]')?.textContent).toContain('Automatic');
    expect(root.querySelector('[data-testid="seo-pages-list"]')?.textContent).toContain('Auto-derived');
    expect(root.querySelector('[data-testid="seo-data-health"]')?.textContent).toContain('Production auto-sync');
    expect(root.querySelector('[data-testid="seo-data-health"]')?.textContent).toContain('58/90 days');
    expect(root.querySelector('[data-testid="seo-data-health"]')?.textContent).toContain('56/56 complete days');
    expect(root.querySelector('[data-testid="seo-data-health"]')?.textContent).toContain('Limited query subset');
    expect(root.querySelector('[data-testid="seo-data-health"]')?.textContent).toContain('Limited device subset');
    const analysisHealth = root.querySelector('[data-testid="seo-analysis-health"]') as HTMLElement;
    expect(analysisHealth.dataset['kind']).toBe('complete');
    expect(analysisHealth.textContent).toContain('balanced-v2.1');
    expect(analysisHealth.textContent).toContain('1/1 committed');
    expect(analysisHealth.textContent).toContain('56/56 finalized days');
    expect(analysisHealth.textContent).toContain('Current with latest finalized data');
    expect(analysisHealth.textContent).toContain('source data is stale');
    expect(root.querySelector('[data-testid="seo-sync-button"]')?.textContent).toContain('Continue backfill');
    expect(seoAdmin.getOverview).toHaveBeenCalledWith(28, 'all');
    expect(root.querySelector('[data-testid="seo-query-subset-warning"]')).toBeNull();
    expect(component.trendBars()[0].height).toBe(0);
    expect(component.trendBars()[0].slot).toBe(27);
  });

  it('makes every analysis lifecycle state explicit in the summary card', async () => {
    await create({ empty: true });
    const root = fixture.nativeElement as HTMLElement;
    const setAnalysis = (analysis: NonNullable<SeoOverview['analysis']>): HTMLElement => {
      component.overview.update((value) => value ? ({ ...value, analysis }) : value);
      fixture.detectChanges();
      return root.querySelector('[data-testid="seo-analysis-health"]') as HTMLElement;
    };

    let card = setAnalysis({ status: 'running', evaluatedPages: 7, totalPages: 435 });
    expect(card.dataset['kind']).toBe('running');
    expect(card.getAttribute('aria-busy')).toBe('true');
    expect(card.textContent).toContain('7/435 decision packets committed');
    expect((root.querySelector('[data-testid="seo-analyze-button"]') as HTMLButtonElement).disabled).toBeFalse();

    card = setAnalysis({
      status: 'not_ready',
      reason: 'insufficient_contiguous_page_data',
      completedDays: 32,
      requiredDays: 56,
      currentForLatestData: true,
    });
    expect(card.dataset['kind']).toBe('not_ready');
    expect(card.textContent).toContain('Evidence window is still filling · 32/56');

    card = setAnalysis({
      status: 'partial',
      evaluatedPages: 200,
      committedAssessmentPages: 150,
      totalPages: 435,
      currentForLatestData: true,
    });
    expect(card.dataset['kind']).toBe('partial');
    expect(card.textContent).toContain('150/435 decision packets committed');

    card = setAnalysis({
      status: 'complete',
      endDate: '2026-08-04',
      currentForLatestData: true,
      evaluatedPages: 435,
      totalPages: 435,
      completedDays: 56,
      requiredDays: 56,
      ruleVersion: 'balanced-v2.1',
    });
    expect(card.dataset['kind']).toBe('complete');
    expect(card.textContent).toContain('All 435 current manifest pages');

    card = setAnalysis({ status: 'failed', reason: 'analysis_deadline', currentForLatestData: true });
    expect(card.dataset['kind']).toBe('failed');
    expect(card.textContent).toContain('execution deadline');

    card = setAnalysis({
      status: 'complete',
      endDate: '2026-08-03',
      currentForLatestData: false,
      evaluatedPages: 435,
      totalPages: 435,
    });
    expect(card.dataset['kind']).toBe('stale');
    expect(card.textContent).toContain('behind the latest finalized data');
    expect(card.textContent).toContain('Latest finalized data: Aug 4, 2026');
  });

  it('uses a one-column-ready card and shared controls for the 360px layout contract', async () => {
    await create();
    const root = fixture.nativeElement as HTMLElement;
    const card = root.querySelector('[data-testid="seo-analysis-health"]') as HTMLElement;
    const actions = root.querySelector('.seo-hero__actions') as HTMLElement;

    expect(card.querySelector('.analysis-health__grid')).toBeTruthy();
    expect(actions.querySelectorAll('button.fa-btn')).toHaveSize(3);
    expect(root.querySelector('[data-testid="seo-analyze-button"]')?.classList.contains('fa-btn')).toBeTrue();
  });

  it('labels brand and non-brand metrics as a visible query subset with coverage', async () => {
    await create();
    seoAdmin.getOverview.and.callFake((windowDays, segment) => of({ ...overview, windowDays, segment }));

    component.setSegment('nonbrand');
    fixture.detectChanges();

    const warning = fixture.nativeElement.querySelector('[data-testid="seo-query-subset-warning"]') as HTMLElement;
    expect(warning.textContent?.replace(/\s+/g, ' ').trim()).toContain('Visible query subset · 14.5% coverage');
    expect(warning.textContent).toContain('directionally rather than as property totals');

    component.setSegment('brand');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="seo-query-subset-warning"]')).toBeTruthy();

    component.setSegment('all');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="seo-query-subset-warning"]')).toBeNull();
  });

  it('labels over-counted query and device subsets as inconsistent instead of sufficient', async () => {
    await create();
    component.overview.update((value) => value ? ({
      ...value,
      dataHealth: {
        ...value.dataHealth,
        queryCoveragePercent: 120,
        queryCoverageStatus: 'inconsistent',
        queryCoverageSufficient: false,
        deviceCoveragePercent: 108,
        deviceCoverageStatus: 'inconsistent',
        deviceCoverageSufficient: false,
      },
    }) : value);
    fixture.detectChanges();

    const health = (fixture.nativeElement as HTMLElement).querySelector('[data-testid="seo-data-health"]')?.textContent ?? '';
    expect(health).toContain('120%');
    expect(health).toContain('Inconsistent query subset totals');
    expect(health).toContain('Inconsistent device subset totals');
  });

  it('does not show a previous scope while a segment request is pending or fails', async () => {
    await create();
    const delayedOverview = new Subject<SeoOverview>();
    seoAdmin.getOverview.and.returnValue(delayedOverview);

    component.setSegment('nonbrand');
    fixture.detectChanges();

    expect(component.overview()).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="seo-overview-loading"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="seo-kpi-clicks"]')).toBeNull();

    delayedOverview.error(new Error('unavailable'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="seo-overview-error"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="seo-kpi-clicks"]')).toBeNull();
  });

  it('renders GSC date keys on their calendar day instead of shifting them backward', async () => {
    await create();
    const root = fixture.nativeElement as HTMLElement;
    const health = root.querySelector('[data-testid="seo-data-health"]')?.textContent ?? '';
    const history = root.querySelector('[data-testid="seo-sync-history"]')?.textContent ?? '';
    const trend = root.querySelector('.trend-card__head')?.textContent ?? '';

    expect(health).toContain('Finalized through Aug 4, 2026');
    expect(health).toContain('Next Jun 6, 2026');
    expect(history).toContain('GSC Aug 3, 2026–Aug 4, 2026');
    expect(trend).toContain('Data through Aug 4, 2026');
    expect(component.dateKeyForDisplay('2026-08-04')?.toISOString()).toBe('2026-08-04T00:00:00.000Z');
    expect(component.dateKeyForDisplay('2026-02-31')).toBeNull();
  });

  it('shows explicit loading, empty, and error states', async () => {
    await create({ loading: true, empty: true });
    expect(fixture.nativeElement.querySelector('[data-testid="seo-overview-loading"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="seo-now-empty"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="seo-backlog-empty"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="seo-pages-empty"]')).toBeTruthy();

    TestBed.resetTestingModule();
    await create({ overviewError: true, empty: true });
    expect(fixture.nativeElement.querySelector('[data-testid="seo-overview-error"]')).toBeTruthy();
  });

  it('shows a green all-clear only for a complete current run with every page eligible', async () => {
    await create({ empty: true });
    component.overview.update((value) => value ? ({
      ...value,
      dataHealth: { ...value.dataHealth, stale: false, syncStatus: 'idle' },
      analysis: { ...value.analysis!, proposedActions: 0 },
    }) : value);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const clearState = root.querySelector('[data-testid="seo-now-empty"]') as HTMLElement;

    expect(clearState.dataset['kind']).toBe('clear');
    expect(clearState.dataset['tone']).toBe('clear');
    expect(clearState.textContent).toContain('All 1 pages were eligible and evaluated');

    component.overview.update((value) => value ? ({
      ...value,
      analysis: {
        ...value.analysis!,
        eligiblePages: 0,
        cooldown: { awaitingRecrawl: 0, observing: 1, directional: 0, eligible: 0 },
      },
    }) : value);
    fixture.detectChanges();

    const limitedState = root.querySelector('[data-testid="seo-now-empty"]') as HTMLElement;
    expect(limitedState.dataset['kind']).toBe('limited');
    expect(limitedState.dataset['tone']).toBe('warning');
    expect(limitedState.textContent).toContain('still being watched, not cleared');

    component.overview.update((value) => value ? ({
      ...value,
      analysis: {
        ...value.analysis!,
        eligiblePages: 1,
        cooldown: { awaitingRecrawl: 0, observing: 0, directional: 0, eligible: 1 },
        decisionBlockedPages: 1,
      },
    }) : value);
    fixture.detectChanges();

    const decisionBlockedState = root.querySelector('[data-testid="seo-now-empty"]') as HTMLElement;
    expect(decisionBlockedState.dataset['kind']).toBe('limited');
    expect(decisionBlockedState.dataset['tone']).toBe('warning');
    expect(decisionBlockedState.textContent).toContain('1 page lacks a complete decision');
  });

  it('does not show a green all-clear while proposed actions are missing from an empty queue', async () => {
    await create({ empty: true });
    component.overview.update((value) => value ? ({
      ...value,
      dataHealth: { ...value.dataHealth, stale: false, syncStatus: 'idle' },
      analysis: {
        ...value.analysis!,
        proposedActions: 1,
      },
    }) : value);
    fixture.detectChanges();

    const state = (fixture.nativeElement as HTMLElement)
      .querySelector('[data-testid="seo-now-empty"]') as HTMLElement;
    expect(state.dataset['kind']).toBe('limited');
    expect(state.dataset['tone']).toBe('warning');
    expect(state.textContent).toContain('Action queue needs reconciliation');
    expect(state.textContent).toContain('1 proposed action awaits queue reconciliation');
    expect(state.textContent).toContain('before treating the empty queue as an all-clear');
  });

  it('fails the all-clear closed when stored data is stale or the latest sync failed', async () => {
    await create({ empty: true });
    const root = fixture.nativeElement as HTMLElement;

    let state = root.querySelector('[data-testid="seo-now-empty"]') as HTMLElement;
    expect(state.dataset['kind']).toBe('limited');
    expect(state.dataset['tone']).toBe('warning');
    expect(state.textContent).toContain('Search data is stale');
    expect(state.textContent).toContain('before treating an empty queue as an all-clear');

    component.overview.update((value) => value ? ({
      ...value,
      dataHealth: { ...value.dataHealth, stale: false, syncStatus: 'failed' },
    }) : value);
    fixture.detectChanges();

    state = root.querySelector('[data-testid="seo-now-empty"]') as HTMLElement;
    expect(state.dataset['kind']).toBe('limited');
    expect(state.dataset['tone']).toBe('warning');
    expect(state.textContent).toContain('latest Search Console sync failed');
  });

  it('explains not-ready analysis states without calling a ready window incomplete', async () => {
    await create({ empty: true });
    const root = fixture.nativeElement as HTMLElement;

    component.overview.update((value) => value ? ({
      ...value,
      analysis: {
        status: 'not_ready',
        reason: 'insufficient_contiguous_page_data',
        completedDays: 32,
        requiredDays: 56,
        currentForLatestData: true,
      },
    }) : value);
    fixture.detectChanges();
    let stateText = root.querySelector('[data-testid="seo-now-empty"]')?.textContent ?? '';
    expect(stateText).toContain('Recommendations have not been evaluated yet · 32/56');
    expect(stateText).toContain('Two complete 28-day windows are required');

    component.overview.update((value) => value ? ({
      ...value,
      analysis: {
        status: 'not_ready',
        reason: 'analysis_rule_outdated',
        completedDays: 56,
        requiredDays: 56,
        currentForLatestData: true,
      },
    }) : value);
    fixture.detectChanges();
    stateText = root.querySelector('[data-testid="seo-now-empty"]')?.textContent ?? '';
    expect(stateText).toContain('saved analysis uses an older rule set');
    expect(stateText).not.toContain('Two complete 28-day windows are required');

    component.overview.update((value) => value ? ({
      ...value,
      analysis: {
        status: 'not_ready',
        reason: 'analysis_deadline',
        completedDays: 56,
        requiredDays: 56,
        currentForLatestData: true,
      },
    }) : value);
    fixture.detectChanges();
    stateText = root.querySelector('[data-testid="seo-now-empty"]')?.textContent ?? '';
    expect(stateText).toContain('run reached its evaluation time limit');
    expect(stateText).not.toContain('Two complete 28-day windows are required');

    component.overview.update((value) => value ? ({
      ...value,
      analysis: {
        status: 'not_ready',
        reason: 'not_run',
        completedDays: 56,
        requiredDays: 56,
        currentForLatestData: true,
      },
    }) : value);
    fixture.detectChanges();
    stateText = root.querySelector('[data-testid="seo-now-empty"]')?.textContent ?? '';
    expect(stateText).toContain('data window is ready');
    expect(stateText).not.toContain('Two complete 28-day windows are required');
  });

  it('explains backend fail-closed readiness reasons instead of claiming analysis is missing', async () => {
    await create({ empty: true });
    const root = fixture.nativeElement as HTMLElement;
    const setReason = (
      reason: string,
      dataHealth: Partial<SeoOverview['dataHealth']>,
    ): string => {
      component.overview.update((value) => value ? ({
        ...value,
        dataHealth: { ...value.dataHealth, ...dataHealth },
        analysis: {
          ...value.analysis!,
          status: 'not_ready',
          reason,
          completedDays: 56,
          requiredDays: 56,
          currentForLatestData: true,
        },
      }) : value);
      fixture.detectChanges();
      const state = root.querySelector('[data-testid="seo-now-empty"]') as HTMLElement;
      expect(state.dataset['kind']).toBe('not_ready');
      expect(state.dataset['tone']).toBe('warning');
      return state.textContent ?? '';
    };

    let stateText = setReason('finalized_data_stale', { stale: true, syncStatus: 'idle' });
    expect(stateText).toContain('finalized Search Console data is stale');
    expect(stateText).not.toContain('no complete current page evaluation');

    stateText = setReason('sync_unhealthy', { stale: false, syncStatus: 'failed' });
    expect(stateText).toContain('latest Search Console sync failed');
    expect(stateText).not.toContain('no complete current page evaluation');

    stateText = setReason('sync_unhealthy', { stale: false, syncStatus: 'running' });
    expect(stateText).toContain('Search Console sync is still running');

    stateText = setReason('manifest_changed_since_analysis', { stale: false, syncStatus: 'idle' });
    expect(stateText).toContain('page inventory changed after the saved analysis');
    expect(stateText).not.toContain('no complete current page evaluation');

    stateText = setReason('page_assessments_incomplete', { stale: false, syncStatus: 'idle' });
    expect(stateText).toContain('page decisions changed or were invalidated');
    expect(stateText).toContain('re-evaluate every current page');
  });

  it('explains every production marker readiness failure without exposing deployment details', async () => {
    await create({ empty: true });
    const root = fixture.nativeElement as HTMLElement;
    const cases = [
      ['production_marker_unavailable', 'build marker is unavailable'],
      ['production_marker_invalid', 'build marker is invalid'],
      ['production_marker_source_mismatch', 'Deploy the frontend and backend from the same manifest commit'],
      ['production_marker_contract_mismatch', 'Deploy compatible frontend and backend builds from the same manifest commit'],
      ['production_marker_not_production', 'not from the production frontend'],
      ['production_marker_identity_missing', 'missing required deployment identity'],
      ['production_marker_not_ready', 'not verified yet'],
    ] as const;

    for (const [reason, expectedDetail] of cases) {
      component.overview.update((value) => value ? ({
        ...value,
        dataHealth: { ...value.dataHealth, stale: false, syncStatus: 'idle' },
        analysis: {
          status: 'not_ready',
          reason,
          completedDays: 56,
          requiredDays: 56,
          evaluatedPages: 0,
          committedAssessmentPages: 0,
          totalPages: 435,
          currentForLatestData: true,
        },
      }) : value);
      fixture.detectChanges();

      const emptyState = root.querySelector('[data-testid="seo-now-empty"]') as HTMLElement;
      const health = root.querySelector('[data-testid="seo-analysis-health"]') as HTMLElement;
      const emptyText = emptyState.textContent?.replace(/\s+/g, ' ').trim() ?? '';
      const healthText = health.textContent?.replace(/\s+/g, ' ').trim() ?? '';

      expect(emptyState.dataset['kind']).toBe('not_ready');
      expect(emptyState.dataset['tone']).toBe('warning');
      expect(emptyText).toContain('Production frontend verification is required');
      expect(emptyText).toContain(expectedDetail);
      expect(emptyText).toContain('No SEO decisions were inferred');
      expect(health.dataset['kind']).toBe('not_ready');
      expect(healthText).toContain('Not verified');
      expect(healthText).toContain(expectedDetail);
      expect(healthText).toContain('No SEO decisions were inferred');
      expect(`${emptyText} ${healthText}`).not.toContain(reason);
      expect(`${emptyText} ${healthText}`).not.toMatch(/\b[a-f0-9]{32,}\b/i);
      expect(`${emptyText} ${healthText}`).not.toMatch(/\bdpl_[a-z0-9_-]+\b/i);
    }
  });

  it('renders mutually exclusive running, not-ready, partial, failed, and stale recommendation states', async () => {
    await create({ empty: true });
    const root = fixture.nativeElement as HTMLElement;

    component.overview.update((value) => value ? ({
      ...value,
      analysis: { status: 'running', evaluatedPages: 2, totalPages: 10 },
    }) : value);
    fixture.detectChanges();
    expect(root.querySelector('[data-testid="seo-now-empty"]')?.getAttribute('data-kind')).toBe('running');
    expect(root.querySelector('[data-testid="seo-now-empty"]')?.textContent).toContain('2/10 decision packets committed');

    component.overview.update((value) => value ? ({
      ...value,
      analysis: {
        status: 'not_ready',
        completedDays: 32,
        requiredDays: 56,
        currentForLatestData: true,
      },
    }) : value);
    fixture.detectChanges();
    expect(root.querySelector('[data-testid="seo-now-empty"]')?.textContent).toContain('32/56');
    expect(root.querySelector('[data-testid="seo-now-empty"]')?.getAttribute('data-kind')).toBe('not_ready');

    component.overview.update((value) => value ? ({
      ...value,
      analysis: {
        status: 'partial',
        endDate: '2026-08-04',
        currentForLatestData: true,
        evaluatedPages: 4,
        totalPages: 10,
      },
    }) : value);
    fixture.detectChanges();
    expect(root.querySelector('[data-testid="seo-now-empty"]')?.textContent).toContain('4/10 decision packets committed');

    component.overview.update((value) => value ? ({
      ...value,
      analysis: { status: 'failed', currentForLatestData: true },
    }) : value);
    fixture.detectChanges();
    expect(root.querySelector('[data-testid="seo-now-empty"]')?.getAttribute('data-tone')).toBe('error');

    component.overview.update((value) => value ? ({
      ...value,
      analysis: {
        status: 'complete',
        endDate: '2026-08-03',
        currentForLatestData: false,
        evaluatedPages: 1,
        totalPages: 1,
        eligiblePages: 1,
      },
    }) : value);
    fixture.detectChanges();
    expect(root.querySelector('[data-testid="seo-now-empty"]')?.getAttribute('data-kind')).toBe('stale');
    expect(root.querySelectorAll('[data-testid="seo-now-empty"]')).toHaveSize(1);
  });

  it('renders answer-first page assessment, baseline quality, semantic clusters, and reconciled subsets', async () => {
    await create();
    component.openPage(page.pageKey);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    const assessment = root.querySelector('[data-testid="seo-page-assessment"]') as HTMLElement;
    expect(assessment.textContent).toContain('Observing a recent title or content change');
    expect(assessment.textContent).toContain('Directional');
    expect(assessment.textContent).toContain('Sep 4, 2026');

    const lineage = root.querySelector('[data-testid="seo-page-lineage"]') as HTMLElement;
    expect(lineage).toBeTruthy();
    expect(lineage.querySelectorAll('.lineage-step')).toHaveSize(4);
    expect(lineage.textContent).toContain('Version a1b2c3d4e5f6');
    expect(lineage.textContent).toContain('Manifest manifest-2026.08.0');
    expect(lineage.textContent).toContain('Fingerprint seo-page-fingerprints.v1');
    expect(lineage.textContent).toContain('Partial fingerprint evidence');
    expect(lineage.textContent).toContain('Only part of the material page was observed');
    expect(lineage.textContent).toContain('Client only runtime content not observed');
    expect(lineage.textContent).toContain('Upper bound');
    expect(lineage.textContent).toContain('Deployment dpl_frontendatla');
    expect(lineage.textContent).toContain('Crawl confirmed after production');
    expect(lineage.textContent).toContain('0/28 clean finalized days');
    expect(lineage.textContent).toContain('Title');
    expect(lineage.textContent).toContain('Main content');
    expect(lineage.textContent).toContain('Heading outline');
    expect(lineage.textContent).toContain('may have gone live earlier');
    expect(lineage.textContent).toContain('Assessment rule · balanced-v2.1');
    expect(lineage.textContent).toContain('Input schema · page-assessment-input.v2');
    expect(lineage.textContent).toContain('Semantic schema · semantic-clusters.v2');
    expect(lineage.textContent).toContain('Assessment matches this page version');
    expect(lineage.querySelectorAll('[data-testid="seo-lineage-history"] li')).toHaveSize(2);
    expect(lineage.textContent).toContain('Technical checks remain active during performance cooldowns');
    expect(lineage.textContent).toContain('Git corroboration only');
    expect(lineage.textContent).toContain('Rendered application source changed');
    expect(lineage.textContent).toContain('Frontend · 2');
    expect(lineage.textContent).toContain('2 changed files');
    expect(lineage.textContent).toContain('does not prove when that version reached production or Google');
    expect(lineage.textContent).not.toContain('dpl_frontendatlas_20260803');
    expect(lineage.textContent).not.toContain('abcdef1234567890fedcba');
    expect(lineage.textContent).not.toContain('angular http unsubscribe exact raw query');

    const baseline = root.querySelector('[data-testid="seo-page-baseline"]') as HTMLElement;
    expect(baseline.textContent).toContain('Insufficient quality');
    expect(baseline.textContent).toContain('9');
    expect(baseline.textContent).toContain('10');

    const clusters = root.querySelector('[data-testid="seo-page-semantic-clusters"]') as HTMLElement;
    expect(clusters.textContent).toContain('HTTP cancellation');
    expect(clusters.textContent).toContain('Official reference');
    expect(clusters.textContent).toContain('61.4%');
    expect(clusters.textContent).toContain('98.7%');

    const reconciliation = root.querySelector('[data-testid="seo-page-reconciliation"]') as HTMLElement;
    expect(reconciliation.textContent).toContain('2,519');
    expect(reconciliation.textContent).toContain('29.7%');
    expect(reconciliation.querySelectorAll('.source-pill--subset')).toHaveSize(2);
    expect(reconciliation.textContent).toContain('Non-authoritative');
    expect(root.textContent).toContain('Inspect page');
  });

  it('keeps legacy Page Evidence usable without inventing missing lineage', async () => {
    await create();
    seoAdmin.getPage.and.returnValue(of({
      ...page,
      lineage: {
        currentVersion: null,
        gitCandidate: {
          authority: 'corroborating_only',
          status: 'unavailable',
          scope: 'unavailable',
          confidence: 'unavailable',
          changedFileCount: 0,
          returnedEntryCount: 0,
          entryLimit: 0,
          truncated: false,
          changeTypes: {},
          areas: {},
          candidateSignals: [],
          signals: [],
        },
        timeline: [],
        detectorStates: {
          ctr_snippet: { affected: false, cooldown: { state: 'eligible', cleanFinalizedDays: null } },
          intent_mismatch: { affected: false, cooldown: { state: 'eligible', cleanFinalizedDays: null } },
          content_decay: { affected: false, cooldown: { state: 'eligible', cleanFinalizedDays: null } },
          cannibalization: { affected: false, cooldown: { state: 'eligible', cleanFinalizedDays: null } },
          internal_link: { affected: false, cooldown: { state: 'eligible', cleanFinalizedDays: null } },
          technical_indexing: { affected: false, cooldown: { state: 'eligible', cleanFinalizedDays: null } },
        },
        assessmentInput: {
          version: null,
          hash: null,
          pageVersionKey: null,
          currentHash: null,
          currentPageVersionKey: null,
          valid: true,
          current: false,
        },
      },
    }));

    component.openPage(page.pageKey);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const unavailable = root.querySelector('[data-testid="seo-page-lineage-unavailable"]') as HTMLElement;

    expect(unavailable).toBeTruthy();
    expect(unavailable.textContent).toContain('Lineage is unavailable for this legacy snapshot');
    expect(unavailable.textContent).toContain('will not guess');
    expect(root.querySelector('[data-testid="seo-page-lineage"]')).toBeNull();
    expect(root.querySelector('.cooldown-readout')?.textContent).toContain('Eligible for a performance decision');
    expect(root.querySelector('[data-testid="seo-page-assessment"]')?.textContent).toContain('No scheduled review');
  });

  it('normalizes nested Git candidate aliases and renders only aggregate evidence', async () => {
    await create();
    seoAdmin.getPage.and.returnValue(of({
      ...page,
      lineage: {
        ...page.lineage!,
        gitCandidate: {
          authority: 'corroborating_only',
          commitSha: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
          diffBaseSha: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
          candidate: {
            status: 'available',
            diffBaseKind: 'previous_successful_deployment',
            diffBaseConfidence: 'high',
            diff: {
              changedFileCount: 3,
              returnedEntryCount: 3,
              entryLimit: 24,
              areaCounts: { cdn: 2, frontend: 1 },
              changeTypeCounts: { modified: 3 },
              changeSignals: ['content_source_changed'],
              entries: [{ path: 'cdn/questions/private-raw-path.json' }],
              rawBody: 'private rendered body payload',
              rawQuery: 'private exact search query',
            } as any,
          },
        },
        currentVersion: {
          ...page.lineage!.currentVersion!,
          gitCandidate: null,
          production: {
            ...page.lineage!.currentVersion!.production!,
            gitCommitSha: null,
            gitDiffBaseSha: null,
          },
        },
      },
    }));

    component.openPage(page.pageKey);
    fixture.detectChanges();
    const git = (fixture.nativeElement as HTMLElement).querySelector('.lineage-git') as HTMLElement;

    expect(git.textContent).toContain('Commit bbbbbbbbbbbb');
    expect(git.textContent).toContain('Base aaaaaaaaaaaa');
    expect(git.textContent).toContain('Content source changed');
    expect(git.textContent).toContain('Cdn · 2');
    expect(git.textContent).toContain('Frontend · 1');
    expect(git.textContent).toContain('3 changed files');
    expect(git.textContent).not.toContain('cdn/questions/private-raw-path.json');
    expect(git.textContent).not.toContain('private rendered body payload');
    expect(git.textContent).not.toContain('private exact search query');
    expect(git.textContent).not.toContain('bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb');
    expect(git.textContent).not.toContain('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
  });

  it('uses fresh detector cooldowns instead of a stale aggregate assessment cooldown', async () => {
    await create();
    const eligibleCooldown = { state: 'eligible' as const, cleanFinalizedDays: 28 };
    const eligiblePage: SeoPageDetail = {
      ...page,
      assessment: {
        ...page.assessment!,
        verdict: 'observing_change',
        nextReviewDate: '2026-09-04',
        cooldown: {
          ...page.assessment!.cooldown!,
          state: 'observing',
          cleanFinalizedDays: 2,
          nextReviewDate: '2026-09-04',
        },
      },
      lineage: {
        ...page.lineage!,
        detectorStates: Object.fromEntries(Object.entries(page.lineage!.detectorStates!).map(([detector, state]) => [
          detector,
          { ...state, cooldown: eligibleCooldown },
        ])),
      },
    };
    seoAdmin.getPage.and.returnValue(of(eligiblePage));

    component.openPage(page.pageKey);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(component.lineageCooldown(eligiblePage)?.state).toBe('eligible');
    expect(component.assessmentNextReviewDate(eligiblePage)).toBeNull();
    expect(root.querySelector('[data-testid="seo-page-assessment"] h3')?.textContent).toContain('Keep watching');
    expect(root.querySelector('[data-testid="seo-page-assessment"]')?.textContent).toContain('No scheduled review');
    expect(root.querySelector('[data-testid="seo-page-lineage"]')?.textContent).toContain('28/28 clean finalized days');
  });

  it('does not call an assessment current when only the input validity flag is true', async () => {
    await create();
    seoAdmin.getPage.and.returnValue(of({
      ...page,
      lineage: {
        ...page.lineage!,
        assessmentInput: {
          ...page.lineage!.assessmentInput!,
          valid: true,
          current: false,
        },
      },
    }));

    component.openPage(page.pageKey);
    fixture.detectChanges();
    const pill = (fixture.nativeElement as HTMLElement).querySelector('.lineage-input-pill') as HTMLElement;

    expect(pill.getAttribute('data-current')).toBe('false');
    expect(pill.textContent).toContain('Assessment is not current for this page version');
  });

  it('labels a retained split-deploy packet as prior evidence instead of a current assessment', async () => {
    await create();
    seoAdmin.getPage.and.returnValue(of({
      ...page,
      analysis: {
        status: 'not_ready',
        reason: 'production_marker_source_mismatch',
        currentForLatestData: false,
      },
      assessment: {
        ...page.assessment!,
        currentForLatestData: false,
      },
      lineage: {
        ...page.lineage!,
        assessmentInput: {
          ...page.lineage!.assessmentInput!,
          valid: true,
          current: false,
        },
      },
    }));

    component.openPage(page.pageKey);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const freshness = root.querySelector('[data-testid="seo-page-assessment-freshness"]') as HTMLElement;
    const note = root.querySelector('[data-testid="seo-page-assessment-stale-note"]') as HTMLElement;

    expect(freshness.textContent).toContain('Prior assessment');
    expect(freshness.textContent).not.toContain('Current assessment');
    expect(note.textContent).toContain('does not match the backend manifest');
    expect(root.querySelector('[data-testid="seo-page-assessment"] h3')?.textContent)
      .toContain('Latest search data has not been assessed yet');
  });

  it('does not infer crawl confirmation from crawlConfirmedAt in a timeline fallback', async () => {
    await create();
    seoAdmin.getPage.and.returnValue(of({
      ...page,
      lineage: {
        ...page.lineage!,
        currentVersion: null,
        timeline: [{
          versionKey: 'fallback-version-1234567890',
          observedAt: '2026-08-03T10:00:00.000Z',
          effectiveAt: '2026-08-03T12:00:00.000Z',
          precision: 'upper_bound',
          source: 'runtime_observed',
          changedComponents: ['mainContent'],
          crawlConfirmedAt: '2026-08-04T01:09:35.000Z',
        }],
      },
    }));

    component.openPage(page.pageKey);
    fixture.detectChanges();
    const lineage = (fixture.nativeElement as HTMLElement).querySelector('[data-testid="seo-page-lineage"]') as HTMLElement;

    expect(lineage.textContent).toContain('Crawl sequence unavailable');
    expect(lineage.textContent).toContain('Last crawl unavailable');
    expect(lineage.textContent).not.toContain('Crawl confirmed after production');

    const fallbackPage = component.selectedPage()!;
    const beforeProduction: SeoPageDetail = {
      ...fallbackPage,
      lineage: {
        ...fallbackPage.lineage!,
        timeline: [{
          ...fallbackPage.lineage!.timeline![0],
          googleCrawlAt: '2026-08-03T11:59:59.000Z',
        }],
      },
    };
    const afterProduction: SeoPageDetail = {
      ...beforeProduction,
      lineage: {
        ...beforeProduction.lineage!,
        timeline: [{
          ...beforeProduction.lineage!.timeline![0],
          googleCrawlAt: '2026-08-03T12:00:01.000Z',
        }],
      },
    };

    expect(component.currentLineageVersion(beforeProduction)?.crawl?.confirmedAfterProduction).toBeFalse();
    expect(component.currentLineageVersion(afterProduction)?.crawl?.confirmedAfterProduction).toBeTrue();
  });

  it('marks unavailable fingerprint evidence as unknown and states the limitation', async () => {
    await create();
    seoAdmin.getPage.and.returnValue(of({
      ...page,
      lineage: {
        ...page.lineage!,
        currentVersion: {
          ...page.lineage!.currentVersion!,
          fingerprintEvidence: {
            source: 'manifest_only',
            prerenderedAvailable: false,
            limitations: ['prerender_output_unavailable'],
            statuses: {
              seoMetadata: 'unavailable',
              mainContent: 'unavailable',
            },
          },
        },
      },
    }));

    component.openPage(page.pageKey);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const versionStep = root.querySelector('.lineage-step') as HTMLElement;
    const fingerprint = root.querySelector('[data-testid="seo-fingerprint-evidence"]') as HTMLElement;

    expect(versionStep.getAttribute('data-state')).toBe('unknown');
    expect(fingerprint.textContent).toContain('Fingerprint evidence unavailable');
    expect(fingerprint.textContent).toContain('cannot prove a material page change');
    expect(fingerprint.textContent).toContain('Prerender output unavailable');
  });

  it('uses compact reflow-ready lineage groups without introducing owner navigation', async () => {
    await create();
    component.openPage(page.pageKey);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const lineage = root.querySelector('[data-testid="seo-page-lineage"]') as HTMLElement;

    expect(lineage.querySelector('.lineage-timeline')).toBeTruthy();
    expect(lineage.querySelector('.lineage-detector-grid')).toBeTruthy();
    expect(lineage.querySelectorAll('.lineage-detector').length).toBeGreaterThan(0);
    expect(root.querySelector('a[href="/admin/seo"]')).toBeNull();
  });

  it('distinguishes an observed zero subset from unavailable reconciliation data', async () => {
    await create();
    seoAdmin.getPage.and.returnValue(of({
      ...page,
      reconciliation: {
        ...page.reconciliation!,
        visibleDeviceSubset: {
          ...page.reconciliation!.visibleDeviceSubset,
          metrics: null,
          coveragePercent: null,
          fullWindowLowerBoundPercent: null,
          status: 'unavailable',
          partitionWindow: {
            completedDays: 0,
            requiredDays: 28,
            missingDays: 28,
            truncatedDays: 0,
            complete: false,
          },
        },
      },
    }));

    component.openPage(page.pageKey);
    fixture.detectChanges();
    const cards = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('.reconciliation-card'),
    ) as HTMLElement[];

    expect(cards[1].textContent).toContain('Clicks0');
    expect(cards[1].textContent).not.toContain('ClicksUnavailable');
    expect(cards[2].textContent).toContain('ClicksUnavailable');
    expect(cards[2].textContent).toContain('28 missing');
  });

  it('labels incomplete finalized windows instead of presenting them as full comparisons', async () => {
    await create({ partialWindow: true });
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('[data-testid="seo-partial-window-warning"]')?.textContent).toContain('12/28 finalized days');
    expect(root.querySelector('[data-testid="seo-kpi-clicks"]')?.textContent).toContain('partial');
    expect(root.querySelector('[data-testid="seo-trend-sparse"]')?.textContent).toContain('10 clicks');
    expect(Array.from(root.querySelectorAll('[data-testid="seo-trend-sparse"] time')).map((node) => node.textContent?.trim()))
      .toEqual(['Aug 3', 'Aug 4']);
  });

  it('withholds page metrics when the exact 28-day page window is incomplete', async () => {
    await create({ partialPageWindow: true });
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('[data-testid="seo-pages-partial-window"]')?.textContent).toContain('12/28');
    expect(root.querySelector('[data-testid="seo-pages-list"]')?.textContent).not.toContain('125 impressions');
    expect(component.pages()[0].impressions).toBeUndefined();
  });

  it('defaults to all pages and applies the unconfirmed-baseline filter on demand', async () => {
    await create();
    expect(seoAdmin.getPages).toHaveBeenCalledWith('', null, 30, undefined);
    component.setStatusFilter('measuring');
    expect(seoAdmin.getActions).toHaveBeenCalledWith(jasmine.objectContaining({
      queue: 'backlog',
      status: 'measuring',
    }));

    component.setPageIntentFilter(true);
    expect(seoAdmin.getPages).toHaveBeenCalledWith('', null, 30, false);
  });

  it('refreshes every dashboard section after a completed manual sync', async () => {
    await create();
    const pageCalls = seoAdmin.getPages.calls.count();
    const nowCalls = seoAdmin.getActions.calls.count();

    component.requestSync();
    fixture.detectChanges();

    expect(seoAdmin.getPages.calls.count()).toBe(pageCalls + 1);
    expect(seoAdmin.getActions.calls.count()).toBe(nowCalls + 2);
    expect(component.syncBusy()).toBeFalse();
    expect(fixture.nativeElement.querySelector('[data-testid="seo-sync-notice"]')?.textContent)
      .toContain('2 finalized GSC dates synchronized');
  });

  it('runs analysis once, locks conflicting controls, and refreshes every dependent surface', async () => {
    await create();
    const response = new Subject<SeoAnalyzeResponse>();
    seoAdmin.requestAnalysis.and.returnValue(response);
    const overviewCalls = seoAdmin.getOverview.calls.count();
    const actionCalls = seoAdmin.getActions.calls.count();
    const pageCalls = seoAdmin.getPages.calls.count();
    const syncRunCalls = seoAdmin.getSyncRuns.calls.count();

    component.requestAnalysis();
    component.requestAnalysis();
    fixture.detectChanges();

    const analyzeButton = fixture.nativeElement.querySelector('[data-testid="seo-analyze-button"]') as HTMLButtonElement;
    const syncButton = fixture.nativeElement.querySelector('[data-testid="seo-sync-button"]') as HTMLButtonElement;
    expect(seoAdmin.requestAnalysis).toHaveBeenCalledTimes(1);
    expect(component.analysisBusy()).toBeTrue();
    expect(analyzeButton.disabled).toBeTrue();
    expect(syncButton.disabled).toBeTrue();

    component.requestSync();
    expect(seoAdmin.requestSync).not.toHaveBeenCalled();

    response.next({
      accepted: false,
      runId: 'analysis-2',
      status: 'not_ready',
      analysis: {
        status: 'not_ready',
        reason: 'analysis_deadline',
        completedDays: 56,
        requiredDays: 56,
      },
    });
    response.complete();
    fixture.detectChanges();

    expect(component.analysisBusy()).toBeFalse();
    expect(seoAdmin.getOverview.calls.count()).toBe(overviewCalls + 1);
    expect(seoAdmin.getActions.calls.count()).toBe(actionCalls + 2);
    expect(seoAdmin.getPages.calls.count()).toBe(pageCalls + 1);
    expect(seoAdmin.getSyncRuns.calls.count()).toBe(syncRunCalls + 1);
    const notice = fixture.nativeElement.querySelector('[data-testid="seo-analysis-notice"]') as HTMLElement;
    expect(notice.classList.contains('seo-alert--warning')).toBeTrue();
    expect(notice.textContent).toContain('evidence window is not ready');
    expect(notice.textContent).toContain('No recommendations were inferred');
    expect(notice.textContent).toContain('not_ready · analysis_deadline · Run analysis-2');
  });

  it('disables Analyze now and explains a stale backend contract', async () => {
    await create();
    manualAnalysisAvailable.set(false);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('[data-testid="seo-analyze-button"]') as HTMLButtonElement;
    const warning = fixture.nativeElement.querySelector(
      '[data-testid="seo-analysis-compatibility-warning"]',
    ) as HTMLElement;

    expect(button.disabled).toBeTrue();
    expect(warning.textContent).toContain('Analyze now needs the current backend');
    expect(warning.textContent).toContain('Restart the local backend');

    button.click();
    expect(seoAdmin.requestAnalysis).not.toHaveBeenCalled();
  });

  it('rechecks the backend capability without requiring a page reload', async () => {
    await create();
    manualAnalysisAvailable.set(false);
    seoAdmin.checkAccess.and.callFake(() => {
      manualAnalysisAvailable.set(true);
      return of({
        allowed: true,
        enabled: true,
        capabilities: { contractVersion: 'seo-admin.v2', manualAnalysis: true },
      });
    });
    fixture.detectChanges();

    const recheck = fixture.nativeElement.querySelector(
      '[data-testid="seo-analysis-capability-recheck"]',
    ) as HTMLButtonElement;
    recheck.click();
    fixture.detectChanges();

    expect(seoAdmin.checkAccess).toHaveBeenCalledOnceWith(true);
    expect(component.analysisCapabilityChecking()).toBeFalse();
    expect(component.announcement()).toContain('Analyze now is available');
    expect(fixture.nativeElement.querySelector('[data-testid="seo-analysis-compatibility-warning"]')).toBeNull();
    expect((fixture.nativeElement.querySelector('[data-testid="seo-analyze-button"]') as HTMLButtonElement).disabled).toBeFalse();
  });

  it('keeps the dashboard route and gives a specific message when Analyze is missing', async () => {
    await create();
    seoAdmin.requestAnalysis.and.returnValue(throwError(() => ({
      status: 404,
      error: 'Cannot POST /api/admin/seo/analyze',
    })));

    component.requestAnalysis();
    fixture.detectChanges();

    const notice = fixture.nativeElement.querySelector('[data-testid="seo-analysis-notice"]') as HTMLElement;
    expect(notice.textContent).toContain('Analyze now is unavailable in the running backend');
    expect(notice.textContent).toContain('restart the local backend');
    expect(router.navigate).not.toHaveBeenCalled();
    expect(component.overview()).toBeTruthy();
  });

  it('shows a bounded analysis error diagnostic and refreshes persisted run health', async () => {
    await create();
    const overviewCalls = seoAdmin.getOverview.calls.count();
    seoAdmin.requestAnalysis.and.returnValue(throwError(() => ({
      status: 500,
      error: {
        code: 'SEO_ANALYSIS_FAILED',
        error: 'Mongo socket failed at internal-stack.ts:441',
      },
    })));

    component.requestAnalysis();
    fixture.detectChanges();

    expect(component.analysisBusy()).toBeFalse();
    expect(component.overview()).toBeTruthy();
    expect(seoAdmin.getOverview.calls.count()).toBe(overviewCalls + 1);
    const notice = fixture.nativeElement.querySelector('[data-testid="seo-analysis-notice"]') as HTMLElement;
    expect(notice.getAttribute('role')).toBe('alert');
    expect(notice.textContent).toContain('HTTP 500 · SEO_ANALYSIS_FAILED');
    expect(notice.textContent).toContain('No complete current analysis is available');
    expect(notice.textContent).not.toContain('Mongo socket');
    expect(notice.textContent).not.toContain('internal-stack');
  });

  it('reports disabled analysis safely without displaying the backend message', async () => {
    await create();
    seoAdmin.requestAnalysis.and.returnValue(throwError(() => ({
      status: 503,
      error: {
        status: 'disabled',
        message: 'Secret environment detail that must not be rendered',
      },
    })));

    component.requestAnalysis();
    fixture.detectChanges();

    const notice = fixture.nativeElement.querySelector('[data-testid="seo-analysis-notice"]') as HTMLElement;
    expect(notice.textContent).toContain('HTTP 503 · disabled');
    expect(notice.textContent).not.toContain('Secret environment detail');
  });

  it('labels manual analysis runs separately from sync requests', async () => {
    await create();
    component.syncRuns.update((runs) => [{
      ...runs[0],
      trigger: 'manual_analysis',
      datesAttempted: [],
      datesCompleted: [],
      rowsWritten: 0,
    }]);
    fixture.detectChanges();

    const history = fixture.nativeElement.querySelector('[data-testid="seo-sync-history"]') as HTMLElement;
    expect(history.textContent).toContain('Analysis ·');
    expect(history.textContent).toContain('Decision-only run');
    expect(history.textContent).toContain('No GSC rows');
    expect(history.textContent).not.toContain('Manual ·');
    expect(history.textContent).not.toContain('No date completed');
  });

  it('returns the manual control to latest-sync mode after initial history completes', async () => {
    await create();
    component.overview.update((value) => value ? ({
      ...value,
      dataHealth: {
        ...value.dataHealth,
        backfill: {
          completedDays: 90,
          expectedDays: 90,
          percent: 100,
          nextDate: null,
          complete: true,
        },
      },
    }) : value);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="seo-sync-button"]')?.textContent).toContain('Sync now');
  });

  it('sends an optimistic version when approving an action', async () => {
    await create();
    component.openAction(action);
    component.transition('approve');

    expect(seoAdmin.transitionAction).toHaveBeenCalledWith('action-1', jasmine.objectContaining({
      event: 'approve',
      expectedVersion: 1,
    }));
    expect(component.selectedAction()?.status).toBe('approved');
    expect(component.canTransition('implementation_pending', 'mark_implemented')).toBeFalse();
  });

  it('never leaves the action and page focus traps open together', async () => {
    await create();
    component.openAction(action);
    expect(component.actionDialogOpen()).toBeTrue();

    component.openPage(action.pageKey);
    expect(component.actionDialogOpen()).toBeFalse();
    expect(component.pageDialogOpen()).toBeTrue();

    component.openAction(action);
    expect(component.pageDialogOpen()).toBeFalse();
    expect(component.actionDialogOpen()).toBeTrue();
  });

  it('keeps owner evidence dialogs modal, escape-closeable, and focus trapped', async () => {
    await create();
    const evidenceDialogs = fixture.debugElement
      .queryAll(By.directive(FaDialogComponent))
      .map((debugElement) => debugElement.componentInstance as FaDialogComponent)
      .filter((dialog) => dialog.header === 'Review SEO action' || dialog.header === 'Page evidence');

    expect(evidenceDialogs).toHaveSize(2);
    for (const dialog of evidenceDialogs) {
      expect(dialog.modal).toBeTrue();
      expect(dialog.closable).toBeTrue();
      expect(dialog.closeOnEscape).toBeTrue();
      expect(dialog.focusOnShow).toBeTrue();
      expect(dialog.focusTrap).toBeTrue();
    }
  });

  it('requires a date before saving a historical manual action', async () => {
    await create();
    component.manualForm = {
      url: 'https://frontendatlas.com/javascript/coding',
      type: 'manual',
      title: 'Previous title change',
      hypothesis: 'The prior title was expected to improve CTR.',
      changeSummary: 'Changed the title.',
      implementedAt: '',
      historicalUnverified: true,
    };

    component.submitManualAction();
    expect(component.manualError()).toContain('implemented date');
    expect(seoAdmin.createAction).not.toHaveBeenCalled();
  });

  it('purges rendered owner data immediately when the authenticated session ends', async () => {
    await create();
    expect(component.overview()).toBeTruthy();
    expect(component.nowActions()).toHaveSize(1);

    authUser.set(null);
    fixture.detectChanges();

    expect(component.overview()).toBeNull();
    expect(component.nowActions()).toEqual([]);
    expect(component.backlogActions()).toEqual([]);
    expect(component.pages()).toEqual([]);
    expect(component.pageMetricWindow()).toBeNull();
    expect(component.selectedAction()).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login'], {
      queryParams: { redirectTo: '/admin/seo' },
    });
  });

  it('purges owner data when the browser session switches to a different admin', async () => {
    await create();

    authUser.set({ _id: 'other-admin', role: 'admin', email: 'other@example.com' });
    ownerAllowed.set(false);
    fixture.detectChanges();

    expect(component.overview()).toBeNull();
    expect(component.nowActions()).toEqual([]);
    expect(router.navigate).toHaveBeenCalledWith(['/404']);
  });

  it('purges rendered data and hides the route when an SEO request revokes owner capability', async () => {
    await create();
    component.openAction(action);
    expect(component.selectedAction()).toBeTruthy();
    router.navigate.calls.reset();
    seoAdmin.getOverview.and.callFake(() => new Observable<SeoOverview>((subscriber) => {
      // Mirrors SeoAdminService's single 401/403 response path: capability is
      // marked as a completed denial before the original request error escapes.
      ownerAllowed.set(false);
      accessChecked.set(true);
      subscriber.error({ status: 403 });
    }));

    component.refreshDashboard();
    fixture.detectChanges();

    expect(component.overview()).toBeNull();
    expect(component.nowActions()).toEqual([]);
    expect(component.backlogActions()).toEqual([]);
    expect(component.pages()).toEqual([]);
    expect(component.selectedAction()).toBeNull();
    expect(component.actionDialogOpen()).toBeFalse();
    expect(component.pageDialogOpen()).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/404']);
  });

  it('waits for an in-flight owner-access refresh before treating it as a denial', async () => {
    await create();
    router.navigate.calls.reset();

    accessChecked.set(false);
    ownerAllowed.set(false);
    fixture.detectChanges();

    expect(component.overview()).toBeNull();
    expect(component.nowActions()).toEqual([]);
    expect(router.navigate).not.toHaveBeenCalled();

    accessChecked.set(true);
    fixture.detectChanges();

    expect(router.navigate).toHaveBeenCalledWith(['/404']);
  });

  it('does not let a completed transition overwrite a newly opened action', async () => {
    await create();
    const transitionResult = new Subject<SeoAction>();
    const secondAction = { ...action, id: 'action-2', pageKey: 'page-2', title: 'Second action' };
    seoAdmin.transitionAction.and.returnValue(transitionResult);
    seoAdmin.getAction.and.callFake((id) => of(id === secondAction.id ? secondAction : action));

    component.openAction(action);
    component.transition('approve');
    component.openAction(secondAction);
    transitionResult.next({ ...action, status: 'approved', version: 2 });
    transitionResult.complete();

    expect(component.selectedAction()?.id).toBe(secondAction.id);
    expect(component.transitionBusy()).toBeFalse();
  });

  it('explains the next step after repeated snippet experiments fail', async () => {
    await create();
    const suppressed = {
      ...action,
      status: 'closed' as const,
      verdict: 'failed' as const,
      suppressedUntil: '2099-11-05T00:00:00.000Z',
      suppressionGuidance: 'Pause title changes and review intent or result format.',
    };
    seoAdmin.getAction.and.returnValue(of(suppressed));

    component.openAction(suppressed);
    fixture.detectChanges();

    const notice = (fixture.nativeElement as HTMLElement).querySelector('[data-testid="seo-snippet-suppression"]');
    expect(notice?.textContent).toContain('Further snippet experiments are paused');
    expect(notice?.textContent).toContain('review intent or result format');
  });
});
