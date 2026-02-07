import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CvAnalyzeResponse, CvIssue, CvIssueEvidence, CvRole, CvSeverity } from '../../../core/models/cv-linter.model';
import { CvLinterService } from '../../../core/services/cv-linter.service';
import {
  buildRoleKeywordSuggestions,
  computeIssueConfidence,
  formatEvidenceLineSuffix,
  isLowConfidenceIssue,
  normalizeIssueEvidence,
  shouldShowDocxBanner,
  sortIssuesByConfidence,
} from './cv-linter-issues.util';

type ProgressState = 'idle' | 'uploading' | 'extracting' | 'scoring' | 'done' | 'error';

type IssueGroups = {
  critical: CvIssue[];
  warn: CvIssue[];
  info: CvIssue[];
};

type ResultsTab = 'overview' | 'issues' | 'keywords' | 'preview';
type BulletTone = 'concise' | 'impact' | 'ownership';

type RoleOption = {
  id: CvRole;
  label: string;
};

type QuickWin = {
  issue: CvIssue;
  impactScore: number;
  estimatedGain: string;
};

@Component({
  selector: 'app-cv-linter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cv-linter.component.html',
  styleUrls: ['./cv-linter.component.css'],
})
export class CvLinterComponent implements OnDestroy {
  private readonly MAX_FILE_BYTES = 5 * 1024 * 1024;
  private readonly ALLOWED_MIME = new Set([
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]);
  private readonly ALLOWED_EXTENSIONS = ['.pdf', '.docx'];
  private readonly QUICK_WIN_FALLBACK_IMPACT: Record<CvSeverity, number> = {
    critical: 8,
    warn: 5,
    info: 2,
  };
  private readonly SEVERITY_RANK: Record<CvSeverity, number> = {
    critical: 3,
    warn: 2,
    info: 1,
  };
  private readonly KEYWORD_ISSUE_IDS = new Set(['keyword_missing', 'keyword_missing_critical']);
  private readonly SCAN_DURATION_MS = 7000;

  roleOptions: RoleOption[] = [
    { id: 'senior_frontend_angular', label: 'Senior Frontend (Angular)' },
    { id: 'senior_frontend_react', label: 'Senior Frontend (React)' },
    { id: 'senior_frontend_general', label: 'Senior Frontend (General FE)' },
  ];

  readonly severityOrder: CvSeverity[] = ['critical', 'warn', 'info'];
  readonly resultsTabs: Array<{ id: ResultsTab; label: string }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'issues', label: 'Issues' },
    { id: 'keywords', label: 'Keywords' },
    { id: 'preview', label: 'Text Preview' },
  ];
  readonly toneOptions: Array<{ id: BulletTone; label: string }> = [
    { id: 'concise', label: 'Concise' },
    { id: 'impact', label: 'Impact-heavy' },
    { id: 'ownership', label: 'Ownership' },
  ];

  selectedRole: CvRole = 'senior_frontend_angular';
  selectedFile: File | null = null;
  dragActive = false;
  analyzing = false;
  progressState: ProgressState = 'idle';
  report: CvAnalyzeResponse | null = null;
  hasAnalyzed = false;
  issuesBySeverity: IssueGroups = { critical: [], warn: [], info: [] };
  quickWins: QuickWin[] = [];
  errorMessage = '';
  forcePasteMode = false;
  pasteText = '';
  activeResultsTab: ResultsTab = 'overview';
  advancedToolsOpen = false;
  resultsAdvancedOpen = false;
  debugDetailsOpen = false;
  pdfTipsOpen = false;
  docxPickerOnly = false;
  selectedTone: BulletTone = 'concise';
  copiedTemplateIndex: number | null = null;
  copiedKeywordSuggestion: string | null = null;
  successToastVisible = false;
  successToastMessage = 'Report generated';
  resultsHighlighted = false;
  highlightedIssueId: string | null = null;
  expandedIssueEvidence: Record<string, boolean> = {};
  issueGroupsOpen: Record<CvSeverity, boolean> = {
    critical: true,
    warn: true,
    info: false,
  };
  scanProgress = 0;
  scanStatus = '';
  private scanMode: 'file' | 'text' = 'file';
  private scanStartedAt = 0;
  private scanDurationMs = 0;

  // Bullet builder inputs
  actionVerb = 'Built';
  whatBuilt = 'a reusable analytics dashboard';
  tech = 'Angular + RxJS';
  metric = 'time-to-interactive by 28%';
  scale = '1.2M monthly sessions';
  context = 'for checkout-critical flows';

  private progressTimers: number[] = [];
  private uiTimers: number[] = [];

  @ViewChild('resultsSection') private resultsSectionRef?: ElementRef<HTMLElement>;
  @ViewChild('bulletBuilderSection') private bulletBuilderSectionRef?: ElementRef<HTMLElement>;
  @ViewChild('uploadSection') private uploadSectionRef?: ElementRef<HTMLElement>;
  @ViewChild('fileInput') private fileInputRef?: ElementRef<HTMLInputElement>;

  constructor(private readonly cvLinterService: CvLinterService) {}

  ngOnDestroy(): void {
    this.clearProgressTimers();
    this.clearUiTimers();
  }

  get progressLabel(): string {
    switch (this.progressState) {
      case 'uploading':
        return 'Uploading...';
      case 'extracting':
        return 'Extracting text...';
      case 'scoring':
        return 'Scoring...';
      case 'done':
        return 'Analysis completed.';
      case 'error':
        return 'Analysis failed.';
      default:
        return '';
    }
  }

  get showFallback(): boolean {
    const extractionStatus = this.report?.meta?.extractionStatus;
    return this.forcePasteMode || extractionStatus === 'failed' || extractionStatus === 'low_text';
  }

  get showPreviewTab(): boolean {
    return !!this.report?.textPreview;
  }

  get analyzeButtonLabel(): string {
    if (this.analyzing) return 'Analyzing...';
    return this.hasAnalyzed ? 'Re-analyze' : 'Analyze';
  }

  get showClearAfterAnalyze(): boolean {
    return this.hasAnalyzed;
  }

  get severityCounts(): Record<CvSeverity, number> {
    return {
      critical: this.issuesBySeverity.critical.length,
      warn: this.issuesBySeverity.warn.length,
      info: this.issuesBySeverity.info.length,
    };
  }

  get shouldOpenIssuesByDefault(): boolean {
    return this.severityCounts.critical + this.severityCounts.warn > 0;
  }

  get showBuilderNudge(): boolean {
    const issues = this.report?.issues || [];
    return issues.some((issue) => issue.id === 'low_numeric_density' || issue.id === 'weak_action_verbs');
  }

  get canAnalyzeFile(): boolean {
    return !!this.selectedFile && !this.analyzing;
  }

  get canAnalyzeText(): boolean {
    return !!this.pasteText.trim() && !this.analyzing;
  }

  get fileInputAccept(): string {
    if (this.docxPickerOnly) {
      return '.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }
    return '.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }

  get showDocxCta(): boolean {
    return this.shouldShowDocxCtaForReport(this.report);
  }

  get hasLowExtractionQuality(): boolean {
    if (!this.report) return false;
    const hasIssue = (this.report.issues || []).some((issue) => issue.id === 'low_extraction_quality');
    const isLowDebug = this.report.debug?.extractionQuality?.level === 'low';
    return hasIssue || isLowDebug;
  }

  get bulletTemplates(): string[] {
    const verb = this.valueOrPlaceholder(this.actionVerb, '[verb]');
    const built = this.valueOrPlaceholder(this.whatBuilt, '[whatBuilt]');
    const tech = this.valueOrPlaceholder(this.tech, '[tech]');
    const metric = this.valueOrPlaceholder(this.metric, '[metric]');
    const scale = this.valueOrPlaceholder(this.scale, '[scale]');
    const context = this.valueOrPlaceholder(this.context, '[context]');

    if (this.selectedTone === 'impact') {
      return [
        `${verb} ${built} using ${tech}, delivering ${metric} across ${scale}.`,
        `${verb} ${built} (${tech}) and measured ${metric}; context: ${context}.`,
        `${verb} ${built} with ${tech}; impact: ${metric}. Scope: ${scale}.`,
      ];
    }

    if (this.selectedTone === 'ownership') {
      return [
        `${verb} and owned ${built} using ${tech}, improving ${metric} at ${scale}.`,
        `Owned end-to-end ${built} (${tech}), resulting in ${metric}; context: ${context}.`,
        `Drove ${built} with ${tech}; impact: ${metric}. Scope: ${scale}. ${context}.`,
      ];
    }

    return [
      `${verb} ${built} using ${tech}, improving ${metric} at ${scale}.`,
      `${verb} ${built} (${tech}), resulting in ${metric}; context: ${context}.`,
      `${verb} ${built} with ${tech}; impact: ${metric}. Scope: ${scale}. ${context}.`,
    ];
  }

  onDragOver(event: DragEvent): void {
    if (this.analyzing) return;
    event.preventDefault();
    this.dragActive = true;
  }

  onDragLeave(event: DragEvent): void {
    if (this.analyzing) return;
    event.preventDefault();
    this.dragActive = false;
  }

  onDrop(event: DragEvent): void {
    if (this.analyzing) return;
    event.preventDefault();
    this.dragActive = false;
    const file = event.dataTransfer?.files?.[0];
    if (!file) return;
    this.setSelectedFile(file);
  }

  onFileInputChange(event: Event): void {
    if (this.analyzing) return;
    const target = event.target as HTMLInputElement | null;
    const file = target?.files?.[0] || null;
    if (!file) return;
    this.setSelectedFile(file);
  }

  clearSelectedFile(): void {
    if (this.analyzing) return;
    this.selectedFile = null;
  }

  setResultsTab(tab: ResultsTab): void {
    if (tab === 'preview' && !this.showPreviewTab) return;
    this.activeResultsTab = tab;
  }

  isResultsTabActive(tab: ResultsTab): boolean {
    return this.activeResultsTab === tab;
  }

  toggleAdvancedTools(): void {
    this.advancedToolsOpen = !this.advancedToolsOpen;
  }

  toggleResultsAdvanced(): void {
    this.resultsAdvancedOpen = !this.resultsAdvancedOpen;
  }

  toggleDebugDetails(): void {
    this.debugDetailsOpen = !this.debugDetailsOpen;
  }

  issuesFor(severity: CvSeverity): CvIssue[] {
    return this.issuesBySeverity[severity] || [];
  }

  toggleIssueGroup(severity: CvSeverity): void {
    if (!this.issuesFor(severity).length) return;
    this.issueGroupsOpen = {
      ...this.issueGroupsOpen,
      [severity]: !this.issueGroupsOpen[severity],
    };
  }

  severityLabel(severity: CvSeverity): string {
    if (severity === 'critical') return 'Critical';
    if (severity === 'warn') return 'Warnings';
    return 'Info';
  }

  extractionStatusLabel(status: CvAnalyzeResponse['meta']['extractionStatus']): string {
    if (status === 'ok') return 'Text extraction: Good';
    if (status === 'low_text') return 'Text extraction: Limited';
    if (status === 'failed') return 'Text extraction: Failed';
    return 'Text extraction: Manual input';
  }

  viewIssueFromQuickWin(issue: CvIssue): void {
    this.issueGroupsOpen = {
      ...this.issueGroupsOpen,
      [issue.severity]: true,
    };
    this.setResultsTab('issues');
    this.scrollToIssue(issue.id);
  }

  issueElementId(issueId: string): string {
    const normalized = String(issueId || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '-');
    return `cv-issue-item-${normalized}`;
  }

  openBulletBuilderFromNudge(): void {
    this.advancedToolsOpen = true;
    this.scrollToBulletBuilder();
  }

  tryDocxUpload(): void {
    this.emitAnalyticsEvent('cv_linter_docx_cta_click', { role: this.selectedRole });
    this.scrollToUploadStep(true);
  }

  togglePdfTips(): void {
    this.pdfTipsOpen = !this.pdfTipsOpen;
  }

  setTone(tone: BulletTone): void {
    this.selectedTone = tone;
  }

  async copyTemplate(template: string, index: number): Promise<void> {
    const content = String(template || '');
    if (!content) return;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(content);
      } else {
        this.copyWithFallback(content);
      }
    } catch {
      this.copyWithFallback(content);
    }

    this.copiedTemplateIndex = index;
    this.queueUiTimer(() => {
      if (this.copiedTemplateIndex === index) this.copiedTemplateIndex = null;
    }, 1200);
  }

  toggleIssueEvidence(issueId: string): void {
    const id = String(issueId || '').trim();
    if (!id) return;
    this.expandedIssueEvidence = {
      ...this.expandedIssueEvidence,
      [id]: !this.expandedIssueEvidence[id],
    };
  }

  isIssueEvidenceExpanded(issueId: string): boolean {
    return !!this.expandedIssueEvidence[String(issueId || '').trim()];
  }

  hasIssueEvidence(issue: CvIssue): boolean {
    return issue.severity !== 'critical';
  }

  primaryEvidenceText(issue: CvIssue): string {
    const first = this.issueEvidenceEntries(issue)[0];
    if (!first) return 'No direct snippet available; derived from deterministic CV structure heuristics.';
    return String(first.excerpt || '').trim();
  }

  primaryEvidenceLineRef(issue: CvIssue): string {
    const first = this.issueEvidenceEntries(issue)[0];
    return formatEvidenceLineSuffix(first);
  }

  additionalEvidenceEntries(issue: CvIssue): CvIssueEvidence[] {
    const entries = this.issueEvidenceEntries(issue);
    if (!entries.length) return [];

    const expanded: CvIssueEvidence[] = [];
    const first = entries[0];
    if (first.details) {
      expanded.push({
        excerpt: first.details,
        line: first.line,
        source: first.source,
        confidence: first.confidence,
      });
    }
    for (const entry of entries.slice(1, 3)) {
      expanded.push(entry);
    }
    return expanded.slice(0, 3);
  }

  additionalEvidenceCount(issue: CvIssue): number {
    const entries = this.issueEvidenceEntries(issue);
    const hasPrimaryDetails = !!entries[0]?.details;
    if (entries.length > 1) return Math.min(2, entries.length - 1);
    return hasPrimaryDetails ? 1 : 0;
  }

  formatEvidenceEntry(entry: CvIssueEvidence): string {
    return String(entry?.details || entry?.excerpt || '').trim();
  }

  evidenceLineRef(entry?: CvIssueEvidence): string {
    return formatEvidenceLineSuffix(entry);
  }

  issueConfidence(issue: CvIssue): number {
    return computeIssueConfidence(issue, this.hasLowExtractionQuality);
  }

  isLowConfidence(issue: CvIssue): boolean {
    return isLowConfidenceIssue(issue, this.hasLowExtractionQuality);
  }

  isKeywordIssue(issue: CvIssue): boolean {
    return this.KEYWORD_ISSUE_IDS.has(String(issue?.id || '').trim());
  }

  keywordSuggestionChips(issue: CvIssue): string[] {
    if (!this.report || !this.isKeywordIssue(issue)) return [];

    const roleForSuggestions = this.report.meta?.role || this.selectedRole;
    return buildRoleKeywordSuggestions(roleForSuggestions, issue.id, this.report.debug?.missingKeywords).map((item) => item.label);
  }

  async copyKeywordSuggestion(issue: CvIssue, suggestion: string): Promise<void> {
    const roleForSuggestions = this.report?.meta?.role || this.selectedRole;
    const option = buildRoleKeywordSuggestions(roleForSuggestions, issue.id, this.report?.debug?.missingKeywords)
      .find((item) => item.label === suggestion);
    const content = option?.starter || `Consider adding these naturally in experience bullets: ${suggestion}.`;
    if (!content) return;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(content);
      } else {
        this.copyWithFallback(content);
      }
    } catch {
      this.copyWithFallback(content);
    }

    this.copiedKeywordSuggestion = suggestion;
    this.showToast('Copied suggestion', 1400);
    this.queueUiTimer(() => {
      if (this.copiedKeywordSuggestion === suggestion) this.copiedKeywordSuggestion = null;
    }, 1200);
  }

  clearAnalysisState(): void {
    if (this.analyzing) return;
    this.selectedFile = null;
    this.report = null;
    this.hasAnalyzed = false;
    this.quickWins = [];
    this.issuesBySeverity = { critical: [], warn: [], info: [] };
    this.errorMessage = '';
    this.forcePasteMode = false;
    this.pasteText = '';
    this.activeResultsTab = 'overview';
    this.progressState = 'idle';
    this.resultsAdvancedOpen = false;
    this.debugDetailsOpen = false;
    this.pdfTipsOpen = false;
    this.docxPickerOnly = false;
    this.highlightedIssueId = null;
    this.expandedIssueEvidence = {};
    this.copiedKeywordSuggestion = null;
    this.scanProgress = 0;
    this.scanStatus = '';
  }

  analyzeFile(): void {
    if (!this.selectedFile || this.analyzing) return;

    this.startAnalyze('file');
    this.cvLinterService.analyzeFile(this.selectedFile, this.selectedRole).subscribe({
      next: (report) => this.handleSuccessWithScan(report),
      error: (err) => this.handleError(err, 'file'),
    });
  }

  analyzePastedText(): void {
    const text = this.pasteText.trim();
    if (!text || this.analyzing) return;

    this.startAnalyze('text');
    this.cvLinterService.analyzeText(text, this.selectedRole).subscribe({
      next: (report) => this.handleSuccessWithScan(report),
      error: (err) => this.handleError(err, 'text'),
    });
  }

  useSampleCv(): void {
    if (this.analyzing) return;
    this.selectedFile = null;
    this.forcePasteMode = true;
    this.errorMessage = '';
    this.pasteText = `
Alex Frontend
alex.frontend@example.com | +1 555-198-7777 | linkedin.com/in/alexfrontend

Summary
Senior frontend engineer with focus on accessibility, performance, and scalable UI architecture.

Experience
Senior Frontend Engineer | Orbit Commerce | Jan 2021 - Present
- Built checkout flows using Angular, RxJS, and state management patterns, reducing drop-off by 18%.
- Optimized change detection and lazy loading, improving Largest Contentful Paint by 32% for 900k monthly users.
- Implemented SSR and web vitals monitoring, increasing conversion by 9%.
- Led testing strategy with unit tests and CI/CD pipeline gates, reducing production regressions by 40%.

Skills
Angular, TypeScript, ngrx, RxJS, observables, change detection, signals, accessibility, SSR, testing,
lazy loading, state management, performance, web vitals

Education
BSc Computer Science, 2017
    `.trim();
  }

  downloadReportJson(): void {
    if (!this.report) return;

    const blob = new Blob([JSON.stringify(this.report, null, 2)], { type: 'application/json' });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = 'cv-linter-report.json';
    anchor.click();
    URL.revokeObjectURL(objectUrl);
  }

  private valueOrPlaceholder(value: string, fallback: string): string {
    const trimmed = String(value || '').trim();
    return trimmed || fallback;
  }

  private setSelectedFile(file: File): void {
    if (this.analyzing) return;
    const validationError = this.validateFile(file);
    if (validationError) {
      this.selectedFile = null;
      this.errorMessage = validationError;
      return;
    }

    this.errorMessage = '';
    this.selectedFile = file;
    this.docxPickerOnly = false;
    this.forcePasteMode = false;
  }

  private validateFile(file: File): string | null {
    if (file.size > this.MAX_FILE_BYTES) {
      return 'File too large. Max 5MB is allowed.';
    }

    const fileName = String(file.name || '').toLowerCase();
    const hasAllowedExtension = this.ALLOWED_EXTENSIONS.some((ext) => fileName.endsWith(ext));
    const mime = String(file.type || '').toLowerCase();
    const hasAllowedMime = this.ALLOWED_MIME.has(mime);

    if (!hasAllowedExtension && !hasAllowedMime) {
      return 'Only PDF and DOCX files are supported.';
    }
    return null;
  }

  private startAnalyze(mode: 'file' | 'text'): void {
    this.clearProgressTimers();
    this.analyzing = true;
    this.scanMode = mode;
    this.scanStartedAt = Date.now();
    this.scanDurationMs = this.resolveScanDurationMs();
    this.scanProgress = 2;
    this.scanStatus = mode === 'file'
      ? 'Initializing secure document scan...'
      : 'Initializing text analysis scan...';
    this.errorMessage = '';
    this.report = null;
    this.quickWins = [];
    this.issuesBySeverity = { critical: [], warn: [], info: [] };
    this.activeResultsTab = 'overview';
    this.highlightedIssueId = null;
    this.resultsHighlighted = false;
    this.expandedIssueEvidence = {};
    this.copiedKeywordSuggestion = null;
    this.pdfTipsOpen = false;
    this.docxPickerOnly = false;

    this.progressState = mode === 'file' ? 'uploading' : 'scoring';
    this.beginScanAnimation();
  }

  private handleSuccessWithScan(report: CvAnalyzeResponse): void {
    const elapsed = Date.now() - this.scanStartedAt;
    const remaining = Math.max(0, this.scanDurationMs - elapsed);

    if (remaining <= 0) {
      this.completeAnalyzeSuccess(report);
      return;
    }

    this.scanStatus = 'Finalizing report and confidence signals...';
    const timer = window.setTimeout(() => {
      if (!this.analyzing) return;
      this.completeAnalyzeSuccess(report);
    }, remaining);
    this.progressTimers.push(timer);
  }

  private completeAnalyzeSuccess(report: CvAnalyzeResponse): void {
    this.clearProgressTimers();
    this.analyzing = false;
    this.progressState = 'done';
    this.scanProgress = 100;
    this.scanStatus = 'Scan complete.';
    this.report = report;
    this.hasAnalyzed = true;
    this.issuesBySeverity = this.groupIssuesBySeverity(report.issues || []);
    this.quickWins = this.buildQuickWins(report.issues || []);
    this.forcePasteMode = report.meta.extractionStatus === 'failed' || report.meta.extractionStatus === 'low_text';
    this.activeResultsTab = this.shouldOpenIssuesByDefault ? 'issues' : 'overview';
    this.resultsAdvancedOpen = false;
    this.debugDetailsOpen = false;
    this.resetIssueGroupsOpenState();
    if (this.shouldShowDocxCtaForReport(report)) {
      this.emitAnalyticsEvent('cv_linter_docx_cta_impression', { role: report.meta?.role || this.selectedRole });
    }
    this.showToast('Report generated', 1800);
    this.scrollToResultsAndHighlight();
  }

  private handleError(error: any, mode: 'file' | 'text'): void {
    this.clearProgressTimers();
    this.analyzing = false;
    this.progressState = 'error';
    this.scanProgress = 0;
    this.scanStatus = '';
    const apiMessage = typeof error?.error?.error === 'string' ? error.error.error : '';
    this.errorMessage = apiMessage || 'Could not analyze the CV right now. Please try again.';
    if (mode === 'file') {
      this.forcePasteMode = true;
    }
  }

  private resolveScanDurationMs(): number {
    const global = window as unknown as { __karma__?: unknown };
    if (global && global.__karma__) return 0;
    return this.SCAN_DURATION_MS;
  }

  private beginScanAnimation(): void {
    if (this.scanDurationMs <= 0) return;

    const timer = window.setInterval(() => {
      if (!this.analyzing) return;
      const elapsed = Date.now() - this.scanStartedAt;
      const ratio = Math.min(1, elapsed / this.scanDurationMs);
      const nextProgress = Math.min(95, Math.max(this.scanProgress, Math.round(ratio * 95)));
      this.scanProgress = nextProgress;
      this.updateScanStatusByProgress();
    }, 140);
    this.progressTimers.push(timer);
  }

  private updateScanStatusByProgress(): void {
    const progress = this.scanProgress;
    if (progress < 20) {
      this.progressState = this.scanMode === 'file' ? 'uploading' : 'scoring';
      this.scanStatus = this.scanMode === 'file'
        ? 'Uploading encrypted document snapshot...'
        : 'Preparing pasted content for structural scan...';
      return;
    }
    if (progress < 46) {
      this.progressState = 'extracting';
      this.scanStatus = 'Parsing layout blocks and text boundaries...';
      return;
    }
    if (progress < 74) {
      this.progressState = 'extracting';
      this.scanStatus = 'Extracting sections, bullets, and timeline signals...';
      return;
    }
    if (progress < 92) {
      this.progressState = 'scoring';
      this.scanStatus = 'Running deterministic ATS and impact rules...';
      return;
    }
    this.progressState = 'scoring';
    this.scanStatus = 'Compiling score breakdown and quick wins...';
  }

  private clearProgressTimers(): void {
    for (const timer of this.progressTimers) {
      window.clearTimeout(timer);
    }
    this.progressTimers = [];
  }

  private clearUiTimers(): void {
    for (const timer of this.uiTimers) {
      window.clearTimeout(timer);
    }
    this.uiTimers = [];
  }

  private groupIssuesBySeverity(issues: CvIssue[]): IssueGroups {
    const groups: IssueGroups = { critical: [], warn: [], info: [] };
    const ordered = sortIssuesByConfidence(issues, this.hasLowExtractionQuality);
    for (const issue of ordered) {
      groups[issue.severity].push(issue);
    }
    return groups;
  }

  private resetIssueGroupsOpenState(): void {
    const counts = this.severityCounts;
    this.issueGroupsOpen = {
      critical: counts.critical > 0,
      warn: counts.warn > 0,
      info: counts.critical === 0 && counts.warn === 0 && counts.info > 0,
    };
  }

  private buildQuickWins(issues: CvIssue[]): QuickWin[] {
    return [...issues]
      .sort((a, b) => {
        const severityDelta = this.SEVERITY_RANK[b.severity] - this.SEVERITY_RANK[a.severity];
        if (severityDelta !== 0) return severityDelta;

        const impactDelta = this.issueImpactScore(b) - this.issueImpactScore(a);
        if (impactDelta !== 0) return impactDelta;

        return String(a.id || '').localeCompare(String(b.id || ''));
      })
      .slice(0, 3)
      .map((issue) => {
        const impactScore = this.issueImpactScore(issue);
        return {
          issue,
          impactScore,
          estimatedGain: this.estimateGainLabel(impactScore),
        };
      });
  }

  private issueImpactScore(issue: CvIssue): number {
    const numericDelta = Number(issue.scoreDelta);
    if (Number.isFinite(numericDelta) && numericDelta !== 0) {
      return Math.abs(numericDelta);
    }
    return this.QUICK_WIN_FALLBACK_IMPACT[issue.severity] || 1;
  }

  private estimateGainLabel(impactScore: number): string {
    if (impactScore >= 8) return '+8–12 points';
    if (impactScore >= 6) return '+6–10 points';
    if (impactScore >= 4) return '+4–8 points';
    return '+1–3 points';
  }

  private scrollToResultsAndHighlight(): void {
    this.queueUiTimer(() => {
      const target = this.resultsSectionRef?.nativeElement;
      if (!target) return;
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      this.resultsHighlighted = true;
      this.queueUiTimer(() => {
        this.resultsHighlighted = false;
      }, 1800);
    }, 80);
  }

  private scrollToIssue(issueId: string): void {
    this.queueUiTimer(() => {
      const target = document.getElementById(this.issueElementId(issueId));
      if (!target) return;
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target.focus({ preventScroll: true });
      this.highlightedIssueId = issueId;
      this.queueUiTimer(() => {
        if (this.highlightedIssueId === issueId) this.highlightedIssueId = null;
      }, 1600);
    }, 120);
  }

  private scrollToBulletBuilder(): void {
    this.queueUiTimer(() => {
      const target = this.bulletBuilderSectionRef?.nativeElement;
      if (!target) return;
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      target.focus({ preventScroll: true });
    }, 80);
  }

  private queueUiTimer(callback: () => void, delayMs: number): void {
    const timer = window.setTimeout(callback, delayMs);
    this.uiTimers.push(timer);
  }

  private showToast(message: string, durationMs: number): void {
    this.successToastMessage = message;
    this.successToastVisible = true;
    this.queueUiTimer(() => {
      this.successToastVisible = false;
    }, durationMs);
  }

  private copyWithFallback(content: string): void {
    const textarea = document.createElement('textarea');
    textarea.value = content;
    textarea.setAttribute('readonly', 'true');
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }

  private issueEvidenceEntries(issue: CvIssue): CvIssueEvidence[] {
    return normalizeIssueEvidence(issue);
  }

  private scrollToUploadStep(openFilePicker: boolean): void {
    this.queueUiTimer(() => {
      const target = this.uploadSectionRef?.nativeElement;
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        target.focus({ preventScroll: true });
      }

      if (openFilePicker && !this.analyzing) {
        this.docxPickerOnly = true;
        this.fileInputRef?.nativeElement?.click();
      }
    }, 70);
  }

  private shouldShowDocxCtaForReport(report: CvAnalyzeResponse | null): boolean {
    if (!report) return false;
    return shouldShowDocxBanner(report.issues || [], report.debug?.extractionQuality?.level);
  }

  private emitAnalyticsEvent(name: string, params?: Record<string, unknown>): void {
    const global = window as unknown as {
      gtag?: (...args: unknown[]) => void;
      dataLayer?: unknown[];
    };
    if (typeof global.gtag === 'function') {
      global.gtag('event', name, params || {});
      return;
    }
    if (Array.isArray(global.dataLayer)) {
      global.dataLayer.push({
        event: name,
        ...(params || {}),
      });
    }
  }
}
