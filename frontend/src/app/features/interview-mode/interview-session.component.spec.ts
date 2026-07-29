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
import { UserCodeSandboxService } from '../../core/services/user-code-sandbox.service';
import { InterviewSessionComponent } from './interview-session.component';
import { InterviewSystemDesignRoundComponent } from './interview-system-design-round.component';

describe('InterviewSessionComponent', () => {
  let fixture: ComponentFixture<InterviewSessionComponent>;
  let component: InterviewSessionComponent;
  let service: jasmine.SpyObj<InterviewService>;
  let sandbox: jasmine.SpyObj<UserCodeSandboxService>;
  let router: jasmine.SpyObj<Router>;

  const mcqSession = (): InterviewSession => ({
    id: 'session-1',
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
  });

  afterEach(() => {
    if (fixture && !fixture.componentRef.hostView.destroyed) fixture.destroy();
    localStorage.removeItem('fa:interview:coding-draft:v1:session-1');
    localStorage.removeItem('fa:interview:system-design-draft:v1:session-1');
    localStorage.removeItem('fa:interview:mcq-timing:v1:session-1');
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
        questionId: 'question-1',
        optionId: 'option-b',
        responseDurationMs: jasmine.any(Number),
      },
      3,
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
        questionId: 'question-1',
        optionId: 'option-b',
      }),
      3,
    ]);
    expect(component.session()?.questions[0].selectedOptionId).toBe('option-b');
    const persisted = JSON.parse(
      localStorage.getItem('fa:interview:mcq-timing:v1:session-1') || '{}',
    );
    expect(persisted.pendingAnswer).toBeNull();
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
    expect(localStorage.getItem('fa:interview:coding-draft:v1:session-1')).toBeNull();
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
    localStorage.setItem(
      'fa:interview:coding-draft:v1:session-1',
      JSON.stringify({ files: [{ path: 'src/App.tsx', content: 'private draft' }] }),
    );
    localStorage.setItem(
      'fa:interview:system-design-draft:v1:session-1',
      JSON.stringify({ scratchpad: 'private design notes' }),
    );

    (component as any).applySession({
      ...codingSession(),
      status: 'completed',
    });

    expect(localStorage.getItem('fa:interview:coding-draft:v1:session-1')).toBeNull();
    expect(localStorage.getItem('fa:interview:system-design-draft:v1:session-1')).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/interview', 'session-1', 'results']);
  });

  it('writes a session-specific local draft and debounces API autosave', fakeAsync(() => {
    service.getSession.and.returnValue(of(codingSession()));
    fixture = TestBed.createComponent(InterviewSessionComponent);
    component = fixture.componentInstance;
    component.editorFallback.set(true);
    fixture.detectChanges();

    component.onCodeChange('export default function App() { return null; }');
    expect(localStorage.getItem('fa:interview:coding-draft:v1:session-1')).toContain('return null');
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
    tick(1_000);

    expect(component.codingDraftConflict()).toBeFalse();
    expect(component.codingFiles()[0].content).toContain('<p>Recovered</p>');
    expect(component.syncedDraftHash()).toBe('acknowledged-server-hash');
    expect(component.draftSync()).toBe('saved');
    expect(service.saveCodingDraft).not.toHaveBeenCalled();
    expect(localStorage.getItem('fa:interview:coding-draft:v1:session-1')).toBeNull();
    discardPeriodicTasks();
  }));

  it('does not let a clean coding save acknowledgement overwrite another tab recovery record', fakeAsync(() => {
    service.getSession.and.returnValue(of(codingSession()));
    fixture = TestBed.createComponent(InterviewSessionComponent);
    component = fixture.componentInstance;
    component.editorFallback.set(true);
    fixture.detectChanges();

    component.onCodeChange('export default function App() { return <p>This tab</p>; }');
    localStorage.setItem('fa:interview:coding-draft:v1:session-1', JSON.stringify({
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
    }));

    tick(800);

    const stored = JSON.parse(
      localStorage.getItem('fa:interview:coding-draft:v1:session-1') || '{}',
    );
    expect(stored.files[0].content).toContain('Other tab');
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

    localStorage.setItem('fa:interview:coding-draft:v1:session-1', JSON.stringify({
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
    }));
    conflictingSave.error({ status: 409 });

    expect(component.codingDraftConflict()).toBeTrue();
    expect(component.codingFiles()[0].content).toContain('Server current');

    component.restoreCodingDeviceDraft();

    expect(component.codingFiles()[0].content).toContain('This tab');
    tick(0);
    expect(service.saveCodingDraft.calls.mostRecent().args[1].files[0].content)
      .toContain('This tab');
    const stored = JSON.parse(
      localStorage.getItem('fa:interview:coding-draft:v1:session-1') || '{}',
    );
    expect(stored.files[0].content).toContain('Other tab');
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

    const localBeforeClose = JSON.parse(
      localStorage.getItem('fa:interview:coding-draft:v1:session-1') || '{}',
    );
    expect(localBeforeClose.dirty).toBeTrue();
    expect(localBeforeClose.baseHash).toBe('acknowledged-a-hash');
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
    expect(localStorage.getItem('fa:interview:coding-draft:v1:session-1')).toBeNull();
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
  });
});
