import { TestBed } from '@angular/core/testing';
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

  const makeResolved = (access: 'free' | 'premium', extras: Record<string, any> = {}) => ({
    tech: 'javascript',
    id: 'q1',
    list: [{
      id: 'q1',
      title: 'What is closure?',
      description: 'Closure keeps lexical scope.',
      answer: 'A closure captures variables from outer scope.',
      importance: 3,
      difficulty: 'easy',
      technology: 'javascript',
      access,
      ...extras,
    }],
  });

  beforeEach(async () => {
    routeData$ = new ReplaySubject<any>(1);
    bugReport = jasmine.createSpyObj<BugReportService>('BugReportService', ['open']);
    seo = jasmine.createSpyObj<SeoService>('SeoService', ['updateTags', 'buildCanonicalUrl']);
    progress = jasmine.createSpyObj<UserProgressService>('UserProgressService', [
      'isSolved',
      'markSolved',
      'markSolvedLocal',
      'setSolvedIds',
      'unmarkSolved',
      'solvedIds',
    ]);
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['user', 'isLoggedIn', 'headers']);
    activity = jasmine.createSpyObj<ActivityService>('ActivityService', ['complete']);
    analytics = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', ['track']);
    onboarding = jasmine.createSpyObj<OnboardingService>('OnboardingService', ['getProfile', 'markPending']);
    triviaIncident = jasmine.createSpyObj<TriviaIncidentService>('TriviaIncidentService', ['getIncident', 'answerIncident']);

    progress.isSolved.and.returnValue(false);
    progress.solvedIds.and.returnValue([]);
    progress.markSolved.and.resolveTo();
    progress.markSolvedLocal.and.stub();
    progress.setSolvedIds.and.stub();
    progress.unmarkSolved.and.resolveTo();
    auth.user.and.returnValue(null);
    auth.isLoggedIn.and.returnValue(false);
    activity.complete.and.returnValue(of({ solvedQuestionIds: ['q1'], stats: {} } as any));
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

  it('renders crawlable sidebar and interview-hub links', async () => {
    routeData$.next({ questionDetail: makeResolved('free') });

    const fixture = TestBed.createComponent(TriviaDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const sideLink = fixture.nativeElement.querySelector('.side-list a.side-item') as HTMLAnchorElement | null;
    expect(sideLink).toBeTruthy();
    expect(sideLink?.getAttribute('href') || '').toContain('/javascript/trivia/q1');

    const prepLinks = Array.from(
      fixture.nativeElement.querySelectorAll('.prep-bridge__links a')
    ) as HTMLAnchorElement[];
    const prepHrefs = prepLinks.map((link) => link.getAttribute('href') || '');
    expect(prepHrefs.some((href) => href.includes('/javascript/interview-questions'))).toBeTrue();
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
});
