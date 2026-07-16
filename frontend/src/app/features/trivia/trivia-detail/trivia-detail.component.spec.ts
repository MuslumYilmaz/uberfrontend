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
    expect(h1?.textContent?.trim()).toBe('What is closure?');
    expect(h1?.querySelector('.title__intent')).toBeNull();
    expect(fixture.nativeElement.querySelector('.title-copy > .title__intent')?.textContent?.trim()).toBe(
      'Frontend interview answer',
    );

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
    expect(article?.isAccessibleForFree).toBeTrue();
    expect(payload.robots).toBeUndefined();
    expect(faq).toBeUndefined();
    expect(qaPage).toBeUndefined();
  });

  it('marks premium trivia content noindex without accepted-answer schema, even for premium users', async () => {
    auth.user.and.returnValue({ accessTier: 'premium' } as any);

    await createLoadedFixture('premium', {
      id: 'js-async-race-conditions',
      title: 'Fix stale UI from async race conditions',
    });

    const payload = seo.updateTags.calls.mostRecent().args[0] as any;
    const graph = Array.isArray(payload?.jsonLd) ? payload.jsonLd : [];
    const article = graph.find((node: any) => node?.['@type'] === 'TechArticle');
    const questionSchema = graph.find((node: any) => node?.['@type'] === 'Question');

    expect(payload.robots).toBe('noindex,follow');
    expect(payload.canonical).toBe('https://frontendatlas.com/javascript/trivia/js-async-race-conditions');
    expect(article?.isAccessibleForFree).toBeFalse();
    expect(questionSchema).toBeUndefined();
  });

  it('keeps internal company tags out of trivia metadata and structured-data keywords', async () => {
    await createLoadedFixture('free', {
      companies: ['google'],
      companyTags: ['meta'],
    });

    const payload = seo.updateTags.calls.mostRecent().args[0] as any;
    const graph = Array.isArray(payload?.jsonLd) ? payload.jsonLd : [];
    const article = graph.find((node: any) => node?.['@type'] === 'TechArticle');

    expect(payload.keywords).toContain('closures');
    expect(payload.keywords).not.toContain('google');
    expect(payload.keywords).not.toContain('meta');
    expect(String(article?.keywords || '')).not.toContain('google');
    expect(String(article?.keywords || '')).not.toContain('meta');
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
    expect(h1?.textContent?.trim()).toBe('What is closure?');
    expect(h1?.querySelector('.title__intent')).toBeNull();
    expect(fixture.nativeElement.querySelector('.title-copy > .title__intent')?.textContent?.trim()).toBe(
      'Debugging interview answer',
    );

    const payload = seo.updateTags.calls.mostRecent().args[0] as any;
    const graph = Array.isArray(payload?.jsonLd) ? payload.jsonLd : [];
    const article = graph.find((node: any) => node?.['@type'] === 'TechArticle');

    expect(article?.headline).toBe('What is closure? - Debugging interview answer');
  });

  it('uses question-level SEO H1 override without appending the default intent label', async () => {
    const fixture = await createLoadedFixture('free', {
      seo: {
        title: 'Can React Return undefined? React 18 vs null',
        description:
          'React 18+ permits undefined component returns. Practice when it renders nothing, why null is clearer, how React 17 differed, and lint catches return bugs.',
        h1: 'Can React Components Return undefined? React 18 vs null',
      },
    });

    const h1 = fixture.nativeElement.querySelector('h1.title') as HTMLElement | null;
    expect(h1?.querySelector('.title__question')?.textContent?.trim()).toBe(
      'Can React Components Return undefined? React 18 vs null',
    );
    expect(h1?.textContent?.trim()).toBe(
      'Can React Components Return undefined? React 18 vs null',
    );
    expect(h1?.querySelector('.title__intent')).toBeNull();
    expect(fixture.nativeElement.querySelector('.title-copy > .title__intent')).toBeNull();

    const payload = seo.updateTags.calls.mostRecent().args[0] as any;
    const graph = Array.isArray(payload?.jsonLd) ? payload.jsonLd : [];
    const article = graph.find((node: any) => node?.['@type'] === 'TechArticle');

    expect(article?.headline).toBe('Can React Components Return undefined? React 18 vs null');
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
    expect(h3Text).not.toContain('Further reading');
    expect(h3Text).toContain('Testable proof');
    expect(h3Text).toContain('FrontendAtlas review note');
    expect(fixture.nativeElement.textContent || '').toContain('Use this return-value map to debug empty UI');
  });

  it('renders quick answer before interview focus and practice frame', async () => {
    const fixture = await createLoadedFixture('free');
    const root = fixture.nativeElement as HTMLElement;
    const titleBlock = root.querySelector('.title-block') as HTMLElement | null;
    const practiceFrame = root.querySelector('[data-testid="trivia-practice-frame"]') as HTMLElement | null;
    const heads = Array.from(root.querySelectorAll('h2.card-head')) as HTMLElement[];
    const quickHead = heads.find((head) => head.textContent?.trim() === 'Interview quick answer') ?? null;
    const focusHead = heads.find((head) => head.textContent?.trim() === 'Interview focus') ?? null;
    const fullHead = heads.find((head) => head.textContent?.trim() === 'Full interview answer') ?? null;
    const isBefore = (left: Element | null, right: Element | null) =>
      Boolean(left && right && (left.compareDocumentPosition(right) & Node.DOCUMENT_POSITION_FOLLOWING));

    expect(isBefore(titleBlock, quickHead)).toBeTrue();
    expect(isBefore(quickHead, focusHead)).toBeTrue();
    expect(isBefore(focusHead, practiceFrame)).toBeTrue();
    expect(isBefore(practiceFrame, fullHead)).toBeTrue();
  });

  it('adds mobile stacked-table labels to wide answer tables', async () => {
    const fixture = await createLoadedFixture('free', {
      answer: {
        blocks: [
          {
            type: 'list',
            columns: ['Operator', 'What it checks', 'Coercion', 'Example'],
            rows: [
              ['<code>==</code>', 'Value after conversion', 'Yes', "<code>'5' == 5</code>"],
            ],
          },
        ],
      },
    });

    const table = fixture.nativeElement.querySelector('table.table') as HTMLTableElement | null;
    const cells = Array.from(fixture.nativeElement.querySelectorAll('table.table tbody td')) as HTMLTableCellElement[];

    expect(table?.classList.contains('table--stacked-mobile')).toBeTrue();
    expect(cells.map((cell) => cell.getAttribute('data-label'))).toEqual([
      'Operator',
      'What it checks',
      'Coercion',
      'Example',
    ]);
  });

  it('renders equality answer section headings as H3', async () => {
    const fixture = await createLoadedFixture('free', {
      id: 'js-equality-vs-strict-equality',
      title: 'What is the difference between == and === in JavaScript?',
      technology: 'javascript',
      tags: ['operators', 'comparison', 'types', 'javascript'],
      answer: {
        blocks: [
          { type: 'text', text: '## Core idea\n\nUse === by default.' },
          { type: 'text', text: '## Loose equality\n\nLoose equality can coerce operands.' },
          { type: 'text', text: '## How == decides\n\nLoose equality follows a decision order.' },
          { type: 'text', text: '## Strict equality\n\nStrict equality does not coerce operands.' },
          { type: 'text', text: '## Beyond ===: Object.is and SameValueZero\n\nOther equality models matter for NaN and collections.' },
          { type: 'text', text: '## Pitfalls\n\nWatch nullish values, NaN, and references.' },
          { type: 'text', text: '## Practical rule\n\nConvert boundary values explicitly.' },
          { type: 'text', text: '## FrontendAtlas review note\n\nBoundary coercion is reviewed as a debugging rule.' },
          { type: 'text', text: '## Equality predictor\n\nCompare edge cases across equality models.' },
        ],
      },
    });

    const h3Text = Array.from(fixture.nativeElement.querySelectorAll('.blocks h3.md-h3'))
      .map((node: any) => String(node.textContent || '').trim());
    expect(h3Text).toContain('Core idea');
    expect(h3Text).toContain('Loose equality');
    expect(h3Text).toContain('How == decides');
    expect(h3Text).toContain('Strict equality');
    expect(h3Text).toContain('Beyond ===: Object.is and SameValueZero');
    expect(h3Text).toContain('Pitfalls');
    expect(h3Text).toContain('Practical rule');
    expect(h3Text).not.toContain('Source check');
    expect(h3Text).toContain('FrontendAtlas review note');
    expect(h3Text).toContain('Equality predictor');
  });

  it('renders external source links from markdown with safe blank-target attributes', async () => {
    const fixture = await createLoadedFixture('free', {
      answer: {
        blocks: [
          {
            type: 'text',
            text:
              '## Source check\n\nRead [MDN Equality](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Equality).',
          },
        ],
      },
    });

    const link = fixture.nativeElement.querySelector(
      '.blocks a[href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Equality"]'
    ) as HTMLAnchorElement | null;
    const sourceCheck = fixture.nativeElement.querySelector('.source-check[data-nosnippet]') as HTMLElement | null;

    expect(sourceCheck).toBeTruthy();
    expect(link?.textContent?.trim()).toBe('MDN Equality');
    expect(link?.getAttribute('target')).toBe('_blank');
    expect(link?.getAttribute('rel') || '').toContain('noopener');
    expect(link?.getAttribute('rel') || '').toContain('noreferrer');
  });

  it('renders safe raw html anchors as links without exposing literal anchor text', async () => {
    const fixture = await createLoadedFixture('free', {
      answer: {
        blocks: [
          {
            type: 'text',
            text:
              '## Source check\n\nIn Angular tests, use <a href="https://angular.dev/api/common/http/testing/TestRequest" target="_blank" rel="noopener"><code>TestRequest.cancelled</code></a> as the proof point.',
          },
        ],
      },
    });

    const root = fixture.nativeElement as HTMLElement;
    const link = root.querySelector(
      '.blocks a[href="https://angular.dev/api/common/http/testing/TestRequest"]'
    ) as HTMLAnchorElement | null;
    const sourceCheck = root.querySelector('.source-check[data-nosnippet]') as HTMLElement | null;

    expect(sourceCheck).toBeTruthy();
    expect(link).toBeTruthy();
    expect(link?.textContent?.trim()).toBe('TestRequest.cancelled');
    expect(link?.querySelector('code')?.textContent?.trim()).toBe('TestRequest.cancelled');
    expect(link?.getAttribute('target')).toBe('_blank');
    expect(link?.getAttribute('rel') || '').toContain('noopener');
    expect(link?.getAttribute('rel') || '').toContain('noreferrer');
    expect(root.querySelector('.blocks')?.textContent || '').not.toContain('<a href=');
  });

  it('keeps unsafe raw html anchors escaped instead of making them clickable', async () => {
    const fixture = await createLoadedFixture('free', {
      answer: {
        blocks: [
          {
            type: 'text',
            text:
              '## Unsafe source\n\nDo not render <a href="javascript:alert(1)" target="_blank" rel="noopener">unsafe docs</a> as a link.',
          },
        ],
      },
    });

    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('.blocks a[href^="javascript:"]')).toBeNull();
    expect(root.querySelector('.blocks')?.textContent || '').toContain('<a href="javascript:alert(1)"');
  });

  it('renders async race answer section headings as H3', async () => {
    const fixture = await createLoadedFixture('free', {
      id: 'js-async-race-conditions',
      title: 'Async Race Conditions and Stale UI Updates',
      description:
        'Async race conditions happen when an older request or async task resolves after a newer one and overwrites fresh UI.',
      technology: 'javascript',
      tags: ['async', 'concurrency', 'cancellation', 'abort-controller', 'ui'],
      seo: {
        h1: 'Async Race Conditions and Stale UI Updates',
      },
      answer: {
        blocks: [
          { type: 'text', text: '## The core issue\n\nOlder async work can overwrite newer UI.' },
          { type: 'text', text: '## How to prevent it\n\nCancel old work or guard stale results.' },
          { type: 'text', text: '## Before / after: stale search UI\n\nShow the stale search bug and the guarded fix.' },
          { type: 'text', text: '## React useEffect cleanup version\n\nUse a cleanup flag for stale state writes.' },
          { type: 'text', text: '## Choosing the right guard\n\nPick the guard by ownership and cancellation support.' },
          { type: 'text', text: '## When the async work cannot be aborted\n\nUse a latest-version guard.' },
          { type: 'text', text: '## Shared-controller follow-up\n\nRoute cleanup can share one controller.' },
          { type: 'text', text: '## Pitfalls\n\nDebounce is not cancellation.' },
          { type: 'text', text: '## Source check\n\nCompare this answer with MDN AbortController, the React useEffect page, and the RxJS switchMap operator page.' },
          { type: 'text', text: '## Testable proof\n\nAssert stale results cannot overwrite newer UI.' },
          { type: 'text', text: '## FrontendAtlas review note\n\nReviewed as a frontend debugging rule.' },
          { type: 'text', text: '## Production debugging standard\n\nOlder completions cannot update state.' },
        ],
      },
    });

    const h1 = fixture.nativeElement.querySelector('h1.title') as HTMLElement | null;
    expect(h1?.querySelector('.title__question')?.textContent?.trim()).toBe(
      'Async Race Conditions and Stale UI Updates',
    );
    expect(h1?.textContent?.trim()).toBe('Async Race Conditions and Stale UI Updates');
    expect(h1?.querySelector('.title__intent')).toBeNull();
    expect(fixture.nativeElement.querySelector('.title-copy > .title__intent')).toBeNull();
    expect(fixture.nativeElement.querySelector('.main-stack--async-race')).toBeTruthy();

    const h2Text = Array.from(fixture.nativeElement.querySelectorAll('h2.card-head'))
      .map((node: any) => String(node.textContent || '').trim());
    expect(h2Text).toContain('How to prevent stale async UI');
    expect(h2Text).not.toContain('Full interview answer');

    const h3Text = Array.from(fixture.nativeElement.querySelectorAll('.blocks h3.md-h3'))
      .map((node: any) => String(node.textContent || '').trim());
    expect(h3Text).toContain('The core issue');
    expect(h3Text).toContain('How to prevent it');
    expect(h3Text).toContain('Before / after: stale search UI');
    expect(h3Text).toContain('React useEffect cleanup version');
    expect(h3Text).toContain('Choosing the right guard');
    expect(h3Text).toContain('When the async work cannot be aborted');
    expect(h3Text).toContain('Shared-controller follow-up');
    expect(h3Text).toContain('Pitfalls');
    expect(h3Text).toContain('Source check');
    expect(h3Text).toContain('Testable proof');
    expect(h3Text).toContain('FrontendAtlas review note');
    expect(h3Text).toContain('Production debugging standard');

    const sourceCheck = fixture.nativeElement.querySelector('.source-check[data-nosnippet]') as HTMLElement | null;
    expect(sourceCheck).toBeTruthy();
    expect(sourceCheck?.textContent || '').not.toContain('official docs');
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
    expect(simulator?.querySelector('.async-race-timeline')).toBeTruthy();
    expect(simulator?.textContent || '').toContain('rea request starts');
    expect(simulator?.textContent || '').toContain('UI write allowed');
    expect(simulator?.textContent || '').toContain('stale write');
    expect(simulator?.textContent || '').toContain("Stale UI: results for 'rea' overwrite the newer 'react' results.");
    expect(simulator?.textContent || '').toContain('Maintained by FrontendAtlas Editorial');
    expect(simulator?.textContent || '').toContain('Cross-checked with MDN/React/RxJS pages');
    expect(simulator?.textContent || '').toContain('Race verified by deterministic test');

    targetFixture.destroy();

    const nonTargetFixture = await createLoadedFixture('free', {
      id: 'js-event-loop',
      title: 'Explain the JavaScript Event Loop',
      technology: 'javascript',
      tags: ['event-loop'],
    });

    expect(nonTargetFixture.nativeElement.querySelector('[data-testid="async-race-simulator"]')).toBeNull();
    expect(nonTargetFixture.nativeElement.querySelector('.async-race-proof-strip')).toBeNull();
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
    expect(simulator.textContent || '').toContain('UI write blocked');
    expect(simulator.textContent || '').toContain('guarded');
    expect(simulator.textContent || '').toContain('The completion handler compares its id with the latest id before writing state.');
    expect(simulator.textContent || '').toContain("Resolve B, then A; expect(view.results()).toEqual(['React results']).");
    const blockedSteps = simulator.querySelectorAll('.async-race-timeline__step--blocked');
    expect(blockedSteps.length).toBeGreaterThan(0);
  });

  it('renders the equality predictor only for the equality question with default model results', async () => {
    const targetFixture = await createLoadedFixture('free', {
      id: 'js-equality-vs-strict-equality',
      title: 'What is the difference between == and === in JavaScript?',
      technology: 'javascript',
      tags: ['operators', 'comparison', 'types', 'javascript'],
    });

    const predictor = targetFixture.nativeElement.querySelector('[data-testid="equality-predictor"]') as HTMLElement | null;
    expect(predictor).toBeTruthy();
    expect(predictor?.querySelector('h2')?.textContent?.trim()).toBe('Equality predictor');
    expect(predictor?.textContent || '').toContain("'5' vs 5");
    expect(predictor?.textContent || '').toContain('String is coerced to number.');
    expect(Array.from(predictor?.querySelectorAll('.equality-predictor__result .return-simulator__label') || [])
      .map((node: any) => String(node.textContent || '').trim())).toEqual([
        '==',
        '===',
        'Object.is',
        'SameValueZero',
      ]);

    targetFixture.destroy();

    const nonTargetFixture = await createLoadedFixture('free', {
      id: 'js-event-loop',
      title: 'Explain the JavaScript Event Loop',
      technology: 'javascript',
      tags: ['event-loop'],
    });

    expect(nonTargetFixture.nativeElement.querySelector('[data-testid="equality-predictor"]')).toBeNull();
  });

  it('updates equality predictor results for NaN and signed zero edge cases', async () => {
    const fixture = await createLoadedFixture('free', {
      id: 'js-equality-vs-strict-equality',
      title: 'What is the difference between == and === in JavaScript?',
      technology: 'javascript',
      tags: ['operators', 'comparison', 'types', 'javascript'],
    });

    const predictor = fixture.nativeElement.querySelector('[data-testid="equality-predictor"]') as HTMLElement;
    const clickScenario = (label: string) => {
      const button = Array.from(predictor.querySelectorAll('.return-simulator__tab'))
        .find((node: any) => String(node.textContent || '').trim() === label) as HTMLButtonElement | undefined;
      expect(button).toBeTruthy();
      button?.click();
      fixture.detectChanges();
    };
    const resultFor = (model: string) => {
      const card = Array.from(predictor.querySelectorAll('.equality-predictor__result'))
        .find((node: any) => String(node.querySelector('.return-simulator__label')?.textContent || '').trim() === model) as HTMLElement | undefined;
      return String(card?.querySelector('.equality-predictor__boolean')?.textContent || '').trim();
    };

    clickScenario('NaN vs NaN');
    expect(resultFor('==')).toBe('false');
    expect(resultFor('===')).toBe('false');
    expect(resultFor('Object.is')).toBe('true');
    expect(resultFor('SameValueZero')).toBe('true');

    clickScenario('+0 vs -0');
    expect(resultFor('==')).toBe('true');
    expect(resultFor('===')).toBe('true');
    expect(resultFor('Object.is')).toBe('false');
    expect(resultFor('SameValueZero')).toBe('true');
  });

  it('renders the return value simulator only for the render-nothing question', async () => {
    const targetFixture = await createLoadedFixture('free', {
      id: 'react-render-nothing-return-value',
      title: 'Can a React component return undefined?',
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
      title: 'Can a React component return undefined?',
      technology: 'react',
      tags: ['react', 'rendering', 'null', 'conditional', 'components'],
    });

    const simulator = fixture.nativeElement.querySelector('[data-testid="return-value-simulator"]') as HTMLElement;
    expect(simulator.textContent || '').toContain('No DOM output for this component render.');
    expect(simulator.textContent || '').toContain('queryByRole');

    const undefinedButton = Array.from(simulator.querySelectorAll('.return-simulator__tab'))
      .find((button: any) => String(button.textContent || '').trim() === 'undefined') as HTMLButtonElement | undefined;
    expect(undefinedButton).toBeTruthy();

    undefinedButton?.click();
    fixture.detectChanges();

    expect(simulator.textContent || '').toContain('React 18+: no DOM output.');
    expect(simulator.textContent || '').toContain('React 17 and earlier could throw');
    expect(simulator.textContent || '').toContain('TypeScript and linting');

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
        'Async race conditions happen when an older request or async task resolves after a newer one and overwrites fresh UI.',
      technology: 'javascript',
      tags: ['async', 'concurrency', 'cancellation', 'abort-controller', 'ui'],
      publishedAt: '2026-04-10',
      updatedAt: '2026-07-03',
    });

    const payload = seo.updateTags.calls.mostRecent().args[0] as any;
    const graph = Array.isArray(payload?.jsonLd) ? payload.jsonLd : [];
    const article = graph.find((node: any) => node?.['@type'] === 'TechArticle');
    const questionSchema = graph.find((node: any) => node?.['@type'] === 'Question');
    const typeNames = graph.map((node: any) => node?.['@type']);

    expect(typeNames).toContain('Question');
    expect(typeNames).not.toContain('FAQPage');
    expect(typeNames).not.toContain('QAPage');
    expect(article?.articleSection).toBe('JavaScript async concurrency');
    expect(article?.educationalLevel).toBe('Intermediate');
    expect(article?.learningResourceType).toBe('Interview answer');
    expect(article?.author).toEqual({ '@type': 'Organization', name: 'FrontendAtlas Editorial' });
    expect(article?.reviewedBy).toBeUndefined();
    expect(article?.datePublished).toBe('2026-04-10T00:00:00.000Z');
    expect(article?.dateModified).toBe('2026-07-03T00:00:00.000Z');
    expect((article?.about || []).map((item: any) => item.name)).toEqual([
      'Async race conditions',
      'Stale UI updates',
      'Request cancellation',
    ]);
    expect((article?.mentions || []).map((item: any) => item.name)).toEqual([
      'AbortController',
      'AbortSignal',
      'React useEffect cleanup',
      'AbortError',
      'search-as-you-type',
      'visual race timeline',
      'request id guard',
      'takeLatest',
      'switchMap',
      'Promise.race',
      'debounce',
      'IndexedDB',
      'autosave',
      'Fetch API',
    ]);
    expect((article?.hasPart || []).map((item: any) => item.name)).toEqual([
      'The core issue',
      'How to prevent it',
      'Before / after: stale search UI',
      'React useEffect cleanup version',
      'Choosing the right guard',
      'When async work cannot be aborted',
      'Shared-controller follow-up',
      'Pitfalls',
      'Source check',
      'Testable proof',
      'FrontendAtlas review note',
      'Production debugging standard',
      'Async race visual timeline',
      'Async race simulator',
    ]);
    expect((article?.citation || []).map((item: any) => item.url)).toEqual([
      'https://developer.mozilla.org/en-US/docs/Web/API/AbortController',
      'https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal',
      'https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch',
      'https://react.dev/reference/react/useEffect',
      'https://rxjs.dev/api/operators/switchMap',
      'https://frontendatlas.com/legal/editorial',
    ]);
    expect(questionSchema?.name).toBe('Async Race Conditions and Stale UI Updates');
    expect(questionSchema?.acceptedAnswer?.['@type']).toBe('Answer');
    expect(questionSchema?.acceptedAnswer?.text).toBe(
      'Async race conditions happen when an older request or async task resolves after a newer one and overwrites fresh UI. Fix stale updates with AbortController cancellation, a latest request-id check, or takeLatest-style ownership so only the newest result can render.',
    );

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

  it('adds NgRx selector TechArticle and Question schema without FAQPage or QAPage markup', async () => {
    const question = {
      id: 'ngrx-selectors-memoization-derived-state-performance',
      title: 'NgRx selectors beyond getting state: memoization, derived state, and Angular performance',
      description:
        'NgRx selectors are memoized projections for derived state; this answer traces four selector boundaries, shows a projector test, and flags the mistakes that cause component churn.',
      answer: {
        blocks: [
          {
            type: 'text',
            text:
              '## Memoized read model\n\nSelectors compose feature state into reusable view models.',
          },
          {
            type: 'text',
            text:
              '## Worked example\n\nStart with a feature selector, then compose focused selectors into a view model.',
          },
          {
            type: 'text',
            text:
              '## Failure pattern\n\n- Mutating reducer state breaks selector expectations.',
          },
          {
            type: 'text',
            text:
              '## Selector purity and projector tests\n\nA selector projector should be a pure function.',
          },
          {
            type: 'text',
            text:
              '## Testable proof\n\nA focused projector test proves the selector contract.',
          },
          {
            type: 'text',
            text:
              '## Projector run trace\n\nTrace whether unrelated updates rerun projectors.',
          },
          {
            type: 'text',
            text:
              '## Selector factory boundary\n\nUse selector factories only for stable parameters.',
          },
          {
            type: 'text',
            text:
              '## Selector review checklist\n\n- Keep input selectors narrow.',
          },
          {
            type: 'text',
            text:
              '## FrontendAtlas review note\n\nReview selectors by reducer references and component boundaries.',
          },
          {
            type: 'text',
            text:
              '## Source check\n\nCompare this answer with the NgRx <a href="https://ngrx.io/guide/store/selectors" target="_blank" rel="noopener">selectors guide</a> and <a href="https://ngrx.io/api/store/createSelector" target="_blank" rel="noopener"><code>createSelector</code> API page</a>.',
          },
          {
            type: 'text',
            text:
              '## Interview summary\n\nNgRx selectors are a memoized read-model layer.',
          },
        ],
      },
      importance: 4,
      difficulty: 'intermediate',
      technology: 'angular',
      access: 'free',
      tags: ['angular', 'store', 'selectors', 'memoization', 'performance'],
      updatedAt: '2026-04-19',
      seo: {
        title: 'NgRx selector memoization: why projectors rerun',
        description:
          'Trace 4 NgRx selector memoization paths, test projector logic, and avoid common Angular component churn mistakes with a focused interview answer.',
      },
    };

    routeData$.next({
      questionDetail: {
        tech: 'angular',
        kind: 'trivia',
        id: question.id,
        list: [question],
        listSummaries: [toSummary(question)],
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
    const questionSchema = graph.find((node: any) => node?.['@type'] === 'Question');
    const typeNames = graph.map((node: any) => node?.['@type']);

    expect(payload.title).toBe('NgRx selector memoization: why projectors rerun');
    expect(payload.description).toBe(
      'Trace 4 NgRx selector memoization paths, test projector logic, and avoid common Angular component churn mistakes with a focused interview answer.',
    );
    expect(`${payload.title} ${payload.description}`.toLowerCase()).not.toContain('official docs');
    expect(`${payload.title} ${payload.description}`.toLowerCase()).not.toContain('documentation');
    expect(`${payload.title} ${payload.description}`.toLowerCase()).not.toContain('docs wording');
    expect(payload.canonical).toBe(
      'https://frontendatlas.com/angular/trivia/ngrx-selectors-memoization-derived-state-performance',
    );

    const quickAnswerText = String(
      fixture.nativeElement.querySelector('.card .content')?.textContent || ''
    );
    expect(quickAnswerText).toContain('traces four selector boundaries');
    expect(quickAnswerText).toContain('projector test');
    expect(quickAnswerText).toContain('component churn');

    expect(typeNames).not.toContain('FAQPage');
    expect(typeNames).not.toContain('QAPage');
    expect(article?.articleSection).toBe('Angular state management');
    expect((article?.about || []).map((item: any) => item.name)).toEqual([
      'NgRx selectors',
      'selector memoization',
      'derived state',
      'immutable reducer outputs',
    ]);
    expect((article?.mentions || []).map((item: any) => item.name)).toEqual([
      'createSelector',
      'createFeatureSelector',
      'feature selector',
      'entity/base selectors',
      'view model selector',
      'projector function',
      'stable references',
      'root state selection',
      'filter/sort/map derivation',
      'selector factory',
      'projector tests',
      'selector purity',
      'component contract',
      'AsyncPipe',
      'selector projector',
      'memoization trace',
      'NgRx selectors guide',
      'primary source link',
      'projector unit test',
      'FrontendAtlas review note',
      'review evidence',
      'editorial policy',
      'interactive memoization trace',
      'selector recomputation simulator',
      'projector run visualization',
    ]);
    expect((article?.hasPart || []).map((item: any) => item.name)).toEqual([
      'Interview quick answer',
      'Memoized read model',
      'Worked example',
      'Failure pattern',
      'Composed selector flow',
      'Memoization behavior',
      'Selector purity and projector tests',
      'Testable proof',
      'Projector run trace',
      'Selector performance pitfalls',
      'Selector factory boundary',
      'Selector review checklist',
      'FrontendAtlas review note',
      'Source check',
      'Selector memoization trace simulator',
      'Interview summary',
    ]);
    expect((article?.citation || []).map((item: any) => item.url)).toEqual([
      'https://ngrx.io/guide/store/selectors',
      'https://ngrx.io/api/store/createSelector',
      'https://frontendatlas.com/legal/editorial-policy',
    ]);
    expect(questionSchema).toEqual(jasmine.objectContaining({
      '@id': 'https://frontendatlas.com/angular/trivia/ngrx-selectors-memoization-derived-state-performance#question',
      name: question.title,
      url: 'https://frontendatlas.com/angular/trivia/ngrx-selectors-memoization-derived-state-performance',
      acceptedAnswer: jasmine.objectContaining({
        '@type': 'Answer',
        text: jasmine.stringMatching(/^NgRx selectors are memoized, pure projection functions/),
      }),
    }));
    expect(questionSchema?.acceptedAnswer?.text).toContain('projector unit tests prove the derived contract');
    expect(JSON.stringify(graph).toLowerCase()).not.toContain('official docs');
    expect(JSON.stringify(graph).toLowerCase()).not.toContain('documentation');
    expect(JSON.stringify(graph).toLowerCase()).not.toContain('docs wording');

    const h3Text = Array.from(fixture.nativeElement.querySelectorAll('.blocks h3.md-h3'))
      .map((node: any) => String(node.textContent || '').trim());
    expect(h3Text).toEqual([
      'Memoized read model',
      'Worked example',
      'Failure pattern',
      'Selector purity and projector tests',
      'Testable proof',
      'Projector run trace',
      'Selector factory boundary',
      'Selector review checklist',
      'FrontendAtlas review note',
      'Source check',
      'Interview summary',
    ]);

    const h1 = fixture.nativeElement.querySelector('h1.title') as HTMLElement | null;
    expect(h1?.textContent?.trim()).toBe(question.title);
    expect(h1?.querySelector('.title__intent')).toBeNull();
    expect(fixture.nativeElement.querySelector('.title-copy > .title__intent')?.textContent?.trim()).toBe(
      'Frontend interview answer',
    );

    const sourceCheck = fixture.nativeElement.querySelector('.source-check[data-nosnippet]') as HTMLElement | null;
    expect(sourceCheck).toBeTruthy();
    expect((sourceCheck?.textContent || '').toLowerCase()).not.toContain('official docs');
    expect((sourceCheck?.textContent || '').toLowerCase()).not.toContain('official ngrx');
    const sourceLinks = Array.from(sourceCheck?.querySelectorAll('a') || []) as HTMLAnchorElement[];
    expect(sourceLinks.map((link) => link.getAttribute('href'))).toEqual([
      'https://ngrx.io/guide/store/selectors',
      'https://ngrx.io/api/store/createSelector',
    ]);
    expect(sourceLinks.map((link) => link.textContent?.trim())).toEqual([
      'selectors guide',
      'createSelector API page',
    ]);

    const simulator = fixture.nativeElement.querySelector(
      '[data-testid="selector-trace-simulator"]'
    ) as HTMLElement | null;
    expect(simulator).toBeTruthy();
    expect(simulator?.textContent || '').toContain('Component selects the whole root store.');
    expect(simulator?.textContent || '').toContain('Rebuilt');

    const atomicButton = Array.from(simulator!.querySelectorAll('button'))
      .find((button: any) => String(button.textContent || '').trim() === 'Atomic selectors') as HTMLButtonElement | undefined;
    expect(atomicButton).toBeTruthy();
    atomicButton!.click();
    fixture.detectChanges();

    expect(simulator?.textContent || '').toContain('Projector is skipped and the cached result is reused.');
    expect(simulator?.textContent || '').toContain('Stable');
    expect(simulator?.textContent || '').toContain('Good memoization boundary for unrelated updates.');
  });

  it('adds NgRx data flow TechArticle and Question schema without FAQPage or QAPage markup', async () => {
    const question = {
      id: 'ngrx-data-flow-end-to-end-angular',
      title: 'NgRx data flow end-to-end in Angular: actions, reducers, effects, selectors',
      description:
        'NgRx data flow in Angular is a 5-step, DevTools-traceable loop: component action dispatch, immutable reducer state diff, effect success/failure result, selector VM, and template loading/data/error/retry UI.',
      answer: {
        blocks: [
          {
            type: 'text',
            text:
              '## Operational loop\n\nNgRx is most useful when you explain it as a debuggable one-way loop that matches a DevTools trace: component action dispatch, immutable reducer state diff, effect success/failure result, selector VM, and template loading/data/error/retry UI.',
          },
          {
            type: 'list',
            columns: ['Step', 'Who does it', 'What happens', 'Why it matters'],
            rows: [
              ['1. UI intent', 'Component', 'Dispatches an action', 'Intent is traceable'],
              ['2. State transition', 'Reducer', 'Returns immutable state', 'Updates stay predictable'],
            ],
            caption: 'NgRx data flow diagram (end-to-end loop)',
          },
          {
            type: 'code',
            language: 'typescript',
            code: "export const loadBooks = createAction('[Books Page] Load Books');",
          },
          {
            type: 'code',
            language: 'typescript',
            code: 'on(loadBooks, state => ({ ...state, loading: true }))',
          },
          {
            type: 'code',
            language: 'typescript',
            code: 'loadBooks$ = createEffect(() => this.actions$.pipe(ofType(loadBooks)));',
          },
          {
            type: 'code',
            language: 'typescript',
            code: 'export const selectVm = createSelector(selectBooks, books => ({ books }));',
          },
          {
            type: 'code',
            language: 'typescript',
            code: 'readonly vm$ = this.store.select(selectVm);',
          },
          {
            type: 'list',
            columns: ['Common mistake', 'Why it breaks', 'Fix'],
            rows: [
              ['Putting HTTP in reducers', 'Reducers must be synchronous and pure', 'Move async work to effects'],
              ['Doing heavy mapping in components', 'Duplicates logic', 'Use memoized selectors'],
            ],
            caption: 'What interviewers flag quickly',
            stackOnMobile: true,
          },
          {
            type: 'text',
            text:
              '## Pure reducer update vs effect-driven async update\n\nReducers update flags synchronously. Effects handle API work.',
          },
          {
            type: 'text',
            text:
              '## Compact trace you should be able to say out loud\n\nLoad Books click -> loadBooks action -> reducer -> effect -> selector -> template.',
          },
          {
            type: 'text',
            text:
              '## Selectors are memoized read models\n\nA selector is the read layer for the component view model.',
          },
          {
            type: 'text',
            text:
              '## When this loop is worth the ceremony\n\nUse NgRx when state is shared, long-lived, async-heavy, or needs replayable debugging.',
          },
          {
            type: 'list',
            columns: ['State pressure', 'Use NgRx when', 'Keep local when'],
            rows: [
              ['Shared ownership', 'Multiple screens depend on the same entity state', 'One component owns it'],
              ['Debug/audit need', 'Action history and state diffs matter', 'It is a local UI toggle'],
            ],
            caption: 'NgRx ceremony decision check',
            stackOnMobile: true,
          },
          {
            type: 'text',
            text:
              '## Store state vs selector view model\n\nStore state is durable truth; selectors expose the exact read model.',
          },
          {
            type: 'list',
            columns: ['Layer', 'Owns', 'Avoid'],
            rows: [
              ['Store state', 'Raw/domain state', 'Filtered UI-only copies'],
              ['Selector view model', 'Derived render data', 'Component-local mapping'],
            ],
            caption: 'Store truth vs selector read model',
            stackOnMobile: true,
          },
          {
            type: 'text',
            text:
              '## Where this plugs into Angular\n\nRegister the feature reducer and effects at the Angular boundary.',
          },
          {
            type: 'code',
            language: 'typescript',
            code: "export const booksFeatureProviders = [provideState('books', booksReducer), provideEffects(BooksEffects)];",
          },
          {
            type: 'text',
            text:
              '## Debugging an NgRx loop in DevTools\n\nThe action log, state diff, effect result, selector output, and template state should tell the same story.',
          },
          {
            type: 'list',
            columns: ['Debug point', 'What to inspect', 'Bad signal'],
            rows: [
              ['Action log', 'loadBooks then success or failure', 'No action appears'],
              ['Selector output', 'selectVm exposes render model', 'Component rebuilds arrays'],
            ],
            caption: 'NgRx DevTools debugging trace',
            stackOnMobile: true,
          },
          {
            type: 'text',
            text:
              '## Failure path and retry UI trace\n\nThe effect dispatches failure, the reducer records error, the selector exposes retry state, and retry dispatches loadBooks again.',
          },
          {
            type: 'list',
            columns: ['Step', 'State/action', 'UI result'],
            rows: [
              ['API fails', 'loadBooksFailure({ error })', 'Error state is stored'],
              ['User retries', 'Retry button dispatches loadBooks()', 'The same loop restarts'],
            ],
            caption: 'Failure action to retry UI trace',
            stackOnMobile: true,
          },
          {
            type: 'text',
            text:
              '## Interactive DevTools trace visual\n\nUse the interactive trace below to inspect action log, reducer state diff, effect result, selector VM, template state, and retry path.',
          },
          {
            type: 'text',
            text:
              '## Testable proof\n\nA focused reducer and selector test should prove the failure path without bootstrapping Angular.',
          },
          {
            type: 'code',
            language: 'typescript',
            code: "expect(selectVm.projector([], false, 'Network error')).toEqual({ canRetry: true });",
          },
          {
            type: 'text',
            text:
              '## FrontendAtlas review note\n\nWhen we review an NgRx data-flow answer, we look for concrete boundaries.',
          },
          {
            type: 'text',
            text:
              '## Source check\n\nCompare this answer with the NgRx <a href="https://ngrx.io/guide/store/actions" target="_blank" rel="noopener">Actions guide</a>, <a href="https://ngrx.io/guide/store/reducers" target="_blank" rel="noopener">Reducers guide</a>, <a href="https://ngrx.io/guide/effects" target="_blank" rel="noopener">Effects guide</a>, and <a href="https://ngrx.io/guide/store/selectors" target="_blank" rel="noopener">Selectors guide</a>. FrontendAtlas content is maintained under the <a href="/legal/editorial-policy">Editorial Policy</a>.',
          },
          {
            type: 'text',
            text:
              '## Interview summary\n\nComponents dispatch actions, reducers compute state, effects handle async work, selectors expose read models, and templates render output.',
          },
        ],
      },
      importance: 5,
      difficulty: 'intermediate',
      technology: 'angular',
      access: 'free',
      tags: ['angular', 'store', 'selectors', 'effects', 'state-management'],
      updatedAt: '2026-04-10',
      seo: {
        title: 'NgRx Data Flow in Angular: From Action to Retry UI',
        description:
          'See how one Load Books click travels through action, reducer state diff, effect success/failure, selector VM, template render, and retry UI.',
      },
    };

    routeData$.next({
      questionDetail: {
        tech: 'angular',
        kind: 'trivia',
        id: question.id,
        list: [question],
        listSummaries: [toSummary(question)],
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
    const breadcrumb = graph.find((node: any) => node?.['@type'] === 'BreadcrumbList');
    const questionSchema = graph.find((node: any) => node?.['@type'] === 'Question');
    const typeNames = graph.map((node: any) => node?.['@type']);

    expect(payload.title).toBe('NgRx Data Flow in Angular: From Action to Retry UI');
    expect(payload.description).toBe(
      'See how one Load Books click travels through action, reducer state diff, effect success/failure, selector VM, template render, and retry UI.',
    );
    expect(payload.canonical).toBe('https://frontendatlas.com/angular/trivia/ngrx-data-flow-end-to-end-angular');

    expect(typeNames).toContain('BreadcrumbList');
    expect(typeNames).toContain('TechArticle');
    expect(typeNames).toContain('Question');
    expect(typeNames).not.toContain('FAQPage');
    expect(typeNames).not.toContain('QAPage');
    expect(breadcrumb?.itemListElement?.[2]?.item).toBe(
      'https://frontendatlas.com/angular/trivia/ngrx-data-flow-end-to-end-angular',
    );

    expect(article?.articleSection).toBe('Angular state management');
    expect(article?.educationalLevel).toBe('Intermediate');
    expect(article?.learningResourceType).toBe('Interview answer');
    expect(article?.author).toEqual({ '@type': 'Organization', name: 'FrontendAtlas Editorial' });
    expect(article?.reviewedBy).toBeUndefined();
    expect((article?.about || []).map((item: any) => item.name)).toEqual([
      'NgRx data flow',
      'Angular state management',
      'one-way data flow',
      'immutable state updates',
      'shared state',
      'state vs view model',
      'interactive DevTools trace',
      'retry UI trace',
    ]);
    expect((article?.mentions || []).map((item: any) => item.name)).toEqual([
      'actions',
      'reducers',
      'effects',
      'selectors',
      'Store',
      'createAction',
      'createReducer',
      'createEffect',
      'ofType',
      'switchMap',
      'createSelector',
      'createFeatureSelector',
      'AsyncPipe',
      'OnPush change detection',
      'success/failure actions',
      'view model selector',
      'action naming',
      'debug loop',
      'local UI state',
      'feature state registration',
      'provideState',
      'provideEffects',
      'DevTools trace',
      'state diff',
      'failure action',
      'error state',
      'retry UI',
      'retry button',
      'testable proof',
      'reducer test',
      'selector projector test',
      'FrontendAtlas review note',
      'source check',
      'official NgRx guides',
      'editorial policy',
      'interactive DevTools trace',
      'state diff proof',
      'retry UI trace',
      'selector VM proof',
    ]);
    expect((article?.hasPart || []).map((item: any) => item.name)).toEqual([
      'Interview quick answer',
      'Operational loop',
      'NgRx data flow diagram (end-to-end loop)',
      'Actions example',
      'Reducer example',
      'Effect example',
      'Selectors example',
      'Component example',
      'What interviewers flag quickly',
      'Pure reducer update vs effect-driven async update',
      'Compact trace you should be able to say out loud',
      'Selectors are memoized read models',
      'When this loop is worth the ceremony',
      'NgRx ceremony decision check',
      'Store state vs selector view model',
      'Store truth vs selector read model',
      'Where this plugs into Angular',
      'Debugging an NgRx loop in DevTools',
      'NgRx DevTools debugging trace',
      'Failure path and retry UI trace',
      'Failure action to retry UI trace',
      'NgRx DevTools trace visual',
      'Testable proof',
      'FrontendAtlas review note',
      'Source check',
      'Interview summary',
    ]);
    expect((article?.citation || []).map((item: any) => item.url)).toEqual([
      'https://ngrx.io/guide/store/actions',
      'https://ngrx.io/guide/store/reducers',
      'https://ngrx.io/guide/effects',
      'https://ngrx.io/guide/store/selectors',
      'https://frontendatlas.com/legal/editorial-policy',
    ]);

    expect(questionSchema).toEqual(jasmine.objectContaining({
      '@id': 'https://frontendatlas.com/angular/trivia/ngrx-data-flow-end-to-end-angular#question',
      name: question.title,
      url: 'https://frontendatlas.com/angular/trivia/ngrx-data-flow-end-to-end-angular',
      inLanguage: 'en',
      acceptedAnswer: jasmine.objectContaining({
        '@type': 'Answer',
        text: jasmine.stringMatching(/^NgRx data flow in Angular is a 5-step, DevTools-traceable loop/),
      }),
    }));
    expect(questionSchema?.acceptedAnswer?.text).toContain('immutable reducer state diff');
    expect(questionSchema?.acceptedAnswer?.text).toContain('selector VM');
    expect(questionSchema?.acceptedAnswer?.text).toContain('template loading/data/error/retry UI');

    const quickAnswerText = String(
      fixture.nativeElement.querySelector('.card .content')?.textContent || ''
    );
    expect(quickAnswerText).toContain('5-step');
    expect(quickAnswerText).toContain('DevTools-traceable');
    expect(quickAnswerText).toContain('component action dispatch');
    expect(quickAnswerText).toContain('immutable reducer state diff');
    expect(quickAnswerText).toContain('selector VM');
    expect(quickAnswerText).toContain('retry UI');

    const h3Text = Array.from(fixture.nativeElement.querySelectorAll('.blocks h3.md-h3'))
      .map((node: any) => String(node.textContent || '').trim());
    expect(h3Text).toEqual([
      'Operational loop',
      'Pure reducer update vs effect-driven async update',
      'Compact trace you should be able to say out loud',
      'Selectors are memoized read models',
      'When this loop is worth the ceremony',
      'Store state vs selector view model',
      'Where this plugs into Angular',
      'Debugging an NgRx loop in DevTools',
      'Failure path and retry UI trace',
      'Interactive DevTools trace visual',
      'Testable proof',
      'FrontendAtlas review note',
      'Source check',
      'Interview summary',
    ]);

    const dataFlowTrace = fixture.nativeElement.querySelector('[data-testid="ngrx-data-flow-trace"]') as HTMLElement | null;
    expect(dataFlowTrace).toBeTruthy();
    expect(dataFlowTrace?.textContent || '').toContain('[Books Page] Load Books');
    expect(dataFlowTrace?.textContent || '').toContain('The user intent appears first as a named action');

    const failureButton = Array.from(dataFlowTrace!.querySelectorAll('.return-simulator__tab'))
      .find((button: any) => String(button.textContent || '').trim() === 'Effect failure') as HTMLButtonElement | undefined;
    expect(failureButton).toBeTruthy();
    failureButton!.click();
    fixture.detectChanges();

    expect(dataFlowTrace?.textContent || '').toContain('[Books API] Load Books Failure');
    expect(dataFlowTrace?.textContent || '').toContain("loadBooksFailure({ error: 'Network error' })");
    expect(dataFlowTrace?.textContent || '').toContain("canRetry: true");
    expect(dataFlowTrace?.textContent || '').toContain('Try again button');
    expect(dataFlowTrace?.textContent || '').toContain('retry dispatches loadBooks again');

    const sourceCheck = fixture.nativeElement.querySelector('.source-check[data-nosnippet]') as HTMLElement | null;
    expect(sourceCheck).toBeTruthy();
    const sourceLinks = Array.from(sourceCheck?.querySelectorAll('a') || []) as HTMLAnchorElement[];
    expect(sourceLinks.map((link) => link.getAttribute('href'))).toEqual([
      'https://ngrx.io/guide/store/actions',
      'https://ngrx.io/guide/store/reducers',
      'https://ngrx.io/guide/effects',
      'https://ngrx.io/guide/store/selectors',
      '/legal/editorial-policy',
    ]);
    expect(sourceLinks.map((link) => link.textContent?.trim())).toEqual([
      'Actions guide',
      'Reducers guide',
      'Effects guide',
      'Selectors guide',
      'Editorial Policy',
    ]);

    const findTableByCaption = (caption: string): HTMLTableElement | null => {
      const figure = Array.from(fixture.nativeElement.querySelectorAll('figure.b-list'))
        .find((node: any) => String(node.textContent || '').includes(caption)) as HTMLElement | undefined;
      return figure?.querySelector('table.table') as HTMLTableElement | null;
    };

    [
      'What interviewers flag quickly',
      'NgRx ceremony decision check',
      'Store truth vs selector read model',
      'NgRx DevTools debugging trace',
      'Failure action to retry UI trace',
    ].forEach((caption) => {
      expect(findTableByCaption(caption)?.classList.contains('table--stacked-mobile')).toBeTrue();
    });
  });

  it('adds Angular forms schema and stacks target comparison tables on mobile', async () => {
    const question = {
      id: 'angular-template-driven-vs-reactive-forms-which-scales',
      title: 'Template-Driven vs Reactive Forms in Angular: Which One Scales and Why?',
      description:
        'Reactive forms scale better for large or dynamic Angular forms because the form model, validators, and state transitions live explicitly in TypeScript.',
      answer: {
        blocks: [
          {
            type: 'text',
            text:
              '## Source of truth\n\nReactive forms scale better for large or dynamic Angular forms because the model lives in TypeScript. Use 5 practical signals to know when an Angular form outgrows ngModel: source of truth, validation state, dynamic fields, testability, and migration timing. When those signals accumulate, an ngModel-based template-driven form has usually reached the point where a reactive model is easier to change and test.',
          },
          {
            type: 'text',
            text:
              '## Worked example\n\nA checkout flow with conditional sections is easier to scale with reactive forms.',
          },
          {
            type: 'text',
            text:
              '## Decision rule\n\n<ul><li>Use template-driven forms for small forms.</li><li>Use reactive forms when fields are dynamic.</li></ul>',
          },
          {
            type: 'list',
            columns: ['Dimension', 'Template-driven', 'Reactive'],
            rows: [
              ['Where the model lives', 'In the template', 'In TypeScript'],
              ['Validation', 'Template-based', 'Function-based'],
            ],
            caption: 'Template-driven vs reactive forms',
            stackOnMobile: true,
          },
          {
            type: 'text',
            text: '## Template-driven example\n\nSmall and mostly static.',
          },
          {
            type: 'code',
            language: 'html',
            code: '<form #f="ngForm">\n  <input name="email" ngModel required email />\n</form>',
          },
          {
            type: 'text',
            text: '## Reactive example\n\nExplicit TypeScript model.',
          },
          {
            type: 'code',
            language: 'typescript',
            code: "form = new FormGroup({\n  email: new FormControl('', [Validators.required])\n});",
          },
          {
            type: 'text',
            text:
              '## Scaling pressure points\n\n<ul><li>Dynamic fields.</li><li>Cross-field validation.</li><li>Testable validation logic.</li></ul>',
          },
          {
            type: 'text',
            text:
              '## Data flow timing\n\nReactive forms connect each input directly to a control instance: <code>input</code> event -> CVA -> <code>FormControl</code> -> <code>valueChanges</code>.',
          },
          {
            type: 'text',
            text:
              '## Interactive form flow comparator\n\nThe comparator below turns the abstract choice into four traces: reactive input updates, template-driven updates, validation state, and migration triggers.',
          },
          {
            type: 'text',
            text:
              '## Validation state and error UX\n\nBoth approaches expose <code>touched</code>, <code>dirty</code>, <code>pristine</code>, <code>valid</code>, and <code>invalid</code>.',
          },
          {
            type: 'text',
            text:
              '## API ergonomics\n\n<code>FormBuilder</code>, <code>setValue</code>, <code>patchValue</code>, <code>reset</code>, and custom validator functions keep workflow changes in TypeScript.',
          },
          {
            type: 'text',
            text:
              '## Migration threshold checklist\n\nUse this as a practical threshold, not a style preference.',
          },
          {
            type: 'list',
            columns: ['Signal', 'Stay template-driven', 'Move reactive'],
            rows: [
              ['Dynamic rows', 'One fixed fieldset', 'Users can add/remove rows'],
              ['Cross-field rule', 'Single-field checks', 'Rules compare controls'],
              ['Async validator', 'No server lookup', 'Checks call an API'],
              ['Draft/autosave', 'Submit once', 'Save intermediate states'],
              ['Unit-tested business rule', 'Template-only validation', 'Pure TypeScript tests'],
            ],
            caption: 'Migration threshold checklist',
            stackOnMobile: true,
          },
          {
            type: 'text',
            text:
              '## Same form, three changes later\n\nThe migration point appears when state transitions are easier to model than infer from directives.',
          },
          {
            type: 'list',
            columns: ['Step', 'New requirement', 'Best fit'],
            rows: [
              ['Step 1', 'Email and password checks', 'Template-driven is acceptable'],
              ['Step 2', 'Company users reveal VAT fields', 'Either works'],
              ['Step 3', 'Users can add multiple shipping rows', 'Reactive form'],
              ['Step 4', 'Async coupon check and draft restore', 'Reactive model'],
            ],
            caption: 'Same form progression',
            stackOnMobile: true,
          },
          {
            type: 'list',
            columns: ['Real-world requirement', 'Template-driven', 'Reactive'],
            rows: [
              ['Dynamic rows', 'High setup', 'Built-in support'],
              ['Unit testing', 'Requires template rendering', 'Pure TypeScript tests'],
            ],
            caption: 'Large-form tradeoffs',
            stackOnMobile: true,
          },
          {
            type: 'text',
            text:
              '## Architecture fit\n\n<ul><li><code>OnPush</code> change detection.</li><li>Observable-based workflows.</li></ul>',
          },
          {
            type: 'text',
            text:
              '## When template-driven forms are still OK\n\n<ul><li>Very small forms.</li><li>Quick internal tools.</li></ul>',
          },
          {
            type: 'text',
            text:
              '## Senior-level pitfalls\n\n<ul><li>Mixing both approaches in the same form.</li></ul>',
          },
          {
            type: 'text',
            text:
              '## Testable proof\n\nReactive form rules can be checked without rendering the template.',
          },
          {
            type: 'code',
            language: 'typescript',
            code:
              "const email = new FormControl('', [Validators.required, Validators.email]);\n\nemail.setValue('not-an-email');\nemail.markAsTouched();\n\nexpect(email.invalid).toBeTrue();\nexpect(email.hasError('email')).toBeTrue();",
          },
          {
            type: 'text',
            text:
              '## FrontendAtlas review note\n\nWhen we review Angular forms answers, we look for where the form model lives and whether the workflow can be tested without rendering the template.',
          },
          {
            type: 'text',
            text:
              '## Source check\n\nCompare this answer with Angular\'s <a href="https://angular.dev/guide/forms" target="_blank" rel="noopener">forms guide</a>, <a href="https://angular.dev/guide/forms/reactive-forms" target="_blank" rel="noopener">reactive forms guide</a>, <a href="https://angular.dev/guide/forms/template-driven-forms" target="_blank" rel="noopener">template-driven forms guide</a>, and <a href="https://angular.dev/guide/forms/form-validation" target="_blank" rel="noopener">form validation guide</a>. FrontendAtlas content is maintained under the <a href="/legal/editorial-policy">Editorial Policy</a>.',
          },
          {
            type: 'text',
            text:
              '## Practice next\n\nUse the <a href="/guides/framework-prep/angular-prep-path">Angular prep path</a>, <a href="/angular/coding/angular-contact-form-starter">Angular contact form starter</a>, <a href="/angular/coding/angular-multi-step-form-starter">Angular multi-step form starter</a>, and <a href="/angular/trivia/angular-controlvalueaccessor-vs-custom-two-way-binding">ControlValueAccessor vs two-way binding</a>.',
          },
          {
            type: 'text',
            text: '## Interview summary\n\nReactive forms are the better default once workflows need explicit state.',
          },
        ],
      },
      importance: 4,
      difficulty: 'intermediate',
      technology: 'angular',
      access: 'free',
      tags: ['angular', 'forms', 'reactive-forms', 'template-driven', 'basics'],
      updatedAt: '2026-07-04',
      seo: {
        title: 'Reactive vs Template-Driven Forms: When ngModel Stops Scaling',
        description:
          'Use 5 practical signals for when an Angular form outgrows ngModel: source of truth, validation state, dynamic fields, testability, and migration timing.',
      },
    };

    routeData$.next({
      questionDetail: {
        tech: 'angular',
        kind: 'trivia',
        id: question.id,
        list: [question],
        listSummaries: [toSummary(question)],
        question,
      },
    });

    const fixture = TestBed.createComponent(TriviaDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const h3Text = Array.from(fixture.nativeElement.querySelectorAll('.blocks h3.md-h3'))
      .map((node: any) => String(node.textContent || '').trim());
    expect(h3Text).toEqual([
      'Source of truth',
      'Worked example',
      'Decision rule',
      'Template-driven example',
      'Reactive example',
      'Scaling pressure points',
      'Data flow timing',
      'Interactive form flow comparator',
      'Validation state and error UX',
      'API ergonomics',
      'Migration threshold checklist',
      'Same form, three changes later',
      'Architecture fit',
      'When template-driven forms are still OK',
      'Senior-level pitfalls',
      'Testable proof',
      'FrontendAtlas review note',
      'Source check',
      'Practice next',
      'Interview summary',
    ]);

    const stackedTables = Array.from(
      fixture.nativeElement.querySelectorAll('table.table.table--stacked-mobile')
    ) as HTMLTableElement[];
    expect(stackedTables.length).toBe(4);
    const firstTableCells = Array.from(stackedTables[0].querySelectorAll('tbody td')) as HTMLTableCellElement[];
    expect(firstTableCells.map((cell) => cell.getAttribute('data-label')).slice(0, 3)).toEqual([
      'Dimension',
      'Template-driven',
      'Reactive',
    ]);
    expect(fixture.nativeElement.textContent).toContain('Migration threshold checklist');
    expect(fixture.nativeElement.textContent).toContain('5 practical signals');
    expect(fixture.nativeElement.textContent).toContain('outgrows ngModel');
    expect(fixture.nativeElement.textContent).toContain('source of truth, validation state, dynamic fields, testability, and migration timing');
    expect(fixture.nativeElement.textContent).toContain('Dynamic rows');
    expect(fixture.nativeElement.textContent).toContain('Same form progression');
    expect(fixture.nativeElement.textContent).toContain('Step 1');
    expect(fixture.nativeElement.textContent).toContain('Email and password checks');
    expect(fixture.nativeElement.textContent).toContain('Reactive form rules can be checked without rendering the template');
    expect(fixture.nativeElement.textContent).toContain('When we review Angular forms answers');
    expect(fixture.nativeElement.textContent).toContain('Editorial Policy');
    expect(fixture.nativeElement.textContent).toContain('The comparator below turns the abstract choice into four traces');
    expect(fixture.nativeElement.textContent).toContain('Angular prep path');
    expect(fixture.nativeElement.textContent).not.toContain('❌');
    expect(fixture.nativeElement.textContent).not.toContain('✅');
    expect(fixture.nativeElement.textContent).not.toContain('⚠️');
    const codeText = Array.from(fixture.nativeElement.querySelectorAll('pre code'))
      .map((node: any) => String(node.textContent || ''))
      .join('\n');
    expect(codeText).toContain("email.setValue('not-an-email')");
    expect(codeText).toContain('email.markAsTouched()');
    expect(codeText).toContain("email.hasError('email')");
    expect(
      fixture.nativeElement.querySelector('a[href="https://angular.dev/guide/forms"]')
    ).toBeTruthy();
    expect(
      fixture.nativeElement.querySelector('a[href="https://angular.dev/guide/forms/reactive-forms"]')
    ).toBeTruthy();
    expect(
      fixture.nativeElement.querySelector('a[href="https://angular.dev/guide/forms/template-driven-forms"]')
    ).toBeTruthy();
    expect(
      fixture.nativeElement.querySelector('a[href="https://angular.dev/guide/forms/form-validation"]')
    ).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/legal/editorial-policy"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/guides/framework-prep/angular-prep-path"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/angular/coding/angular-contact-form-starter"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/angular/coding/angular-multi-step-form-starter"]')).toBeTruthy();
    expect(
      fixture.nativeElement.querySelector('a[href="/angular/trivia/angular-controlvalueaccessor-vs-custom-two-way-binding"]')
    ).toBeTruthy();

    const payload = seo.updateTags.calls.mostRecent().args[0] as any;
    const graph = Array.isArray(payload?.jsonLd) ? payload.jsonLd : [];
    const article = graph.find((node: any) => node?.['@type'] === 'TechArticle');
    const questionSchema = graph.find((node: any) => node?.['@type'] === 'Question');
    const typeNames = graph.map((node: any) => node?.['@type']);

    expect(typeNames).toContain('Question');
    expect(typeNames).not.toContain('FAQPage');
    expect(typeNames).not.toContain('QAPage');
    expect(article?.articleSection).toBe('Angular forms');
    expect(article?.educationalLevel).toBe('Intermediate');
    expect(article?.learningResourceType).toBe('Interview answer');
    expect(article?.author).toEqual({ '@type': 'Organization', name: 'FrontendAtlas Editorial' });
    expect(article?.reviewedBy).toBeUndefined();
    expect((article?.about || []).map((item: any) => item.name)).toEqual([
      'Angular forms',
      'Template-driven forms',
      'Reactive forms',
      'Form model source of truth',
    ]);
    expect((article?.mentions || []).map((item: any) => item.name)).toEqual([
      'ngModel',
      'ngModelChange',
      'FormGroup',
      'FormControl',
      'FormArray',
      'valueChanges',
      'FormBuilder',
      'Validators',
      'setValue',
      'patchValue',
      'reset',
      'two-way binding',
      'cross-field validation',
      'dynamic controls',
      'dirty',
      'touched',
      'pristine',
      'valid',
      'invalid',
      'custom validator',
      'async validator',
      'draft autosave',
      'migration threshold',
      'OnPush change detection',
      'Observable-based workflows',
      'ControlValueAccessor',
      'unit testing',
      'Angular forms guide',
      'Angular form validation',
      'editorial policy',
      'review evidence',
      'interactive form flow comparator',
      'reactive input update trace',
      'template-driven change detection trace',
      'Angular prep path',
      'reactive forms coding drill',
    ]);
    expect((article?.hasPart || []).map((item: any) => item.name)).toEqual([
      'Interview quick answer',
      'Source of truth',
      'Worked example',
      'Decision rule',
      'Template-driven example',
      'Reactive example',
      'Scaling pressure points',
      'Data flow timing',
      'Validation state and error UX',
      'API ergonomics',
      'Migration threshold checklist',
      'Same form, three changes later',
      'Interactive form flow comparator',
      'Large-form tradeoffs',
      'Architecture fit',
      'When template-driven forms are still OK',
      'Senior-level pitfalls',
      'Testable proof',
      'FrontendAtlas review note',
      'Source check',
      'Practice next',
      'Interview summary',
    ]);
    expect((article?.citation || []).map((item: any) => item.url)).toEqual([
      'https://angular.dev/guide/forms',
      'https://angular.dev/guide/forms/reactive-forms',
      'https://angular.dev/guide/forms/template-driven-forms',
      'https://angular.dev/guide/forms/form-validation',
      'https://frontendatlas.com/legal/editorial-policy',
    ]);
    expect(questionSchema).toEqual(jasmine.objectContaining({
      '@id': 'https://frontendatlas.com/angular/trivia/angular-template-driven-vs-reactive-forms-which-scales#question',
      name: question.title,
      url: 'https://frontendatlas.com/angular/trivia/angular-template-driven-vs-reactive-forms-which-scales',
      inLanguage: 'en',
      acceptedAnswer: jasmine.objectContaining({
        '@type': 'Answer',
        text: jasmine.stringMatching(/^Reactive forms are the better default for large or dynamic Angular forms/),
      }),
    }));
    expect(questionSchema?.acceptedAnswer?.text).toContain('migrate once dynamic rows');
    expect(questionSchema?.acceptedAnswer?.text).toContain('autosave');
  });

  it('renders the Angular forms flow comparator only for the target question', async () => {
    const targetFixture = await createLoadedFixture('free', {
      id: 'angular-template-driven-vs-reactive-forms-which-scales',
      title: 'Template-Driven vs Reactive Forms in Angular: Which One Scales and Why?',
      description: 'Reactive forms scale better for dynamic Angular forms.',
      answer: {
        blocks: [
          {
            type: 'text',
            text: '## Source of truth\n\nReactive forms keep the model explicit.',
          },
        ],
      },
      technology: 'angular',
      tags: ['angular', 'forms', 'reactive-forms'],
      updatedAt: '2026-07-04',
    });

    const comparator = targetFixture.nativeElement.querySelector(
      '[data-testid="angular-forms-flow-comparator"]'
    ) as HTMLElement | null;
    expect(comparator).toBeTruthy();
    expect(comparator?.textContent || '').toContain('Angular form flow comparator');
    expect(comparator?.textContent || '').toContain('valueChanges');
    expect(comparator?.textContent || '').toContain('test assertion');
    expect(comparator?.textContent || '').toContain('Maintained by FrontendAtlas Editorial');
    expect(comparator?.textContent || '').toContain('Cross-checked with Angular forms docs');
    expect(comparator?.textContent || '').toContain('State transitions mapped to testable assertions');

    const buttons = Array.from(comparator!.querySelectorAll('button')) as HTMLButtonElement[];
    const reactiveButton = buttons.find((button) => String(button.textContent || '').trim() === 'Reactive input');
    const templateButton = buttons.find((button) => String(button.textContent || '').trim() === 'Template-driven input');
    expect(reactiveButton?.getAttribute('aria-pressed')).toBe('true');
    expect(reactiveButton?.classList.contains('is-active')).toBeTrue();
    expect(templateButton).toBeTruthy();

    templateButton!.click();
    targetFixture.detectChanges();

    expect(reactiveButton?.getAttribute('aria-pressed')).toBe('false');
    expect(templateButton?.getAttribute('aria-pressed')).toBe('true');
    expect(comparator?.textContent || '').toContain('ngModelChange');
    expect(comparator?.textContent || '').toContain('change detection');
    expect(comparator?.textContent || '').toContain('two-way bound property');

    targetFixture.destroy();

    const nonTargetFixture = await createLoadedFixture('free', {
      id: 'angular-change-detection-default-vs-onpush',
      title: 'What is the difference between default and OnPush change detection in Angular?',
      description: 'OnPush limits when Angular checks a component.',
      answer: {
        blocks: [
          {
            type: 'text',
            text: '## Quick answer\n\nOnPush checks components on input changes and explicit marks.',
          },
        ],
      },
      technology: 'angular',
      tags: ['angular', 'change-detection'],
      updatedAt: '2026-07-04',
    });

    expect(nonTargetFixture.nativeElement.querySelector('[data-testid="angular-forms-flow-comparator"]')).toBeNull();
    nonTargetFixture.destroy();
  });

  it('adds equality TechArticle and Question schema without FAQPage or QAPage markup', async () => {
    const fixture = await createLoadedFixture('free', {
      id: 'js-equality-vs-strict-equality',
      title: 'What is the difference between == and === in JavaScript?',
      description:
        'Loose equality and strict equality differ because coercion can silently change operands.',
      technology: 'javascript',
      tags: ['operators', 'comparison', 'types', 'javascript'],
      publishedAt: '2025-11-08',
      updatedAt: '2026-07-03',
      seo: {
        title: 'JavaScript == vs ===: frontend coercion bug playbook',
        description:
          'Debug form, query param, storage, API, NaN, and collection equality bugs with strict comparison, explicit normalization, and edge-case tests.',
      },
    });

    const payload = seo.updateTags.calls.mostRecent().args[0] as any;
    const graph = Array.isArray(payload?.jsonLd) ? payload.jsonLd : [];
    const article = graph.find((node: any) => node?.['@type'] === 'TechArticle');
    const question = graph.find((node: any) => node?.['@type'] === 'Question');
    const typeNames = graph.map((node: any) => node?.['@type']);

    expect(payload?.title).toBe('JavaScript == vs ===: frontend coercion bug playbook');
    expect(payload?.description).toContain('Debug form, query param, storage, API, NaN');
    expect(typeNames).not.toContain('FAQPage');
    expect(typeNames).not.toContain('QAPage');
    expect(article?.articleSection).toBe('JavaScript equality and coercion');
    expect(article?.datePublished).toBe('2025-11-08T00:00:00.000Z');
    expect(article?.dateModified).toBe('2026-07-03T00:00:00.000Z');
    expect((article?.about || []).map((item: any) => item.name)).toEqual([
      'JavaScript equality operators',
      'Loose equality',
      'Strict equality',
      'Type coercion',
    ]);
    expect((article?.mentions || []).map((item: any) => item.name)).toContain('implicit coercion');
    expect((article?.mentions || []).map((item: any) => item.name)).toContain('Number.isNaN');
    expect((article?.mentions || []).map((item: any) => item.name)).toContain('Object.is');
    expect((article?.mentions || []).map((item: any) => item.name)).toContain('SameValueZero');
    expect((article?.mentions || []).map((item: any) => item.name)).toContain('IsLooselyEqual');
    expect((article?.mentions || []).map((item: any) => item.name)).toContain('!==');
    expect((article?.mentions || []).map((item: any) => item.name)).toContain('Array.prototype.includes');
    expect((article?.mentions || []).map((item: any) => item.name)).toContain('DOM input');
    expect((article?.mentions || []).map((item: any) => item.name)).toContain('URLSearchParams');
    expect((article?.mentions || []).map((item: any) => item.name)).toContain('boundary normalization');
    expect((article?.mentions || []).map((item: any) => item.name)).toContain('equality test checklist');
    expect((article?.mentions || []).map((item: any) => item.name)).toContain('senior interview answer');
    expect((article?.mentions || []).map((item: any) => item.name)).not.toContain('MDN Web Docs');
    expect((article?.mentions || []).map((item: any) => item.name)).not.toContain('ECMAScript specification');
    expect((article?.mentions || []).map((item: any) => item.name)).not.toContain('source reference');
    expect((article?.mentions || []).map((item: any) => item.name)).toContain('FrontendAtlas review note');
    expect((article?.mentions || []).map((item: any) => item.name)).toContain('edge-case test');
    expect((article?.mentions || []).map((item: any) => item.name)).toContain('interactive equality predictor');
    expect((article?.mentions || []).map((item: any) => item.name)).toContain('coercion matrix');
    expect((article?.mentions || []).map((item: any) => item.name)).toContain('SameValueZero comparison');
    expect((article?.mentions || []).map((item: any) => item.name)).toContain('edge-case comparison drill');
    expect((article?.hasPart || []).map((item: any) => item.name)).toEqual([
      'Core idea',
      'Frontend coercion bug matrix',
      'Loose equality',
      'How == decides',
      'Strict equality',
      'Boundary normalization recipes',
      'Junior, mid, and senior interview answer',
      'Beyond ===: Object.is and SameValueZero',
      'Pitfalls',
      'Equality test checklist',
      'Practical rule',
      'FrontendAtlas review note',
      'Equality predictor',
    ]);
    expect(article?.citation).toBeUndefined();
    expect(question?.name).toBe('What is the difference between == and === in JavaScript?');
    expect(question?.acceptedAnswer?.['@type']).toBe('Answer');
    expect(question?.acceptedAnswer?.text).toContain('== performs implicit coercion');
    expect(question?.acceptedAnswer?.text).toContain('=== compares type and value without coercion');

    fixture.destroy();
  });

  it('adds render-nothing TechArticle schema fields without FAQPage or QAPage markup', async () => {
    const question = {
      id: 'react-render-nothing-return-value',
      title: 'Can a React component return undefined?',
      description:
        'Yes. In React 18+, a component may return undefined and React renders no DOM for that return. In React 17 and earlier, the same return could throw "Nothing was returned from render." Use return null for intentional empty UI, and catch accidental missing returns with TypeScript and lint rules.',
      answer: {
        blocks: [
          {
            type: 'text',
            text: '## Quick answer\n\nReact 18+ permits undefined component returns, but return null is clearer.',
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
        title: 'Can React Return undefined? React 18 vs null',
        description:
          'React 18+ permits undefined component returns. Practice when it renders nothing, why null is clearer, how React 17 differed, and lint catches return bugs.',
        h1: 'Can React Components Return undefined? React 18 vs null',
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
      'React 18',
      'React 17 and earlier',
      'Fragment',
      'ReactNode',
      'missing return',
      'TypeScript return types',
      'ESLint consistent-return',
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
      'source check',
    ]);
    expect((article?.hasPart || []).map((item: any) => item.name)).toEqual([
      'Quick answer',
      'React 17 and earlier vs React 18+ comparison',
      'Return value map',
      'Explicit return undefined',
      'Accidental missing return',
      'return null',
      'Return value simulator',
      'Return null vs parent conditional rendering',
      'Component return vs JSX child semantics',
      'Follow-up question',
      'Common production mistake',
      'Source check',
      'Testable proof',
      'FrontendAtlas review note',
    ]);
    expect((article?.citation || []).map((item: any) => item.url)).toEqual([
      'https://github.com/reactwg/react-18/discussions/75',
    ]);
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

    const pageFrame = fixture.nativeElement.querySelector('.page-frame') as HTMLElement;
    const main = fixture.nativeElement.querySelector('[data-testid="trivia-detail-main"]') as HTMLElement;
    const side = fixture.nativeElement.querySelector('.side') as HTMLElement;
    expect(pageFrame.firstElementChild).toBe(main);
    expect(Boolean(main.compareDocumentPosition(side) & Node.DOCUMENT_POSITION_FOLLOWING)).toBeTrue();
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
    expect(lockedHeading?.textContent?.trim()).toBe('What is closure?');
    expect(lockedHeading?.querySelector('.locked-title__intent')).toBeNull();
    expect(fixture.nativeElement.querySelector('.locked-title__intent')?.textContent?.trim()).toBe(
      'Frontend interview answer',
    );

    const payload = seo.updateTags.calls.mostRecent().args[0] as any;
    expect(payload.robots).toBe('noindex,follow');
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
