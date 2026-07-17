import { TestBed } from '@angular/core/testing';
import { createEmptyPracticeProgressRecord } from '../models/practice.model';
import { AuthService } from './auth.service';
import { PracticeProgressService } from './practice-progress.service';
import { PressureModeProgressService } from './pressure-mode-progress.service';

describe('PressureModeProgressService', () => {
  let auth: jasmine.SpyObj<AuthService>;
  let practice: jasmine.SpyObj<PracticeProgressService>;
  let service: PressureModeProgressService;

  beforeEach(() => {
    sessionStorage.clear();
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['isLoggedIn']);
    practice = jasmine.createSpyObj<PracticeProgressService>(
      'PracticeProgressService',
      ['getRecord', 'updateRecord', 'saveSession', 'loadSession'],
    );
    auth.isLoggedIn.and.returnValue(false);
    practice.getRecord.and.returnValue(
      createEmptyPracticeProgressRecord(
        'question',
        'pressure:counter-pressure-v1:react-counter',
      ),
    );
    practice.loadSession.and.returnValue(null);

    TestBed.configureTestingModule({
      providers: [
        PressureModeProgressService,
        { provide: AuthService, useValue: auth },
        { provide: PracticeProgressService, useValue: practice },
      ],
    });
    service = TestBed.inject(PressureModeProgressService);
  });

  it('uses the isolated pressure item id and clamps restored progress', () => {
    practice.getRecord.and.returnValue({
      ...createEmptyPracticeProgressRecord(
        'question',
        'pressure:counter-pressure-v1:react-counter',
      ),
      bestScore: 2,
    });
    practice.loadSession.and.returnValue({
      activeRoundIndex: 99,
      clearedRounds: 3,
      completed: false,
    });

    expect(service.itemId('counter-pressure-v1', 'react-counter')).toBe(
      'pressure:counter-pressure-v1:react-counter',
    );
    expect(service.read('counter-pressure-v1', 'react-counter', 4)).toEqual({
      activeRoundIndex: 3,
      clearedRounds: 3,
      completed: false,
    });
  });

  it('stores guest progress only in the practice session', () => {
    service.markRoundCleared('counter-pressure-v1', 'react-counter', {
      activeRoundIndex: 1,
      clearedRounds: 1,
      completed: false,
    });

    expect(practice.saveSession).toHaveBeenCalled();
    expect(practice.updateRecord).not.toHaveBeenCalled();
  });

  it('keeps bestScore monotonic and marks completion for signed-in users', () => {
    auth.isLoggedIn.and.returnValue(true);
    practice.updateRecord.and.callFake((_family, _id, mutate) => mutate({
      ...createEmptyPracticeProgressRecord(
        'question',
        'pressure:counter-pressure-v1:react-counter',
      ),
      bestScore: 3,
    }));

    service.markRoundCleared('counter-pressure-v1', 'react-counter', {
      activeRoundIndex: 3,
      clearedRounds: 2,
      completed: true,
    });

    const mutate = practice.updateRecord.calls.mostRecent().args[2];
    const updated = mutate({
      ...createEmptyPracticeProgressRecord(
        'question',
        'pressure:counter-pressure-v1:react-counter',
      ),
      bestScore: 3,
    });
    expect(updated.bestScore).toBe(3);
    expect(updated.completed).toBeTrue();
    expect(updated.passed).toBeTrue();
  });

  it('hands a guest final pass across the sign-in redirect in the same tab', () => {
    service.markPendingCompletion('counter-pressure-v1', 'react-counter', {
      activeRoundIndex: 3,
      clearedRounds: 4,
      completed: true,
    });

    expect(service.hasPendingCompletion('counter-pressure-v1', 'react-counter')).toBeTrue();
    expect(service.read('counter-pressure-v1', 'react-counter', 4)).toEqual({
      activeRoundIndex: 3,
      clearedRounds: 4,
      completed: true,
    });

    service.clearPendingCompletion('counter-pressure-v1', 'react-counter');
    expect(service.hasPendingCompletion('counter-pressure-v1', 'react-counter')).toBeFalse();
  });
});
