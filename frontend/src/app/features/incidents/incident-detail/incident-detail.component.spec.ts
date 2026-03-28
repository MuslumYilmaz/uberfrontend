import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpHeaders } from '@angular/common/http';
import { computed, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { ReplaySubject, of } from 'rxjs';
import { IncidentProgressService } from '../../../core/services/incident-progress.service';
import { SeoService } from '../../../core/services/seo.service';
import { IncidentDetailComponent } from './incident-detail.component';
import { AuthService } from '../../../core/services/auth.service';
import { ActivityService } from '../../../core/services/activity.service';
import { BugReportService } from '../../../core/services/bug-report.service';

describe('IncidentDetailComponent', () => {
  const PRACTICE_PROGRESS_KEY = 'fa:practice:progress:v3:guest';
  const INCIDENT_SESSION_KEY = 'fa:practice:session:v3:guest:incident:incident-1';
  let routeData$: ReplaySubject<any>;
  let seo: jasmine.SpyObj<SeoService>;
  let activity: jasmine.SpyObj<ActivityService>;
  let authUser: ReturnType<typeof signal<any>>;
  let httpMock: HttpTestingController;

  const resolvedDetail = {
    id: 'incident-1',
    prev: null,
    next: {
      id: 'incident-2',
      title: 'Next incident',
      tech: 'react',
      difficulty: 'easy',
      summary: 'Next',
      signals: ['signal'],
      estimatedMinutes: 12,
      tags: ['react'],
      updatedAt: '2026-03-19',
      access: 'free',
    },
    list: [
      {
        id: 'incident-1',
        title: 'Incident one',
        tech: 'react',
        difficulty: 'easy',
        summary: 'Summary',
        signals: ['signal'],
        estimatedMinutes: 12,
        tags: ['react'],
        updatedAt: '2026-03-19',
        access: 'free',
      },
    ],
    incident: {
      meta: {
        id: 'incident-1',
        title: 'Incident one',
        tech: 'react',
        difficulty: 'easy',
        summary: 'Summary',
        signals: ['signal'],
        estimatedMinutes: 12,
        tags: ['react'],
        updatedAt: '2026-03-19',
        access: 'free',
      },
      context: {
        symptom: 'Typing lags.',
        userImpact: 'Users quit.',
        environment: 'React page',
        evidence: [
          { type: 'note', title: 'Evidence', body: 'Something broke.' },
        ],
      },
      stages: [
        {
          id: 'root-cause',
          type: 'single-select',
          title: 'Stage 1',
          prompt: 'Pick root cause',
          options: [
            { id: 'correct', label: 'Correct cause', points: 25, feedback: 'Correct diagnosis.' },
            { id: 'wrong', label: 'Wrong cause', points: 5, feedback: 'Partly relevant, but incomplete.' },
          ],
        },
        {
          id: 'debug-order',
          type: 'priority-order',
          title: 'Stage 2',
          prompt: 'Sort',
          candidates: [
            { id: 'check-logs', label: 'Check logs' },
            { id: 'profile-ui', label: 'Profile UI' },
            { id: 'inspect-code', label: 'Inspect code' },
          ],
          expectedOrder: ['check-logs', 'profile-ui', 'inspect-code'],
          slotWeights: [12, 8, 5],
        },
        {
          id: 'fix-set',
          type: 'multi-select',
          title: 'Stage 3',
          prompt: 'Fixes',
          options: [
            { id: 'fix-a', label: 'Fix A', points: 10, feedback: 'A helps.' },
            { id: 'fix-b', label: 'Fix B', points: 10, feedback: 'B helps.' },
            { id: 'fix-c', label: 'Fix C', points: 5, feedback: 'C helps.' },
            { id: 'harmful', label: 'Harmful', points: -5, feedback: 'Bad fix.', isHarmful: true },
          ],
        },
        {
          id: 'guardrail',
          type: 'single-select',
          title: 'Stage 4',
          prompt: 'Guardrail',
          options: [
            { id: 'guard', label: 'Guard', points: 25, feedback: 'Best guard.' },
            { id: 'weak', label: 'Weak', points: 0, feedback: 'Weak guard.' },
          ],
        },
      ],
      debrief: {
        scoreBands: [
          { min: 0, max: 69, label: 'Review again', summary: 'Need more work.' },
          { min: 70, max: 100, label: 'Passed', summary: 'Solid run.' },
        ],
        idealRunbook: ['Profile first', 'Protect with tests'],
        teachingBlocks: [
          { type: 'text', text: 'Debrief text.' },
        ],
        optionalReflectionPrompt: 'What would you do next?',
      },
      relatedPractice: [
        { tech: 'react', kind: 'coding', id: 'react-debounced-search' },
      ],
    },
  };

  beforeEach(async () => {
    routeData$ = new ReplaySubject<any>(1);
    seo = jasmine.createSpyObj<SeoService>('SeoService', ['updateTags', 'buildCanonicalUrl']);
    seo.buildCanonicalUrl.and.callFake((value: string) => {
      const raw = String(value || '').trim();
      if (!raw) return 'https://frontendatlas.com/';
      if (/^https?:\/\//i.test(raw)) return raw;
      return raw.startsWith('/')
        ? `https://frontendatlas.com${raw}`
        : `https://frontendatlas.com/${raw}`;
    });
    activity = jasmine.createSpyObj<ActivityService>('ActivityService', ['complete']);
    activity.complete.and.returnValue(of({ stats: null }));
    authUser = signal<any>(null);
    localStorage.removeItem(PRACTICE_PROGRESS_KEY);
    localStorage.removeItem(INCIDENT_SESSION_KEY);
    localStorage.removeItem('fa:incidents:progress:v1');
    localStorage.removeItem('fa:incidents:session:v1:incident-1');
    localStorage.removeItem('fa:practice:progress:v2');
    localStorage.removeItem('fa:practice:session:v2:incident:incident-1');

    await TestBed.configureTestingModule({
      imports: [IncidentDetailComponent, RouterTestingModule, HttpClientTestingModule],
      providers: [
        IncidentProgressService,
        { provide: ActivityService, useValue: activity },
        {
          provide: AuthService,
          useValue: {
            user: authUser,
            isLoggedIn: computed(() => !!authUser()),
            headers: () => new HttpHeaders(),
          } satisfies Partial<AuthService>,
        },
        { provide: BugReportService, useValue: jasmine.createSpyObj<BugReportService>('BugReportService', ['open']) },
        { provide: SeoService, useValue: seo },
        { provide: ActivatedRoute, useValue: { data: routeData$.asObservable() } },
      ],
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    localStorage.removeItem(PRACTICE_PROGRESS_KEY);
    localStorage.removeItem(INCIDENT_SESSION_KEY);
    localStorage.removeItem('fa:incidents:progress:v1');
    localStorage.removeItem('fa:incidents:session:v1:incident-1');
    localStorage.removeItem('fa:practice:progress:v2');
    localStorage.removeItem('fa:practice:session:v2:incident:incident-1');
    httpMock.verify();
  });

  it('shows stage feedback after submitting a response', async () => {
    routeData$.next({ incidentDetail: resolvedDetail });

    const fixture = TestBed.createComponent(IncidentDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const startButton = (Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[])
      .find((button) => (button.textContent || '').includes('Begin simulator')) as HTMLButtonElement;
    startButton.click();
    fixture.detectChanges();

    const option = fixture.nativeElement.querySelector('[data-testid="incident-option-root-cause-correct"]') as HTMLButtonElement;
    option.click();
    fixture.detectChanges();

    const submitButton = (Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[])
      .find((button) => (button.textContent || '').includes('Submit response')) as HTMLButtonElement;
    submitButton.click();
    fixture.detectChanges();

    const feedback = fixture.nativeElement.querySelector('[data-testid="incident-feedback-root-cause"]') as HTMLElement | null;
    expect(feedback?.textContent || '').toContain('Strong call');
    expect(feedback?.textContent || '').toContain('25/25');
    expect(feedback?.textContent || '').toContain('Correct diagnosis.');
  });

  it('scrolls mobile users to feedback after submitting a response', async () => {
    routeData$.next({ incidentDetail: resolvedDetail });

    const scrollIntoView = (HTMLElement.prototype as HTMLElement & { scrollIntoView?: () => void; }).scrollIntoView;
    if (!scrollIntoView) {
      Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
        value: () => undefined,
        configurable: true,
        writable: true,
      });
    }

    const matchMediaSpy = spyOn(window, 'matchMedia').and.callFake((query: string) => ({
      matches: query === '(max-width: 640px)',
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }));
    let scheduledFrame: ((time: number) => void) | null = null;
    spyOn(window, 'requestAnimationFrame').and.callFake((callback: FrameRequestCallback): number => {
      scheduledFrame = callback;
      return 1;
    });
    const scrollSpy = spyOn(HTMLElement.prototype, 'scrollIntoView').and.stub();

    const fixture = TestBed.createComponent(IncidentDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const startButton = (Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[])
      .find((button) => (button.textContent || '').includes('Begin simulator')) as HTMLButtonElement;
    startButton.click();
    fixture.detectChanges();

    const option = fixture.nativeElement.querySelector('[data-testid="incident-option-root-cause-correct"]') as HTMLButtonElement;
    option.click();
    fixture.detectChanges();

    const submitButton = (Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[])
      .find((button) => (button.textContent || '').includes('Submit response')) as HTMLButtonElement;
    submitButton.click();
    fixture.detectChanges();

    expect(matchMediaSpy).toHaveBeenCalledWith('(max-width: 640px)');
    expect(scheduledFrame).not.toBeNull();
    expect(scrollSpy).not.toHaveBeenCalled();

    const runScheduledFrame = scheduledFrame as any;
    runScheduledFrame(0);

    expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    const scrolledElement = scrollSpy.calls.mostRecent().object as HTMLElement;
    expect(scrolledElement.getAttribute('data-testid')).toBe('incident-feedback-root-cause');
  });

  it('publishes LearningResource schema through seo tags', async () => {
    routeData$.next({ incidentDetail: resolvedDetail });

    const fixture = TestBed.createComponent(IncidentDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(seo.updateTags).toHaveBeenCalled();
    const payload = seo.updateTags.calls.mostRecent().args[0] as any;
    const graph = Array.isArray(payload?.jsonLd) ? payload.jsonLd : [];
    const breadcrumb = graph.find((entry: any) => entry?.['@type'] === 'BreadcrumbList');
    const resource = graph.find((entry: any) => entry?.['@type'] === 'LearningResource');

    expect(breadcrumb).toBeTruthy();
    expect(resource).toBeTruthy();
    expect(resource?.url || '').toContain('/incidents/incident-1');
    expect(resource?.isPartOf?.url || '').toContain('/incidents');
    expect(resource?.learningResourceType).toBe('Debug scenario');
  });

  it('renders the locked premium preview on premium incidents', async () => {
    const premiumDetail = JSON.parse(JSON.stringify(resolvedDetail));
    premiumDetail.list[0].access = 'premium';
    premiumDetail.incident.meta.access = 'premium';
    routeData$.next({ incidentDetail: premiumDetail });

    const fixture = TestBed.createComponent(IncidentDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent || '').toContain('Premium');
    expect(fixture.nativeElement.textContent || '').toContain('View pricing');
    expect(fixture.nativeElement.querySelector('[data-testid="premium-preview"]')).toBeTruthy();
    expect(fixture.nativeElement.textContent || '').not.toContain('Begin simulator');
  });

  it('reorders priority candidates with keyboard controls', async () => {
    routeData$.next({ incidentDetail: resolvedDetail });

    const fixture = TestBed.createComponent(IncidentDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const component = fixture.componentInstance;
    component.startIncident();
    component.activateOption(component.stages()[0]!, 'correct');
    component.submitCurrentStage();
    component.nextStep();
    fixture.detectChanges();

    const firstBefore = fixture.nativeElement.querySelector('.incident-priority__title') as HTMLElement;
    expect(firstBefore.textContent?.trim()).toBe('Check logs');

    const moveDown = fixture.nativeElement.querySelector('[data-testid="incident-priority-down-check-logs"]') as HTMLButtonElement;
    moveDown.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();

    const firstAfter = fixture.nativeElement.querySelector('.incident-priority__title') as HTMLElement;
    expect(firstAfter.textContent?.trim()).toBe('Profile UI');
  });

  it('renders related practice links on the debrief step', async () => {
    routeData$.next({ incidentDetail: resolvedDetail });

    const fixture = TestBed.createComponent(IncidentDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const component = fixture.componentInstance;
    component.startIncident();

    component.activateOption(component.stages()[0]!, 'correct');
    component.submitCurrentStage();
    component.nextStep();

    component.submitCurrentStage();
    component.nextStep();

    component.activateOption(component.stages()[2]!, 'fix-a');
    component.activateOption(component.stages()[2]!, 'fix-b');
    component.activateOption(component.stages()[2]!, 'fix-c');
    component.submitCurrentStage();
    component.nextStep();

    component.activateOption(component.stages()[3]!, 'guard');
    component.submitCurrentStage();
    component.nextStep();
    fixture.detectChanges();

    const relatedLink = fixture.nativeElement.querySelector('[data-testid="incident-related-react-debounced-search"]') as HTMLAnchorElement | null;
    expect(relatedLink).toBeTruthy();
    expect(relatedLink?.getAttribute('href') || '').toContain('/react/coding/react-debounced-search');
  });

  it('credits activity only when an incident becomes passed for the first time', async () => {
    authUser.set({
      _id: 'user-1',
      username: 'user1',
      email: 'user1@example.com',
      prefs: { tz: 'Europe/Istanbul', theme: 'dark', defaultTech: 'javascript', keyboard: 'default', marketingEmails: false },
      createdAt: new Date().toISOString(),
    });
    routeData$.next({ incidentDetail: resolvedDetail });

    const fixture = TestBed.createComponent(IncidentDetailComponent);
    fixture.detectChanges();
    TestBed.flushEffects();
    const loadReq = httpMock.expectOne('/api/practice-progress');
    loadReq.flush({ records: [] });
    const flushIncidentSyncs = () => {
      httpMock
        .match((req) => req.method === 'PUT' && req.url === '/api/practice-progress/incident/incident-1')
        .forEach((req) => req.flush({
          record: {
            family: 'incident',
            itemId: 'incident-1',
            ...req.request.body,
          },
        }));
    };
    flushIncidentSyncs();
    await fixture.whenStable();

    const component = fixture.componentInstance;
    const answers = {
      'root-cause': 'correct',
      'debug-order': ['check-logs', 'profile-ui', 'inspect-code'],
      'fix-set': ['fix-a', 'fix-b', 'fix-c'],
      'guardrail': 'guard',
    };

    component.startIncident();
    component.answers.set(answers);
    component.submittedStageIds.set(['root-cause', 'debug-order', 'fix-set', 'guardrail']);
    component.goToStep(component.debriefStepIndex());
    flushIncidentSyncs();

    expect(activity.complete).toHaveBeenCalledTimes(1);
    expect(activity.complete).toHaveBeenCalledWith(jasmine.objectContaining({
      kind: 'incident',
      tech: 'react',
      itemId: 'incident-1',
      difficulty: 'easy',
    }));

    component.restartIncident();
    flushIncidentSyncs();
    component.answers.set(answers);
    component.submittedStageIds.set(['root-cause', 'debug-order', 'fix-set', 'guardrail']);
    component.goToStep(component.debriefStepIndex());
    flushIncidentSyncs();

    expect(activity.complete).toHaveBeenCalledTimes(1);
  });
});
