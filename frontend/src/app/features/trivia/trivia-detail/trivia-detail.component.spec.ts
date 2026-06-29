import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, ReplaySubject } from 'rxjs';
import { ActivityService } from '../../../core/services/activity.service';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { AuthService } from '../../../core/services/auth.service';
import { BugReportService } from '../../../core/services/bug-report.service';
import { ExperimentService } from '../../../core/services/experiment.service';
import { LifecyclePromptService } from '../../../core/services/lifecycle-prompt.service';
import { OnboardingService } from '../../../core/services/onboarding.service';
import { QuestionService } from '../../../core/services/question.service';
import { SeoService } from '../../../core/services/seo.service';
import { TriviaIncidentService } from '../../../core/services/trivia-incident.service';
import { UserProgressService } from '../../../core/services/user-progress.service';
import { TriviaDetailComponent } from './trivia-detail.component';

describe('TriviaDetailComponent', () => {
  let routeData$: ReplaySubject<any>;
  let bugReport: jasmine.SpyObj<BugReportService>;
  let seo: jasmine.SpyObj<SeoService>;
  let progress: jasmine.SpyObj<UserProgressService>;
  let auth: jasmine.SpyObj<AuthService>;
  let activity: jasmine.SpyObj<ActivityService>;
  let analytics: jasmine.SpyObj<AnalyticsService>;
  let onboarding: jasmine.SpyObj<OnboardingService>;
  let triviaIncident: jasmine.SpyObj<TriviaIncidentService>;
  let originalPath = '';
  let originalHiddenDescriptor: PropertyDescriptor | undefined;

  const makeResolved = (access: 'free' | 'premium', extras: Record<string, any> = {}) => ({
    tech: 'javascript',
    kind: 'trivia',
    id: 'q1',
    list: [{
      id: 'q1',
      title: 'What is closure?',
      description: 'Closure keeps lexical scope.',
      answer: {
        blocks: [
          {
            type: 'text',
            text: 'Closure captures lexical scope so later callbacks can still read outer variables safely in asynchronous UI code.',
          },
          {
            type: 'text',
            text: 'Example: a click handler can increment a value from the outer factory function without re-reading global state.',
          },
        ],
      },
      importance: 3,
      difficulty: 'easy',
      technology: 'javascript',
      access,
      tags: ['closures', 'functions'],
      updatedAt: '2026-04-02',
      ...extras,
    }, {
      id: 'q2',
      title: 'What is event delegation?',
      description: 'Event delegation uses bubbling.',
      answer: {
        blocks: [
          {
            type: 'text',
            text: 'Event delegation attaches one listener high in the tree and handles matching descendants as events bubble upward.',
          },
          {
            type: 'text',
            text: 'Example: a todo list can use one listener on the list root instead of one listener per button.',
          },
        ],
      },
      importance: 3,
      difficulty: 'easy',
      technology: 'javascript',
      access,
      tags: ['closures', 'dom-events'],
      updatedAt: '2026-04-02',
    }],
    question: null,
  });

  function toSummary(q: any) {
    return {
      id: q.id,
      title: q.title,
      type: q.type,
      technology: q.technology,
      access: q.access,
      difficulty: q.difficulty,
      tags: q.tags,
      importance: q.importance,
      companies: q.companies || [],
      description: undefined,
      shortDescription: undefined,
    };
  }

  function trackCalls(eventName: string) {
    return analytics.track.calls.allArgs().filter(([name]) => name === eventName);
  }

  function setDocumentHidden(value: boolean) {
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => value,
    });
  }

  function resetTriviaAnalyticsState(component: any) {
    if (component.triviaVisibleIntervalId !== null) {
      window.clearInterval(component.triviaVisibleIntervalId);
      component.triviaVisibleIntervalId = null;
    }

    component.maxTriviaDepthPercent = 0;
    component.trackedTriviaDepths = new Set<number>();
    component.triviaReadEngagedTracked = false;
    component.visibleTriviaMs = 0;
  }

  function dispatchTrackedClick(anchor: HTMLAnchorElement) {
    anchor.addEventListener('click', (event) => event.preventDefault(), { once: true });
    anchor.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  }

  function appendTrackedAnchor(container: Element, href: string, text: string) {
    const anchor = document.createElement('a');
    anchor.setAttribute('href', href);
    anchor.textContent = text;
    container.appendChild(anchor);
    return anchor;
  }

  beforeEach(async () => {
    routeData$ = new ReplaySubject<any>(1);
    bugReport = jasmine.createSpyObj<BugReportService>('BugReportService', ['open']);
    seo = jasmine.createSpyObj<SeoService>('SeoService', ['updateTags', 'buildCanonicalUrl']);
    progress = jasmine.createSpyObj<UserProgressService>('UserProgressService', [
      'isSolved',
      'markSolved',
      'markSolvedLocal',
      'setSolvedIds',
      'solvedIds',
    ]);
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['user', 'isLoggedIn', 'headers']);
    activity = jasmine.createSpyObj<ActivityService>('ActivityService', ['complete', 'uncomplete', 'isCompletionPending']);
    analytics = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', ['track']);
    onboarding = jasmine.createSpyObj<OnboardingService>('OnboardingService', ['getProfile', 'markPending']);
    triviaIncident = jasmine.createSpyObj<TriviaIncidentService>('TriviaIncidentService', ['getIncident', 'answerIncident']);

    progress.isSolved.and.returnValue(false);
    progress.solvedIds.and.returnValue([]);
    progress.markSolved.and.resolveTo();
    progress.markSolvedLocal.and.stub();
    progress.setSolvedIds.and.stub();
    auth.user.and.returnValue(null);
    auth.isLoggedIn.and.returnValue(false);
    activity.complete.and.returnValue(of({ solvedQuestionIds: ['q1'], stats: {} } as any));
    activity.uncomplete.and.returnValue(of({ solvedQuestionIds: [], stats: {}, rollbackApplied: true } as any));
    activity.isCompletionPending.and.returnValue(false);
    onboarding.getProfile.and.returnValue(null);
    triviaIncident.getIncident.and.returnValue(of(null));
    triviaIncident.answerIncident.and.returnValue(of({
      questionId: 'q1',
      tech: 'javascript' as any,
      correct: false,
      feedback: 'Not quite.',
      rereadRecommended: true,
    }));
    seo.buildCanonicalUrl.and.callFake((value: string) => {
      const raw = String(value || '').trim();
      if (!raw) return 'https://frontendatlas.com/';
      if (/^https?:\/\//i.test(raw)) return raw;
      return raw.startsWith('/')
        ? `https://frontendatlas.com${raw}`
        : `https://frontendatlas.com/${raw}`;
    });
    originalPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    originalHiddenDescriptor = Object.getOwnPropertyDescriptor(document, 'hidden');
    window.history.pushState({}, '', '/javascript/trivia/q1');

    await TestBed.configureTestingModule({
      imports: [TriviaDetailComponent, RouterTestingModule, NoopAnimationsModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            data: routeData$.asObservable(),
            parent: { paramMap: of(convertToParamMap({ tech: 'javascript' })) },
            paramMap: of(convertToParamMap({ id: 'q1' })),
          },
        },
        { provide: QuestionService, useValue: { loadQuestions: () => of([]) } },
        { provide: SeoService, useValue: seo },
        { provide: UserProgressService, useValue: progress },
        { provide: AuthService, useValue: auth },
        { provide: ActivityService, useValue: activity },
        { provide: AnalyticsService, useValue: analytics },
        { provide: BugReportService, useValue: bugReport },
        { provide: ExperimentService, useValue: { variant: () => 'control', expose: () => { } } },
        { provide: OnboardingService, useValue: onboarding },
        { provide: TriviaIncidentService, useValue: triviaIncident },
        {
          provide: LifecyclePromptService,
          useValue: {
            thresholdFor: () => 10,
            nextMilestone: () => null,
            markShown: () => { },
            markDismissed: () => { },
            markAccepted: () => { },
          },
        },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    window.history.pushState({}, '', originalPath || '/');
    if (originalHiddenDescriptor) {
      Object.defineProperty(document, 'hidden', originalHiddenDescriptor);
    }
  });

  async function createLoadedFixture(access: 'free' | 'premium' = 'free', extras: Record<string, any> = {}) {
    const resolved = makeResolved(access, extras);
    const currentQuestion = resolved.list[0];
    routeData$.next({
      questionDetail: {
        ...resolved,
        id: currentQuestion.id,
        question: currentQuestion,
      },
    });
    const fixture = TestBed.createComponent(TriviaDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('shows report issue button on unlocked trivia detail', async () => {
    routeData$.next({ questionDetail: makeResolved('free') });

    const fixture = TestBed.createComponent(TriviaDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const reportButton = fixture.nativeElement.querySelector('.report-issue-btn') as HTMLButtonElement | null;
    expect(reportButton).toBeTruthy();
    expect(reportButton?.textContent || '').toContain('Report issue');
  });

  it('renders a question-led H1 intent label without changing meta title or description', async () => {
    const fixture = await createLoadedFixture('free', {
      seo: {
        title: 'JavaScript Closure Interview SEO Title',
        description: 'Practice explaining JavaScript closures in interviews without losing the original question title.',
      },
    });

    const h1 = fixture.nativeElement.querySelector('h1.title') as HTMLElement | null;
    expect(h1?.querySelector('.title__question')?.textContent?.trim()).toBe('What is closure?');
    expect(h1?.querySelector('.title__intent')?.textContent?.trim()).toBe('Frontend interview answer');

    const payload = seo.updateTags.calls.mostRecent().args[0] as any;
    expect(payload.title).toBe('JavaScript Closure Interview SEO Title');
    expect(payload.description).toBe(
      'Practice explaining JavaScript closures in interviews without losing the original question title.',
    );

    const graph = Array.isArray(payload?.jsonLd) ? payload.jsonLd : [];
    const article = graph.find((node: any) => node?.['@type'] === 'TechArticle');
    const faq = graph.find((node: any) => node?.['@type'] === 'FAQPage');
    const qaPage = graph.find((node: any) => node?.['@type'] === 'QAPage');

    expect(article?.headline).toBe('What is closure? - Frontend interview answer');
    expect(faq).toBeUndefined();
    expect(qaPage).toBeUndefined();
  });

  it('uses question-level SEO H1 intent label for visible H1 and article headline', async () => {
    const fixture = await createLoadedFixture('free', {
      seo: {
        title: 'Angular HttpClient unsubscribe: 5 cancellation gotchas',
        description:
          'See the 5 HttpClient cancellation gotchas: unsubscribe aborts, switchMap helps, mergeMap does not, ignored responses still run, and servers may continue.',
        h1IntentLabel: 'Debugging interview answer',
      },
    });

    const h1 = fixture.nativeElement.querySelector('h1.title') as HTMLElement | null;
    expect(h1?.querySelector('.title__question')?.textContent?.trim()).toBe('What is closure?');
    expect(h1?.querySelector('.title__intent')?.textContent?.trim()).toBe('Debugging interview answer');

    const payload = seo.updateTags.calls.mostRecent().args[0] as any;
    const graph = Array.isArray(payload?.jsonLd) ? payload.jsonLd : [];
    const article = graph.find((node: any) => node?.['@type'] === 'TechArticle');

    expect(article?.headline).toBe('What is closure? - Debugging interview answer');
  });

  it('uses question-level SEO H1 override without appending the default intent label', async () => {
    const fixture = await createLoadedFixture('free', {
      seo: {
        title: 'React render nothing: fix null, false, undefined bugs',
        description:
          'Use the return-value map to fix missing returns, JSX holes, numeric && leaks, fragment confusion, and DOM absence tests before interviews.',
        h1: 'React render nothing: return null, false, fragments, and undefined',
      },
    });

    const h1 = fixture.nativeElement.querySelector('h1.title') as HTMLElement | null;
    expect(h1?.querySelector('.title__question')?.textContent?.trim()).toBe(
      'React render nothing: return null, false, fragments, and undefined',
    );
    expect(h1?.querySelector('.title__intent')).toBeNull();

    const payload = seo.updateTags.calls.mostRecent().args[0] as any;
    const graph = Array.isArray(payload?.jsonLd) ? payload.jsonLd : [];
    const article = graph.find((node: any) => node?.['@type'] === 'TechArticle');

    expect(article?.headline).toBe('React render nothing: return null, false, fragments, and undefined');
  });

  it('renders article body card headings as H2 and markdown answer headings as H3', async () => {
    const fixture = await createLoadedFixture('free', {
      answer: {
        blocks: [
          {
            type: 'text',
            text: '## Quick answer\n\nUse this return-value map to debug empty UI: return null for intentional no UI, fix undefined as a missing return, avoid numeric && leaks, use fragments when you need no wrapper, and test absent DOM explicitly.',
          },
          {
            type: 'text',
            text: '## Return value map\n\nReact accepts several ReactNode shapes.',
          },
          {
            type: 'text',
            text: '## Return null or skip rendering the child?\n\nParent conditionals unmount; child null returns keep the decision inside the child.',
          },
          {
            type: 'text',
            text: '## Does return null unmount the component?\n\nNo, not when the parent still renders that component.',
          },
          {
            type: 'text',
            text: '## Component return vs JSX child\n\nComponent returns and JSX child holes have different intent.',
          },
          {
            type: 'text',
            text: '## Further reading\n\nCompare the linked React pages after practicing the answer.',
          },
          {
            type: 'text',
            text: '## Testable proof\n\nAssert absent DOM for intentional no-UI states.',
          },
          {
            type: 'text',
            text: '## FrontendAtlas review note\n\nThis answer is written for interview debugging.',
          },
          {
            type: 'text',
            text: '<strong>Still so complicated?</strong><br><br>Focus on whether the empty output is intentional or accidental.',
          },
          {
            type: 'text',
            text: '<strong>Summary</strong><br><br>Use null for no UI and fix undefined returns.',
          },
        ],
      },
    });

    const h2Text = Array.from(fixture.nativeElement.querySelectorAll('h2.card-head'))
      .map((node: any) => String(node.textContent || '').trim());
    expect(h2Text).toContain('Interview focus');
    expect(h2Text).toContain('Interview quick answer');
    expect(h2Text).toContain('Full interview answer');
    expect(h2Text).toContain('Still so complicated?');
    expect(h2Text).toContain('Summary');

    const h3Text = Array.from(fixture.nativeElement.querySelectorAll('.blocks h3.md-h3'))
      .map((node: any) => String(node.textContent || '').trim());
    expect(h3Text).toContain('Quick answer');
    expect(h3Text).toContain('Return value map');
    expect(h3Text).toContain('Return null or skip rendering the child?');
    expect(h3Text).toContain('Does return null unmount the component?');
    expect(h3Text).toContain('Component return vs JSX child');
    expect(h3Text).toContain('Further reading');
    expect(h3Text).toContain('Testable proof');
    expect(h3Text).toContain('FrontendAtlas review note');
    expect(fixture.nativeElement.textContent || '').toContain('Use this return-value map to debug empty UI');
  });

  it('renders async race answer section headings as H3', async () => {
    const fixture = await createLoadedFixture('free', {
      id: 'js-async-race-conditions',
      title: 'Async Race Conditions and Stale UI Updates',
      description:
        'Debug the production bug where async requests resolve out of order and overwrite newer UI state.',
      technology: 'javascript',
      tags: ['async', 'concurrency', 'cancellation', 'abort-controller', 'ui'],
      answer: {
        blocks: [
          { type: 'text', text: '## The core issue\n\nOlder async work can overwrite newer UI.' },
          { type: 'text', text: '## How to prevent it\n\nCancel old work or guard stale results.' },
          { type: 'text', text: '## When the async work cannot be aborted\n\nUse a latest-version guard.' },
          { type: 'text', text: '## Shared-controller follow-up\n\nRoute cleanup can share one controller.' },
          { type: 'text', text: '## Pitfalls\n\nDebounce is not cancellation.' },
          { type: 'text', text: '## Source check\n\nOfficial references back the cancellation behavior.' },
          { type: 'text', text: '## Testable proof\n\nAssert stale results cannot overwrite newer UI.' },
          { type: 'text', text: '## Production debugging standard\n\nOlder completions cannot update state.' },
        ],
      },
    });

    const h3Text = Array.from(fixture.nativeElement.querySelectorAll('.blocks h3.md-h3'))
      .map((node: any) => String(node.textContent || '').trim());
    expect(h3Text).toContain('The core issue');
    expect(h3Text).toContain('How to prevent it');
    expect(h3Text).toContain('When the async work cannot be aborted');
    expect(h3Text).toContain('Shared-controller follow-up');
    expect(h3Text).toContain('Pitfalls');
    expect(h3Text).toContain('Source check');
    expect(h3Text).toContain('Testable proof');
    expect(h3Text).toContain('Production debugging standard');
  });

  it('uses async race practice-frame copy only for the target question', async () => {
    const targetFixture = await createLoadedFixture('free', {
      id: 'js-async-race-conditions',
      title: 'Async Race Conditions and Stale UI Updates',
      technology: 'javascript',
      tags: ['async', 'concurrency'],
    });

    expect(targetFixture.nativeElement.textContent || '').toContain(
      'Use this drill to explain why debounce alone fails, when AbortController is enough, and when a request-id guard is still required.',
    );
    expect(targetFixture.nativeElement.textContent || '').not.toContain(
      'Use this JavaScript interview question to rehearse a quick answer, common mistake, follow-up, and production pitfall.',
    );

    targetFixture.destroy();

    const nonTargetFixture = await createLoadedFixture('free', {
      id: 'js-event-loop',
      title: 'Explain the JavaScript Event Loop',
      technology: 'javascript',
      tags: ['event-loop'],
    });

    expect(nonTargetFixture.nativeElement.textContent || '').toContain(
      'Use this JavaScript interview question to rehearse a quick answer, common mistake, follow-up, and production pitfall.',
    );
    expect(nonTargetFixture.nativeElement.textContent || '').not.toContain(
      'Use this drill to explain why debounce alone fails, when AbortController is enough, and when a request-id guard is still required.',
    );
  });

  it('renders the async race simulator only for the async race question', async () => {
    const targetFixture = await createLoadedFixture('free', {
      id: 'js-async-race-conditions',
      title: 'Async Race Conditions and Stale UI Updates',
      technology: 'javascript',
      tags: ['async', 'concurrency'],
    });

    const simulator = targetFixture.nativeElement.querySelector('[data-testid="async-race-simulator"]') as HTMLElement | null;
    expect(simulator).toBeTruthy();
    expect(simulator?.querySelector('h2')?.textContent?.trim()).toBe('Async race simulator');
    expect(simulator?.textContent || '').toContain("Stale UI: results for 'rea' overwrite the newer 'react' results.");

    targetFixture.destroy();

    const nonTargetFixture = await createLoadedFixture('free', {
      id: 'js-event-loop',
      title: 'Explain the JavaScript Event Loop',
      technology: 'javascript',
      tags: ['event-loop'],
    });

    expect(nonTargetFixture.nativeElement.querySelector('[data-testid="async-race-simulator"]')).toBeNull();
  });

  it('updates async race simulator output when a strategy is selected', async () => {
    const fixture = await createLoadedFixture('free', {
      id: 'js-async-race-conditions',
      title: 'Async Race Conditions and Stale UI Updates',
      technology: 'javascript',
      tags: ['async', 'concurrency'],
    });

    const simulator = fixture.nativeElement.querySelector('[data-testid="async-race-simulator"]') as HTMLElement;
    expect(simulator.textContent || '').toContain("Stale UI: results for 'rea' overwrite the newer 'react' results.");
    expect(simulator.textContent || '').toContain('A failing test would show final results equal to stale data');

    const requestIdButton = Array.from(simulator.querySelectorAll('.return-simulator__tab'))
      .find((button: any) => String(button.textContent || '').trim() === 'request id guard') as HTMLButtonElement | undefined;
    expect(requestIdButton).toBeTruthy();

    requestIdButton?.click();
    fixture.detectChanges();

    expect(simulator.textContent || '').toContain('Fresh UI: request B owns the screen, so A cannot overwrite it.');
    expect(simulator.textContent || '').toContain('The completion handler compares its id with the latest id before writing state.');
    expect(simulator.textContent || '').toContain("Resolve B, then A; expect(view.results()).toEqual(['React docs']).");
  });

  it('renders the return value simulator only for the render-nothing question', async () => {
    const targetFixture = await createLoadedFixture('free', {
      id: 'react-render-nothing-return-value',
      title: 'Why does a React component sometimes render nothing, and how does React interpret its return value?',
      technology: 'react',
      tags: ['react', 'rendering', 'null', 'conditional', 'components'],
    });

    const simulator = targetFixture.nativeElement.querySelector('[data-testid="return-value-simulator"]') as HTMLElement | null;
    expect(simulator).toBeTruthy();
    expect(simulator?.querySelector('h2')?.textContent?.trim()).toBe('Return value simulator');

    targetFixture.destroy();

    const nonTargetFixture = await createLoadedFixture('free', {
      id: 'react-one-way-data-flow',
      technology: 'react',
      tags: ['react', 'state'],
    });

    expect(nonTargetFixture.nativeElement.querySelector('[data-testid="return-value-simulator"]')).toBeNull();
  });

  it('updates return value simulator output when a segment is selected', async () => {
    const fixture = await createLoadedFixture('free', {
      id: 'react-render-nothing-return-value',
      title: 'Why does a React component sometimes render nothing, and how does React interpret its return value?',
      technology: 'react',
      tags: ['react', 'rendering', 'null', 'conditional', 'components'],
    });

    const simulator = fixture.nativeElement.querySelector('[data-testid="return-value-simulator"]') as HTMLElement;
    expect(simulator.textContent || '').toContain('No DOM output for this component render.');
    expect(simulator.textContent || '').toContain('queryByRole');

    const zeroButton = Array.from(simulator.querySelectorAll('.return-simulator__tab'))
      .find((button: any) => String(button.textContent || '').trim() === '0') as HTMLButtonElement | undefined;
    expect(zeroButton).toBeTruthy();

    zeroButton?.click();
    fixture.detectChanges();

    expect(simulator.textContent || '').toContain('Renders a text node: 0.');
    expect(simulator.textContent || '').toContain("screen.queryByText('0')");
    expect(simulator.textContent || '').toContain('Mounted and visible as text unless your condition prevents it.');
  });

  it('adds async race TechArticle schema fields only for the target question', async () => {
    const targetFixture = await createLoadedFixture('free', {
      id: 'js-async-race-conditions',
      title: 'Async Race Conditions and Stale UI Updates',
      description:
        'Debug the production bug where async requests resolve out of order and overwrite newer UI state.',
      technology: 'javascript',
      tags: ['async', 'concurrency', 'cancellation', 'abort-controller', 'ui'],
      updatedAt: '2026-04-10',
    });

    const payload = seo.updateTags.calls.mostRecent().args[0] as any;
    const graph = Array.isArray(payload?.jsonLd) ? payload.jsonLd : [];
    const article = graph.find((node: any) => node?.['@type'] === 'TechArticle');
    const typeNames = graph.map((node: any) => node?.['@type']);

    expect(typeNames).not.toContain('FAQPage');
    expect(typeNames).not.toContain('QAPage');
    expect(article?.articleSection).toBe('JavaScript async concurrency');
    expect((article?.about || []).map((item: any) => item.name)).toEqual([
      'Async race conditions',
      'Stale UI updates',
      'Request cancellation',
    ]);
    expect((article?.mentions || []).map((item: any) => item.name)).toEqual([
      'AbortController',
      'AbortSignal',
      'request id guard',
      'takeLatest',
      'switchMap',
      'Promise.race',
      'debounce',
      'IndexedDB',
      'autosave',
      'MDN Web Docs',
      'Fetch API',
      'source reference',
      'Jest',
      'stale-result test',
      'production debugging standard',
      'interactive demo',
      'async race simulator',
      'stale UI demo',
      'final UI state',
    ]);
    expect((article?.hasPart || []).map((item: any) => item.name)).toEqual([
      'The core issue',
      'How to prevent it',
      'When async work cannot be aborted',
      'Shared-controller follow-up',
      'Pitfalls',
      'Source check',
      'Testable proof',
      'Production debugging standard',
      'Async race simulator',
    ]);
    expect((article?.citation || []).map((item: any) => item.url)).toEqual([
      'https://developer.mozilla.org/en-US/docs/Web/API/AbortController',
      'https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal',
      'https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch',
      'https://rxjs.dev/api/operators/switchMap',
    ]);

    targetFixture.destroy();

    const nonTargetFixture = await createLoadedFixture('free', {
      id: 'js-event-loop',
      title: 'Explain the JavaScript Event Loop',
      technology: 'javascript',
      tags: ['event-loop'],
    });

    const nonTargetPayload = seo.updateTags.calls.mostRecent().args[0] as any;
    const nonTargetGraph = Array.isArray(nonTargetPayload?.jsonLd) ? nonTargetPayload.jsonLd : [];
    const nonTargetArticle = nonTargetGraph.find((node: any) => node?.['@type'] === 'TechArticle');
    expect(nonTargetArticle?.articleSection).not.toBe('JavaScript async concurrency');
    expect((nonTargetArticle?.mentions || []).map((item: any) => item.name)).not.toContain('AbortController');

    nonTargetFixture.destroy();
  });

  it('adds render-nothing TechArticle schema fields without FAQPage or QAPage markup', async () => {
    const question = {
      id: 'react-render-nothing-return-value',
      title: 'Why does a React component sometimes render nothing, and how does React interpret its return value?',
      description:
        'React renders nothing when a component returns null or false; a fragment renders children without adding a wrapper. Returning undefined usually means a missing return, so fix it instead of using it as intentional empty UI.',
      answer: {
        blocks: [
          {
            type: 'text',
            text: '## Quick answer\n\nReturn null for intentional empty UI.',
          },
        ],
      },
      importance: 2,
      difficulty: 'intermediate',
      technology: 'react',
      access: 'free',
      tags: ['react', 'rendering', 'null', 'conditional', 'components'],
      updatedAt: '2026-06-29',
      seo: {
        title: 'React render nothing: fix null, false, undefined bugs',
        description:
          'Use the return-value map to fix missing returns, JSX holes, numeric && leaks, fragment confusion, and DOM absence tests before interviews.',
        h1: 'React render nothing: return null, false, fragments, and undefined',
      },
    };

    routeData$.next({
      questionDetail: {
        tech: 'react',
        kind: 'trivia',
        id: question.id,
        list: [question],
        question,
      },
    });

    const fixture = TestBed.createComponent(TriviaDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const payload = seo.updateTags.calls.mostRecent().args[0] as any;
    const graph = Array.isArray(payload?.jsonLd) ? payload.jsonLd : [];
    const article = graph.find((node: any) => node?.['@type'] === 'TechArticle');
    const typeNames = graph.map((node: any) => node?.['@type']);

    expect(typeNames).not.toContain('FAQPage');
    expect(typeNames).not.toContain('QAPage');
    expect(article?.articleSection).toBe('React rendering');
    expect((article?.about || []).map((item: any) => item.name)).toEqual([
      'React component return values',
      'Conditional rendering',
      'Rendering nothing',
    ]);
    expect((article?.mentions || []).map((item: any) => item.name)).toEqual([
      'null',
      'false',
      'undefined',
      'Fragment',
      'ReactNode',
      'missing return',
      'short-circuit rendering',
      'parent conditional rendering',
      'JSX holes',
      'mounted component',
      'effects',
      'React Testing Library',
      'DOM absence assertion',
      'editorial review',
      'interactive demo',
      'DOM output',
      'mounted state',
    ]);
    expect((article?.hasPart || []).map((item: any) => item.name)).toEqual([
      'Quick answer',
      'Return value map',
      'Common render-nothing bugs',
      'Code examples',
      'Return value simulator',
      'Return null vs parent conditional rendering',
      'Return null lifecycle notes',
      'Component return vs JSX child semantics',
      'Testable proof',
      'FrontendAtlas review note',
      'Testing and accessibility notes',
    ]);
    expect(article?.citation).toBeUndefined();
  });

  it('renders non-crawlable sidebar buttons and crawlable practice entry links', async () => {
    const fixture = await createLoadedFixture();
    const router = TestBed.inject(Router);
    const navigateSpy = spyOn(router, 'navigate').and.resolveTo(true);

    const sideButton = fixture.nativeElement.querySelector('.side-list button.side-item') as HTMLButtonElement | null;
    expect(sideButton).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.side-list a.side-item')).toBeNull();

    sideButton?.click();
    expect(navigateSpy).toHaveBeenCalledWith(['/', 'javascript', 'trivia', 'q1'], jasmine.objectContaining({
      state: jasmine.objectContaining({
        session: jasmine.objectContaining({
          index: 0,
        }),
      }),
    }));

    const framePrimary = fixture.nativeElement.querySelector('[data-testid="trivia-practice-frame-primary"]') as HTMLAnchorElement | null;
    const framePlan = fixture.nativeElement.querySelector('[data-testid="trivia-practice-frame-plan"]') as HTMLAnchorElement | null;
    const frameHub = fixture.nativeElement.querySelector('[data-testid="trivia-practice-frame-hub"]') as HTMLAnchorElement | null;

    expect(framePrimary?.getAttribute('href') || '').toContain('/javascript/interview-questions');
    expect(framePlan?.getAttribute('href') || '').toContain('/tracks/javascript-prep-path/mastery');
    expect(frameHub?.getAttribute('href') || '').toContain('/interview-questions/essential');
  });

  it('hydrates the current question from a lightweight resolver payload while keeping list entries as summaries', async () => {
    const resolved = makeResolved('free');
    const fullQuestion = resolved.list[0];
    routeData$.next({
      questionDetail: {
        ...resolved,
        list: [],
        listSummaries: resolved.list.map(toSummary),
        question: fullQuestion,
      },
    });

    const fixture = TestBed.createComponent(TriviaDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('h1.title')?.textContent || '').toContain('What is closure?');
    expect(fixture.nativeElement.textContent || '').toContain('Closure captures lexical scope');
    expect(fixture.nativeElement.querySelectorAll('.side-list button.side-item').length).toBe(2);
    expect(fixture.nativeElement.querySelectorAll('.side-list a.side-item').length).toBe(0);
    expect(fixture.nativeElement.querySelector('.similar-list')).toBeTruthy();
    expect((fixture.componentInstance.question() as any)?.answer).toBe(fullQuestion.answer);
    expect((fixture.componentInstance.questionsList[0] as any).answer).toBeUndefined();
  });

  it('keeps a missing lightweight detail in not-found state instead of rendering a summary as the question', async () => {
    const resolved = makeResolved('free');
    routeData$.next({
      questionDetail: {
        ...resolved,
        id: 'missing-question',
        list: [],
        listSummaries: resolved.list.map(toSummary),
        question: null,
      },
    });

    const fixture = TestBed.createComponent(TriviaDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.question()).toBeNull();
    expect(fixture.componentInstance.loadState()).toBe('notFound');
  });

  it('renders unlocked trivia shell with sidebar, similar, guides, and prep bridge blocks', async () => {
    const fixture = await createLoadedFixture();

    expect(fixture.nativeElement.querySelector('.side-list')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="trivia-practice-frame"]')).toBeTruthy();
    expect(fixture.nativeElement.textContent || '').toContain('Interview answer drill');
    expect(fixture.nativeElement.textContent || '').toContain('Interview quick answer');
    expect(fixture.nativeElement.textContent || '').toContain('Full interview answer');
    expect(fixture.nativeElement.querySelector('.similar-list')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.guide-links')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="trivia-prep-entry"]')).toBeTruthy();

    const footerLeft = fixture.nativeElement.querySelector('[data-testid="footer-left"]') as HTMLAnchorElement | null;
    expect(footerLeft?.textContent || '').toContain('Question Library');
    expect(footerLeft?.getAttribute('href') || '').toContain('/coding');
  });

  it('maps trivia detail tech to interview hub routes', () => {
    const fixture = TestBed.createComponent(TriviaDetailComponent);
    const component = fixture.componentInstance;

    component.tech = 'html';
    expect(component.interviewQuestionsHubRoute()).toEqual(['/html/interview-questions']);
    expect(component.interviewQuestionsHubLabel()).toBe('HTML interview questions');

    component.tech = 'css';
    expect(component.interviewQuestionsHubRoute()).toEqual(['/css/interview-questions']);
    expect(component.interviewQuestionsHubLabel()).toBe('CSS interview questions');
  });

  it('shows report access issue action on locked trivia detail', async () => {
    routeData$.next({ questionDetail: makeResolved('premium') });

    const fixture = TestBed.createComponent(TriviaDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const reportButton = fixture.nativeElement.querySelector('.report-issue-btn') as HTMLButtonElement | null;
    expect(reportButton).toBeNull();

    const lockedActions = fixture.nativeElement.querySelector('.locked-actions') as HTMLElement | null;
    expect(lockedActions).toBeTruthy();
    expect(lockedActions?.textContent || '').toContain('Report access issue');

    const lockedHeading = fixture.nativeElement.querySelector('h1.locked-title') as HTMLElement | null;
    expect(lockedHeading?.querySelector('.locked-title__question')?.textContent?.trim()).toBe('What is closure?');
    expect(lockedHeading?.querySelector('.locked-title__intent')?.textContent?.trim()).toBe('Frontend interview answer');
  });

  it('fires trivia scroll depth exactly once per threshold from the main scroll container', fakeAsync(() => {
    routeData$.next({ questionDetail: makeResolved('free') });

    const fixture = TestBed.createComponent(TriviaDetailComponent);
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const component = fixture.componentInstance as any;
    const main = fixture.nativeElement.querySelector('[data-testid="trivia-detail-main"]') as HTMLElement;
    analytics.track.calls.reset();
    resetTriviaAnalyticsState(component);
    spyOn(component, 'computeTriviaScrollDepth').and.returnValues(30, 60, 100, 100);

    main.dispatchEvent(new Event('scroll'));
    main.dispatchEvent(new Event('scroll'));
    main.dispatchEvent(new Event('scroll'));
    main.dispatchEvent(new Event('scroll'));

    const depths = trackCalls('trivia_scroll_depth').map(([, params]) => (params as any).depth_percent);
    expect(depths).toEqual([25, 50, 75, 100]);

    fixture.destroy();
  }));

  it('waits for both time and scroll depth before tracking trivia engaged read', fakeAsync(() => {
    routeData$.next({ questionDetail: makeResolved('free') });

    const fixture = TestBed.createComponent(TriviaDetailComponent);
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const component = fixture.componentInstance as any;
    analytics.track.calls.reset();
    resetTriviaAnalyticsState(component);
    spyOn(component, 'computeTriviaScrollDepth').and.returnValue(60);

    component.startTriviaVisibilityTimer();
    component.onMainScroll();
    tick(29_000);
    expect(trackCalls('trivia_read_engaged').length).toBe(0);

    tick(1_000);
    expect(trackCalls('trivia_read_engaged').length).toBe(1);
    expect(trackCalls('trivia_read_engaged')[0][1]).toEqual(jasmine.objectContaining({
      tech: 'javascript',
      question_id: 'q1',
      question_title: 'What is closure?',
      max_depth_percent: 60,
      seconds_visible: 30,
    }));

    fixture.destroy();
  }));

  it('does not count hidden-tab time toward trivia engaged read', fakeAsync(() => {
    routeData$.next({ questionDetail: makeResolved('free') });

    const fixture = TestBed.createComponent(TriviaDetailComponent);
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const component = fixture.componentInstance as any;
    analytics.track.calls.reset();
    resetTriviaAnalyticsState(component);
    spyOn(component, 'computeTriviaScrollDepth').and.returnValue(60);

    component.startTriviaVisibilityTimer();
    component.onMainScroll();
    setDocumentHidden(true);
    tick(30_000);
    expect(trackCalls('trivia_read_engaged').length).toBe(0);

    setDocumentHidden(false);
    tick(30_000);
    expect(trackCalls('trivia_read_engaged').length).toBe(1);

    fixture.destroy();
  }));

  it('tracks sidebar, mobile nav, similar, guides, prep bridge, and body internal link clicks', async () => {
    const fixture = await createLoadedFixture();
    analytics.track.calls.reset();

    const component = fixture.componentInstance;
    component.openQnav();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const sidebarLink = appendTrackedAnchor(
      fixture.nativeElement.querySelector('.side') as HTMLElement,
      '/javascript/trivia/sidebar-target',
      'Sidebar link',
    );
    const mobileNavLink = appendTrackedAnchor(
      fixture.nativeElement.querySelector('.mobile-qnav__body') as HTMLElement,
      '/javascript/trivia/mobile-target',
      'Mobile nav link',
    );
    const similarLink = appendTrackedAnchor(
      fixture.nativeElement.querySelector('.similar-list') as HTMLElement,
      '/javascript/trivia/similar-target',
      'Similar link',
    );
    (similarLink as HTMLAnchorElement).setAttribute('data-trivia-link-zone', 'similar');
    const guideLink = appendTrackedAnchor(
      fixture.nativeElement.querySelector('.guide-links') as HTMLElement,
      '/guides/interview-blueprint/guide-target',
      'Guide link',
    );
    guideLink.setAttribute('data-trivia-link-zone', 'guides');
    const prepLink = appendTrackedAnchor(
      fixture.nativeElement.querySelector('.prep-bridge__links') as HTMLElement,
      '/tracks/prep-target',
      'Prep link',
    );
    prepLink.setAttribute('data-trivia-link-zone', 'prep_bridge');
    const bodyLink = appendTrackedAnchor(
      fixture.nativeElement.querySelector('.content') as HTMLElement,
      '/guides/interview-blueprint/body-target',
      'Body link',
    );

    [sidebarLink, mobileNavLink, similarLink, guideLink, prepLink, bodyLink].forEach((anchor) => {
      dispatchTrackedClick(anchor);
    });

    const locations = trackCalls('trivia_internal_link_clicked').map(([, params]) => (params as any).location);
    expect(locations).toEqual(['sidebar', 'mobile_nav', 'similar', 'guides', 'prep_bridge', 'body']);
  });

  it('ignores external links and same-page hash links', async () => {
    const fixture = await createLoadedFixture();
    analytics.track.calls.reset();

    const contentHost = fixture.nativeElement.querySelector('.content') as HTMLElement;
    const hashLink = document.createElement('a');
    hashLink.setAttribute('href', '#answer');
    hashLink.textContent = 'Hash link';
    const externalLink = document.createElement('a');
    externalLink.setAttribute('href', 'https://example.com/external');
    externalLink.textContent = 'External link';
    contentHost.append(hashLink, externalLink);

    dispatchTrackedClick(hashLink);
    dispatchTrackedClick(externalLink);

    expect(trackCalls('trivia_internal_link_clicked').length).toBe(0);
  });

  it('adds interview context fields to TechArticle json-ld', async () => {
    routeData$.next({ questionDetail: makeResolved('free') });

    const fixture = TestBed.createComponent(TriviaDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(seo.updateTags).toHaveBeenCalled();
    const payload = seo.updateTags.calls.mostRecent().args[0] as any;
    const graph = Array.isArray(payload?.jsonLd) ? payload.jsonLd : [];
    const article = graph.find((node: any) => node?.['@type'] === 'TechArticle');

    expect(article).toBeTruthy();
    expect(article?.headline).toBe('What is closure? - Frontend interview answer');
    expect(graph.some((node: any) => node?.['@type'] === 'FAQPage')).toBeFalse();
    expect(String(article?.isPartOf?.url || '')).toContain('/javascript/interview-questions');
    expect(Array.isArray(article?.about)).toBeTrue();
    expect(Array.isArray(article?.mentions)).toBeTrue();
    expect((article.about || []).some((entry: any) =>
      String(entry?.name || '').toLowerCase().includes('frontend interview preparation')
    )).toBeTrue();
    expect((article.mentions || []).some((entry: any) =>
      String(entry?.url || '').includes('/tracks')
    )).toBeTrue();
    expect((article.mentions || []).some((entry: any) =>
      String(entry?.url || '').includes('/companies')
    )).toBeTrue();
  });

  it('opens bug report flow from report issue action', async () => {
    routeData$.next({ questionDetail: makeResolved('free') });

    const fixture = TestBed.createComponent(TriviaDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const reportButton = fixture.nativeElement.querySelector('.report-issue-btn') as HTMLButtonElement;
    reportButton.click();

    expect(bugReport.open).toHaveBeenCalledWith(jasmine.objectContaining({
      source: 'trivia_detail',
      tech: 'javascript',
      questionId: 'q1',
      questionTitle: 'What is closure?',
    }));
  });

  it('opens incident prompt before completion when incident card exists', async () => {
    triviaIncident.getIncident.and.returnValue(of({
      questionId: 'q1',
      tech: 'javascript' as any,
      title: 'Root Cause Check',
      scenario: 'Users report UI freezes after a release.',
      options: [
        { id: 'a', label: 'Large image dimensions' },
        { id: 'b', label: 'Recursive microtask chain never yielding to render' },
        { id: 'c', label: 'Slow DNS lookup' },
      ],
    }));
    routeData$.next({
      questionDetail: makeResolved('free'),
    });

    const fixture = TestBed.createComponent(TriviaDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    await fixture.componentInstance.markComplete();

    expect(fixture.componentInstance.incidentPromptOpen).toBeTrue();
    expect(triviaIncident.getIncident).toHaveBeenCalledWith('javascript', 'q1');
    expect(progress.markSolved).not.toHaveBeenCalled();
  });

  it('requires correct incident answer before marking as complete', async () => {
    auth.isLoggedIn.and.returnValue(true);
    triviaIncident.getIncident.and.returnValue(of({
      questionId: 'q1',
      tech: 'javascript' as any,
      title: 'Root Cause Check',
      scenario: 'Users report UI freezes after a release.',
      options: [
        { id: 'a', label: 'Large image dimensions' },
        { id: 'b', label: 'Recursive microtask chain never yielding to render' },
        { id: 'c', label: 'Slow DNS lookup' },
      ],
    }));
    triviaIncident.answerIncident.and.callFake((_tech: any, _id: any, optionId: string) => {
      if (optionId === 'b') {
        return of({
          questionId: 'q1',
          tech: 'javascript' as any,
          correct: true,
          feedback: 'Correct root cause. You can mark this question as completed.',
          rereadRecommended: false,
        });
      }
      return of({
        questionId: 'q1',
        tech: 'javascript' as any,
        correct: false,
        feedback: 'Not quite. Re-read and try again.',
        rereadRecommended: true,
      });
    });
    routeData$.next({
      questionDetail: makeResolved('free'),
    });

    const fixture = TestBed.createComponent(TriviaDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    await fixture.componentInstance.markComplete();
    fixture.componentInstance.selectIncidentOption('a');
    await fixture.componentInstance.submitIncidentChoice();
    expect(fixture.componentInstance.incidentOutcome()).toBe('wrong');
    expect(triviaIncident.answerIncident).toHaveBeenCalledWith('javascript', 'q1', 'a');
    expect(progress.markSolved).not.toHaveBeenCalled();
    expect(fixture.componentInstance.solved()).toBeFalse();

    fixture.componentInstance.selectIncidentOption('b');
    await fixture.componentInstance.submitIncidentChoice();
    expect(triviaIncident.answerIncident).toHaveBeenCalledWith('javascript', 'q1', 'b');
    expect(progress.setSolvedIds).toHaveBeenCalledWith(['q1']);
    expect(activity.complete).toHaveBeenCalled();
    expect(fixture.componentInstance.solved()).toBeTrue();
  });

  it('uses activity rollback when marking a solved trivia question incomplete', async () => {
    progress.isSolved.and.returnValue(true);
    progress.solvedIds.and.returnValue(['q1']);
    auth.isLoggedIn.and.returnValue(true);
    auth.user.and.returnValue({ _id: 'user-1' } as any);
    routeData$.next({ questionDetail: makeResolved('free') });

    const fixture = TestBed.createComponent(TriviaDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.solved()).toBeTrue();

    await fixture.componentInstance.markComplete();

    expect(activity.uncomplete).toHaveBeenCalledWith({
      kind: 'trivia',
      tech: 'javascript',
      itemId: 'q1',
    });
    expect(fixture.componentInstance.solved()).toBeFalse();
  });
});
