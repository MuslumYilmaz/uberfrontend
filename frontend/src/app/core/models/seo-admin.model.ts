export type SeoWindowDays = 7 | 28 | 90;
export type SeoSearchSegment = 'nonbrand' | 'brand' | 'all';
export type SeoCoverageStatus = 'unavailable' | 'partial' | 'limited' | 'sufficient' | 'inconsistent';

export type SeoActionType =
  | 'ctr_snippet'
  | 'intent_mismatch'
  | 'content_decay'
  | 'cannibalization'
  | 'internal_link'
  | 'technical_indexing'
  | 'manual';

export type SeoActionStatus =
  | 'proposed'
  | 'approved'
  | 'implementation_pending'
  | 'measuring'
  | 'evaluated'
  | 'snoozed'
  | 'dismissed'
  | 'closed';

export type SeoActionVerdict = 'success' | 'failed' | 'inconclusive' | null;

export type SeoActionTransition =
  | 'approve'
  | 'mark_implemented'
  | 'snooze'
  | 'dismiss'
  | 'acknowledge_verdict'
  | 'override_verdict'
  | 'reopen';

export interface SeoOwnerAccess {
  allowed: boolean;
  enabled: boolean;
  reason?: string | null;
  automation?: {
    configured: boolean;
    warning?: string | null;
  };
  capabilities?: {
    contractVersion?: string | null;
    manualAnalysis?: boolean;
  };
}

export interface SeoMetricValue {
  value: number;
  previousValue: number | null;
  deltaPercent: number | null;
}

export interface SeoOverviewKpis {
  clicks: SeoMetricValue;
  impressions: SeoMetricValue;
  ctr: SeoMetricValue;
  averagePosition: SeoMetricValue;
}

export type SeoAnalysisStatus = 'running' | 'not_ready' | 'partial' | 'complete' | 'failed';

export interface SeoAnalysisSummary {
  status: SeoAnalysisStatus;
  reason?: string | null;
  ruleVersion?: string | null;
  endDate?: string | null;
  windowDays?: number;
  currentForLatestData?: boolean;
  completedDays?: number;
  requiredDays?: number;
  evaluatedPages?: number;
  committedAssessmentPages?: number;
  totalPages?: number;
  eligiblePages?: number;
  proposedActions?: number;
  clearedActions?: number;
  cooldown?: {
    awaitingRecrawl?: number;
    observing?: number;
    directional?: number;
    eligible?: number;
  };
  dataQualityBlockedPages?: number;
  decisionBlockedPages?: number;
  startedAt?: string | null;
  completedAt?: string | null;
}

export interface SeoTrendPoint {
  date: string;
  clicks: number;
  impressions: number;
  ctr: number;
  averagePosition: number;
}

export interface SeoDataHealth {
  siteUrl: string;
  latestFinalizedDate: string | null;
  lastSuccessfulSyncAt: string | null;
  nextScheduledSyncAt?: string | null;
  backfillPercent: number;
  backfill?: {
    completedDays: number;
    expectedDays: number;
    percent: number;
    nextDate: string | null;
    complete: boolean;
  };
  recommendationReadiness?: {
    completedDays: number;
    requiredDays: number;
    ready: boolean;
  };
  queryCoveragePercent: number | null;
  queryCoverageStatus?: SeoCoverageStatus;
  queryCoverageSufficient?: boolean;
  queryCoverageWindow?: SeoReconciliationPartitionWindow;
  deviceCoveragePercent?: number | null;
  deviceCoverageStatus?: SeoCoverageStatus;
  deviceCoverageSufficient?: boolean;
  deviceCoverageWindow?: SeoReconciliationPartitionWindow;
  storageUsedBytes?: number | null;
  storageBudgetBytes?: number | null;
  truncated: boolean;
  stale: boolean;
  syncStatus: 'idle' | 'running' | 'failed' | 'disabled' | 'waiting';
  automationConfigured?: boolean;
  warning?: string | null;
  windowCompleteness?: {
    slice: 'property' | 'queryPage';
    current: SeoWindowCompleteness;
    previous: SeoWindowCompleteness;
  };
}

export interface SeoWindowCompleteness {
  complete: boolean;
  availableDays: number;
  expectedDays: number;
}

export interface SeoPageMetricWindow extends SeoWindowCompleteness {
  startDate: string;
  endDate: string;
}

export interface SeoOverview {
  generatedAt: string;
  windowDays: SeoWindowDays;
  segment: SeoSearchSegment;
  dataHealth: SeoDataHealth;
  analysis?: SeoAnalysisSummary | null;
  kpis: SeoOverviewKpis;
  trend: SeoTrendPoint[];
  actionSummary?: {
    nowCount: number;
    backlogCount: number;
    measuringCount: number;
  };
}

export interface SeoQueryCluster {
  label: string;
  intent?: string | null;
  key?: string | null;
  facet?: string | null;
  clicks: number;
  impressions: number;
  ctr: number;
  averagePosition: number;
  impressionShare?: number | null;
  visibleShare?: number | null;
  fullPageLowerBoundShare?: number | null;
  topicAlignment?: number | null;
  visibleSharePercent?: number | null;
  fullPageLowerBoundSharePercent?: number | null;
  topicAlignmentPercent?: number | null;
  semanticCoveragePercent?: number | null;
}

export type SeoPageAssessmentState = 'not_evaluable' | 'clear' | 'watch' | 'actionable';
export type SeoEvidenceLevel = 'insufficient' | 'directional' | 'moderate' | 'strong' | 'decision_grade';
export type SeoBaselineQuality = 'insufficient' | 'low' | 'medium' | 'high';
export type SeoCooldownStatus = 'awaiting_recrawl' | 'observing' | 'directional' | 'eligible';
export type SeoDecisionDisposition =
  | 'insufficient_evidence'
  | 'monitor'
  | 'investigate'
  | 'structural_review'
  | 'change_ready'
  | 'no_change';
export type SeoTechnicalStatus = 'clear' | 'issue' | 'unverified';
export type SeoNextReviewEvent =
  | 'url_inspection'
  | 'post_deploy_crawl'
  | '14_finalized_days'
  | '28_finalized_days'
  | 'coverage_threshold'
  | 'serp_review';

export type SeoNextReview =
  | {
      mode: 'date';
      at: string;
      event?: never;
      rationale: string;
    }
  | {
      mode: 'event';
      at?: never;
      event: SeoNextReviewEvent | string;
      rationale: string;
    };

export interface SeoExpectedImpact {
  metric: 'clicks' | string;
  low?: number | null;
  point?: number | null;
  high?: number | null;
  windowDays?: number | null;
  quality: 'not_estimated' | 'directional' | 'modeled' | string;
}

export interface SeoDecisionGate {
  code: string;
  passed: boolean;
  label?: string | null;
  detail?: string | null;
}

export interface SeoVisibilityAssessment {
  state?: SeoPageAssessmentState | null;
  disposition?: SeoDecisionDisposition | null;
  status?: string | null;
  interrupted?: boolean | null;
  requiresInspection?: boolean | null;
  zeroImpressionStreakDays?: number | null;
  zeroImpressionStreak?: number | null;
  baselineImpressions?: number | null;
  baselineVisibleDays?: number | null;
  pageShareDropPercent?: number | null;
  shareDrop?: number | null;
  patternConfidence?: number | null;
  causeConfidence?: number | null;
  firstVisibleDate?: string | null;
  priorVisibleDays?: number | null;
  pageShareDrop?: number | null;
  propertyActive?: boolean | null;
  interruptionDetected?: boolean | null;
  recoveryStatus?: 'none' | 'partial' | 'recovered' | string | null;
  evidence?: Record<string, unknown> | null;
  reasonCodes?: string[];
  nextReview?: SeoNextReview | null;
}

export type SeoQueryOpportunityClassification =
  | 'snippet_gap'
  | 'ranking_gap'
  | 'intent_gap'
  | 'source_preference'
  | 'visibility_interruption'
  | 'not_evaluable';

export interface SeoQueryOpportunityMetrics {
  clicks?: number | null;
  impressions?: number | null;
  ctr?: number | null;
  position?: number | null;
  averagePosition?: number | null;
}

export type SeoOpportunityReviewReasonCode =
  | 'none'
  | 'snippet_not_specific'
  | 'snippet_not_competitive'
  | 'content_depth_gap'
  | 'intent_misalignment'
  | 'source_preference'
  | 'serp_feature_competition'
  | 'insufficient_evidence';

export interface SeoOpportunityReview {
  observedAt: string;
  locale: string;
  device: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  dominantResultType: 'official' | 'community' | 'publisher' | 'mixed' | 'unknown';
  serpFeatures: string[];
  ownResultStatus: 'not_visible' | 'present_weak' | 'present_competitive' | 'unknown';
  outcome: 'no_change' | 'snippet_test' | 'content_test' | 'needs_more_evidence';
  reasonCode?: SeoOpportunityReviewReasonCode;
  updatedAt?: string | null;
  expiresAt?: string | null;
}

export interface SeoQueryOpportunity {
  key: string;
  clusterKey?: string | null;
  safeLabel?: string | null;
  label?: string | null;
  facet?: string | null;
  classification: SeoQueryOpportunityClassification;
  state?: SeoPageAssessmentState | null;
  disposition?: SeoDecisionDisposition | null;
  summary?: string | null;
  recommendedSurface?: 'title' | 'description' | 'h1' | 'body' | 'internal_link' | 'inspection' | string | null;
  current?: SeoQueryOpportunityMetrics | null;
  previous?: SeoQueryOpportunityMetrics | null;
  coverage?: {
    query?: number | null;
    semantic?: number | null;
    device?: number | null;
  } | null;
  persistence?: {
    stableWeeks?: number | null;
    requiredWeeks?: number | null;
    totalWeeks?: number | null;
    zeroImpressionStreak?: number | null;
  } | null;
  coveragePercent?: number | null;
  semanticCoveragePercent?: number | null;
  persistenceWeeks?: number | null;
  requiredPersistenceWeeks?: number | null;
  positionStable?: boolean | null;
  patternConfidence?: number | null;
  causeConfidence?: number | null;
  blockerCodes?: string[];
  blockers?: string[];
  reasonCodes?: string[];
  expectedImpact?: SeoExpectedImpact | null;
  nextReview?: SeoNextReview | null;
  review?: SeoOpportunityReview | null;
  reviewReady?: boolean;
  canRequestExamples?: boolean;
  canReviewSerp?: boolean;
  canPromote?: boolean;
}

export interface SeoAssessmentFinding {
  code?: string | null;
  detector?: string | null;
  state?: SeoPageAssessmentState | null;
  label?: string | null;
  summary?: string | null;
  evidence?: { summary?: string | null } | null;
  confidence?: number | null;
  patternConfidence?: number | null;
  causeConfidence?: number | null;
  disposition?: SeoDecisionDisposition | null;
  decisionGates?: SeoDecisionGate[];
  nextReview?: SeoNextReview | null;
  counterEvidence?: string[];
}

export interface SeoPageCooldown {
  state: SeoCooldownStatus;
  status?: string | null;
  reason?: string | null;
  detector?: SeoDetectorType | null;
  changedComponents?: string[];
  changedAt?: string | null;
  materialChangedAt?: string | null;
  productionEffectiveAt?: string | null;
  changeEffectiveAt?: string | null;
  productionPrecision?: SeoLineagePrecision | null;
  productionSource?: SeoLineageProductionSource | string | null;
  lastGoogleCrawlAt?: string | null;
  confirmedCrawlAt?: string | null;
  cleanFinalizedDays?: number | null;
  cleanWindowStartDate?: string | null;
  decisionDataThrough?: string | null;
  nextReviewDate?: string | null;
}

export type SeoLineagePrecision = 'exact' | 'upper_bound' | 'unknown' | 'legacy_baseline';
export type SeoLineageProductionSource =
  | 'manifest_ready_at'
  | 'runtime_observed'
  | 'legacy_baseline'
  | 'unknown';
export type SeoDetectorType = Exclude<SeoActionType, 'manual'>;

export type SeoFingerprintEvidenceStatus = 'complete' | 'partial' | 'unavailable' | 'legacy';

export interface SeoFingerprintEvidence {
  source?: string | null;
  prerenderedAvailable?: boolean | null;
  limitations?: string[];
  statuses?: Record<string, SeoFingerprintEvidenceStatus | string>;
  status?: SeoFingerprintEvidenceStatus | string | null;
}

export interface SeoLineageProduction {
  effectiveAt?: string | null;
  readyAt?: string | null;
  effectiveAtLowerBound?: string | null;
  effectiveAtUpperBound?: string | null;
  precision?: SeoLineagePrecision | null;
  source?: SeoLineageProductionSource | null;
  deploymentId?: string | null;
  gitCommitSha?: string | null;
  gitDiffBaseSha?: string | null;
  gitSha?: string | null;
  gitCandidate?: SeoGitCorroboration | null;
}

export interface SeoLineageCrawl {
  lastGoogleCrawlAt?: string | null;
  confirmedAfterProduction?: boolean | null;
  confirmedAfterVersion?: boolean | null;
  confirmedAt?: string | null;
}

export interface SeoLineageVersion {
  versionKey?: string | null;
  occurrenceKey?: string | null;
  inputHash?: string | null;
  compositeHash?: string | null;
  fingerprintVersion?: string | null;
  fingerprintSchemaVersion?: string | number | null;
  observedAt?: string | null;
  changedComponents?: string[];
  manifest?: {
    version?: string | null;
    sourceHash?: string | null;
    generatedAt?: string | null;
  } | null;
  production?: SeoLineageProduction | null;
  fingerprintEvidence?: SeoFingerprintEvidence | null;
  gitCandidate?: SeoGitCorroboration | null;
  crawl?: SeoLineageCrawl | null;
  evidenceSource?: string | null;
  availability?: string | null;
  limitations?: string[];
}

export interface SeoLineageTimelineEntry {
  versionKey?: string | null;
  occurrenceKey?: string | null;
  inputHash?: string | null;
  observedAt?: string | null;
  effectiveAt?: string | null;
  precision?: SeoLineagePrecision | null;
  source?: SeoLineageProductionSource | string | null;
  changedComponents?: string[];
  affectedDetectors?: SeoDetectorType[];
  deploymentId?: string | null;
  gitCommitSha?: string | null;
  gitSha?: string | null;
  gitCandidate?: SeoGitCorroboration | null;
  crawlConfirmedAt?: string | null;
  googleCrawlAt?: string | null;
  crawlConfirmedDetectors?: SeoDetectorType[];
}

export interface SeoDetectorLineageState {
  affected?: boolean;
  versionKey?: string | null;
  occurrenceKey?: string | null;
  changedComponents?: string[];
  changeEffectiveAt?: string | null;
  productionPrecision?: SeoLineagePrecision | null;
  productionSource?: SeoLineageProductionSource | string | null;
  implementationReportedAt?: string | null;
  awaitingManifestChange?: boolean;
  expectedChangedComponents?: string[];
  crawlRequired?: boolean;
  crawlConfirmed?: boolean;
  lastGoogleCrawlAt?: string | null;
  confirmedCrawlAt?: string | null;
  cooldown?: SeoPageCooldown | null;
}

export interface SeoGitCorroboration {
  authority?: 'corroborating_only' | string | null;
  status?: string | null;
  scope?: string | null;
  confidence?: string | null;
  previousSha?: string | null;
  baseSha?: string | null;
  diffBaseSha?: string | null;
  headSha?: string | null;
  commitSha?: string | null;
  diffBaseKind?: string | null;
  diffBaseConfidence?: string | null;
  changedFileCount?: number | null;
  returnedEntryCount?: number | null;
  entryLimit?: number | null;
  truncated?: boolean | null;
  changeTypes?: Record<string, number> | null;
  changeTypeCounts?: Record<string, number> | null;
  areas?: Record<string, number> | null;
  areaCounts?: Record<string, number> | null;
  candidateSignals?: string[];
  changeSignals?: string[];
  signals?: string[];
  explanation?: string | null;
  candidate?: SeoGitCorroboration | null;
  gitCandidate?: SeoGitCorroboration | null;
  diff?: SeoGitCorroboration | null;
}

export interface SeoPageLineage {
  currentVersion?: SeoLineageVersion | null;
  timeline?: SeoLineageTimelineEntry[];
  detectorStates?: Partial<Record<SeoDetectorType, SeoDetectorLineageState>> | null;
  assessmentInput?: {
    hash?: string | null;
    version?: string | null;
    inputVersion?: string | null;
    semanticVersion?: string | null;
    ruleVersion?: string | null;
    pageVersionKey?: string | null;
    currentHash?: string | null;
    currentPageVersionKey?: string | null;
    valid?: boolean | null;
    current?: boolean | null;
  } | null;
  gitCandidate?: SeoGitCorroboration | null;
}

export interface SeoCtrBaseline {
  quality?: SeoBaselineQuality | {
    level?: SeoBaselineQuality;
    cohort?: string | null;
    peers?: number;
    clicks?: number;
    impressions?: number;
    zeroClickPeerRate?: number | null;
  };
  level?: SeoBaselineQuality;
  cohort?: string | null;
  ctr?: number | null;
  lower90?: number | null;
  upper90?: number | null;
  peers?: number;
  clicks?: number;
  impressions?: number;
  zeroClickPeerRate?: number | null;
  zeroClickPeerShare?: number | null;
  eligible?: boolean;
  reasonCodes?: string[];
  peerPageCount?: number;
  peerClicks?: number;
  peerImpressions?: number;
  zeroClickSharePercent?: number | null;
}

export interface SeoSemanticCluster extends SeoQueryCluster {
  topicAligned?: boolean | null;
  sourcePreferenceShare?: number | null;
}

export interface SeoPageAssessment {
  primaryState: SeoPageAssessmentState;
  disposition?: SeoDecisionDisposition | null;
  primaryFinding?: SeoAssessmentFinding | string | null;
  verdict?: string | null;
  summary?: string | null;
  evidenceLevel?: SeoEvidenceLevel | null;
  confidence?: number | null;
  patternConfidence?: number | null;
  causeConfidence?: number | null;
  technicalStatus?: SeoTechnicalStatus | null;
  visibility?: SeoVisibilityAssessment | null;
  queryOpportunities?: SeoQueryOpportunity[];
  decisionGates?: Array<SeoDecisionGate | string>;
  nextReview?: SeoNextReview | null;
  currentForLatestData?: boolean;
  metrics?: Record<string, unknown> | null;
  coverage?: Record<string, number | null> | null;
  reasonCodes?: string[];
  cooldown?: SeoPageCooldown | null;
  ctrBaseline?: SeoCtrBaseline | null;
  semanticClusters?: SeoSemanticCluster[];
  findings?: Array<SeoAssessmentFinding | string>;
  counterEvidence?: Array<SeoAssessmentFinding | string>;
  detectorAssessments?: Record<string, {
    state?: SeoPageAssessmentState | null;
    reasonCodes?: string[];
    confidence?: number | null;
    patternConfidence?: number | null;
    causeConfidence?: number | null;
    technicalStatus?: SeoTechnicalStatus | null;
    nextReview?: SeoNextReview | null;
    evidence?: { summary?: string | null } | null;
  }>;
  nextReviewDate?: string | null;
  evaluatedAt?: string | null;
  endDate?: string | null;
  ruleVersion?: string | null;
  semanticVersion?: string | null;
  input?: {
    version?: string | null;
    hash?: string | null;
    pageVersionKey?: string | null;
    valid?: boolean | null;
  } | null;
  detectorCooldowns?: Partial<Record<SeoDetectorType, SeoPageCooldown>> | null;
  updatedAt?: string | null;
}

export type SeoReconciliationStatus =
  | 'complete'
  | 'partial'
  | 'unavailable'
  | 'limited'
  | 'sufficient'
  | 'inconsistent';

export interface SeoReconciliationSlice {
  status?: SeoReconciliationStatus;
  clicks?: number | null;
  impressions?: number | null;
  ctr?: number | null;
  averagePosition?: number | null;
  coveragePercent?: number | null;
  availableDays?: number;
  expectedDays?: number;
  missingDays?: number;
  truncatedDays?: number;
}

export interface SeoReconciliationPartitionWindow {
  startDate?: string | null;
  endDate?: string | null;
  completedDays?: number;
  requiredDays?: number;
  truncatedDays?: number;
  missingDays?: number;
  complete?: boolean;
}

export interface SeoReconciliationWindow {
  startDate?: string | null;
  endDate?: string | null;
  days?: number;
}

export interface SeoPageReconciliation {
  window?: SeoReconciliationWindow | null;
  pageTotal?: {
    metrics?: SeoReconciliationSlice | null;
    status?: SeoReconciliationStatus;
    partitionWindow?: SeoReconciliationPartitionWindow | null;
  } | null;
  visibleQuerySubset?: {
    metrics?: SeoReconciliationSlice | null;
    coveragePercent?: number | null;
    fullWindowLowerBoundPercent?: number | null;
    coverageSufficient?: boolean;
    status?: SeoReconciliationStatus;
    partitionWindow?: SeoReconciliationPartitionWindow | null;
  } | null;
  visibleDeviceSubset?: {
    metrics?: SeoReconciliationSlice | null;
    coveragePercent?: number | null;
    fullWindowLowerBoundPercent?: number | null;
    coverageSufficient?: boolean;
    status?: SeoReconciliationStatus;
    partitionWindow?: SeoReconciliationPartitionWindow | null;
  } | null;
}

export interface SeoActionEvidence {
  summary: string;
  windowDays?: number;
  queryCoveragePercent?: number | null;
  queryClusters?: SeoQueryCluster[];
  signals?: string[];
}

export interface SeoActionRecommendation {
  hypothesis: string;
  rationale?: string | null;
  checklist: string[];
  copyDirection?: string | null;
  successCriteria: string;
  donors?: SeoInternalLinkDonor[];
}

export interface SeoInternalLinkDonor {
  title: string;
  canonicalUrl: string;
  relevanceScore?: number | null;
  reasonCodes?: string[];
  anchorDirection?: string | null;
}

export interface SeoActionEvent {
  event: string;
  at: string;
  note?: string | null;
  actor?: string | null;
}

export interface SeoAction {
  id: string;
  version: number;
  pageKey: string;
  url: string;
  pageTitle?: string | null;
  type: SeoActionType;
  status: SeoActionStatus;
  verdict: SeoActionVerdict;
  title: string;
  priorityScore: number;
  confidence: number;
  expectedAdditionalClicks?: number | null;
  queueKind?: 'performance' | 'technical' | 'structural' | null;
  expectedImpact?: SeoExpectedImpact | null;
  patternConfidence?: number | null;
  causeConfidence?: number | null;
  nextReview?: SeoNextReview | null;
  effort?: 'low' | 'medium' | 'high' | null;
  risk?: 'low' | 'medium' | 'high' | null;
  detectedAt: string;
  updatedAt: string;
  snoozedUntil?: string | null;
  suppressedUntil?: string | null;
  suppressionGuidance?: string | null;
  evidence: SeoActionEvidence;
  recommendation: SeoActionRecommendation;
  events?: SeoActionEvent[];
  campaignId?: string | null;
  historicalUnverified?: boolean;
}

export interface SeoActionListResponse {
  items: SeoAction[];
  total: number;
  nextCursor: string | null;
}

export interface SeoActionListQuery {
  queue?: 'now' | 'backlog';
  status?: SeoActionStatus | 'all';
  type?: SeoActionType | 'all';
  search?: string;
  cursor?: string | null;
  limit?: number;
}

export type SeoOpportunityLane = 'investigate' | 'structural';

export interface SeoDecisionOpportunityItem {
  kind?: 'query_opportunity' | 'structural_finding' | 'structural_opportunity' | string;
  pageKey: string;
  canonicalUrl?: string | null;
  url?: string | null;
  pageTitle?: string | null;
  assessmentInputHash?: string | null;
  opportunity?: SeoQueryOpportunity | null;
  review?: SeoOpportunityReview | null;
  finding?: {
    state?: SeoPageAssessmentState | null;
    disposition?: SeoDecisionDisposition | null;
    patternConfidence?: number | null;
    causeConfidence?: number | null;
    reasonCodes?: string[];
    nextReview?: SeoNextReview | null;
  } | null;
  primaryState?: SeoPageAssessmentState | null;
  disposition?: SeoDecisionDisposition | null;
  primaryFinding?: SeoAssessmentFinding | string | null;
  summary?: string | null;
  patternConfidence?: number | null;
  causeConfidence?: number | null;
  technicalStatus?: SeoTechnicalStatus | null;
  nextReview?: SeoNextReview | null;
  expectedImpact?: SeoExpectedImpact | null;
}

export interface SeoDecisionOpportunityListResponse {
  lane?: SeoOpportunityLane;
  items: SeoDecisionOpportunityItem[];
  total: number;
  nextCursor: string | null;
}

export interface SeoQueryExampleMetricSet extends SeoQueryOpportunityMetrics {
  weekly?: SeoQueryOpportunityMetrics[];
}

export interface SeoQueryExample {
  query: string;
  current?: SeoQueryExampleMetricSet | null;
  previous?: SeoQueryExampleMetricSet | null;
  persistence?: {
    observedWeeks?: number | null;
    requiredWeeks?: number | null;
    persistent?: boolean | null;
  } | null;
}

export interface SeoQueryExamplesResponse {
  pageKey?: string;
  opportunityKey: string;
  assessmentInputHash: string;
  cluster?: { key?: string | null; label?: string | null; facet?: string | null } | null;
  coverage?: { percent?: number | null; semanticPercent?: number | null; status?: string | null } | null;
  items: SeoQueryExample[];
  totalVisibleMembers?: number;
  truncated?: boolean;
}

export interface SeoOpportunityReviewRequest extends SeoOpportunityReview {
  assessmentInputHash: string;
}

export interface SeoOpportunityReviewResponse {
  review: SeoOpportunityReview;
}

export interface SeoOpportunityPromoteRequest {
  assessmentInputHash: string;
}

export interface SeoOpportunityPromoteResponse {
  assessmentInputHash: string;
  opportunityKey: string;
  action: SeoAction;
}

export interface SeoActionTransitionRequest {
  event: SeoActionTransition;
  expectedVersion: number;
  note?: string;
  snoozeDays?: 14 | 30 | 60 | 90;
  copyDirection?: string;
  successCriteria?: string;
  verdict?: Exclude<SeoActionVerdict, null>;
  implementedAt?: string;
}

export interface SeoManualActionRequest {
  url: string;
  type: SeoActionType;
  title: string;
  hypothesis: string;
  changeSummary?: string;
  implementedAt?: string;
  historicalUnverified?: boolean;
}

export interface SeoPageSummary {
  pageKey: string;
  canonicalUrl: string;
  path: string;
  family?: string | null;
  tech?: string | null;
  title?: string | null;
  h1?: string | null;
  intendedIntent?: string | null;
  intentSource?: string | null;
  intentConfirmed: boolean;
  clicks?: number;
  impressions?: number;
  ctr?: number;
  averagePosition?: number;
}

export interface SeoPageDetail extends SeoPageSummary {
  description?: string | null;
  readerPromise?: string | null;
  targetKeyword?: string | null;
  intentSource?: string | null;
  indexable: boolean;
  outboundLinks?: string[];
  recentActions?: SeoAction[];
  updatedAt?: string | null;
  metricWindow?: SeoPageMetricWindow;
  trend?: SeoTrendPoint[];
  analysis?: SeoAnalysisSummary | null;
  assessment?: SeoPageAssessment | null;
  reconciliation?: SeoPageReconciliation | null;
  lineage?: SeoPageLineage | null;
}

export interface SeoPageListResponse {
  items: SeoPageSummary[];
  total: number;
  nextCursor: string | null;
  metricWindow?: SeoPageMetricWindow;
}

export interface SeoIntentOverrideRequest {
  intendedIntent: string;
  readerPromise?: string;
  targetKeyword?: string;
  intentConfirmed: boolean;
}

export interface SeoSyncResponse {
  accepted: boolean;
  runId?: string | null;
  status: 'running' | 'complete' | 'partial' | 'failed' | 'skipped' | 'busy' | 'disabled';
  datesCompleted?: string[];
  datesAttempted?: string[];
  message?: string | null;
}

export interface SeoAnalyzeResponse {
  accepted: boolean;
  runId?: string | null;
  status: SeoAnalysisStatus;
  analysis?: SeoAnalysisSummary | null;
  message?: string | null;
}

export interface SeoSyncRun {
  id: string;
  status: 'running' | 'complete' | 'partial' | 'failed' | 'skipped' | string;
  trigger: string;
  startedAt: string;
  completedAt: string | null;
  datesAttempted: string[];
  datesCompleted: string[];
  rowsWritten: number;
  truncated: boolean;
  detailSlicesSkipped: boolean;
  error: { code: string; message: string } | null;
}

export interface SeoSyncRunListResponse {
  items: SeoSyncRun[];
  total: number;
  nextCursor: string | null;
}
