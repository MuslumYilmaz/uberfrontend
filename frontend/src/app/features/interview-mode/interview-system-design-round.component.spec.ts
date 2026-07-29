import { provideNoopAnimations } from '@angular/platform-browser/animations';
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import {
  InterviewSession,
  InterviewSystemDesignDraft,
} from '../../core/models/interview.model';
import { InterviewService } from '../../core/services/interview.service';
import { InterviewSystemDesignRoundComponent } from './interview-system-design-round.component';

describe('InterviewSystemDesignRoundComponent', () => {
  let fixture: ComponentFixture<InterviewSystemDesignRoundComponent>;
  let component: InterviewSystemDesignRoundComponent;
  let service: jasmine.SpyObj<InterviewService>;

  const draft = (
    overrides: Partial<InterviewSystemDesignDraft> = {},
  ): InterviewSystemDesignDraft => ({
    currentStep: 'clarifications',
    selectedClarificationIds: [],
    prioritizedRequirementIds: [],
    placements: [],
    connections: [],
    decisions: [],
    selectedTwistActionIds: [],
    scratchpad: '',
    hash: 'server-hash',
    revision: null,
    updatedAt: '2026-07-29T10:00:00.000Z',
    ...overrides,
  });

  const session = (
    overrides: Partial<InterviewSession> = {},
    serverDraft: InterviewSystemDesignDraft | null = draft(),
  ): InterviewSession => ({
    id: 'design-session',
    format: 'system-design',
    status: 'system_design_active',
    level: 'mid',
    track: 'react',
    version: 3,
    bankVersion: 'design-v1',
    serverNow: new Date().toISOString(),
    mcqDeadlineAt: null,
    codingReadyDeadlineAt: null,
    questions: [],
    currentQuestionIndex: 0,
    coding: null,
    systemDesign: {
      stage: 'initial',
      deadlineAt: new Date(Date.now() + 900_000).toISOString(),
      scenario: {
        id: 'int-sd-autocomplete-race-mid-v1',
        revision: 1,
        title: 'Reliable autocomplete',
        prompt: 'Design an autocomplete that stays correct on a slow network.',
        sourceContentId: 'realtime-search-debounce-cache',
        estimatedSeconds: 900,
        selectionLimits: {
          clarifications: 3,
          priorities: 3,
          connections: 6,
          rationalesPerDecision: 2,
          twistActions: 2,
          scratchpadChars: 200,
        },
        clarifications: [
          { id: 'keyboard', prompt: 'Is keyboard navigation required?', answer: null },
          { id: 'stale-ui', prompt: 'Can stale results remain visible?', answer: null },
          { id: 'cache-scope', prompt: 'Can results be shared across users?', answer: null },
          { id: 'result-volume', prompt: 'How many results can a query return?', answer: null },
        ],
        requirements: [
          { id: 'ordering', label: 'Preserve request ordering' },
          { id: 'a11y', label: 'Keep keyboard focus stable' },
          { id: 'performance', label: 'Bound duplicate requests' },
        ],
        lanes: [
          { id: 'ui', label: 'UI' },
          { id: 'data', label: 'Data' },
        ],
        cards: [
          { id: 'input', label: 'Search input' },
          { id: 'controller', label: 'Request controller' },
        ],
        decisions: [{
          id: 'request-ownership',
          prompt: 'How should obsolete requests be handled?',
          options: [{ id: 'abort', label: 'Abort obsolete requests' }],
          rationales: [
            { id: 'ordering', label: 'Prevent stale results' },
            { id: 'efficiency', label: 'Reduce avoidable network work' },
            { id: 'simplicity', label: 'Keep request code short' },
          ],
        }],
        connectionTypes: [{ value: 'event-flow', label: 'Event flow' }],
      },
      revealedClarificationIds: [],
      draft: serverDraft,
      twist: {
        revealed: false,
        prompt: null,
        actions: [],
        maxActions: 2,
      },
    },
    ...overrides,
  });

  const storeLocalDraft = (
    baseHash: string | null,
    selectedClarificationIds: string[] = ['keyboard'],
    updatedAt = '2000-01-01T00:00:00.000Z',
  ): void => {
    localStorage.setItem(
      'fa:interview:system-design-draft:v1:design-session',
      JSON.stringify({
        sessionId: 'design-session',
        scenarioId: 'int-sd-autocomplete-race-mid-v1',
        scenarioRevision: 1,
        updatedAt,
        dirty: true,
        baseHash,
        draft: {
          currentStep: 'clarifications',
          selectedClarificationIds,
          prioritizedRequirementIds: [],
          placements: [],
          connections: [],
          decisions: [],
          selectedTwistActionIds: [],
          scratchpad: 'Device-only reasoning',
        },
      }),
    );
  };

  beforeEach(async () => {
    service = jasmine.createSpyObj<InterviewService>('InterviewService', [
      'saveSystemDesignDraft',
      'revealSystemDesignTwist',
      'submitSystemDesign',
    ]);
    service.saveSystemDesignDraft.and.returnValue(of({
      version: 4,
      draft: draft({ hash: 'saved-hash', updatedAt: '2026-07-29T10:01:00.000Z' }),
      session: null,
      replayed: false,
    }));

    await TestBed.configureTestingModule({
      imports: [InterviewSystemDesignRoundComponent],
      providers: [
        { provide: InterviewService, useValue: service },
        provideNoopAnimations(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InterviewSystemDesignRoundComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('session', session());
  });

  afterEach(() => {
    if (fixture && !fixture.componentRef.hostView.destroyed) fixture.destroy();
    localStorage.removeItem('fa:interview:system-design-draft:v1:design-session');
  });

  it('stores each interaction locally and debounces the allowlisted server projection', fakeAsync(() => {
    fixture.detectChanges();

    component.toggleClarification('keyboard');

    expect(
      localStorage.getItem('fa:interview:system-design-draft:v1:design-session'),
    ).toContain('keyboard');
    expect(service.saveSystemDesignDraft).not.toHaveBeenCalled();

    tick(800);

    expect(service.saveSystemDesignDraft).toHaveBeenCalledWith(
      'design-session',
      jasmine.objectContaining({
        mutationId: jasmine.any(String),
        draft: jasmine.objectContaining({
          currentStep: 'clarifications',
          selectedClarificationIds: ['keyboard'],
        }),
      }),
      3,
    );
    expect(component.syncState()).toBe('saved');
    expect(component.syncedHash()).toBe('saved-hash');
  }));

  it('does not let a clean save acknowledgement overwrite another tab recovery record', fakeAsync(() => {
    fixture.detectChanges();
    component.toggleClarification('keyboard');
    storeLocalDraft(
      'server-hash',
      ['stale-ui'],
      '2026-07-29T10:30:00.000Z',
    );

    tick(800);

    const stored = JSON.parse(
      localStorage.getItem('fa:interview:system-design-draft:v1:design-session') || '{}',
    );
    expect(stored.draft.selectedClarificationIds).toEqual(['stale-ui']);
    expect(component.draft().selectedClarificationIds).toEqual(['keyboard']);
    expect(component.localPersistenceAvailable()).toBeFalse();
    expect(component.syncedHash()).toBe('saved-hash');
  }));

  it('allows every public card in every public lane without leaking rubric placement clues', () => {
    fixture.detectChanges();

    component.placeCard('input', 'data');

    expect(component.draft().placements).toEqual([
      { cardId: 'input', laneId: 'data', order: 0 },
    ]);
    expect(component.laneOptions('input').find((option) => option.value === 'data')?.disabled)
      .not.toBeTrue();
  });

  it('caps rationale chips per decision while keeping selected chips removable', () => {
    fixture.detectChanges();
    const decision = component.scenario()!.decisions[0];
    component.selectDecisionOption(decision, 'abort');

    component.toggleRationale(decision.id, 'ordering');
    component.toggleRationale(decision.id, 'efficiency');
    component.toggleRationale(decision.id, 'simplicity');

    expect(component.selectedRationaleCount(decision.id)).toBe(2);
    expect(component.rationaleCanSelect(decision.id, 'simplicity')).toBeFalse();
    expect(component.rationaleCanSelect(decision.id, 'ordering')).toBeTrue();

    component.toggleRationale(decision.id, 'ordering');
    component.toggleRationale(decision.id, 'simplicity');

    expect(component.draft().decisions[0].rationaleIds).toEqual([
      'efficiency',
      'simplicity',
    ]);
  });

  it('never exposes a stale saved hash when the design changes during an in-flight save', fakeAsync(() => {
    const firstSave = new Subject<{
      version: number;
      draft: InterviewSystemDesignDraft;
      session: InterviewSession;
      replayed: false;
    }>();
    service.saveSystemDesignDraft.and.returnValues(
      firstSave.asObservable(),
      of({
        version: 5,
        draft: draft({
          selectedClarificationIds: ['keyboard', 'stale-ui'],
          hash: 'latest-hash',
          updatedAt: '2026-07-29T10:02:00.000Z',
        }),
        session: null,
        replayed: false,
      }),
    );
    fixture.detectChanges();
    component.sessionUpdated.subscribe((updated) => {
      fixture.componentRef.setInput('session', updated);
      fixture.detectChanges();
    });

    component.toggleClarification('keyboard');
    tick(800);
    component.toggleClarification('stale-ui');
    component.updateScratchpad('Second unsynced edit');

    expect(JSON.parse(
      localStorage.getItem('fa:interview:system-design-draft:v1:design-session') || '{}',
    ).baseHash).toBe('server-hash');

    const acknowledgedSession = session({ version: 4 }, draft({
      selectedClarificationIds: ['keyboard'],
      hash: 'stale-hash',
      updatedAt: '2026-07-29T10:01:00.000Z',
    }));
    firstSave.next({
      version: 4,
      draft: acknowledgedSession.systemDesign!.draft!,
      session: acknowledgedSession,
      replayed: false,
    });
    firstSave.complete();

    expect(component.syncedHash()).toBeNull();
    expect(component.canRevealTwist()).toBeFalse();

    tick(0);

    expect(service.saveSystemDesignDraft).toHaveBeenCalledTimes(2);
    expect(component.syncedHash()).toBe('latest-hash');
    expect(component.draft().selectedClarificationIds).toEqual(['keyboard', 'stale-ui']);
    expect(component.hasDraftConflict()).toBeFalse();
  }));

  it('replays the preserved local draft after a 409 when its causal base still matches', fakeAsync(() => {
    const reload = jasmine.createSpy('reload');
    component.reconcileRequested.subscribe(reload);
    service.saveSystemDesignDraft.and.returnValues(
      throwError(() => ({ status: 409 })),
      of({
        version: 8,
        draft: draft({
          selectedClarificationIds: ['keyboard'],
          hash: 'replayed-local-hash',
          updatedAt: '2026-07-29T10:03:00.000Z',
        }),
        session: null,
        replayed: false,
      }),
    );
    fixture.detectChanges();

    component.toggleClarification('keyboard');
    tick(800);

    expect(reload).toHaveBeenCalled();
    expect(component.syncedHash()).toBeNull();

    fixture.componentRef.setInput('reconciling', true);
    fixture.detectChanges();
    fixture.componentRef.setInput('session', session({ version: 7 }, draft({
      selectedClarificationIds: [],
      hash: 'server-hash',
      updatedAt: '2026-07-29T10:02:00.000Z',
    })));
    fixture.componentRef.setInput('reconciling', false);
    fixture.detectChanges();
    expect(component.syncedHash()).toBeNull();
    expect(service.saveSystemDesignDraft).toHaveBeenCalledTimes(1);

    tick(0);

    expect(service.saveSystemDesignDraft.calls.mostRecent().args[2]).toBe(7);
    expect(service.saveSystemDesignDraft.calls.mostRecent().args[1].draft.selectedClarificationIds)
      .toEqual(['keyboard']);
    expect(component.syncedHash()).toBe('replayed-local-hash');
    expect(component.error()).toBeNull();
  }));

  it('requires explicit restore and keeps the server discovery baseline after a twist conflict', fakeAsync(() => {
    service.saveSystemDesignDraft.and.returnValues(
      throwError(() => ({ status: 409 })),
      of({
        version: 8,
        draft: draft({
          selectedClarificationIds: ['stale-ui'],
          prioritizedRequirementIds: ['a11y'],
          scratchpad: 'Preserved local note',
          hash: 'post-twist-hash',
        }),
        session: null,
        replayed: false,
      }),
    );
    fixture.detectChanges();

    component.toggleClarification('keyboard');
    component.updateScratchpad('Preserved local note');
    tick(800);

    const reloaded = session({ version: 7 }, draft({
      selectedClarificationIds: ['stale-ui'],
      prioritizedRequirementIds: ['a11y'],
      scratchpad: '',
      hash: 'twist-baseline-hash',
      updatedAt: '2026-07-29T10:02:00.000Z',
    }));
    reloaded.systemDesign!.stage = 'twist';
    reloaded.systemDesign!.twist = {
      revealed: true,
      prompt: 'The upstream service now fails intermittently.',
      actions: [{ id: 'keep-last-good', label: 'Keep the last valid response' }],
      maxActions: 2,
    };
    fixture.componentRef.setInput('session', reloaded);
    fixture.detectChanges();

    expect(component.hasDraftConflict()).toBeTrue();
    expect(service.saveSystemDesignDraft).toHaveBeenCalledTimes(1);
    expect(component.draft().selectedClarificationIds).toEqual(['stale-ui']);

    component.requestDeviceDraftRestore();
    expect(component.confirmDeviceDraftRestore()).toBeTrue();
    expect(service.saveSystemDesignDraft).toHaveBeenCalledTimes(1);

    component.restoreDeviceDraft();
    tick(0);

    expect(service.saveSystemDesignDraft).toHaveBeenCalledTimes(2);
    const replayedDraft = service.saveSystemDesignDraft.calls.mostRecent().args[1].draft;
    expect(replayedDraft.selectedClarificationIds).toEqual(['stale-ui']);
    expect(replayedDraft.prioritizedRequirementIds).toEqual(['a11y']);
    expect(replayedDraft.scratchpad).toBe('Preserved local note');
    expect(component.syncedHash()).toBe('post-twist-hash');
  }));

  it('counts the union of revealed and currently selected clarifications', () => {
    const value = session({}, draft({
      selectedClarificationIds: ['keyboard', 'cache-scope'],
    }));
    value.systemDesign!.revealedClarificationIds = ['keyboard', 'stale-ui'];
    fixture.componentRef.setInput('session', value);
    fixture.detectChanges();

    // A/B were revealed and A/C are selected: D would expose a fourth answer.
    expect(component.clarificationCanSelect('result-volume')).toBeFalse();
    // A previously revealed question remains reusable within the current selection cap.
    expect(component.clarificationCanSelect('stale-ui')).toBeTrue();
  });

  it('keeps the local draft dirty and explains a cumulative clarification limit response', fakeAsync(() => {
    const reload = jasmine.createSpy('reload');
    component.reconcileRequested.subscribe(reload);
    service.saveSystemDesignDraft.and.returnValue(throwError(() => ({
      status: 400,
      error: { code: 'INTERVIEW_SYSTEM_DESIGN_CLARIFICATION_LIMIT_REACHED' },
    })));
    fixture.detectChanges();

    component.toggleClarification('keyboard');
    tick(800);

    expect(reload).not.toHaveBeenCalled();
    expect(component.syncState()).toBe('error');
    expect(component.syncedHash()).toBeNull();
    expect(component.error()).toContain('already revealed 3 clarification answers');
    expect(JSON.parse(
      localStorage.getItem('fa:interview:system-design-draft:v1:design-session') || '{}',
    ).dirty).toBeTrue();
  }));

  it('restores a dirty local draft even when its timestamp is older than the server draft', fakeAsync(() => {
    localStorage.setItem(
      'fa:interview:system-design-draft:v1:design-session',
      JSON.stringify({
        sessionId: 'design-session',
        scenarioId: 'int-sd-autocomplete-race-mid-v1',
        scenarioRevision: 1,
        updatedAt: '2000-01-01T00:00:00.000Z',
        dirty: true,
        baseHash: 'server-hash',
        draft: {
          currentStep: 'clarifications',
          selectedClarificationIds: ['keyboard'],
          prioritizedRequirementIds: [],
          placements: [],
          connections: [],
          decisions: [],
          selectedTwistActionIds: [],
          scratchpad: '',
        },
      }),
    );

    fixture.detectChanges();

    expect(component.draft().selectedClarificationIds).toEqual(['keyboard']);
    expect(component.syncedHash()).toBeNull();

    tick(0);

    expect(service.saveSystemDesignDraft).toHaveBeenCalled();
    expect(service.saveSystemDesignDraft.calls.mostRecent().args[1].draft.selectedClarificationIds)
      .toEqual(['keyboard']);
  }));

  it('treats an identical server draft as acknowledged after the save response is lost', fakeAsync(() => {
    storeLocalDraft('older-server-hash');
    fixture.componentRef.setInput('session', session({}, draft({
      selectedClarificationIds: ['keyboard'],
      scratchpad: 'Device-only reasoning',
      hash: 'acknowledged-server-hash',
      updatedAt: '2026-07-29T10:10:00.000Z',
    })));

    fixture.detectChanges();
    tick(1_000);

    expect(component.hasDraftConflict()).toBeFalse();
    expect(component.draft().selectedClarificationIds).toEqual(['keyboard']);
    expect(component.syncedHash()).toBe('acknowledged-server-hash');
    expect(component.syncState()).toBe('saved');
    expect(service.saveSystemDesignDraft).not.toHaveBeenCalled();
    const stored = JSON.parse(
      localStorage.getItem('fa:interview:system-design-draft:v1:design-session') || '{}',
    );
    expect(stored.dirty).toBeFalse();
    expect(stored.baseHash).toBe('acknowledged-server-hash');
  }));

  it('does not autosave a device draft based on a different server hash and can keep the server version', fakeAsync(() => {
    storeLocalDraft('older-server-hash');
    const newerServer = session({}, draft({
      selectedClarificationIds: ['stale-ui'],
      hash: 'newer-server-hash',
      updatedAt: '2026-07-29T10:10:00.000Z',
    }));
    fixture.componentRef.setInput('session', newerServer);

    fixture.detectChanges();
    tick(1_000);

    expect(component.hasDraftConflict()).toBeTrue();
    expect(component.draft().selectedClarificationIds).toEqual(['stale-ui']);
    expect(component.syncLabel()).toBe('Draft choice required');
    expect(service.saveSystemDesignDraft).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector(
      '[data-testid="system-design-draft-conflict"]',
    )).not.toBeNull();
    expect(JSON.parse(
      localStorage.getItem('fa:interview:system-design-draft:v1:design-session') || '{}',
    ).draft.selectedClarificationIds).toEqual(['keyboard']);

    component.useServerDraft();
    tick(1_000);

    expect(component.hasDraftConflict()).toBeFalse();
    expect(component.draft().selectedClarificationIds).toEqual(['stale-ui']);
    expect(component.syncedHash()).toBe('newer-server-hash');
    expect(service.saveSystemDesignDraft).not.toHaveBeenCalled();
    expect(localStorage.getItem(
      'fa:interview:system-design-draft:v1:design-session',
    )).toBeNull();
  }));

  it('does not delete another tab draft written after the recovery dialog opened', () => {
    storeLocalDraft('older-server-hash', ['keyboard']);
    fixture.componentRef.setInput('session', session({}, draft({
      selectedClarificationIds: ['stale-ui'],
      hash: 'newer-server-hash',
    })));
    fixture.detectChanges();
    expect(component.hasDraftConflict()).toBeTrue();

    storeLocalDraft(
      'newer-server-hash',
      ['cache-scope'],
      '2026-07-29T10:20:00.000Z',
    );
    component.useServerDraft();

    const remaining = JSON.parse(
      localStorage.getItem('fa:interview:system-design-draft:v1:design-session') || '{}',
    );
    expect(remaining.draft.selectedClarificationIds).toEqual(['cache-scope']);
    expect(remaining.baseHash).toBe('newer-server-hash');
  });

  it('requires a second confirmation before intentionally restoring a mismatched device draft', fakeAsync(() => {
    storeLocalDraft('older-server-hash');
    fixture.componentRef.setInput('session', session({}, draft({
      selectedClarificationIds: ['stale-ui'],
      hash: 'newer-server-hash',
    })));
    fixture.detectChanges();

    component.requestDeviceDraftRestore();
    tick(0);

    expect(component.confirmDeviceDraftRestore()).toBeTrue();
    expect(component.draft().selectedClarificationIds).toEqual(['stale-ui']);
    expect(service.saveSystemDesignDraft).not.toHaveBeenCalled();

    component.restoreDeviceDraft();
    tick(0);

    expect(component.hasDraftConflict()).toBeFalse();
    expect(service.saveSystemDesignDraft).toHaveBeenCalledTimes(1);
    expect(service.saveSystemDesignDraft.calls.mostRecent().args[1].draft)
      .toEqual(jasmine.objectContaining({
        selectedClarificationIds: ['keyboard'],
        scratchpad: 'Device-only reasoning',
      }));
    expect(component.syncedHash()).toBe('saved-hash');
  }));

  it('recovers this tab in memory even when another tab overwrites the shared storage key', fakeAsync(() => {
    fixture.detectChanges();
    component.toggleClarification('keyboard');

    // A second tab writes a different draft to the shared localStorage key.
    storeLocalDraft('server-hash', ['stale-ui']);
    fixture.componentRef.setInput('session', session({ version: 4 }, draft({
      selectedClarificationIds: ['stale-ui'],
      hash: 'other-tab-hash',
    })));
    fixture.detectChanges();

    expect(component.hasDraftConflict()).toBeTrue();
    expect(service.saveSystemDesignDraft).not.toHaveBeenCalled();

    component.requestDeviceDraftRestore();
    component.restoreDeviceDraft();
    tick(0);

    expect(service.saveSystemDesignDraft).toHaveBeenCalledTimes(1);
    expect(service.saveSystemDesignDraft.calls.mostRecent().args[1].draft.selectedClarificationIds)
      .toEqual(['keyboard']);
  }));

  it('keeps offline edits on this device and disables server-dependent actions', fakeAsync(() => {
    spyOnProperty(navigator, 'onLine', 'get').and.returnValue(false);
    fixture.detectChanges();

    component.toggleClarification('keyboard');
    tick(800);

    expect(service.saveSystemDesignDraft).not.toHaveBeenCalled();
    expect(component.syncState()).toBe('offline');
    expect(component.syncLabel()).toContain('saved on this device');
    expect(component.syncedHash()).toBeNull();
    expect(component.canRevealTwist()).toBeFalse();
    expect(JSON.parse(
      localStorage.getItem('fa:interview:system-design-draft:v1:design-session') || '{}',
    ).dirty).toBeTrue();
  }));

  it('does not claim an offline design is stored when localStorage rejects it', fakeAsync(() => {
    spyOnProperty(navigator, 'onLine', 'get').and.returnValue(false);
    spyOn(localStorage, 'setItem').and.throwError('storage blocked');
    fixture.detectChanges();

    component.toggleClarification('keyboard');
    tick(800);

    expect(component.localPersistenceAvailable()).toBeFalse();
    expect(component.syncLabel()).toBe('Offline · kept in this tab only');
    expect(service.saveSystemDesignDraft).not.toHaveBeenCalled();
  }));

  it('requires an explicit confirmation before submitting partial evidence', () => {
    const value = session({}, draft({
      currentStep: 'twist',
      selectedTwistActionIds: ['keep-last-good'],
    }));
    value.systemDesign!.stage = 'twist';
    value.systemDesign!.twist = {
      revealed: true,
      prompt: 'The upstream service now fails intermittently.',
      actions: [{ id: 'keep-last-good', label: 'Keep the last valid response' }],
      maxActions: 2,
    };
    fixture.componentRef.setInput('session', value);
    fixture.detectChanges();

    component.requestSubmit();
    fixture.detectChanges();

    expect(component.partialSubmitWarning()).toBeTrue();
    expect(service.submitSystemDesign).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain(
      'Some checkpoints have no evidence.',
    );
  });

  it('freezes every draft mutation while a twist reveal is in flight', () => {
    const delayedReveal = new Subject<{
      version: number;
      draft: InterviewSystemDesignDraft;
      session: InterviewSession | null;
      replayed: false;
    }>();
    service.revealSystemDesignTwist.and.returnValue(delayedReveal.asObservable());
    fixture.detectChanges();

    component.revealTwist();
    fixture.detectChanges();
    component.toggleClarification('keyboard');
    component.updateScratchpad('This must not be accepted');

    expect(component.busy()).toBeTrue();
    expect(component.interactionLocked()).toBeTrue();
    expect(component.draft().selectedClarificationIds).toEqual([]);
    expect(component.draft().scratchpad).toBe('');
    expect(service.saveSystemDesignDraft).not.toHaveBeenCalled();
    expect(
      fixture.nativeElement.querySelector('.design-editing-surface')?.hasAttribute('inert'),
    ).toBeTrue();
  });

  it('opens recovery instead of overwriting a newer server draft after reveal conflict', fakeAsync(() => {
    service.revealSystemDesignTwist.and.returnValue(
      throwError(() => ({ status: 409 })),
    );
    fixture.detectChanges();

    component.revealTwist();
    fixture.componentRef.setInput('reconciling', true);
    fixture.detectChanges();
    fixture.componentRef.setInput('session', session({ version: 4 }, draft({
      selectedClarificationIds: ['stale-ui'],
      hash: 'other-tab-hash',
    })));
    fixture.componentRef.setInput('reconciling', false);
    fixture.detectChanges();
    tick(0);

    expect(component.hasDraftConflict()).toBeTrue();
    expect(component.draft().selectedClarificationIds).toEqual(['stale-ui']);
    expect(service.saveSystemDesignDraft).not.toHaveBeenCalled();
  }));

  it('adopts a same-hash server twist after reveal conflict without creating a dirty replay', fakeAsync(() => {
    service.revealSystemDesignTwist.and.returnValue(
      throwError(() => ({ status: 409 })),
    );
    fixture.detectChanges();

    component.revealTwist();
    const revealed = session({ version: 4 }, draft({ hash: 'server-hash' }));
    revealed.systemDesign!.stage = 'twist';
    revealed.systemDesign!.twist = {
      revealed: true,
      prompt: 'The upstream service now fails intermittently.',
      actions: [{ id: 'keep-last-good', label: 'Keep the last valid response' }],
      maxActions: 2,
    };
    fixture.componentRef.setInput('reconciling', true);
    fixture.detectChanges();
    fixture.componentRef.setInput('session', revealed);
    fixture.componentRef.setInput('reconciling', false);
    fixture.detectChanges();
    tick(0);

    expect(component.hasDraftConflict()).toBeFalse();
    expect(component.syncedHash()).toBe('server-hash');
    expect(component.syncState()).toBe('saved');
    expect(service.saveSystemDesignDraft).not.toHaveBeenCalled();
    expect(JSON.parse(
      localStorage.getItem('fa:interview:system-design-draft:v1:design-session') || '{}',
    )).toEqual(jasmine.objectContaining({
      dirty: false,
      baseHash: 'server-hash',
    }));
  }));

  it('freezes every draft mutation while submit is in flight', () => {
    const completeDraft = draft({
      currentStep: 'twist',
      selectedClarificationIds: ['keyboard'],
      prioritizedRequirementIds: ['ordering', 'a11y', 'performance'],
      placements: [
        { cardId: 'input', laneId: 'ui', order: 0 },
        { cardId: 'controller', laneId: 'data', order: 0 },
      ],
      connections: [{
        id: 'connection-1',
        fromCardId: 'input',
        toCardId: 'controller',
        type: 'event-flow',
      }],
      decisions: [{
        decisionId: 'request-ownership',
        optionId: 'abort',
        rationaleIds: ['ordering'],
      }],
      selectedTwistActionIds: ['keep-last-good'],
      scratchpad: 'Submitted note',
    });
    const value = session({}, completeDraft);
    value.systemDesign!.stage = 'twist';
    value.systemDesign!.twist = {
      revealed: true,
      prompt: 'The upstream service now fails intermittently.',
      actions: [{ id: 'keep-last-good', label: 'Keep the last valid response' }],
      maxActions: 2,
    };
    const delayedSubmit = new Subject<{
      version: number;
      draft: InterviewSystemDesignDraft;
      session: InterviewSession | null;
      replayed: false;
    }>();
    service.submitSystemDesign.and.returnValue(delayedSubmit.asObservable());
    fixture.componentRef.setInput('session', value);
    fixture.detectChanges();

    component.requestSubmit();
    fixture.detectChanges();
    component.toggleTwistAction('keep-last-good');
    component.removeCard('input');
    component.updateScratchpad('Late unsubmitted edit');

    expect(component.busy()).toBeTrue();
    expect(component.draft().selectedTwistActionIds).toEqual(['keep-last-good']);
    expect(component.draft().placements.length).toBe(2);
    expect(component.draft().scratchpad).toBe('Submitted note');
    expect(service.saveSystemDesignDraft).not.toHaveBeenCalled();
    expect(
      fixture.nativeElement.querySelector('.design-editing-surface')?.hasAttribute('inert'),
    ).toBeTrue();
  });

  it('does not recreate a terminally cleared draft when an older save finishes late', fakeAsync(() => {
    const delayedSave = new Subject<{
      version: number;
      draft: InterviewSystemDesignDraft;
      session: null;
      replayed: false;
    }>();
    service.saveSystemDesignDraft.and.returnValue(delayedSave.asObservable());
    fixture.detectChanges();

    component.toggleClarification('keyboard');
    tick(800);
    component.discardLocalDraft();

    expect(
      localStorage.getItem('fa:interview:system-design-draft:v1:design-session'),
    ).toBeNull();

    delayedSave.next({
      version: 4,
      draft: draft({
        selectedClarificationIds: ['keyboard'],
        hash: 'late-save-hash',
      }),
      session: null,
      replayed: false,
    });
    delayedSave.complete();

    expect(
      localStorage.getItem('fa:interview:system-design-draft:v1:design-session'),
    ).toBeNull();
    expect(component.syncedHash()).toBeNull();
  }));

  it('discards a malformed local draft instead of crashing or leaking unknown ids', () => {
    localStorage.setItem(
      'fa:interview:system-design-draft:v1:design-session',
      JSON.stringify({
        sessionId: 'design-session',
        scenarioId: 'int-sd-autocomplete-race-mid-v1',
        scenarioRevision: 1,
        updatedAt: '2026-07-29T10:05:00.000Z',
        dirty: true,
        baseHash: 'server-hash',
        draft: {
          currentStep: 'private-solution',
          selectedClarificationIds: ['unknown-private-id'],
          placements: 'not-an-array',
        },
      }),
    );

    expect(() => fixture.detectChanges()).not.toThrow();
    expect(component.draft().currentStep).toBe('clarifications');
    expect(component.draft().selectedClarificationIds).toEqual([]);
    expect(component.syncedHash()).toBe('server-hash');
  });
});
