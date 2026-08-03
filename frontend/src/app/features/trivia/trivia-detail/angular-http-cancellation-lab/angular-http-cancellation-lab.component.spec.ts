import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AnalyticsService } from '../../../../core/services/analytics.service';
import { AngularHttpCancellationLabComponent } from './angular-http-cancellation-lab.component';
import { ANGULAR_HTTP_CANCELLATION_SCENARIO_IDS } from './angular-http-cancellation-lab.content';

describe('AngularHttpCancellationLabComponent', () => {
  let fixture: ComponentFixture<AngularHttpCancellationLabComponent>;
  let component: AngularHttpCancellationLabComponent;
  let analytics: jasmine.SpyObj<AnalyticsService>;

  const testSuiteFixture = [
    "it('manual unsubscribe', () => {});",
    "it('switchMap', () => {});",
    "it('mergeMap', () => {});",
    "it('takeUntilDestroyed', () => {});",
    "it('AsyncPipe', () => {});",
    "it('shareReplay', () => {});",
  ].join('\n');

  beforeEach(async () => {
    analytics = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', ['track']);

    await TestBed.configureTestingModule({
      imports: [AngularHttpCancellationLabComponent],
      providers: [{ provide: AnalyticsService, useValue: analytics }],
    }).compileComponents();

    fixture = TestBed.createComponent(AngularHttpCancellationLabComponent);
    fixture.componentRef.setInput('testSuite', testSuiteFixture);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('renders all six scenarios with a deterministic SSR-safe manual default', () => {
    const root = fixture.nativeElement as HTMLElement;
    const scenarioButtons = root.querySelectorAll('[data-testid^="cancellation-scenario-"]');
    const selected = root.querySelector(
      '[data-testid="cancellation-scenario-manual-unsubscribe"]',
    );

    expect(ANGULAR_HTTP_CANCELLATION_SCENARIO_IDS.length).toBe(6);
    expect(scenarioButtons.length).toBe(6);
    expect(component.selectedScenarioId()).toBe('manual-unsubscribe');
    expect(selected?.getAttribute('aria-pressed')).toBe('true');
    expect(component.modelTrace()).toEqual([]);
    expect(root.textContent).toContain('The model makes no HTTP request');
    expect(root.querySelector('[aria-label="Expected behavior by cancellation layer"]')?.getAttribute('role'))
      .toBe('group');
    expect(root.querySelector('.cancellation-lab__step')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('selects a scenario with button semantics and emits the analytics contract', () => {
    const root = fixture.nativeElement as HTMLElement;
    const switchMapButton = root.querySelector(
      '[data-testid="cancellation-scenario-switch-map"]',
    ) as HTMLButtonElement;

    switchMapButton.click();
    fixture.detectChanges();

    expect(component.selectedScenarioId()).toBe('switch-map');
    expect(switchMapButton.getAttribute('aria-pressed')).toBe('true');
    expect(root.querySelector('[role="tab"]')).toBeNull();
    expect(analytics.track).toHaveBeenCalledWith('trivia_lab_interacted', {
      lab: 'angular_http_cancellation',
      action: 'scenario_selected',
      scenario: 'switch-map',
    });
  });

  it('executes switchMap teardown and leaves only the latest request active', () => {
    component.selectScenario('switch-map');
    analytics.track.calls.reset();

    component.runModel();

    const trace = component.modelTrace();
    const requestATeardown = trace.indexOf('Request A: transport teardown invoked.');
    const requestBOpened = trace.indexOf('Request B: RxJS subscription opened.');

    expect(requestATeardown).toBeGreaterThan(-1);
    expect(requestBOpened).toBeGreaterThan(requestATeardown);
    expect(trace).not.toContain('Request B: transport teardown invoked.');
    expect(trace).toContain('Only request B stays active and owns the latest UI commit.');
    expect(component.runSummary()).toContain('active model subscriptions remain until reset');
    expect(analytics.track).toHaveBeenCalledWith('trivia_lab_interacted', {
      lab: 'angular_http_cancellation',
      action: 'run_model',
      scenario: 'switch-map',
    });
  });

  it('models mergeMap as concurrent work without automatic supersession', () => {
    component.selectScenario('merge-map');

    component.runModel();

    const trace = component.modelTrace();
    expect(trace).toContain('Request A: RxJS subscription opened.');
    expect(trace).toContain('Request B: RxJS subscription opened.');
    expect(trace).not.toContain('Request A: transport teardown invoked.');
    expect(trace).not.toContain('Request B: transport teardown invoked.');
    expect(component.selectedScenario().ui).toContain('stale-state risk');
  });

  it('models shareReplay refCount teardown only after the final owner leaves', () => {
    component.selectScenario('share-replay');

    component.runModel();

    const trace = component.modelTrace();
    expect(trace.filter((event) => event === 'Shared request: RxJS subscription opened.').length).toBe(1);
    expect(trace.indexOf('Subscriber B leaves; refCount reaches zero.')).toBeLessThan(
      trace.indexOf('Shared request: transport teardown invoked.'),
    );
    expect(component.selectedScenario().summary).toContain('refCount true');
  });

  it('resets the trace and announces the current model state', () => {
    component.runModel();
    expect(component.modelTrace().length).toBeGreaterThan(0);

    component.resetModel();
    fixture.detectChanges();

    expect(component.modelTrace()).toEqual([]);
    expect(component.runState()).toBe('idle');
    expect(component.liveMessage()).toBe('Manual unsubscribe model reset.');
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('[aria-live="polite"]').length).toBe(1);
  });

  it('copies scenario code and the injected suite with stable analytics payloads', async () => {
    const copyText = spyOn(component as any, 'copyText').and.resolveTo(true);

    await component.copyScenarioCode();
    await component.copyTestSuite();

    expect(copyText).toHaveBeenCalledWith(component.selectedScenario().code);
    expect(copyText).toHaveBeenCalledWith(testSuiteFixture);
    expect(analytics.track).toHaveBeenCalledWith('trivia_lab_interacted', {
      lab: 'angular_http_cancellation',
      action: 'copy_scenario_code',
      scenario: 'manual-unsubscribe',
    });
    expect(analytics.track).toHaveBeenCalledWith('trivia_lab_interacted', {
      lab: 'angular_http_cancellation',
      action: 'copy_test_suite',
    });
  });

  it('falls back to a temporary textarea when the Clipboard API is unavailable', () => {
    const execCommand = spyOn(document, 'execCommand').and.returnValue(true);

    const copied = (component as any).copyWithTextarea('fallback content') as boolean;

    expect(copied).toBeTrue();
    expect(execCommand).toHaveBeenCalledWith('copy');
    expect(document.body.querySelector('textarea[value="fallback content"]')).toBeNull();
  });

  it('keeps the complete suite out of the DOM and exposes a compact copy action', () => {
    const root = fixture.nativeElement as HTMLElement;

    expect(root.textContent).not.toContain("it('manual unsubscribe'");
    expect(root.textContent).toContain('Copy the complete http-cancellation.spec.ts');
    expect(root.querySelector('[data-testid="angular-http-cancellation-run"]')).not.toBeNull();
    expect(root.querySelector('[data-testid="angular-http-cancellation-reset"]')).not.toBeNull();
    expect(root.querySelector('[data-testid="angular-http-cancellation-copy-suite"]')).not.toBeNull();
    expect(
      (root.querySelector('[data-testid="angular-http-cancellation-copy-suite"]') as HTMLButtonElement)
        .disabled,
    ).toBeFalse();
  });
});
