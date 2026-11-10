import { seoContentDateModified } from '../../../core/utils/seo-content-date.util';
import { SEO_CONTENT_DATES } from '../../../generated/seo-content-dates';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { PLATFORM_ID, signal } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { Router } from '@angular/router';
import { Question } from '../../../core/models/question.model';
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
import { ReviewModeService } from '../../../core/services/review-mode.service';
import type { ReviewModeScenario } from '../../../core/models/review-mode.model';
import { reviewDraftKey } from '../review-mode/review-mode-panel.component';
import { RehearsalService } from '../../../core/services/rehearsal.service';
import type { RehearsalDefinition } from '../../../core/models/rehearsal.model';
import { By } from '@angular/platform-browser';
import { UserProgressService } from '../../../core/services/user-progress.service';
import { MonacoEditorComponent } from '../../../monaco-editor.component';
import { CodingDetailComponent } from './coding-detail.component';
import { CodingJsPanelComponent } from './coding-js-panel/coding-js-panel.component';
import { listQuestionFailureHints } from '../../../core/utils/failure-explain-rules';
import { PUBLIC_QUESTION_NAVIGATION } from '../../../generated/public-question-navigation';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { stripInlineMarkup } from '../../../shared/ui/inline-code/inline-code.component';

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
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['user', 'isLoggedIn', 'ensureMe', 'headers', 'authUiState']);
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
    (auth.authUiState as any).and.callFake(() => (authUser() ? 'authenticated' : 'signed_out'));
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
    imports: [CodingDetailComponent,
        RouterTestingModule,
        ],
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
                initWebAsync: (_key: string, starters: {
                    html: string;
                    css: string;
                }) => Promise.resolve({ html: starters.html, css: starters.css, restored: false }),
                saveWebAsync: () => Promise.resolve(),
                resetWebBothAsync: () => Promise.resolve(),
            },
        },
        { provide: UserProgressService, useValue: progress },
        { provide: AuthService, useValue: auth },
        { provide: BugReportService, useValue: bugReport },
        { provide: PressureModeService, useValue: pressureModes },
        { provide: PressureModeProgressService, useValue: pressureProgress },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
    ]
})
      // Keep the parent in browser mode without loading Monaco's shared AMD globals.
      .overrideComponent(MonacoEditorComponent, {
        add: { providers: [{ provide: PLATFORM_ID, useValue: 'server' }] },
      })
      .compileComponents();

  });

  afterEach(() => {
    document.body.style.overflow = '';
  });

  it('creates a prep analytics ID from browser entropy and reuses it for the session', () => {
    const component = TestBed.createComponent(CodingDetailComponent).componentInstance as any;
    const random = spyOn(crypto, 'getRandomValues').and.callFake((bytes: any) => {
      bytes.fill(15);
      return bytes;
    });

    const id = component.resolvePrepAnalyticsSessionId();

    expect(id).toBe(`prep_${'0f'.repeat(16)}`);
    expect(sessionStorage.getItem('fa:prep:session-id:v1')).toBe(id);
    expect(component.resolvePrepAnalyticsSessionId()).toBe(id);
    expect(random).toHaveBeenCalledTimes(1);
  });

  it('keeps prep analytics safe during SSR without accessing browser storage or entropy', () => {
    const component = TestBed.createComponent(CodingDetailComponent).componentInstance as any;
    component.isBrowser = false;
    const storage = spyOn(sessionStorage, 'getItem').and.throwError('browser storage unavailable');
    const random = spyOn(crypto, 'getRandomValues').and.throwError('browser crypto unavailable');

    expect(component.resolvePrepAnalyticsSessionId()).toBe('ssr');
    expect(storage).not.toHaveBeenCalled();
    expect(random).not.toHaveBeenCalled();
  });

  it('uses the non-identifying analytics fallback when browser entropy is unavailable', () => {
    const component = TestBed.createComponent(CodingDetailComponent).componentInstance as any;
    spyOn(crypto, 'getRandomValues').and.throwError('entropy unavailable');

    expect(component.resolvePrepAnalyticsSessionId()).toBe('browser');
    expect(sessionStorage.getItem('fa:prep:session-id:v1')).toBeNull();
  });

  it('uses the non-identifying analytics fallback when session storage is blocked', () => {
    const component = TestBed.createComponent(CodingDetailComponent).componentInstance as any;
    spyOn(sessionStorage, 'getItem').and.throwError('storage denied');
    const random = spyOn(crypto, 'getRandomValues');

    expect(component.resolvePrepAnalyticsSessionId()).toBe('browser');
    expect(random).not.toHaveBeenCalled();
  });

  for (const kind of ['coding', 'debug'] as const) {
    it(`matches ${kind} footer hrefs to practice navigation and retains return state`, () => {
      const component = TestBed.createComponent(CodingDetailComponent).componentInstance;
      const target = PUBLIC_QUESTION_NAVIGATION.find((item) => item.kind === kind)!;
      const targetItem = { tech: target.tech, kind, id: target.route.split('/').pop()! };
      const items = [{ ...targetItem, id: 'current-question' }, targetItem];
      (component as any).practice = { items, index: 0 };
      (component as any).returnTo = ['/coding'];
      (component as any).returnToUrl = '/coding?tech=javascript';
      component.returnLabel.set('Practice');
      const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
      expect(component.prevHref()).toBeNull();
      expect(component.nextHref()).toBe(target.route);
      component.next();
      expect(navigate).toHaveBeenCalledOnceWith(['/', target.tech, kind, targetItem.id], {
        state: { session: { items, index: 1 }, returnTo: ['/coding'], returnToUrl: '/coding?tech=javascript', returnLabel: 'Practice' },
      });
      expect(component.nextHref()).toBeNull();
      expect(component.prevHref()).toBeNull(); // Unlisted targets retain button navigation.
    });
  }

  it('leads back to the company plan only from a task opened there', () => {
    const component = TestBed.createComponent(CodingDetailComponent).componentInstance;
    const state = window.history.state;
    window.history.replaceState({ returnToUrl: '/companies/preview?companies=elevenlabs&level=staff', returnLabel: 'Back to plan' }, '');
    (component as any).hydrateReturnInfo();
    expect(component.planReturn()).toEqual({
      label: 'Back to plan',
      route: ['/companies/preview'],
      queryParams: { companies: 'elevenlabs', level: 'staff' },
    });
    expect(component.lockedReturn()).toEqual(component.planReturn());
    // A company guide is a way back for the locked view only; the footer keeps its usual link.
    window.history.replaceState({ returnToUrl: '/companies/jpmorgan/preview', returnLabel: 'Back to the JPMorgan guide' }, '');
    (component as any).hydrateReturnInfo();
    expect(component.planReturn()).toBeNull();
    expect(component.lockedReturn()).toEqual({ label: 'Back to the JPMorgan guide', route: ['/companies/jpmorgan/preview'], queryParams: {} });
    window.history.replaceState({ returnToUrl: '/coding?tech=javascript', returnLabel: 'Back to questions' }, '');
    (component as any).hydrateReturnInfo();
    expect(component.planReturn()).toBeNull();
    expect(component.lockedReturn()).toBeNull();
    window.history.replaceState(state, '');
  });

  it('tells a phone visitor what a locked task opens as and leads back to the guide it was opened from', async () => {
    const width = spyOnProperty(window, 'innerWidth', 'get').and.returnValue(390);
    const state = window.history.state;
    window.history.replaceState({ returnToUrl: '/companies/jpmorgan/preview', returnLabel: 'Back to the JPMorgan guide' }, '');
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;
    const question = { ...makeDeferredPromiseQuestion(), access: 'premium' };
    component.questionId = question.id;
    component.questionTech = 'javascript';
    questionService.loadQuestions.and.returnValue(of([question] as any));
    spyOn(component as any, 'resolveSolutionAsset').and.resolveTo({ files: {}, initialPath: '' });
    // The routed page reads the navigation state itself; a directly loaded question is hydrated here.
    (component as any).hydrateReturnInfo();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(component.locked()).toBeTrue();
    expect(host.querySelector('[data-testid="coding-locked-phone-note"]')?.textContent?.trim())
      .toBe('On a phone this task opens as a question with its solution; the workspace is on a desktop or tablet.');
    const back = host.querySelector('[data-testid="coding-locked-return"]') as HTMLAnchorElement;
    expect(back.textContent?.trim()).toBe('Back to the JPMorgan guide');
    expect(back.getAttribute('href')).toBe('/companies/jpmorgan/preview');

    // On a desktop the note goes; the way back stays.
    width.and.returnValue(1366);
    window.dispatchEvent(new Event('resize'));
    fixture.detectChanges();
    expect(host.querySelector('[data-testid="coding-locked-phone-note"]')).toBeNull();
    expect(host.querySelector('[data-testid="coding-locked-return"]')).not.toBeNull();
    window.history.replaceState(state, '');
  });

  it('uses list neighbors for direct entry and suppresses links for course, pressure and unavailable targets', () => {
    const component = TestBed.createComponent(CodingDetailComponent).componentInstance;
    const target = PUBLIC_QUESTION_NAVIGATION.find((item) => item.kind === 'coding')!;
    component.tech = target.tech as any;
    component.kind = 'coding';
    component.currentIndex = 0;
    component.allQuestions = [{ id: 'current' }, { id: target.route.split('/').pop()! }] as Question[];
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    expect(component.nextHref()).toBe(target.route);
    component.next();
    expect(navigate).toHaveBeenCalledOnceWith(['/', target.tech, 'coding', component.allQuestions[1].id]);
    component.isCourseContext.set(true);
    expect(component.nextHref()).toBeNull();
    component.isCourseContext.set(false);
    component.pressureRequested.set(true);
    component.pressureScenario.set(pressureScenario);
    expect(component.nextHref()).toBeNull();
    component.pressureRequested.set(false);
    component.allQuestions = [{ id: 'current' }, { id: 'unlisted-premium' }] as Question[];
    expect(component.hasNext()).toBeTrue();
    expect(component.nextHref()).toBeNull();
    component.allQuestions = [];
    expect(component.prevHref()).toBeNull();
    expect(component.nextHref()).toBeNull();
  });

  it('labels unverified HTML/CSS and framework questions as manual completion', () => {
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;

    component.tech = 'html';
    component.question.set({ id: 'html-card', technology: 'html' } as any);
    expect(component.submitLabel()).toBe('Mark as complete');

    component.tech = 'react';
    component.question.set({ id: 'react-manual', technology: 'react', frameworkTests: [] } as any);
    expect(component.submitLabel()).toBe('Mark as complete');

    component.question.set({
      id: 'react-checked',
      technology: 'react',
      frameworkTests: [{
        id: 'render',
        name: 'Render',
        steps: [{ type: 'expectExists', selector: '.app' }],
      }],
    } as any);
    expect(component.submitLabel()).toBe('Run checks');

    auth.isLoggedIn.and.returnValue(true);
    component.solved.set(true);
    component.question.set({ id: 'react-manual', technology: 'react', frameworkTests: [] } as any);
    expect(component.submitLabel()).toBe('Mark as incomplete');

    component.question.set({
      id: 'react-checked',
      technology: 'react',
      frameworkTests: [{
        id: 'render',
        name: 'Render',
        steps: [{ type: 'expectExists', selector: '.app' }],
      }],
    } as any);
    expect(component.submitLabel()).toBe('Run checks again');
    expect(component.footerSecondaryLabel()).toBe('Mark as incomplete');

    auth.isLoggedIn.and.returnValue(false);
    expect(component.footerSecondaryLabel()).toBeNull();
  });

  it('marks a solved framework question incomplete from the secondary footer action', async () => {
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;

    auth.isLoggedIn.and.returnValue(true);
    auth.user.and.returnValue({ _id: 'user-1' } as any);
    activity.uncomplete.and.returnValue(of({} as any));
    component.tech = 'react';
    component.kind = 'coding';
    component.question.set({
      id: 'react-counter',
      access: 'free',
      difficulty: 'easy',
      frameworkTests: [{ id: 'counter', name: 'Counter', steps: [{ type: 'expectExists', selector: '.value' }] }],
    } as any);
    component.solved.set(true);

    await component.markIncompleteFromFooter();

    expect(activity.uncomplete).toHaveBeenCalledWith({ kind: 'coding', tech: 'react', itemId: 'react-counter' });
    expect(activity.complete).not.toHaveBeenCalled();
    expect(component.solved()).toBeFalse();
    expect(component.submitLabel()).toBe('Run checks');
    expect(component.footerSecondaryLabel()).toBeNull();
  });

  it('uses mobile reading below 768px and compact workspace layout through 980px', () => {
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;
    const viewportWidth = spyOnProperty(window, 'innerWidth', 'get');

    viewportWidth.and.returnValue(767);
    (component as any).syncViewportState();
    expect(component.isPhoneViewport()).toBeTrue();
    expect(component.isCompactWorkspace()).toBeTrue();
    expect(component.showMobileDesktopGuard()).toBeTrue();

    viewportWidth.and.returnValue(768);
    (component as any).syncViewportState();
    expect(component.isPhoneViewport()).toBeFalse();
    expect(component.isCompactWorkspace()).toBeTrue();
    expect(component.showMobileDesktopGuard()).toBeFalse();

    viewportWidth.and.returnValue(980);
    (component as any).syncViewportState();
    expect(component.isCompactWorkspace()).toBeTrue();
    component.horizontalRatio.set(0.8);
    expect(component.asideFlex()).toBe('0 0 45%');

    viewportWidth.and.returnValue(981);
    (component as any).syncViewportState();
    expect(component.isPhoneViewport()).toBeFalse();
    expect(component.isCompactWorkspace()).toBeFalse();
    expect(component.asideFlex()).toBe('0 0 80%');
  });

  it('keeps mobile prompt and permitted solution readable without mounting any editors or losing the desktop collapse preference', async () => {
    spyOnProperty(window, 'innerWidth', 'get').and.returnValue(390);
    const initializeEditor = spyOn(CodingJsPanelComponent.prototype, 'initFromQuestion').and.callThrough();
    const base = makeDeferredPromiseQuestion();
    const question = {
      ...base,
      solutionBlock: {
        ...base.solutionBlock,
        approaches: [{
          title: 'Capture the promise controls',
          codeJs: 'function createDeferred() { let resolve, reject; const promise = new Promise((ok, fail) => { resolve = ok; reject = fail; }); return { promise, resolve, reject }; }',
        }],
      },
    };
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;
    component.questionId = question.id;
    component.questionTech = 'javascript';
    questionService.loadQuestions.and.returnValue(of([question] as any));
    spyOn(component as any, 'resolveSolutionAsset').and.resolveTo({ files: {}, initialPath: '' });
    expect(component.browserViewReady()).toBeFalse();
    expect(component.workspaceAvailable()).toBeFalse();

    fixture.detectChanges();
    await fixture.whenStable();
    component.descCollapsed.set(true);
    component.litePreloadActive.set(true);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const description = host.querySelector('[data-testid="coding-description-panel"]') as HTMLElement;
    const solution = host.querySelector('[data-testid="coding-solution-panel"]') as HTMLElement;
    expect(description.hidden).toBeFalse();
    expect(description.textContent).toContain('Adopt another Promise when resolve(Promise.resolve(value)) is used');
    expect(description.querySelector('pre > code')?.textContent).toContain("await adopted.promise; // 'ok'");
    expect(solution.hidden).toBeTrue();
    expect(solution.textContent).toContain('Mental model:');
    expect(solution.querySelector('pre > code')?.textContent).toContain('function createDeferred');
    expect(solution.querySelector('app-monaco-editor')).toBeNull();
    expect(host.querySelector('[data-testid="coding-mobile-notice"]')).not.toBeNull();
    expect(host.querySelector('[data-testid="coding-workspace-panel"]')).toBeNull();
    expect(host.querySelector('[data-testid="coding-description-splitter"]')).toBeNull();
    expect(host.querySelector('[data-testid="footer-submit"]')).toBeNull();
    expect(host.querySelector('[data-testid="footer-next"]')).not.toBeNull();
    expect(host.querySelector('button[aria-label="Hide description"]')).toBeNull();

    component.toggleDescription();
    component.onSolutionTabClick();
    fixture.detectChanges();

    expect(solution.hidden).toBeFalse();
    expect(solution.querySelector('pre > code')?.textContent).toContain('function createDeferred');
    expect(host.querySelector('app-monaco-editor')).toBeNull();
    expect(initializeEditor).not.toHaveBeenCalled();
    expect(host.querySelector('[data-testid="solution-load-approach-0"]')).toBeNull();
    expect(component.descCollapsed()).toBeTrue();
    expect(component.descriptionCollapsed()).toBeFalse();
    component.isPhoneViewport.set(false);
    expect(component.descriptionCollapsed()).toBeTrue();
  });

  it('prerenders authored common mistakes inside the closed solution panel only for questions that have failure hints', async () => {
    spyOnProperty(window, 'innerWidth', 'get').and.returnValue(390);
    const render = async (question: ReturnType<typeof makeDeferredPromiseQuestion>) => {
      const fixture = TestBed.createComponent(CodingDetailComponent);
      const component = fixture.componentInstance;
      component.questionId = question.id;
      component.questionTech = 'javascript';
      questionService.loadQuestions.and.returnValue(of([question] as any));
      spyOn(component as any, 'resolveSolutionAsset').and.resolveTo({ files: {}, initialPath: '' });
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      return fixture.nativeElement as HTMLElement;
    };

    const question = makeDeferredPromiseQuestion();
    const expected = listQuestionFailureHints(question.id);
    expect(expected.length).toBeGreaterThan(0);
    const host = await render(question);
    const solution = host.querySelector('[data-testid="coding-solution-panel"]') as HTMLElement;
    const mistakes = solution.querySelector('[data-testid="coding-common-mistakes"]') as HTMLElement;
    expect(solution.hidden).toBeTrue();
    expect(mistakes).not.toBeNull();
    expect(Array.from(mistakes.querySelectorAll('[data-testid="coding-common-mistake-title"]')).map((node) => node.textContent?.trim()))
      .toEqual(expected.map((hint) => hint.title));
    expect(mistakes.textContent).toContain(expected[0].why);
    expect(mistakes.textContent).toContain(stripInlineMarkup(expected[0].actions[0]));
    expect(mistakes.textContent).withContext('hint text renders its inline code').not.toContain('`');
    expect(mistakes.textContent).not.toContain('Multiple tests are failing');
    expect(host.querySelector('[data-testid="coding-description-panel"]')?.textContent).not.toContain(expected[0].title);

    const plain = await render({ ...question, id: 'js-question-without-authored-hints' });
    expect(plain.querySelector('[data-testid="coding-solution-panel"]')).not.toBeNull();
    expect(plain.querySelector('[data-testid="coding-common-mistakes"]')).toBeNull();
  });

  it('shows the first paragraph of the solution overview inside the description panel for accessible questions only', async () => {
    spyOnProperty(window, 'innerWidth', 'get').and.returnValue(390);
    const render = async (question: any) => {
      const fixture = TestBed.createComponent(CodingDetailComponent);
      const component = fixture.componentInstance;
      component.questionId = question.id;
      component.questionTech = 'javascript';
      questionService.loadQuestions.and.returnValue(of([question] as any));
      spyOn(component as any, 'resolveSolutionAsset').and.resolveTo({ files: {}, initialPath: '' });
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      return { host: fixture.nativeElement as HTMLElement, component };
    };

    const question = {
      ...makeDeferredPromiseQuestion(),
      solutionBlock: {
        overview: 'Keep one pending promise per key and resolve it from the outside.\n\nThe second paragraph stays in the solution tab.',
        approaches: [],
      },
    };
    const { host, component } = await render(question);
    const description = host.querySelector('[data-testid="coding-description-panel"]') as HTMLElement;
    const idea = host.querySelector('[data-testid="coding-solution-idea"]') as HTMLDetailsElement;
    expect(idea).not.toBeNull();
    expect(description.contains(idea)).toBeTrue();
    expect(idea.open).toBeTrue();
    expect(idea.textContent).toContain('Keep one pending promise per key and resolve it from the outside.');
    expect(idea.textContent).not.toContain('second paragraph');
    expect(host.querySelector('[data-testid="coding-solution-panel"]')?.textContent).toContain('second paragraph');

    component.pressureRequested.set(true);
    expect(component.solutionIdea()).toBe('');

    const locked = await render({ ...question, access: 'premium' });
    expect(locked.host.querySelector('[data-testid="coding-solution-idea"]')).toBeNull();
    expect(locked.component.solutionIdea()).toBe('');
  });

  it('shows a legacy solution string as the fixed code, not as an overview or a solution idea', async () => {
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;
    const fixed = 'export default function chunk(items, size) {\n  return items;\n}\n';
    const question = { id: 'js-debug-legacy', title: 'Fix chunk', access: 'free', solution: fixed } as any;
    component.questionId = question.id;
    component.questionTech = 'javascript';
    questionService.loadQuestions.and.returnValue(of([question]));
    fixture.detectChanges();
    await fixture.whenStable();
    component.question.set(question);

    expect(component.structuredSolution()).toEqual({ approaches: [{ title: 'The fixed code', codeJs: fixed }] });
    expect(component.solutionIdea()).toBe('');
    expect(component.solutionCodeForCurrentLang()).toBe(fixed);
  });

  it('renders both HTML and CSS solution blocks as mobile read-only code', async () => {
    spyOnProperty(window, 'innerWidth', 'get').and.returnValue(360);
    const base = makeCssFlexboxNavbarQuestion();
    const question = {
      ...base,
      solutionBlock: {
        ...base.solutionBlock,
        approaches: base.solutionBlock.approaches.map((approach) => ({
          ...approach,
          codeHtml: base.web.starterHtml,
        })),
      },
    };
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;
    component.questionId = question.id;
    component.questionTech = 'css';
    questionService.loadQuestions.and.returnValue(of([question] as any));
    spyOn(component as any, 'resolveSolutionAsset').and.resolveTo({ files: {}, initialPath: '' });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const closedSolution = fixture.nativeElement.querySelector('[data-testid="coding-solution-panel"]') as HTMLElement;
    expect(closedSolution.hidden).toBeTrue();
    expect(closedSolution.querySelector('[data-solution-language="html"] code')?.textContent).toContain('<nav');
    expect(closedSolution.querySelector('[data-solution-language="css"] code')?.textContent).toContain('flex-wrap');
    expect(closedSolution.querySelector('app-monaco-editor')).toBeNull();
    component.onSolutionTabClick();
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const codeBlocks = Array.from(host.querySelectorAll('[data-testid="coding-solution-panel"] pre > code'));
    expect(codeBlocks.some((block) => block.textContent?.includes('<nav'))).toBeTrue();
    expect(codeBlocks.some((block) => block.textContent?.includes('flex-wrap'))).toBeTrue();
    expect(host.querySelector('app-coding-web-panel, app-monaco-editor')).toBeNull();
    expect(host.textContent).not.toContain('Load into editor');
    expect(host.textContent).not.toContain('Preview solution');
  });

  it('restores body scrolling and dismisses previews when entering mobile reading, then restores desktop state', () => {
    const viewportWidth = spyOnProperty(window, 'innerWidth', 'get').and.returnValue(1366);
    document.body.style.overflow = 'auto';
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;
    (component as any).syncViewportState();
    expect(document.body.style.overflow).toBe('hidden');
    component.previewVisible = true;
    component.previewOnlyLoading.set(true);
    (component as any).lastPreviewHtml = '<p>Preview</p>';
    component.descCollapsed.set(true);
    component.isDraggingAside.set(true);

    viewportWidth.and.returnValue(390);
    (component as any).syncViewportState();
    component.openPreview();
    expect(document.body.style.overflow).toBe('auto');
    expect(component.previewVisible).toBeFalse();
    expect(component.previewOnlyLoading()).toBeFalse();
    expect(component.isDraggingAside()).toBeFalse();
    expect(component.descriptionCollapsed()).toBeFalse();

    viewportWidth.and.returnValue(834);
    (component as any).syncViewportState();
    expect(document.body.style.overflow).toBe('hidden');
    expect(component.descriptionCollapsed()).toBeTrue();
    fixture.destroy();
    expect(document.body.style.overflow).toBe('auto');
  });

  it('discards framework results from a workspace removed by a rapid desktop-phone-desktop resize', async () => {
    const viewportWidth = spyOnProperty(window, 'innerWidth', 'get').and.returnValue(1366);
    const component = TestBed.createComponent(CodingDetailComponent).componentInstance;
    component.tech = 'react';
    component.question.set({ id: 'react-counter', frameworkTests: [{ id: 'counter' }] } as any);
    let finishChecks!: (value: any[]) => void;
    const run = new Promise<any[]>((resolve) => { finishChecks = resolve; });
    component.frameworkPanel = { runFrameworkChecks: () => run } as any;
    const complete = spyOn(component as any, 'completeFrameworkCheckRun').and.resolveTo();
    (component as any).syncViewportState();
    const submission = component.submitCode();

    viewportWidth.and.returnValue(390);
    (component as any).syncViewportState();
    viewportWidth.and.returnValue(1366);
    (component as any).syncViewportState();
    finishChecks([{ id: 'counter', passed: true }]);
    await submission;
    expect(complete).not.toHaveBeenCalled();
    expect(activity.complete).not.toHaveBeenCalled();
  });

  it('prevents mobile editing and pressure progression while keeping the debrief locked', async () => {
    const component = TestBed.createComponent(CodingDetailComponent).componentInstance;
    component.isPhoneViewport.set(true);
    component.tech = 'react';
    component.question.set({ id: 'react-counter' } as any);
    component.pressureRequested.set(true);
    component.pressureScenario.set(pressureScenario);
    component.pressureClearedRounds.set(1);
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    const panel = jasmine.createSpyObj('frameworkPanel', ['runFrameworkChecks', 'applySolutionFiles', 'openSolutionPreview']);
    component.frameworkPanel = panel;

    component.startPressureMode();
    component.revealNextPressureRound();
    component.openFrameworkSolutionPreview();
    component.loadSolutionIntoEditor();
    component.loadApproach({ title: 'Solution', codeJs: 'solution' } as any, 0);
    component.onSolutionTabClick();
    await component.submitCode();
    expect(navigate).not.toHaveBeenCalled();
    expect(pressureProgress.revealRound).not.toHaveBeenCalled();
    expect(component.pressureRoundIndex()).toBe(0);
    expect(component.activePanel()).toBe(0);
    expect(panel.runFrameworkChecks).not.toHaveBeenCalled();
    expect(panel.applySolutionFiles).not.toHaveBeenCalled();
    expect(panel.openSolutionPreview).not.toHaveBeenCalled();
    expect(activity.complete).not.toHaveBeenCalled();
  });

  it('retains the existing demo and lite workspace exemptions on phones', () => {
    for (const input of ['demoMode', 'liteMode'] as const) {
      const component = TestBed.createComponent(CodingDetailComponent).componentInstance;
      component[input] = true;
      component.isPhoneViewport.set(true);
      expect(component.showMobileDesktopGuard()).toBeFalse();
      expect(component.workspaceAvailable()).toBeTrue();
    }
  });

  it('resizes the description by the coding root height on compact screens and width on desktop', () => {
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;
    const layout = document.createElement('div');
    const setPointerCapture = jasmine.createSpy('setPointerCapture');
    spyOn(layout, 'getBoundingClientRect').and.returnValue({
      width: 500,
      height: 400,
      top: 0,
      right: 500,
      bottom: 400,
      left: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);
    component.codingLayout = { nativeElement: layout } as any;
    component.tech = 'react';
    component.horizontalRatio.set(0.3);
    component.isCompactWorkspace.set(true);

    component.startHorizontalDrag({
      preventDefault: jasmine.createSpy('preventDefault'),
      clientX: 100,
      clientY: 100,
      pointerId: 1,
      target: { setPointerCapture },
    } as any);
    expect(component.isDraggingAside()).toBeTrue();
    (component as any).onPointerMoveHorizontal({ clientX: 450, clientY: 140 });
    expect(component.horizontalRatio()).toBeCloseTo(0.4, 5);
    document.dispatchEvent(new Event('pointerup'));
    expect(component.isDraggingAside()).toBeFalse();

    component.horizontalRatio.set(0.3);
    component.isCompactWorkspace.set(false);
    component.startHorizontalDrag({
      preventDefault: jasmine.createSpy('preventDefaultDesktop'),
      clientX: 100,
      clientY: 100,
      pointerId: 2,
      target: { setPointerCapture },
    } as any);
    (component as any).onPointerMoveHorizontal({ clientX: 150, clientY: 350 });
    expect(component.horizontalRatio()).toBeCloseTo(0.4, 5);
    document.dispatchEvent(new Event('pointerup'));
    expect(component.isDraggingAside()).toBeFalse();
    expect(setPointerCapture).toHaveBeenCalledTimes(2);
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

  it('counts a click on the JS panel Run tests button as an attempt', async () => {
    spyOnProperty(window, 'innerWidth', 'get').and.returnValue(1440);
    const question = {
      id: 'two-sum',
      title: 'Two Sum',
      description: 'Solve it.',
      technology: 'javascript',
      access: 'free',
      difficulty: 'easy',
      tags: ['arrays'],
      importance: 3,
      starterCode: 'export default function solve() {}\n',
      tests: "test('ok', () => expect(1).toBe(1));\n",
    } as any;
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;
    questionService.loadQuestions.and.returnValue(of([question]));
    component.questionId = question.id;
    component.questionTech = 'javascript';
    component.disablePersistence = true;
    component.hideFooterBar = true;
    fixture.detectChanges();
    await fixture.whenStable();
    component.tech = 'javascript';
    component.kind = 'coding';
    component.question.set(question);
    component.loadState.set('loaded');
    component.isPhoneViewport.set(false);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const panel = fixture.debugElement.query(By.directive(CodingJsPanelComponent)).componentInstance as CodingJsPanelComponent;
    const panelRun = spyOn(panel, 'runTests').and.callFake(async () => component.onJsTestResults([{ name: 'ok', passed: true }]));
    const run = spyOn(component, 'runTests').and.callThrough();
    panel.testCode.set(question.tests);
    fixture.detectChanges();

    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('[data-testid="js-run-tests"]')!.click();
    expect(run).toHaveBeenCalledTimes(1);
    await run.calls.mostRecent().returnValue;

    expect(panelRun).toHaveBeenCalledTimes(1);
    expect(analytics.track).toHaveBeenCalledWith('challenge_attempt_started', jasmine.objectContaining({
      question_id: 'two-sum',
      workspace_type: 'js_tests',
      action_type: 'run_tests',
    }));
    expect(analytics.track).toHaveBeenCalledWith('challenge_attempt_result', jasmine.objectContaining({
      question_id: 'two-sum',
      action_type: 'run_tests',
      outcome: 'passed',
    }));
  });

  it('reports no result for a JS run that a newer run replaced', async () => {
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;
    component.tech = 'javascript';
    component.question.set({ id: 'q1', access: 'free' } as any);
    let finishFirst!: () => void;
    let calls = 0;
    component.jsPanel = {
      runTests: () => (++calls === 1
        ? new Promise<void>((resolve) => { finishFirst = resolve; })
        : Promise.resolve().then(() => component.onJsTestResults([{ name: 'ok', passed: true }]))),
    } as any;

    const first = component.runTests();
    const second = component.runTests();
    expect(await second).toBeTrue();
    finishFirst();
    expect(await first).toBeFalse();

    const results = analytics.track.calls.allArgs().filter(([name]) => name === 'challenge_attempt_result');
    expect(results.length).toBe(1);
    expect(results[0][1]).toEqual(jasmine.objectContaining({ outcome: 'passed', attempt_number: 2 }));
  });

  it('asks the onboarding question after a passing submit, not after each passing run', async () => {
    localStorage.removeItem('fa:onboarding:v1');
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;
    authUser.set({ _id: 'free-user', accessTier: 'free' });
    auth.isLoggedIn.and.returnValue(true);
    component.tech = 'javascript';
    component.kind = 'coding';
    component.question.set({ id: 'q1', access: 'free', difficulty: 'easy' } as any);
    component.jsPanel = {
      runTests: jasmine.createSpy('runTests').and.callFake(async () => component.onJsTestResults([{ name: 'ok', passed: true }])),
    } as any;

    await component.runTests();
    expect(component.onboardingPromptOpen).toBeFalse();

    await component.submitCode();
    expect(component.onboardingPromptOpen).toBeTrue();
    expect(analytics.track).toHaveBeenCalledWith('onboarding_prompt_shown', jasmine.objectContaining({
      trigger: 'first_pass',
      question_id: 'q1',
    }));
  });

  it("grades Submit with the task's own tests, so edited tests that pass on Run cannot mark it solved", async () => {
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;
    authUser.set({ _id: 'free-user', accessTier: 'free' });
    auth.isLoggedIn.and.returnValue(true);
    component.tech = 'javascript';
    component.kind = 'coding';
    component.question.set({ id: 'q1', access: 'free', difficulty: 'easy' } as any);
    // The visitor's edited tests pass this code; the task's own tests do not.
    const panelRun = jasmine.createSpy('runTests').and.callFake(async (options?: { suite?: string }) =>
      component.onJsTestResults([{ name: 'case', passed: options?.suite !== 'shipped' }]));
    component.jsPanel = { runTests: panelRun } as any;
    const record = spyOn(component as any, 'recordCompletion').and.resolveTo(true);

    expect(await component.runTests()).toBeTrue();
    expect(panelRun.calls.mostRecent().args[0]).toEqual({});

    await component.submitCode();
    expect(panelRun.calls.mostRecent().args[0]).toEqual({ suite: 'shipped' });
    expect(component.solved()).toBeFalse();
    expect(record).not.toHaveBeenCalled();
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

    expect(analytics.track).toHaveBeenCalledWith('challenge_attempt_started', jasmine.objectContaining({
      question_id: 'react-autocomplete-search-starter',
      workspace_type: 'framework_checks',
      action_type: 'run_checks',
    }));
    expect(analytics.track).toHaveBeenCalledWith('challenge_attempt_result', jasmine.objectContaining({
      question_id: 'react-autocomplete-search-starter',
      workspace_type: 'framework_checks',
      action_type: 'run_checks',
      outcome: 'passed',
      pass_count: 1,
      total_count: 1,
    }));
    expect(analytics.track).not.toHaveBeenCalledWith('run_checks', jasmine.anything());
    expect(activity.complete).not.toHaveBeenCalled();
  });

  it('exposes interview hero metadata without a redundant Start coding action', async () => {
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;
    const question = {
      id: 'react-autocomplete-search-starter',
      title: 'React Autocomplete Search',
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
      sdk: {
        asset: 'assets/sb/react/question/react-autocomplete-search.v2.json',
        openFile: '/src/App.tsx',
        storageKey: 'v2:ui:react:react-autocomplete-search-starter',
      },
      frameworkTests: [],
    } as any;

    questionService.loadQuestions.and.returnValue(of([question]));
    component.questionId = question.id;
    component.questionTech = 'react';
    component.disablePersistence = true;
    component.hideFooterBar = true;
    spyOn(component as any, 'resolveSolutionAsset').and.resolveTo({ files: {}, initialPath: '' });

    fixture.detectChanges();
    await fixture.whenStable();
    component.isPhoneViewport.set(false);
    component.liteEditors.set(true);
    fixture.detectChanges();

    expect(component.interviewFocusSummary()).toContain('Frontend machine coding interview question');
    expect(component.questionTimeboxLabel()).toBe('35-45 min');
    expect(component.assessedSkillChips()).toEqual(['React state/effects', 'Debounce']);
    expect(fixture.nativeElement.querySelector('[data-testid="coding-interview-hero"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="coding-start-coding"]')).toBeNull();
  });

  it('keeps every JavaScript and TypeScript solution in the closed desktop panel without mounting solution editors', async () => {
    spyOnProperty(window, 'innerWidth', 'get').and.returnValue(1366);
    const base = makeDeferredPromiseQuestion();
    const approaches = [
      {
        title: 'Capture controls',
        codeJs: 'export function createDeferred() { let resolve; const promise = new Promise(ok => { resolve = ok; }); return { promise, resolve }; }',
        codeTs: 'export function createDeferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>(ok => { resolve = ok; }); return { promise, resolve }; }',
      },
      {
        title: 'Use native resolvers',
        codeJs: 'export const createDeferred = () => Promise.withResolvers();',
        codeTs: 'export const createDeferred = <T>() => Promise.withResolvers<T>();',
      },
    ];
    const question = { ...base, solutionBlock: { ...base.solutionBlock, approaches } };
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
    component.liteEditors.set(false);
    fixture.detectChanges();

    const solution = fixture.nativeElement.querySelector('[data-testid="coding-solution-panel"]') as HTMLElement;
    const codeText = (language: string) => Array.from(solution.querySelectorAll(`[data-solution-language="${language}"] code`))
      .map((code) => code.textContent);
    expect(component.activePanel()).toBe(0);
    expect(solution.hidden).toBeTrue();
    expect(codeText('js')).toEqual(approaches.map((approach) => approach.codeJs));
    expect(codeText('ts')).toEqual(approaches.map((approach) => approach.codeTs));
    expect(solution.querySelector('app-monaco-editor')).toBeNull();
    expect(analytics.track.calls.allArgs().filter(([name]) => name === 'view_solution')).toEqual([]);

    component.currentJsLang.set('ts');
    fixture.detectChanges();
    expect(Array.from(solution.querySelectorAll<HTMLElement>('[data-solution-language="js"]')).every((block) => block.hidden)).toBeTrue();
    expect(Array.from(solution.querySelectorAll<HTMLElement>('[data-solution-language="ts"]')).every((block) => !block.hidden)).toBeTrue();

    component.onSolutionTabClick();
    fixture.detectChanges();
    expect(solution.hidden).toBeFalse();
    expect(solution.querySelectorAll('app-monaco-editor').length).toBe(approaches.length);
    expect(codeText('js')).toEqual(approaches.map((approach) => approach.codeJs));
    expect(codeText('ts')).toEqual(approaches.map((approach) => approach.codeTs));
    expect(Array.from(solution.querySelectorAll<HTMLElement>('pre')).every((block) => block.hidden)).toBeTrue();

    component.activePanel.set(0);
    fixture.detectChanges();
    expect(solution.hidden).toBeTrue();
    expect(solution.querySelector('app-monaco-editor')).toBeNull();
    component.onSolutionTabClick();
    fixture.detectChanges();
    expect(analytics.track.calls.allArgs().filter(([name]) => name === 'view_solution').length).toBe(1);
  });

  it('keeps all framework solution files in the closed panel even when there are no inline approaches', async () => {
    spyOnProperty(window, 'innerWidth', 'get').and.returnValue(390);
    const files = {
      'src/App.tsx': 'export default function App() { return <output>Count: 0</output>; }',
      'src/styles.css': 'output { font-variant-numeric: tabular-nums; }',
    };
    const question = {
      id: 'react-free-solution-files', title: 'Counter files', technology: 'react', type: 'coding',
      access: 'free', difficulty: 'easy', tags: ['react'], description: 'Build a counter.',
      solutionBlock: { overview: 'Keep count state local.', approaches: [] },
    } as any;
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;
    component.questionId = question.id;
    component.questionTech = 'react';
    questionService.loadQuestions.and.returnValue(of([question]));
    spyOn(component as any, 'resolveSolutionAsset').and.resolveTo({ files, initialPath: 'src/App.tsx' });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const solution = fixture.nativeElement.querySelector('[data-testid="coding-solution-panel"]') as HTMLElement;
    expect(solution.hidden).toBeTrue();
    for (const [path, code] of Object.entries(files)) {
      expect(solution.querySelector(`[data-solution-file="${path}"] code`)?.textContent).toBe(code);
    }
    expect(solution.querySelectorAll('[data-solution-file]').length).toBe(2);
    expect(solution.querySelector('app-monaco-editor')).toBeNull();

    component.onSolutionTabClick();
    component.openSolutionFile('src/styles.css');
    fixture.detectChanges();
    expect(solution.hidden).toBeFalse();
    expect((solution.querySelector('[data-solution-file="src/App.tsx"]') as HTMLElement).hidden).toBeTrue();
    expect((solution.querySelector('[data-solution-file="src/styles.css"]') as HTMLElement).hidden).toBeFalse();
    expect(solution.querySelectorAll('[data-solution-file]').length).toBe(2);
    expect(solution.querySelector('app-monaco-editor')).toBeNull();
  });

  it('keeps course solution confirmation and cancellation read-only and tracks only the confirmed reveal', async () => {
    spyOnProperty(window, 'innerWidth', 'get').and.returnValue(390);
    const base = makeDeferredPromiseQuestion();
    const question = {
      ...base,
      solutionBlock: { ...base.solutionBlock, approaches: [{ title: 'Native resolvers', codeJs: 'export const createDeferred = () => Promise.withResolvers();' }] },
    };
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;
    component.questionId = question.id;
    component.questionTech = 'javascript';
    questionService.loadQuestions.and.returnValue(of([question] as any));
    spyOn(component as any, 'resolveSolutionAsset').and.resolveTo({ files: {}, initialPath: '' });
    fixture.detectChanges();
    await fixture.whenStable();
    component.isCourseContext.set(true);
    const skipKey = (component as any).SOLUTION_WARN_SKIP_KEY;
    const readStorage = localStorage.getItem.bind(localStorage);
    spyOn(localStorage, 'getItem').and.callFake((key: string) => key === skipKey ? null : readStorage(key));
    const loadSolution = spyOn(component, 'loadSolutionCode');
    const loadApproach = spyOn(component, 'loadApproach');
    const applySolution = jasmine.createSpy('applySolution');
    component.jsPanel = { applySolution } as any;
    component.editorContent.set('user draft stays intact');
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const solution = host.querySelector('[data-testid="coding-solution-panel"]') as HTMLElement;
    expect(solution.hidden).toBeTrue();
    expect(solution.querySelector('pre code')?.textContent).toContain('Promise.withResolvers');

    (host.querySelector('[data-testid="coding-solution-tab"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(host.querySelector('[data-testid="solution-warning"]')).not.toBeNull();
    expect(analytics.track.calls.allArgs().filter(([name]) => name === 'view_solution')).toEqual([]);
    (host.querySelector('[data-testid="solution-warning-cancel"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(component.activePanel()).toBe(0);
    expect(solution.hidden).toBeTrue();
    expect(analytics.track.calls.allArgs().filter(([name]) => name === 'view_solution')).toEqual([]);

    (host.querySelector('[data-testid="coding-solution-tab"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    (host.querySelector('[data-testid="solution-warning-view"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(host.querySelector('[data-testid="solution-warning"]')).toBeNull();
    expect(solution.hidden).toBeFalse();
    expect(solution.querySelector('pre code')?.textContent).toContain('Promise.withResolvers');
    component.confirmSolutionReveal();
    expect(analytics.track.calls.allArgs().filter(([name]) => name === 'view_solution').length).toBe(1);
    expect(component.editorContent()).toBe('user draft stays intact');
    expect(loadSolution).not.toHaveBeenCalled();
    expect(loadApproach).not.toHaveBeenCalled();
    expect(applySolution).not.toHaveBeenCalled();
  });

  it('does not expose normal solution code while a requested pressure scenario is still loading', async () => {
    spyOnProperty(window, 'innerWidth', 'get').and.returnValue(390);
    const question = {
      id: 'react-counter', title: 'Counter', technology: 'react', type: 'coding',
      access: 'free', difficulty: 'easy', tags: ['react'], description: 'Build a counter.',
      pressureModeAsset: 'assets/questions/pressure-modes/counter.v1.json',
      solutionBlock: { overview: 'Normal solution overview', approaches: [] },
    } as any;
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;
    component.questionId = question.id;
    component.questionTech = 'react';
    questionService.loadQuestions.and.returnValue(of([question]));
    spyOn(component as any, 'resolveSolutionAsset').and.resolveTo({
      files: { 'src/App.tsx': 'export const normalSolutionSentinel = 42;' }, initialPath: 'src/App.tsx',
    });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const solution = fixture.nativeElement.querySelector('[data-testid="coding-solution-panel"]') as HTMLElement;
    expect(solution.textContent).toContain('normalSolutionSentinel');

    component.pressureRequested.set(true);
    component.pressureLoading.set(true);
    component.pressureScenario.set(null);
    fixture.detectChanges();
    expect(component.pressureActive()).toBeFalse();
    expect(component.activeSolutionFilesMap()).toEqual({});
    expect(solution.textContent).not.toContain('normalSolutionSentinel');
    expect(solution.textContent).not.toContain('Normal solution overview');
    expect(solution.querySelector('pre code, app-monaco-editor')).toBeNull();
  });

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

  it('runs guest JS tests and does not show auth when the attempt fails', async () => {
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;
    const runTests = jasmine.createSpy('runTests').and.callFake(async () => {
      component.testResults.set([{ name: 'returns the sum', passed: false }]);
    });

    auth.isLoggedIn.and.returnValue(false);
    component.tech = 'javascript';
    component.kind = 'coding';
    component.question.set({
      id: 'two-sum',
      access: 'free',
      difficulty: 'easy',
    } as any);
    component.jsPanel = { runTests } as any;

    await component.submitCode();

    expect(runTests).toHaveBeenCalled();
    expect(component.loginPromptOpen).toBeFalse();
    expect(activity.complete).not.toHaveBeenCalled();
    expect(analytics.track).toHaveBeenCalledWith('challenge_attempt_result', jasmine.objectContaining({
      workspace_type: 'js_tests',
      action_type: 'run_tests',
      outcome: 'failed',
    }));
  });

  it('shows auth only after guest JS tests pass and does not save completion first', async () => {
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;
    const callOrder: string[] = [];
    const runTests = jasmine.createSpy('runTests').and.callFake(async () => {
      callOrder.push('tests');
      component.testResults.set([{ name: 'returns the sum', passed: true }]);
    });
    const originalEnsureAuthenticated = component.ensureAuthenticated.bind(component);
    const ensureAuthenticated = spyOn(component, 'ensureAuthenticated').and.callFake((context) => {
      callOrder.push('auth');
      return originalEnsureAuthenticated(context);
    });

    auth.isLoggedIn.and.returnValue(false);
    component.tech = 'javascript';
    component.kind = 'coding';
    component.question.set({
      id: 'two-sum',
      access: 'free',
      difficulty: 'easy',
    } as any);
    component.jsPanel = { runTests } as any;

    await component.submitCode();

    expect(runTests).toHaveBeenCalled();
    expect(ensureAuthenticated).toHaveBeenCalled();
    expect(callOrder).toEqual(['tests', 'auth']);
    expect(component.loginPromptOpen).toBeTrue();
    expect(component.solved()).toBeFalse();
    expect(activity.complete).not.toHaveBeenCalled();
    expect(analytics.track).toHaveBeenCalledWith('challenge_attempt_result', jasmine.objectContaining({
      outcome: 'passed',
      auth_state: 'guest',
    }));
  });

  it('labels and reports pressure access from the question, not the shared scenario', async () => {
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;
    const question = {
      id: 'react-counter',
      access: 'premium',
      pressureModeAsset: 'assets/questions/pressure-modes/counter.v1.json',
    } as any;

    component.tech = 'react';
    component.kind = 'coding';
    component.question.set(question);
    component.pressureRequested.set(true);

    await (component as any).activatePressureMode(question);

    expect(pressureScenario.access).toBe('free');
    expect(component.pressureAccessLabel()).toBe('Premium');
    expect(analytics.track).toHaveBeenCalledWith(
      'pressure_mode_started',
      jasmine.objectContaining({ access: 'premium' }),
    );

    component.question.set({ ...question, access: 'free' });
    expect(component.pressureAccessLabel()).toBe('Free');
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
    const threeRoundScenario = {
      ...pressureScenario,
      rounds: pressureScenario.rounds.slice(0, 3),
    };

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
    component.pressureScenario.set(threeRoundScenario);
    component.pressureRoundIndex.set(2);
    component.pressureClearedRounds.set(2);

    await component.onFrameworkCheckRun({
      questionId: 'vue-counter',
      passed: true,
      results: threeRoundScenario.rounds.map((round: { title: string }) => ({
        name: round.title,
        passed: true,
      })),
    });

    expect(activity.complete).not.toHaveBeenCalled();
    expect(component.pressureCompleted()).toBeTrue();
    expect(component.loginPromptOpen).toBeTrue();
    expect(component.loginPromptBody).toContain('save all 3 rounds');
    expect(pressureProgress.markPendingCompletion).toHaveBeenCalledWith(
      pressureScenario.id,
      'vue-counter',
      {
        activeRoundIndex: 2,
        clearedRounds: 3,
        completed: true,
      },
    );
  });

  it('keeps pressure entry, loading, and completion copy independent of the Counter family', async () => {
    const question = {
      id: 'react-debounced-search',
      title: 'React Debounced Search',
      access: 'premium',
      difficulty: 'intermediate',
      pressureModeAsset: 'assets/questions/pressure-modes/debounced-search.v1.json',
      sdk: {
        asset: 'assets/sb/react/question/react-debounced-search.v1.json',
        openFile: '/src/App.tsx',
        storageKey: 'v2:ui:react:react-debounced-search',
      },
      frameworkTests: [],
    } as any;
    const debouncedScenario = {
      ...pressureScenario,
      id: 'debounced-search-pressure-v1',
      family: 'debounced-search',
      title: 'Debounced Search Interview Pressure Mode',
      access: 'premium',
      supportedQuestions: { react: question.id },
    } as any;
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;

    authUser.set({ _id: 'premium-user', accessTier: 'premium' });
    auth.isLoggedIn.and.returnValue(true);
    questionService.loadQuestions.and.returnValue(of([question]));
    component.questionId = question.id;
    component.questionTech = 'react';
    component.disablePersistence = true;
    component.hideFooterBar = true;
    spyOn(component as any, 'resolveSolutionAsset').and.resolveTo({ files: {}, initialPath: '' });

    fixture.detectChanges();
    await fixture.whenStable();
    component.tech = 'react';
    component.kind = 'coding';
    component.question.set(question);
    component.loadState.set('loaded');
    component.isPhoneViewport.set(false);
    fixture.detectChanges();

    const entry = fixture.nativeElement.querySelector(
      '[data-testid="pressure-mode-entry"]'
    ) as HTMLElement;
    expect(entry.textContent).toContain('Continue the same challenge through cumulative rounds');
    expect(entry.textContent).not.toContain('Counter');
    expect(entry.textContent).not.toContain('four rounds');
    const startButton = fixture.nativeElement.querySelector(
      '[data-testid="pressure-mode-start"]'
    ) as HTMLButtonElement;
    expect(startButton.disabled).toBeFalse();
    expect(
      fixture.nativeElement.querySelector('[data-testid="pressure-mode-coming-soon"]')
    ).toBeNull();

    component.pressureRequested.set(true);
    component.pressureLoading.set(true);
    fixture.detectChanges();
    const loading = fixture.nativeElement.querySelector(
      '[data-testid="pressure-workspace-loading"]'
    ) as HTMLElement;
    expect(loading.textContent).toContain('without touching your normal draft');
    expect(loading.textContent).not.toContain('Counter');

    component.pressureLoading.set(false);
    component.pressureScenario.set(debouncedScenario);
    component.pressureCompleted.set(true);
    fixture.detectChanges();
    const completion = fixture.nativeElement.querySelector(
      '[data-testid="pressure-mode-complete"]'
    ) as HTMLElement;
    expect(completion.textContent).toContain('underlying coding challenge completion');
    expect(completion.textContent).not.toContain('Counter');
  });

  it('offers Pressure Mode for the supported premium Tic-Tac-Toe question', async () => {
    const question = {
      id: 'react-tictactoe',
      title: 'Tic-Tac-Toe',
      access: 'premium',
      difficulty: 'easy',
      pressureModeAsset: 'assets/questions/pressure-modes/tic-tac-toe.v1.json',
      sdk: {
        asset: 'assets/sb/react/question/react-tictactoe.v1.json',
        openFile: '/src/App.tsx',
        storageKey: 'v2:ui:react:react-tictactoe',
      },
      frameworkTests: [],
    } as any;
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;

    authUser.set({ _id: 'premium-user', accessTier: 'premium' });
    auth.isLoggedIn.and.returnValue(true);
    questionService.loadQuestions.and.returnValue(of([question]));
    component.questionId = question.id;
    component.questionTech = 'react';
    component.disablePersistence = true;
    component.hideFooterBar = true;
    spyOn(component as any, 'resolveSolutionAsset').and.resolveTo({ files: {}, initialPath: '' });

    fixture.detectChanges();
    await fixture.whenStable();
    component.tech = 'react';
    component.kind = 'coding';
    component.question.set(question);
    component.loadState.set('loaded');
    component.isPhoneViewport.set(false);
    fixture.detectChanges();

    const entry = fixture.nativeElement.querySelector(
      '[data-testid="pressure-mode-entry"]'
    ) as HTMLElement;
    expect(entry.textContent).toContain('Continue the same challenge through cumulative rounds');
    const startButton = fixture.nativeElement.querySelector(
      '[data-testid="pressure-mode-start"]'
    ) as HTMLButtonElement;
    expect(startButton.disabled).toBeFalse();
    expect(
      fixture.nativeElement.querySelector('[data-testid="pressure-mode-coming-soon"]')
    ).toBeNull();
  });

  it('offers Pressure Mode for the supported premium Chessboard question', async () => {
    const question = {
      id: 'react-chessboard-click-highlight',
      title: 'React Chessboard Click/Highlight',
      access: 'premium',
      difficulty: 'easy',
      pressureModeAsset: 'assets/questions/pressure-modes/chessboard-click-highlight.v1.json',
      sdk: {
        asset: 'assets/sb/react/question/react-chessboard-click-highlight.v1.json',
        openFile: '/src/App.tsx',
        storageKey: 'v1:ui:react:react-chessboard-click-highlight',
      },
      frameworkTests: [],
    } as any;
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;

    authUser.set({ _id: 'premium-user', accessTier: 'premium' });
    auth.isLoggedIn.and.returnValue(true);
    questionService.loadQuestions.and.returnValue(of([question]));
    component.questionId = question.id;
    component.questionTech = 'react';
    component.disablePersistence = true;
    component.hideFooterBar = true;
    spyOn(component as any, 'resolveSolutionAsset').and.resolveTo({ files: {}, initialPath: '' });

    fixture.detectChanges();
    await fixture.whenStable();
    component.tech = 'react';
    component.kind = 'coding';
    component.question.set(question);
    component.loadState.set('loaded');
    component.isPhoneViewport.set(false);
    fixture.detectChanges();

    const entry = fixture.nativeElement.querySelector(
      '[data-testid="pressure-mode-entry"]'
    ) as HTMLElement;
    expect(entry.textContent).toContain('Continue the same challenge through cumulative rounds');
    const startButton = fixture.nativeElement.querySelector(
      '[data-testid="pressure-mode-start"]'
    ) as HTMLButtonElement;
    expect(startButton.disabled).toBeFalse();
    expect(
      fixture.nativeElement.querySelector('[data-testid="pressure-mode-coming-soon"]')
    ).toBeNull();
  });

  it('offers Pressure Mode for the supported premium Dynamic Counter Buttons question', async () => {
    const question = {
      id: 'react-dynamic-counter-buttons',
      title: 'React Dynamic Counter Buttons (Grow-on-Click)',
      access: 'premium',
      difficulty: 'intermediate',
      pressureModeAsset: 'assets/questions/pressure-modes/dynamic-counter-buttons.v1.json',
      sdk: {
        asset: 'assets/sb/react/question/react-dynamic-counter-buttons.v1.json',
        openFile: '/src/App.tsx',
        storageKey: 'v1:ui:react:react-dynamic-counter-buttons',
      },
      frameworkTests: [],
    } as any;
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;

    authUser.set({ _id: 'premium-user', accessTier: 'premium' });
    auth.isLoggedIn.and.returnValue(true);
    questionService.loadQuestions.and.returnValue(of([question]));
    component.questionId = question.id;
    component.questionTech = 'react';
    component.disablePersistence = true;
    component.hideFooterBar = true;
    spyOn(component as any, 'resolveSolutionAsset').and.resolveTo({ files: {}, initialPath: '' });

    fixture.detectChanges();
    await fixture.whenStable();
    component.tech = 'react';
    component.kind = 'coding';
    component.question.set(question);
    component.loadState.set('loaded');
    component.isPhoneViewport.set(false);
    fixture.detectChanges();

    const entry = fixture.nativeElement.querySelector(
      '[data-testid="pressure-mode-entry"]'
    ) as HTMLElement;
    expect(entry.textContent).toContain('Continue the same challenge through cumulative rounds');
    const startButton = fixture.nativeElement.querySelector(
      '[data-testid="pressure-mode-start"]'
    ) as HTMLButtonElement;
    expect(startButton.disabled).toBeFalse();
    expect(
      fixture.nativeElement.querySelector('[data-testid="pressure-mode-coming-soon"]')
    ).toBeNull();
  });

  it('hides the Pressure Mode entry for unsupported framework questions', async () => {
    const question = {
      id: 'react-autocomplete-search-starter',
      title: 'React Autocomplete Search',
      access: 'free',
      difficulty: 'intermediate',
      sdk: {
        asset: 'assets/sb/react/question/react-autocomplete-search.v2.json',
        openFile: '/src/App.tsx',
        storageKey: 'v2:ui:react:react-autocomplete-search-starter',
      },
      frameworkTests: [],
    } as any;
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;

    questionService.loadQuestions.and.returnValue(of([question]));
    component.questionId = question.id;
    component.questionTech = 'react';
    component.disablePersistence = true;
    component.hideFooterBar = true;
    spyOn(component as any, 'resolveSolutionAsset').and.resolveTo({ files: {}, initialPath: '' });

    fixture.detectChanges();
    await fixture.whenStable();
    component.tech = 'react';
    component.kind = 'coding';
    component.question.set(question);
    component.loadState.set('loaded');
    component.isPhoneViewport.set(false);
    fixture.detectChanges();

    const entry = fixture.nativeElement.querySelector(
      '[data-testid="pressure-mode-entry"]'
    ) as HTMLElement;
    expect(entry).toBeNull();
    expect(
      fixture.nativeElement.querySelector('[data-testid="pressure-mode-start"]')
    ).toBeNull();

    const router = TestBed.inject(Router);
    const navigateSpy = spyOn(router, 'navigate');
    component.startPressureMode();
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('removes an unsupported pressure query before returning to the normal framework view', async () => {
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;
    const question = {
      id: 'react-unsupported-pressure-route',
      title: 'Unsupported React challenge',
      access: 'free',
      difficulty: 'intermediate',
      frameworkTests: [],
    } as any;
    const router = TestBed.inject(Router);
    const navigateSpy = spyOn(router, 'navigate').and.resolveTo(true);

    component.tech = 'react';
    component.kind = 'coding';
    component.question.set(question);
    component.pressureRequested.set(true);

    await (component as any).activatePressureMode(question);

    expect(component.pressureRequested()).toBeFalse();
    expect(component.pressureScenario()).toBeNull();
    expect(navigateSpy).toHaveBeenCalledWith([], jasmine.objectContaining({
      queryParams: { mode: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    }));
  });

  it('hides unavailable Pressure Mode entries for React, Angular, and Vue coding questions', async () => {
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;
    const question = {
      id: 'react-unsupported',
      title: 'Unsupported framework challenge',
      access: 'free',
      difficulty: 'intermediate',
      frameworkTests: [],
    } as any;

    questionService.loadQuestions.and.returnValue(of([question]));
    component.questionId = question.id;
    component.questionTech = 'react';
    component.disablePersistence = true;
    component.hideFooterBar = true;
    spyOn(component as any, 'resolveSolutionAsset').and.resolveTo({ files: {}, initialPath: '' });

    fixture.detectChanges();
    await fixture.whenStable();
    component.kind = 'coding';
    component.loadState.set('loaded');
    component.isPhoneViewport.set(false);

    for (const tech of ['react', 'angular', 'vue'] as const) {
      component.tech = tech;
      component.question.set({ ...question, id: `${tech}-unsupported`, technology: tech } as any);
      fixture.detectChanges();

      expect(
        fixture.nativeElement.querySelector('[data-testid="pressure-mode-entry"]')
      ).withContext(tech).toBeNull();
      expect(
        fixture.nativeElement.querySelector('[data-testid="pressure-mode-start"]')
      ).withContext(tech).toBeNull();
    }
  });

  it('hides Pressure Mode entry outside non-demo framework coding questions', async () => {
    const question = {
      id: 'react-supported',
      title: 'Supported framework challenge',
      access: 'free',
      difficulty: 'intermediate',
      pressureModeAsset: 'assets/questions/pressure-modes/counter.v1.json',
      frameworkTests: [],
    } as any;
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;

    questionService.loadQuestions.and.returnValue(of([question]));
    component.questionId = question.id;
    component.questionTech = 'react';
    component.disablePersistence = true;
    component.hideFooterBar = true;
    spyOn(component as any, 'resolveSolutionAsset').and.resolveTo({ files: {}, initialPath: '' });

    fixture.detectChanges();
    await fixture.whenStable();
    component.loadState.set('loaded');
    component.isPhoneViewport.set(false);

    const cases = [
      { tech: 'javascript', kind: 'coding', demoMode: false, label: 'JavaScript coding' },
      { tech: 'html', kind: 'coding', demoMode: false, label: 'HTML coding' },
      { tech: 'css', kind: 'coding', demoMode: false, label: 'CSS coding' },
      { tech: 'react', kind: 'debug', demoMode: false, label: 'framework debug' },
      { tech: 'react', kind: 'trivia', demoMode: false, label: 'framework trivia' },
      { tech: 'react', kind: 'coding', demoMode: true, label: 'framework demo' },
    ] as const;

    for (const testCase of cases) {
      component.tech = testCase.tech as any;
      component.kind = testCase.kind as any;
      component.demoMode = testCase.demoMode;
      component.question.set({ ...question, technology: testCase.tech } as any);
      fixture.detectChanges();

      expect(
        fixture.nativeElement.querySelector('[data-testid="pressure-mode-entry"]')
      ).withContext(testCase.label).toBeNull();
      expect(
        fixture.nativeElement.querySelector('[data-testid="pressure-mode-start"]')
      ).withContext(testCase.label).toBeNull();
      expect(
        fixture.nativeElement.querySelector('[data-testid="pressure-mode-coming-soon"]')
      ).withContext(testCase.label).toBeNull();
    }
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
    spyOnProperty(window, 'innerWidth', 'get').and.returnValue(1366);
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

  for (const browser of [false, true]) {
    it(`seeds resolver solution files synchronously ${browser ? 'during hydration without fetching again' : 'before the server-only return'}`, async () => {
      const fixture = TestBed.createComponent(CodingDetailComponent);
      const component = fixture.componentInstance;
      (component as any).isBrowser = browser;
      const question = {
        id: 'react-snapshot', title: 'Snapshot counter', technology: 'react', type: 'coding',
        access: 'free', difficulty: 'easy', tags: ['react'], description: 'Build a counter.',
        solutionAsset: 'assets/sb/react/solution/react-snapshot.json',
      } as any;
      const solutionSnapshot = {
        files: {
          'src/App.tsx': 'export default function App() { return <output>Snapshot counter</output>; }',
          'src/styles.css': 'output { display: block; }',
        },
        initialPath: 'src/App.tsx',
      };
      const resolveAsset = spyOn(component as any, 'resolveSolutionAsset').and.resolveTo({ files: {}, initialPath: '' });

      (component as any).applyResolved({
        tech: 'react', kind: 'coding', id: question.id, list: [question], question, solutionSnapshot,
      });

      expect(component.loadState()).toBe('loaded');
      expect(component.solutionFilesMap()).toEqual(solutionSnapshot.files);
      expect(component.solutionOpenPath()).toBe(solutionSnapshot.initialPath);
      await (component as any).loadAuthorizedSolutionAsset(question, (component as any).loadQuestionSeq);
      expect(resolveAsset).not.toHaveBeenCalled();
      expect(component.solutionFilesMap()).toEqual(solutionSnapshot.files);
    });
  }

  it('falls back to the browser asset loader when the resolver has no public solution snapshot', async () => {
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;
    const question = {
      id: 'react-snapshot-missing', title: 'Counter', technology: 'react', type: 'coding',
      access: 'free', difficulty: 'easy', tags: ['react'], description: 'Build a counter.',
      solutionAsset: 'assets/sb/react/solution/react-snapshot-missing.json',
    } as any;
    const asset = deferred<{ files: Record<string, string>; initialPath: string }>();
    const resolveAsset = spyOn(component as any, 'resolveSolutionAsset').and.returnValue(asset.promise);

    (component as any).applyResolved({ tech: 'react', kind: 'coding', id: question.id, list: [question], question });
    expect(component.solutionFilesMap()).toEqual({});
    expect(resolveAsset).toHaveBeenCalledOnceWith(question);
    asset.resolve({ files: { 'src/App.tsx': 'export const browserFallback = true;' }, initialPath: 'src/App.tsx' });
    await (component as any).loadAuthorizedSolutionAsset(question, (component as any).loadQuestionSeq);

    expect(component.solutionFilesMap()['src/App.tsx']).toBe('export const browserFallback = true;');
    expect(component.solutionOpenPath()).toBe('src/App.tsx');
    expect(resolveAsset).toHaveBeenCalledTimes(1);
  });

  it('does not seed normal framework files on a pressure route before the scenario resolves', () => {
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;
    (component as any).isBrowser = false;
    spyOn((component as any).route.snapshot.queryParamMap, 'get').and.callFake((key: string) => key === 'mode' ? 'pressure' : null);
    const question = {
      id: 'react-counter', title: 'Counter', technology: 'react', type: 'coding',
      access: 'free', difficulty: 'easy', tags: ['react'], description: 'Build a counter.',
      pressureModeAsset: 'assets/questions/pressure-modes/counter.v1.json',
    } as any;
    (component as any).applyResolved({
      tech: 'react', kind: 'coding', id: question.id, list: [question], question,
      solutionSnapshot: { files: { 'src/App.tsx': 'export const normalSolutionSentinel = true;' }, initialPath: 'src/App.tsx' },
    });

    expect(component.pressureRequested()).toBeTrue();
    expect(component.pressureActive()).toBeFalse();
    expect(component.solutionFilesMap()).toEqual({});
    expect(component.activeSolutionFilesMap()).toEqual({});
    expect(component.solutionOpenPath()).toBe('');
    expect(pressureModes.load).not.toHaveBeenCalled();
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

    await (component as any).loadQuestion(question.id, {
      files: { 'src/App.tsx': 'export const protectedSnapshot = true;' }, initialPath: 'src/App.tsx',
    });

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

  it('loads a mobile Premium solution only after entitlement arrives and clears it on revocation', async () => {
    spyOnProperty(window, 'innerWidth', 'get').and.returnValue(390);
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

    // A phone also reads the rehearsal list, to name the rehearsals a problem belongs to; only the solution counts here.
    const solutionReads = () => httpGetSpy.calls.allArgs().filter(([url]) => url === 'https://assets.example/premium-solution.json').length;
    fixture.detectChanges();
    await fixture.whenStable();
    expect(solutionReads()).toBe(0);
    expect(component.solutionFilesMap()).toEqual({});

    authUser.set({ accessTier: 'premium' });
    fixture.detectChanges();
    await fixture.whenStable();
    await (component as any).loadAuthorizedSolutionAsset(
      question,
      (component as any).loadQuestionSeq,
    );
    expect(resolveSpy).toHaveBeenCalledTimes(1);
    expect(solutionReads()).toBe(1);

    expect(component.locked()).toBeFalse();
    expect(component.solutionFilesMap()['src/App.tsx']).toContain('Premium');

    authUser.set(null);
    fixture.detectChanges();

    expect(component.locked()).toBeTrue();
    expect(component.solutionFilesMap()).toEqual({});
    expect(component.solutionOpenPath()).toBe('');
    expect(fixture.nativeElement.querySelector('[data-testid="coding-description-panel"]')).toBeNull();
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

  it('keeps CSS detail prep links focused on the CSS hub while HTML retains the combined hub CTA', () => {
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    const renderPrep = (tech: 'css' | 'html', question: Question) => {
      component.tech = tech;
      component.kind = 'coding';
      component.question.set(question);
      component.loadState.set('loaded');
      component.activePanel.set(1);
      component.liteEditors.set(true);
      fixture.detectChanges();

      return fixture.nativeElement.querySelector('[data-testid="coding-prep-entry"]') as HTMLElement | null;
    };

    const cssQuestion = makeCssThemeVariablesQuestion() as Question;
    const cssPrep = renderPrep('css', cssQuestion);

    expect(cssPrep).not.toBeNull();
    expect(cssPrep?.querySelector('a[href="/css/interview-questions"]')).not.toBeNull();
    expect(cssPrep?.querySelector('a[href="/html-css/interview-questions"]')).toBeNull();

    const htmlQuestion = {
      ...makeCssThemeVariablesQuestion(),
      id: 'html-semantic-card',
      technology: 'html',
    } as Question;
    const htmlPrep = renderPrep('html', htmlQuestion);

    expect(htmlPrep).not.toBeNull();
    expect(htmlPrep?.querySelector('a[href="/html/interview-questions"]')).not.toBeNull();
    expect(htmlPrep?.querySelector('a[href="/html-css/interview-questions"]')).not.toBeNull();

    component.pressureRequested.set(true);
    component.pressureScenario.set(pressureScenario);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="coding-prep-entry"]')).toBeNull();

    component.pressureRequested.set(false);
    component.pressureScenario.set(null);
    component.question.set({
      ...htmlQuestion,
      solutionBlock: {
        ...(htmlQuestion as any).solutionBlock,
        curatedNextStepsOnly: true,
      },
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="coding-prep-entry"]')).toBeNull();
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

  it('marks the related tasks this visitor would meet a lock on, and drops the mark once they can open them', () => {
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;

    component.tech = 'javascript';
    component.kind = 'coding';
    component.allQuestions = [
      { id: 'js-throttle', title: 'Implement throttle()', technology: 'javascript', type: 'coding', access: 'premium', difficulty: 'intermediate' },
      { id: 'js-sleep', title: 'Sleep', technology: 'javascript', type: 'coding', access: 'free', difficulty: 'easy' },
      { id: 'js-promise-all', title: 'Implement Promise.all', technology: 'javascript', type: 'coding', access: 'premium', difficulty: 'intermediate' },
    ] as any;
    component.question.set({
      id: 'js-debounce',
      title: 'Debounce Function',
      type: 'coding',
      technology: 'javascript',
      access: 'free',
      difficulty: 'intermediate',
      tags: [],
      importance: 4,
      solutionBlock: {
        relatedLinks: [
          { title: 'Implement throttle() in JavaScript', route: ['/', 'javascript', 'coding', 'js-throttle'], label: 'Coding' },
          { title: 'Sleep', route: ['/', 'javascript', 'coding', 'js-sleep'], label: 'Coding' },
          { title: 'JavaScript coding interview questions', route: ['/', 'guides', 'interview-blueprint', 'javascript-interviews'], label: 'Guide' },
        ],
        followUpQuestions: ['js-promise-all'],
      },
    } as any);

    // Signed out, the Premium tasks open a lock page, so their rows say Premium; a guide is never locked. A related
    // link to a task in this bank also keeps the similar-task fallback from listing that task a second time.
    expect(component.followUpItems().map((item) => [item.id, item.locked])).toEqual([
      ['js-throttle', true],
      ['js-sleep', false],
      [jasmine.any(String), false],
      ['js-promise-all', true],
    ]);

    authUser.set({ _id: 'premium-user', accessTier: 'premium' });
    expect(component.followUpItems().every((item) => !item.locked)).toBeTrue();
  });

  it('restores document overflow on destroy', () => {
    spyOnProperty(window, 'innerWidth', 'get').and.returnValue(1366);
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

  it('renders the question title as h2 inside the embedded home demo', async () => {
    const question = makeDeferredPromiseQuestion();
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;
    component.questionId = question.id;
    component.questionTech = 'javascript';
    component.demoMode = true;
    component.liteMode = true;
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
    const title = host.querySelector('[data-testid="question-title"]') as HTMLElement | null;
    expect(title?.tagName).toBe('H2');
    expect(title?.textContent?.trim()).toBeTruthy();
    expect(host.querySelectorAll('h1').length).toBe(0);
  });

  it('renders bold and inline code in solution prose', () => {
    const html = TestBed.createComponent(CodingDetailComponent).componentInstance.md('**Test cases**\n- Click **Add** once, then check `count`.');
    expect(html).toBe('<p class="sol-p"><strong>Test cases</strong></p><ul class="sol-ul"><li>Click <strong>Add</strong> once, then check <code>count</code>.</li></ul>');
  });

  it('renders inline code and bold in the prompt without a collapsed leading space', async () => {
    const question = { ...makeDeferredPromiseQuestion(), description: { summary: 'Call `fn` **once**.' } };
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

    const prose = fixture.nativeElement.querySelector(
      '[data-testid="coding-description-panel"] .whitespace-pre-wrap',
    ) as HTMLElement | null;
    expect(prose?.textContent).toBe('Call fn once.');
    expect(prose?.querySelector('code')?.textContent).toBe('fn');
    expect(prose?.querySelector('strong')?.textContent).toBe('once');
    expect(component.descSummary()).toBe(component.descriptionText());
  });

  const debugDescriptionCases: Array<{ label: string; description: Question['description']; expected?: string }> = [
    { label: 'string', description: '  String prompt.  ', expected: 'String prompt.' },
    { label: 'summary', description: { summary: '  Summary prompt.  ' }, expected: 'Summary prompt.' },
    { label: 'legacy text', description: { text: '  Legacy debug\n prompt.  ' }, expected: 'Legacy debug prompt.' },
    { label: 'summary before text', description: { summary: 'Summary wins.', text: 'Legacy text.' }, expected: 'Summary wins.' },
    { label: 'text after blank summary', description: { summary: ' \n ', text: 'Legacy fallback.' }, expected: 'Legacy fallback.' },
    { label: 'empty fields', description: { summary: '', text: '' } },
    { label: 'blank fields', description: { summary: ' \n ', text: ' \t ' } },
    { label: 'blank string', description: ' \n ' },
    { label: 'missing description', description: undefined },
  ];

  for (const testCase of debugDescriptionCases) {
    it(`renders ${testCase.label} in the visible question prompt`, async () => {
      const question = { ...makeDeferredPromiseQuestion(), description: testCase.description };
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

      const panel = fixture.nativeElement.querySelector('[data-testid="coding-description-panel"]') as HTMLElement;
      const prose = panel.querySelector('.whitespace-pre-wrap');
      expect(panel.hidden).toBeFalse();
      if (testCase.expected) {
        expect(prose?.textContent?.replace(/\s+/g, ' ').trim()).toBe(testCase.expected);
      } else {
        expect(prose).toBeNull();
      }
      expect(component.descSummary()).toBe(component.descriptionText());
      // The prompt never falls back to the solution text. The answer appears only inside the
      // solution idea disclosure, which stays collapsed beside a desktop workspace.
      const idea = panel.querySelector('[data-testid="coding-solution-idea"]') as HTMLDetailsElement | null;
      expect(idea).not.toBeNull();
      expect(idea!.open).toBeFalse();
      expect(idea!.textContent).toContain('Interview answer:');
      const promptOnly = panel.cloneNode(true) as HTMLElement;
      promptOnly.querySelector('[data-testid="coding-solution-idea"]')?.remove();
      expect(promptOnly.textContent).not.toContain('Interview answer:');
    });

    it(`uses ${testCase.label} for debug metadata while preserving access and excluding solutions`, () => {
      const fixture = TestBed.createComponent(CodingDetailComponent);
      const component = fixture.componentInstance;
      component.tech = 'javascript';
      component.kind = 'debug';

      for (const access of ['free', 'premium'] as const) {
        const question = {
          id: 'js-debug-description',
          title: 'Debug the numeric sort',
          technology: 'javascript',
          access,
          description: testCase.description,
          get solution() { throw new Error('SEO must not read solution'); },
          get solutionBlock() { throw new Error('SEO must not read solutionBlock'); },
        } as any;
        component.question.set(question);
        (component as any).updateSeoForQuestion(question);

        const payload = seo.updateTags.calls.mostRecent().args[0] as any;
        const article = payload.jsonLd.find((entry: any) => entry['@type'] === 'TechArticle');
        expect(payload.description).toBe(testCase.expected ?? 'Front-end debug question for javascript.');
        expect(article.description).toBe(payload.description);
        expect(article.isAccessibleForFree).toBe(access === 'free');
        expect(payload.robots).toBe(access === 'premium' ? 'noindex,follow' : undefined);
        expect(payload.canonical).toBe('https://frontendatlas.com/javascript/debug/js-debug-description');
        expect(component.locked()).toBe(access === 'premium');
      }
    });
  }

  for (const source of ['prompt', 'explicit SEO'] as const) {
    it(`retains the final debug repair constraint from ${source} without changing coding limits or titles`, () => {
      const fixture = TestBed.createComponent(CodingDetailComponent);
      const component = fixture.componentInstance;
      component.tech = 'javascript';
      component.kind = 'debug';
      const description =
        'A teammate wrote a tiny leaderboard helper with plain sort(). It looked fine in a quick demo with single-digit values, '
        + 'then broke the moment scores like 10 and 100 showed up. Fix the bug so numbers sort numerically in ascending order '
        + 'while keeping the original input unchanged.';
      const question = {
        id: 'js-debug-numeric-sort',
        title: 'Fix numeric sort in sortScores',
        technology: 'javascript',
        access: 'free',
        description: { text: source === 'prompt' ? description : 'Unused prompt fallback.' },
        seo: source === 'explicit SEO' ? { description: `<p>${description}</p>` } : undefined,
      } as any;

      (component as any).updateSeoForQuestion(question);
      const debugPayload = seo.updateTags.calls.mostRecent().args[0] as any;
      expect(debugPayload.description).toBe(description);
      expect(debugPayload.description).toContain('while keeping the original input unchanged.');
      expect(debugPayload.description.length).toBeGreaterThan(240);
      expect(debugPayload.title).toBe(question.title);
      expect(debugPayload.jsonLd.find((entry: any) => entry['@type'] === 'TechArticle').description).toBe(description);

      component.kind = 'coding';
      (component as any).updateSeoForQuestion(question);
      const codingPayload = seo.updateTags.calls.mostRecent().args[0] as any;
      expect(codingPayload.description.length).toBeLessThanOrEqual(240);
      expect(codingPayload.title).toBe(debugPayload.title);
    });
  }

  it('uses the sitemap modification date without changing the editorial publication fallback', () => {
    const fixture = TestBed.createComponent(CodingDetailComponent);
    const component = fixture.componentInstance;
    component.tech = 'javascript';
    component.kind = 'coding';
    // Any JavaScript coding route with a published sitemap date: the fixture's own route is pending
    // until its latest content change is committed, so the assertion must not depend on it.
    const datedRoute = Object.keys(SEO_CONTENT_DATES).find((route) => /^\/javascript\/coding\/[a-z0-9-]+$/.test(route));
    expect(datedRoute).toBeTruthy();
    const question = { ...makeDeferredPromiseQuestion(), id: datedRoute!.split('/').pop()!, updatedAt: '2025-03-15' };

    (component as any).updateSeoForQuestion(question);
    const payload = seo.updateTags.calls.mostRecent().args[0] as any;
    const article = payload.jsonLd.find((entry: any) => entry['@type'] === 'TechArticle');
    expect(article.url).toBe(`https://frontendatlas.com${datedRoute}`);
    const contentDate = seoContentDateModified(article.url);
    expect(contentDate).toBeTruthy();
    expect(article.dateModified).toBe(contentDate);
    expect(article.datePublished).toBe('2025-03-15T00:00:00.000Z');
    // The visible "Updated" label shows the same day as the sitemap and the schema, not the catalog updatedAt.
    expect(component.updatedLabel(question as any))
      .toBe(new Date(contentDate!).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }));
    expect(component.updatedLabel(question as any)).not.toBe('Mar 15, 2025');

    (component as any).updateSeoForQuestion({ ...question, id: 'unresolved-content-date' });
    const unresolved = (seo.updateTags.calls.mostRecent().args[0] as any).jsonLd
      .find((entry: any) => entry['@type'] === 'TechArticle');
    expect(Object.prototype.hasOwnProperty.call(unresolved, 'dateModified')).toBeFalse();
    expect(unresolved.datePublished).toBe('2025-03-15T00:00:00.000Z');
    expect(component.updatedLabel({ ...question, id: 'unresolved-content-date' } as any)).toBe('Mar 15, 2025');
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

  it('renders backtick titles as code in the H1 and keeps the breadcrumb and its JSON-LD plain text', async () => {
    const base = makeCssThemeVariablesQuestion();
    const question = {
      ...base,
      title: 'Theme panels with `var()` tokens',
      seo: { title: base.seo.title, description: base.seo.description },
    };
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
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const title = host.querySelector('[data-testid="question-title"]') as HTMLElement;
    const breadcrumb = host.querySelector('[data-testid="coding-breadcrumb"]') as HTMLElement;

    expect(title.querySelector('code')?.textContent).toBe('var()');
    expect(title.textContent || '').not.toContain('`');
    expect(breadcrumb.textContent || '').toContain('Theme panels with var() tokens');
    expect(breadcrumb.textContent || '').not.toContain('`');

    component.tech = 'css';
    component.kind = 'coding';
    (component as any).updateSeoForQuestion(question);

    const payload = seo.updateTags.calls.mostRecent().args[0] as any;
    const graph = Array.isArray(payload?.jsonLd) ? payload.jsonLd : [];
    const names = graph.find((entry: any) => entry?.['@type'] === 'BreadcrumbList')
      ?.itemListElement?.map((item: any) => item.name) || [];
    expect(names[names.length - 1]).toBe('Theme panels with var() tokens');
  });

  describe('merge request review', () => {
    const reviewQuestion = {
      id: 'vue-issue-list-merge-request-review',
      title: 'Merge Request Review: Issue List Label Filter',
      access: 'premium',
      difficulty: 'intermediate',
      reviewModeAsset: 'assets/questions/review-modes/issue-label-filter.v1.json',
      sdk: {
        asset: 'assets/sb/vue/question/vue-issue-list-merge-request-review.v1.json',
        openFile: '/src/App.vue',
        storageKey: 'v2:ui:vue:vue-issue-list-merge-request-review',
      },
      frameworkTests: [],
    } as any;
    const reviewScenario: ReviewModeScenario = {
      schemaVersion: '1.0.0',
      id: 'issue-label-filter-review-v1',
      title: 'Issue list label filter review',
      access: 'premium',
      format: 'review',
      sessionMinutes: 90,
      supportedQuestions: { vue: reviewQuestion.id },
      mergeRequest: {
        title: 'Add label filters to the issue list',
        description: 'Adds a filter bar above the list.',
        issue: { title: 'Filter issues by label', requirements: ['Filter without loading the list again.'] },
        files: [{ path: 'src/App.vue', before: '<p>Issues</p>\n', after: '<p>Issues</p>\n<p>Filters</p>\n' }],
      },
      sampleReview: {
        summary: 'Request changes.',
        comments: [{ path: 'src/App.vue', line: 2, severity: 'blocker', title: 'Reloads on click', body: 'Filter the loaded list.', checked: true }],
      },
    };
    let load: jasmine.Spy;

    beforeEach(() => {
      localStorage.removeItem(reviewDraftKey(reviewQuestion.id));
      load = spyOn(TestBed.inject(ReviewModeService), 'load').and.returnValue(of(reviewScenario));
    });

    afterEach(() => localStorage.removeItem(reviewDraftKey(reviewQuestion.id)));

    async function render() {
      const fixture = TestBed.createComponent(CodingDetailComponent);
      const component = fixture.componentInstance;
      authUser.set({ _id: 'premium-user', accessTier: 'premium' });
      auth.isLoggedIn.and.returnValue(true);
      questionService.loadQuestions.and.returnValue(of([reviewQuestion]));
      component.questionId = reviewQuestion.id;
      component.questionTech = 'vue';
      component.disablePersistence = true;
      component.hideFooterBar = true;
      spyOn(component as any, 'resolveSolutionAsset').and.resolveTo({ files: {}, initialPath: '' });

      fixture.detectChanges();
      await fixture.whenStable();
      component.tech = 'vue';
      component.kind = 'coding';
      component.question.set(reviewQuestion);
      component.loadState.set('loaded');
      component.isPhoneViewport.set(false);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      const host = fixture.nativeElement as HTMLElement;
      return { fixture, component, find: (testId: string) => host.querySelector<HTMLElement>(`[data-testid="${testId}"]`) };
    }

    it('opens in place of the description with room for the diff, and gives the layout back on leaving', async () => {
      const { fixture, component, find } = await render();
      component.horizontalRatio.set(0.3);
      expect(find('review-mode-panel')).toBeNull();

      find('review-mode-start')!.click();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(load).toHaveBeenCalledWith(reviewQuestion.reviewModeAsset);
      expect(find('review-mode-panel')?.textContent).toContain('Add label filters to the issue list');
      expect(find('question-title')).toBeNull();
      expect(find('review-mode-entry')).toBeNull();
      expect(component.horizontalRatio()).toBe(0.42);

      find('review-mode-exit')!.click();
      fixture.detectChanges();

      expect(find('review-mode-panel')).toBeNull();
      expect(find('question-title')).not.toBeNull();
      expect(component.horizontalRatio()).toBe(0.3);
      expect(JSON.parse(localStorage.getItem(reviewDraftKey(reviewQuestion.id))!).open).toBeFalse();
    });

    it('reopens a review left open on this device at the step it was on', async () => {
      localStorage.setItem(
        reviewDraftKey(reviewQuestion.id),
        JSON.stringify({ open: true, startedAt: Date.now(), phase: 'fix', comments: { 'src/App.vue': 'L2: filter the loaded list' }, summary: '' }),
      );
      const { find } = await render();

      expect(find('review-mode-panel')?.textContent).toContain('L2: filter the loaded list');
      expect(find('review-mode-compare')).not.toBeNull();
    });

    it('stays closed on a phone, and for a review written for another task', async () => {
      const { component } = await render();
      const open = (component as any).openReviewMode.bind(component);

      component.isPhoneViewport.set(true);
      await open(reviewQuestion);
      expect(component.reviewOpen()).toBeFalse();

      component.isPhoneViewport.set(false);
      load.and.returnValue(of({ ...reviewScenario, supportedQuestions: { vue: 'vue-other-task' } }));
      await open(reviewQuestion);
      expect(component.reviewOpen()).toBeFalse();
    });
  });

  describe('find case', () => {
    const caseQuestion = {
      id: 'js-debug-budget-case',
      title: 'Case: Find the Bug in a Budget Summary',
      description: { text: 'Find the bug without coding the fix.' },
      technology: 'javascript',
      access: 'premium',
      difficulty: 'intermediate',
      tags: ['debugging'],
      importance: 3,
      starterCode: 'export default function monthly(weekly) {\n  return weekly * 4;\n}\n',
      tests: "test('ok', () => expect(1).toBe(1));\n",
      reviewModeAsset: 'assets/questions/review-modes/budget-case.v1.json',
    } as any;
    const findScenario: ReviewModeScenario = {
      schemaVersion: '1.0.0',
      id: 'budget-case',
      title: 'Budget case',
      access: 'premium',
      format: 'find',
      sessionMinutes: 45,
      supportedQuestions: { javascript: caseQuestion.id },
      workedExample: { prompt: 'Work $100 a week by hand.', answer: '$433.33 a month.' },
      mergeRequest: {
        title: 'Find the bug in the budget summary',
        description: 'Find it without running the code.',
        issue: { title: 'What it should do', requirements: ['A weekly expense happens 52 times a year.'] },
        files: [{ path: 'monthly.js', before: '', after: caseQuestion.starterCode }],
      },
      sampleReview: {
        summary: 'Line 2 counts four weeks a month.',
        comments: [{ path: 'monthly.js', line: 2, severity: 'blocker', title: 'Four weeks a month', body: 'Use 52 / 12.', checked: true }],
      },
    };

    beforeEach(() => {
      localStorage.removeItem(reviewDraftKey(caseQuestion.id));
      spyOn(TestBed.inject(ReviewModeService), 'load').and.returnValue(of(findScenario));
      // The JS panel announces a resize after loading a task; the page then measures a laptop-wide window.
      spyOnProperty(window, 'innerWidth', 'get').and.returnValue(1440);
    });

    afterEach(() => localStorage.removeItem(reviewDraftKey(caseQuestion.id)));

    it('opens on a plain JavaScript task and keeps the workspace and the solution shut until the comparison', async () => {
      const fixture = TestBed.createComponent(CodingDetailComponent);
      const component = fixture.componentInstance;
      authUser.set({ _id: 'premium-user', accessTier: 'premium' });
      auth.isLoggedIn.and.returnValue(true);
      questionService.loadQuestions.and.returnValue(of([caseQuestion]));
      component.questionId = caseQuestion.id;
      component.questionTech = 'javascript';
      component.disablePersistence = true;
      component.hideFooterBar = true;
      fixture.detectChanges();
      await fixture.whenStable();
      component.tech = 'javascript';
      component.kind = 'debug';
      component.question.set(caseQuestion);
      component.loadState.set('loaded');
      component.isPhoneViewport.set(false);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      const host = fixture.nativeElement as HTMLElement;
      const find = (testId: string) => host.querySelector<HTMLElement>(`[data-testid="${testId}"]`);
      const jsPanel = () => fixture.debugElement.query(By.directive(CodingJsPanelComponent)).componentInstance as CodingJsPanelComponent;

      expect(find('review-mode-entry')?.textContent).toContain('Find the bug without coding the fix');
      expect(component.findLocked()).toBeFalse();
      find('review-mode-start')!.click();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(find('review-mode-panel')?.textContent).toContain('Case: find the bug');
      expect(component.findLocked()).toBeTrue();
      expect(jsPanel().locked).toBeTrue();
      expect(jsPanel().lockedLabel).toBe('Find the bug first: the code runs after the comparison');
      expect(component.solutionLocked()).toBeTrue();
      // The test names would give the bugs away, so the workspace waits behind a note; the case keeps its own clock.
      expect(find('js-concealed-note')?.textContent).toContain('The workspace and its tests open after you compare');
      expect(jsPanel().timedPracticeHidden).toBeTrue();

      find('review-mode-compare')!.click();
      fixture.detectChanges();
      expect(component.findLocked()).toBeFalse();
      expect(jsPanel().locked).toBeFalse();
      expect(component.solutionLocked()).toBeFalse();
      expect(find('js-concealed-note')).toBeNull();
      expect(jsPanel().timedPracticeHidden).toBeTrue();
    });
  });

  describe('timed rehearsal', () => {
    const payload = {
      id: 'meta-full-loop-coding',
      access: 'premium',
      company: 'meta',
      title: 'Meta coding round',
      round: 'Full loop: coding',
      summary: 'About two problems in about 40 minutes.',
      minutes: 40,
      order: 'sequential',
      items: [
        { path: '/javascript/coding/js-dom-twin-node', title: 'Find the Corresponding Node in Twin DOM Trees' },
        { path: '/javascript/coding/js-debounce', title: 'Debounce Function' },
      ],
    };
    const task = (id: string, title: string) => ({
      id,
      title,
      description: 'Solve it.',
      technology: 'javascript',
      access: 'free',
      difficulty: 'intermediate',
      tags: ['dom'],
      importance: 3,
      starterCode: 'export default function solve() {}\n',
      tests: "test('ok', () => expect(1).toBe(1));\n",
    }) as any;
    const twin = task('js-dom-twin-node', 'Find the Corresponding Node in Twin DOM Trees');
    const debounce = task('js-debounce', 'Debounce Function');
    const premium = { _id: 'premium-user', accessTier: 'premium' };
    let rehearsals: RehearsalService;
    let definition: RehearsalDefinition;

    beforeEach(() => {
      localStorage.removeItem('fa:rehearsal:v1');
      rehearsals = TestBed.inject(RehearsalService);
      rehearsals.close();
      definition = rehearsals.normalize(payload)!;
      spyOn(rehearsals, 'forTask').and.callFake((path: string) =>
        of(definition.items.some((item) => item.path === path) ? [definition] : []));
      // The JS panel announces a resize after loading a task; the page then measures a laptop-wide window.
      spyOnProperty(window, 'innerWidth', 'get').and.returnValue(1440);
    });

    afterEach(() => {
      rehearsals.close();
      localStorage.removeItem('fa:rehearsal:v1');
    });

    async function render(question: any, user: any, options: { list?: any[]; footer?: boolean } = {}) {
      const fixture = TestBed.createComponent(CodingDetailComponent);
      const component = fixture.componentInstance;
      authUser.set(user);
      auth.isLoggedIn.and.returnValue(!!user);
      questionService.loadQuestions.and.returnValue(of(options.list ?? [question]));
      component.questionId = question.id;
      component.questionTech = 'javascript';
      component.disablePersistence = true;
      component.hideFooterBar = !options.footer;

      fixture.detectChanges();
      await fixture.whenStable();
      component.tech = 'javascript';
      component.kind = 'coding';
      component.question.set(question);
      component.loadState.set('loaded');
      component.isPhoneViewport.set(false);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      const host = fixture.nativeElement as HTMLElement;
      return {
        fixture,
        component,
        jsPanel: () => fixture.debugElement.query(By.directive(CodingJsPanelComponent))?.componentInstance as CodingJsPanelComponent,
        find: (testId: string) => host.querySelector<HTMLElement>(`[data-testid="${testId}"]`),
      };
    }

    it('offers the rehearsal to Premium, pricing to everyone else, and names it on a phone', async () => {
      const member = await render(twin, premium);
      expect(rehearsals.forTask).toHaveBeenCalledWith('/javascript/coding/js-dom-twin-node');
      expect(member.find('rehearsal-entry')?.textContent).toContain('Meta coding round: 2 problems in 40 minutes');
      expect(member.find('rehearsal-start')).not.toBeNull();
      expect(member.find('rehearsal-pricing')).toBeNull();
      expect(member.find('rehearsal-phone-note')).toBeNull();
      // A phone cannot run it, so a sentence in the phone notice names it in place of its card: the problem is no
      // plain warm-up.
      member.component.isPhoneViewport.set(true);
      member.fixture.detectChanges();
      await member.fixture.whenStable();
      member.fixture.detectChanges();
      expect(member.find('rehearsal-entry')).toBeNull();
      expect(member.find('rehearsal-start')).toBeNull();
      expect(member.find('coding-mobile-notice')?.textContent).toContain(
        'Use a desktop or tablet to write code and run checks. This problem is also part of the Meta coding round rehearsal (Premium): 2 problems in 40 minutes, on a desktop or tablet.'
      );
      member.component.question.set({ ...debounce, id: 'js-other' });
      member.fixture.detectChanges();
      await member.fixture.whenStable();
      member.fixture.detectChanges();
      expect(member.find('coding-mobile-notice')).not.toBeNull();
      expect(member.find('rehearsal-phone-note')).toBeNull();
      member.fixture.destroy();

      const visitor = await render(twin, null);
      const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
      expect(visitor.find('rehearsal-start')).toBeNull();
      visitor.find('rehearsal-pricing')!.click();
      expect(navigate).toHaveBeenCalledWith(['/pricing'], jasmine.objectContaining({
        queryParams: jasmine.objectContaining({ src: 'coding_rehearsal_javascript' }),
      }));
    });

    it('starts on the first problem with the clock, a draft of its own, its runs counted and the solution locked', async () => {
      const { fixture, component, jsPanel, find } = await render(twin, premium);
      find('rehearsal-start')!.click();
      fixture.detectChanges();

      expect(rehearsals.phase()).toBe('active');
      expect(find('rehearsal-entry')).toBeNull();
      expect(find('rehearsal-clock')?.textContent?.trim()).toMatch(/^(40:00|39:5\d) left$/);
      expect(component.jsStorageKey()).toBe(rehearsals.draftKey('js-dom-twin-node'));
      expect(jsPanel().storageKeyOverride).toBe(rehearsals.draftKey('js-dom-twin-node'));
      expect(jsPanel().clockLabel).toMatch(/left$/);
      expect(jsPanel().locked).toBeFalse();
      expect(component.solutionLocked()).toBeTrue();

      component.onJsTestResults([{ name: 'a', passed: true }, { name: 'b', passed: false }]);
      expect(rehearsals.session()?.results['js-dom-twin-node']).toEqual({ passed: 1, total: 2, runs: 1 });
    });

    it('keeps a running rehearsal to its task: no coaching beside it, and no footer way on to other practice', async () => {
      const coached = {
        ...twin,
        estimatedMinutes: 30,
        sources: [{
          label: 'Blind: Meta frontend screen, March 2022',
          url: 'https://www.teamblind.com/post/meta-frontend-screen-example',
          company: 'meta',
          publisher: 'Blind',
          date: '2022-03',
          note: 'The account names a walk over both trees at once.',
        }],
        description: {
          summary: 'Return the node of tree B that sits where the given node sits in tree A.',
          specs: {
            practice: ['Walking both trees in sync'],
            requirements: ['Return null when the node is not in tree A'],
            implementationNotes: ['Export the function as the default export'],
            commonMistakes: ['Comparing nodes by their text'],
            interviewExplanation: 'A path of child indexes finds the twin.',
            testingChecklist: ['A node at the root'],
            faq: [{ question: 'Recursion or a loop?', answer: 'Either works.' }],
          },
        },
      };
      const { fixture, component, jsPanel, find } = await render(coached, premium, { list: [coached, debounce], footer: true });
      const description = () => find('coding-description-panel')!.textContent ?? '';
      // An account's note can name the method too, so the sources step aside with the coaching.
      const coaching = ['Walking both trees in sync', 'Comparing nodes by their text', 'A path of child indexes', 'A node at the root', 'Recursion or a loop?', 'a walk over both trees at once'];
      // Of two tasks in the list, one is a step away, whichever order the list keeps.
      const footerLinks = () => ['footer-prev', 'footer-next'].filter((id) => find(id)?.tagName === 'A');
      for (const line of coaching) expect(description()).withContext(line).toContain(line);
      expect(find('coding-interview-hero')?.textContent).toContain('30 min');
      jsPanel().explainHint.set({ ruleId: 'off-by-one', title: 'Off by one', why: 'The loop stops one step early.', actions: ['Check the bound'], confidence: 0.9 });
      fixture.detectChanges();
      expect(find('assist-explain-card')?.textContent).toContain('Explain failure');
      expect(footerLinks().length).toBe(1);
      expect(find('footer-progress')?.textContent?.trim()).toMatch(/^[12] \/ 2$/);
      // The way out of a task is the task list, not an unrelated hub; the incidents hub keeps a link under Guides.
      expect(find('footer-left')?.textContent).toContain('All coding tasks');
      expect(find('footer-left')?.getAttribute('href')).toBe('/coding');
      expect(find('coding-incidents-link')?.getAttribute('href')).toBe('/incidents');

      find('rehearsal-start')!.click();
      fixture.detectChanges();

      for (const line of coaching) expect(description()).withContext(line).not.toContain(line);
      expect(find('coding-interview-hero')).toBeNull();
      expect(find('editor-assist-dock')).toBeNull();
      // The task's own statement, requirements and notes stay: the round would give them too.
      expect(description()).toContain('Return the node of tree B');
      expect(description()).toContain('Return null when the node is not in tree A');
      expect(description()).toContain('Export the function as the default export');
      expect((find('footer-prev') as HTMLButtonElement).disabled).toBeTrue();
      expect((find('footer-next') as HTMLButtonElement).disabled).toBeTrue();
      expect(find('footer-progress')?.textContent?.trim()).toBe('Problem 1 of 2');
      expect(find('footer-left')).toBeNull();

      // A plan's way back stays, since the clock keeps running while the person reads the plan.
      component.planReturn.set({ label: 'Back to my plan', route: ['/companies/plan'], queryParams: {} });
      fixture.detectChanges();
      expect(find('footer-left')?.textContent).toContain('Back to my plan');

      rehearsals.end();
      fixture.detectChanges();
      for (const line of coaching) expect(description()).withContext(line).toContain(line);
      expect(footerLinks().length).toBe(1);
    });

    it('locks the task for the review and gives the drafts back when the review closes', async () => {
      const { fixture, component, jsPanel, find } = await render(twin, premium);
      rehearsals.start(definition, twin.id);
      rehearsals.end();
      fixture.detectChanges();

      expect(find('rehearsal-verdict')?.textContent).toContain('0 of 2 problems pass every test.');
      expect(jsPanel().locked).toBeTrue();
      expect(jsPanel().clockLabel).toBeNull();
      expect(component.solutionLocked()).toBeFalse();
      expect(jsPanel().storageKeyOverride).toBe(rehearsals.draftKey(twin.id));

      find('rehearsal-close')!.click();
      fixture.detectChanges();
      expect(find('rehearsal-panel')).toBeNull();
      expect(jsPanel().storageKeyOverride).toBeNull();
      expect(jsPanel().locked).toBeFalse();
      expect(find('rehearsal-entry')).not.toBeNull();
    });

    it('sends a sequential rehearsal started on its second problem to the first one', async () => {
      const { find } = await render(debounce, premium);
      const navigate = spyOn(TestBed.inject(Router), 'navigateByUrl').and.resolveTo(true);
      find('rehearsal-start')!.click();
      expect(navigate).toHaveBeenCalledWith('/javascript/coding/js-dom-twin-node');
      expect(rehearsals.session()?.reached).toBe(0);
    });

    it('keeps the problem out of sight and its editor read-only while the questions run', async () => {
      definition = rehearsals.normalize({
        ...payload,
        id: 'walmart-karat-screen',
        title: 'Walmart Karat screen',
        minutes: 55,
        quiz: {
          minutes: 10,
          questions: [
            { question: 'What is a closure?', answer: 'A function that keeps its scope.', path: '/javascript/trivia/js-closures' },
            { question: 'What does border-box change?', answer: 'Width includes padding and border.', path: '/css/trivia/css-box-model' },
            { question: 'What is useEffect for?', answer: 'Syncing with the outside world.', path: '/react/trivia/react-useeffect-purpose' },
          ],
        },
      })!;
      const { fixture, jsPanel, find } = await render(twin, premium);
      expect(find('rehearsal-entry')?.textContent).toContain('Walmart Karat screen: 3 short answers and 2 problems in 55 minutes');
      find('rehearsal-start')!.click();
      fixture.detectChanges();

      const description = find('coding-description-panel')!;
      const rendered = () => Array.from(description.children)
        .filter((child) => child.getClientRects().length > 0)
        .map((child) => child.tagName.toLowerCase());
      expect(find('rehearsal-question')?.textContent?.trim()).toBe('What is a closure?');
      expect(rendered()).toEqual(['app-rehearsal-panel']);
      expect(jsPanel().locked).toBeTrue();
      expect(find('js-rehearsal-clock')?.textContent?.trim()).toMatch(/left: questions first$/);
      // The starter code would give the problem away: it waits behind a note, out of reach of the keyboard too.
      expect(find('js-concealed-note')?.textContent?.trim()).toBe('The problems open after the questions.');
      expect(find('js-code-editor')?.hasAttribute('inert')).toBeTrue();

      find('rehearsal-skip')!.click();
      fixture.detectChanges();
      expect(find('js-concealed-note')).toBeNull();
      expect(find('js-code-editor')?.hasAttribute('inert')).toBeFalse();
      expect(rendered()).toContain('app-rehearsal-panel');
      expect(rendered().length).toBeGreaterThan(1);
      expect(description.querySelector('[data-testid="question-title"]')!.getClientRects().length).toBeGreaterThan(0);
      expect(jsPanel().locked).toBeFalse();
      expect(find('js-rehearsal-clock')?.textContent?.trim()).toMatch(/left$/);
    });

    it('runs a React task inside a rehearsal: on a draft of its own, with its checks counted until the review', async () => {
      definition = rehearsals.normalize({
        ...payload,
        order: 'free',
        items: [...payload.items, { path: '/react/coding/react-counter', title: 'Counter' }],
      })!;
      const fixture = TestBed.createComponent(CodingDetailComponent);
      const component = fixture.componentInstance;
      authUser.set(premium);
      auth.isLoggedIn.and.returnValue(true);
      component.tech = 'react';
      component.kind = 'coding';
      component.question.set({
        id: 'react-counter',
        access: 'free',
        difficulty: 'easy',
        frameworkTests: [{ id: 'counter', name: 'Counter', steps: [{ type: 'expectExists', selector: '.value' }] }],
      } as any);
      expect(component.rehearsalSupported()).toBeTrue();
      const ownDraft = component.frameworkStorageKey();

      rehearsals.start(definition, 'react-counter');
      expect(component.rehearsalPhase()).toBe('active');
      expect(component.frameworkStorageKey()).toBe(rehearsals.draftKey('react-counter'));
      expect(component.frameworkStorageKey()).not.toBe(ownDraft);
      await component.onFrameworkCheckRun({
        questionId: 'react-counter',
        passed: false,
        results: [{ name: 'Counter renders', passed: true }, { name: 'Counter counts', passed: false }],
      });
      expect(rehearsals.session()?.results['react-counter']).toEqual({ passed: 1, total: 2, runs: 1 });

      // The footer's Run checks counts as the panel's does.
      const runFrameworkChecks = jasmine.createSpy('runFrameworkChecks').and.resolveTo([
        { name: 'Counter renders', passed: true },
        { name: 'Counter counts', passed: true },
      ]);
      (component as any).frameworkPanel = { runFrameworkChecks };
      await component.submitCode();
      expect(rehearsals.session()?.results['react-counter']).toEqual({ passed: 2, total: 2, runs: 2 });

      // The review keeps the draft, stops counting, and leaves the footer nothing to submit.
      rehearsals.end();
      expect(component.rehearsalPhase()).toBe('review');
      expect(component.rehearsalLocked()).toBeTrue();
      expect(component.frameworkStorageKey()).toBe(rehearsals.draftKey('react-counter'));
      await component.onFrameworkCheckRun({ questionId: 'react-counter', passed: true, results: [{ name: 'Counter renders', passed: true }] });
      await component.submitCode();
      expect(runFrameworkChecks).toHaveBeenCalledTimes(1);
      expect(rehearsals.session()?.results['react-counter']).toEqual({ passed: 2, total: 2, runs: 2 });

      component.tech = 'vue';
      expect(component.rehearsalSupported()).toBeFalse();
    });

    it('lists several rehearsals of one problem in one card, with a start for each and one way to pricing', async () => {
      const other = rehearsals.normalize({ ...payload, id: 'acme-screen', title: 'Acme screen', summary: 'Two problems in 30 minutes.', minutes: 30 })!;
      (rehearsals.forTask as jasmine.Spy).and.returnValue(of([definition, other]));
      const member = await render(twin, premium);
      const host = member.fixture.nativeElement as HTMLElement;
      expect(host.querySelectorAll('[data-testid="rehearsal-offers"]').length).toBe(1);
      expect(member.find('rehearsal-offers')?.textContent).toContain('This problem is part of 2 timed rehearsals');
      const rows = Array.from(host.querySelectorAll<HTMLElement>('[data-testid="rehearsal-entry"]'));
      expect(rows.map((row) => row.querySelector('h3')?.textContent?.trim())).toEqual([
        'Meta coding round: 2 problems in 40 minutes',
        'Acme screen: 2 problems in 30 minutes',
      ]);
      // Each summary is a click away, so the description stays in view.
      expect(rows[1].querySelector('details summary')?.textContent?.trim()).toBe('What it covers');
      expect(rows[1].querySelector('details p')?.textContent?.trim()).toBe('Two problems in 30 minutes.');
      const start = rows[1].querySelector<HTMLButtonElement>('[data-testid="rehearsal-start"]')!;
      expect(start.getAttribute('aria-label')).toBe('Start the Acme screen rehearsal');
      start.click();
      expect(rehearsals.session()?.definition.id).toBe('acme-screen');
      rehearsals.close();
      member.fixture.destroy();

      const visitor = await render(twin, null);
      const visitorHost = visitor.fixture.nativeElement as HTMLElement;
      expect(visitorHost.querySelectorAll('[data-testid="rehearsal-start"]').length).toBe(0);
      expect(visitorHost.querySelectorAll('[data-testid="rehearsal-pricing"]').length).toBe(1);
    });
  });

  describe('question sources', () => {
    const sources = [{
      label: 'PracHub: Waymo senior frontend interview experience, May 2026',
      url: 'https://prachub.com/interview-experiences/waymo-senior-frontend-engineer',
      publisher: 'PracHub',
      date: '2026-05',
      note: 'One self-reported senior loop.',
    }];

    const render = async (question: any) => {
      const fixture = TestBed.createComponent(CodingDetailComponent);
      const component = fixture.componentInstance;
      component.questionId = question.id;
      component.questionTech = 'javascript';
      questionService.loadQuestions.and.returnValue(of([question] as any));
      spyOn(component as any, 'resolveSolutionAsset').and.resolveTo({ files: {}, initialPath: '' });
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      return { host: fixture.nativeElement as HTMLElement, component };
    };

    it('lists public interview reports under the description and cites them in the TechArticle schema', async () => {
      const { host } = await render({ ...makeDeferredPromiseQuestion(), sources });
      const panel = host.querySelector('[data-testid="coding-description-panel"]') as HTMLElement;
      const block = host.querySelector('[data-testid="question-sources"]') as HTMLElement;
      expect(block).not.toBeNull();
      expect(panel.contains(block)).toBeTrue();
      expect(block.textContent).toContain('Public interview reports');
      expect(block.textContent).toContain('PracHub, May 2026');
      expect(block.textContent).toContain('One self-reported senior loop.');
      const link = block.querySelector('a') as HTMLAnchorElement;
      expect(link.getAttribute('href')).toBe(sources[0].url);
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toBe('noopener noreferrer nofollow');
      expect(host.querySelector('[data-testid="question-sources-compact"]')).toBeNull();

      const payload = seo.updateTags.calls.mostRecent().args[0] as any;
      const article = payload.jsonLd.find((entry: any) => entry['@type'] === 'TechArticle');
      expect(article.citation).toEqual([jasmine.objectContaining({
        '@type': 'CreativeWork',
        name: sources[0].label,
        url: sources[0].url,
        datePublished: '2026-05',
      })]);
    });

    it('renders no sources block and no citation when a question has none', async () => {
      const { host } = await render(makeDeferredPromiseQuestion());
      expect(host.querySelector('[data-testid="question-sources"]')).toBeNull();
      expect(host.querySelector('[data-testid="question-sources-compact"]')).toBeNull();
      const payload = seo.updateTags.calls.mostRecent().args[0] as any;
      const article = payload.jsonLd.find((entry: any) => entry['@type'] === 'TechArticle');
      expect(article.citation).toBeUndefined();
    });

    it('shows a compact sources line on the locked premium view instead of the full block', async () => {
      const { host, component } = await render({
        ...makeDeferredPromiseQuestion(),
        id: 'js-locked-with-sources',
        access: 'premium',
        sources,
      });
      expect(component.locked()).toBeTrue();
      const compact = host.querySelector('[data-testid="question-sources-compact"]') as HTMLElement;
      expect(compact).not.toBeNull();
      expect(compact.textContent).toContain('PracHub (May 2026)');
      expect(compact.querySelector('a')?.getAttribute('rel')).toBe('noopener noreferrer nofollow');
      expect(host.querySelector('[data-testid="question-sources"]')).toBeNull();
      expect(host.textContent).not.toContain('One self-reported senior loop.');
    });
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
