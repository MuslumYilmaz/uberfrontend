import { signal } from '@angular/core';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Subject, defer, of, throwError } from 'rxjs';
import { InterviewAvailability } from '../models/interview.model';
import { AuthService, User } from './auth.service';
import { InterviewAvailabilityStore } from './interview-availability.store';
import { InterviewService } from './interview.service';

function availability(enabled = true): InterviewAvailability {
  return {
    enabled,
    accessMode: enabled ? 'public' : 'off',
    unavailableReason: null,
    quota: null,
    quotas: { coding: null, 'system-design': null },
    activeSession: null,
    lastResults: [],
    targets: [],
    formats: [],
    formatAvailability: [],
    levels: [],
    tracks: [],
    minViewportWidth: 768,
    timing: {
      mcqSeconds: 600,
      codingReadySeconds: 300,
      systemDesignSeconds: { junior: 600, mid: 900, senior: 1200 },
    },
  };
}

describe('InterviewAvailabilityStore', () => {
  const user = signal<User | null>({
    _id: 'user-1',
    username: 'user',
    email: 'user@example.test',
    role: 'user',
    prefs: {
      tz: 'Europe/Istanbul',
      theme: 'system',
      defaultTech: 'javascript',
      keyboard: 'default',
      marketingEmails: false,
    },
    createdAt: '2026-08-24T00:00:00.000Z',
  });
  let interviews: jasmine.SpyObj<InterviewService>;
  let store: InterviewAvailabilityStore;

  beforeEach(() => {
    interviews = jasmine.createSpyObj<InterviewService>('InterviewService', ['getAvailability']);
    TestBed.configureTestingModule({
      providers: [
        InterviewAvailabilityStore,
        { provide: InterviewService, useValue: interviews },
        { provide: AuthService, useValue: { user } },
      ],
    });
    store = TestBed.inject(InterviewAvailabilityStore);
  });

  it('shares one in-flight request across concurrent consumers', () => {
    const response = new Subject<InterviewAvailability>();
    interviews.getAvailability.and.returnValue(defer(() => response));
    const values: InterviewAvailability[] = [];

    store.resolve().subscribe((value) => values.push(value));
    store.resolve().subscribe((value) => values.push(value));
    expect(interviews.getAvailability).toHaveBeenCalledTimes(1);

    response.next(availability());
    response.complete();
    expect(values).toHaveSize(2);
    expect(store.snapshot()?.enabled).toBeTrue();
  });

  it('caches only successful responses for the bounded max age', fakeAsync(() => {
    interviews.getAvailability.and.returnValues(of(availability()), of(availability(false)));
    store.resolve({ maxAgeMs: 100 }).subscribe();
    store.resolve({ maxAgeMs: 100 }).subscribe();
    expect(interviews.getAvailability).toHaveBeenCalledTimes(1);

    tick(101);
    store.resolve({ maxAgeMs: 100 }).subscribe();
    expect(interviews.getAvailability).toHaveBeenCalledTimes(2);
    expect(store.snapshot()?.enabled).toBeFalse();
  }));

  it('does not cache errors', () => {
    interviews.getAvailability.and.returnValues(
      throwError(() => new Error('offline')),
      of(availability()),
    );
    store.resolve().subscribe({ error: () => undefined });
    store.resolve().subscribe();
    expect(interviews.getAvailability).toHaveBeenCalledTimes(2);
  });

  it('force refresh, invalidation and auth changes bypass stale values', () => {
    interviews.getAvailability.and.returnValues(
      of(availability()),
      of(availability(false)),
      of(availability()),
      of(availability(false)),
    );
    store.resolve().subscribe();
    store.refresh().subscribe();
    expect(interviews.getAvailability).toHaveBeenCalledTimes(2);

    store.invalidate();
    expect(store.snapshot()).toBeNull();
    store.resolve().subscribe();
    user.set({ ...user()!, _id: 'user-2' });
    store.resolve().subscribe();
    expect(interviews.getAvailability).toHaveBeenCalledTimes(4);
  });
});
