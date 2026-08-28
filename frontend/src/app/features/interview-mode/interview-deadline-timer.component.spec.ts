import { PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InterviewDeadlineTimerComponent } from './interview-deadline-timer.component';

describe('InterviewDeadlineTimerComponent', () => {
  let fixture: ComponentFixture<InterviewDeadlineTimerComponent>;
  let component: InterviewDeadlineTimerComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InterviewDeadlineTimerComponent],
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    }).compileComponents();
    fixture = TestBed.createComponent(InterviewDeadlineTimerComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    component.ngOnDestroy();
    jasmine.clock().uninstall();
  });

  it('uses server time rather than trusting the client clock', () => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date('2026-07-27T10:00:00.000Z'));
    component.serverNow = '2026-07-27T10:05:00.000Z';
    component.deadlineAt = '2026-07-27T10:06:00.000Z';
    component.ngOnChanges({
      serverNow: {
        currentValue: component.serverNow,
        previousValue: null,
        firstChange: true,
        isFirstChange: () => true,
      },
      deadlineAt: {
        currentValue: component.deadlineAt,
        previousValue: null,
        firstChange: true,
        isFirstChange: () => true,
      },
    });

    expect(component.remainingSeconds()).toBe(60);
    expect(component.remainingLabel()).toBe('1:00');
  });

  it('announces thresholds without announcing every tick', () => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date('2026-07-27T10:00:00.000Z'));
    component.serverNow = '2026-07-27T10:00:00.000Z';
    component.deadlineAt = '2026-07-27T10:01:01.000Z';
    component.ngOnChanges({
      serverNow: {
        currentValue: component.serverNow,
        previousValue: null,
        firstChange: true,
        isFirstChange: () => true,
      },
      deadlineAt: {
        currentValue: component.deadlineAt,
        previousValue: null,
        firstChange: true,
        isFirstChange: () => true,
      },
    });

    expect(component.announcement()).toBe('');
    jasmine.clock().tick(1000);
    expect(component.announcement()).toBe('1 minute remaining.');
    jasmine.clock().tick(1000);
    expect(component.announcement()).toBe('1 minute remaining.');
  });

  it('exposes the visible countdown as a non-live timer while using bounded live announcements', () => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date('2026-07-27T10:00:00.000Z'));
    component.serverNow = '2026-07-27T10:00:00.000Z';
    component.deadlineAt = '2026-07-27T10:10:00.000Z';
    component.label = 'MCQ time';
    component.ngOnChanges({
      serverNow: {
        currentValue: component.serverNow,
        previousValue: null,
        firstChange: true,
        isFirstChange: () => true,
      },
      deadlineAt: {
        currentValue: component.deadlineAt,
        previousValue: null,
        firstChange: true,
        isFirstChange: () => true,
      },
    });
    fixture.detectChanges();

    const timer = fixture.nativeElement.querySelector('[role="timer"]') as HTMLElement;
    expect(timer).not.toBeNull();
    expect(timer.getAttribute('aria-live')).toBe('off');
    expect(timer.getAttribute('aria-label')).toContain('MCQ time');
    expect(fixture.nativeElement.querySelector('[aria-live="polite"]')).not.toBeNull();
  });
});
