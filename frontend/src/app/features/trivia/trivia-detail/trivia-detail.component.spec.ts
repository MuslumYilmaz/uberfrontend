import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
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
  });

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
    routeData$.next({ questionDetail: makeResolved(access, extras) });
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
    expect(h1?.querySelector('.title__intent')?.textContent?.trim()).toBe('Frontend interview Q&A');

    const payload = seo.updateTags.calls.mostRecent().args[0] as any;
    expect(payload.title).toBe('JavaScript Closure Interview SEO Title');
    expect(payload.description).toBe(
      'Practice explaining JavaScript closures in interviews without losing the original question title.',
    );

    const graph = Array.isArray(payload?.jsonLd) ? payload.jsonLd : [];
    const article = graph.find((node: any) => node?.['@type'] === 'TechArticle');
    const faq = graph.find((node: any) => node?.['@type'] === 'FAQPage');

    expect(article?.headline).toBe('What is closure? - Frontend interview Q&A');
    expect(faq?.mainEntity?.[0]?.name).toBe('What is closure?');
  });

  it('renders crawlable sidebar and practice entry links', async () => {
    const fixture = await createLoadedFixture();

    const sideLink = fixture.nativeElement.querySelector('.side-list a.side-item') as HTMLAnchorElement | null;
    expect(sideLink).toBeTruthy();
    expect(sideLink?.getAttribute('href') || '').toContain('/javascript/trivia/q1');

    const framePrimary = fixture.nativeElement.querySelector('[data-testid="trivia-practice-frame-primary"]') as HTMLAnchorElement | null;
    const framePlan = fixture.nativeElement.querySelector('[data-testid="trivia-practice-frame-plan"]') as HTMLAnchorElement | null;
    const frameHub = fixture.nativeElement.querySelector('[data-testid="trivia-practice-frame-hub"]') as HTMLAnchorElement | null;

    expect(framePrimary?.getAttribute('href') || '').toContain('/coding?kind=trivia&reset=1');
    expect(framePlan?.getAttribute('href') || '').toContain('/tracks/javascript-prep-path/mastery');
    expect(frameHub?.getAttribute('href') || '').toContain('/javascript/interview-questions');
  });

  it('renders unlocked trivia shell with sidebar, similar, guides, and prep bridge blocks', async () => {
    const fixture = await createLoadedFixture();

    expect(fixture.nativeElement.querySelector('.side-list')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="trivia-practice-frame"]')).toBeTruthy();
    expect(fixture.nativeElement.textContent || '').toContain('Interview concept practice');
    expect(fixture.nativeElement.querySelector('.similar-list')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.guide-links')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="trivia-prep-entry"]')).toBeTruthy();

    const footerLeft = fixture.nativeElement.querySelector('[data-testid="footer-left"]') as HTMLAnchorElement | null;
    expect(footerLeft?.textContent || '').toContain('Question Library');
    expect(footerLeft?.getAttribute('href') || '').toContain('/coding?kind=trivia&reset=1');
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
    expect(lockedHeading?.querySelector('.locked-title__intent')?.textContent?.trim()).toBe('Frontend interview Q&A');
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
    expect(article?.headline).toBe('What is closure? - Frontend interview Q&A');
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
