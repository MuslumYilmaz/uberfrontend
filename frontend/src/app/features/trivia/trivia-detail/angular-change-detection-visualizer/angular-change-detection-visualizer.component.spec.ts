import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { AnalyticsService } from '../../../../core/services/analytics.service';
import { AngularChangeDetectionVisualizerComponent } from './angular-change-detection-visualizer.component';
import { FINAL_TAKEAWAY } from './angular-change-detection-visualizer.content';

describe('AngularChangeDetectionVisualizerComponent', () => {
  let fixture: ComponentFixture<AngularChangeDetectionVisualizerComponent>;
  let component: AngularChangeDetectionVisualizerComponent;
  let analytics: jasmine.SpyObj<AnalyticsService>;
  let observerCallback: IntersectionObserverCallback | undefined;
  let observerInstance: TestIntersectionObserver | undefined;
  let originalIntersectionObserver: typeof IntersectionObserver;
  let originalVisibilityStateDescriptor: PropertyDescriptor | undefined;

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

  async function setup(fragment: string | null = null): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [AngularChangeDetectionVisualizerComponent],
      providers: [
        provideRouter([]),
        { provide: AnalyticsService, useValue: analytics },
        { provide: ActivatedRoute, useValue: { snapshot: { fragment } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AngularChangeDetectionVisualizerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  function root(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function text(selector: string): string {
    return (root().querySelector(selector)?.textContent || '').replace(/\s+/g, ' ').trim();
  }

  beforeEach(() => {
    analytics = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', ['track']);
    originalIntersectionObserver = window.IntersectionObserver;
    window.IntersectionObserver = TestIntersectionObserver as unknown as typeof IntersectionObserver;
    originalVisibilityStateDescriptor = Object.getOwnPropertyDescriptor(document, 'visibilityState');
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible' as DocumentVisibilityState,
    });
  });

  afterEach(() => {
    fixture?.destroy();
    window.IntersectionObserver = originalIntersectionObserver;
    if (originalVisibilityStateDescriptor) {
      Object.defineProperty(document, 'visibilityState', originalVisibilityStateDescriptor);
    } else {
      delete (document as any).visibilityState;
    }
  });

  it('renders the seven-node tree, five scenarios, ten triggers, and no verdict before a run', async () => {
    await setup();

    expect(root().querySelector('[data-testid="angular-change-detection-visualizer"]')).not.toBeNull();
    expect(root().querySelectorAll('[data-testid="cd-tree"] > li').length).toBe(7);
    expect(root().querySelectorAll('[data-testid^="cd-scenario-"]').length).toBe(6);
    expect(root().querySelectorAll('[data-testid="cd-scenario-card"]').length).toBe(1);
    expect(root().querySelectorAll('[data-testid^="cd-trigger-"]').length).toBe(10);
    expect(root().querySelectorAll('input[name="cd-mode"]').length).toBe(2);
    expect(root().querySelectorAll('[aria-live="polite"]').length).toBe(1);
    expect(root().querySelector('[data-testid="cd-trace-empty"]')).not.toBeNull();
    expect(root().querySelector('[data-testid="cd-diagnosis"]')).toBeNull();
    expect(root().querySelector('[data-testid="cd-fresh"]')).toBeNull();
    expect(text('[data-testid="cd-checked-count"]')).toBe('Checked 0 of 7');
    expect(root().textContent).toContain('it does not execute your code');
    expect(root().textContent).toContain(FINAL_TAKEAWAY);
    expect(root().querySelector('#cd-scenario-push-mutation')).not.toBeNull();
  });

  it('runs a preset bug, shows the diagnosis, repairs it, and completes once', async () => {
    await setup();
    const completed = spyOn(component.completed, 'emit');

    component.selectScenario('push-mutation');
    fixture.detectChanges();
    expect(text('[data-testid="cd-scenario-card"] h3')).toBe('The list keeps the old users after push()');
    expect(root().querySelector('[data-node="list"] [data-testid="cd-strategy-list"]')?.textContent?.trim()).toBe('OnPush');

    component.runScenario();
    fixture.detectChanges();

    expect(text('[data-testid="cd-checked-count"]')).toBe('Checked 3 of 7');
    expect(root().querySelectorAll('[data-testid="cd-trace"] > li').length).toBe(7);
    expect(root().querySelector('[data-node="list"]')?.getAttribute('data-outcome')).toBe('skipped');
    expect(root().querySelector('[data-node="list"]')?.getAttribute('data-stale')).toBe('true');
    expect(text('[data-testid="cd-diagnosis"] h3')).toBe('Stale: same input reference');
    expect(text('[data-testid="cd-diagnosis"]')).toContain('Pass a new reference');
    expect(completed).not.toHaveBeenCalled();

    component.applyFix();
    fixture.detectChanges();

    expect(root().querySelector('[data-testid="cd-diagnosis"]')).toBeNull();
    expect(text('[data-testid="cd-fresh"] h3')).toBe('Fresh: 4 of 7 views checked, every value matches');
    expect(root().querySelector('[data-node="list"]')?.getAttribute('data-outcome')).toBe('updated');
    expect(completed).toHaveBeenCalledTimes(1);
    expect(analytics.track.calls.allArgs().filter(([event]) => event === 'trivia_lab_completed')).toHaveSize(1);

    component.runScenario();
    component.applyFix();
    expect(completed).toHaveBeenCalledTimes(1);
  });

  it('completes after three distinct scenarios even without a fix', async () => {
    await setup();
    const completed = spyOn(component.completed, 'emit');

    for (const id of ['signal-in-onpush', 'timer-in-service'] as const) {
      component.selectScenario(id);
      component.runScenario();
    }
    expect(completed).not.toHaveBeenCalled();

    component.selectScenario('zoneless-timer');
    component.runScenario();
    fixture.detectChanges();

    expect(completed).toHaveBeenCalledTimes(1);
    expect(text('[data-testid="cd-checked-count"]')).toBe('Checked 0 of 7');
    expect(text('[data-testid="cd-schedule"]')).toBe('No pass scheduled');
    expect(text('[data-testid="cd-diagnosis"] h3')).toBe('Stale: nothing scheduled a pass');
    expect((root().querySelector('input[name="cd-mode"][value="zoneless"]') as HTMLInputElement).checked).toBeTrue();
  });

  it('lets the sandbox fire triggers on the selected node and disables input triggers on the root', async () => {
    await setup();

    component.selectNode('app');
    fixture.detectChanges();
    expect(text('[data-testid="cd-selected-node"]')).toBe('AppComponent');
    expect((root().querySelector('[data-testid="cd-trigger-inputMutation"]') as HTMLButtonElement).disabled).toBeTrue();
    expect((root().querySelector('[data-testid="cd-trigger-click"]') as HTMLButtonElement).disabled).toBeFalse();

    component.fireTrigger('inputMutation');
    expect(component.state().lastRun).toBeNull();

    component.selectNode('footer');
    component.toggleStrategy('footer');
    component.fireTrigger('timerInService');
    fixture.detectChanges();

    expect(text('[data-testid="cd-strategy-footer"]')).toBe('OnPush');
    expect(text('[data-testid="cd-checked-count"]')).toBe('Checked 6 of 7');
    expect(text('[data-testid="cd-diagnosis"] h3')).toBe('Stale: OnPush saw no trigger');
    expect(component.state().scenario).toBeNull();

    component.setMode('zoneless');
    component.fireTrigger('timerInService');
    fixture.detectChanges();
    expect(text('[data-testid="cd-schedule"]')).toBe('No pass scheduled');
  });

  it('hands keyboard focus to the scenario card and then to the verdict', fakeAsync(async () => {
    await setup();

    component.selectScenario('timer-in-service');
    tick();
    expect((document.activeElement as HTMLElement).dataset['focusTarget']).toBe('scenario');

    component.runScenario();
    tick();
    expect((document.activeElement as HTMLElement).dataset['focusTarget']).toBe('result');
    expect((document.activeElement as HTMLElement).dataset['testid']).toBe('cd-diagnosis');

    component.applyFix();
    tick();
    expect((document.activeElement as HTMLElement).dataset['testid']).toBe('cd-fresh');

    component.reset();
    tick();
    expect((document.activeElement as HTMLElement).dataset['focusTarget']).toBe('scenario');
    expect(component.state().lastRun).toBeNull();
  }));

  it('preselects the scenario named by the route fragment without tracking an interaction', async () => {
    await setup('cd-scenario-zoneless-timer');

    expect(component.state().scenario?.id).toBe('zoneless-timer');
    expect(component.state().mode).toBe('zoneless');
    expect(text('[data-testid="cd-scenario-card"] h3')).toBe('Default everywhere, but zoneless skips the timer');
    expect(analytics.track).not.toHaveBeenCalled();
  });

  it('emits the stable analytics contract with codes only', async () => {
    await setup();

    component.selectScenario('manual-subscribe');
    component.runScenario();
    component.applyFix();
    component.toggleStrategy('app');
    component.setMode('zoneless');
    component.onRelatedLinkClick('zonejs');
    component.reset();

    const base = {
      lab_id: 'angular_change_detection_visualizer',
      question_id: 'angular-change-detection-strategies',
      scenario_id: 'manual-subscribe',
      elapsed_sec: jasmine.any(Number),
    };
    expect(analytics.track).toHaveBeenCalledWith('trivia_lab_interacted', jasmine.objectContaining({ ...base, action: 'scenario_selected', attempt_bucket: 'first' }));
    expect(analytics.track).toHaveBeenCalledWith('trivia_lab_interacted', jasmine.objectContaining({
      ...base,
      action: 'scenario_run',
      trigger: 'manualSubscribeAssign',
      node: 'header',
      mode: 'zone',
      schedule: 'tick',
      checked_count: 6,
      stale: true,
      attempt_bucket: 'first',
    }));
    expect(analytics.track).toHaveBeenCalledWith('trivia_lab_interacted', jasmine.objectContaining({
      action: 'diagnosis_shown', diagnosis: 'manual-subscribe-no-mark', fix: 'async-pipe',
    }));
    expect(analytics.track).toHaveBeenCalledWith('trivia_lab_interacted', jasmine.objectContaining({
      action: 'fix_applied', trigger: 'httpAsyncPipe', checked_count: 7, stale: false, attempt_bucket: 'repeat',
    }));
    expect(analytics.track).toHaveBeenCalledWith('trivia_lab_completed', jasmine.objectContaining({ ...base, scenarios_run: 1, fixes_applied: 1 }));
    expect(analytics.track).toHaveBeenCalledWith('trivia_lab_interacted', jasmine.objectContaining({ action: 'strategy_toggled', node: 'app', strategy: 'onpush' }));
    expect(analytics.track).toHaveBeenCalledWith('trivia_lab_interacted', jasmine.objectContaining({ action: 'mode_switched' }));
    expect(analytics.track).toHaveBeenCalledWith('trivia_lab_interacted', jasmine.objectContaining({ action: 'related_link_clicked', link: 'zonejs' }));
    expect(analytics.track).toHaveBeenCalledWith('trivia_lab_interacted', jasmine.objectContaining({ action: 'reset' }));

    const payloads = analytics.track.calls.allArgs().map(([, payload]) => payload ?? {});
    expect(payloads.some((payload) => 'code' in payload || 'answer' in payload || 'text' in payload || 'title' in payload)).toBeFalse();
    expect(analytics.track).not.toHaveBeenCalledWith('trivia_lab_viewed', jasmine.anything());
  });

  it('tracks a qualified view only after 50% stays visible for one second', fakeAsync(async () => {
    await setup();
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
      jasmine.objectContaining({ question_id: 'angular-change-detection-strategies', scenario_id: 'custom' }),
    );

    observerCallback?.([
      { isIntersecting: true, intersectionRatio: 1 } as IntersectionObserverEntry,
    ], observer);
    tick(1_000);
    expect(analytics.track).toHaveBeenCalledTimes(1);
  }));

  it('disconnects observation and cancels pending timers when destroyed', fakeAsync(async () => {
    await setup();
    analytics.track.calls.reset();
    const observer = observerInstance as unknown as IntersectionObserver;
    observerCallback?.([
      { isIntersecting: true, intersectionRatio: 0.5 } as IntersectionObserverEntry,
    ], observer);
    component.selectScenario('push-mutation');

    expect((component as any).viewTimer).not.toBeNull();
    expect((component as any).focusTimer).not.toBeNull();
    fixture.destroy();
    tick(1_000);

    expect(observerInstance?.disconnect).toHaveBeenCalled();
    expect((component as any).viewTimer).toBeNull();
    expect((component as any).focusTimer).toBeNull();
    expect(analytics.track).not.toHaveBeenCalledWith('trivia_lab_viewed', jasmine.anything());
  }));
});
