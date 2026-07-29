import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router, provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import {
  InterviewAvailability,
  InterviewSession,
} from '../../core/models/interview.model';
import { InterviewService } from '../../core/services/interview.service';
import { InterviewSetupComponent } from './interview-setup.component';

describe('InterviewSetupComponent', () => {
  let fixture: ComponentFixture<InterviewSetupComponent>;
  let component: InterviewSetupComponent;
  let service: jasmine.SpyObj<InterviewService>;
  let router: Router;

  const availability = (
    overrides: Partial<InterviewAvailability> = {},
  ): InterviewAvailability => ({
    enabled: true,
    accessMode: 'public',
    unavailableReason: null,
    quota: { remaining: 2, limit: 3, resetAt: null, unlimited: false },
    quotas: {
      coding: { remaining: 2, limit: 3, resetAt: null, unlimited: false },
      'system-design': { remaining: 1, limit: 1, resetAt: null, unlimited: false },
    },
    activeSession: null,
    lastResults: [],
    targets: [
      ...(['junior', 'mid', 'senior'] as const).flatMap((level) =>
        (['core-web', 'react'] as const).map((track) => ({
          level,
          track,
          format: 'coding' as const,
          available: true,
        }))
      ),
    ],
    formats: [
      { value: 'coding', label: 'Coding mock' },
      { value: 'system-design', label: 'System design mock' },
    ],
    formatAvailability: [
      { format: 'coding', enabled: true, unavailableReason: null },
      { format: 'system-design', enabled: true, unavailableReason: null },
    ],
    levels: [
      { value: 'junior', label: 'Junior' },
      { value: 'mid', label: 'Mid-level' },
      { value: 'senior', label: 'Senior' },
    ],
    tracks: [
      { value: 'core-web', label: 'Core Web' },
      { value: 'react', label: 'React' },
    ],
    minViewportWidth: 1,
    timing: {
      mcqSeconds: 600,
      codingReadySeconds: 300,
      systemDesignSeconds: { junior: 600, mid: 900, senior: 1200 },
    },
    ...overrides,
  });

  const session: InterviewSession = {
    id: 'session-1',
    status: 'mcq_active',
    format: 'coding',
    level: 'mid',
    track: 'core-web',
    version: 1,
    bankVersion: 'v1',
    serverNow: '2026-07-27T10:00:00.000Z',
    mcqDeadlineAt: '2026-07-27T10:10:00.000Z',
    codingReadyDeadlineAt: null,
    questions: [],
    currentQuestionIndex: 0,
    coding: null,
    systemDesign: null,
  };

  beforeEach(async () => {
    service = jasmine.createSpyObj<InterviewService>('InterviewService', [
      'getAvailability',
      'createSession',
    ]);
    service.getAvailability.and.returnValue(of(availability()));
    service.createSession.and.returnValue(of(session));

    await TestBed.configureTestingModule({
      imports: [InterviewSetupComponent],
      providers: [
        { provide: InterviewService, useValue: service },
        provideRouter([]),
        provideNoopAnimations(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InterviewSetupComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
  });

  it('starts with the selected target and desktop preflight width using an idempotency key', () => {
    const navigate = spyOn(router, 'navigate').and.resolveTo(true);
    fixture.detectChanges();

    component.onLevelChange('senior');
    component.onTrackChange('react');
    component.start();

    expect(service.createSession).toHaveBeenCalledTimes(1);
    const [request, idempotencyKey] = service.createSession.calls.mostRecent().args;
    expect(request).toEqual({
      level: 'senior',
      track: 'react',
      viewportWidth: window.innerWidth,
    });
    expect(Object.keys(request)).not.toContain('durationMinutes');
    expect(idempotencyKey.length).toBeGreaterThan(10);
    expect(navigate).toHaveBeenCalledWith(['/interview', 'session-1']);
  });

  it('submits through Angular without allowing a native form navigation', () => {
    fixture.detectChanges();
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    const event = new Event('submit', { bubbles: true, cancelable: true });

    form.dispatchEvent(event);

    expect(event.defaultPrevented).toBeTrue();
    expect(service.createSession).toHaveBeenCalledTimes(1);
  });

  it('blocks starting below the backend-provided viewport width', () => {
    service.getAvailability.and.returnValue(of(availability({ minViewportWidth: 5000 })));
    fixture.detectChanges();

    expect(component.viewportBlocked()).toBeTrue();
    expect(component.canStart()).toBeFalse();
    expect(fixture.nativeElement.querySelector('[data-testid="interview-mobile-block"]')).not.toBeNull();
  });

  it('does not treat an unlimited premium quota as exhausted', () => {
    service.getAvailability.and.returnValue(of(availability({
      quota: { unlimited: true, remaining: null, limit: null, resetAt: null },
    })));
    fixture.detectChanges();

    expect(component.quotaExhausted()).toBeFalse();
    expect(component.canStart()).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('Unlimited attempts');
  });

  it('blocks a level and track pair that the backend marks unavailable', () => {
    service.getAvailability.and.returnValue(of(availability({
      targets: [
        { level: 'mid', track: 'core-web', format: 'coding', available: true },
        { level: 'senior', track: 'react', format: 'coding', available: false },
      ],
    })));
    fixture.detectChanges();

    component.onLevelChange('senior');
    component.onTrackChange('react');
    fixture.detectChanges();

    expect(component.targetUnavailable()).toBeTrue();
    expect(component.canStart()).toBeFalse();
    expect(fixture.nativeElement.querySelector('[data-testid="interview-target-unavailable"]')).not.toBeNull();
    component.start();
    expect(service.createSession).not.toHaveBeenCalled();
  });

  it('offers resume without rendering a second start form for an active session', () => {
    service.getAvailability.and.returnValue(of(availability({
      activeSession: {
        id: 'active-1',
        status: 'coding_active',
        format: 'coding',
        level: 'mid',
        track: 'react',
      },
    })));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="interview-start"]')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Resume interview');
  });

  it('refreshes availability when another tab wins the create race', () => {
    const active = availability({
      activeSession: {
        id: 'active-race',
        status: 'mcq_active',
        format: 'coding',
        level: 'mid',
        track: 'core-web',
      },
    });
    service.createSession.and.returnValue(throwError(() => ({ status: 409 })));
    service.getAvailability.and.returnValues(of(availability()), of(active));
    fixture.detectChanges();

    component.start();
    fixture.detectChanges();

    expect(service.getAvailability).toHaveBeenCalledTimes(2);
    expect(component.availability()?.activeSession?.id).toBe('active-race');
    expect(fixture.nativeElement.textContent).toContain('Resume interview');
  });

  it('keeps start disabled during refresh and ignores an older availability response', () => {
    const first = new Subject<InterviewAvailability>();
    const second = new Subject<InterviewAvailability>();
    service.getAvailability.and.returnValues(first, second);

    fixture.detectChanges();
    component.load();
    expect(component.loading()).toBeTrue();
    expect(component.canStart()).toBeFalse();

    const active = availability({
      activeSession: {
        id: 'newer-active',
        status: 'system_design_active',
        format: 'system-design',
        level: 'senior',
        track: 'vue',
      },
    });
    second.next(active);
    second.complete();
    first.next(availability());
    first.complete();

    expect(component.loading()).toBeFalse();
    expect(component.availability()?.activeSession?.id).toBe('newer-active');
    expect(component.canStart()).toBeFalse();
  });

  it('labels an internal admin preview without changing the interview contract', () => {
    service.getAvailability.and.returnValue(of(availability({
      accessMode: 'internal',
    })));
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('[data-testid="interview-access-label"]')?.textContent,
    ).toContain('Internal preview');
    expect(component.canStart()).toBeTrue();
  });

  it('shows the backend-provided MCQ duration', () => {
    service.getAvailability.and.returnValue(of(availability({
      timing: {
        mcqSeconds: 570,
        codingReadySeconds: 300,
        systemDesignSeconds: { junior: 600, mid: 900, senior: 1200 },
      },
    })));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('9m 30s MCQ');
  });

  it('starts the separate system-design format with its own quota and level timer', () => {
    const designSession = {
      ...session,
      format: 'system-design' as const,
      status: 'system_design_active' as const,
    };
    service.createSession.and.returnValue(of(designSession));
    fixture.detectChanges();

    component.onFormatChange('system-design');
    component.onLevelChange('senior');
    fixture.detectChanges();
    component.start();

    expect(service.createSession.calls.mostRecent().args[0]).toEqual({
      format: 'system-design',
      level: 'senior',
      track: 'core-web',
      viewportWidth: window.innerWidth,
    });
    expect(fixture.nativeElement.textContent).toContain('20 minutes guided system design');
    expect(fixture.nativeElement.textContent).toContain('1 / 1');
  });

  it('renders system-design practice signals as human-readable feedback', () => {
    service.getAvailability.and.returnValue(of(availability({
      lastResults: [{
        sessionId: 'design-result',
        format: 'system-design',
        level: 'mid',
        track: 'react',
        practiceSignal: 'not-enough-evidence',
      }],
    })));

    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Not enough evidence');
    expect(fixture.nativeElement.textContent).not.toContain('Not-enough-evidence');
  });
});
