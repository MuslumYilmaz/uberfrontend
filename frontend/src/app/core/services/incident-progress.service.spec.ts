import { TestBed } from '@angular/core/testing';
import { IncidentProgressService } from './incident-progress.service';

const PROGRESS_KEY = 'fa:practice:progress:v2';
const SESSION_KEY = 'fa:practice:session:v2:incident:incident-1';

describe('IncidentProgressService', () => {
  let service: IncidentProgressService;

  beforeEach(() => {
    localStorage.removeItem(PROGRESS_KEY);
    localStorage.removeItem(SESSION_KEY);

    TestBed.configureTestingModule({
      providers: [IncidentProgressService],
    });

    service = TestBed.inject(IncidentProgressService);
  });

  afterEach(() => {
    localStorage.removeItem(PROGRESS_KEY);
    localStorage.removeItem(SESSION_KEY);
  });

  it('marks the first start and persists it', () => {
    const record = service.markStarted('incident-1');

    expect(record.started).toBeTrue();
    expect(record.lastPlayedAt).not.toBeNull();
    expect(JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}')['incident:incident-1'].started).toBeTrue();
  });

  it('updates best score on replay and keeps the passed flag once earned', () => {
    service.completeAttempt('incident-1', 72);
    const replay = service.completeAttempt('incident-1', 65);

    expect(replay.bestScore).toBe(72);
    expect(replay.passed).toBeTrue();
  });

  it('persists reflection notes and restores session state after refresh', () => {
    service.saveReflection('incident-1', 'Need a better guardrail.');
    service.saveSession('incident-1', {
      activeStepIndex: 3,
      answers: { root: 'a', fixes: ['x', 'y'] },
      submittedStageIds: ['root', 'fixes'],
    });

    const restored = TestBed.runInInjectionContext(() => new IncidentProgressService());
    const record = restored.getRecord('incident-1');
    const session = restored.loadSession('incident-1');

    expect(record.reflectionNote).toBe('Need a better guardrail.');
    expect(session?.activeStepIndex).toBe(3);
    expect(session?.submittedStageIds).toEqual(['root', 'fixes']);
  });
});
