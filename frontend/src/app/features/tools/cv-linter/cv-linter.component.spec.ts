import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { CvAnalyzeResponse, CvIssue } from '../../../core/models/cv-linter.model';
import { CvLinterComponent } from './cv-linter.component';

function makeIssue(overrides: Partial<CvIssue> = {}): CvIssue {
  return {
    id: 'missing_linkedin',
    severity: 'warn',
    category: 'ats',
    scoreDelta: -3,
    title: 'Missing LinkedIn profile',
    message: 'No LinkedIn URL was detected.',
    explanation: 'No LinkedIn URL was detected.',
    why: 'For senior roles, LinkedIn helps validate seniority and history quickly.',
    fix: 'Add a LinkedIn profile URL in your contact block.',
    ...overrides,
  };
}

function makeResponse(overrides: Partial<CvAnalyzeResponse> = {}): CvAnalyzeResponse {
  const issues = overrides.issues || [makeIssue()];
  return {
    scores: {
      overall: 77,
      ats: 19,
      structure: 15,
      impact: 21,
      consistency: 11,
      keywords: 11,
    },
    breakdown: [
      { id: 'ats', label: 'ATS & Readability', score: 19, max: 25 },
      { id: 'structure', label: 'Structure & Completeness', score: 15, max: 20 },
      { id: 'impact', label: 'Impact & Evidence', score: 21, max: 25 },
      { id: 'consistency', label: 'Consistency & Hygiene', score: 11, max: 15 },
      { id: 'keywords', label: 'Keyword Coverage', score: 11, max: 15 },
    ],
    issues,
    keywordCoverage: {
      role: 'senior_frontend_angular',
      roleLabel: 'Senior Frontend (Angular)',
      total: 12,
      found: ['rxjs'],
      missing: ['ngrx'],
      missingCritical: ['change detection'],
      skillsOnly: [],
      foundInExperienceCount: 1,
      coveragePct: 8,
    },
    textPreview: 'Preview text',
    meta: {
      source: 'text',
      extractionStatus: 'text_input',
      textLength: 1200,
      fallbackRecommended: false,
      role: 'senior_frontend_angular',
      timingsMs: {
        validation: 0,
        extraction: 0,
        scoring: 0,
        total: 0,
      },
    },
    ...overrides,
  };
}

describe('CvLinterComponent', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CvLinterComponent, HttpClientTestingModule],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  function setValidFile(component: CvLinterComponent): void {
    component.selectedFile = new File(['cv'], 'resume.pdf', { type: 'application/pdf' });
  }

  function runTextAnalysis(fixture: any, response: CvAnalyzeResponse = makeResponse(), text = 'Sample pasted CV'): void {
    const component = fixture.componentInstance as CvLinterComponent;
    component.pasteText = text;
    component.analyzePastedText();
    const req = httpMock.expectOne('/api/tools/cv/analyze');
    expect(req.request.method).toBe('POST');
    req.flush(response);
    fixture.detectChanges();
  }

  it('shows Step 2 placeholder before any analysis', () => {
    const fixture = TestBed.createComponent(CvLinterComponent);
    fixture.detectChanges();

    const placeholder = fixture.nativeElement.querySelector('[data-testid="cv-results-placeholder"]');
    const text = placeholder?.textContent || '';
    expect(placeholder).toBeTruthy();
    expect(text).toContain('Upload a CV to see your report here.');
  });

  it('disables Analyze until a file is selected', () => {
    const fixture = TestBed.createComponent(CvLinterComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    const analyzeBtnBefore = fixture.nativeElement.querySelector('[data-testid="cv-analyze-file"]') as HTMLButtonElement;
    expect(analyzeBtnBefore.disabled).toBeTrue();

    setValidFile(component);
    fixture.detectChanges();

    const analyzeBtnAfter = fixture.nativeElement.querySelector('[data-testid="cv-analyze-file"]') as HTMLButtonElement;
    expect(analyzeBtnAfter.disabled).toBeFalse();
  });

  it('shows loading state and disables uploader controls during analyze', () => {
    const fixture = TestBed.createComponent(CvLinterComponent);
    const component = fixture.componentInstance;
    setValidFile(component);
    fixture.detectChanges();

    component.analyzeFile();
    fixture.detectChanges();

    const req = httpMock.expectOne('/api/tools/cv/analyze');
    expect(req.request.method).toBe('POST');

    const analyzeBtn = fixture.nativeElement.querySelector('[data-testid="cv-analyze-file"]') as HTMLButtonElement;
    const roleSelect = fixture.nativeElement.querySelector('[data-testid="cv-role-select"]') as HTMLSelectElement;
    const sampleBtn = fixture.nativeElement.querySelector('[data-testid="cv-use-sample"]') as HTMLButtonElement;
    const dropzone = fixture.nativeElement.querySelector('[data-testid="cv-dropzone"]');

    expect(analyzeBtn.disabled).toBeTrue();
    expect(analyzeBtn.textContent || '').toContain('Analyzing...');
    expect(roleSelect.disabled).toBeTrue();
    expect(sampleBtn.disabled).toBeTrue();
    expect(dropzone.classList.contains('is-disabled')).toBeTrue();

    req.flush(makeResponse());
    fixture.detectChanges();
  });

  it('shows Re-analyze and Clear after success', () => {
    const fixture = TestBed.createComponent(CvLinterComponent);
    const component = fixture.componentInstance;
    setValidFile(component);
    fixture.detectChanges();

    component.analyzeFile();
    const req = httpMock.expectOne('/api/tools/cv/analyze');
    req.flush(makeResponse());
    fixture.detectChanges();

    const analyzeBtn = fixture.nativeElement.querySelector('[data-testid="cv-analyze-file"]');
    const clearBtn = fixture.nativeElement.querySelector('[data-testid="cv-clear-analysis"]');
    const toast = fixture.nativeElement.querySelector('[data-testid="cv-success-toast"]');

    expect(analyzeBtn?.textContent || '').toContain('Re-analyze');
    expect(clearBtn).toBeTruthy();
    expect(toast).toBeTruthy();
  });

  it('defaults to Issues tab when report has warning/critical items', () => {
    const fixture = TestBed.createComponent(CvLinterComponent);
    fixture.detectChanges();

    runTextAnalysis(fixture, makeResponse({ issues: [makeIssue({ severity: 'warn' })] }));

    const issuesTab = fixture.nativeElement.querySelector('[data-testid="cv-tab-issues"]');
    const issuesPanel = fixture.nativeElement.querySelector('[data-testid="cv-panel-issues"]');
    expect(issuesTab?.classList.contains('active')).toBeTrue();
    expect(issuesPanel).toBeTruthy();
  });

  it('defaults to Overview tab when report has only info items', () => {
    const fixture = TestBed.createComponent(CvLinterComponent);
    fixture.detectChanges();

    runTextAnalysis(fixture, makeResponse({ issues: [makeIssue({ severity: 'info', id: 'info_a' })] }));

    const overviewTab = fixture.nativeElement.querySelector('[data-testid="cv-tab-overview"]');
    const overviewPanel = fixture.nativeElement.querySelector('[data-testid="cv-panel-overview"]');
    expect(overviewTab?.classList.contains('active')).toBeTrue();
    expect(overviewPanel).toBeTruthy();
  });

  it('renders Top 3 quick wins in deterministic order', () => {
    const fixture = TestBed.createComponent(CvLinterComponent);
    fixture.detectChanges();

    runTextAnalysis(
      fixture,
      makeResponse({
        issues: [
          makeIssue({ id: 'a_warn_high', severity: 'warn', scoreDelta: -10, title: 'Warn high' }),
          makeIssue({ id: 'b_critical_low', severity: 'critical', scoreDelta: -4, title: 'Critical low' }),
          makeIssue({ id: 'c_info', severity: 'info', scoreDelta: -2, title: 'Info low' }),
          makeIssue({ id: 'd_critical_high', severity: 'critical', scoreDelta: -8, title: 'Critical high' }),
        ],
      }),
    );

    const quickWinButtons = Array.from(
      fixture.nativeElement.querySelectorAll('[data-testid^="cv-quick-win-view-"]'),
    ) as HTMLButtonElement[];
    const quickWinTitles = Array.from(
      fixture.nativeElement.querySelectorAll('.quick-win-copy strong'),
    ).map((element: any) => (element.textContent || '').trim());
    expect(quickWinButtons.length).toBe(3);
    expect(quickWinTitles).toEqual(['Critical high', 'Critical low', 'Warn high']);
    expect((fixture.nativeElement.textContent || '')).toContain('Top 3 quick wins');
  });

  it('View issue jumps to issues tab and highlights target card', fakeAsync(() => {
    const fixture = TestBed.createComponent(CvLinterComponent);
    fixture.detectChanges();

    runTextAnalysis(
      fixture,
      makeResponse({
        issues: [
          makeIssue({ id: 'weak_action_verbs', severity: 'warn', title: 'Weak action verbs' }),
          makeIssue({ id: 'missing_email', severity: 'critical', title: 'Missing email' }),
        ],
      }),
    );

    const viewButton = fixture.nativeElement.querySelector('[data-testid="cv-quick-win-view-0"]') as HTMLButtonElement;
    viewButton.click();
    tick(200);
    fixture.detectChanges();

    const component = fixture.componentInstance as CvLinterComponent;
    expect(component.activeResultsTab).toBe('issues');
    expect(component.highlightedIssueId).toBeTruthy();
    flush();
  }));

  it('keeps debug controls collapsed by default and reveals JSON action after expanding', () => {
    const fixture = TestBed.createComponent(CvLinterComponent);
    fixture.detectChanges();

    runTextAnalysis(fixture);

    expect(fixture.nativeElement.querySelector('[data-testid="cv-download-json"]')).toBeNull();

    const toggle = fixture.nativeElement.querySelector('[data-testid="cv-results-advanced-toggle"]') as HTMLButtonElement;
    toggle.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="cv-download-json"]')).toBeTruthy();
  });

  it('supports deterministic bullet tone variants', () => {
    const fixture = TestBed.createComponent(CvLinterComponent);
    const component = fixture.componentInstance as CvLinterComponent;

    component.actionVerb = 'Optimized';
    component.whatBuilt = 'checkout rendering';
    component.tech = 'Angular';
    component.metric = 'LCP by 30%';
    component.scale = '850k monthly users';
    component.context = 'for mobile traffic';

    component.setTone('concise');
    expect(component.bulletTemplates[0]).toBe(
      'Optimized checkout rendering using Angular, improving LCP by 30% at 850k monthly users.',
    );

    component.setTone('impact');
    expect(component.bulletTemplates[0]).toBe(
      'Optimized checkout rendering using Angular, delivering LCP by 30% across 850k monthly users.',
    );

    component.setTone('ownership');
    expect(component.bulletTemplates[0]).toBe(
      'Optimized and owned checkout rendering using Angular, improving LCP by 30% at 850k monthly users.',
    );
  });

  it('shows copy feedback after copying a template', fakeAsync(() => {
    const fixture = TestBed.createComponent(CvLinterComponent);
    fixture.detectChanges();

    const advancedToggle = fixture.nativeElement.querySelector('[data-testid="cv-advanced-toggle"]') as HTMLButtonElement;
    advancedToggle.click();
    fixture.detectChanges();

    const clipboardSpy = jasmine.createSpy('writeText').and.returnValue(Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: clipboardSpy },
    });

    const copyBtn = fixture.nativeElement.querySelector('[data-testid="cv-copy-template-0"]') as HTMLButtonElement;
    copyBtn.click();
    tick();
    fixture.detectChanges();

    expect(clipboardSpy).toHaveBeenCalled();
    expect(copyBtn.textContent || '').toContain('Copied');
    flush();
  }));

  it('shows issue-linked Bullet Builder nudge and opens advanced tools on click', () => {
    const fixture = TestBed.createComponent(CvLinterComponent);
    fixture.detectChanges();

    runTextAnalysis(
      fixture,
      makeResponse({
        issues: [
          makeIssue({ id: 'low_numeric_density', severity: 'warn', title: 'Low numeric density' }),
        ],
      }),
    );

    const nudge = fixture.nativeElement.querySelector('[data-testid="cv-open-builder-nudge"]') as HTMLButtonElement;
    expect(nudge).toBeTruthy();

    nudge.click();
    fixture.detectChanges();

    const component = fixture.componentInstance as CvLinterComponent;
    expect(component.advancedToolsOpen).toBeTrue();
  });

  it('shows fallback panel for low_text responses', () => {
    const fixture = TestBed.createComponent(CvLinterComponent);
    fixture.detectChanges();

    runTextAnalysis(
      fixture,
      makeResponse({
        meta: {
          source: 'file',
          extractionStatus: 'low_text',
          textLength: 220,
          fallbackRecommended: true,
          role: 'senior_frontend_angular',
          timingsMs: { validation: 0, extraction: 0, scoring: 0, total: 0 },
        },
      }),
    );

    const warning = fixture.nativeElement.querySelector('[data-testid="cv-fallback-warning"]');
    const textarea = fixture.nativeElement.querySelector('[data-testid="cv-paste-text"]');
    expect(warning).toBeTruthy();
    expect(textarea).toBeTruthy();
  });

  it('renders evidence row and expands additional evidence entries', () => {
    const fixture = TestBed.createComponent(CvLinterComponent);
    fixture.detectChanges();

    runTextAnalysis(
      fixture,
      makeResponse({
        issues: [
          makeIssue({
            id: 'weak_action_verbs',
            severity: 'warn',
            evidence: [
              { snippet: 'Responsible for frontend updates.', reason: 'weak opening verb', lineStart: 14, lineEnd: 14 },
              { snippet: 'Worked on UI tasks.', reason: 'weak opening verb', lineStart: 15, lineEnd: 15 },
            ],
          }),
        ],
      }),
    );

    const evidenceRow = fixture.nativeElement.querySelector('[data-testid="cv-issue-evidence-weak_action_verbs"]');
    expect(evidenceRow).toBeTruthy();
    expect((evidenceRow.textContent || '')).toContain('Triggered by:');

    const toggle = fixture.nativeElement.querySelector('[data-testid="cv-evidence-toggle-weak_action_verbs"]') as HTMLButtonElement;
    expect(toggle).toBeTruthy();
    toggle.click();
    fixture.detectChanges();

    const expandedItems = evidenceRow.querySelectorAll('.evidence-list li');
    expect(expandedItems.length).toBe(2);
    expect((expandedItems[0].textContent || '')).toContain('Responsible for frontend updates.');
    expect((expandedItems[1].textContent || '')).toContain('Worked on UI tasks.');
  });

  it('shows DOCX CTA when merged bullets OR low extraction quality is present', () => {
    const fixture = TestBed.createComponent(CvLinterComponent);
    fixture.detectChanges();

    runTextAnalysis(
      fixture,
      makeResponse({
        issues: [makeIssue({ id: 'merged_bullets_suspected', severity: 'warn' })],
      }),
    );

    expect(fixture.nativeElement.querySelector('[data-testid="cv-docx-cta"]')).toBeTruthy();

    const fixtureLowExtraction = TestBed.createComponent(CvLinterComponent);
    fixtureLowExtraction.detectChanges();
    runTextAnalysis(
      fixtureLowExtraction,
      makeResponse({
        issues: [makeIssue({ id: 'missing_linkedin', severity: 'warn' })],
        debug: {
          extractionQuality: { level: 'low', score: 0.42 },
        },
      }),
    );

    expect(fixtureLowExtraction.nativeElement.querySelector('[data-testid="cv-docx-cta"]')).toBeTruthy();

    const fixtureWithoutSignal = TestBed.createComponent(CvLinterComponent);
    fixtureWithoutSignal.detectChanges();
    runTextAnalysis(
      fixtureWithoutSignal,
      makeResponse({
        issues: [makeIssue({ id: 'missing_linkedin', severity: 'warn' })],
        debug: {
          extractionQuality: { level: 'high', score: 0.88 },
        },
      }),
    );

    expect(fixtureWithoutSignal.nativeElement.querySelector('[data-testid="cv-docx-cta"]')).toBeNull();
  });

  it('shows keyword suggestion chips for keyword issues and copies suggestion', fakeAsync(() => {
    const fixture = TestBed.createComponent(CvLinterComponent);
    fixture.detectChanges();

    runTextAnalysis(
      fixture,
      makeResponse({
        issues: [
          makeIssue({
            id: 'keyword_missing',
            severity: 'warn',
            category: 'keywords',
            fix: 'Add role keywords naturally in experience bullets.',
          }),
        ],
        debug: {
          missingKeywords: {
            critical: ['accessibility', 'performance', 'change detection'],
            strong: ['ci/cd'],
          },
        },
      }),
    );

    const chips = fixture.nativeElement.querySelectorAll('[data-testid="cv-keyword-chip-keyword_missing"]');
    expect(chips.length).toBeGreaterThan(0);

    const clipboardSpy = jasmine.createSpy('writeText').and.returnValue(Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: clipboardSpy },
    });

    (chips[0] as HTMLButtonElement).click();
    tick();
    fixture.detectChanges();

    expect(clipboardSpy).toHaveBeenCalled();
    const toast = fixture.nativeElement.querySelector('[data-testid="cv-success-toast"]');
    expect((toast?.textContent || '')).toContain('Copied suggestion');
    flush();
  }));

  it('shows low-confidence label for extraction-sensitive issues under low extraction quality', () => {
    const fixture = TestBed.createComponent(CvLinterComponent);
    fixture.detectChanges();

    runTextAnalysis(
      fixture,
      makeResponse({
        issues: [
          makeIssue({ id: 'keyword_missing', severity: 'warn', category: 'keywords' }),
          makeIssue({ id: 'low_extraction_quality', severity: 'info', scoreDelta: 0 }),
        ],
        debug: {
          extractionQuality: { level: 'low', score: 0.35 },
        },
      }),
    );

    const lowConfidence = fixture.nativeElement.querySelectorAll('[data-testid="cv-low-confidence"]');
    expect(lowConfidence.length).toBeGreaterThan(0);
    expect((fixture.nativeElement.textContent || '')).toContain('Scores may be undercounted due to PDF parsing');
  });
});
