import { convertToParamMap, ActivatedRoute, Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import {
  ComponentFixture,
  TestBed,
  discardPeriodicTasks,
  fakeAsync,
  flush,
  flushMicrotasks,
  tick,
} from '@angular/core/testing';
import { Subject, of } from 'rxjs';
import { InterviewSession } from '../../core/models/interview.model';
import { InterviewService } from '../../core/services/interview.service';
import { InterviewRecoveryStore } from '../../core/services/interview-recovery.store';
import { UserCodeSandboxService } from '../../core/services/user-code-sandbox.service';
import { InterviewSessionComponent } from './interview-session.component';
import { InterviewSystemDesignRoundComponent } from './interview-system-design-round.component';

describe('InterviewSessionComponent', () => {
  let fixture: ComponentFixture<InterviewSessionComponent>;
  let component: InterviewSessionComponent;
  let service: jasmine.SpyObj<InterviewService>;
  let sandbox: jasmine.SpyObj<UserCodeSandboxService>;
  let router: jasmine.SpyObj<Router>;
  let recovery: InterviewRecoveryStore;

  const recoveryKey = (kind: 'mcq' | 'coding' | 'system-design', sessionId = 'session-1') =>
    `fa:interview:recovery:v2:user-1:${kind}:${sessionId}`;

  const recoveryPayload = <T>(kind: 'mcq' | 'coding' | 'system-design'): T | null => {
    const raw = localStorage.getItem(recoveryKey(kind));
    return raw ? (JSON.parse(raw).payload as T) : null;
  };

  const storeRecovery = (
    kind: 'mcq' | 'coding' | 'system-design',
    payload: unknown,
  ): void => {
    expect(recovery.saveForCurrentUser({ kind, sessionId: 'session-1', payload })).toBeTrue();
  };

  const mcqSession = (): InterviewSession => ({
    id: 'session-1',
    protocolVersion: 2,
    status: 'mcq_active',
    format: 'coding',
    level: 'mid',
    track: 'react',
    version: 3,
    bankVersion: 'v1',
    serverNow: new Date().toISOString(),
    mcqDeadlineAt: new Date(Date.now() + 600_000).toISOString(),
    codingReadyDeadlineAt: null,
    questions: [{
      id: 'question-1',
      revision: 1,
      technology: 'react',
      competency: 'Effect cleanup',
      prompt: 'Which cleanup belongs to the current Effect run?',
      options: [
        { id: 'option-a', label: 'Store it in component state.' },
        { id: 'option-b', label: 'Return it from the Effect callback.' },
        { id: 'option-c', label: 'Run it during render.' },
      ],
      selectedOptionId: null,
    }],
    currentQuestionIndex: 0,
    coding: null,
    systemDesign: null,
  });

  const mcqSessionWithQuestions = (count = 5): InterviewSession => {
    const session = mcqSession();
    const template = session.questions[0];
    session.questions = Array.from({ length: count }, (_, index) => ({
      ...template,
      id: `question-${index + 1}`,
      prompt: `Interview question ${index + 1}?`,
      options: template.options.map((option, optionIndex) => ({
        ...option,
        id: `q${index + 1}-option-${optionIndex + 1}`,
      })),
      selectedOptionId: null,
    }));
    return session;
  };

  const codingReadyFrom = (session: InterviewSession, version = 4): InterviewSession => ({
    ...session,
    status: 'coding_ready',
    version,
    mcqDeadlineAt: null,
    codingReadyDeadlineAt: new Date(Date.now() + 300_000).toISOString(),
    coding: {
      readyDeadlineAt: new Date(Date.now() + 300_000).toISOString(),
      deadlineAt: null,
      task: null,
      draft: null,
      checkResults: [],
      runCount: 0,
    },
  });

  const codingSession = (): InterviewSession => ({
    ...mcqSession(),
    status: 'coding_active',
    version: 5,
    mcqDeadlineAt: null,
    questions: [],
    coding: {
      readyDeadlineAt: null,
      deadlineAt: new Date(Date.now() + 2_100_000).toISOString(),
      task: {
        id: 'react-counter',
        title: 'Counter',
        prompt: 'Build a guarded counter.',
        runner: 'javascript',
        sourceQuestionId: 'react-counter',
        sourceContentVersion: 'v1',
        starterAsset: null,
        requirements: [{
          id: 'counter-boundary',
          title: 'Counter boundary',
          prompt: 'Keep the count safe.',
          constraints: ['Do not decrement below zero.'],
        }],
        files: [{
          path: '/src/App.tsx',
          language: 'typescript',
          content: 'export default function App() {}',
          readOnly: false,
        }],
      },
      draft: null,
      checkResults: [],
      runCount: 0,
    },
  });

  const systemDesignSession = (): InterviewSession => ({
    ...mcqSession(),
    format: 'system-design',
    status: 'system_design_active',
    version: 4,
    mcqDeadlineAt: null,
    questions: [],
    systemDesign: {
      stage: 'initial',
      deadlineAt: new Date(Date.now() + 900_000).toISOString(),
      scenario: {
        id: 'int-sd-autocomplete-race-mid-v1',
        revision: 1,
        title: 'Reliable autocomplete',
        prompt: 'Design an autocomplete that stays correct on slow networks.',
        sourceContentId: 'realtime-search-debounce-cache',
        estimatedSeconds: 900,
        selectionLimits: {
          clarifications: 3,
          priorities: 1,
          connections: 4,
          rationalesPerDecision: 2,
          twistActions: 2,
          scratchpadChars: 200,
        },
        clarifications: [{
          id: 'keyboard',
          prompt: 'Is keyboard navigation required?',
          answer: null,
        }],
        requirements: [{ id: 'ordering', label: 'Preserve request ordering' }],
        lanes: [{ id: 'ui', label: 'UI' }],
        cards: [{ id: 'input', label: 'Search input' }],
        decisions: [],
        connectionTypes: [{ value: 'event-flow', label: 'Event flow' }],
      },
      revealedClarificationIds: [],
      draft: {
        currentStep: 'clarifications',
        selectedClarificationIds: [],
        prioritizedRequirementIds: [],
        placements: [],
        connections: [],
        decisions: [],
        selectedTwistActionIds: [],
        scratchpad: '',
        hash: 'design-hash',
        revision: null,
        updatedAt: '2026-07-29T10:00:00.000Z',
      },
      twist: {
        revealed: false,
        prompt: null,
        actions: [],
        maxActions: 2,
      },
    },
  });

  beforeEach(async () => {
    service = jasmine.createSpyObj<InterviewService>('InterviewService', [
      'getSession',
      'saveAnswer',
      'submitMcq',
      'startCoding',
      'saveCodingDraft',
      'prepareCodingCheckRun',
      'completeCodingCheckRun',
      'submitCoding',
      'endSession',
      'saveSystemDesignDraft',
      'revealSystemDesignTwist',
      'submitSystemDesign',
    ]);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    sandbox = jasmine.createSpyObj<UserCodeSandboxService>('UserCodeSandboxService', ['runWithTests']);
    router.navigate.and.resolveTo(true);
    service.getSession.and.returnValue(of(mcqSession()));
    service.saveAnswer.and.returnValue(of({ version: 4, session: null }));
    service.saveCodingDraft.and.returnValue(of({
      version: 6,
      draft: {
        files: [{
          path: '/src/App.tsx',
          language: 'typescript',
          content: 'export default function App() { return null; }',
          readOnly: false,
        }],
        hash: 'saved-draft-hash',
        revision: null,
        updatedAt: '2026-07-27T12:00:00.000Z',
      },
    }));

    await TestBed.configureTestingModule({
      imports: [InterviewSessionComponent],
      providers: [
        { provide: InterviewService, useValue: service },
        { provide: UserCodeSandboxService, useValue: sandbox },
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: 'session-1' }) } },
        },
      ],
    }).compileComponents();
    recovery = TestBed.inject(InterviewRecoveryStore);
    recovery.setUserScope('user-1');
  });

  afterEach(() => {
    if (fixture && !fixture.componentRef.hostView.destroyed) fixture.destroy();
    localStorage.clear();
  });

  it('ends an interview without routing to an answer report', () => {
    service.endSession.and.returnValue(of({
      ...mcqSession(),
      status: 'abandoned',
    }));
    spyOn(window, 'confirm').and.returnValue(true);
    fixture = TestBed.createComponent(InterviewSessionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.abandon();

    expect(window.confirm).toHaveBeenCalledWith(
      jasmine.stringMatching(/answer review will be withheld/i),
    );
    expect(service.endSession).toHaveBeenCalledWith('session-1', 3);
    expect(router.navigate).toHaveBeenCalledWith(['/interview'], {
      queryParams: { ended: 'abandoned' },
      replaceUrl: true,
    });
    expect(router.navigate).not.toHaveBeenCalledWith([
      '/interview',
      'session-1',
      'results',
    ]);
  });

  it('freezes every active control on a hard halt and reloads only after control policy resumes', () => {
    const getControl = jasmine.createSpy('getControl').and.returnValue(of({
      id: 'session-1',
      status: 'mcq_active',
      version: 3,
      active: true,
      policy: 'halted' as const,
      notice: {
        code: 'INTERVIEW_HALTED',
        message: 'Interview work is paused for incident recovery.',
      },
    }));
    (service as any).getControl = getControl;

    fixture = TestBed.createComponent(InterviewSessionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.operationalHalt()).toBeTrue();
    expect(component.mcqControlsLocked()).toBeTrue();
    expect(fixture.nativeElement.querySelector('[data-testid="interview-operational-halt"]'))
      .not.toBeNull();
    const answerFieldset = fixture.nativeElement.querySelector('fieldset') as HTMLFieldSetElement;
    expect(answerFieldset.disabled).toBeTrue();

    getControl.and.returnValue(of({
      id: 'session-1',
      status: 'mcq_active',
      version: 3,
      active: true,
      policy: 'continue' as const,
      notice: null,
    }));
    window.dispatchEvent(new Event('focus'));
    fixture.detectChanges();

    expect(component.operationalHalt()).toBeFalse();
    expect(component.mcqControlsLocked()).toBeFalse();
    expect(service.getSession).toHaveBeenCalledTimes(2);
  });

  it('renders native radios and saves stable option ids with client-measured response time', fakeAsync(() => {
    fixture = TestBed.createComponent(InterviewSessionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    tick(1_500);

    const radios = fixture.nativeElement.querySelectorAll('input[type="radio"]') as NodeListOf<HTMLInputElement>;
    expect(radios.length).toBe(3);
    radios[1].click();
    fixture.detectChanges();

    expect(service.saveAnswer).toHaveBeenCalledWith(
      'session-1',
      {
        protocolVersion: 2,
        questionId: 'question-1',
        optionId: 'option-b',
        responseDurationMs: jasmine.any(Number),
        mutationId: jasmine.stringMatching(/^mcq-answer-/),
        expectedVersion: 3,
      },
    );
    expect(component.session()?.questions[0].selectedOptionId).toBe('option-b');
    expect(component.session()?.version).toBe(4);
    expect(service.saveAnswer.calls.mostRecent().args[1].responseDurationMs)
      .toBeGreaterThanOrEqual(1_500);
    expect(fixture.nativeElement.textContent).not.toContain('Correct answer');
    discardPeriodicTasks();
  }));

  it('restores the exact MCQ question and review screen after the tab closes', fakeAsync(() => {
    const session = mcqSession();
    session.questions.push({
      ...session.questions[0],
      id: 'question-2',
      prompt: 'Which state belongs to the second question?',
      selectedOptionId: 'option-a',
    });
    service.getSession.and.returnValue(of(session));

    fixture = TestBed.createComponent(InterviewSessionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    component.goToQuestion(1);
    component.showReview();
    fixture.destroy();

    fixture = TestBed.createComponent(InterviewSessionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.currentIndex()).toBe(1);
    expect(component.reviewing()).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('MCQ review');
    discardPeriodicTasks();
  }));

  it('replays one pending radio answer after an immediate close without overwriting another tab', fakeAsync(() => {
    const pendingSave = new Subject<{ version: number; session: InterviewSession | null }>();
    service.saveAnswer.and.returnValue(pendingSave.asObservable());
    fixture = TestBed.createComponent(InterviewSessionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.selectAnswer(component.currentQuestion()!, 'option-b');
    const firstMutationId = service.saveAnswer.calls.mostRecent().args[1].mutationId;
    fixture.destroy();
    pendingSave.error({ status: 0 });

    service.saveAnswer.and.returnValue(of({ version: 4, session: null }));
    service.getSession.and.returnValue(of(mcqSession()));
    fixture = TestBed.createComponent(InterviewSessionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(service.saveAnswer.calls.mostRecent().args).toEqual([
      'session-1',
      jasmine.objectContaining({
        protocolVersion: 2,
        questionId: 'question-1',
        optionId: 'option-b',
        mutationId: jasmine.stringMatching(/^mcq-answer-/),
        expectedVersion: 3,
      }),
    ]);
    expect(service.saveAnswer.calls.mostRecent().args[1].mutationId).toBe(firstMutationId);
    expect(component.session()?.questions[0].selectedOptionId).toBe('option-b');
    const persisted = recoveryPayload<any>('mcq');
    expect(persisted?.pendingAnswer).toBeNull();
    discardPeriodicTasks();
  }));

  it('locks every MCQ control and handler while an answer save is in flight', fakeAsync(() => {
    const session = mcqSessionWithQuestions(2);
    const delayedSave = new Subject<{ version: number; session: InterviewSession | null }>();
    service.getSession.and.returnValue(of(session));
    service.saveAnswer.and.returnValue(delayedSave.asObservable());
    fixture = TestBed.createComponent(InterviewSessionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const firstQuestion = component.currentQuestion()!;
    component.selectAnswer(firstQuestion, firstQuestion.options[1].id);
    fixture.detectChanges();

    expect(component.mcqMutationState()).toBe('saving-answer');
    expect(component.mcqControlsLocked()).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('Saving answer before you continue');
    const navigationButtons = Array.from(
      fixture.nativeElement.querySelectorAll('.question-nav button') as NodeListOf<HTMLButtonElement>,
    );
    expect(navigationButtons.every((button) => button.disabled)).toBeTrue();
    expect(
      Array.from(
        fixture.nativeElement.querySelectorAll('fieldset input[type="radio"]') as NodeListOf<HTMLInputElement>,
      ).every((radio) => radio.matches(':disabled')),
    ).toBeTrue();

    component.goToQuestion(1);
    component.showReview();
    component.submitMcq();
    component.selectAnswer(session.questions[1], session.questions[1].options[0].id);

    expect(component.currentIndex()).toBe(0);
    expect(component.reviewing()).toBeFalse();
    expect(component.session()?.questions[1].selectedOptionId).toBeNull();
    expect(service.saveAnswer).toHaveBeenCalledTimes(1);
    expect(service.submitMcq).not.toHaveBeenCalled();

    delayedSave.next({ version: 4, session: null });
    delayedSave.complete();
    fixture.detectChanges();

    expect(component.mcqMutationState()).toBe('idle');
    component.goToQuestion(1);
    expect(component.currentIndex()).toBe(1);
    discardPeriodicTasks();
  }));

  it('names MCQ controls and moves focus to the selected question and review heading', fakeAsync(() => {
    const session = mcqSessionWithQuestions(2);
    service.getSession.and.returnValue(of(session));
    fixture = TestBed.createComponent(InterviewSessionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const fieldset = fixture.nativeElement.querySelector('fieldset') as HTMLFieldSetElement;
    expect(fieldset.querySelector('legend')?.textContent).toContain('Interview question 1?');
    const navigationButtons = Array.from(
      fixture.nativeElement.querySelectorAll('.question-nav button') as NodeListOf<HTMLButtonElement>,
    );
    expect(navigationButtons.map((button) => button.getAttribute('aria-label'))).toEqual([
      'Question 1, unanswered',
      'Question 2, unanswered',
    ]);

    component.goToQuestion(1);
    fixture.detectChanges();
    tick();
    const prompt = fixture.nativeElement.querySelector(
      '[data-testid="interview-question-prompt"]',
    ) as HTMLElement;
    expect(prompt.textContent).toContain('Interview question 2?');
    expect(document.activeElement).toBe(prompt);

    component.showReview();
    fixture.detectChanges();
    tick();
    const reviewHeading = fixture.nativeElement.querySelector(
      '[data-testid="interview-review-heading"]',
    ) as HTMLElement;
    expect(document.activeElement).toBe(reviewHeading);
    discardPeriodicTasks();
  }));

  it('implements a labelled, roving-keyboard tab set for coding files', fakeAsync(() => {
    const session = codingSession();
    session.coding!.task!.files.push({
      path: '/src/App.css',
      language: 'css',
      content: 'main { display: grid; }',
      readOnly: false,
    });
    service.getSession.and.returnValue(of(session));
    fixture = TestBed.createComponent(InterviewSessionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const codingBrief = fixture.nativeElement.querySelector('.coding-brief') as HTMLElement;
    expect(codingBrief.tabIndex).toBe(0);
    expect(codingBrief.getAttribute('aria-label')).toBe('Coding task brief');

    let tabs = Array.from(
      fixture.nativeElement.querySelectorAll('[role="tab"]') as NodeListOf<HTMLButtonElement>,
    );
    expect(tabs).toHaveSize(2);
    expect(tabs[0].tabIndex).toBe(0);
    expect(tabs[1].tabIndex).toBe(-1);
    expect(tabs[0].getAttribute('aria-controls')).toBe('interview-code-panel-0');

    tabs[0].focus();
    tabs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    tabs = Array.from(
      fixture.nativeElement.querySelectorAll('[role="tab"]') as NodeListOf<HTMLButtonElement>,
    );

    expect(component.activeFilePath()).toBe('/src/App.css');
    expect(tabs[0].tabIndex).toBe(-1);
    expect(tabs[1].tabIndex).toBe(0);
    expect(tabs[1].getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(tabs[1]);
    const panel = fixture.nativeElement.querySelector('[role="tabpanel"]') as HTMLElement;
    expect(panel.id).toBe('interview-code-panel-1');
    expect(panel.getAttribute('aria-labelledby')).toBe(tabs[1].id);
    fixture.destroy();
    flush();
    discardPeriodicTasks();
  }));

  it('submits one stable V2 snapshot for all five responses and blocks duplicate manual submit', fakeAsync(() => {
    const session = mcqSessionWithQuestions();
    session.questions.forEach((question, index) => {
      question.selectedOptionId = index === 4 ? null : question.options[index % 3].id;
    });
    const delayedSubmit = new Subject<InterviewSession>();
    service.getSession.and.returnValue(of(session));
    service.submitMcq.and.returnValue(delayedSubmit.asObservable());
    fixture = TestBed.createComponent(InterviewSessionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.showReview();
    component.submitMcq();
    component.submitMcq();
    fixture.detectChanges();

    expect(service.submitMcq).toHaveBeenCalledTimes(1);
    expect(component.mcqMutationState()).toBe('submitting');
    const request = service.submitMcq.calls.mostRecent().args[1];
    expect(request).toEqual(jasmine.objectContaining({
      protocolVersion: 2,
      mutationId: jasmine.stringMatching(/^mcq-submit-/),
      expectedVersion: 3,
    }));
    expect(request.responses.length).toBe(5);
    expect(request.responses.map((response) => ({
      questionId: response.questionId,
      optionId: response.optionId,
    }))).toEqual(session.questions.map((question) => ({
      questionId: question.id,
      optionId: question.selectedOptionId,
    })));
    expect(
      (fixture.nativeElement.querySelector('[data-testid="submit-mcq"]') as HTMLButtonElement)
        .disabled,
    ).toBeTrue();

    delayedSubmit.next(codingReadyFrom(session));
    delayedSubmit.complete();
    expect(component.session()?.status).toBe('coding_ready');
    expect(component.mcqMutationState()).toBe('locked');
    flushMicrotasks();
    discardPeriodicTasks();
  }));

  it('uses the acknowledged answer version when expiry follows the save acknowledgement', fakeAsync(() => {
    const answerSave = new Subject<{ version: number; session: InterviewSession | null }>();
    const submit = new Subject<InterviewSession>();
    service.saveAnswer.and.returnValue(answerSave.asObservable());
    service.submitMcq.and.returnValue(submit.asObservable());
    fixture = TestBed.createComponent(InterviewSessionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.selectAnswer(component.currentQuestion()!, 'option-b');
    answerSave.next({ version: 4, session: null });
    answerSave.complete();
    component.handleMcqExpiry();

    expect(service.submitMcq).toHaveBeenCalledTimes(1);
    expect(service.submitMcq.calls.mostRecent().args[1]).toEqual(
      jasmine.objectContaining({ expectedVersion: 4 }),
    );
    expect(service.submitMcq.calls.mostRecent().args[1].responses[0].optionId)
      .toBe('option-b');
    discardPeriodicTasks();
  }));

  it('waits for the in-flight answer acknowledgement when expiry arrives first', fakeAsync(() => {
    const answerSave = new Subject<{ version: number; session: InterviewSession | null }>();
    const submit = new Subject<InterviewSession>();
    service.saveAnswer.and.returnValue(answerSave.asObservable());
    service.submitMcq.and.returnValue(submit.asObservable());
    fixture = TestBed.createComponent(InterviewSessionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.selectAnswer(component.currentQuestion()!, 'option-b');
    component.handleMcqExpiry();

    expect(component.mcqMutationState()).toBe('expiry-wait');
    expect(service.submitMcq).not.toHaveBeenCalled();

    answerSave.next({ version: 4, session: null });
    answerSave.complete();

    expect(service.submitMcq).toHaveBeenCalledTimes(1);
    expect(service.submitMcq.calls.mostRecent().args[1].expectedVersion).toBe(4);
    discardPeriodicTasks();
  }));

  it('coalesces duplicate expiry events into one MCQ submit mutation', fakeAsync(() => {
    const submit = new Subject<InterviewSession>();
    service.submitMcq.and.returnValue(submit.asObservable());
    fixture = TestBed.createComponent(InterviewSessionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.handleMcqExpiry();
    const mutationId = service.submitMcq.calls.mostRecent().args[1].mutationId;
    component.handleMcqExpiry();
    component.submitMcq(true);

    expect(service.submitMcq).toHaveBeenCalledTimes(1);
    expect(service.submitMcq.calls.mostRecent().args[1].mutationId).toBe(mutationId);
    discardPeriodicTasks();
  }));

  it('reconciles a 409 as saved when the authoritative answer is present', fakeAsync(() => {
    const initial = mcqSession();
    const latest = mcqSession();
    latest.version = 4;
    latest.questions[0].selectedOptionId = 'option-b';
    const answerSave = new Subject<{ version: number; session: InterviewSession | null }>();
    service.getSession.and.returnValues(of(initial), of(latest));
    service.saveAnswer.and.returnValue(answerSave.asObservable());
    fixture = TestBed.createComponent(InterviewSessionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.selectAnswer(component.currentQuestion()!, 'option-b');
    answerSave.error({ status: 409 });
    fixture.detectChanges();

    expect(service.getSession).toHaveBeenCalledTimes(2);
    expect(component.session()?.version).toBe(4);
    expect(component.session()?.questions[0].selectedOptionId).toBe('option-b');
    expect(component.mcqMutationState()).toBe('idle');
    expect(component.mcqAlert()).toBeNull();
    discardPeriodicTasks();
  }));

  it('announces that a 409 selection absent from the authoritative session was not counted', fakeAsync(() => {
    const initial = mcqSession();
    const latest = mcqSession();
    latest.version = 4;
    const answerSave = new Subject<{ version: number; session: InterviewSession | null }>();
    service.getSession.and.returnValues(of(initial), of(latest));
    service.saveAnswer.and.returnValue(answerSave.asObservable());
    fixture = TestBed.createComponent(InterviewSessionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.selectAnswer(component.currentQuestion()!, 'option-b');
    answerSave.error({ status: 409 });
    fixture.detectChanges();

    const alert = fixture.nativeElement.querySelector('[data-testid="mcq-alert"]');
    expect(alert?.getAttribute('role')).toBe('alert');
    expect(alert?.textContent).toContain('not counted');
    expect(component.session()?.questions[0].selectedOptionId).toBeNull();
    expect(component.mcqMutationState()).toBe('idle');
    discardPeriodicTasks();
  }));

  it('retries a lost answer response with the same mutation id after a same-version GET', fakeAsync(() => {
    const initial = mcqSession();
    const unchanged = mcqSession();
    const firstSave = new Subject<{ version: number; session: InterviewSession | null }>();
    const retrySave = new Subject<{ version: number; session: InterviewSession | null }>();
    service.getSession.and.returnValues(of(initial), of(unchanged));
    service.saveAnswer.and.returnValues(firstSave.asObservable(), retrySave.asObservable());
    fixture = TestBed.createComponent(InterviewSessionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.selectAnswer(component.currentQuestion()!, 'option-b');
    const firstRequest = service.saveAnswer.calls.mostRecent().args[1];
    firstSave.error({ status: 0 });
    fixture.detectChanges();

    expect(component.mcqAlert()).toContain('not counted');
    expect(component.session()?.questions[0].selectedOptionId).toBeNull();
    component.selectAnswer(component.currentQuestion()!, 'option-b');
    const retryRequest = service.saveAnswer.calls.mostRecent().args[1];

    expect(service.saveAnswer).toHaveBeenCalledTimes(2);
    expect(retryRequest.mutationId).toBe(firstRequest.mutationId);
    expect(retryRequest.expectedVersion).toBe(firstRequest.expectedVersion);

    retrySave.next({ version: 4, session: null });
    retrySave.complete();
    expect(component.mcqMutationState()).toBe('idle');
    expect(component.mcqAlert()).toBeNull();
    discardPeriodicTasks();
  }));

  it('reports an uncounted final selection when expiry reconciliation has already locked MCQ', fakeAsync(() => {
    const initial = mcqSession();
    const latest = codingReadyFrom(mcqSession(), 4);
    const answerSave = new Subject<{ version: number; session: InterviewSession | null }>();
    service.getSession.and.returnValues(of(initial), of(latest));
    service.saveAnswer.and.returnValue(answerSave.asObservable());
    fixture = TestBed.createComponent(InterviewSessionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.selectAnswer(component.currentQuestion()!, 'option-b');
    component.handleMcqExpiry();
    answerSave.error({ status: 0 });
    fixture.detectChanges();

    expect(component.session()?.status).toBe('coding_ready');
    expect(component.mcqMutationState()).toBe('locked');
    expect(component.mcqAlert()).toContain('not counted');
    expect(fixture.nativeElement.querySelector('[data-testid="mcq-alert"]')?.textContent)
      .toContain('not counted');
    expect(service.submitMcq).not.toHaveBeenCalled();
    discardPeriodicTasks();
  }));

  it('ignores a stale answer acknowledgement after an authoritative terminal session wins', fakeAsync(() => {
    const answerSave = new Subject<{ version: number; session: InterviewSession | null }>();
    service.saveAnswer.and.returnValue(answerSave.asObservable());
    fixture = TestBed.createComponent(InterviewSessionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.selectAnswer(component.currentQuestion()!, 'option-b');
    (component as any).applySession({
      ...mcqSession(),
      status: 'completed',
      version: 9,
    });
    answerSave.next({ version: 4, session: null });
    answerSave.complete();

    expect(component.session()?.status).toBe('completed');
    expect(component.session()?.version).toBe(9);
    expect(component.mcqMutationState()).toBe('locked');
    discardPeriodicTasks();
  }));

  it('ignores an older session GET that resolves after a newer reload', () => {
    const older = new Subject<InterviewSession>();
    const newer = new Subject<InterviewSession>();
    service.getSession.and.returnValues(older.asObservable(), newer.asObservable());
    fixture = TestBed.createComponent(InterviewSessionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.load();
    newer.next({ ...mcqSession(), version: 9 });
    newer.complete();
    older.next({ ...mcqSession(), version: 2 });
    older.complete();

    expect(component.session()?.version).toBe(9);
    expect(component.loading()).toBeFalse();
  });

  it('reconciles coding deadlines with the server without starting or submitting client-side', () => {
    fixture = TestBed.createComponent(InterviewSessionComponent);
    component = fixture.componentInstance;
    const reload = spyOn(component, 'load');

    component.reconcileAfterCodingDeadline();

    expect(reload).toHaveBeenCalled();
    expect(service.startCoding).not.toHaveBeenCalled();
    expect(service.submitCoding).not.toHaveBeenCalled();
  });

  it('freezes coding immediately at the deadline and ignores a late autosave acknowledgement', fakeAsync(() => {
    const lateSave = new Subject<{
      version: number;
      draft: NonNullable<NonNullable<InterviewSession['coding']>['draft']>;
    }>();
    const reconciliation = new Subject<InterviewSession>();
    service.getSession.and.returnValues(
      of(codingSession()),
      reconciliation.asObservable(),
    );
    service.saveCodingDraft.and.returnValue(lateSave.asObservable());
    fixture = TestBed.createComponent(InterviewSessionComponent);
    component = fixture.componentInstance;
    component.editorFallback.set(true);
    fixture.detectChanges();

    component.onCodeChange('export default function App() { return <p>Late</p>; }');
    tick(800);
    expect(service.saveCodingDraft).toHaveBeenCalled();

    component.reconcileAfterCodingDeadline(true);
    fixture.detectChanges();

    expect(component.codingRoundFrozen()).toBeTrue();
    expect(
      fixture.nativeElement.querySelector('.coding-layout')?.hasAttribute('inert'),
    ).toBeTrue();

    reconciliation.next({ ...codingSession(), status: 'completed', version: 7 });
    reconciliation.complete();
    lateSave.next({
      version: 6,
      draft: {
        files: codingSession().coding!.task!.files,
        hash: 'late-hash',
        revision: null,
        updatedAt: '2026-07-29T12:00:00.000Z',
      },
    });
    lateSave.complete();

    expect(component.session()?.version).toBe(7);
    expect(component.syncedDraftHash()).toBeNull();
    expect(localStorage.getItem(recoveryKey('coding'))).toBeNull();
    discardPeriodicTasks();
  }));

  it('freezes system-design edits immediately while an expired timer waits for the server', fakeAsync(() => {
    const delayedReconciliation = new Subject<InterviewSession>();
    service.getSession.and.returnValues(
      of(systemDesignSession()),
      delayedReconciliation.asObservable(),
    );
    fixture = TestBed.createComponent(InterviewSessionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.reconcileAfterSystemDesignDeadline(true);
    fixture.detectChanges();
    const round = fixture.debugElement
      .query(By.directive(InterviewSystemDesignRoundComponent))
      .componentInstance as InterviewSystemDesignRoundComponent;

    expect(component.loading()).toBeTrue();
    expect(component.systemDesignRoundFrozen()).toBeTrue();
    expect(round.interactionLocked()).toBeTrue();

    round.toggleClarification('keyboard');
    tick(800);

    expect(round.draft().selectedClarificationIds).toEqual([]);
    expect(service.saveSystemDesignDraft).not.toHaveBeenCalled();
    discardPeriodicTasks();
  }));

  it('clears the session-scoped local code when server reconciliation completes the interview', () => {
    fixture = TestBed.createComponent(InterviewSessionComponent);
    component = fixture.componentInstance;
    (component as any).sessionId = 'session-1';
    storeRecovery('coding', { files: [{ path: 'src/App.tsx', content: 'private draft' }] });
    storeRecovery('system-design', { scratchpad: 'private design notes' });

    (component as any).applySession({
      ...codingSession(),
      status: 'completed',
    });

    expect(localStorage.getItem(recoveryKey('coding'))).toBeNull();
    expect(localStorage.getItem(recoveryKey('system-design'))).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/interview', 'session-1', 'results']);
  });

  it('writes a session-specific local draft and debounces API autosave', fakeAsync(() => {
    service.getSession.and.returnValue(of(codingSession()));
    fixture = TestBed.createComponent(InterviewSessionComponent);
    component = fixture.componentInstance;
    component.editorFallback.set(true);
    fixture.detectChanges();

    component.onCodeChange('export default function App() { return null; }');
    expect(recoveryPayload<any>('coding')?.files[0].content).toContain('return null');
    expect(service.saveCodingDraft).not.toHaveBeenCalled();

    tick(800);
    expect(service.saveCodingDraft).toHaveBeenCalledWith(
      'session-1',
      {
        language: 'react',
        files: [{
          path: '/src/App.tsx',
          content: 'export default function App() { return null; }',
        }],
      },
      5,
    );
    expect(component.draftSync()).toBe('saved');
    expect(component.syncedDraftHash()).toBe('saved-draft-hash');
    discardPeriodicTasks();
  }));

  it('treats identical server code as acknowledged after the save response is lost', fakeAsync(() => {
    const acknowledged = codingSession();
    acknowledged.coding!.draft = {
      files: [{
        ...acknowledged.coding!.task!.files[0],
        content: 'export default function App() { return <p>Recovered</p>; }',
      }],
      hash: 'acknowledged-server-hash',
      revision: null,
      updatedAt: '2026-07-29T12:00:00.000Z',
    };
    localStorage.setItem('fa:interview:coding-draft:v1:session-1', JSON.stringify({
      sessionId: 'session-1',
      taskId: 'react-counter',
      files: [{
        path: '/src/App.tsx',
        content: 'export default function App() { return <p>Recovered</p>; }',
      }],
      updatedAt: '2026-07-29T11:59:59.000Z',
      activeFilePath: '/src/App.tsx',
      dirty: true,
      baseHash: 'older-server-hash',
    }));
    service.getSession.and.returnValue(of(acknowledged));

    fixture = TestBed.createComponent(InterviewSessionComponent);
    component = fixture.componentInstance;
    component.editorFallback.set(true);
    fixture.detectChanges();
    expect(localStorage.getItem('fa:interview:coding-draft:v1:session-1')).toBeNull();
    tick(1_000);

    expect(component.codingDraftConflict()).toBeFalse();
    expect(component.codingFiles()[0].content).toContain('<p>Recovered</p>');
    expect(component.syncedDraftHash()).toBe('acknowledged-server-hash');
    expect(component.draftSync()).toBe('saved');
    expect(service.saveCodingDraft).not.toHaveBeenCalled();
    expect(localStorage.getItem(recoveryKey('coding'))).toBeNull();
    discardPeriodicTasks();
  }));

  it('does not let a clean coding save acknowledgement overwrite another tab recovery record', fakeAsync(() => {
    service.getSession.and.returnValue(of(codingSession()));
    fixture = TestBed.createComponent(InterviewSessionComponent);
    component = fixture.componentInstance;
    component.editorFallback.set(true);
    fixture.detectChanges();

    component.onCodeChange('export default function App() { return <p>This tab</p>; }');
    storeRecovery('coding', {
      sessionId: 'session-1',
      taskId: 'react-counter',
      files: [{
        path: '/src/App.tsx',
        content: 'export default function App() { return <p>Other tab</p>; }',
      }],
      updatedAt: '2026-07-29T12:30:00.000Z',
      activeFilePath: '/src/App.tsx',
      dirty: true,
      baseHash: null,
    });

    tick(800);

    const stored = recoveryPayload<any>('coding');
    expect(stored?.files[0].content).toContain('Other tab');
    expect(component.codingFiles()[0].content).toContain('This tab');
    expect(component.localCodingPersistenceAvailable()).toBeFalse();
    expect(component.syncedDraftHash()).toBe('saved-draft-hash');
    discardPeriodicTasks();
  }));

  it('preserves this tab draft when a 409 reload races with another tab storage write', fakeAsync(() => {
    const initial = codingSession();
    initial.coding!.draft = {
      files: initial.coding!.task!.files,
      hash: 'base-hash',
      revision: null,
      updatedAt: '2026-07-29T11:59:00.000Z',
    };
    const serverCurrent = codingSession();
    serverCurrent.version = 6;
    serverCurrent.coding!.draft = {
      files: [{
        ...serverCurrent.coding!.task!.files[0],
        content: 'export default function App() { return <p>Server current</p>; }',
      }],
      hash: 'server-current-hash',
      revision: null,
      updatedAt: '2026-07-29T12:01:00.000Z',
    };
    const conflictingSave = new Subject<{
      version: number;
      draft: NonNullable<NonNullable<InterviewSession['coding']>['draft']>;
    }>();
    service.getSession.and.returnValues(of(initial), of(serverCurrent));
    service.saveCodingDraft.and.returnValues(
      conflictingSave.asObservable(),
      of({
        version: 7,
        draft: {
          files: [{
            ...serverCurrent.coding!.task!.files[0],
            content: 'export default function App() { return <p>This tab</p>; }',
          }],
          hash: 'this-tab-hash',
          revision: null,
          updatedAt: '2026-07-29T12:02:00.000Z',
        },
      }),
    );
    fixture = TestBed.createComponent(InterviewSessionComponent);
    component = fixture.componentInstance;
    component.editorFallback.set(true);
    fixture.detectChanges();

    component.onCodeChange('export default function App() { return <p>This tab</p>; }');
    tick(800);
    expect(service.saveCodingDraft.calls.mostRecent().args[1].files[0].content)
      .toContain('This tab');

    storeRecovery('coding', {
      sessionId: 'session-1',
      taskId: 'react-counter',
      files: [{
        path: '/src/App.tsx',
        content: 'export default function App() { return <p>Other tab</p>; }',
      }],
      updatedAt: '2026-07-29T12:01:30.000Z',
      activeFilePath: '/src/App.tsx',
      dirty: true,
      baseHash: 'base-hash',
    });
    conflictingSave.error({ status: 409 });

    expect(component.codingDraftConflict()).toBeTrue();
    expect(component.codingFiles()[0].content).toContain('Server current');

    component.restoreCodingDeviceDraft();

    expect(component.codingFiles()[0].content).toContain('This tab');
    tick(0);
    expect(service.saveCodingDraft.calls.mostRecent().args[1].files[0].content)
      .toContain('This tab');
    const stored = recoveryPayload<any>('coding');
    expect(stored?.files[0].content).toContain('Other tab');
    expect(component.localCodingPersistenceAvailable()).toBeFalse();
    discardPeriodicTasks();
  }));

  it('restores an edit made during an older in-flight save using the acknowledged causal hash', fakeAsync(() => {
    const initial = codingSession();
    initial.coding!.draft = {
      files: initial.coding!.task!.files,
      hash: 'base-hash',
      revision: null,
      updatedAt: '2026-07-29T11:59:00.000Z',
    };
    const firstSave = new Subject<{
      version: number;
      draft: NonNullable<NonNullable<InterviewSession['coding']>['draft']>;
    }>();
    service.getSession.and.returnValue(of(initial));
    service.saveCodingDraft.and.returnValue(firstSave.asObservable());
    fixture = TestBed.createComponent(InterviewSessionComponent);
    component = fixture.componentInstance;
    component.editorFallback.set(true);
    fixture.detectChanges();

    component.onCodeChange('export default function App() { return <p>A</p>; }');
    tick(800);
    component.onCodeChange('export default function App() { return <p>B</p>; }');
    firstSave.next({
      version: 6,
      draft: {
        files: [{
          ...initial.coding!.task!.files[0],
          content: 'export default function App() { return <p>A</p>; }',
        }],
        hash: 'acknowledged-a-hash',
        revision: null,
        updatedAt: '2026-07-29T12:00:02.000Z',
      },
    });
    firstSave.complete();

    const localBeforeClose = recoveryPayload<any>('coding');
    expect(localBeforeClose?.dirty).toBeTrue();
    expect(localBeforeClose?.baseHash).toBe('acknowledged-a-hash');
    fixture.destroy();

    const resumed = codingSession();
    resumed.version = 6;
    resumed.coding!.draft = {
      files: [{
        ...resumed.coding!.task!.files[0],
        content: 'export default function App() { return <p>A</p>; }',
      }],
      hash: 'acknowledged-a-hash',
      revision: null,
      updatedAt: '2026-07-29T12:00:02.000Z',
    };
    service.getSession.and.returnValue(of(resumed));
    service.saveCodingDraft.and.returnValue(of({
      version: 7,
      draft: {
        files: [{
          ...resumed.coding!.task!.files[0],
          content: 'export default function App() { return <p>B</p>; }',
        }],
        hash: 'latest-b-hash',
        revision: null,
        updatedAt: '2026-07-29T12:00:03.000Z',
      },
    }));
    fixture = TestBed.createComponent(InterviewSessionComponent);
    component = fixture.componentInstance;
    component.editorFallback.set(true);
    fixture.detectChanges();

    expect(component.codingFiles()[0].content).toContain('<p>B</p>');
    expect(component.codingDraftConflict()).toBeFalse();
    tick(0);
    expect(service.saveCodingDraft.calls.mostRecent().args[1].files[0].content)
      .toContain('<p>B</p>');
    fixture.destroy();
    discardPeriodicTasks();
  }));

  it('restores the active pinned coding file after a close and reopen', () => {
    const session = codingSession();
    session.coding!.task!.files.push({
      path: '/src/styles.css',
      language: 'css',
      content: 'main { display: grid; }',
      readOnly: false,
    });
    service.getSession.and.returnValue(of(session));
    fixture = TestBed.createComponent(InterviewSessionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    component.selectFile('/src/styles.css');
    fixture.destroy();

    fixture = TestBed.createComponent(InterviewSessionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.activeFilePath()).toBe('/src/styles.css');
  });

  it('does not claim an offline coding draft is stored when localStorage rejects it', () => {
    service.getSession.and.returnValue(of(codingSession()));
    fixture = TestBed.createComponent(InterviewSessionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    spyOnProperty(navigator, 'onLine', 'get').and.returnValue(false);
    spyOn(localStorage, 'setItem').and.throwError('storage blocked');

    component.onCodeChange('export default function App() { return <p>Memory only</p>; }');

    expect(component.localCodingPersistenceAvailable()).toBeFalse();
    expect(component.draftStatusLabel()).toBe('Offline · kept in this tab only');
  });

  it('prepares checks, executes them in the browser sandbox, then records pass/fail ids', fakeAsync(() => {
    const session = codingSession();
    session.track = 'core-web';
    session.coding!.task = {
      ...session.coding!.task!,
      id: 'escape-html',
      sourceQuestionId: 'js-escape-html',
      files: [{
        path: 'escapeHtml.js',
        language: 'javascript',
        content: 'export default function escapeHtml(value) { return value; }',
        readOnly: false,
      }],
    };
    session.coding!.draft = {
      files: session.coding!.task.files,
      hash: 'draft-hash',
      revision: null,
      updatedAt: '2026-07-27T12:00:00.000Z',
    };
    service.getSession.and.returnValue(of(session));
    service.prepareCodingCheckRun.and.returnValue(of({
      runToken: 'run-token',
      expiresAt: '2026-07-27T12:05:00.000Z',
      draftHash: 'draft-hash',
      expectedCheckIds: ['escape'],
      evidenceMode: 'client-self-report',
      authoritative: false,
      runnerConfig: {
        kind: 'javascript',
        language: 'javascript',
        tests: "import escapeHtml from './escapeHtml'; test('escapes', () => expect(escapeHtml('x')).toBe('x'));",
        checks: [{ id: 'escape', name: 'escapes' }],
      },
    }));
    sandbox.runWithTests.and.resolveTo({
      entries: [],
      results: [{ name: 'escapes', passed: true }],
    });
    service.completeCodingCheckRun.and.returnValue(of({
      version: 6,
      results: [{ id: 'escape', name: 'escapes', passed: true }],
    }));
    fixture = TestBed.createComponent(InterviewSessionComponent);
    component = fixture.componentInstance;
    component.editorFallback.set(true);
    fixture.detectChanges();

    component.runChecks();
    flushMicrotasks();

    expect(sandbox.runWithTests).toHaveBeenCalledWith(jasmine.objectContaining({
      userCode: jasmine.stringMatching('__FA_USER_DEFAULT__'),
      testCode: jasmine.stringMatching('globalThis.__FA_USER_DEFAULT__'),
    }));
    expect(service.completeCodingCheckRun).toHaveBeenCalledWith(
      session.id,
      jasmine.objectContaining({ runToken: 'run-token', draftHash: 'draft-hash' }),
      [{ id: 'escape', passed: true }],
      5,
    );
    expect(component.checkResults()[0].passed).toBeTrue();
    expect(component.session()?.version).toBe(6);
    fixture.destroy();
    flush();
    discardPeriodicTasks();
  }));

  it('hydrates an asset-only framework task from the panel file emission and autosaves it', fakeAsync(() => {
    const session = codingSession();
    session.coding!.task = {
      ...session.coding!.task!,
      runner: 'framework-preview',
      starterAsset: 'assets/sb/react/question/react-counter.v2.json',
      files: [],
    };
    fixture = TestBed.createComponent(InterviewSessionComponent);
    component = fixture.componentInstance;
    (component as any).sessionId = session.id;
    component.session.set(session);

    (component as any).initializeCoding(session);

    expect(component.frameworkStarterFiles()).toBeNull();
    expect((component.frameworkQuestion() as any)?.sdk?.asset)
      .toBe('assets/sb/react/question/react-counter.v2.json');

    component.onFrameworkFilesChanged({
      'src/App.tsx': 'export default function App() { return <main>Starter</main>; }',
      'src/App.css': 'main { display: grid; }',
    });
    tick(800);

    expect(component.codingFiles().map((file) => file.path)).toEqual([
      'src/App.tsx',
      'src/App.css',
    ]);
    expect(service.saveCodingDraft).toHaveBeenCalledWith(
      session.id,
      jasmine.objectContaining({
        language: 'react',
        files: jasmine.arrayContaining([
          jasmine.objectContaining({ path: 'src/App.tsx' }),
          jasmine.objectContaining({ path: 'src/App.css' }),
        ]),
      }),
      5,
    );
  }));

  it('renders long MCQ snippets in a dedicated scroll container', () => {
    const session = mcqSession();
    session.questions[0] = {
      ...session.questions[0],
      code: `const payload = "${'x'.repeat(240)}";`,
      codeLanguage: 'javascript',
    };
    service.getSession.and.returnValue(of(session));
    fixture = TestBed.createComponent(InterviewSessionComponent);
    fixture.detectChanges();

    const snippet = fixture.nativeElement.querySelector('.question-code') as HTMLElement;
    expect(snippet).not.toBeNull();
    expect(snippet.textContent).toContain('const payload');
  });

  it('keeps a newer server draft instead of overlaying an older local tab', () => {
    const session = codingSession();
    session.coding!.draft = {
      files: [{
        path: '/src/App.tsx',
        language: 'typescript',
        content: 'export default function App() { return <p>New server</p>; }',
        readOnly: false,
      }],
      hash: 'new-server-hash',
      revision: null,
      updatedAt: '2026-07-27T12:00:00.000Z',
    };
    localStorage.setItem('fa:interview:coding-draft:v1:session-1', JSON.stringify({
      sessionId: 'session-1',
      taskId: 'react-counter',
      files: [{
        path: '/src/App.tsx',
        content: 'export default function App() { return <p>Old local</p>; }',
      }],
      updatedAt: '2026-07-27T11:00:00.000Z',
    }));
    fixture = TestBed.createComponent(InterviewSessionComponent);
    component = fixture.componentInstance;
    (component as any).sessionId = session.id;
    component.session.set(session);

    (component as any).initializeCoding(session);

    expect(component.codingFiles()[0].content).toContain('New server');
    expect(component.syncedDraftHash()).toBe('new-server-hash');
    expect(localStorage.getItem(recoveryKey('coding'))).toBeNull();
  });

  it('restores newer local framework files when the asset-only server draft is missing', () => {
    const session = codingSession();
    session.coding!.task = {
      ...session.coding!.task!,
      runner: 'framework-preview',
      starterAsset: 'assets/sb/react/question/react-counter.v2.json',
      files: [],
    };
    localStorage.setItem('fa:interview:coding-draft:v1:session-1', JSON.stringify({
      sessionId: 'session-1',
      taskId: 'react-counter',
      files: [{
        path: 'src/App.tsx',
        content: 'export default function App() { return <p>Offline local</p>; }',
      }],
      updatedAt: '2026-07-27T12:10:00.000Z',
    }));
    fixture = TestBed.createComponent(InterviewSessionComponent);
    component = fixture.componentInstance;
    (component as any).sessionId = session.id;
    component.session.set(session);

    (component as any).initializeCoding(session);

    expect(component.codingFiles()[0].content).toContain('Offline local');
    expect(component.frameworkStarterFiles()?.['src/App.tsx']).toContain('Offline local');
    expect(localStorage.getItem('fa:interview:coding-draft:v1:session-1')).toBeNull();
    expect(recoveryPayload<any>('coding')?.files[0].content).toContain('Offline local');
  });
});
