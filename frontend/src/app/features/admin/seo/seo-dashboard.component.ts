import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  SeoAction,
  SeoAnalysisStatus,
  SeoAssessmentFinding,
  SeoActionStatus,
  SeoActionTransition,
  SeoActionType,
  SeoBaselineQuality,
  SeoCoverageStatus,
  SeoCooldownStatus,
  SeoCtrBaseline,
  SeoDetectorLineageState,
  SeoDetectorType,
  SeoFingerprintEvidence,
  SeoGitCorroboration,
  SeoLineageCrawl,
  SeoLineagePrecision,
  SeoLineageProduction,
  SeoLineageTimelineEntry,
  SeoLineageVersion,
  SeoManualActionRequest,
  SeoOverview,
  SeoPageCooldown,
  SeoPageDetail,
  SeoPageAssessmentState,
  SeoPageMetricWindow,
  SeoReconciliationPartitionWindow,
  SeoReconciliationSlice,
  SeoPageSummary,
  SeoSearchSegment,
  SeoSyncRun,
  SeoWindowDays,
} from '../../../core/models/seo-admin.model';
import { AuthService } from '../../../core/services/auth.service';
import { SeoAdminService } from '../../../core/services/seo-admin.service';
import {
  FaButtonComponent,
  FaCardComponent,
  FaChipComponent,
  FaDialogComponent,
  FaFieldComponent,
  FaSelectComponent,
  FaSpinnerComponent,
} from '../../../shared/ui';

type SelectOption<T> = { label: string; value: T };

type ManualActionForm = {
  url: string;
  type: SeoActionType;
  title: string;
  hypothesis: string;
  changeSummary: string;
  implementedAt: string;
  historicalUnverified: boolean;
};

type SyncNotice = {
  message: string;
  tone: 'info' | 'error';
};

type AnalysisNotice = {
  message: string;
  tone: 'info' | 'warning' | 'error';
  diagnostic?: string | null;
};

type AnalysisHealthKind = SeoAnalysisStatus | 'not_run' | 'stale';

type AnalysisHealthView = {
  kind: AnalysisHealthKind;
  tone: 'neutral' | 'info' | 'warning' | 'error' | 'clear';
  label: string;
  title: string;
  detail: string;
  ruleVersion: string | null;
  decisionPackets: number;
  totalPages: number;
  completedDays: number;
  requiredDays: number;
  endDate: string | null;
  latestFinalizedDate: string | null;
  completedAt: string | null;
  currentForLatestData: boolean;
  sourceDataStale: boolean;
};

type LineageStepState = 'confirmed' | 'active' | 'pending' | 'unknown';
type FingerprintEvidenceLevel = 'complete' | 'partial' | 'unavailable' | 'legacy';

type DetectorLineageEntry = {
  detector: SeoDetectorType;
  state: SeoDetectorLineageState;
};

type NowEmptyState = {
  kind: 'not_run' | 'running' | 'not_ready' | 'partial' | 'failed' | 'stale' | 'limited' | 'clear';
  tone: 'neutral' | 'warning' | 'error' | 'clear';
  icon: string;
  title: string;
  detail: string;
};

const PRODUCTION_MARKER_READINESS_REASONS = new Set([
  'production_marker_unavailable',
  'production_marker_invalid',
  'production_marker_source_mismatch',
  'production_marker_contract_mismatch',
  'production_marker_not_production',
  'production_marker_identity_missing',
  'production_marker_not_ready',
]);

@Component({
  selector: 'app-seo-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FaButtonComponent,
    FaCardComponent,
    FaChipComponent,
    FaDialogComponent,
    FaFieldComponent,
    FaSelectComponent,
    FaSpinnerComponent,
  ],
  templateUrl: './seo-dashboard.component.html',
  styleUrls: ['./seo-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeoDashboardComponent implements OnInit {
  private readonly seoAdmin = inject(SeoAdminService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchChanges = new Subject<string>();
  private readonly pageSearchChanges = new Subject<string>();
  private overviewRequest = 0;
  private nowRequest = 0;
  private backlogRequest = 0;
  private actionRequest = 0;
  private pageRequest = 0;
  private pageInventoryRequest = 0;
  private syncRunsRequest = 0;
  private analysisRequest = 0;

  readonly windowDays = signal<SeoWindowDays>(28);
  readonly segment = signal<SeoSearchSegment>('all');
  readonly overview = signal<SeoOverview | null>(null);
  readonly overviewLoading = signal(true);
  readonly overviewError = signal<string | null>(null);

  readonly nowActions = signal<SeoAction[]>([]);
  readonly nowLoading = signal(true);
  readonly nowError = signal<string | null>(null);

  readonly backlogActions = signal<SeoAction[]>([]);
  readonly backlogTotal = signal(0);
  readonly backlogCursor = signal<string | null>(null);
  readonly backlogLoading = signal(true);
  readonly backlogLoadingMore = signal(false);
  readonly backlogError = signal<string | null>(null);
  readonly backlogStatus = signal<SeoActionStatus | 'all'>('all');
  readonly backlogType = signal<SeoActionType | 'all'>('all');
  readonly backlogSearch = signal('');

  readonly pages = signal<SeoPageSummary[]>([]);
  readonly pagesTotal = signal(0);
  readonly pagesCursor = signal<string | null>(null);
  readonly pagesLoading = signal(true);
  readonly pagesLoadingMore = signal(false);
  readonly pagesError = signal<string | null>(null);
  readonly pagesSearch = signal('');
  readonly pagesUnconfirmedOnly = signal(false);
  readonly pageMetricWindow = signal<SeoPageMetricWindow | null>(null);

  readonly syncRuns = signal<SeoSyncRun[]>([]);
  readonly syncRunsLoading = signal(true);
  readonly syncRunsError = signal<string | null>(null);

  readonly actionDialogOpen = signal(false);
  readonly selectedAction = signal<SeoAction | null>(null);
  readonly actionLoading = signal(false);
  readonly actionError = signal<string | null>(null);
  readonly transitionBusy = signal(false);
  readonly transitionError = signal<string | null>(null);
  readonly transitionNote = signal('');
  readonly copyDirectionDraft = signal('');
  readonly successCriteriaDraft = signal('');
  readonly snoozeDays = signal<14 | 30 | 60 | 90>(30);
  readonly overrideVerdict = signal<'success' | 'failed' | 'inconclusive'>('inconclusive');

  readonly pageDialogOpen = signal(false);
  readonly selectedPage = signal<SeoPageDetail | null>(null);
  readonly pageLoading = signal(false);
  readonly pageError = signal<string | null>(null);
  readonly intentSaving = signal(false);
  readonly intentError = signal<string | null>(null);
  readonly intentDraft = signal('');
  readonly readerPromiseDraft = signal('');
  readonly targetKeywordDraft = signal('');
  readonly intentConfirmedDraft = signal(false);

  readonly manualDialogOpen = signal(false);
  readonly manualSaving = signal(false);
  readonly manualError = signal<string | null>(null);
  manualForm: ManualActionForm = this.emptyManualForm();

  readonly syncBusy = signal(false);
  readonly syncNotice = signal<SyncNotice | null>(null);
  readonly analysisBusy = signal(false);
  readonly analysisCapabilityChecking = signal(false);
  readonly analysisNotice = signal<AnalysisNotice | null>(null);
  readonly announcement = signal('');
  readonly manualAnalysisAvailable = this.seoAdmin.manualAnalysisAvailable;
  readonly analysisCompatibilityWarning = computed(() => (
    this.seoAdmin.accessChecked()
    && this.seoAdmin.ownerAllowed()
    && !this.manualAnalysisAvailable()
  ));

  readonly analysisDisabled = computed(() => (
    this.analysisBusy()
    || this.analysisCapabilityChecking()
    || this.syncBusy()
    || this.overviewLoading()
    || !this.overview()
    || this.overview()?.dataHealth.syncStatus === 'running'
    || !this.manualAnalysisAvailable()
  ));

  recheckAnalysisCapability(): void {
    if (this.analysisCapabilityChecking()) return;
    this.analysisCapabilityChecking.set(true);

    this.seoAdmin.checkAccess(true)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.analysisCapabilityChecking.set(false);
          this.announcement.set(this.manualAnalysisAvailable()
            ? 'Current backend confirmed. Analyze now is available.'
            : 'The running backend still does not provide manual analysis.');
        },
        error: () => {
          this.analysisCapabilityChecking.set(false);
          this.announcement.set('Backend capability could not be verified.');
        },
      });
  }

  readonly analysisHealth = computed<AnalysisHealthView | null>(() => {
    const overview = this.overview();
    if (!overview) return null;

    const analysis = overview.analysis;
    const latestFinalizedDate = overview.dataHealth.latestFinalizedDate;
    const inferredCurrent = Boolean(
      analysis?.endDate
      && latestFinalizedDate
      && analysis.endDate === latestFinalizedDate,
    );
    const currentForLatestData = analysis?.currentForLatestData ?? inferredCurrent;
    const decisionPackets = analysis?.committedAssessmentPages ?? analysis?.evaluatedPages ?? 0;
    const totalPages = analysis?.totalPages ?? this.pagesTotal();
    const completedRunMissingPages = analysis?.status === 'complete'
      && totalPages > 0
      && decisionPackets < totalPages;
    const kind: AnalysisHealthKind = !analysis
      ? 'not_run'
      : analysis.status === 'running' || analysis.status === 'failed'
        ? analysis.status
        : analysis.status === 'not_ready' || analysis.status === 'partial'
          ? analysis.status
          : !currentForLatestData && Boolean(latestFinalizedDate)
            ? 'stale'
            : completedRunMissingPages
              ? 'partial'
              : analysis.status;
    const presentation = this.analysisHealthPresentation(kind, analysis?.reason ?? null, {
      completedDays: analysis?.completedDays ?? 0,
      requiredDays: analysis?.requiredDays ?? 56,
      decisionPackets,
      totalPages,
    });

    return {
      kind,
      ...presentation,
      ruleVersion: analysis?.ruleVersion ?? null,
      decisionPackets,
      totalPages,
      completedDays: analysis?.completedDays ?? 0,
      requiredDays: analysis?.requiredDays ?? 56,
      endDate: analysis?.endDate ?? null,
      latestFinalizedDate,
      completedAt: analysis?.completedAt ?? null,
      currentForLatestData,
      sourceDataStale: overview.dataHealth.stale,
    };
  });

  readonly windowOptions: SeoWindowDays[] = [7, 28, 90];
  readonly segmentOptions: SelectOption<SeoSearchSegment>[] = [
    { label: 'All queries', value: 'all' },
    { label: 'Visible non-brand queries', value: 'nonbrand' },
    { label: 'Visible brand queries', value: 'brand' },
  ];
  readonly statusOptions: SelectOption<SeoActionStatus | 'all'>[] = [
    { label: 'All statuses', value: 'all' },
    { label: 'Proposed', value: 'proposed' },
    { label: 'Approved', value: 'approved' },
    { label: 'Implementation pending', value: 'implementation_pending' },
    { label: 'Measuring', value: 'measuring' },
    { label: 'Evaluated', value: 'evaluated' },
    { label: 'Snoozed', value: 'snoozed' },
    { label: 'Dismissed', value: 'dismissed' },
    { label: 'Closed', value: 'closed' },
  ];
  readonly typeOptions: SelectOption<SeoActionType | 'all'>[] = [
    { label: 'All action types', value: 'all' },
    { label: 'CTR / snippet', value: 'ctr_snippet' },
    { label: 'Intent mismatch', value: 'intent_mismatch' },
    { label: 'Content decay', value: 'content_decay' },
    { label: 'Cannibalization', value: 'cannibalization' },
    { label: 'Internal link', value: 'internal_link' },
    { label: 'Technical / indexing', value: 'technical_indexing' },
    { label: 'Manual', value: 'manual' },
  ];
  readonly manualTypeOptions = this.typeOptions.filter(
    (option): option is SelectOption<SeoActionType> => option.value !== 'all',
  );
  readonly snoozeOptions: SelectOption<14 | 30 | 60 | 90>[] = [
    { label: '14 days', value: 14 },
    { label: '30 days', value: 30 },
    { label: '60 days', value: 60 },
    { label: '90 days', value: 90 },
  ];
  readonly verdictOptions: SelectOption<'success' | 'failed' | 'inconclusive'>[] = [
    { label: 'Inconclusive', value: 'inconclusive' },
    { label: 'Success', value: 'success' },
    { label: 'Failed', value: 'failed' },
  ];

  readonly trendBars = computed(() => {
    const overview = this.overview();
    const points = overview?.trend ?? [];
    const max = Math.max(...points.map((point) => point.clicks), 1);
    const endTime = overview?.dataHealth.latestFinalizedDate
      ? Date.parse(`${overview.dataHealth.latestFinalizedDate}T00:00:00.000Z`)
      : Number.NaN;
    const startTime = Number.isFinite(endTime)
      ? endTime - ((overview?.windowDays ?? points.length) - 1) * 86_400_000
      : Number.NaN;
    return points.map((point) => ({
      ...point,
      height: point.clicks <= 0 ? 0 : Math.max(8, Math.round((point.clicks / max) * 100)),
      slot: Number.isFinite(startTime)
        ? Math.max(1, Math.min(
          overview?.windowDays ?? points.length,
          Math.round((Date.parse(`${point.date}T00:00:00.000Z`) - startTime) / 86_400_000) + 1,
        ))
        : 1,
    }));
  });
  readonly sparseTrend = computed(() => {
    const current = this.overview()?.dataHealth.windowCompleteness?.current;
    const pointCount = this.trendBars().length;
    return Boolean(current && !current.complete && pointCount > 0 && pointCount < 8);
  });
  readonly backfillIncomplete = computed(() => this.overview()?.dataHealth.backfill?.complete === false);
  readonly nowEmptyState = computed<NowEmptyState | null>(() => {
    if (this.nowLoading() || this.nowError() || this.nowActions().length) return null;

    const overview = this.overview();
    const analysis = overview?.analysis;
    if (!analysis) {
      return {
        kind: 'not_run',
        tone: 'neutral',
        icon: 'pi pi-clock',
        title: 'Recommendations have not been evaluated yet',
        detail: 'Performance data may be available, but no current completed recommendation run is recorded.',
      };
    }

    const completedDays = analysis.completedDays ?? 0;
    const requiredDays = analysis.requiredDays ?? 56;
    const evaluatedPages = analysis.committedAssessmentPages ?? analysis.evaluatedPages ?? 0;
    const totalPages = analysis.totalPages ?? 0;
    const eligiblePages = analysis.eligiblePages ?? 0;
    const currentForLatestData = analysis.currentForLatestData ?? Boolean(
      analysis.endDate
      && overview?.dataHealth.latestFinalizedDate
      && analysis.endDate === overview.dataHealth.latestFinalizedDate,
    );

    if (analysis.status === 'running') {
      return {
        kind: 'running',
        tone: 'neutral',
        icon: 'pi pi-spin pi-spinner',
        title: 'Recommendations are being evaluated',
        detail: totalPages > 0
          ? `${evaluatedPages}/${totalPages} decision packets committed so far.`
          : 'The current finalized data window is being analyzed.',
      };
    }
    if (analysis.status === 'failed') {
      return {
        kind: 'failed',
        tone: 'error',
        icon: 'pi pi-exclamation-triangle',
        title: 'Latest recommendation analysis failed',
        detail: this.analysisReasonText(analysis.reason ?? null)
          || 'Existing actions remain available. Use Sync now or wait for the scheduled sync; do not infer an all-clear until a complete run succeeds.',
      };
    }
    if (!currentForLatestData && (analysis.endDate || analysis.reason === 'latest_data_not_analyzed')) {
      return {
        kind: 'stale',
        tone: 'warning',
        icon: 'pi pi-history',
        title: 'Latest search data has not been evaluated yet',
        detail: analysis.endDate
          ? `The last analysis covers data through ${analysis.endDate}; a newer finalized date is available.`
          : 'The recorded analysis is not tied to the latest finalized date.',
      };
    }
    if (analysis.status === 'not_ready') {
      const collectionIncomplete = completedDays < requiredDays;
      const productionVerificationBlocked = PRODUCTION_MARKER_READINESS_REASONS.has(
        analysis.reason ?? '',
      );
      let detail: string;
      if (productionVerificationBlocked) {
        detail = this.analysisReasonText(analysis.reason ?? null)
          || 'The production frontend fingerprint and deployment are not verified. No SEO decisions were inferred.';
      } else if (analysis.reason === 'analysis_rule_outdated') {
        detail = 'The data window is ready, but the saved analysis uses an older rule set. Run Analyze now or wait for the scheduled sync to evaluate it with balanced-v2.1.';
      } else if (analysis.reason === 'analysis_deadline') {
        detail = collectionIncomplete
          ? `The evaluation reached its time limit with ${completedDays}/${requiredDays} finalized days collected. A later sync will continue without implying an all-clear.`
          : 'The data window is ready, but this run reached its evaluation time limit. Retry Sync now or let the next scheduled sync continue; no all-clear is implied.';
      } else if (analysis.reason === 'finalized_data_stale') {
        detail = 'The saved analysis may be complete, but finalized Search Console data is stale. Complete a successful sync before treating an empty queue as an all-clear.';
      } else if (analysis.reason === 'sync_unhealthy') {
        detail = overview?.dataHealth.syncStatus === 'running'
          ? 'A Search Console sync is still running. Wait for it to finish and refresh the analysis before treating an empty queue as an all-clear.'
          : overview?.dataHealth.syncStatus === 'failed'
            ? 'The latest Search Console sync failed. Retry Sync now or wait for the next scheduled sync before treating an empty queue as an all-clear.'
            : 'Search Console ingestion is not ready. Resolve the data-health warning and complete a successful sync before treating an empty queue as an all-clear.';
      } else if (analysis.reason === 'manifest_changed_since_analysis') {
        detail = 'The page inventory changed after the saved analysis. Run the analysis again so every current manifest page is evaluated before inferring an all-clear.';
      } else if (analysis.reason === 'page_assessments_incomplete') {
        detail = 'One or more page decisions changed or were invalidated after the saved analysis. Run Sync now or wait for the scheduled sync to re-evaluate every current page before inferring an all-clear.';
      } else if (collectionIncomplete) {
        detail = 'Two complete 28-day windows are required before performance recommendations are trustworthy.';
      } else {
        detail = 'The data window is ready, but no complete current page evaluation is recorded yet. Run Sync now or wait for the scheduled sync.';
      }
      return {
        kind: 'not_ready',
        tone: 'warning',
        icon: productionVerificationBlocked ? 'pi pi-shield' : 'pi pi-clock',
        title: productionVerificationBlocked
          ? 'Production frontend verification is required'
          : collectionIncomplete
          ? `Recommendations have not been evaluated yet · ${completedDays}/${requiredDays}`
          : 'Recommendations have not been evaluated yet',
        detail,
      };
    }
    if (analysis.status === 'partial' || evaluatedPages < totalPages) {
      return {
        kind: 'partial',
        tone: 'warning',
        icon: 'pi pi-hourglass',
        title: `${evaluatedPages}/${totalPages} decision packets committed`,
        detail: this.analysisReasonText(analysis.reason ?? null)
          || 'This run is incomplete, so the absence of an action is not an all-clear.',
      };
    }

    const cooldownBlocked = (analysis.cooldown?.awaitingRecrawl ?? 0)
      + (analysis.cooldown?.observing ?? 0)
      + (analysis.cooldown?.directional ?? 0);
    const dataQualityBlocked = analysis.dataQualityBlockedPages ?? 0;
    const decisionBlockedPages = analysis.decisionBlockedPages;
    const proposedActions = analysis.proposedActions;
    const ingestionLimitations = [
      overview?.dataHealth.stale ? 'Search data is stale' : null,
      overview?.dataHealth.syncStatus === 'failed' ? 'The latest Search Console sync failed' : null,
    ].filter((value): value is string => Boolean(value));
    const allPagesEligible = totalPages > 0
      && eligiblePages === totalPages
      && evaluatedPages === totalPages
      && cooldownBlocked === 0
      && dataQualityBlocked === 0
      && decisionBlockedPages === 0
      && proposedActions === 0
      && ingestionLimitations.length === 0;
    if (analysis.status === 'complete' && allPagesEligible) {
      return {
        kind: 'clear',
        tone: 'clear',
        icon: 'pi pi-check-circle',
        title: 'No urgent action meets the evidence bar',
        detail: `All ${totalPages} pages were eligible and evaluated against the latest finalized data.`,
      };
    }

    const limitations = [
      cooldownBlocked > 0 ? `${cooldownBlocked} in change cooldown` : null,
      dataQualityBlocked > 0 ? `${dataQualityBlocked} blocked by data quality` : null,
      Number(decisionBlockedPages) > 0
        ? `${decisionBlockedPages} ${decisionBlockedPages === 1 ? 'page lacks' : 'pages lack'} a complete decision`
        : null,
      Number(proposedActions) > 0
        ? `${proposedActions} proposed ${proposedActions === 1 ? 'action awaits' : 'actions await'} queue reconciliation`
        : null,
      eligiblePages < totalPages ? `${eligiblePages}/${totalPages} eligible` : null,
    ].filter((value): value is string => Boolean(value));
    const queueReconciliationPending = Number(proposedActions) > 0;
    return {
      kind: 'limited',
      tone: 'warning',
      icon: 'pi pi-info-circle',
      title: ingestionLimitations.length
        ? 'Search data needs a successful refresh'
        : queueReconciliationPending
          ? 'Action queue needs reconciliation'
          : 'No action is ready yet',
      detail: ingestionLimitations.length
        ? `${ingestionLimitations.join(' · ')}. Retry Sync now or wait for the next scheduled sync before treating an empty queue as an all-clear.${limitations.length ? ` ${limitations.join(' · ')} also prevent an all-clear.` : ''}`
        : queueReconciliationPending
          ? `${limitations.join(' · ')}. Refresh the dashboard or run Sync before treating the empty queue as an all-clear.`
          : limitations.length
          ? `${limitations.join(' · ')}. These pages are still being watched, not cleared.`
          : 'The run completed with limitations, so the absence of an action is not an all-clear.',
    };
  });

  constructor() {
    effect(() => {
      const user = this.auth.user();
      const accessChecked = this.seoAdmin.accessChecked();
      const ownerAllowed = this.seoAdmin.ownerAllowed();

      if (user?.role === 'admin' && accessChecked && ownerAllowed) return;

      this.clearSensitiveState();
      if (!user) {
        void this.router.navigate(['/auth/login'], {
          queryParams: { redirectTo: '/admin/seo' },
        });
        return;
      }

      if (user.role !== 'admin') {
        void this.router.navigate(['/404']);
        return;
      }

      // Header account verification deliberately clears cached access before
      // refreshing it. Keep the dashboard fail-closed while that request is in
      // flight, but only treat a completed denial as a reason to navigate away.
      if (!accessChecked) return;

      void this.router.navigate(['/404']);
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    this.searchChanges.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((search) => {
      this.backlogSearch.set(search.trim());
      this.loadBacklog(true);
    });
    this.pageSearchChanges.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((search) => {
      this.pagesSearch.set(search.trim());
      this.loadPages(true);
    });
    this.refreshDashboard();
  }

  refreshDashboard(): void {
    this.loadOverview();
    this.loadNowActions();
    this.loadBacklog(true);
    this.loadPages(true);
    this.loadSyncRuns();
  }

  setWindow(days: SeoWindowDays): void {
    if (this.windowDays() === days) return;
    this.windowDays.set(days);
    this.overview.set(null);
    this.loadOverview();
  }

  setSegment(value: SeoSearchSegment): void {
    if (this.segment() === value) return;
    this.segment.set(value);
    this.overview.set(null);
    this.loadOverview();
  }

  setStatusFilter(value: SeoActionStatus | 'all'): void {
    this.backlogStatus.set(value);
    this.loadBacklog(true);
  }

  setTypeFilter(value: SeoActionType | 'all'): void {
    this.backlogType.set(value);
    this.loadBacklog(true);
  }

  onSearchInput(event: Event): void {
    this.searchChanges.next((event.target as HTMLInputElement | null)?.value ?? '');
  }

  onPageSearchInput(event: Event): void {
    this.pageSearchChanges.next((event.target as HTMLInputElement | null)?.value ?? '');
  }

  setPageIntentFilter(unconfirmedOnly: boolean): void {
    if (this.pagesUnconfirmedOnly() === unconfirmedOnly) return;
    this.pagesUnconfirmedOnly.set(unconfirmedOnly);
    this.loadPages(true);
  }

  loadMorePages(): void {
    if (!this.pagesCursor() || this.pagesLoadingMore()) return;
    this.loadPages(false);
  }

  loadMoreBacklog(): void {
    if (!this.backlogCursor() || this.backlogLoadingMore()) return;
    this.loadBacklog(false);
  }

  openAction(action: SeoAction): void {
    if (this.pageDialogOpen()) this.closePage();
    const request = ++this.actionRequest;
    this.selectedAction.set(action);
    this.actionDialogOpen.set(true);
    this.actionLoading.set(true);
    this.actionError.set(null);
    this.transitionError.set(null);
    this.transitionNote.set('');
    this.setActionDrafts(action);

    this.seoAdmin.getAction(action.id).subscribe({
      next: (detail) => {
        if (request !== this.actionRequest) return;
        this.selectedAction.set(detail);
        this.setActionDrafts(detail);
        this.actionLoading.set(false);
      },
      error: () => {
        if (request !== this.actionRequest) return;
        this.actionLoading.set(false);
        this.actionError.set('The latest action detail could not be loaded. The queue snapshot is shown.');
      },
    });
  }

  closeAction(): void {
    this.actionRequest += 1;
    this.actionDialogOpen.set(false);
    this.actionLoading.set(false);
  }

  openPage(pageKey: string): void {
    if (this.actionDialogOpen()) this.closeAction();
    const request = ++this.pageRequest;
    this.pageDialogOpen.set(true);
    this.pageLoading.set(true);
    this.pageError.set(null);
    this.intentError.set(null);
    this.selectedPage.set(null);

    this.seoAdmin.getPage(pageKey).subscribe({
      next: (page) => {
        if (request !== this.pageRequest) return;
        this.selectedPage.set(page);
        this.intentDraft.set(page.intendedIntent ?? '');
        this.readerPromiseDraft.set(page.readerPromise ?? '');
        this.targetKeywordDraft.set(page.targetKeyword ?? '');
        this.intentConfirmedDraft.set(page.intentConfirmed);
        this.pageLoading.set(false);
      },
      error: () => {
        if (request !== this.pageRequest) return;
        this.pageLoading.set(false);
        this.pageError.set('Page evidence could not be loaded. Please try again.');
      },
    });
  }

  closePage(): void {
    this.pageRequest += 1;
    this.pageDialogOpen.set(false);
    this.pageLoading.set(false);
  }

  saveIntent(): void {
    const page = this.selectedPage();
    const intendedIntent = this.intentDraft().trim();
    if (!page || !intendedIntent || this.intentSaving()) {
      if (!intendedIntent) this.intentError.set('Describe the intended search intent before saving.');
      return;
    }

    this.intentSaving.set(true);
    this.intentError.set(null);
    this.seoAdmin.updateIntent(page.pageKey, {
      intendedIntent,
      readerPromise: this.readerPromiseDraft().trim() || undefined,
      targetKeyword: this.targetKeywordDraft().trim() || undefined,
      intentConfirmed: this.intentConfirmedDraft(),
    }).subscribe({
      next: (updated) => {
        this.intentSaving.set(false);
        if (this.pageDialogOpen() && this.selectedPage()?.pageKey === page.pageKey) {
          this.selectedPage.set(updated);
        }
        this.announcement.set(`Intent saved for ${updated.path}.`);
        this.loadNowActions();
        this.loadBacklog(true);
        this.loadPages(true);
      },
      error: () => {
        this.intentSaving.set(false);
        if (this.pageDialogOpen() && this.selectedPage()?.pageKey === page.pageKey) {
          this.intentError.set('Intent could not be saved. Your draft is still here.');
        }
      },
    });
  }

  transition(event: SeoActionTransition): void {
    const action = this.selectedAction();
    if (!action || this.transitionBusy()) return;
    const note = this.transitionNote().trim();
    if ((event === 'mark_implemented' || event === 'dismiss' || event === 'override_verdict') && !note) {
      this.transitionError.set('Add a short decision note before this transition.');
      return;
    }

    this.transitionBusy.set(true);
    this.transitionError.set(null);
    this.seoAdmin.transitionAction(action.id, {
      event,
      expectedVersion: action.version,
      note: note || undefined,
      ...(event === 'snooze' ? { snoozeDays: this.snoozeDays() } : {}),
      ...(event === 'approve' ? {
        copyDirection: this.copyDirectionDraft().trim() || undefined,
        successCriteria: this.successCriteriaDraft().trim() || undefined,
      } : {}),
      ...(event === 'mark_implemented' ? { implementedAt: new Date().toISOString() } : {}),
      ...(event === 'override_verdict' ? { verdict: this.overrideVerdict() } : {}),
    }).subscribe({
      next: (updated) => {
        this.transitionBusy.set(false);
        if (this.actionDialogOpen() && this.selectedAction()?.id === action.id) {
          this.selectedAction.set(updated);
          this.transitionNote.set('');
        }
        this.announcement.set(`Action moved to ${this.statusLabel(updated.status)}.`);
        this.loadOverview();
        this.loadNowActions();
        this.loadBacklog(true);
      },
      error: (error) => {
        this.transitionBusy.set(false);
        if (this.actionDialogOpen() && this.selectedAction()?.id === action.id) {
          this.transitionError.set(
            error?.status === 409
              ? 'This action changed in another request. Close and reopen it before trying again.'
              : 'The action could not be updated. Please try again.',
          );
        }
      },
    });
  }

  openManualAction(): void {
    this.manualForm = this.emptyManualForm();
    this.manualError.set(null);
    this.manualDialogOpen.set(true);
  }

  closeManualAction(): void {
    if (!this.manualSaving()) this.manualDialogOpen.set(false);
  }

  submitManualAction(): void {
    const form = this.manualForm;
    if (!form.url.trim() || !form.title.trim() || !form.hypothesis.trim()) {
      this.manualError.set('URL, action title, and hypothesis are required.');
      return;
    }
    if (!/^https:\/\//i.test(form.url.trim())) {
      this.manualError.set('Use the full canonical URL beginning with https://.');
      return;
    }
    if (form.historicalUnverified && !form.implementedAt) {
      this.manualError.set('Choose the implemented date for a historical entry.');
      return;
    }

    const payload: SeoManualActionRequest = {
      url: form.url.trim(),
      type: form.type,
      title: form.title.trim(),
      hypothesis: form.hypothesis.trim(),
      changeSummary: form.changeSummary.trim() || undefined,
      implementedAt: form.implementedAt
        ? new Date(`${form.implementedAt}T12:00:00.000Z`).toISOString()
        : undefined,
      historicalUnverified: form.historicalUnverified,
    };

    this.manualSaving.set(true);
    this.manualError.set(null);
    this.seoAdmin.createAction(payload).subscribe({
      next: (action) => {
        this.manualSaving.set(false);
        this.manualDialogOpen.set(false);
        this.announcement.set('Manual SEO action added.');
        this.loadOverview();
        this.loadNowActions();
        this.loadBacklog(true);
        this.openAction(action);
      },
      error: () => {
        this.manualSaving.set(false);
        this.manualError.set('The action could not be saved. Your draft is still here.');
      },
    });
  }

  requestSync(): void {
    if (
      this.syncBusy()
      || this.analysisBusy()
      || this.overview()?.dataHealth.syncStatus === 'running'
    ) return;
    this.syncBusy.set(true);
    this.syncNotice.set(null);
    this.seoAdmin.requestSync().subscribe({
      next: (response) => {
        this.syncBusy.set(false);
        const message = response.message || 'SEO data sync requested.';
        this.syncNotice.set({ message, tone: 'info' });
        this.announcement.set(message);
        this.refreshDashboard();
      },
      error: (error) => {
        this.syncBusy.set(false);
        const message =
          error?.status === 429
            ? 'Sync is cooling down. Try again in about two minutes.'
            : 'Sync could not be requested. Check data health and try again.';
        this.syncNotice.set({ message, tone: 'error' });
        this.announcement.set(message);
      },
    });
  }

  requestAnalysis(): void {
    if (this.analysisDisabled()) return;
    const request = ++this.analysisRequest;
    this.analysisBusy.set(true);
    this.analysisNotice.set(null);

    this.seoAdmin.requestAnalysis().subscribe({
      next: (response) => {
        if (request !== this.analysisRequest) return;
        this.analysisBusy.set(false);

        const tone: AnalysisNotice['tone'] = response.status === 'failed'
          ? 'error'
          : !response.accepted || response.status === 'not_ready' || response.status === 'partial'
            ? 'warning'
            : 'info';
        const message = response.message || this.analysisResponseMessage(response.status);
        this.analysisNotice.set({
          message,
          tone,
          diagnostic: this.safeAnalysisDiagnostic({
            runId: response.runId,
            status: response.status,
            reason: response.analysis?.reason,
          }),
        });
        this.announcement.set(message);

        if (response.analysis) {
          this.overview.update((current) => current ? ({ ...current, analysis: response.analysis }) : current);
        }
        this.refreshDashboard();
      },
      error: (error) => {
        if (request !== this.analysisRequest) return;
        this.analysisBusy.set(false);
        const message = error?.status === 409 || error?.status === 429
          ? 'Analysis is already running or temporarily busy. Wait for the current operation to finish, then retry.'
          : error?.status === 404
            ? 'Analyze now is unavailable in the running backend. Your owner access is being rechecked; restart the local backend or deploy the matching backend release, then retry.'
            : 'Analysis could not be completed. No complete current analysis is available; Analysis health and recent runs are being refreshed before you retry.';
        this.analysisNotice.set({
          message,
          tone: 'error',
          diagnostic: this.safeAnalysisErrorDiagnostic(error),
        });
        this.announcement.set(message);
        if (error?.status !== 401 && error?.status !== 403 && this.seoAdmin.ownerAllowed()) {
          this.refreshDashboard();
        }
      },
    });
  }

  syncTriggerLabel(trigger: string): string {
    if (trigger === 'cron') return 'Automatic';
    if (trigger === 'manual_analysis') return 'Analysis';
    return 'Manual';
  }

  typeLabel(type: SeoActionType): string {
    return this.typeOptions.find((option) => option.value === type)?.label ?? type;
  }

  statusLabel(status: SeoActionStatus): string {
    return this.statusOptions.find((option) => option.value === status)?.label ?? status;
  }

  pageIntentLabel(page: SeoPageSummary): string {
    if (page.intentConfirmed && page.intentSource === 'owner') return 'Owner confirmed';
    if (page.intentConfirmed) return 'Explicit metadata';
    if (page.intentSource === 'derived') return 'Auto-derived';
    if (page.intentSource === 'explicit') return 'Explicit draft';
    return 'Unconfirmed';
  }

  pageIntentTone(page: SeoPageSummary): string {
    if (page.intentConfirmed) return 'approved';
    return page.intentSource === 'derived' ? 'neutral' : 'proposed';
  }

  coverageStatusLabel(
    status: SeoCoverageStatus | null | undefined,
    sufficient: boolean | undefined,
    source: 'query' | 'device',
  ): string {
    if (status === 'inconsistent') return `Inconsistent ${source} subset totals`;
    if (status === 'unavailable') return `${this.humanizeCode(source)} subset unavailable`;
    if (status === 'sufficient' || sufficient === true) return `Sufficient ${source} subset coverage`;
    return `Limited ${source} subset`;
  }

  assessmentStateLabel(state: SeoPageAssessmentState | null | undefined): string {
    if (state === 'not_evaluable') return 'Not evaluable';
    if (state === 'clear') return 'Clear';
    if (state === 'watch') return 'Watch';
    if (state === 'actionable') return 'Actionable';
    return 'Not evaluated';
  }

  assessmentTone(state: SeoPageAssessmentState | null | undefined): 'neutral' | 'warning' | 'error' | 'clear' {
    if (state === 'actionable') return 'error';
    if (state === 'watch') return 'warning';
    if (state === 'clear') return 'clear';
    return 'neutral';
  }

  assessmentHeadline(page: SeoPageDetail): string {
    const assessment = page.assessment;
    if (!assessment) return 'This page has not been evaluated yet';
    if (assessment.currentForLatestData === false) return 'Latest search data has not been assessed yet';
    const cooldown = this.lineageCooldown(page);
    if (cooldown?.state === 'awaiting_recrawl') return 'Waiting for Google to recrawl the change';
    if (cooldown?.state === 'observing') return 'Observing a recent title or content change';
    if (cooldown?.state === 'directional') return 'Directional watch — wait for the 28-day decision window';
    const cooldownVerdicts = new Set(['awaiting_recrawl', 'observing_change']);
    if (assessment.verdict && !cooldownVerdicts.has(assessment.verdict)) {
      return this.humanizeCode(assessment.verdict);
    }
    if (assessment.primaryState === 'actionable') return 'An evidence-backed action is ready';
    if (assessment.primaryState === 'watch') return 'Keep watching before changing the page';
    if (assessment.primaryState === 'clear') return 'No page-level issue meets the evidence bar';
    return 'There is not enough evidence for a page-level decision';
  }

  assessmentFreshnessNote(page: SeoPageDetail): string | null {
    if (!page.assessment || page.assessment.currentForLatestData !== false) return null;
    return this.analysisReasonText(page.analysis?.reason ?? null)
      ?? 'This retained packet is historical evidence only. Run a current verified analysis before using it for a decision.';
  }

  findingText(finding: SeoAssessmentFinding | string): string {
    if (typeof finding === 'string') return this.humanizeCode(finding);
    return finding.summary || finding.evidence?.summary || finding.label || this.humanizeCode(finding.code || 'Finding');
  }

  findingLabel(finding: SeoAssessmentFinding | string): string | null {
    if (typeof finding === 'string') return null;
    if (finding.detector) return this.humanizeCode(finding.detector);
    if (finding.code) return this.humanizeCode(finding.code);
    return finding.label || null;
  }

  findingConfidence(finding: SeoAssessmentFinding | string): string | null {
    return typeof finding === 'string' ? null : this.confidenceLabel(finding.confidence);
  }

  findingCounterEvidence(finding: SeoAssessmentFinding | string): string[] {
    return typeof finding === 'string' ? [] : finding.counterEvidence ?? [];
  }

  confidenceLabel(value: number | null | undefined): string | null {
    if (!Number.isFinite(value)) return null;
    const numeric = Number(value);
    const percent = numeric <= 1 ? numeric * 100 : numeric;
    return `${Math.max(0, Math.min(100, Math.round(percent)))}% confidence`;
  }

  cooldownLabel(cooldown: SeoPageCooldown | null | undefined): string {
    if (!cooldown) return 'No active change cooldown';
    if (cooldown.state === 'awaiting_recrawl') return 'Waiting for Google to recrawl the change';
    if (cooldown.state === 'observing') return 'Observing the first 14 clean finalized days';
    if (cooldown.state === 'directional') return 'Directional evidence only until day 28';
    return 'Eligible for a performance decision';
  }

  lineageAvailable(page: SeoPageDetail): boolean {
    const lineage = page.lineage;
    const current = lineage?.currentVersion;
    const timelineHasVersion = Boolean(lineage?.timeline?.some((entry) => (
      entry.versionKey || entry.occurrenceKey || entry.inputHash
    )));
    const detectorHasVersion = Object.values(lineage?.detectorStates || {}).some((state) => Boolean(
      state?.affected
      && (state.versionKey || state.occurrenceKey || state.changeEffectiveAt || state.changedComponents?.length),
    ));
    return Boolean(
      current && (current.versionKey || current.occurrenceKey || current.inputHash)
      || timelineHasVersion
      || detectorHasVersion,
    );
  }

  currentLineageVersion(page: SeoPageDetail): SeoLineageVersion | null {
    const current = page.lineage?.currentVersion;
    if (current && (current.versionKey || current.occurrenceKey || current.inputHash)) return current;
    const latest = page.lineage?.timeline?.find((entry) => (
      entry.versionKey || entry.occurrenceKey || entry.inputHash
    ));
    if (!latest) return null;
    const confirmedAfterProduction = this.crawlOrder(
      latest.googleCrawlAt,
      latest.effectiveAt,
    );
    return {
      versionKey: latest.versionKey,
      occurrenceKey: latest.occurrenceKey,
      inputHash: latest.inputHash,
      observedAt: latest.observedAt,
      changedComponents: latest.changedComponents,
      production: {
        effectiveAt: latest.effectiveAt,
        precision: latest.precision,
        source: latest.source as SeoLineageProduction['source'],
        deploymentId: latest.deploymentId,
        gitCommitSha: latest.gitCommitSha,
        gitSha: latest.gitSha,
        gitCandidate: latest.gitCandidate,
      },
      gitCandidate: latest.gitCandidate,
      crawl: {
        lastGoogleCrawlAt: latest.googleCrawlAt,
        confirmedAt: confirmedAfterProduction === true
          ? (latest.crawlConfirmedAt || latest.googleCrawlAt)
          : null,
        confirmedAfterProduction,
      },
    };
  }

  lineageProduction(page: SeoPageDetail): SeoLineageProduction | null {
    return this.currentLineageVersion(page)?.production ?? null;
  }

  lineageCrawl(page: SeoPageDetail): SeoLineageCrawl | null {
    return this.currentLineageVersion(page)?.crawl ?? null;
  }

  lineageCooldown(page: SeoPageDetail): SeoPageCooldown | null {
    const lineageStates = this.detectorLineageEntries(page)
      .filter((entry) => entry.detector !== 'technical_indexing')
      .map((entry) => entry.state.cooldown)
      .filter((cooldown): cooldown is SeoPageCooldown => Boolean(cooldown));
    const assessmentStates = Object.entries(page.assessment?.detectorCooldowns || {})
      .filter(([detector]) => detector !== 'technical_indexing')
      .map(([, cooldown]) => cooldown)
      .filter((cooldown): cooldown is SeoPageCooldown => Boolean(cooldown));
    const states = lineageStates.length ? lineageStates : assessmentStates;
    const priority: Record<SeoCooldownStatus, number> = {
      awaiting_recrawl: 0,
      observing: 1,
      directional: 2,
      eligible: 3,
    };
    return states.sort((left, right) => priority[left.state] - priority[right.state])[0]
      ?? page.assessment?.cooldown
      ?? null;
  }

  detectorLineageEntries(page: SeoPageDetail): DetectorLineageEntry[] {
    const states = page.lineage?.detectorStates || {};
    const order: SeoDetectorType[] = [
      'technical_indexing',
      'intent_mismatch',
      'content_decay',
      'ctr_snippet',
      'cannibalization',
      'internal_link',
    ];
    return order.flatMap((detector) => {
      const state = states[detector];
      return state ? [{ detector, state }] : [];
    });
  }

  lineageChangedComponents(page: SeoPageDetail): string[] {
    const current = this.currentLineageVersion(page)?.changedComponents ?? [];
    return [...new Set(current.map((component) => String(component || '').trim()).filter(Boolean))];
  }

  changedComponentLabel(component: string): string {
    const labels: Record<string, string> = {
      h1: 'H1',
      body: 'Body content',
      content: 'Body content',
      mainContent: 'Main content',
      headingOutline: 'Heading outline',
      contentUpdatedAt: 'Content version',
      outboundLinks: 'Outbound links',
      internalLinks: 'Internal links',
      structuredData: 'Structured data',
      jsonLd: 'Structured data',
      canonical: 'Canonical',
      robots: 'Robots',
      indexability: 'Indexability',
      title: 'Title',
      description: 'Description',
      intent: 'Intent contract',
    };
    return labels[component] || this.humanizeCode(component);
  }

  lineageVersionLabel(version: SeoLineageVersion | null): string {
    const value = version?.versionKey
      || version?.occurrenceKey
      || version?.inputHash
      || version?.manifest?.version;
    return value ? `Version ${this.shortIdentifier(value)}` : 'Version recorded';
  }

  lineageVersionMeta(version: SeoLineageVersion | null): string {
    if (!version) return 'Manifest and fingerprint schema unavailable';
    const values = [
      version.manifest?.version ? `Manifest ${this.shortIdentifier(version.manifest.version, 18)}` : null,
      (version.fingerprintVersion || version.fingerprintSchemaVersion)
        ? `Fingerprint ${this.shortIdentifier(String(version.fingerprintVersion || version.fingerprintSchemaVersion), 24)}`
        : null,
    ].filter((value): value is string => Boolean(value));
    return values.length ? values.join(' · ') : 'Manifest and fingerprint schema unavailable';
  }

  fingerprintEvidence(page: SeoPageDetail): SeoFingerprintEvidence | null {
    const version = this.currentLineageVersion(page);
    if (version?.fingerprintEvidence) return version.fingerprintEvidence;
    if (version?.evidenceSource || version?.availability || version?.limitations?.length) {
      return {
        source: version.evidenceSource || null,
        status: typeof version.availability === 'string' ? version.availability : null,
        limitations: version.limitations || [],
      };
    }
    return null;
  }

  fingerprintEvidenceLevel(page: SeoPageDetail): FingerprintEvidenceLevel {
    const evidence = this.fingerprintEvidence(page);
    if (!evidence) return 'unavailable';
    const explicit = String(evidence.status || '').toLowerCase();
    if (explicit === 'legacy') return 'legacy';
    if (explicit === 'complete') return 'complete';
    if (explicit === 'partial') return 'partial';
    if (explicit === 'unavailable') return 'unavailable';
    const statuses = Object.values(evidence.statuses || {}).map((status) => String(status).toLowerCase());
    if (statuses.length && statuses.every((status) => status === 'legacy')) return 'legacy';
    if (statuses.length && statuses.every((status) => status === 'complete')) return 'complete';
    if (statuses.some((status) => status === 'complete' || status === 'partial')) return 'partial';
    return evidence.prerenderedAvailable ? 'partial' : 'unavailable';
  }

  fingerprintEvidenceLabel(page: SeoPageDetail): string {
    const level = this.fingerprintEvidenceLevel(page);
    if (level === 'complete') return 'Complete fingerprint evidence';
    if (level === 'partial') return 'Partial fingerprint evidence';
    if (level === 'legacy') return 'Legacy fingerprint baseline';
    return 'Fingerprint evidence unavailable';
  }

  fingerprintEvidenceCaveat(page: SeoPageDetail): string {
    const evidence = this.fingerprintEvidence(page);
    const level = this.fingerprintEvidenceLevel(page);
    if (level === 'complete') {
      return evidence?.limitations?.length
        ? 'Material rendered fields are covered, with the listed runtime limitations kept outside the decision evidence.'
        : 'Material rendered fields have complete component fingerprints for this version.';
    }
    if (level === 'partial') {
      return 'Only part of the material page was observed. A missing component must not be treated as proof that it did or did not change.';
    }
    if (level === 'legacy') {
      return 'This baseline predates component fingerprints and cannot identify a precise rendered-page change.';
    }
    return 'No component-level fingerprint evidence is available. The version record alone cannot prove a material page change.';
  }

  fingerprintLimitations(page: SeoPageDetail): string[] {
    return [...new Set((this.fingerprintEvidence(page)?.limitations || []).map(String).filter(Boolean))].slice(0, 6);
  }

  productionEffectiveAt(production: SeoLineageProduction | null): string | null {
    return production?.effectiveAt
      || production?.readyAt
      || production?.effectiveAtUpperBound
      || production?.effectiveAtLowerBound
      || null;
  }

  productionPrecisionLabel(precision: SeoLineagePrecision | null | undefined): string {
    if (precision === 'exact') return 'Exact';
    if (precision === 'upper_bound') return 'Upper bound';
    if (precision === 'legacy_baseline') return 'Legacy baseline';
    return 'Unknown precision';
  }

  productionSourceLabel(source: SeoLineageProduction['source']): string {
    if (source === 'manifest_ready_at') return 'Production readiness manifest';
    if (source === 'runtime_observed') return 'First runtime observation';
    if (source === 'legacy_baseline') return 'Legacy baseline';
    return 'Source unavailable';
  }

  productionPrecisionCaveat(production: SeoLineageProduction | null): string {
    if (production?.precision === 'exact') {
      return 'The production timestamp is precise enough to anchor the clean measurement window.';
    }
    if (production?.precision === 'upper_bound') {
      return 'This is the first confirmed production observation. The change may have gone live earlier, so cooldown timing stays conservative.';
    }
    if (production?.precision === 'legacy_baseline') {
      return 'This version predates precise deployment lineage. The baseline is useful for identity, not for reconstructing a launch time.';
    }
    return 'Production timing is unavailable. The app will not infer a clean performance window from Git or manifest observation alone.';
  }

  deploymentLabel(production: SeoLineageProduction | null): string | null {
    return production?.deploymentId
      ? `Deployment ${this.shortIdentifier(production.deploymentId, 16)}`
      : null;
  }

  lineageStepState(step: 'version' | 'production' | 'crawl' | 'clean', page: SeoPageDetail): LineageStepState {
    if (step === 'version') {
      if (!this.currentLineageVersion(page)) return 'unknown';
      const fingerprint = this.fingerprintEvidenceLevel(page);
      if (fingerprint === 'complete') return 'confirmed';
      if (fingerprint === 'partial' || fingerprint === 'legacy') return 'active';
      return 'unknown';
    }
    if (step === 'production') {
      const production = this.lineageProduction(page);
      if (!this.productionEffectiveAt(production)) return 'unknown';
      return production?.precision === 'exact' ? 'confirmed' : 'active';
    }
    if (step === 'crawl') {
      const crawl = this.lineageCrawl(page);
      const confirmed = crawl?.confirmedAfterProduction ?? crawl?.confirmedAfterVersion;
      if (confirmed === true) return 'confirmed';
      if (confirmed === false) return 'pending';
      return 'unknown';
    }
    const cooldown = this.lineageCooldown(page);
    if (!cooldown) return 'unknown';
    if (cooldown.state === 'eligible') return 'confirmed';
    if (cooldown.state === 'awaiting_recrawl') return 'pending';
    return 'active';
  }

  crawlLineageLabel(crawl: SeoLineageCrawl | null): string {
    const confirmed = crawl?.confirmedAfterProduction ?? crawl?.confirmedAfterVersion;
    if (confirmed === true) return 'Crawl confirmed after production';
    if (confirmed === false && crawl?.lastGoogleCrawlAt) return 'Recorded crawl does not confirm this production version';
    if (confirmed === false) return 'No post-production Google crawl recorded';
    return 'Crawl sequence unavailable';
  }

  private crawlOrder(
    googleCrawlAt: string | null | undefined,
    productionEffectiveAt: string | null | undefined,
  ): boolean | null {
    if (!googleCrawlAt || !productionEffectiveAt) return null;
    const crawlTime = Date.parse(googleCrawlAt);
    const productionTime = Date.parse(productionEffectiveAt);
    if (!Number.isFinite(crawlTime) || !Number.isFinite(productionTime)) return null;
    return crawlTime > productionTime;
  }

  cleanDaysLabel(cooldown: SeoPageCooldown | null | undefined): string {
    if (!cooldown) return 'Clean window unavailable';
    if (cooldown.state === 'awaiting_recrawl') return 'Clean window has not started';
    if (cooldown.cleanFinalizedDays == null) return this.cooldownLabel(cooldown);
    return `${cooldown.cleanFinalizedDays}/28 clean finalized days`;
  }

  detectorLineageLabel(entry: DetectorLineageEntry): string {
    if (entry.state.affected === false) return 'Not affected';
    const cooldown = entry.state.cooldown;
    if (entry.detector === 'technical_indexing' && entry.state.crawlRequired && !entry.state.crawlConfirmed) {
      return 'Checks active · crawl pending';
    }
    return cooldown ? this.cooldownLabel(cooldown) : 'Lineage recorded';
  }

  detectorLineageState(entry: DetectorLineageEntry): LineageStepState {
    if (entry.state.affected === false) return 'confirmed';
    if (entry.detector === 'technical_indexing') return 'active';
    const state = entry.state.cooldown?.state;
    if (state === 'eligible') return 'confirmed';
    if (state === 'awaiting_recrawl') return 'pending';
    if (state === 'observing' || state === 'directional') return 'active';
    return 'unknown';
  }

  lineageGitSha(page: SeoPageDetail): string | null {
    const production = this.lineageProduction(page);
    const timeline = page.lineage?.timeline?.[0];
    const candidate = this.lineageGitCandidate(page);
    return production?.gitCommitSha
      || production?.gitSha
      || candidate?.commitSha
      || candidate?.headSha
      || timeline?.gitCommitSha
      || timeline?.gitSha
      || null;
  }

  lineageGitBaseSha(page: SeoPageDetail): string | null {
    const production = this.lineageProduction(page);
    const candidate = this.lineageGitCandidate(page);
    return production?.gitDiffBaseSha
      || candidate?.previousSha
      || candidate?.diffBaseSha
      || candidate?.baseSha
      || null;
  }

  lineageGitCandidate(page: SeoPageDetail): SeoGitCorroboration | null {
    const version = this.currentLineageVersion(page);
    const candidates = [
      page.lineage?.gitCandidate,
      version?.gitCandidate,
      version?.production?.gitCandidate,
      page.lineage?.timeline?.[0]?.gitCandidate,
    ].map((candidate) => this.normalizeGitCandidate(candidate)).filter(
      (candidate): candidate is SeoGitCorroboration => Boolean(candidate),
    );
    return candidates.find((candidate) => Boolean(
      candidate.candidateSignals?.length
      || candidate.signals?.length
      || candidate.previousSha
      || candidate.explanation
      || Number(candidate.changedFileCount || 0) > 0
      || (candidate.status && candidate.status !== 'unavailable'),
    )) ?? candidates[0] ?? null;
  }

  lineageGitSignals(page: SeoPageDetail): string[] {
    const candidate = this.lineageGitCandidate(page);
    return [...new Set((candidate?.candidateSignals || candidate?.signals || [])
      .map(String)
      .filter(Boolean))].slice(0, 12);
  }

  gitSignalLabel(signal: string): string {
    const labels: Record<string, string> = {
      content_source_changed: 'Content source changed',
      rendered_application_source_changed: 'Rendered application source changed',
      declared_page_date_changed: 'Declared page date changed',
      fingerprint_pipeline_changed: 'Fingerprint pipeline changed',
    };
    return labels[signal] || this.humanizeCode(signal);
  }

  gitCandidateSummary(page: SeoPageDetail): string {
    const candidate = this.lineageGitCandidate(page);
    if (!candidate) return 'No page-specific Git candidate evidence is available.';
    const parts: string[] = [];
    if (candidate.status && candidate.status !== 'unavailable') parts.push(this.humanizeCode(candidate.status));
    if (Number(candidate.changedFileCount || 0) > 0) {
      parts.push(`${Number(candidate.changedFileCount)} changed files`);
    }
    const scope = candidate.scope || candidate.diffBaseKind;
    const confidence = candidate.confidence || candidate.diffBaseConfidence;
    if (scope && scope !== 'unavailable') parts.push(this.humanizeCode(scope));
    if (confidence && confidence !== 'unavailable') parts.push(`${this.humanizeCode(confidence)} confidence`);
    if (candidate.truncated) parts.push('entry list truncated');
    return parts.length ? parts.join(' · ') : 'No page-specific Git candidate signal was recorded.';
  }

  gitCandidateAreas(page: SeoPageDetail): string[] {
    const areas = this.lineageGitCandidate(page)?.areas || {};
    return Object.entries(areas)
      .filter(([, count]) => Number.isFinite(Number(count)) && Number(count) > 0)
      .slice(0, 8)
      .map(([area, count]) => `${this.humanizeCode(area)} · ${Number(count)}`);
  }

  gitCorroborationAvailable(page: SeoPageDetail): boolean {
    const candidate = this.lineageGitCandidate(page);
    return Boolean(
      this.lineageGitSha(page)
      || this.lineageGitBaseSha(page)
      || candidate?.previousSha
      || candidate?.candidateSignals?.length
      || candidate?.signals?.length
      || candidate?.explanation
      || Number(candidate?.changedFileCount || 0) > 0
      || (candidate?.status && candidate.status !== 'unavailable'),
    );
  }

  assessmentInputLabel(page: SeoPageDetail): string {
    const input = page.lineage?.assessmentInput;
    if (!input) return 'Page-input match unavailable';
    if (input.current === true) return 'Assessment matches this page version';
    if (input.valid === false) return 'Assessment uses an older page version';
    if (input.current === false) {
      return input.hash || page.assessment
        ? 'Assessment is not current for this page version'
        : 'No current assessment input recorded';
    }
    if (page.assessment?.input?.valid === true && input.valid === true) {
      return 'Assessment matches this page version';
    }
    return 'Page-input match not verified';
  }

  assessmentInputMatchesPage(page: SeoPageDetail): boolean {
    const input = page.lineage?.assessmentInput;
    if (typeof input?.current === 'boolean') return input.current;
    return input?.valid === true && page.assessment?.input?.valid === true;
  }

  assessmentNextReviewDate(page: SeoPageDetail): string | null {
    const hasDetectorCooldown = this.detectorLineageEntries(page)
      .some((entry) => entry.detector !== 'technical_indexing' && Boolean(entry.state.cooldown))
      || Object.keys(page.assessment?.detectorCooldowns || {}).some((detector) => (
        detector !== 'technical_indexing'
      ));
    if (hasDetectorCooldown) return this.lineageCooldown(page)?.nextReviewDate ?? null;
    return page.assessment?.nextReviewDate
      || page.assessment?.cooldown?.nextReviewDate
      || null;
  }

  assessmentRuleVersion(page: SeoPageDetail): string | null {
    return page.assessment?.ruleVersion
      || page.lineage?.assessmentInput?.ruleVersion
      || null;
  }

  assessmentInputSchema(page: SeoPageDetail): string | null {
    return page.assessment?.input?.version
      || page.lineage?.assessmentInput?.inputVersion
      || page.lineage?.assessmentInput?.version
      || null;
  }

  assessmentSemanticVersion(page: SeoPageDetail): string | null {
    return page.assessment?.semanticVersion
      || page.lineage?.assessmentInput?.semanticVersion
      || null;
  }

  lineageHistory(page: SeoPageDetail): SeoLineageTimelineEntry[] {
    return (page.lineage?.timeline || [])
      .filter((entry) => Boolean(entry.versionKey || entry.occurrenceKey || entry.inputHash))
      .slice(0, 4);
  }

  lineageHistoryVersionLabel(entry: SeoLineageTimelineEntry): string {
    return this.shortIdentifier(entry.versionKey || entry.occurrenceKey || entry.inputHash, 12);
  }

  lineageHistoryDate(entry: SeoLineageTimelineEntry): string | null {
    return entry.effectiveAt || entry.observedAt || null;
  }

  lineageHistoryMeta(entry: SeoLineageTimelineEntry): string {
    const parts = [
      this.productionPrecisionLabel(entry.precision),
      entry.deploymentId ? `Deploy ${this.shortIdentifier(entry.deploymentId, 14)}` : null,
      entry.googleCrawlAt ? 'Google crawl recorded' : null,
    ].filter((value): value is string => Boolean(value));
    return parts.join(' · ');
  }

  shortIdentifier(value: string | null | undefined, length = 12): string {
    const normalized = String(value || '').trim();
    if (!normalized) return 'Unavailable';
    return normalized.length > length ? normalized.slice(0, length) : normalized;
  }

  lineageSummary(page: SeoPageDetail): string {
    const cooldown = this.lineageCooldown(page);
    if (!cooldown) return 'The version is recorded, but there is not enough lineage to start a clean performance window.';
    if (cooldown.state === 'awaiting_recrawl') {
      return 'Performance detectors are waiting for Google to crawl the production version. Technical checks continue.';
    }
    if (cooldown.state === 'observing') {
      return 'The production version has been crawled; evidence is still inside the first 14 clean finalized days.';
    }
    if (cooldown.state === 'directional') {
      return 'Directional evidence is visible, but performance actions wait for 28 clean finalized days.';
    }
    return 'The version, production, crawl, and clean finalized window are sufficient for performance decisions.';
  }

  private normalizeGitCandidate(value: SeoGitCorroboration | null | undefined): SeoGitCorroboration | null {
    if (!value || typeof value !== 'object') return null;
    const nestedCandidate = value.candidate && typeof value.candidate === 'object'
      ? value.candidate
      : value.gitCandidate && typeof value.gitCandidate === 'object' ? value.gitCandidate : {};
    const nestedDiff = nestedCandidate.diff && typeof nestedCandidate.diff === 'object'
      ? nestedCandidate.diff
      : value.diff && typeof value.diff === 'object' ? value.diff : {};
    const merged: SeoGitCorroboration = { ...value, ...nestedCandidate, ...nestedDiff };
    merged.candidateSignals = nestedDiff.candidateSignals
      || nestedDiff.changeSignals
      || nestedDiff.signals
      || nestedCandidate.candidateSignals
      || nestedCandidate.changeSignals
      || nestedCandidate.signals
      || value.candidateSignals
      || value.changeSignals
      || value.signals
      || [];
    merged.signals = merged.candidateSignals;
    merged.previousSha = merged.previousSha || merged.diffBaseSha || merged.baseSha || null;
    merged.areas = merged.areas || merged.areaCounts || null;
    merged.changeTypes = merged.changeTypes || merged.changeTypeCounts || null;
    return merged;
  }

  baselineQuality(baseline: SeoCtrBaseline | null | undefined): SeoBaselineQuality | null {
    if (!baseline) return null;
    if (baseline.level) return baseline.level;
    if (typeof baseline.quality === 'string') return baseline.quality;
    return baseline.quality?.level ?? null;
  }

  baselineQualityLabel(baseline: SeoCtrBaseline | null | undefined): string {
    const quality = this.baselineQuality(baseline);
    if (!quality) return 'Quality unavailable';
    return `${quality.charAt(0).toUpperCase()}${quality.slice(1)} quality`;
  }

  baselineCohort(baseline: SeoCtrBaseline | null | undefined): string {
    if (!baseline) return 'Unavailable';
    if (typeof baseline.quality === 'object' && baseline.quality?.cohort) {
      return this.humanizeCode(baseline.quality.cohort);
    }
    return baseline.cohort ? this.humanizeCode(baseline.cohort) : 'Unavailable';
  }

  baselineCount(
    baseline: SeoCtrBaseline | null | undefined,
    metric: 'peers' | 'clicks' | 'impressions',
  ): number | null {
    if (!baseline) return null;
    if (typeof baseline.quality === 'object' && Number.isFinite(baseline.quality?.[metric])) {
      return Number(baseline.quality?.[metric]);
    }
    const flat = metric === 'peers'
      ? baseline.peers ?? baseline.peerPageCount
      : metric === 'clicks'
        ? baseline.clicks ?? baseline.peerClicks
        : baseline.impressions ?? baseline.peerImpressions;
    return typeof flat === 'number' && Number.isFinite(flat) ? flat : null;
  }

  baselineZeroClickRate(baseline: SeoCtrBaseline | null | undefined): number | null {
    if (!baseline) return null;
    if (typeof baseline.quality === 'object' && Number.isFinite(baseline.quality?.zeroClickPeerRate)) {
      return Number(baseline.quality?.zeroClickPeerRate);
    }
    if (typeof baseline.zeroClickPeerRate === 'number' && Number.isFinite(baseline.zeroClickPeerRate)) {
      return baseline.zeroClickPeerRate;
    }
    if (typeof baseline.zeroClickPeerShare === 'number' && Number.isFinite(baseline.zeroClickPeerShare)) {
      return baseline.zeroClickPeerShare;
    }
    return Number.isFinite(baseline.zeroClickSharePercent)
      ? Number(baseline.zeroClickSharePercent) / 100
      : null;
  }

  formatShare(value: number | null | undefined): string {
    if (!Number.isFinite(value)) return 'Unavailable';
    const numeric = Number(value);
    const percent = Math.abs(numeric) <= 1 ? numeric * 100 : numeric;
    return `${percent.toFixed(1)}%`;
  }

  formatCoveragePercent(value: number | null | undefined): string {
    if (!Number.isFinite(value)) return 'Unavailable';
    return `${Number(value).toFixed(1)}%`;
  }

  formatEvidenceMetric(
    metrics: SeoReconciliationSlice | null | undefined,
    metric: 'clicks' | 'impressions' | 'ctr' | 'averagePosition',
  ): string {
    const value = metrics?.[metric];
    if (value === null || value === undefined || Number.isNaN(value)) return 'Unavailable';
    if (metric === 'ctr') return this.formatMetric(value, 'percent');
    if (metric === 'averagePosition') return this.formatMetric(value, 'position');
    return this.formatMetric(value, 'number');
  }

  partitionWindowLabel(window: SeoReconciliationPartitionWindow | null | undefined): string {
    if (!window) return 'Usable-day coverage unavailable';
    const completed = window.completedDays;
    const required = window.requiredDays;
    if (!Number.isFinite(completed) || !Number.isFinite(required)) return 'Usable-day coverage unavailable';
    const truncated = window.truncatedDays ?? 0;
    const missing = window.missingDays ?? Math.max(0, Number(required) - Number(completed) - truncated);
    return [
      `${completed}/${required} usable days`,
      missing > 0 ? `${missing} missing` : null,
      truncated > 0 ? `${truncated} truncated` : null,
    ].filter((value): value is string => Boolean(value)).join(' · ');
  }

  humanizeCode(value: string): string {
    const normalized = String(value || '').trim().replace(/[_-]+/g, ' ');
    if (!normalized) return 'Unavailable';
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }

  formatMetric(value: number | null | undefined, kind: 'number' | 'percent' | 'position'): string {
    if (value === null || value === undefined || Number.isNaN(value)) return '—';
    if (kind === 'percent') return `${(value * 100).toFixed(2)}%`;
    if (kind === 'position') return value.toFixed(1);
    return new Intl.NumberFormat('en-US', { notation: value >= 100000 ? 'compact' : 'standard' }).format(value);
  }

  formatBytes(value: number | null | undefined): string {
    if (value === null || value === undefined || value < 0) return '—';
    if (value < 1024) return `${value} B`;
    const units = ['KB', 'MB', 'GB'];
    let amount = value / 1024;
    let unit = units[0];
    for (let index = 1; amount >= 1024 && index < units.length; index += 1) {
      amount /= 1024;
      unit = units[index];
    }
    return `${amount.toFixed(amount >= 10 ? 0 : 1)} ${unit}`;
  }

  deltaTone(delta: number | null, inverse = false): 'positive' | 'negative' | 'neutral' {
    if (delta === null || Math.abs(delta) < 0.05) return 'neutral';
    const positive = inverse ? delta < 0 : delta > 0;
    return positive ? 'positive' : 'negative';
  }

  dateKeyForDisplay(value: string | null | undefined): Date | null {
    if (!value) return null;
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return null;

    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    const day = Number(match[3]);
    const date = new Date(Date.UTC(year, month, day));
    if (
      Number.isNaN(date.getTime())
      || date.getUTCFullYear() !== year
      || date.getUTCMonth() !== month
      || date.getUTCDate() !== day
    ) return null;
    return date;
  }

  confidencePercent(action: SeoAction): number {
    const raw = action.confidence <= 1 ? action.confidence * 100 : action.confidence;
    return Math.max(0, Math.min(100, Math.round(raw)));
  }

  isSuppressionActive(value: string | null | undefined): boolean {
    if (!value) return false;
    const timestamp = new Date(value).getTime();
    return Number.isFinite(timestamp) && timestamp > Date.now();
  }

  canTransition(status: SeoActionStatus, event: SeoActionTransition): boolean {
    if (event === 'approve') return status === 'proposed';
    if (event === 'mark_implemented') return status === 'approved';
    if (event === 'snooze') return status === 'proposed' || status === 'approved' || status === 'implementation_pending';
    if (event === 'dismiss') return status === 'proposed' || status === 'approved' || status === 'implementation_pending';
    if (event === 'acknowledge_verdict' || event === 'override_verdict') return status === 'evaluated';
    if (event === 'reopen') return status === 'closed' || status === 'dismissed' || status === 'snoozed';
    return false;
  }

  trackAction(_: number, action: SeoAction): string {
    return action.id;
  }

  private analysisResponseMessage(status: SeoAnalysisStatus): string {
    if (status === 'complete') return 'Analysis completed. The latest page decisions and action queues are being refreshed.';
    if (status === 'running') return 'Analysis started. Analysis health will show progress as pages are evaluated.';
    if (status === 'partial') return 'Analysis stopped before every page was evaluated. No all-clear is implied; retry after checking Analysis health.';
    if (status === 'not_ready') return 'Analysis request finished, but the evidence window is not ready. No recommendations were inferred.';
    return 'Analysis failed. No complete current analysis is available; review Analysis health before retrying.';
  }

  private analysisHealthPresentation(
    kind: AnalysisHealthKind,
    reason: string | null,
    counts: { completedDays: number; requiredDays: number; decisionPackets: number; totalPages: number },
  ): Pick<AnalysisHealthView, 'tone' | 'label' | 'title' | 'detail'> {
    if (kind === 'running') {
      return {
        tone: 'info',
        label: 'Running',
        title: 'Page decisions are being evaluated',
        detail: counts.totalPages > 0
          ? `${counts.decisionPackets}/${counts.totalPages} decision packets committed so far.`
          : 'The latest finalized evidence window is being evaluated.',
      };
    }
    if (kind === 'failed') {
      return {
        tone: 'error',
        label: 'Failed',
        title: 'The latest analysis failed',
        detail: this.analysisReasonText(reason)
          || 'Existing decisions remain visible, but an empty action queue must not be treated as an all-clear.',
      };
    }
    if (kind === 'stale') {
      return {
        tone: 'warning',
        label: 'Stale',
        title: 'Analysis is behind the latest finalized data',
        detail: 'Run Analyze now so every current manifest page is evaluated against the latest available evidence.',
      };
    }
    if (kind === 'not_ready') {
      const productionVerificationBlocked = PRODUCTION_MARKER_READINESS_REASONS.has(reason ?? '');
      return {
        tone: 'warning',
        label: productionVerificationBlocked ? 'Not verified' : 'Not ready',
        title: productionVerificationBlocked
          ? 'Production frontend verification is required'
          : counts.completedDays < counts.requiredDays
          ? `Evidence window is still filling · ${counts.completedDays}/${counts.requiredDays}`
          : 'Analysis has not reached a complete decision',
        detail: this.analysisReasonText(reason)
          || 'The request completed without a decision-grade run. No all-clear is implied.',
      };
    }
    if (kind === 'partial') {
      return {
        tone: 'warning',
        label: 'Partial',
        title: `${counts.decisionPackets}/${counts.totalPages} decision packets committed`,
        detail: this.analysisReasonText(reason)
          || 'The run stopped before every current manifest page received a decision packet.',
      };
    }
    if (kind === 'complete') {
      return {
        tone: 'clear',
        label: 'Complete',
        title: 'Latest analysis is complete',
        detail: counts.totalPages > 0
          ? `All ${counts.totalPages} current manifest pages have a balanced-v2.1 decision packet.`
          : 'The current finalized evidence window was analyzed successfully.',
      };
    }
    return {
      tone: 'neutral',
      label: 'Not run',
      title: 'No page analysis has been recorded yet',
      detail: 'Run Analyze now after the finalized evidence window is ready. Until then, page inventory is not an SEO judgment.',
    };
  }

  private analysisReasonText(reason: string | null): string | null {
    if (!reason) return null;
    const reasons: Record<string, string> = {
      insufficient_contiguous_page_data: 'Two contiguous 28-day page windows are required before performance recommendations are trustworthy.',
      missing_analysis_window: 'The two required 28-day page windows are not available yet.',
      no_persisted_finalized_data: 'No finalized Search Console page data has been persisted yet. Run Sync now before analysis.',
      no_finalized_data: 'No finalized Search Console data is available yet. Run Sync now before analysis.',
      no_analysis_end_date: 'A stable finalized data-through date is not available for this analysis.',
      analysis_rule_outdated: 'The saved decisions use an older rule set and must be re-evaluated with balanced-v2.1.',
      analysis_deadline: 'The previous request reached its execution deadline before analysis could finish. The saved results are not an all-clear.',
      analysis_running: 'Another sync or analysis still owns the active processing lease.',
      analysis_failed: 'The analysis failed before a complete set of decision packets was committed.',
      finalized_data_stale: 'Finalized Search Console data is stale. Complete a successful sync before evaluating recommendations.',
      sync_unhealthy: 'Search Console ingestion is not healthy enough to support a current analysis.',
      no_manifest_pages: 'No indexable manifest pages are available to evaluate.',
      enrichment_disabled: 'Decision-packet enrichment is disabled for this run.',
      no_metric_progress: 'The latest sync did not add finalized page evidence to evaluate.',
      manifest_changed_since_analysis: 'The page inventory changed after the saved run, so current pages must be evaluated again.',
      page_assessments_incomplete: 'One or more current pages do not have a complete decision packet.',
      latest_data_not_analyzed: 'Newer finalized Search Console data is available than the last completed analysis.',
      not_run: 'The evidence window is available, but no balanced-v2.1 page evaluation has completed yet.',
      production_marker_unavailable: 'The production frontend fingerprint and deployment could not be verified because its build marker is unavailable. No SEO decisions were inferred. Confirm the production frontend is reachable, then retry.',
      production_marker_invalid: 'The production frontend fingerprint and deployment could not be verified because its build marker is invalid. No SEO decisions were inferred. Rebuild and redeploy the frontend, then retry.',
      production_marker_source_mismatch: 'The production frontend fingerprint does not match the backend manifest, so the deployment is not verified. No SEO decisions were inferred. Deploy the frontend and backend from the same manifest commit, then retry.',
      production_marker_contract_mismatch: 'The production frontend marker contract does not match the backend manifest contract, so the fingerprint and deployment could not be verified. No SEO decisions were inferred. Deploy compatible frontend and backend builds from the same manifest commit, then retry.',
      production_marker_not_production: 'The fetched build marker is not from the production frontend, so the production fingerprint and deployment could not be verified. No SEO decisions were inferred. Deploy the production frontend, then retry.',
      production_marker_identity_missing: 'The production frontend build marker is missing required deployment identity, so its fingerprint and deployment could not be verified. No SEO decisions were inferred. Regenerate and redeploy the production frontend, then retry.',
      production_marker_not_ready: 'The production frontend fingerprint and deployment are not verified yet. No SEO decisions were inferred. Wait for the production deployment to finish, then retry.',
    };
    return reasons[reason]
      ?? 'Analysis stopped before a verified decision-grade result was available. No SEO decisions were inferred.';
  }

  private safeAnalysisDiagnostic(input: {
    runId?: string | null;
    status?: string | null;
    reason?: string | null;
  }): string | null {
    const parts: string[] = [];
    const status = this.safeDiagnosticToken(input.status, false);
    const reason = this.safeDiagnosticToken(input.reason, false);
    const runId = this.safeDiagnosticToken(input.runId, true);
    if (status && status !== 'complete') parts.push(status);
    if (reason) parts.push(reason);
    if (runId) parts.push(`Run ${this.shortIdentifier(runId, 16)}`);
    return parts.length ? parts.join(' · ') : null;
  }

  private safeAnalysisErrorDiagnostic(error: unknown): string | null {
    const candidate = error && typeof error === 'object' ? error as Record<string, unknown> : {};
    const body = candidate['error'] && typeof candidate['error'] === 'object'
      ? candidate['error'] as Record<string, unknown>
      : {};
    const parts: string[] = [];
    const httpStatus = Number(candidate['status']);
    if (Number.isInteger(httpStatus) && httpStatus >= 400 && httpStatus <= 599) {
      parts.push(`HTTP ${httpStatus}`);
    }
    const code = this.safeDiagnosticToken(body['code'], false);
    const status = this.safeDiagnosticToken(body['status'], false);
    const runId = this.safeDiagnosticToken(body['runId'], true);
    if (code) parts.push(code);
    else if (status) parts.push(status);
    if (runId) parts.push(`Run ${this.shortIdentifier(runId, 16)}`);
    return parts.length ? parts.join(' · ') : null;
  }

  private safeDiagnosticToken(value: unknown, allowMixedCase: boolean): string | null {
    if (typeof value !== 'string') return null;
    const normalized = value.trim();
    const pattern = allowMixedCase ? /^[A-Za-z0-9_-]{1,80}$/ : /^[A-Z0-9_-]{1,80}$/i;
    return pattern.test(normalized) ? normalized : null;
  }

  private loadOverview(): void {
    const request = ++this.overviewRequest;
    this.overviewLoading.set(true);
    this.overviewError.set(null);
    this.seoAdmin.getOverview(this.windowDays(), this.segment()).subscribe({
      next: (overview) => {
        if (request !== this.overviewRequest) return;
        this.overview.set(overview);
        this.overviewLoading.set(false);
      },
      error: () => {
        if (request !== this.overviewRequest) return;
        this.overviewLoading.set(false);
        this.overviewError.set('Search performance could not be loaded. Existing action queues remain available.');
      },
    });
  }

  private loadNowActions(): void {
    const request = ++this.nowRequest;
    this.nowLoading.set(true);
    this.nowError.set(null);
    this.seoAdmin.getActions({ queue: 'now', limit: 10 }).subscribe({
      next: (response) => {
        if (request !== this.nowRequest) return;
        this.nowActions.set(response.items.slice(0, 10));
        this.nowLoading.set(false);
      },
      error: () => {
        if (request !== this.nowRequest) return;
        this.nowLoading.set(false);
        this.nowError.set('Priority actions could not be loaded.');
      },
    });
  }

  private loadBacklog(reset: boolean): void {
    const request = ++this.backlogRequest;
    const cursor = reset ? null : this.backlogCursor();
    if (reset) {
      this.backlogLoading.set(true);
      this.backlogError.set(null);
    } else {
      this.backlogLoadingMore.set(true);
    }

    this.seoAdmin.getActions({
      queue: 'backlog',
      status: this.backlogStatus(),
      type: this.backlogType(),
      search: this.backlogSearch(),
      cursor,
      limit: 30,
    }).subscribe({
      next: (response) => {
        if (request !== this.backlogRequest) return;
        this.backlogActions.set(reset ? response.items : [...this.backlogActions(), ...response.items]);
        this.backlogTotal.set(response.total);
        this.backlogCursor.set(response.nextCursor);
        this.backlogLoading.set(false);
        this.backlogLoadingMore.set(false);
      },
      error: () => {
        if (request !== this.backlogRequest) return;
        this.backlogLoading.set(false);
        this.backlogLoadingMore.set(false);
        this.backlogError.set('The backlog could not be loaded. Change a filter or try again.');
      },
    });
  }

  private loadPages(reset: boolean): void {
    const request = ++this.pageInventoryRequest;
    const cursor = reset ? null : this.pagesCursor();
    if (reset) {
      this.pagesLoading.set(true);
      this.pagesError.set(null);
      this.pageMetricWindow.set(null);
    } else {
      this.pagesLoadingMore.set(true);
    }

    this.seoAdmin.getPages(
      this.pagesSearch(),
      cursor,
      30,
      this.pagesUnconfirmedOnly() ? false : undefined,
    ).subscribe({
      next: (response) => {
        if (request !== this.pageInventoryRequest) return;
        this.pages.set(reset ? response.items : [...this.pages(), ...response.items]);
        this.pagesTotal.set(response.total);
        this.pagesCursor.set(response.nextCursor);
        this.pageMetricWindow.set(response.metricWindow ?? null);
        this.pagesLoading.set(false);
        this.pagesLoadingMore.set(false);
      },
      error: () => {
        if (request !== this.pageInventoryRequest) return;
        this.pagesLoading.set(false);
        this.pagesLoadingMore.set(false);
        this.pagesError.set('The page inventory could not be loaded.');
      },
    });
  }

  private loadSyncRuns(): void {
    const request = ++this.syncRunsRequest;
    this.syncRunsLoading.set(true);
    this.syncRunsError.set(null);
    this.seoAdmin.getSyncRuns(6).subscribe({
      next: (response) => {
        if (request !== this.syncRunsRequest) return;
        this.syncRuns.set(response.items);
        this.syncRunsLoading.set(false);
      },
      error: () => {
        if (request !== this.syncRunsRequest) return;
        this.syncRunsLoading.set(false);
        this.syncRunsError.set('Recent sync history is unavailable.');
      },
    });
  }

  private setActionDrafts(action: SeoAction): void {
    this.copyDirectionDraft.set(action.recommendation.copyDirection ?? '');
    this.successCriteriaDraft.set(action.recommendation.successCriteria ?? '');
  }

  private clearSensitiveState(): void {
    this.overviewRequest += 1;
    this.nowRequest += 1;
    this.backlogRequest += 1;
    this.actionRequest += 1;
    this.pageRequest += 1;
    this.pageInventoryRequest += 1;
    this.syncRunsRequest += 1;
    this.analysisRequest += 1;

    this.overview.set(null);
    this.overviewLoading.set(false);
    this.overviewError.set(null);
    this.nowActions.set([]);
    this.nowLoading.set(false);
    this.nowError.set(null);
    this.backlogActions.set([]);
    this.backlogTotal.set(0);
    this.backlogCursor.set(null);
    this.backlogLoading.set(false);
    this.backlogLoadingMore.set(false);
    this.backlogError.set(null);
    this.pages.set([]);
    this.pagesTotal.set(0);
    this.pagesCursor.set(null);
    this.pagesLoading.set(false);
    this.pagesLoadingMore.set(false);
    this.pagesError.set(null);
    this.pageMetricWindow.set(null);
    this.syncRuns.set([]);
    this.syncRunsLoading.set(false);
    this.syncRunsError.set(null);

    this.actionDialogOpen.set(false);
    this.selectedAction.set(null);
    this.actionLoading.set(false);
    this.actionError.set(null);
    this.transitionBusy.set(false);
    this.transitionError.set(null);
    this.transitionNote.set('');
    this.copyDirectionDraft.set('');
    this.successCriteriaDraft.set('');
    this.pageDialogOpen.set(false);
    this.selectedPage.set(null);
    this.pageLoading.set(false);
    this.pageError.set(null);
    this.intentSaving.set(false);
    this.intentError.set(null);
    this.intentDraft.set('');
    this.readerPromiseDraft.set('');
    this.targetKeywordDraft.set('');
    this.intentConfirmedDraft.set(false);
    this.manualDialogOpen.set(false);
    this.manualSaving.set(false);
    this.manualError.set(null);
    this.manualForm = this.emptyManualForm();
    this.syncBusy.set(false);
    this.syncNotice.set(null);
    this.analysisBusy.set(false);
    this.analysisNotice.set(null);
    this.announcement.set('');
  }

  private emptyManualForm(): ManualActionForm {
    return {
      url: '',
      type: 'manual',
      title: '',
      hypothesis: '',
      changeSummary: '',
      implementedAt: '',
      historicalUnverified: false,
    };
  }
}
