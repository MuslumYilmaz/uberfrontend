import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { Router } from '@angular/router';
import { ActivityService } from '../../../core/services/activity.service';
import { AuthService } from '../../../core/services/auth.service';
import { BugReportService } from '../../../core/services/bug-report.service';
import { CodeStorageService } from '../../../core/services/code-storage.service';
import { DailyService } from '../../../core/services/daily.service';
import { QuestionService } from '../../../core/services/question.service';
import { SeoService } from '../../../core/services/seo.service';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { PressureModeProgressService } from '../../../core/services/pressure-mode-progress.service';
import { PressureModeService } from '../../../core/services/pressure-mode.service';
import { UserProgressService } from '../../../core/services/user-progress.service';
import { CodingDetailComponent } from './coding-detail.component';

describe('CodingDetailComponent', () => {
  let questionService: jasmine.SpyObj<QuestionService>;
  let dailyService: jasmine.SpyObj<DailyService>;
  let bugReport: jasmine.SpyObj<BugReportService>;
  let seo: jasmine.SpyObj<SeoService>;
  let analytics: jasmine.SpyObj<AnalyticsService>;
  let activity: jasmine.SpyObj<ActivityService>;
  let progress: jasmine.SpyObj<UserProgressService>;
  let auth: jasmine.SpyObj<AuthService>;
  let pressureModes: jasmine.SpyObj<PressureModeService>;
  let pressureProgress: jasmine.SpyObj<PressureModeProgressService>;
  let authUser: ReturnType<typeof signal<any>>;

  const pressureScenario = {
    schemaVersion: '1.0.0',
    id: 'counter-pressure-v1',
    family: 'counter',
    title: 'Counter Interview Pressure Mode',
    access: 'free',
    estimatedMinutes: 35,
    supportedQuestions: {
      react: 'react-counter',
      angular: 'angular-counter-starter',
      vue: 'vue-counter',
    },
    rounds: [
      {
        id: 'base',
        title: 'Base',
        interviewerPrompt: 'Build the base counter.',
        constraints: ['Start at zero.'],
        frameworkTests: [{ id: 'base', name: 'Base', steps: [{ type: 'expectText', selector: '.value', text: '0' }] }],
      },
      {
        id: 'step',
        title: 'Step',
        interviewerPrompt: 'Add step selection.',
        constraints: ['Use a selected step.'],
        frameworkTests: [{ id: 'step', name: 'Step', steps: [{ type: 'expectValue', selector: '#step-size', value: '1' }] }],
      },
      {
        id: 'keyboard',
        title: 'Keyboard',
        interviewerPrompt: 'Add keyboard behavior.',
        constraints: ['Support ArrowUp.'],
        frameworkTests: [{ id: 'keyboard', name: 'Keyboard', steps: [{ type: 'key', selector: '.counter-control', key: 'ArrowUp' }] }],
      },
      {
        id: 'lifecycle',
        title: 'Lifecycle',
        interviewerPrompt: 'Clean up timers.',
        constraints: ['Clear the interval.'],
        frameworkTests: [{ id: 'cleanup', name: 'Cleanup', steps: [{ type: 'unmountPreview' }] }],
      },
    ],
    debrief: {
      title: 'Complete',
      summary: 'Summary',
      takeaways: ['Keep invariants.'],
      frameworkNotes: { react: 'React note', angular: 'Angular note', vue: 'Vue note' },
    },
    solutionAssets: {
      react: 'assets/sb/react/solution/react-counter-pressure-solution.v1.json',
      angular: 'assets/sb/angular/solution/angular-counter-pressure-solution.v1.json',
      vue: 'assets/sb/vue/solution/vue-counter-pressure-solution.v1.json',
    },
  } as any;

  beforeEach(async () => {
    sessionStorage.clear();
    questionService = jasmine.createSpyObj<QuestionService>('QuestionService', ['loadQuestions']);
    dailyService = jasmine.createSpyObj<DailyService>('DailyService', ['ensureTodaySet', 'markCompletedById']);
    bugReport = jasmine.createSpyObj<BugReportService>('BugReportService', ['open']);
    seo = jasmine.createSpyObj<SeoService>('SeoService', ['updateTags', 'buildCanonicalUrl']);
    analytics = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', ['track']);
    activity = jasmine.createSpyObj<ActivityService>('ActivityService', ['complete', 'uncomplete', 'isCompletionPending']);
    progress = jasmine.createSpyObj<UserProgressService>(
      'UserProgressService',
      ['solvedIds', 'isSolved', 'setSolvedIds', 'markSolvedLocal', 'unmarkSolved'],
    );
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['user', 'isLoggedIn', 'ensureMe', 'headers']);
    pressureModes = jasmine.createSpyObj<PressureModeService>('PressureModeService', ['load']);
    pressureProgress = jasmine.createSpyObj<PressureModeProgressService>(
      'PressureModeProgressService',
      [
        'itemId',
        'read',
        'start',
        'revealRound',
        'markRoundCleared',
        'markPendingCompletion',
        'hasPendingCompletion',
        'clearPendingCompletion',
      ],
    );
    seo.buildCanonicalUrl.and.callFake((value: string) => `https://frontendatlas.com${value}`);
    activity.complete.and.returnValue(of({ solvedQuestionIds: ['q1'], stats: {} } as any));
    activity.uncomplete.and.returnValue(of({ solvedQuestionIds: [], stats: {}, rollbackApplied: true } as any));
    activity.isCompletionPending.and.returnValue(false);
    progress.solvedIds.and.returnValue([]);
    progress.isSolved.and.returnValue(false);
    progress.setSolvedIds.and.stub();
    progress.markSolvedLocal.and.stub();
    progress.unmarkSolved.and.resolveTo();
    authUser = signal<any>(null);
    (auth.user as any).and.callFake(() => authUser());
    auth.isLoggedIn.and.returnValue(false);
    auth.ensureMe.and.returnValue(of(null));
    auth.headers.and.returnValue({} as any);
    pressureModes.load.and.returnValue(of(pressureScenario));
    pressureProgress.itemId.and.callFake((scenarioId, questionId) => `pressure:${scenarioId}:${questionId}`);
    pressureProgress.read.and.returnValue({
      activeRoundIndex: 0,
      clearedRounds: 0,
      completed: false,
    });
    pressureProgress.hasPendingCompletion.and.returnValue(false);

    await TestBed.configureTestingModule({
      imports: [CodingDetailComponent, RouterTestingModule, HttpClientTestingModule],
      providers: [
        { provide: QuestionService, useValue: questionService },
        { provide: DailyService, useValue: dailyService },
        { provide: ActivityService, useValue: activity },
        { provide: SeoService, useValue: seo },
        { provide: AnalyticsService, useValue: analytics },
        {
          provide: CodeStorageService,
          useValue: {
            migrateAllJsToIndexedDbOnce: () => Promise.resolve(),
            getJsAsync: () => Promise.resolve(null),
            clearJsAsync: () => Promise.resolve(),
            clearFrameworkAsync: () => Promise.resolve(),
            clearWebAsync: () => Promise.resolve(),
            getWebDraftSnapshotAsync: () => Promise.resolve(null),
            cloneWebBundleAsync: () => Promise.resolve(false),
            initWebAsync: (_key: string, starters: { html: string; css: string }) =>
              Promise.resolve({ html: starters.html, css: starters.css, restored: false }),
            saveWebAsync: () => Promise.resolve(),
            resetWebBothAsync: () => Promise.resolve(),
          },
        },
        { provide: UserProgressService, useValue: progress },
        { provide: AuthService, useValue: auth },
        { provide: BugReportService, useValue: bugReport },
        { provide: PressureModeService, useValue: pressureModes },
        { provide: PressureModeProgressService, useValue: pressureProgress },
      ],
    }).compileComponents();

  });

  afterEach(() => {
    document.body.style.overflow = '';
  });

  it('delegates runTests to the JS panel for JS questions', async () => {
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;

    component.tech = 'javascript';
    component.question.set({ id: 'q1' } as any);
    component.subTab.set('console');
    component.consoleEntries.set([{ level: 'log', message: 'old', timestamp: 1 } as any]);

    const runSpy = jasmine.createSpy('runTests').and.resolveTo();
    component.jsPanel = { runTests: runSpy } as any;

    await component.runTests();

    expect(runSpy).toHaveBeenCalled();
    expect(component.subTab()).toBe('tests');
    expect(component.consoleEntries().length).toBe(0);
  });

  it('loads JS approach with its own decision graph asset override', () => {
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;

    component.tech = 'javascript';
    component.question.set({ id: 'js-debounce', technology: 'javascript' } as any);
    component.currentJsLang.set('js');

    const applySolution = jasmine.createSpy('applySolution');
    component.jsPanel = { applySolution } as any;

    const approach = {
      codeJs: 'export default function debounce() {}',
      decisionGraphAsset: 'assets/questions/javascript/decision-graphs/js-debounce-approach2.v1.json',
    } as any;

    component.loadApproach(approach, 1);

    expect(applySolution).toHaveBeenCalledWith(
      'export default function debounce() {}',
      {
        decisionGraphAsset: 'assets/questions/javascript/decision-graphs/js-debounce-approach2.v1.json',
        decisionGraphKey: null,
      },
    );
  });

  it('does not infer decision graph asset when metadata is missing', () => {
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;

    component.tech = 'javascript';
    component.question.set({ id: 'js-debounce', technology: 'javascript' } as any);
    component.currentJsLang.set('js');

    const applySolution = jasmine.createSpy('applySolution');
    component.jsPanel = { applySolution } as any;

    const approach = {
      codeJs: 'export default function debounce() {}',
    } as any;

    component.loadApproach(approach, 2);

    expect(applySolution).toHaveBeenCalledWith(
      'export default function debounce() {}',
      {
        decisionGraphAsset: null,
        decisionGraphKey: null,
      },
    );
  });

  it('uses shared question sidecar with inferred decision graph key when approach asset is omitted', () => {
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;

    component.tech = 'javascript';
    component.question.set({
      id: 'js-debounce',
      technology: 'javascript',
      decisionGraphAsset: 'assets/questions/javascript/decision-graphs/js-debounce.v1.json',
    } as any);
    component.currentJsLang.set('js');

    const applySolution = jasmine.createSpy('applySolution');
    component.jsPanel = { applySolution } as any;

    component.loadApproach({ codeJs: 'export default function debounce() {}' } as any, 1);

    expect(applySolution).toHaveBeenCalledWith(
      'export default function debounce() {}',
      {
        decisionGraphAsset: 'assets/questions/javascript/decision-graphs/js-debounce.v1.json',
        decisionGraphKey: 'approach2',
      },
    );
  });

  it('shows compact quick-win strip first, then expands next-step card after first run/check action', async () => {
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;

    component.tech = 'javascript';
    component.question.set({ id: 'q1', access: 'free' } as any);
    component.quickWinActive.set(true);
    component.subTab.set('console');

    const runSpy = jasmine.createSpy('runTests').and.resolveTo();
    component.jsPanel = { runTests: runSpy } as any;

    expect(component.quickWinShowCompact()).toBeTrue();
    expect(component.quickWinShowExpanded()).toBeFalse();

    await component.runTests();

    expect(component.quickWinShowCompact()).toBeFalse();
    expect(component.quickWinShowExpanded()).toBeTrue();
    expect(analytics.track).toHaveBeenCalledWith(
      'quick_win_progressed',
      jasmine.objectContaining({
        surface: 'coding_detail',
        via: 'run_tests',
      }),
    );
  });

  it('dismisses expanded quick-win next-step card for current session', () => {
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;

    component.quickWinActive.set(true);
    component.quickWinEngaged.set(true);
    expect(component.quickWinShowExpanded()).toBeTrue();

    component.dismissQuickWinNextStep();

    expect(component.quickWinShowExpanded()).toBeFalse();
    expect(sessionStorage.getItem('fa:coding:quick-win-next-dismissed:v1')).toBe('1');
  });

  it('does not run JS tests for web questions', async () => {
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;

    component.tech = 'html';
    component.question.set({ id: 'q1', access: 'free' } as any);
    const runSpy = jasmine.createSpy('runTests').and.resolveTo();
    component.jsPanel = { runTests: runSpy } as any;

    await component.runTests();

    expect(runSpy).not.toHaveBeenCalled();
    expect(component.subTab()).toBe('tests');
  });

  it('opens bug report flow from coding detail action', () => {
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;

    component.tech = 'javascript';
    component.question.set({ id: 'q1', title: 'Two Sum' } as any);

    component.reportIssue();

    expect(bugReport.open).toHaveBeenCalledWith(jasmine.objectContaining({
      source: 'coding_detail',
      tech: 'javascript',
      questionId: 'q1',
      questionTitle: 'Two Sum',
    }));
  });

  it('opens bug report flow from coding locked action', () => {
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;

    component.tech = 'javascript';
    component.question.set({ id: 'q1', title: 'Two Sum' } as any);

    component.reportAccessIssue();

    expect(bugReport.open).toHaveBeenCalledWith(jasmine.objectContaining({
      source: 'coding_locked',
      tech: 'javascript',
      questionId: 'q1',
      questionTitle: 'Two Sum',
    }));
  });

  it('uses activity rollback when marking a solved coding question incomplete', async () => {
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;

    auth.isLoggedIn.and.returnValue(true);
    auth.user.and.returnValue({ _id: 'user-1' } as any);
    component.tech = 'html';
    component.kind = 'coding';
    component.question.set({ id: 'q1', access: 'free' } as any);
    component.solved.set(true);

    await component.submitCode();

    expect(activity.uncomplete).toHaveBeenCalledWith({
      kind: 'coding',
      tech: 'html',
      itemId: 'q1',
    });
    expect(component.solved()).toBeFalse();
  });

  it('runs structured framework checks and completes only when they pass', async () => {
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;
    const runFrameworkChecks = jasmine.createSpy('runFrameworkChecks').and.resolveTo([
      { name: 'Counter flow', passed: true },
    ]);

    auth.isLoggedIn.and.returnValue(true);
    auth.user.and.returnValue({ _id: 'user-1' } as any);
    component.tech = 'react';
    component.kind = 'coding';
    component.question.set({
      id: 'react-counter',
      access: 'free',
      difficulty: 'easy',
      frameworkTests: [{ id: 'counter', name: 'Counter', steps: [{ type: 'expectExists', selector: '.value' }] }],
    } as any);
    component.frameworkPanel = { runFrameworkChecks } as any;

    await component.submitCode();

    expect(runFrameworkChecks).toHaveBeenCalledWith({ emitCompletion: false });
    expect(activity.complete).toHaveBeenCalledWith(jasmine.objectContaining({
      kind: 'coding',
      tech: 'react',
      itemId: 'react-counter',
    }));
    expect(component.solved()).toBeTrue();
  });

  it('completes from a framework panel Run checks event when all checks pass', async () => {
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;

    auth.isLoggedIn.and.returnValue(true);
    auth.user.and.returnValue({ _id: 'user-1' } as any);
    component.tech = 'vue';
    component.kind = 'coding';
    component.question.set({
      id: 'vue-counter',
      access: 'free',
      difficulty: 'easy',
      frameworkTests: [{ id: 'counter', name: 'Counter', steps: [{ type: 'expectExists', selector: '.value' }] }],
    } as any);

    await component.onFrameworkCheckRun({
      questionId: 'vue-counter',
      passed: true,
      results: [{ name: 'Counter flow', passed: true }],
    });

    expect(activity.complete).toHaveBeenCalledWith(jasmine.objectContaining({
      kind: 'coding',
      tech: 'vue',
      itemId: 'vue-counter',
    }));
    expect(component.solved()).toBeTrue();
  });

  it('tracks framework check analytics before completion side effects', async () => {
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;

    auth.isLoggedIn.and.returnValue(false);
    component.tech = 'react';
    component.kind = 'coding';
    component.question.set({
      id: 'react-autocomplete-search-starter',
      access: 'free',
      difficulty: 'intermediate',
      frameworkTests: [{ id: 'aria', name: 'ARIA', steps: [{ type: 'expectExists', selector: '.input' }] }],
    } as any);

    await component.onFrameworkCheckRun({
      questionId: 'react-autocomplete-search-starter',
      passed: true,
      results: [{ name: 'ARIA', passed: true }],
    });

    expect(analytics.track).toHaveBeenCalledWith('run_checks', jasmine.objectContaining({
      question_id: 'react-autocomplete-search-starter',
      pass_count: 1,
      total_count: 1,
    }));
    expect(analytics.track).toHaveBeenCalledWith('first_passing_test', jasmine.objectContaining({
      question_id: 'react-autocomplete-search-starter',
    }));
    expect(analytics.track).toHaveBeenCalledWith('all_tests_passed', jasmine.objectContaining({
      question_id: 'react-autocomplete-search-starter',
      total_count: 1,
    }));
    expect(activity.complete).not.toHaveBeenCalled();
  });

  it('exposes interview hero metadata and tracks Start coding', fakeAsync(() => {
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;
    const focusEditor = jasmine.createSpy('focusEditor');

    component.tech = 'react';
    component.kind = 'coding';
    component.question.set({
      id: 'react-autocomplete-search-starter',
      access: 'free',
      difficulty: 'intermediate',
      estimatedMinutes: 40,
      interviewFocus: {
        summary: 'Intermediate Frontend machine coding interview question. Recommended time: 35-45 minutes.',
        tests: ['Keyboard navigation and ARIA'],
      },
      description: {
        summary: 'Build autocomplete.',
        specs: {
          techFocus: ['React state/effects', 'Debounce'],
        },
      },
    } as any);
    component.frameworkPanel = { focusEditor } as any;

    expect(component.interviewFocusSummary()).toContain('Frontend machine coding interview question');
    expect(component.questionTimeboxLabel()).toBe('35-45 min');
    expect(component.assessedSkillChips()).toEqual(['React state/effects', 'Debounce']);

    component.startCoding();
    tick(0);

    expect(analytics.track).toHaveBeenCalledWith('start_coding', jasmine.objectContaining({
      question_id: 'react-autocomplete-search-starter',
      tech: 'react',
    }));
    expect(focusEditor).toHaveBeenCalled();
  }));

  it('tracks solution reveal once when the solution body is shown', () => {
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;

    component.tech = 'react';
    component.kind = 'coding';
    component.question.set({ id: 'react-autocomplete-search-starter', access: 'free' } as any);

    component.onSolutionTabClick();
    component.onSolutionTabClick();

    const viewSolutionCalls = analytics.track.calls.allArgs()
      .filter(([name]) => name === 'view_solution');
    expect(viewSolutionCalls.length).toBe(1);
    expect(viewSolutionCalls[0][1]).toEqual(jasmine.objectContaining({
      question_id: 'react-autocomplete-search-starter',
      tech: 'react',
    }));
  });

  it('does not complete a structured framework question when checks fail', async () => {
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;

    auth.isLoggedIn.and.returnValue(true);
    auth.user.and.returnValue({ _id: 'user-1' } as any);
    component.tech = 'react';
    component.kind = 'coding';
    component.question.set({
      id: 'react-counter',
      access: 'free',
      frameworkTests: [{ id: 'counter', name: 'Counter', steps: [{ type: 'expectExists', selector: '.value' }] }],
    } as any);
    component.frameworkPanel = {
      runFrameworkChecks: jasmine.createSpy('runFrameworkChecks').and.resolveTo([
        { name: 'Counter flow', passed: false, error: 'Expected 1' },
      ]),
    } as any;

    await component.submitCode();

    expect(activity.complete).not.toHaveBeenCalled();
    expect(activity.uncomplete).not.toHaveBeenCalled();
    expect(component.solved()).toBeFalse();
  });

  it('keeps manual completion for untested framework questions', async () => {
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;
    const runFrameworkChecks = jasmine.createSpy('runFrameworkChecks');

    auth.isLoggedIn.and.returnValue(true);
    auth.user.and.returnValue({ _id: 'user-1' } as any);
    component.tech = 'react';
    component.kind = 'coding';
    component.question.set({ id: 'react-untested', access: 'free', difficulty: 'easy' } as any);
    component.frameworkPanel = { runFrameworkChecks } as any;

    await component.submitCode();

    expect(runFrameworkChecks).not.toHaveBeenCalled();
    expect(activity.complete).toHaveBeenCalledWith(jasmine.objectContaining({
      itemId: 'react-untested',
    }));
  });

  it('refreshes an already-solved structured framework question instead of toggling it incomplete', async () => {
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;

    auth.isLoggedIn.and.returnValue(true);
    auth.user.and.returnValue({ _id: 'user-1' } as any);
    component.tech = 'react';
    component.kind = 'coding';
    component.question.set({
      id: 'react-counter',
      access: 'free',
      difficulty: 'easy',
      frameworkTests: [{ id: 'counter', name: 'Counter', steps: [{ type: 'expectExists', selector: '.value' }] }],
    } as any);
    component.solved.set(true);
    component.frameworkPanel = {
      runFrameworkChecks: jasmine.createSpy('runFrameworkChecks').and.resolveTo([
        { name: 'Counter flow', passed: true },
      ]),
    } as any;

    await component.submitCode();

    expect(activity.uncomplete).not.toHaveBeenCalled();
    expect(activity.complete).toHaveBeenCalled();
    expect(component.solved()).toBeTrue();
  });

  it('lets logged-out users run structured checks but prompts before saving completion', async () => {
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;

    auth.isLoggedIn.and.returnValue(false);
    component.tech = 'react';
    component.kind = 'coding';
    component.question.set({
      id: 'react-counter',
      access: 'free',
      frameworkTests: [{ id: 'counter', name: 'Counter', steps: [{ type: 'expectExists', selector: '.value' }] }],
    } as any);
    component.frameworkPanel = {
      runFrameworkChecks: jasmine.createSpy('runFrameworkChecks').and.resolveTo([
        { name: 'Counter flow', passed: true },
      ]),
    } as any;

    await component.submitCode();

    expect(activity.complete).not.toHaveBeenCalled();
    expect(component.loginPromptOpen).toBeTrue();
  });

  it('clears an intermediate pressure round without completing the normal question', async () => {
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;

    auth.isLoggedIn.and.returnValue(true);
    auth.user.and.returnValue({ _id: 'user-1' } as any);
    component.tech = 'react';
    component.kind = 'coding';
    component.question.set({
      id: 'react-counter',
      access: 'free',
      difficulty: 'easy',
      pressureModeAsset: 'assets/questions/pressure-modes/counter.v1.json',
    } as any);
    component.pressureRequested.set(true);
    component.pressureScenario.set(pressureScenario);

    await component.onFrameworkCheckRun({
      questionId: 'react-counter',
      passed: true,
      results: [{ name: 'Base', passed: true }],
    });

    expect(component.pressureClearedRounds()).toBe(1);
    expect(component.pressureReadyForNextRound()).toBeTrue();
    expect(pressureProgress.markRoundCleared).toHaveBeenCalledWith(
      pressureScenario.id,
      'react-counter',
      {
        activeRoundIndex: 0,
        clearedRounds: 1,
        completed: false,
      },
    );
    expect(activity.complete).not.toHaveBeenCalled();
    expect(analytics.track).not.toHaveBeenCalledWith(
      'all_tests_passed',
      jasmine.anything(),
    );
  });

  it('keeps pressure rounds locked until the user explicitly reveals the next constraint', () => {
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;

    component.tech = 'react';
    component.kind = 'coding';
    component.question.set({
      id: 'react-counter',
      access: 'free',
      pressureModeAsset: 'assets/questions/pressure-modes/counter.v1.json',
    } as any);
    component.pressureRequested.set(true);
    component.pressureScenario.set(pressureScenario);

    component.revealNextPressureRound();
    expect(component.pressureRoundIndex()).toBe(0);
    expect(pressureProgress.revealRound).not.toHaveBeenCalled();

    component.pressureClearedRounds.set(1);
    component.revealNextPressureRound();

    expect(component.pressureRoundIndex()).toBe(1);
    expect(component.pressureFrameworkTests().map((test) => test.id)).toEqual(['base', 'step']);
    expect(pressureProgress.revealRound).toHaveBeenCalledWith(
      pressureScenario.id,
      'react-counter',
      {
        activeRoundIndex: 1,
        clearedRounds: 1,
        completed: false,
      },
    );
  });

  it('completes pressure progress and the normal coding activity only on the final round', async () => {
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;

    auth.isLoggedIn.and.returnValue(true);
    auth.user.and.returnValue({ _id: 'user-1' } as any);
    component.tech = 'react';
    component.kind = 'coding';
    component.question.set({
      id: 'react-counter',
      access: 'free',
      difficulty: 'easy',
      pressureModeAsset: 'assets/questions/pressure-modes/counter.v1.json',
    } as any);
    component.pressureRequested.set(true);
    component.pressureScenario.set(pressureScenario);
    component.pressureRoundIndex.set(3);
    component.pressureClearedRounds.set(3);

    await component.onFrameworkCheckRun({
      questionId: 'react-counter',
      passed: true,
      results: pressureScenario.rounds.map((round: { title: string }) => ({
        name: round.title,
        passed: true,
      })),
    });

    expect(activity.complete).toHaveBeenCalledOnceWith(jasmine.objectContaining({
      kind: 'coding',
      tech: 'react',
      itemId: 'react-counter',
    }));
    expect(component.pressureCompleted()).toBeTrue();
    expect(component.solved()).toBeTrue();
    expect(component.activePanel()).toBe(1);
    expect(pressureProgress.markRoundCleared.calls.mostRecent().args[2]).toEqual({
      activeRoundIndex: 3,
      clearedRounds: 4,
      completed: true,
    });
    expect(pressureProgress.clearPendingCompletion).toHaveBeenCalledWith(
      pressureScenario.id,
      'react-counter',
    );
  });

  it('lets a guest finish pressure checks locally and records a pending sign-in claim', async () => {
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;

    auth.isLoggedIn.and.returnValue(false);
    component.tech = 'vue';
    component.kind = 'coding';
    component.question.set({
      id: 'vue-counter',
      access: 'free',
      difficulty: 'easy',
      pressureModeAsset: 'assets/questions/pressure-modes/counter.v1.json',
    } as any);
    component.pressureRequested.set(true);
    component.pressureScenario.set(pressureScenario);
    component.pressureRoundIndex.set(3);
    component.pressureClearedRounds.set(3);

    await component.onFrameworkCheckRun({
      questionId: 'vue-counter',
      passed: true,
      results: pressureScenario.rounds.map((round: { title: string }) => ({
        name: round.title,
        passed: true,
      })),
    });

    expect(activity.complete).not.toHaveBeenCalled();
    expect(component.pressureCompleted()).toBeTrue();
    expect(component.loginPromptOpen).toBeTrue();
    expect(pressureProgress.markPendingCompletion).toHaveBeenCalledWith(
      pressureScenario.id,
      'vue-counter',
      {
        activeRoundIndex: 3,
        clearedRounds: 4,
        completed: true,
      },
    );
  });

  it('resets only the pressure workspace without unmarking the normal Counter completion', async () => {
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;
    const resetToStarter = jasmine.createSpy('resetToStarter');

    component.tech = 'angular';
    component.kind = 'coding';
    component.question.set({
      id: 'angular-counter-starter',
      access: 'free',
      pressureModeAsset: 'assets/questions/pressure-modes/counter.v1.json',
    } as any);
    component.pressureRequested.set(true);
    component.pressureScenario.set(pressureScenario);
    component.solved.set(true);
    component.frameworkPanel = { resetToStarter } as any;

    await component.resetQuestion();

    expect(resetToStarter).toHaveBeenCalled();
    expect(progress.unmarkSolved).not.toHaveBeenCalled();
    expect(component.solved()).toBeTrue();
  });

  it('navigates back using returnToUrl when available', () => {
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;
    const router = TestBed.inject(Router);
    const navSpy = spyOn(router, 'navigateByUrl');

    (component as any).returnToUrl = '/coding?tech=javascript';
    (component as any).returnTo = null;
    component.courseNav.set(null);

    component.backToReturn();
    expect(navSpy).toHaveBeenCalledWith('/coding?tech=javascript');
  });

  it('navigates back using course breadcrumb when provided', () => {
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;
    const router = TestBed.inject(Router);
    const navSpy = spyOn(router, 'navigate');

    component.courseNav.set({
      breadcrumb: { to: ['/courses', 'frontend'], label: 'Course' },
      prev: null,
      next: null,
    });

    component.backToReturn();
    expect(navSpy).toHaveBeenCalledWith(['/courses', 'frontend']);
  });

  it('initializes direct question flow and loads questions', () => {
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;
    component.questionId = 'q1';
    component.questionTech = 'javascript';

    questionService.loadQuestions.and.returnValue(of([{ id: 'q1', title: 'Title', access: 'free' } as any]));
    const loadSpy = spyOn(component as any, 'loadQuestion').and.resolveTo();

    component.ngOnInit();

    expect(dailyService.ensureTodaySet).toHaveBeenCalledWith('javascript' as any);
    expect(questionService.loadQuestions).toHaveBeenCalledWith('javascript', 'coding');
    expect(loadSpy).toHaveBeenCalledWith('q1');
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('renders only the empty state for a notFound load state', () => {
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;

    component.loadState.set('notFound');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="coding-detail-skeleton"]')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Question not found.');
  });

  it('renders seo h1 and JavaScript prompt specs without renaming the catalog title', async () => {
    const question = makeDeferredPromiseQuestion();
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;
    component.questionId = question.id;
    component.questionTech = 'javascript';
    component.disablePersistence = true;
    component.hideFooterBar = true;

    questionService.loadQuestions.and.returnValue(of([question] as any));
    spyOn(component as any, 'resolveSolutionAsset').and.resolveTo({ files: {}, initialPath: '' });

    fixture.detectChanges();
    await fixture.whenStable();
    component.isPhoneViewport.set(false);
    component.liteEditors.set(true);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const h1 = host.querySelector('[data-testid="question-title"]');
    const descriptionPanel = host.querySelector('[data-testid="coding-description-panel"]') as HTMLElement;
    const solutionPanel = host.querySelector('[data-testid="coding-solution-panel"]') as HTMLElement;
    const workspacePanel = host.querySelector('[data-testid="coding-workspace-panel"]') as HTMLElement;
    const descriptionText = descriptionPanel?.textContent || '';
    const solutionText = solutionPanel?.textContent || '';

    expect(question.title).toBe('Create a Deferred Promise (For Async Tests)');
    expect(h1?.textContent?.trim()).toBe('Implement createDeferred() in JavaScript');
    expect(descriptionPanel.hidden).toBeFalse();
    expect(solutionPanel.hidden).toBeTrue();
    expect(workspacePanel).not.toBeNull();

    expect(descriptionText).toContain('Implement createDeferred() in JavaScript.');
    expect(descriptionText).toContain('{ promise, resolve, reject }');
    expect(descriptionText).toContain("What you'll practice");
    expect(descriptionText).toContain('Creating createDeferred() with { promise, resolve, reject } controls');
    expect(descriptionText).toContain('Expected behavior');
    expect(descriptionText).toContain('Your createDeferred() implementation should:');
    expect(descriptionText).toContain('Adopt another Promise when resolve(Promise.resolve(value)) is used');
    expect(descriptionText).toContain('Examples');
    expect(descriptionText).toContain('// At t=0');
    expect(host.querySelector('pre.lite-code')?.textContent || '').toContain("await adopted.promise; // 'ok'");
    expect(component.combinedExamples()).toContain('// At t=0');
    expect(component.combinedExamples()).toContain("await adopted.promise; // 'ok'");
    expect(descriptionText).not.toContain('Common interview follow-ups');
    expect(descriptionText).not.toContain('Guides');
    expect(descriptionText).not.toContain('Preparing for interviews');
    expect(descriptionText).not.toContain('Report issue');
    expect(descriptionPanel.querySelector('[data-testid="coding-guide-links"]')).toBeNull();
    expect(descriptionPanel.querySelector('[data-testid="coding-prep-entry"]')).toBeNull();
    expect(descriptionPanel.querySelector('[data-testid="coding-report-issue-btn"]')).toBeNull();
    expect(solutionPanel.querySelector('[data-testid="coding-guide-links"]')).not.toBeNull();

    expect(solutionText).toContain('Interview answer:');
    expect(solutionText).toContain('Mental model:');
    expect(solutionText).toContain('Common interview follow-ups:');
    expect(solutionText).toContain('How would you type { promise, resolve, reject } in TypeScript?');

    component.activePanel.set(1);
    fixture.detectChanges();

    const openedSolutionText = solutionPanel.textContent || '';
    expect(descriptionPanel.hidden).toBeTrue();
    expect(solutionPanel.hidden).toBeFalse();
    expect(solutionPanel.querySelector('[data-testid="coding-similar-questions"]')).not.toBeNull();
    expect(solutionPanel.querySelector('[data-testid="coding-guide-links"]')).not.toBeNull();
    expect(solutionPanel.querySelector('[data-testid="coding-prep-entry"]')).not.toBeNull();
    expect(solutionPanel.querySelector('[data-testid="coding-report-issue-btn"]')).not.toBeNull();
    expect(openedSolutionText).toContain('Related links');
    expect(openedSolutionText).toContain('Implement debounce() in JavaScript');
    expect(openedSolutionText).toContain('Fix stale UI from async race conditions');
    expect(openedSolutionText.indexOf('Common interview follow-ups:')).toBeLessThan(openedSolutionText.indexOf('Guides'));
    expect(openedSolutionText.indexOf('Guides')).toBeLessThan(openedSolutionText.indexOf('Preparing for interviews'));
    expect(openedSolutionText.indexOf('Preparing for interviews')).toBeLessThan(openedSolutionText.indexOf('Report issue'));
  });

  it('ignores stale solution assets from an older question load', async () => {
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;
    const oldAsset = deferred<{ files: Record<string, string>; initialPath: string }>();
    spyOn(component as any, 'resolveSolutionAsset').and.callFake((q: any) => {
      if (q.id === 'react-old') return oldAsset.promise;
      return Promise.resolve({
        files: { 'src/App.tsx': 'export default function App() { return <div>New</div>; }' },
        initialPath: 'src/App.tsx',
      });
    });

    component.tech = 'react';
    component.kind = 'coding';
    (component as any).dataLoaded = true;
    component.allQuestions = [
      { id: 'react-old', title: 'Old React', access: 'free', difficulty: 'easy' } as any,
      { id: 'react-new', title: 'New React', access: 'free', difficulty: 'easy' } as any,
    ];

    const firstLoad = (component as any).loadQuestion('react-old') as Promise<void>;
    const secondLoad = (component as any).loadQuestion('react-new') as Promise<void>;
    await secondLoad;

    oldAsset.resolve({
      files: { 'src/App.tsx': 'export default function App() { return <div>Old</div>; }' },
      initialPath: 'src/App.tsx',
    });
    await firstLoad;

    expect(component.question()?.id).toBe('react-new');
    expect(component.solutionFilesMap()['src/App.tsx']).toContain('New');
    expect(component.solutionOpenPath()).toBe('src/App.tsx');
  });

  it('does not read or resolve solution fields for a locked Premium visitor', async () => {
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;
    let solutionAssetReads = 0;
    let solutionBlockReads = 0;
    const question: any = {
      id: 'react-locked-solution',
      title: 'Locked React Solution',
      type: 'coding',
      technology: 'react',
      access: 'premium',
      difficulty: 'intermediate',
      tags: ['react', 'state'],
      importance: 3,
      description: {
        summary: 'Build a React interaction with predictable state updates.',
        specs: {
          requirements: [
            'Render the current state after each interaction.',
            'Keep updates predictable for repeated interactions.',
            'Preserve accessible controls throughout the flow.',
          ],
        },
      },
      starterCode: 'export default function App() { return null; }',
    };
    Object.defineProperties(question, {
      solutionAsset: {
        enumerable: true,
        get: () => {
          solutionAssetReads += 1;
          return 'https://assets.example/locked-solution.json';
        },
      },
      solutionBlock: {
        enumerable: true,
        get: () => {
          solutionBlockReads += 1;
          return { overview: 'Protected solution.' };
        },
      },
    });
    const resolveSpy = spyOn(component as any, 'resolveSolutionAsset').and.callThrough();
    const httpGetSpy = spyOn((component as any).http, 'get').and.callThrough();

    component.tech = 'react';
    component.kind = 'coding';
    (component as any).dataLoaded = true;
    component.allQuestions = [question];

    await (component as any).loadQuestion(question.id);

    expect(component.locked()).toBeTrue();
    component.lockedPreview();
    component.solutionInfo();
    component.structuredSolution();

    expect(resolveSpy).not.toHaveBeenCalled();
    expect(solutionAssetReads).toBe(0);
    expect(solutionBlockReads).toBe(0);
    expect(component.solutionFilesMap()).toEqual({});
    expect(httpGetSpy).not.toHaveBeenCalled();
  });

  it('fetches a solution asset for a free question', async () => {
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;
    const question = {
      id: 'react-free-solution',
      title: 'Free React Solution',
      type: 'coding',
      technology: 'react',
      access: 'free',
      difficulty: 'easy',
      tags: ['react'],
      importance: 3,
      description: 'Build a small React interaction.',
      solutionAsset: 'https://assets.example/free-solution.json',
    } as any;

    component.tech = 'react';
    component.kind = 'coding';
    (component as any).dataLoaded = true;
    component.allQuestions = [question];
    const resolveSpy = spyOn(component as any, 'resolveSolutionAsset').and.callThrough();
    const httpGetSpy = spyOn((component as any).http, 'get').and.returnValue(of({
      files: { 'src/App.tsx': 'export default function App() { return <div>Free</div>; }' },
      openFile: 'src/App.tsx',
    }));

    await (component as any).loadQuestion(question.id);
    expect(resolveSpy).toHaveBeenCalledTimes(1);
    expect(httpGetSpy).toHaveBeenCalledOnceWith('https://assets.example/free-solution.json');

    expect(component.solutionFilesMap()['src/App.tsx']).toContain('Free');
    expect(component.solutionOpenPath()).toBe('src/App.tsx');
  });

  it('loads a Premium solution only after entitlement arrives and clears it on revocation', async () => {
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;
    const question = {
      id: 'react-premium-solution',
      title: 'Premium React Solution',
      type: 'coding',
      technology: 'react',
      access: 'premium',
      difficulty: 'intermediate',
      tags: ['react'],
      importance: 3,
      description: 'Build a Premium React interaction.',
      solutionAsset: 'https://assets.example/premium-solution.json',
    } as any;

    component.questionId = question.id;
    component.questionTech = 'react';
    questionService.loadQuestions.and.returnValue(of([question]));
    const resolveSpy = spyOn(component as any, 'resolveSolutionAsset').and.callThrough();
    const httpGetSpy = spyOn((component as any).http, 'get').and.returnValue(of({
      files: { 'src/App.tsx': 'export default function App() { return <div>Premium</div>; }' },
      openFile: 'src/App.tsx',
    }));

    fixture.detectChanges();
    await fixture.whenStable();
    expect(httpGetSpy).not.toHaveBeenCalled();
    expect(component.solutionFilesMap()).toEqual({});

    authUser.set({ accessTier: 'premium' });
    fixture.detectChanges();
    await fixture.whenStable();
    await (component as any).loadAuthorizedSolutionAsset(
      question,
      (component as any).loadQuestionSeq,
    );
    expect(resolveSpy).toHaveBeenCalledTimes(1);
    expect(httpGetSpy).toHaveBeenCalledOnceWith('https://assets.example/premium-solution.json');

    expect(component.locked()).toBeFalse();
    expect(component.solutionFilesMap()['src/App.tsx']).toContain('Premium');

    authUser.set(null);
    fixture.detectChanges();

    expect(component.locked()).toBeTrue();
    expect(component.solutionFilesMap()).toEqual({});
    expect(component.solutionOpenPath()).toBe('');
  });

  it('maps coding detail tech to interview hub routes', () => {
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;

    component.tech = 'react';
    expect(component.interviewQuestionsHubRoute()).toEqual(['/react/interview-questions']);
    expect(component.interviewQuestionsHubLabel()).toBe('React interview questions');

    component.tech = 'css';
    expect(component.interviewQuestionsHubRoute()).toEqual(['/css/interview-questions']);
    expect(component.interviewQuestionsHubLabel()).toBe('CSS interview questions');
  });

  it('keeps editorial source readable but rejects unsafe code tokens from the rich locked preview', () => {
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;

    component.question.set({
      id: 'react-progress-bar-thresholds',
      title: 'React Progress Bar',
      type: 'coding',
      technology: 'react',
      access: 'premium',
      tags: ['react', 'state'],
      description: {
        summary: '<strong>Thresholds:</strong> &lt;34 red, 34–66 orange, &gt;66 green with Array<T> and <ProgressBar />.',
      },
    } as any);

    expect(component.lockedSummary()).toBe(
      'Thresholds: <34 red, 34–66 orange, >66 green with Array<T> and <ProgressBar />.'
    );
    expect(component.lockedPreview()).toBeNull();
  });

  it('uses explicit related links for cross-bank coding page recommendations', () => {
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;

    component.tech = 'javascript';
    component.kind = 'coding';
    component.allQuestions = [];
    component.question.set({
      id: 'js-debounce',
      title: 'Debounce Function',
      type: 'coding',
      technology: 'javascript',
      access: 'free',
      difficulty: 'intermediate',
      tags: ['async', 'timing'],
      importance: 4,
      solutionBlock: {
        relatedLinks: [
          { title: 'Implement throttle() in JavaScript', route: ['/', 'javascript', 'coding', 'js-throttle'], label: 'Coding' },
          { title: 'React debounced search coding challenge', route: ['/', 'react', 'coding', 'react-debounced-search'], label: 'React' },
          { title: 'Angular RxJS debounced search challenge', route: ['/', 'angular', 'coding', 'angular-debounced-search'], label: 'Angular' },
          { title: 'Design realtime search with debounce and cache', route: ['/', 'system-design', 'realtime-search-debounce-cache'], label: 'System design' },
          { title: 'JavaScript coding interview questions', route: ['/', 'guides', 'interview-blueprint', 'javascript-interviews'], label: 'Guide' },
        ],
      },
    } as any);

    const items = component.followUpItems();

    expect(component.relatedSectionTitle()).toBe('Related links');
    expect(items.length).toBe(5);
    expect(items.map((item) => item.title)).toEqual([
      'Implement throttle() in JavaScript',
      'React debounced search coding challenge',
      'Angular RxJS debounced search challenge',
      'Design realtime search with debounce and cache',
      'JavaScript coding interview questions',
    ]);
    expect(items[3].to).toEqual(['/', 'system-design', 'realtime-search-debounce-cache']);
    expect(items[4].to).toEqual(['/', 'guides', 'interview-blueprint', 'javascript-interviews']);
    expect(items.map((item) => item.label)).toEqual(['Coding', 'React', 'Angular', 'System design', 'Guide']);
  });

  it('restores document overflow on destroy', () => {
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;
    component.questionId = 'q1';
    component.questionTech = 'javascript';

    questionService.loadQuestions.and.returnValue(of([{ id: 'q1', title: 'Title', access: 'free' } as any]));
    spyOn(component as any, 'loadQuestion').and.resolveTo();

    component.ngOnInit();
    expect(document.body.style.overflow).toBe('hidden');

    component.ngOnDestroy();
    expect(document.body.style.overflow).toBe('');
  });

  it('prefers question seo title/description and sanitizes/clamps values', () => {
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;
    component.tech = 'angular';

    (component as any).updateSeoForQuestion({
      id: 'angular-seo-case',
      title: 'Fallback Title Should Not Win',
      access: 'free',
      description: 'Fallback description should not be used when explicit SEO exists.',
      seo: {
        title: '  <b>Angular &amp; SEO title with extra words to exceed the safe serp length comfortably</b>  ',
        description: '  <p>Angular &amp; explicit SEO description should be used first, with HTML removed and final text clamped cleanly for search snippets without weird endings.</p>  ',
      },
    } as any);

    expect(seo.updateTags).toHaveBeenCalled();
    const payload = seo.updateTags.calls.mostRecent().args[0] as any;

    expect(payload.title).toContain('Angular & SEO title');
    expect(payload.title).not.toContain('<');
    expect(payload.title.length).toBeLessThanOrEqual(80);

    expect(payload.description).toContain('Angular & explicit SEO description should be used first');
    expect(payload.description).not.toContain('<');
    expect(payload.description).not.toContain('Angular-focused:');
    expect(payload.description.length).toBeLessThanOrEqual(240);
  });

  it('falls back to generated description and clamps when question seo is missing', () => {
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;
    component.tech = 'angular';

    (component as any).updateSeoForQuestion({
      id: 'angular-fallback-case',
      title: 'Build an Angular Widget with Change Detection and Template Bindings',
      access: 'free',
      description: '',
      seo: {},
    } as any);

    expect(seo.updateTags).toHaveBeenCalled();
    const payload = seo.updateTags.calls.mostRecent().args[0] as any;

    expect(payload.title).toContain('Build an Angular Widget');
    expect(payload.title.length).toBeLessThanOrEqual(70);
    expect(payload.description).toContain('Angular-focused:');
    expect(payload.description.length).toBeLessThanOrEqual(240);
  });

  it('keeps internal company tags out of question metadata and structured-data keywords', () => {
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;
    component.tech = 'javascript';
    component.kind = 'coding';

    (component as any).updateSeoForQuestion({
      id: 'js-company-tagged',
      title: 'Tagged internal practice prompt',
      access: 'free',
      difficulty: 'easy',
      description: 'Practice a transferable JavaScript implementation skill.',
      tags: ['closures'],
      companies: ['google'],
      companyTags: ['meta'],
    } as any);

    const payload = seo.updateTags.calls.mostRecent().args[0] as any;
    const graph = Array.isArray(payload?.jsonLd) ? payload.jsonLd : [];
    const article = graph.find((entry: any) => entry?.['@type'] === 'TechArticle');

    expect(payload.keywords).toContain('closures');
    expect(payload.keywords).not.toContain('google');
    expect(payload.keywords).not.toContain('meta');
    expect(String(article?.keywords || '')).not.toContain('google');
    expect(String(article?.keywords || '')).not.toContain('meta');
  });

  it('preserves exact explicit SEO titles up to the title length limit', () => {
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;
    component.tech = 'javascript';

    const title = 'Implement debounce() in JavaScript: Coding Challenge + Tests';

    (component as any).updateSeoForQuestion({
      id: 'js-debounce',
      title: 'Debounce Function',
      access: 'free',
      description: '',
      seo: {
        title,
        description: 'Build debounce(fn, delay) with starter code, tests, timeline examples, this/args handling, edge cases, and cancel/flush follow-ups.',
      },
    } as any);

    expect(seo.updateTags).toHaveBeenCalled();
    const payload = seo.updateTags.calls.mostRecent().args[0] as any;

    expect(payload.title).toBe(title);
  });

  it('preserves the deferred promise SEO title without clipping Tests', () => {
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;
    component.tech = 'javascript';

    (component as any).updateSeoForQuestion(makeDeferredPromiseQuestion());

    expect(seo.updateTags).toHaveBeenCalled();
    const payload = seo.updateTags.calls.mostRecent().args[0] as any;

    expect(payload.title).toBe('Implement createDeferred() in JavaScript: Promise Challenge + Tests');
    expect(payload.title).not.toBe(makeDeferredPromiseQuestion().seo.h1);
    expect(payload.description).toBe(
      'createDeferred(): {promise,resolve,reject}. Starter code/tests: resolve/reject, Promise adoption, pending, first-settlement-wins, TS/interview follow-ups.'
    );
    expect(payload.canonical).toBe('https://frontendatlas.com/javascript/coding/js-create-deferred-promise');
    expect(payload.robots).toBeUndefined();
  });

  it('marks premium coding content noindex without exposing solution-style schema, even for premium users', () => {
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;
    component.tech = 'css';
    component.kind = 'coding';
    auth.user.and.returnValue({ accessTier: 'premium' } as any);

    const question = {
      ...makeCssFlexboxNavbarQuestion(),
      access: 'premium',
    };

    (component as any).updateSeoForQuestion(question);

    expect(seo.updateTags).toHaveBeenCalled();
    const payload = seo.updateTags.calls.mostRecent().args[0] as any;
    const graph = Array.isArray(payload?.jsonLd) ? payload.jsonLd : [];
    const article = graph.find((entry: any) => entry?.['@type'] === 'TechArticle');
    const typeNames = graph.map((entry: any) => entry?.['@type']);

    expect(payload.robots).toBe('noindex,follow');
    expect(payload.canonical).toBe('https://frontendatlas.com/css/coding/css-flexbox-navbar');
    expect(article?.isAccessibleForFree).toBeFalse();
    expect(article?.author).toEqual({ '@type': 'Organization', name: 'FrontendAtlas Editorial' });
    expect(typeNames).toContain('BreadcrumbList');
    expect(typeNames).toContain('TechArticle');
    expect(typeNames).not.toContain('HowTo');
    expect(typeNames).not.toContain('FAQPage');
  });

  it('publishes exact SEO metadata and four-level breadcrumbs for the CSS theme variables challenge', () => {
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;
    component.tech = 'css';
    component.kind = 'coding';

    (component as any).updateSeoForQuestion(makeCssThemeVariablesQuestion());

    expect(seo.updateTags).toHaveBeenCalled();
    const payload = seo.updateTags.calls.mostRecent().args[0] as any;
    const graph = Array.isArray(payload?.jsonLd) ? payload.jsonLd : [];
    const breadcrumb = graph.find((entry: any) => entry?.['@type'] === 'BreadcrumbList');
    const article = graph.find((entry: any) => entry?.['@type'] === 'TechArticle');

    expect(payload.title).toBe('CSS Variables Dark Mode Challenge | FrontendAtlas');
    expect(payload.description).toBe(
      'Practice CSS custom properties with prefers-color-scheme and an equal-specificity :root:where(.theme-dark) override whose later source order wins.'
    );
    expect(payload.canonical).toBe('https://frontendatlas.com/css/coding/css-theme-variables-dark-mode');
    expect(payload.ogType).toBe('article');

    expect(article?.isAccessibleForFree).toBeTrue();
    expect(article?.author).toEqual({ '@type': 'Organization', name: 'FrontendAtlas Editorial' });
    expect(article?.url).toBe('https://frontendatlas.com/css/coding/css-theme-variables-dark-mode');
    expect(breadcrumb?.itemListElement?.map((item: any) => item.name)).toEqual([
      'Home',
      'CSS interview questions',
      'CSS Coding Challenges',
      'Theming with CSS Variables',
    ]);
    expect(breadcrumb?.itemListElement?.map((item: any) => item.item)).toEqual([
      'https://frontendatlas.com/',
      'https://frontendatlas.com/css/interview-questions',
      'https://frontendatlas.com/coding',
      'https://frontendatlas.com/css/coding/css-theme-variables-dark-mode',
    ]);
  });

  it('renders the Flexbox navbar interview prompt sections and read-only solution variants', async () => {
    const question = makeCssFlexboxNavbarQuestion();
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;
    component.questionId = question.id;
    component.questionTech = 'css';
    component.disablePersistence = true;
    component.hideFooterBar = true;

    questionService.loadQuestions.and.returnValue(of([question] as any));
    spyOn(component as any, 'resolveSolutionAsset').and.resolveTo({ files: {}, initialPath: '' });

    fixture.detectChanges();
    await fixture.whenStable();
    component.isPhoneViewport.set(false);
    component.liteEditors.set(true);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const descriptionPanel = host.querySelector('[data-testid="coding-description-panel"]') as HTMLElement;
    const solutionPanel = host.querySelector('[data-testid="coding-solution-panel"]') as HTMLElement;
    const pageText = descriptionPanel.textContent || '';

    expect(host.querySelector('[data-testid="question-title"]')?.textContent || '').toContain(
      'Build a Responsive Navbar with CSS Flexbox'
    );
    expect(pageText).toContain('Practice a realistic frontend interview prompt');
    expect(pageText).toContain('Acceptance criteria');
    expect(pageText).toContain('Common mistakes');
    expect(pageText).toContain('FAQ');
    expect(pageText).toContain('flex-wrap');
    expect(pageText).toContain('margin-left: auto');
    expect(pageText).toContain('Focus styles are not removed');
    expect(pageText).toContain('No JavaScript is required');

    component.activePanel.set(1);
    fixture.detectChanges();

    const solutionText = solutionPanel.textContent || '';
    expect(solutionPanel.hidden).toBeFalse();
    expect(solutionText).toContain('Approach A');
    expect(solutionText).toContain('Wrapping Navbar');
    expect(solutionText).toContain('Approach B');
    expect(solutionText).toContain('Stacked Mobile Navbar');
    expect(solutionText).toContain('margin-left: auto');
    expect(solutionText).toContain('flex-wrap');
    expect(solutionText).toContain(':focus-visible');
    expect(solutionText).toContain('@media (max-width: 480px)');
  });

  it('publishes self-canonical SEO and FAQ schema for the Flexbox navbar challenge', () => {
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;
    component.tech = 'css';
    component.kind = 'coding';

    (component as any).updateSeoForQuestion(makeCssFlexboxNavbarQuestion());

    expect(seo.updateTags).toHaveBeenCalled();
    const payload = seo.updateTags.calls.mostRecent().args[0] as any;
    const graph = Array.isArray(payload?.jsonLd) ? payload.jsonLd : [];
    const types = graph.map((entry: any) => entry?.['@type']);
    const breadcrumb = graph.find((entry: any) => entry?.['@type'] === 'BreadcrumbList');
    const article = graph.find((entry: any) => entry?.['@type'] === 'TechArticle');
    const howTo = graph.find((entry: any) => entry?.['@type'] === 'HowTo');
    const faqPage = graph.find((entry: any) => entry?.['@type'] === 'FAQPage');

    expect(payload.title).toBe('Build Responsive Navbar with CSS Flexbox | Interview Challenge');
    expect(payload.title).toContain('Responsive Navbar');
    expect(payload.title).toContain('Flexbox');
    expect(payload.description).toBe(
      'Practice a CSS Flexbox navbar challenge: align brand, links, and CTA, handle wrapping, add mobile layout behavior, and explain common interview trade-offs.'
    );
    expect(payload.canonical).toBe('https://frontendatlas.com/css/coding/css-flexbox-navbar');
    expect(types).toContain('BreadcrumbList');
    expect(types).toContain('TechArticle');
    expect(types).toContain('HowTo');
    expect(types).toContain('FAQPage');
    expect(article?.headline).toBe('Build a Responsive Navbar with CSS Flexbox');
    expect(howTo?.name).toBe('Build a Responsive Navbar with CSS Flexbox');
    expect(faqPage?.['@id']).toBe('https://frontendatlas.com/css/coding/css-flexbox-navbar#faq');
    expect(faqPage?.url).toBe('https://frontendatlas.com/css/coding/css-flexbox-navbar');
    expect(faqPage?.mainEntity?.length).toBe(4);
    expect(breadcrumb?.itemListElement?.map((item: any) => item.name)).toEqual([
      'Home',
      'CSS interview questions',
      'CSS Coding Challenges',
      'Build Responsive Navbar with CSS Flexbox',
    ]);
  });

  it('renders the CSS Grid card gallery interview sections and solution variants', async () => {
    const question = makeCssGridCardGalleryQuestion();
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;
    component.questionId = question.id;
    component.questionTech = 'css';
    component.disablePersistence = true;
    component.hideFooterBar = true;

    questionService.loadQuestions.and.returnValue(of([question] as any));
    spyOn(component as any, 'resolveSolutionAsset').and.resolveTo({ files: {}, initialPath: '' });

    fixture.detectChanges();
    await fixture.whenStable();
    component.isPhoneViewport.set(false);
    component.liteEditors.set(true);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const descriptionPanel = host.querySelector('[data-testid="coding-description-panel"]') as HTMLElement;
    const solutionPanel = host.querySelector('[data-testid="coding-solution-panel"]') as HTMLElement;
    const pageText = descriptionPanel.textContent || '';

    expect(host.querySelector('[data-testid="question-title"]')?.textContent || '').toContain(
      'Build a Responsive CSS Grid Card Gallery'
    );
    expect(pageText).toContain('Practice a realistic frontend interview prompt');
    expect(pageText).toContain('What you\'ll practice');
    expect(pageText).toContain('repeat()');
    expect(pageText).toContain('minmax()');
    expect(pageText).toContain('gap');
    expect(pageText).toContain('Acceptance criteria');
    expect(pageText).toContain('Common mistakes');
    expect(pageText).toContain('FAQ');
    expect(pageText).toContain('auto-fit');
    expect(pageText).toContain('Desktop layout switches to 4 columns');
    expect(pageText).toContain('Solution explains why Grid is better than Flexbox');

    component.activePanel.set(1);
    fixture.detectChanges();

    const solutionText = solutionPanel.textContent || '';
    expect(solutionPanel.hidden).toBeFalse();
    expect(solutionText).toContain('Variant A');
    expect(solutionText).toContain('Required 2-to-4 Column Solution');
    expect(solutionText).toContain('repeat(2, minmax(0, 1fr))');
    expect(solutionText).toContain('repeat(4, minmax(0, 1fr))');
    expect(solutionText).toContain('Variant B');
    expect(solutionText).toContain('Production Fluid auto-fit/minmax() Solution');
    expect(solutionText).toContain('repeat(auto-fit, minmax(220px, 1fr))');
    expect(solutionText).toContain('intentionally fluid');
    expect(solutionText).toContain('one-column narrow preview is expected');
    expect(solutionText).toContain('two 220px tracks plus gap');
    expect(solutionText).toContain('min-width: 0');

    const approaches = component.approaches();
    expect(approaches.length).toBe(2);
    approaches.forEach((approach) => {
      expect(approach.codeHtml || '').toContain('class="gallery"');
      expect(approach.codeHtml || '').toContain('Extra card');
      expect(approach.codeCss || '').toContain('display: grid');
      expect(approach.codeCss || '').toContain('background: #222');
      expect(approach.codeCss || '').toContain('color: #fff');
      expect(approach.codeCss || '').toContain('border-radius: 8px');
      expect(approach.codeCss || '').toContain('padding: 1rem');
      expect(approach.codeCss || '').toContain('overflow-wrap: anywhere');
    });

    const webPanel = { applySolution: jasmine.createSpy('applySolution') };
    (component as any).webPanel = webPanel;

    component.loadApproach(approaches[0], 0);
    component.loadApproach(approaches[1], 1);

    const firstPayload = webPanel.applySolution.calls.argsFor(0)[0] as { html?: string; css?: string };
    const secondPayload = webPanel.applySolution.calls.argsFor(1)[0] as { html?: string; css?: string };
    expect(firstPayload.html).toContain('class="gallery"');
    expect(firstPayload.css).toContain('repeat(2, minmax(0, 1fr))');
    expect(secondPayload.html).toContain('class="gallery"');
    expect(secondPayload.css).toContain('repeat(auto-fit, minmax(220px, 1fr))');
  });

  it('publishes route-specific SEO and FAQ schema for the CSS Grid card gallery challenge', () => {
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;
    component.tech = 'css';
    component.kind = 'coding';

    (component as any).updateSeoForQuestion(makeCssGridCardGalleryQuestion());

    expect(seo.updateTags).toHaveBeenCalled();
    const payload = seo.updateTags.calls.mostRecent().args[0] as any;
    const graph = Array.isArray(payload?.jsonLd) ? payload.jsonLd : [];
    const types = graph.map((entry: any) => entry?.['@type']);
    const breadcrumb = graph.find((entry: any) => entry?.['@type'] === 'BreadcrumbList');
    const article = graph.find((entry: any) => entry?.['@type'] === 'TechArticle');
    const howTo = graph.find((entry: any) => entry?.['@type'] === 'HowTo');
    const faqPage = graph.find((entry: any) => entry?.['@type'] === 'FAQPage');

    expect(payload.title).toBe('CSS Grid Card Gallery Challenge | Responsive minmax() Layout');
    expect(payload.title).toContain('CSS Grid');
    expect(payload.title).toContain('Card Gallery');
    expect(payload.description).toBe(
      'Practice a responsive CSS Grid card gallery: use repeat(), minmax(), gap, breakpoints, and overflow checks to build a 2-to-4 column interview layout.'
    );
    expect(payload.canonical).toBe('https://frontendatlas.com/css/coding/css-grid-card-gallery');
    expect(types).toContain('BreadcrumbList');
    expect(types).toContain('TechArticle');
    expect(types).toContain('HowTo');
    expect(types).toContain('FAQPage');
    expect(article?.headline).toBe('Build a Responsive CSS Grid Card Gallery');
    expect(article?.isAccessibleForFree).toBeTrue();
    expect(howTo?.name).toBe('Build a Responsive CSS Grid Card Gallery');
    expect(faqPage?.['@id']).toBe('https://frontendatlas.com/css/coding/css-grid-card-gallery#faq');
    expect(faqPage?.url).toBe('https://frontendatlas.com/css/coding/css-grid-card-gallery');
    expect(faqPage?.mainEntity?.length).toBe(4);
    expect(breadcrumb?.itemListElement?.map((item: any) => item.name)).toEqual([
      'Home',
      'CSS interview questions',
      'CSS Coding Challenges',
      'Build Responsive CSS Grid Card Gallery',
    ]);
  });

  it('renders the CSS theme variables prompt, breadcrumb links, and tokenized shadow starter CSS', async () => {
    const question = makeCssThemeVariablesQuestion();
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;
    component.questionId = question.id;
    component.questionTech = 'css';
    component.disablePersistence = true;
    component.hideFooterBar = true;

    questionService.loadQuestions.and.returnValue(of([question] as any));
    spyOn(component as any, 'resolveSolutionAsset').and.resolveTo({ files: {}, initialPath: '' });

    fixture.detectChanges();
    await fixture.whenStable();
    component.isPhoneViewport.set(false);
    component.liteEditors.set(true);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const pageText = host.textContent || '';
    const breadcrumb = host.querySelector('[data-testid="coding-breadcrumb"]') as HTMLElement;
    const starterHtmlText = question.web?.starterHtml || '';
    const starterCssText = question.web?.starterCss || '';

    expect(host.querySelector('[data-testid="question-title"]')?.textContent || '').toContain('Theming with CSS Variables');
    expect(pageText).toContain('CSS custom properties');
    expect(pageText).toContain('prefers-color-scheme');
    expect(pageText).toContain(':root:where(.theme-dark)');
    expect(pageText).toContain('equal specificity');
    expect(pageText).toContain('Acceptance criteria');
    expect(pageText).toContain('Common mistakes');
    expect(pageText).toContain('Interview explanation');
    expect(pageText).toContain('Testing checklist');

    expect(breadcrumb?.textContent || '').toContain('Home');
    expect(breadcrumb?.textContent || '').toContain('CSS interview questions');
    expect(breadcrumb?.textContent || '').toContain('CSS Coding Challenges');
    expect(breadcrumb?.textContent || '').toContain('Theming with CSS Variables');
    expect(breadcrumb.querySelector('a[href="/"]')).toBeTruthy();
    expect(breadcrumb.querySelector('a[href="/css/interview-questions"]')).toBeTruthy();
    expect(breadcrumb.querySelector('a[href="/coding?tech=css&kind=coding"]')).toBeTruthy();

    expect(starterHtmlText).toContain('<html lang="en">');
    expect(starterHtmlText).toContain('Tokenized button');
    expect(starterCssText).toContain('--panel-shadow');
    expect(starterCssText).toContain('box-shadow: var(--panel-shadow)');
    expect(starterCssText).not.toContain('box-shadow: 0 1px 2px rgba');
  });
});

function makeDeferredPromiseQuestion() {
  return {
    id: 'js-create-deferred-promise',
    title: 'Create a Deferred Promise (For Async Tests)',
    type: 'coding',
    technology: 'javascript',
    importance: 4,
    difficulty: 'intermediate',
    tags: ['testing', 'promise', 'async'],
    description: {
      summary: 'Implement createDeferred() in JavaScript. Your function should return { promise, resolve, reject } so async tests can control exactly when a Promise fulfills or rejects. The challenge includes starter code, tests for resolve/reject behavior, promise adoption, pending state, first-settlement-wins edge cases, and interview follow-ups.',
      specs: {
        practice: [
          'Creating createDeferred() with { promise, resolve, reject } controls',
          'Making async tests deterministic without real timers',
          'Handling resolve(value), reject(error), Promise adoption, pending state, and first-settlement-wins behavior',
        ],
        expectedBehaviorIntro: 'Your createDeferred() implementation should:',
        expectedBehavior: [
          'Return { promise, resolve, reject }',
          'Fulfill the promise when resolve(value) is called',
          'Reject the promise with the exact reason when reject(error) is called',
          'Adopt another Promise when resolve(Promise.resolve(value)) is used',
          'Remain pending until resolve or reject is called',
          'Use normal Promise semantics so only the first settlement wins and callbacks run in a later microtask',
        ],
      },
      arguments: [],
      returns: {
        type: '{ promise: Promise, resolve: Function, reject: Function }',
        desc: 'The createDeferred() controls object: a Promise plus resolve(value) and reject(error) functions for settling it later.',
      },
      examples: [
        "// Example: timeline\n// At t=0\nconst d = createDeferred();\nconst result = d.promise.then((value) => `loaded:${value}`);\n\n// At t=50\n// d.promise is still pending because neither resolve nor reject has been called.\n\n// At t=100\nd.resolve('user');\n\n// After the next microtask\nawait result; // 'loaded:user'",
        "// Promise adoption\nconst adopted = createDeferred();\nadopted.resolve(Promise.resolve('ok'));\nawait adopted.promise; // 'ok'",
      ],
    },
    starterCode: "export default function createDeferred() {\n  throw new Error('Not implemented');\n}\n",
    starterCodeTs: "export default function createDeferred<T = unknown>() {\n  throw new Error('Not implemented');\n}\n",
    tests: '',
    testsTs: '',
    solutionBlock: {
      overview: "Interview answer: the base prompt is to create one Promise and capture its resolve and reject functions from the Promise constructor. Return those controls with the promise so tests can decide when async work finishes. TypeScript typing, timeout safeguards, cancellation, and production-safety concerns are follow-ups, not part of the minimal createDeferred() contract.\n\nMental model: createDeferred() returns { promise, resolve, reject }. Calling resolve(value) fulfills the promise, calling reject(error) rejects it, and resolving with another Promise adopts that Promise's eventual state. Normal Promise semantics also keep callbacks asynchronous and make the first settlement win.",
      approaches: [],
      followUp: [
        'How would you type { promise, resolve, reject } in TypeScript?',
        'When is createDeferred() useful in async tests?',
        'How would you add timeout safeguards without changing the minimal createDeferred() contract?',
        'Why can deferred promise controls be risky in production code?',
      ],
      relatedLinks: [
        { title: 'Implement debounce() in JavaScript', route: ['/', 'javascript', 'coding', 'js-debounce'], label: 'Coding' },
        { title: 'Implement takeLatest in JavaScript', route: ['/', 'javascript', 'coding', 'js-take-latest'], label: 'Coding' },
        { title: 'Fix stale UI from async race conditions', route: ['/', 'javascript', 'trivia', 'js-async-race-conditions'], label: 'JavaScript' },
        { title: 'React debounced search coding challenge', route: ['/', 'react', 'coding', 'react-debounced-search'], label: 'React' },
        { title: 'JavaScript coding interview questions', route: ['/', 'guides', 'interview-blueprint', 'javascript-interviews'], label: 'Guide' },
      ],
    },
    access: 'free',
    updatedAt: '2026-07-06',
    seo: {
      title: 'Implement createDeferred() in JavaScript: Promise Challenge + Tests',
      description: 'createDeferred(): {promise,resolve,reject}. Starter code/tests: resolve/reject, Promise adoption, pending, first-settlement-wins, TS/interview follow-ups.',
      h1: 'Implement createDeferred() in JavaScript',
    },
    decisionGraphAsset: 'assets/questions/javascript/decision-graphs/js-create-deferred-promise.v1.json',
  };
}

function makeCssThemeVariablesQuestion() {
  return {
    id: 'css-theme-variables-dark-mode',
    title: 'Theming with CSS Variables: OS Dark Mode + Manual Override',
    type: 'coding',
    technology: 'css',
    importance: 5,
    difficulty: 'intermediate',
    tags: ['css', 'variables', 'custom-properties', 'dark-mode', 'theming', 'cascade'],
    description: {
      summary: 'Create a themeable panel using CSS custom properties. Define light defaults on :root, redefine the same tokens for OS dark mode via @media (prefers-color-scheme: dark), then add a manual :root:where(.theme-dark) override after the media query. Both root selectors have equal specificity, so later source order wins.',
      specs: {
        practice: [
          'CSS custom properties as live theme tokens',
          'prefers-color-scheme for OS-level dark mode',
          'Manual root-level theme overrides with :root:where(.theme-dark)',
        ],
        requirements: [
          'Define light theme tokens on :root: --bg, --text, --surface, --accent, --border, --accent-contrast, and --panel-shadow.',
          'Define dark values for the same tokens inside @media (prefers-color-scheme: dark).',
          'Define :root:where(.theme-dark) after the media query and repeat the dark token values there.',
        ],
        acceptanceCriteria: [
          'No hard-coded component colors or colored shadows remain inside .panel or .btn.',
          'Dark OS preference switches the page, panel, border, accent, contrast, and panel shadow through variables.',
        ],
        expectedBehaviorIntro: 'Your CSS theme should:',
        expectedBehavior: [
          'Render a light theme by default from :root tokens.',
          'Let :root:where(.theme-dark) win because it has equal specificity and is declared later.',
        ],
        implementationNotes: [
          'Keep the same variable names across :root, @media (prefers-color-scheme: dark), and :root:where(.theme-dark).',
        ],
        commonMistakes: [
          'Placing :root:where(.theme-dark) before the media query so the later equal-specificity OS rule wins.',
        ],
        interviewExplanation: 'CSS custom properties let a design system swap values at runtime without rewriting every component. prefers-color-scheme respects the user OS preference, while a root class gives product UI a manual override.',
        testingChecklist: [
          'Test with a light OS preference and confirm :root values are used.',
          'Add the theme-dark class manually and confirm :root:where(.theme-dark) wins over the OS preference.',
        ],
      },
    },
    web: {
      starterHtml: '<!doctype html><html lang="en"><head><title>Theme Demo</title></head><body><div class="panel"><h2>Theme Demo</h2><button class="btn" type="button">Tokenized button</button></div></body></html>',
      starterCss: 'html, body { height: 100%; }\nbody { background: var(--bg); color: var(--text); }\n.panel { background: var(--surface); color: var(--text); border: 1px solid var(--border); box-shadow: var(--panel-shadow); }\n.btn { background: var(--accent); color: var(--accent-contrast); border: 0; }',
    },
    solutionBlock: {
      overview: 'A high-signal CSS theming setup is tokens on :root, an OS dark override, then an equal-specificity :root:where(.theme-dark) rule declared later.',
      approaches: [],
    },
    access: 'free',
    updatedAt: '2026-07-14',
    seo: {
      title: 'CSS Variables Dark Mode Challenge | FrontendAtlas',
      description: 'Practice CSS custom properties with prefers-color-scheme and an equal-specificity :root:where(.theme-dark) override whose later source order wins.',
      h1IntentLabel: 'Theming with CSS Variables',
    },
  };
}

function makeCssFlexboxNavbarQuestion() {
  return {
    id: 'css-flexbox-navbar',
    title: 'Flexbox: Responsive Navbar',
    type: 'coding',
    technology: 'css',
    importance: 5,
    difficulty: 'intermediate',
    tags: ['css', 'flexbox', 'responsive', 'navbar', 'layout'],
    description: {
      summary: 'Practice a realistic frontend interview prompt: build a responsive navigation bar with Flexbox, preserve readable links, keep the CTA reachable, and explain how the layout behaves when space gets tight.',
      specs: {
        practice: [
          'Creating a flex container for navigation layout',
          'Aligning brand, links, and CTA without extra wrappers',
          'Using gap instead of margin hacks',
          'Using `margin-left: auto` or flexible link groups intentionally',
          'Handling small screens with wrapping or a mobile breakpoint',
          'Keeping links readable and accessible',
          'Avoiding overlap, overflow, and hidden navigation',
        ],
        requirements: [
          'Use the existing nav.nav, div.logo, ul.links, and a.cta markup.',
          'Set .nav to display:flex, align-items:center, and gap.',
          'Set .links to display:flex, gap, and optionally flex:1 with justify-content:center.',
          'Use margin-left: auto only if .links is not taking the center role.',
          'At max-width: 480px, stack or wrap cleanly without hiding links.',
          'No JavaScript or hamburger menu is required for this basic layout.',
        ],
        acceptanceCriteria: [
          '.nav uses display: flex',
          'Items are vertically centered with align-items: center',
          'Brand stays on the left',
          'Links are displayed as a horizontal list on wider screens',
          'CTA stays visually separated and reachable',
          'Spacing uses gap, not fragile manual margins only',
          'Layout does not overflow with normal link labels',
          'At max-width: 480px, layout stacks or wraps cleanly',
          'Links remain visible and clickable',
          'Focus styles are not removed',
          'No JavaScript is required for this basic layout',
        ],
        implementationNotes: [
          'Use flex-wrap when the row may need more than one line.',
          'For centered links, let .links take flex: 1 and use justify-content: center.',
          'For a CTA-push layout, keep .links content-sized and apply margin-left: auto to .cta.',
          'Keep default focus behavior or add an explicit :focus-visible outline.',
        ],
        commonMistakes: [
          'Using justify-content: space-between without considering link group behavior',
          'Forgetting flex-wrap or a breakpoint',
          'Removing focus outlines from links',
        ],
        interviewExplanation: 'Flexbox is a good fit for a navbar because the layout is mostly one-dimensional: brand, navigation links, and actions sit along a row and need alignment, spacing, and wrapping.',
        testingChecklist: [
          'Resize to 480px and narrower and confirm links and CTA remain visible.',
          'Compare the centered-link approach with the margin-left: auto CTA-push approach.',
          'Tab through links and CTA to confirm focus remains visible.',
        ],
        faq: [
          {
            question: 'Is Flexbox or Grid better for a navbar?',
            answer: 'Flexbox is usually better because a navbar is mostly one-dimensional: items align along a row or column.',
          },
          {
            question: 'How do you make a Flexbox navbar responsive?',
            answer: 'Start with a row layout, allow wrapping or switch to a stacked layout at a small breakpoint, keep links visible, and test long labels.',
          },
          {
            question: 'Should a responsive navbar hide links on mobile?',
            answer: 'Not without an accessible alternate path. This CSS-only challenge keeps links visible by wrapping or stacking them.',
          },
          {
            question: 'What do interviewers look for in a CSS navbar prompt?',
            answer: 'They usually look for clean layout reasoning, correct Flexbox usage, responsive behavior, readable spacing, and accessibility awareness.',
          },
        ],
      },
    },
    web: {
      starterHtml: '<nav class="nav"><div class="logo">FrontendAtlas</div><ul class="links"><li><a href="#">Docs</a></li><li><a href="#">Pricing</a></li><li><a href="#">Blog</a></li></ul><a class="cta" href="#">Start</a></nav>',
      starterCss: 'body { font-family: system-ui; }\n.nav { background: #222; color: #fff; }\n.links { list-style: none; padding: 0; margin: 0; }\n.links a:focus-visible, .cta:focus-visible { outline: 3px solid #93c5fd; outline-offset: 3px; }',
    },
    solutionBlock: {
      overview: 'A strong solution explains the layout tradeoff instead of only dropping Flexbox declarations.',
      approaches: [
        {
          title: 'Approach A — Wrapping Navbar',
          prose: 'Let the navbar wrap, keep links visible, and use margin-left: auto only when the CTA owns the push-to-end behavior.',
          codeCss: '.nav {\n  display: flex;\n  align-items: center;\n  flex-wrap: wrap;\n  gap: 1rem;\n}\n.links {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 1rem;\n}\n.cta { margin-left: auto; }\n.links a:focus-visible,\n.cta:focus-visible { outline: 3px solid #93c5fd; }\n@media (max-width: 480px) {\n  .links { justify-content: center; width: 100%; }\n  .cta { margin-left: 0; text-align: center; }\n}',
        },
        {
          title: 'Approach B — Stacked Mobile Navbar',
          prose: 'Use a desktop row, center the flexible link group, and stack the navbar at the small breakpoint.',
          codeCss: '.nav {\n  display: flex;\n  align-items: center;\n  gap: 1rem;\n}\n.links {\n  display: flex;\n  flex: 1;\n  justify-content: center;\n  gap: 1rem;\n}\n.links a:focus-visible,\n.cta:focus-visible { outline: 3px solid #93c5fd; }\n@media (max-width: 480px) {\n  .nav {\n    flex-direction: column;\n    align-items: stretch;\n  }\n\n  .links {\n    flex-wrap: wrap;\n    justify-content: center;\n  }\n\n  .cta {\n    text-align: center;\n  }\n}',
        },
      ],
    },
    access: 'free',
    updatedAt: '2026-07-09',
    seo: {
      title: 'Build Responsive Navbar with CSS Flexbox | Interview Challenge',
      description: 'Practice a CSS Flexbox navbar challenge: align brand, links, and CTA, handle wrapping, add mobile layout behavior, and explain common interview trade-offs.',
      h1: 'Build a Responsive Navbar with CSS Flexbox',
      h1IntentLabel: 'Build Responsive Navbar with CSS Flexbox',
    },
  };
}

function makeCssGridCardGalleryQuestion() {
  const galleryHtml = '<section class="gallery"><article class="card"><h2>Analytics dashboard</h2><p>Overview card.</p></article><article class="card"><h2>Checkout recovery campaign with a longer title</h2><p>Long copy should wrap.</p></article><article class="card"><h2>Team activity</h2><p>Recent updates.</p></article><article class="card"><h2>Release checklist</h2><p>Tasks before launch.</p></article><article class="card"><h2>Empty state plan</h2><p>Fallback messaging.</p></article><article class="card"><h2>Customer feedback</h2><p>Signals from support.</p></article><article class="card"><h2>Extra card</h2><p>This should flow naturally.</p></article></section>';

  return {
    id: 'css-grid-card-gallery',
    title: 'Grid: Card Gallery (2-to-4 Columns)',
    type: 'coding',
    technology: 'css',
    importance: 5,
    difficulty: 'intermediate',
    tags: ['css', 'layout', 'grid', 'responsive', 'gallery'],
    description: {
      summary: 'Practice a realistic frontend interview prompt: create a responsive card gallery with CSS Grid, keep cards readable across widths, and explain how track sizing, gaps, and auto-placement work.',
      specs: {
        practice: [
          'CSS Grid container setup',
          '`grid-template-columns`',
          '`repeat()`',
          '`minmax()`',
          '`gap`',
          'responsive breakpoints',
          'auto-placement',
          'card minimum width',
          'avoiding horizontal overflow',
          'testing long content and extra cards',
        ],
        requirements: [
          'Required challenge solution: default layout must use `repeat(2, minmax(0, 1fr))`.',
          'Required challenge solution: at `min-width: 1024px`, switch to `repeat(4, minmax(0, 1fr))`.',
          'Use `gap` for spacing instead of card margins.',
          'Do not manually position individual cards; let Grid auto-placement flow extra cards.',
        ],
        acceptanceCriteria: [
          '`.gallery` uses `display: grid`.',
          'Cards are direct grid children.',
          'Spacing uses `gap`.',
          'Default layout shows 2 equal columns.',
          'Desktop layout switches to 4 columns at the required breakpoint.',
          'Cards do not overlap or overflow.',
          'Extra cards flow naturally without manual positioning.',
          'Long text does not break the layout.',
          'Solution explains why Grid is better than Flexbox for this two-dimensional layout.',
        ],
        implementationNotes: [
          'Use `minmax(0, 1fr)` for the exact required tracks so content minimums do not widen the columns.',
          'Use the optional `auto-fit/minmax()` approach only as a production variant; the challenge tests expect exact 2-to-4 columns.',
          'Do not treat the production variant as an exact two-column mobile layout; it is intentionally fluid and can collapse to one column when two `220px` tracks plus `gap` do not fit.',
        ],
        commonMistakes: [
          'Using four hard-coded columns on all screens.',
          'Forgetting `gap`.',
          'Using fixed card widths that create horizontal scroll.',
          'Using `repeat(4, 1fr)` without a mobile fallback.',
          'Expecting the production `auto-fit` variant to keep the same exact column count as the required interview solution.',
        ],
        interviewExplanation: 'CSS Grid is a good fit for a card gallery because rows and columns both matter. I would define the gallery as a grid container, use gap for spacing, and choose either fixed breakpoint columns or auto-fit/minmax depending on the requirements.',
        testingChecklist: [
          'Resize below 1024px and confirm the required solution stays at two equal columns.',
          'Resize to 1024px or wider and confirm the required solution switches to four columns.',
          'Load the production variant in a narrow preview and confirm a one-column fallback is acceptable when two `220px` tracks plus `gap` cannot fit.',
        ],
        faq: [
          {
            question: 'Is CSS Grid or Flexbox better for card galleries?',
            answer: 'CSS Grid is usually better because card galleries are two-dimensional layouts.',
          },
          {
            question: 'What does minmax() do in a card grid?',
            answer: 'minmax() defines the smallest and largest size a grid track can take.',
          },
          {
            question: 'Should I use fixed breakpoints or auto-fit with minmax()?',
            answer: 'Use fixed breakpoints when the design requires exact column counts.',
          },
          {
            question: 'What do interviewers look for in a CSS Grid card layout?',
            answer: 'They look for correct Grid usage, clean spacing, responsive behavior, overflow awareness, and explanation.',
          },
        ],
      },
    },
    web: {
      starterHtml: galleryHtml,
      starterCss: '.gallery { /* Your grid styles here */ }\n.card { background: #222; color: #fff; padding: 1rem; }',
    },
    solutionBlock: {
      overview: 'A strong interview solution separates the required test contract from the production trade-off. Variant B is intentionally fluid and may render one, two, three, or more columns depending on available space.',
      approaches: [
        {
          title: 'Variant A — Required 2-to-4 Column Solution',
          prose: 'Use fixed breakpoint columns aligned with the interview prompt and automated checks.',
          codeHtml: galleryHtml,
          codeCss: 'body {\n  font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;\n  margin: 2rem;\n  background: #fafafa;\n  color: #111827;\n  line-height: 1.6;\n}\n\n.gallery {\n  display: grid;\n  gap: 1rem;\n  grid-template-columns: repeat(2, minmax(0, 1fr));\n}\n\n@media (min-width: 1024px) {\n  .gallery {\n    grid-template-columns: repeat(4, minmax(0, 1fr));\n  }\n}\n\n.card {\n  min-width: 0;\n  background: #222;\n  color: #fff;\n  border-radius: 8px;\n  padding: 1rem;\n}\n\n.card h2 {\n  margin: 0 0 0.5rem;\n  font-size: 1rem;\n  overflow-wrap: anywhere;\n}\n\n.card p {\n  margin: 0;\n  opacity: 0.85;\n}',
        },
        {
          title: 'Variant B — Production Fluid auto-fit/minmax() Solution',
          prose: 'This variant is intentionally fluid: it may render one, two, three, or more columns depending on the preview or container width. Grid only creates a second column when two 220px tracks plus gap fit, so a one-column narrow preview is expected. Use this when production flexibility matters more than exact column counts.',
          codeHtml: galleryHtml,
          codeCss: 'body {\n  font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;\n  margin: 2rem;\n  background: #fafafa;\n  color: #111827;\n  line-height: 1.6;\n}\n\n.gallery {\n  display: grid;\n  gap: 1rem;\n  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));\n}\n\n.card {\n  min-width: 0;\n  background: #222;\n  color: #fff;\n  border-radius: 8px;\n  padding: 1rem;\n}\n\n.card h2 {\n  margin: 0 0 0.5rem;\n  font-size: 1rem;\n  overflow-wrap: anywhere;\n}\n\n.card p {\n  margin: 0;\n  opacity: 0.85;\n}',
        },
      ],
    },
    access: 'free',
    updatedAt: '2026-07-09',
    seo: {
      title: 'CSS Grid Card Gallery Challenge | Responsive minmax() Layout',
      description: 'Practice a responsive CSS Grid card gallery: use repeat(), minmax(), gap, breakpoints, and overflow checks to build a 2-to-4 column interview layout.',
      h1: 'Build a Responsive CSS Grid Card Gallery',
      h1IntentLabel: 'Build Responsive CSS Grid Card Gallery',
    },
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}
