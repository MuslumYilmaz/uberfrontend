import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnDestroy,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  Observable,
  Subject,
  Subscription,
  mergeMap,
  shareReplay,
  switchMap,
  takeUntil,
} from 'rxjs';
import { AnalyticsService } from '../../../../core/services/analytics.service';
import { FaButtonComponent } from '../../../../shared/ui/button/fa-button.component';
import { FaCardComponent } from '../../../../shared/ui/card/fa-card.component';
import { FaChipComponent } from '../../../../shared/ui/chip/fa-chip.component';
import { FaGlyphComponent } from '../../../../shared/ui/icon/fa-glyph.component';
import {
  ANGULAR_HTTP_CANCELLATION_SCENARIO_IDS,
  AngularHttpCancellationScenarioId,
  CANCELLATION_LAYERS,
  CANCELLATION_SCENARIOS,
} from './angular-http-cancellation-lab.content';

type LabInteractionAction =
  | 'scenario_selected'
  | 'run_model'
  | 'copy_scenario_code'
  | 'copy_test_suite';

type LabRunState = 'idle' | 'complete';

@Component({
  selector: 'app-angular-http-cancellation-lab',
  standalone: true,
  imports: [
    CommonModule,
    FaButtonComponent,
    FaCardComponent,
    FaChipComponent,
    FaGlyphComponent,
  ],
  templateUrl: './angular-http-cancellation-lab.component.html',
  styleUrls: ['./angular-http-cancellation-lab.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AngularHttpCancellationLabComponent implements OnDestroy {
  private readonly analytics = inject(AnalyticsService);
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private modelSubscriptions = new Subscription();

  readonly scenarioIds = ANGULAR_HTTP_CANCELLATION_SCENARIO_IDS;
  readonly scenarios = CANCELLATION_SCENARIOS;
  readonly layers = CANCELLATION_LAYERS;

  @Input({ required: true }) testSuite = '';

  readonly selectedScenarioId = signal<AngularHttpCancellationScenarioId>('manual-unsubscribe');
  readonly selectedScenario = computed(() => {
    const selectedId = this.selectedScenarioId();
    return this.scenarios.find((scenario) => scenario.id === selectedId) ?? this.scenarios[0];
  });
  readonly runState = signal<LabRunState>('idle');
  readonly modelTrace = signal<readonly string[]>([]);
  readonly liveMessage = signal('');
  readonly copyMessage = signal('');

  readonly runSummary = computed(() => {
    if (this.runState() === 'complete') {
      return `${this.selectedScenario().label} snapshot complete; active model subscriptions remain until reset.`;
    }

    return `Ready to run the ${this.selectedScenario().label} behavior model.`;
  });

  selectScenario(id: AngularHttpCancellationScenarioId): void {
    if (!this.scenarioIds.includes(id)) {
      return;
    }

    this.cleanupModel();
    this.selectedScenarioId.set(id);
    this.runState.set('idle');
    this.modelTrace.set([]);
    this.copyMessage.set('');
    this.liveMessage.set(`${this.selectedScenario().label} selected. The model is ready.`);
    this.trackInteraction('scenario_selected', id);
  }

  runModel(): void {
    this.cleanupModel();
    const trace: string[] = [];
    const scenarioId = this.selectedScenarioId();

    switch (scenarioId) {
      case 'manual-unsubscribe':
        this.runManualUnsubscribe(trace);
        break;
      case 'switch-map':
        this.runSwitchMap(trace);
        break;
      case 'merge-map':
        this.runMergeMap(trace);
        break;
      case 'take-until-destroyed':
        this.runTakeUntilDestroyed(trace);
        break;
      case 'async-pipe':
        this.runAsyncPipe(trace);
        break;
      case 'share-replay':
        this.runShareReplay(trace);
        break;
    }

    this.modelTrace.set(trace);
    this.runState.set('complete');
    this.copyMessage.set('');
    this.liveMessage.set(
      `${this.selectedScenario().label} snapshot contains ${trace.length} observable events. Active model subscriptions remain until reset.`,
    );
    this.trackInteraction('run_model', scenarioId);
  }

  resetModel(): void {
    this.cleanupModel();
    this.runState.set('idle');
    this.modelTrace.set([]);
    this.copyMessage.set('');
    this.liveMessage.set(`${this.selectedScenario().label} model reset.`);
  }

  async copyScenarioCode(): Promise<void> {
    const didCopy = await this.copyText(this.selectedScenario().code);
    this.copyMessage.set(didCopy ? 'Scenario code copied.' : 'Copy failed. Select the code and copy it manually.');
    this.liveMessage.set(this.copyMessage());

    if (didCopy) {
      this.trackInteraction('copy_scenario_code', this.selectedScenarioId());
    }
  }

  async copyTestSuite(): Promise<void> {
    const didCopy = await this.copyText(this.testSuite);
    this.copyMessage.set(didCopy ? 'Test suite copied.' : 'Copy failed. Select the test suite and copy it manually.');
    this.liveMessage.set(this.copyMessage());

    if (didCopy) {
      this.trackInteraction('copy_test_suite');
    }
  }

  ngOnDestroy(): void {
    this.cleanupModel();
  }

  private runManualUnsubscribe(trace: string[]): void {
    trace.push('The imperative owner subscribes to request A.');
    const request = this.requestModel('Request A', trace).subscribe();
    this.modelSubscriptions.add(request);
    trace.push('The owner calls unsubscribe while request A is active.');
    request.unsubscribe();
    trace.push('No notification can commit through the closed subscription.');
  }

  private runSwitchMap(trace: string[]): void {
    const intent = new Subject<string>();
    const subscription = intent.pipe(
      switchMap((requestLabel) => this.requestModel(requestLabel, trace)),
    ).subscribe();
    this.modelSubscriptions.add(subscription);

    trace.push('Intent A arrives.');
    intent.next('Request A');
    trace.push('Intent B arrives before request A completes.');
    intent.next('Request B');
    trace.push('Only request B stays active and owns the latest UI commit.');
  }

  private runMergeMap(trace: string[]): void {
    const intent = new Subject<string>();
    const subscription = intent.pipe(
      mergeMap((requestLabel) => this.requestModel(requestLabel, trace)),
    ).subscribe();
    this.modelSubscriptions.add(subscription);

    trace.push('Intent A arrives.');
    intent.next('Request A');
    trace.push('Intent B arrives while request A is active.');
    intent.next('Request B');
    trace.push('Both requests remain active; completion order can differ from intent order.');
  }

  private runTakeUntilDestroyed(trace: string[]): void {
    const destroyed = new Subject<void>();
    trace.push('The component subscribes to request A.');
    const subscription = this.requestModel('Request A', trace).pipe(
      takeUntil(destroyed),
    ).subscribe();
    this.modelSubscriptions.add(subscription);

    trace.push('The owning lifecycle emits its destroy signal.');
    destroyed.next();
    destroyed.complete();
    trace.push('The destroyed owner cannot receive a late notification.');
  }

  private runAsyncPipe(trace: string[]): void {
    trace.push('AsyncPipe subscribes when the view renders.');
    const viewSubscription = this.requestModel('Request A', trace).subscribe();
    this.modelSubscriptions.add(viewSubscription);
    trace.push('The bound view is destroyed while request A is active.');
    viewSubscription.unsubscribe();
    trace.push('AsyncPipe released its view-owned subscription.');
  }

  private runShareReplay(trace: string[]): void {
    const sharedRequest = this.requestModel('Shared request', trace).pipe(
      shareReplay({ bufferSize: 1, refCount: true }),
    );

    trace.push('Subscriber A attaches to the shared request.');
    const first = sharedRequest.subscribe();
    this.modelSubscriptions.add(first);
    trace.push('Subscriber B attaches without creating a second source request.');
    const second = sharedRequest.subscribe();
    this.modelSubscriptions.add(second);
    trace.push('Subscriber A leaves; subscriber B still owns the source.');
    first.unsubscribe();
    trace.push('Subscriber B leaves; refCount reaches zero.');
    second.unsubscribe();
  }

  private requestModel(label: string, trace: string[]): Observable<never> {
    return new Observable<never>(() => {
      trace.push(`${label}: RxJS subscription opened.`);
      return () => trace.push(`${label}: transport teardown invoked.`);
    });
  }

  private cleanupModel(): void {
    this.modelSubscriptions.unsubscribe();
    this.modelSubscriptions = new Subscription();
  }

  private trackInteraction(
    action: LabInteractionAction,
    scenario?: AngularHttpCancellationScenarioId,
  ): void {
    this.analytics.track('trivia_lab_interacted', {
      lab: 'angular_http_cancellation',
      action,
      ...(scenario ? { scenario } : {}),
    });
  }

  private async copyText(value: string): Promise<boolean> {
    if (!this.isBrowser || !value.trim()) {
      return false;
    }

    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(value);
        return true;
      }
    } catch {
      // Clipboard permissions can be denied. Fall through to the selection-based copy path.
    }

    return this.copyWithTextarea(value);
  }

  private copyWithTextarea(value: string): boolean {
    const textarea = this.document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.insetInlineStart = '-9999px';
    textarea.style.opacity = '0';
    this.document.body.appendChild(textarea);

    try {
      textarea.focus();
      textarea.select();
      return this.document.execCommand('copy');
    } catch {
      return false;
    } finally {
      textarea.remove();
    }
  }
}
