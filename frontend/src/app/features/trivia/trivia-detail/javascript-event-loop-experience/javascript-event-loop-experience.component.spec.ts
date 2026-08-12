import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AnalyticsService } from '../../../../core/services/analytics.service';
import {
  EVENT_LOOP_SNAPSHOTS,
  FINAL_TAKEAWAY,
} from './javascript-event-loop-experience.content';
import { JavaScriptEventLoopExperienceComponent } from './javascript-event-loop-experience.component';
import {
  createEventLoopExperienceState,
  eventLoopExperienceScore,
  reduceEventLoopExperience,
} from './javascript-event-loop-experience.model';

describe('JavaScriptEventLoopExperienceComponent', () => {
  let fixture: ComponentFixture<JavaScriptEventLoopExperienceComponent>;
  let component: JavaScriptEventLoopExperienceComponent;
  let analytics: jasmine.SpyObj<AnalyticsService>;
  let observerCallback: IntersectionObserverCallback | undefined;
  let observerInstance: TestIntersectionObserver | undefined;
  let originalIntersectionObserver: typeof IntersectionObserver;

  class TestIntersectionObserver implements IntersectionObserver {
    readonly root = null;
    readonly rootMargin = '0px';
    readonly thresholds = [0, 0.5, 1];
    readonly observe = jasmine.createSpy('observe');
    readonly unobserve = jasmine.createSpy('unobserve');
    readonly disconnect = jasmine.createSpy('disconnect');

    constructor(callback: IntersectionObserverCallback) {
      observerCallback = callback;
      observerInstance = this;
    }

    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }

  beforeEach(async () => {
    analytics = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', ['track']);
    originalIntersectionObserver = window.IntersectionObserver;
    window.IntersectionObserver = TestIntersectionObserver as unknown as typeof IntersectionObserver;

    await TestBed.configureTestingModule({
      imports: [JavaScriptEventLoopExperienceComponent],
      providers: [
        provideRouter([]),
        { provide: AnalyticsService, useValue: analytics },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(JavaScriptEventLoopExperienceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    window.IntersectionObserver = originalIntersectionObserver;
  });

  it('starts with three native prediction choices and does not reveal the answer', () => {
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('[data-testid="javascript-event-loop-experience"]')).not.toBeNull();
    expect(root.querySelectorAll('fieldset input[type="radio"]').length).toBe(3);
    expect(root.querySelectorAll('[aria-live="polite"]').length).toBe(1);
    expect(root.textContent).not.toContain('The deterministic output is');
    expect(root.textContent).toContain('Nothing here executes your code');
    expect(component.state().traceStep).toBe(0);
  });

  it('keeps the initial prediction hidden while advancing a deterministic trace', () => {
    component.selectPrediction('timer-first');
    component.submitPrediction();
    fixture.detectChanges();

    expect(component.state().predictionCorrect).toBeFalse();
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('different from the trace');

    component.startTrace();
    fixture.detectChanges();

    expect(component.snapshot()).toEqual(EVENT_LOOP_SNAPSHOTS[1]);
    expect(component.snapshot().consoleOutput).toEqual(['start', 'end']);
    expect(component.snapshot().microtasks).toEqual(['Promise callback → log promise']);
    expect(component.snapshot().timerTasks).toEqual(['setTimeout callback → log timer']);
  });

  it('explains incorrect decisions without blocking the rest of the experience', () => {
    component.selectPrediction('source-order');
    component.submitPrediction();
    component.startTrace();
    component.selectCheckpoint('timer');
    component.submitCheckpoint();
    fixture.detectChanges();

    expect(component.state().phase).toBe('microtask-ready');
    expect(component.checkpointFeedback()).toContain('zero-delay timer is only eligible');

    component.drainMicrotasks();
    component.selectPaint('after-each-microtask');
    component.submitPaint();
    fixture.detectChanges();

    expect(component.state().phase).toBe('next-task-ready');
    expect(component.paintFeedback()).toContain('no render opportunity is reached');
    expect(component.snapshot().consoleOutput).toEqual(['start', 'end', 'promise']);
  });

  it('hands keyboard focus to each newly rendered phase', fakeAsync(() => {
    component.selectPrediction('promise-first');
    component.submitPrediction();
    tick();
    expect((document.activeElement as HTMLElement).dataset['focusTarget']).toBe('trace-ready');

    component.startTrace();
    tick();
    expect((document.activeElement as HTMLElement).dataset['focusTarget']).toBe('checkpoint');

    component.selectCheckpoint('microtask');
    component.submitCheckpoint();
    tick();
    expect((document.activeElement as HTMLElement).dataset['focusTarget']).toBe('checkpoint-feedback');

    component.drainMicrotasks();
    tick();
    expect((document.activeElement as HTMLElement).dataset['focusTarget']).toBe('paint');

    component.selectPaint('when-queue-empties');
    component.submitPaint();
    tick();
    expect((document.activeElement as HTMLElement).dataset['focusTarget']).toBe('paint-feedback');

    component.finishTrace();
    tick();
    expect((document.activeElement as HTMLElement).dataset['focusTarget']).toBe('result');

    component.replay();
    tick();
    expect((document.activeElement as HTMLElement).dataset['focusTarget']).toBe('prediction');
  }));

  it('scores first submissions, completes once per attempt, and supports a scored replay', () => {
    const completed = spyOn(component.completed, 'emit');

    completeAttempt(component, true);
    component.finishTrace();
    fixture.detectChanges();

    expect(component.score()).toBe(3);
    expect(component.snapshot().consoleOutput).toEqual(['start', 'end', 'promise', 'timer']);
    expect(completed).toHaveBeenCalledTimes(1);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(FINAL_TAKEAWAY);

    component.finishTrace();
    expect(completed).toHaveBeenCalledTimes(1);
    expect(analytics.track.calls.allArgs().filter(([event]) => event === 'trivia_lab_completed')).toHaveSize(1);

    component.replay();
    expect(component.state().attempt).toBe(2);
    completeAttempt(component, false);

    expect(component.score()).toBe(0);
    expect(completed).toHaveBeenCalledTimes(2);
    expect(analytics.track.calls.allArgs().filter(([event]) => event === 'trivia_lab_completed')).toHaveSize(2);
  });

  it('emits the stable analytics contract without code or answer text', () => {
    completeAttempt(component, true);
    component.onRelatedChallengeClick();
    component.replay();

    expect(analytics.track).toHaveBeenCalledWith(
      'trivia_lab_interacted',
      jasmine.objectContaining({
        action: 'prediction_submitted',
        correct: true,
        lab_id: 'js_event_loop_75s_v1',
        question_id: 'js-event-loop',
        scenario_id: 'promise_timer_render_v1',
        attempt_bucket: 'first',
        elapsed_sec: jasmine.any(Number),
      }),
    );
    expect(analytics.track).toHaveBeenCalledWith(
      'trivia_lab_interacted',
      jasmine.objectContaining({ action: 'checkpoint_submitted', correct: true }),
    );
    expect(analytics.track).toHaveBeenCalledWith(
      'trivia_lab_interacted',
      jasmine.objectContaining({ action: 'paint_submitted', correct: true }),
    );
    expect(analytics.track).toHaveBeenCalledWith(
      'trivia_lab_completed',
      jasmine.objectContaining({ correct: true }),
    );
    expect(analytics.track).toHaveBeenCalledWith(
      'trivia_lab_interacted',
      jasmine.objectContaining({ action: 'related_challenge_clicked', attempt_bucket: 'first' }),
    );
    expect(analytics.track).toHaveBeenCalledWith(
      'trivia_lab_interacted',
      jasmine.objectContaining({ action: 'replayed', attempt_bucket: 'first' }),
    );

    const payloads = analytics.track.calls.allArgs().map(([, payload]) => payload ?? {});
    expect(payloads.some((payload) => 'code' in payload || 'answer' in payload || 'text' in payload)).toBeFalse();
  });

  it('does not infer a qualified view from an interaction', () => {
    analytics.track.calls.reset();
    component.selectPrediction('promise-first');

    expect(analytics.track).not.toHaveBeenCalledWith('trivia_lab_viewed', jasmine.anything());
  });

  it('tracks a qualified view only after 50% remains visible for one second', fakeAsync(() => {
    analytics.track.calls.reset();
    const observer = observerInstance as unknown as IntersectionObserver;

    observerCallback?.([
      { isIntersecting: true, intersectionRatio: 0.5 } as IntersectionObserverEntry,
    ], observer);
    tick(999);
    expect(analytics.track).not.toHaveBeenCalledWith('trivia_lab_viewed', jasmine.anything());

    tick(1);
    expect(analytics.track).toHaveBeenCalledTimes(1);
    expect(analytics.track).toHaveBeenCalledWith(
      'trivia_lab_viewed',
      jasmine.objectContaining({ question_id: 'js-event-loop' }),
    );

    observerCallback?.([
      { isIntersecting: true, intersectionRatio: 1 } as IntersectionObserverEntry,
    ], observer);
    tick(1_000);
    expect(analytics.track).toHaveBeenCalledTimes(1);
  }));

  it('disconnects observation and cancels pending view and focus timers when destroyed', fakeAsync(() => {
    analytics.track.calls.reset();
    const observer = observerInstance as unknown as IntersectionObserver;
    observerCallback?.([
      { isIntersecting: true, intersectionRatio: 0.5 } as IntersectionObserverEntry,
    ], observer);
    component.selectPrediction('promise-first');
    component.submitPrediction();

    expect((component as any).viewTimer).not.toBeNull();
    expect((component as any).focusTimer).not.toBeNull();
    fixture.destroy();
    tick(1_000);

    expect(observerInstance?.disconnect).toHaveBeenCalled();
    expect((component as any).viewTimer).toBeNull();
    expect((component as any).focusTimer).toBeNull();
    expect(analytics.track).not.toHaveBeenCalledWith('trivia_lab_viewed', jasmine.anything());
  }));

  it('keeps the reducer deterministic and rejects out-of-order transitions', () => {
    const initial = createEventLoopExperienceState();
    const invalid = reduceEventLoopExperience(initial, { type: 'finish-trace' });
    const selected = reduceEventLoopExperience(initial, {
      type: 'select-prediction',
      choice: 'promise-first',
    });
    const submitted = reduceEventLoopExperience(selected, { type: 'submit-prediction' });

    expect(invalid).toBe(initial);
    expect(submitted.phase).toBe('trace-ready');
    expect(submitted.predictionCorrect).toBeTrue();
    expect(eventLoopExperienceScore(submitted)).toBe(1);
  });
});

function completeAttempt(
  component: JavaScriptEventLoopExperienceComponent,
  correct: boolean,
): void {
  component.selectPrediction(correct ? 'promise-first' : 'timer-first');
  component.submitPrediction();
  component.startTrace();
  component.selectCheckpoint(correct ? 'microtask' : 'timer');
  component.submitCheckpoint();
  component.drainMicrotasks();
  component.selectPaint(correct ? 'when-queue-empties' : 'timer-deadline');
  component.submitPaint();
  component.finishTrace();
}
