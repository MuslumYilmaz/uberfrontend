import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { AnalyticsService } from '../../../../core/services/analytics.service';
import { RxjsOverlapPlaygroundComponent } from './rxjs-overlap-playground.component';
import { FINAL_TAKEAWAY, OVERLAP_SCENARIOS } from './rxjs-overlap-playground.content';

describe('RxjsOverlapPlaygroundComponent', () => {
  let fixture: ComponentFixture<RxjsOverlapPlaygroundComponent>;
  let component: RxjsOverlapPlaygroundComponent;
  let analytics: jasmine.SpyObj<AnalyticsService>;
  let observerCallback: IntersectionObserverCallback | undefined;
  let observerInstance: TestIntersectionObserver | undefined;
  let originalIntersectionObserver: typeof IntersectionObserver;
  let originalVisibilityStateDescriptor: PropertyDescriptor | undefined;
  let originalMatchMedia: typeof window.matchMedia;
  let reducedMotion = false;

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
      imports: [RxjsOverlapPlaygroundComponent],
      providers: [
        provideRouter([]),
        { provide: AnalyticsService, useValue: analytics },
        { provide: ActivatedRoute, useValue: { snapshot: { fragment } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RxjsOverlapPlaygroundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  function root(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function text(selector: string): string {
    return (root().querySelector(selector)?.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function count(selector: string): number {
    return root().querySelectorAll(selector).length;
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
    originalMatchMedia = window.matchMedia;
    reducedMotion = false;
    window.matchMedia = ((query: string) => ({
      matches: query.includes('reduce') ? reducedMotion : false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;
  });

  afterEach(() => {
    fixture?.destroy();
    window.IntersectionObserver = originalIntersectionObserver;
    window.matchMedia = originalMatchMedia;
    if (originalVisibilityStateDescriptor) {
      Object.defineProperty(document, 'visibilityState', originalVisibilityStateDescriptor);
    } else {
      delete (document as any).visibilityState;
    }
  });

  it('renders the seed stream, one switchMap lane, four prediction choices, and no verdict', async () => {
    await setup();

    expect(root().querySelector('[data-testid="rxjs-overlap-playground"]')).not.toBeNull();
    expect(count('[data-testid^="overlap-scenario-"]')).toBe(OVERLAP_SCENARIOS.length + 1);
    expect(count('[data-testid="overlap-triggers"] > li')).toBe(2);
    expect(count('[data-testid^="overlap-marker-"]')).toBe(2);
    expect(count('[data-testid^="overlap-lane-"]')).toBe(1);
    expect(root().querySelector('[data-testid="overlap-lane-switchMap"]')).not.toBeNull();
    expect(count('input[name="overlap-operator"]')).toBe(4);
    expect(count('input[name="overlap-prediction"]')).toBe(4);
    expect(count('[aria-live="polite"]')).toBe(1);
    expect(root().querySelector('[data-testid="overlap-verdict"]')).toBeNull();
    expect(root().querySelector('[data-testid="overlap-compare"]')).toBeNull();
    expect(text('[data-testid="overlap-stage"]')).toBe('Ready to reveal');
    expect(text('[data-testid="overlap-stream"]')).toBe('Stream: A at 0 ms, B at 100 ms; other requests take 300 ms.');
    expect((root().querySelector('[data-testid="overlap-reveal"]') as HTMLButtonElement).disabled).toBeTrue();
    expect(root().textContent).toContain(FINAL_TAKEAWAY);
    expect(root().querySelector('#overlap-scenario-stale-overwrite')).not.toBeNull();
    expect(root().textContent).toContain('Predict first, then reveal.');
  });

  it('reveals a wrong prediction without completing, then completes on a correct one', async () => {
    await setup();
    const completed = spyOn(component.completed, 'emit');

    component.selectPrediction('A@300');
    component.reveal();
    fixture.detectChanges();

    expect(text('[data-testid="overlap-stage"]')).toBe('Revealed');
    expect(root().querySelector('[data-testid="overlap-verdict"]')?.getAttribute('data-fit')).toBe('true');
    expect(text('[data-testid="overlap-verdict"] h3')).toBe('switchMap fits: show the latest result only');
    expect(root().querySelector('[data-testid="overlap-prediction-feedback"]')?.getAttribute('data-correct')).toBe('false');
    expect(text('[data-testid="overlap-ui-switchMap"]')).toBe('UI shows: B at 400 ms');
    expect(count('[data-testid="overlap-lane-text-switchMap"] li')).toBe(2);
    expect(count('[data-testid="overlap-lane-switchMap"] .overlap-lab__bar')).toBe(2);
    expect(count('[data-testid="overlap-lane-switchMap"] .overlap-lab__tail')).toBe(1);
    expect(root().querySelector('[data-testid="overlap-apply-fix"]')).toBeNull();
    expect(completed).not.toHaveBeenCalled();

    component.selectScenario('stale-overwrite');
    fixture.detectChanges();
    expect(text('[data-testid="overlap-scenario-card"] h3')).toBe('The slow old response arrives last and wins');
    expect(text('[data-testid="overlap-stage"]')).toBe('Ready to reveal');

    component.selectPrediction('B@300|A@500');
    component.reveal();
    fixture.detectChanges();

    expect(root().querySelector('[data-testid="overlap-verdict"]')?.getAttribute('data-fit')).toBe('false');
    expect(count('[data-testid="overlap-hazards"] li[data-severity="danger"]')).toBe(2);
    expect(root().querySelector('[data-testid="overlap-hazards"] li[data-hazard="stale-overwrite"]')).not.toBeNull();
    expect(text('[data-testid="overlap-apply-fix"]')).toBe('Switch to switchMap and reveal again');
    expect(completed).toHaveBeenCalledTimes(1);
    expect(analytics.track.calls.allArgs().filter(([event]) => event === 'trivia_lab_completed')).toHaveSize(1);

    component.applyFix();
    fixture.detectChanges();
    expect(component.state().operator).toBe('switchMap');
    expect(root().querySelector('[data-testid="overlap-verdict"]')?.getAttribute('data-fit')).toBe('true');
    expect(text('[data-testid="overlap-ui-switchMap"]')).toBe('UI shows: B at 300 ms');
    expect(completed).toHaveBeenCalledTimes(1);
  });

  it('completes after three preset scenarios even with wrong predictions', async () => {
    await setup();
    const completed = spyOn(component.completed, 'emit');

    const wrongChoice = (): string =>
      component.predictionChoices().find((choice) => !choice.operators.includes(component.state().operator))!.key;
    for (const id of ['typeahead-search', 'save-double-click'] as const) {
      component.selectScenario(id);
      component.selectPrediction(wrongChoice());
      component.reveal();
      expect(component.state().prediction.correct).toBeFalse();
    }
    expect(completed).not.toHaveBeenCalled();

    component.selectScenario('wizard-saves');
    component.selectPrediction(wrongChoice());
    component.reveal();
    fixture.detectChanges();

    expect(completed).toHaveBeenCalledTimes(1);
    expect(text('[data-testid="overlap-score"]')).toContain('Scenarios revealed: 3 of 7.');
  });

  it('runs all four operators in compare mode and completes after two compare reveals', async () => {
    await setup();
    const completed = spyOn(component.completed, 'emit');

    component.setView('compare');
    fixture.detectChanges();
    expect(count('[data-testid^="overlap-lane-"]')).toBe(4);
    expect(root().querySelector('[data-testid="overlap-prediction"]')).toBeNull();
    expect((root().querySelector('[data-testid="overlap-reveal"]') as HTMLButtonElement).disabled).toBeFalse();
    expect(root().textContent).toContain('Reveal to run all four operators.');

    component.reveal();
    fixture.detectChanges();
    expect(count('[data-testid="overlap-compare"] tbody tr')).toBe(4);
    expect(text('[data-testid="overlap-ui-mergeMap"]')).toBe('UI shows: A at 300 ms, then B at 400 ms');
    expect(text('[data-testid="overlap-ui-concatMap"]')).toBe('UI shows: A at 300 ms, then B at 600 ms');
    expect(text('[data-testid="overlap-ui-exhaustMap"]')).toBe('UI shows: A at 300 ms');
    expect(root().querySelector('[data-testid="overlap-compare"] tr[data-operator="switchMap"]')?.getAttribute('data-fit')).toBe('true');
    expect(completed).not.toHaveBeenCalled();

    component.applyBurst('fast-typing');
    component.reveal();
    fixture.detectChanges();
    expect(completed).toHaveBeenCalledTimes(1);
  });

  it('edits the stream through the editor and resets predictions on every change', async () => {
    await setup();

    component.selectPrediction('B@400');
    component.addTrigger();
    fixture.detectChanges();
    expect(count('[data-testid="overlap-triggers"] > li')).toBe(3);
    expect(component.state().prediction.choiceKey).toBeNull();
    expect(text('[data-testid="overlap-trigger-count"]')).toBe('3 of 6 triggers');

    const thirdId = component.state().triggers[2].id;
    component.moveTrigger(thirdId, 50);
    expect(component.state().triggers.map((trigger) => `${trigger.label}@${trigger.at}`)).toEqual(['A@0', 'B@50', 'C@100']);

    component.setTriggerDuration(component.state().triggers[0].id, 600);
    fixture.detectChanges();
    expect(text('[data-testid="overlap-stream"]')).toContain('A at 0 ms (600 ms request)');

    component.removeTrigger(component.state().triggers[0].id);
    expect(component.state().triggers.length).toBe(2);

    component.setDefaultDuration(500);
    fixture.detectChanges();
    expect(text('[data-testid="overlap-duration-value"]')).toBe('500 ms');

    component.setIntent('submit-once');
    fixture.detectChanges();
    expect(text('[data-testid="overlap-promise"]')).toContain('Submit exactly once (exhaustMap encodes it)');

    component.selectScenario('typeahead-search');
    component.reveal();
    expect(component.state().stage).toBe('ready');
    component.selectPrediction(component.predictionChoices()[0].key);
    component.reveal();
    component.addTrigger();
    expect(component.state().scenarioDirty).toBeTrue();
    expect(component.state().stage).toBe('ready');
  });

  it('steps the cursor through event times and hides Play under reduced motion', async () => {
    reducedMotion = true;
    await setup();

    component.selectPrediction('B@400');
    component.reveal();
    fixture.detectChanges();
    expect(root().querySelector('[data-testid="overlap-play"]')).toBeNull();
    expect(text('[data-testid="overlap-cursor-value"]')).toBe('1200 ms');

    component.setCursor(0);
    component.stepCursor(1);
    fixture.detectChanges();
    expect(text('[data-testid="overlap-cursor-value"]')).toBe('100 ms');
    expect(count('[data-testid="overlap-lane-switchMap"] .overlap-lab__bar')).toBe(1);

    component.stepCursor(1);
    component.stepCursor(1);
    fixture.detectChanges();
    expect(text('[data-testid="overlap-cursor-value"]')).toBe('400 ms');
    expect(count('[data-testid="overlap-lane-switchMap"] .overlap-lab__delivery')).toBe(1);

    component.togglePlay();
    expect(component.playing()).toBeFalse();
  });

  it('plays the cursor forward when motion is allowed', fakeAsync(async () => {
    await setup();
    component.selectPrediction('B@400');
    component.reveal();
    fixture.detectChanges();
    expect(root().querySelector('[data-testid="overlap-play"]')).not.toBeNull();

    component.togglePlay();
    expect(component.playing()).toBeTrue();
    expect(component.state().cursorMs).toBe(0);
    tick(200);
    expect(component.state().cursorMs).toBe(100);
    component.togglePlay();
    expect(component.playing()).toBeFalse();
    tick(200);
    expect(component.state().cursorMs).toBe(100);
    expect(analytics.track).toHaveBeenCalledWith('trivia_lab_interacted', jasmine.objectContaining({ action: 'played' }));
  }));

  it('hands keyboard focus to the scenario card, the prediction, and the verdict', fakeAsync(async () => {
    await setup();

    component.selectScenario('dropped-click');
    tick();
    expect((document.activeElement as HTMLElement).dataset['focusTarget']).toBe('scenario');

    component.selectPrediction(component.predictionChoices()[0].key);
    component.reveal();
    tick();
    expect((document.activeElement as HTMLElement).dataset['testid']).toBe('overlap-verdict');

    component.applyFix();
    tick();
    expect((document.activeElement as HTMLElement).dataset['testid']).toBe('overlap-verdict');

    component.addTrigger();
    tick();
    expect((document.activeElement as HTMLElement).dataset['focusTarget']).toMatch(/^trigger-t\d+$/);

    component.reset();
    tick();
    expect((document.activeElement as HTMLElement).dataset['focusTarget']).toBe('scenario');
    expect(component.state().stage).toBe('ready');
  }));

  it('preselects the scenario named by the route fragment without tracking an interaction', async () => {
    await setup('overlap-scenario-cancel-not-server');

    expect(component.state().scenario?.id).toBe('cancel-not-server');
    expect(component.state().operator).toBe('switchMap');
    expect(text('[data-testid="overlap-scenario-card"] h3')).toBe('switchMap cancelled the client, the server still charged');
    expect(analytics.track).not.toHaveBeenCalled();
  });

  it('emits the stable analytics contract with codes only', async () => {
    await setup();

    component.selectScenario('save-double-click');
    component.selectPrediction('A@300|B@420');
    component.reveal();
    component.applyFix();
    component.setView('compare');
    component.reveal();
    component.onRelatedLinkClick('take-latest');
    component.reset();

    const base = {
      lab_id: 'rxjs_overlap_playground',
      question_id: 'rxjs-switchmap-mergemap-exhaustmap-concatmap-angular-when-to-use',
      scenario_id: 'save-double-click',
      elapsed_sec: jasmine.any(Number),
    };
    expect(analytics.track).toHaveBeenCalledWith('trivia_lab_interacted', jasmine.objectContaining({ ...base, action: 'scenario_selected', attempt_bucket: 'first', trigger_count: 2 }));
    expect(analytics.track).toHaveBeenCalledWith('trivia_lab_interacted', jasmine.objectContaining({ action: 'prediction_submitted', correct: true, choice_index: jasmine.any(Number) }));
    expect(analytics.track).toHaveBeenCalledWith('trivia_lab_interacted', jasmine.objectContaining({
      ...base, action: 'revealed', operator: 'mergeMap', intent: 'submit-once', fits: false, danger_count: 1, hazards: ['duplicate-request'],
    }));
    expect(analytics.track).toHaveBeenCalledWith('trivia_lab_completed', jasmine.objectContaining({ ...base, qualification: 'prediction', correct_predictions: 1 }));
    expect(analytics.track).toHaveBeenCalledWith('trivia_lab_interacted', jasmine.objectContaining({ action: 'fix_applied', from_operator: 'mergeMap', to_operator: 'exhaustMap' }));
    expect(analytics.track).toHaveBeenCalledWith('trivia_lab_interacted', jasmine.objectContaining({ action: 'view_switched', view: 'compare' }));
    expect(analytics.track).toHaveBeenCalledWith('trivia_lab_interacted', jasmine.objectContaining({ action: 'compare_revealed', deliveries: [1, 2, 2, 1] }));
    expect(analytics.track).toHaveBeenCalledWith('trivia_lab_interacted', jasmine.objectContaining({ action: 'related_link_clicked', link: 'take-latest' }));
    expect(analytics.track).toHaveBeenCalledWith('trivia_lab_interacted', jasmine.objectContaining({ action: 'reset' }));

    const payloads = analytics.track.calls.allArgs().map(([, payload]) => payload ?? {});
    expect(payloads.some((payload) => ['code', 'answer', 'text', 'title', 'label', 'story'].some((key) => key in payload))).toBeFalse();
    expect(analytics.track.calls.allArgs().filter(([event]) => event === 'trivia_lab_completed')).toHaveSize(1);
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
      jasmine.objectContaining({ question_id: 'rxjs-switchmap-mergemap-exhaustmap-concatmap-angular-when-to-use', scenario_id: 'custom' }),
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
    component.selectScenario('wizard-saves');
    component.selectPrediction(component.predictionChoices()[0].key);
    component.reveal();
    component.togglePlay();

    expect((component as any).viewTimer).not.toBeNull();
    expect((component as any).focusTimer).not.toBeNull();
    expect((component as any).playTimer).not.toBeNull();
    fixture.destroy();
    tick(1_000);

    expect(observerInstance?.disconnect).toHaveBeenCalled();
    expect((component as any).viewTimer).toBeNull();
    expect((component as any).focusTimer).toBeNull();
    expect((component as any).playTimer).toBeNull();
    expect(analytics.track).not.toHaveBeenCalledWith('trivia_lab_viewed', jasmine.anything());
  }));
});
