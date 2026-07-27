import { convertToParamMap, ActivatedRoute, Router } from '@angular/router';
import {
  ComponentFixture,
  TestBed,
  discardPeriodicTasks,
  fakeAsync,
  flush,
  flushMicrotasks,
  tick,
} from '@angular/core/testing';
import { of } from 'rxjs';
import { InterviewSession } from '../../core/models/interview.model';
import { InterviewService } from '../../core/services/interview.service';
import { UserCodeSandboxService } from '../../core/services/user-code-sandbox.service';
import { InterviewSessionComponent } from './interview-session.component';

describe('InterviewSessionComponent', () => {
  let fixture: ComponentFixture<InterviewSessionComponent>;
  let component: InterviewSessionComponent;
  let service: jasmine.SpyObj<InterviewService>;
  let sandbox: jasmine.SpyObj<UserCodeSandboxService>;
  let router: jasmine.SpyObj<Router>;

  const mcqSession = (): InterviewSession => ({
    id: 'session-1',
    status: 'mcq_active',
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

  it('reconciles coding deadlines with the server without starting or submitting client-side', () => {
    fixture = TestBed.createComponent(InterviewSessionComponent);
    component = fixture.componentInstance;
    const reload = spyOn(component, 'load');

    component.reconcileAfterCodingDeadline();

    expect(reload).toHaveBeenCalled();
    expect(service.startCoding).not.toHaveBeenCalled();
    expect(service.submitCoding).not.toHaveBeenCalled();
  });

  it('clears the session-scoped local code when server reconciliation completes the interview', () => {
    fixture = TestBed.createComponent(InterviewSessionComponent);
    component = fixture.componentInstance;
    (component as any).sessionId = 'session-1';
    localStorage.setItem(
      'fa:interview:coding-draft:v1:session-1',
      JSON.stringify({ files: [{ path: 'src/App.tsx', content: 'private draft' }] }),
    );

    (component as any).applySession({
      ...codingSession(),
      status: 'completed',
    });

    expect(localStorage.getItem('fa:interview:coding-draft:v1:session-1')).toBeNull();
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
