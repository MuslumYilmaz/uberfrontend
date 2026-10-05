import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpHeaders, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
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
  const SECOND_INCIDENT_SESSION_KEY = 'fa:practice:session:v3:guest:incident:incident-2';
  const USER_SESSION_KEY = 'fa:practice:session:v3:user:incident-scope-test:incident:incident-1';
  const USER_PROGRESS_KEY = 'fa:practice:progress:v3:user:incident-scope-test';
  let routeData$: ReplaySubject<any>;
  let seo: jasmine.SpyObj<SeoService>;
  let activity: jasmine.SpyObj<ActivityService>;
  let authUser: ReturnType<typeof signal<any>>;
  let httpMock: HttpTestingController;

  function visiblePanels(root: HTMLElement): HTMLElement[] {
    return Array.from(root.querySelectorAll<HTMLElement>('.incident-stage-card'))
      .filter((panel) => !panel.hidden);
  }

  function visibleFeedbackEntries(root: HTMLElement, stageId: string): HTMLElement[] {
    return Array.from(root.querySelectorAll<HTMLElement>(
      `[data-testid="incident-feedback-${stageId}"] .incident-feedback__entry`,
    )).filter((entry) => !entry.closest('[hidden]'));
  }

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
    localStorage.removeItem(SECOND_INCIDENT_SESSION_KEY);
    localStorage.removeItem(USER_SESSION_KEY);
    localStorage.removeItem(USER_PROGRESS_KEY);
    localStorage.removeItem('fa:incidents:progress:v1');
    localStorage.removeItem('fa:incidents:session:v1:incident-1');
    localStorage.removeItem('fa:practice:progress:v2');
    localStorage.removeItem('fa:practice:session:v2:incident:incident-1');

    await TestBed.configureTestingModule({
    imports: [IncidentDetailComponent, RouterTestingModule],
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
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
    ]
}).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    localStorage.removeItem(PRACTICE_PROGRESS_KEY);
    localStorage.removeItem(INCIDENT_SESSION_KEY);
    localStorage.removeItem(SECOND_INCIDENT_SESSION_KEY);
    localStorage.removeItem(USER_SESSION_KEY);
    localStorage.removeItem(USER_PROGRESS_KEY);
    localStorage.removeItem('fa:incidents:progress:v1');
    localStorage.removeItem('fa:incidents:session:v1:incident-1');
    localStorage.removeItem('fa:practice:progress:v2');
    localStorage.removeItem('fa:practice:session:v2:incident:incident-1');
    httpMock.verify();
  });

  it('keeps all public teaching content in the DOM while showing only the current panel', async () => {
    routeData$.next({ incidentDetail: resolvedDetail });
    const fixture = TestBed.createComponent(IncidentDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const panels = Array.from(root.querySelectorAll<HTMLElement>('.incident-stage-card'));
    expect(panels.length).toBe(6);
    expect(visiblePanels(root).length).toBe(1);
    expect(visiblePanels(root)[0].classList).toContain('incident-stage-card--overview');
    expect(root.textContent).toContain('Pick root cause');
    expect(root.textContent).toContain('Correct diagnosis.');
    expect(root.textContent).toContain('Partly relevant, but incomplete.');
    expect(root.textContent).toContain('Expected: Check logs');
    expect(root.textContent).toContain('Bad fix.');
    expect(root.textContent).toContain('Best guard.');
    expect(root.textContent).toContain('Weak guard.');
    expect(root.textContent).toContain('Profile first');
    expect(root.textContent).toContain('Debrief text.');
    expect(root.textContent).not.toContain('Review again · 0/100');
    expect(visibleFeedbackEntries(root, 'root-cause')).toEqual([]);

    for (const panel of panels.filter((panel) => panel.hidden)) {
      expect(getComputedStyle(panel).display).toBe('none');
    }

    const stagePanel = root.querySelector<HTMLElement>('[data-testid="incident-stage-root-cause"]')!;
    fixture.componentInstance.startIncident();
    fixture.detectChanges();
    expect(visiblePanels(root)).toEqual([stagePanel]);
    expect(root.querySelector('[data-testid="incident-stage-root-cause"]')).toBe(stagePanel);
    expect(root.querySelector<HTMLButtonElement>('.incident-step-nav__item:nth-child(3)')?.disabled).toBeTrue();
    fixture.componentInstance.goToStep(2);
    fixture.detectChanges();
    expect(visiblePanels(root)).toEqual([stagePanel]);
    expect(activity.complete).not.toHaveBeenCalled();
  });

  it('shows only submitted selected explanations and keeps feedback attached to its own stage', async () => {
    routeData$.next({ incidentDetail: resolvedDetail });
    const fixture = TestBed.createComponent(IncidentDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const component = fixture.componentInstance;
    const root = fixture.nativeElement as HTMLElement;

    component.startIncident();
    component.activateOption(component.stages()[0], 'wrong');
    fixture.detectChanges();
    expect(visibleFeedbackEntries(root, 'root-cause')).toEqual([]);
    component.submitCurrentStage();
    fixture.detectChanges();
    const firstFeedback = visibleFeedbackEntries(root, 'root-cause');
    expect(firstFeedback.length).toBe(1);
    expect(firstFeedback[0].textContent).toContain('Partly relevant, but incomplete.');
    expect(firstFeedback[0].textContent).not.toContain('Correct diagnosis.');
    expect(root.querySelector('[data-testid="incident-feedback-root-cause"]')?.textContent).toContain('5/25');

    component.nextStep();
    component.submitCurrentStage();
    component.nextStep();
    component.activateOption(component.stages()[2], 'harmful');
    component.activateOption(component.stages()[2], 'fix-a');
    component.submitCurrentStage();
    fixture.detectChanges();
    const multiFeedback = visibleFeedbackEntries(root, 'fix-set');
    expect(multiFeedback.length).toBe(2);
    expect(multiFeedback.map((entry) => entry.querySelector('.incident-feedback__entry-title')?.textContent?.trim()))
      .toEqual(['Fix A', 'Harmful']);
    expect(multiFeedback.map((entry) => entry.textContent).join(' ')).toContain('A helps.');
    expect(multiFeedback.map((entry) => entry.textContent).join(' ')).toContain('Bad fix.');
    expect(multiFeedback.map((entry) => entry.textContent).join(' ')).not.toContain('B helps.');
    expect(visibleFeedbackEntries(root, 'root-cause')).toEqual([]);

    component.goToStep(1);
    fixture.detectChanges();
    expect(visibleFeedbackEntries(root, 'root-cause')[0]).toBe(firstFeedback[0]);
    expect(root.querySelector('[data-testid="incident-feedback-root-cause"]')?.textContent).toContain('5/25');
    expect(visibleFeedbackEntries(root, 'fix-set')).toEqual([]);
  });

  for (const activeStepIndex of [1, 2, 4, 5]) {
    it(`restores a saved attempt at step ${activeStepIndex} after initial rendering without overwriting it`, async () => {
      const progress = TestBed.inject(IncidentProgressService);
      progress.completeAttempt('incident-1', 100, 'Keep requests isolated.');
      const submittedStageIds = ['root-cause', 'debug-order', 'fix-set', 'guardrail']
        .slice(0, activeStepIndex === 5 ? 4 : activeStepIndex - 1);
      const session = {
        activeStepIndex,
        answers: {
          'root-cause': 'correct',
          'debug-order': ['check-logs', 'profile-ui', 'inspect-code'],
          'fix-set': ['fix-a', 'fix-b', 'fix-c'],
          guardrail: 'guard',
        },
        submittedStageIds,
      };
      progress.saveSession('incident-1', session);
      const originalSession = localStorage.getItem(INCIDENT_SESSION_KEY);
      const loadSession = spyOn(progress, 'loadSession').and.callThrough();
      const completeAttempt = spyOn(progress, 'completeAttempt').and.callThrough();
      routeData$.next({ incidentDetail: resolvedDetail });
      const fixture = TestBed.createComponent(IncidentDetailComponent);
      const component = fixture.componentInstance;

      expect(component.activeStepIndex()).toBe(0);
      expect(component.answers()).toEqual({});
      expect(component.reflectionNote()).toBe('');
      expect(component.progressRecord().bestScore).toBe(0);
      expect(loadSession).not.toHaveBeenCalled();
      expect(localStorage.getItem(INCIDENT_SESSION_KEY)).toBe(originalSession);

      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(component.activeStepIndex()).toBe(activeStepIndex);
      expect(component.answers()).toEqual(session.answers);
      expect(component.reflectionNote()).toBe('Keep requests isolated.');
      expect(component.progressRecord().bestScore).toBe(100);
      expect(component.submittedStageIds()).toEqual(submittedStageIds);
      expect(visiblePanels(fixture.nativeElement).length).toBe(1);
      expect(visiblePanels(fixture.nativeElement)[0].classList).not.toContain('incident-stage-card--overview');
      expect(fixture.nativeElement.querySelectorAll('.incident-step-nav__item[aria-current="step"]').length).toBe(1);
      expect(localStorage.getItem(INCIDENT_SESSION_KEY)).toBe(originalSession);
      expect(completeAttempt).not.toHaveBeenCalled();
      expect(activity.complete).not.toHaveBeenCalled();
    });
  }

  it('restores the latest route when it changes before the first render and clears missing incident state', async () => {
    const progress = TestBed.inject(IncidentProgressService);
    progress.saveSession('incident-1', { activeStepIndex: 1, answers: { 'root-cause': 'wrong' }, submittedStageIds: [] });
    progress.saveSession('incident-2', { activeStepIndex: 2, answers: { 'root-cause': 'correct' }, submittedStageIds: ['root-cause'] });
    const nextDetail = JSON.parse(JSON.stringify(resolvedDetail));
    nextDetail.id = 'incident-2';
    nextDetail.incident.meta.id = 'incident-2';
    nextDetail.incident.meta.title = 'Incident two';
    routeData$.next({ incidentDetail: resolvedDetail });
    const fixture = TestBed.createComponent(IncidentDetailComponent);
    routeData$.next({ incidentDetail: nextDetail });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const component = fixture.componentInstance;
    expect(component.incident()?.meta.id).toBe('incident-2');
    expect(component.activeStepIndex()).toBe(2);
    expect(component.answers()).toEqual({ 'root-cause': 'correct' });
    expect(component.stageResults()['root-cause'].rawScore).toBe(25);
    expect(visiblePanels(fixture.nativeElement).length).toBe(1);

    routeData$.next({ incidentDetail: undefined });
    fixture.detectChanges();
    expect(component.incident()).toBeNull();
    expect(component.activeStepIndex()).toBe(0);
    expect(component.answers()).toEqual({});
    expect(component.stageResults()).toEqual({});
    expect(component.submittedStageIds()).toEqual([]);
    expect(component.reflectionNote()).toBe('');
    expect(visiblePanels(fixture.nativeElement)).toEqual([]);

    routeData$.next({ incidentDetail: resolvedDetail });
    fixture.detectChanges();
    expect(component.incident()?.meta.id).toBe('incident-1');
    expect(component.activeStepIndex()).toBe(1);
    expect(component.answers()).toEqual({ 'root-cause': 'wrong' });
    expect(component.stageResults()).toEqual({});
    expect(visiblePanels(fixture.nativeElement).length).toBe(1);
  });

  it('restores the matching account session and ignores same-account auth refreshes', async () => {
    const progress = TestBed.inject(IncidentProgressService);
    progress.saveSession('incident-1', {
      activeStepIndex: 1,
      answers: { 'root-cause': 'wrong' },
      submittedStageIds: [],
    });
    localStorage.setItem(USER_SESSION_KEY, JSON.stringify({
      activeStepIndex: 2,
      answers: { 'root-cause': 'correct' },
      submittedStageIds: ['root-cause'],
    }));
    routeData$.next({ incidentDetail: resolvedDetail });
    const fixture = TestBed.createComponent(IncidentDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.componentInstance.answers()).toEqual({ 'root-cause': 'wrong' });

    authUser.set({ _id: 'incident-scope-test', accessTier: 'premium' });
    fixture.detectChanges();
    httpMock.expectOne('/api/practice-progress').flush({ records: [] });
    httpMock.match((req) => req.method === 'PUT' && req.url === '/api/practice-progress/incident/incident-1')
      .forEach((req) => req.flush({ record: { family: 'incident', itemId: 'incident-1', ...req.request.body } }));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.componentInstance.activeStepIndex()).toBe(2);
    expect(fixture.componentInstance.answers()).toEqual({ 'root-cause': 'correct' });

    const loadSession = spyOn(progress, 'loadSession').and.callThrough();
    authUser.set({ _id: 'incident-scope-test', accessTier: 'premium', username: 'Updated name' });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(loadSession).not.toHaveBeenCalled();
    expect(fixture.componentInstance.activeStepIndex()).toBe(2);

    authUser.set(null);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.componentInstance.activeStepIndex()).toBe(1);
    expect(fixture.componentInstance.answers()).toEqual({ 'root-cause': 'wrong' });
    expect(visiblePanels(fixture.nativeElement).length).toBe(1);
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
    submitButton.focus();
    submitButton.click();
    fixture.detectChanges();

    const feedback = fixture.nativeElement.querySelector('[data-testid="incident-feedback-root-cause"]') as HTMLElement | null;
    expect(feedback?.textContent || '').toContain('Strong call');
    expect(feedback?.textContent || '').toContain('25/25');
    expect(feedback?.textContent || '').toContain('Correct diagnosis.');

    const announcement = fixture.nativeElement.querySelector(
      '[data-testid="incident-feedback-announcement"]',
    ) as HTMLElement | null;
    expect(announcement?.getAttribute('role')).toBe('status');
    expect(announcement?.getAttribute('aria-live')).toBe('polite');
    expect(announcement?.textContent || '').toContain('Stage 1. Strong call. Score 25 out of 25.');
    expect(document.activeElement).toBe(submitButton);
    expect(submitButton.textContent || '').toContain('Next stage');
  });

  it('names single-select radio groups and exposes one option in the tab order', async () => {
    routeData$.next({ incidentDetail: resolvedDetail });

    const fixture = TestBed.createComponent(IncidentDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.startIncident();
    fixture.detectChanges();

    const prompt = fixture.nativeElement.querySelector('#incident-stage-prompt-root-cause') as HTMLElement | null;
    const group = fixture.nativeElement.querySelector('[role="radiogroup"]') as HTMLElement | null;
    const radios = Array.from(
      fixture.nativeElement.querySelectorAll('[data-testid="incident-stage-root-cause"] [role="radio"]'),
    ) as HTMLButtonElement[];

    expect(prompt?.textContent?.trim()).toBe('Pick root cause');
    expect(group?.getAttribute('aria-labelledby')).toBe(prompt?.id);
    expect(radios.map((radio) => radio.tabIndex)).toEqual([0, -1]);

    radios[1]?.click();
    fixture.detectChanges();

    expect(radios.map((radio) => radio.tabIndex)).toEqual([-1, 0]);
    expect(radios.map((radio) => radio.getAttribute('aria-checked'))).toEqual(['false', 'true']);

    fixture.componentInstance.answers.set({ 'root-cause': 'removed-option' });
    fixture.detectChanges();
    expect(radios.map((radio) => radio.tabIndex)).toEqual([0, -1]);
  });

  it('moves radio focus and selection with arrow, Home, and End keys', async () => {
    routeData$.next({ incidentDetail: resolvedDetail });

    const fixture = TestBed.createComponent(IncidentDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.startIncident();
    fixture.detectChanges();

    const radios = Array.from(
      fixture.nativeElement.querySelectorAll('[data-testid="incident-stage-root-cause"] [role="radio"]'),
    ) as HTMLButtonElement[];
    const first = radios[0]!;
    const last = radios[radios.length - 1]!;

    first.focus();
    first.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    fixture.detectChanges();
    expect(document.activeElement).toBe(last);
    expect(last.getAttribute('aria-checked')).toBe('true');

    last.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    fixture.detectChanges();
    expect(document.activeElement).toBe(first);
    expect(first.getAttribute('aria-checked')).toBe('true');

    first.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    fixture.detectChanges();
    expect(document.activeElement).toBe(last);
    expect(last.getAttribute('aria-checked')).toBe('true');

    last.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    fixture.detectChanges();
    expect(document.activeElement).toBe(first);
    expect(first.getAttribute('aria-checked')).toBe('true');
  });

  it('marks only the active incident navigation item as current', async () => {
    routeData$.next({ incidentDetail: resolvedDetail });

    const fixture = TestBed.createComponent(IncidentDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const currentBefore = Array.from(
      fixture.nativeElement.querySelectorAll('.incident-step-nav__item[aria-current="step"]'),
    ) as HTMLButtonElement[];
    expect(currentBefore.length).toBe(1);
    expect(currentBefore[0]?.textContent?.trim()).toBe('Overview');

    fixture.componentInstance.startIncident();
    fixture.detectChanges();

    const currentAfter = Array.from(
      fixture.nativeElement.querySelectorAll('.incident-step-nav__item[aria-current="step"]'),
    ) as HTMLButtonElement[];
    expect(currentAfter.length).toBe(1);
    expect(currentAfter[0]?.textContent?.trim()).toBe('1');
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

    expect(payload.robots).toBeUndefined();
    expect(breadcrumb).toBeTruthy();
    expect(resource).toBeTruthy();
    expect(resource?.url || '').toContain('/incidents/incident-1');
    expect(resource?.isPartOf?.url || '').toContain('/incidents');
    expect(resource?.learningResourceType).toBe('Debug scenario');
    expect(resource?.isAccessibleForFree).toBeTrue();
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
    expect(fixture.nativeElement.querySelector('[data-testid="premium-preview-rich"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="premium-preview"]')).toBeNull();
    expect(fixture.nativeElement.textContent || '').not.toContain('Begin simulator');
    expect(fixture.nativeElement.querySelector('[data-testid="incident-stage-root-cause"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="incident-debrief"]')).toBeNull();
    expect(fixture.nativeElement.textContent || '').not.toContain('Correct diagnosis.');
    expect(fixture.nativeElement.textContent || '').not.toContain('Debrief text.');

    const payload = seo.updateTags.calls.mostRecent().args[0] as any;
    const graph = Array.isArray(payload?.jsonLd) ? payload.jsonLd : [];
    const resource = graph.find((entry: any) => entry?.['@type'] === 'LearningResource');
    expect(payload.robots).toBe('noindex,follow');
    expect(payload.canonical).toBe('/incidents/incident-1');
    expect(resource?.isAccessibleForFree).toBeFalse();
    expect(JSON.stringify(graph)).not.toContain('Ideal runbook');
  });

  it('keeps paid teaching content out of the DOM for signed-in free users', async () => {
    const premiumDetail = JSON.parse(JSON.stringify(resolvedDetail));
    premiumDetail.list[0].access = 'premium';
    premiumDetail.incident.meta.access = 'premium';
    authUser.set({ accessTier: 'free' });
    routeData$.next({ incidentDetail: premiumDetail });

    const fixture = TestBed.createComponent(IncidentDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="premium-preview-rich"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('.incident-stage-card').length).toBe(0);
    expect(fixture.nativeElement.textContent || '').not.toContain('Correct diagnosis.');
    expect(fixture.nativeElement.textContent || '').not.toContain('Debrief text.');
    expect(activity.complete).not.toHaveBeenCalled();
  });

  it('keeps premium incident robots noindex for active premium users', async () => {
    const premiumDetail = JSON.parse(JSON.stringify(resolvedDetail));
    premiumDetail.list[0].access = 'premium';
    premiumDetail.incident.meta.access = 'premium';
    authUser.set({ accessTier: 'premium' });
    routeData$.next({ incidentDetail: premiumDetail });

    const fixture = TestBed.createComponent(IncidentDetailComponent);
    expect(fixture.componentInstance.locked()).toBeTrue();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const payload = seo.updateTags.calls.mostRecent().args[0] as any;
    expect(payload.robots).toBe('noindex,follow');
    expect(fixture.nativeElement.textContent || '').toContain('Begin simulator');
    expect(fixture.nativeElement.querySelectorAll('.incident-stage-card').length).toBe(6);
    expect(visiblePanels(fixture.nativeElement).length).toBe(1);
    expect(fixture.nativeElement.textContent || '').toContain('Correct diagnosis.');
  });

  it('restores a premium session when entitlement arrives and removes its panels when access ends', async () => {
    const premiumDetail = JSON.parse(JSON.stringify(resolvedDetail));
    premiumDetail.list[0].access = 'premium';
    premiumDetail.incident.meta.access = 'premium';
    TestBed.inject(IncidentProgressService).saveSession('incident-1', {
      activeStepIndex: 2,
      answers: { 'root-cause': 'correct' },
      submittedStageIds: ['root-cause'],
    });
    routeData$.next({ incidentDetail: premiumDetail });
    const fixture = TestBed.createComponent(IncidentDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.incident-stage-card').length).toBe(0);

    authUser.set({ accessTier: 'premium' });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.componentInstance.activeStepIndex()).toBe(2);
    expect(fixture.componentInstance.answers()).toEqual({ 'root-cause': 'correct' });
    expect(visiblePanels(fixture.nativeElement).length).toBe(1);
    expect(visiblePanels(fixture.nativeElement)[0].getAttribute('data-testid')).toBe('incident-stage-debug-order');

    authUser.set(null);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.incident-stage-card').length).toBe(0);
    expect(fixture.componentInstance.activeStepIndex()).toBe(0);
    expect(fixture.componentInstance.answers()).toEqual({});
    expect(activity.complete).not.toHaveBeenCalled();
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
