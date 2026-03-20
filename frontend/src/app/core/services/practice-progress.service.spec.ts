import { TestBed } from '@angular/core/testing';
import { PracticeProgressService } from './practice-progress.service';

const PRACTICE_PROGRESS_KEY = 'fa:practice:progress:v2';
const PRACTICE_SESSION_PREFIX = 'fa:practice:session:v2:';
const LEGACY_INCIDENT_PROGRESS_KEY = 'fa:incidents:progress:v1';
const LEGACY_INCIDENT_SESSION_KEY = 'fa:incidents:session:v1:incident-1';

describe('PracticeProgressService', () => {
  afterEach(() => {
    localStorage.removeItem(PRACTICE_PROGRESS_KEY);
    localStorage.removeItem(`${PRACTICE_SESSION_PREFIX}incident:incident-1`);
    localStorage.removeItem(`${PRACTICE_SESSION_PREFIX}code-review:review-1`);
    localStorage.removeItem(LEGACY_INCIDENT_PROGRESS_KEY);
    localStorage.removeItem(LEGACY_INCIDENT_SESSION_KEY);
    TestBed.resetTestingModule();
  });

  it('migrates legacy incident progress and session state into the shared core store', () => {
    localStorage.setItem(LEGACY_INCIDENT_PROGRESS_KEY, JSON.stringify({
      'incident-1': {
        started: true,
        completed: true,
        passed: true,
        bestScore: 84,
        lastPlayedAt: '2026-03-19T12:00:00.000Z',
        reflectionNote: 'Guard against stale responses.',
      },
    }));
    localStorage.setItem(LEGACY_INCIDENT_SESSION_KEY, JSON.stringify({
      activeStepIndex: 2,
      answers: { root: 'latest-response-race' },
      submittedStageIds: ['root'],
    }));

    TestBed.configureTestingModule({
      providers: [PracticeProgressService],
    });

    const service = TestBed.inject(PracticeProgressService);
    const record = service.getRecord('incident', 'incident-1');
    const session = service.loadSession<{ activeStepIndex: number }>('incident', 'incident-1');

    expect(record.started).toBeTrue();
    expect(record.passed).toBeTrue();
    expect(record.bestScore).toBe(84);
    expect(record.extension?.['reflectionNote']).toBe('Guard against stale responses.');
    expect(session?.activeStepIndex).toBe(2);
    expect(localStorage.getItem(LEGACY_INCIDENT_PROGRESS_KEY)).toBeNull();
    expect(localStorage.getItem(LEGACY_INCIDENT_SESSION_KEY)).toBeNull();
    expect(localStorage.getItem(PRACTICE_PROGRESS_KEY)).toContain('incident:incident-1');
  });

  it('persists extension blobs for non-incident families', () => {
    TestBed.configureTestingModule({
      providers: [PracticeProgressService],
    });

    const service = TestBed.inject(PracticeProgressService);
    const updated = service.updateRecord('code-review', 'review-1', (current) => ({
      ...current,
      started: true,
      completed: true,
      bestScore: 91,
      extension: {
        draft: 'Flag render-side effects before approving.',
      },
    }));

    const restored = TestBed.runInInjectionContext(() => new PracticeProgressService());
    const record = restored.getRecord('code-review', 'review-1');

    expect(updated.bestScore).toBe(91);
    expect(record.started).toBeTrue();
    expect(record.extension?.['draft']).toBe('Flag render-side effects before approving.');
  });
});
