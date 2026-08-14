import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { environment } from '../../../../environments/environment';
import { TurnstileLoaderService } from './turnstile-loader.service';
import {
  TurnstileApi,
  TurnstileChallengeAction,
  TurnstileChallengeState,
  TurnstileWidgetOptions,
} from './turnstile-challenge.types';

export type {
  TurnstileChallengeAction,
  TurnstileChallengeState,
} from './turnstile-challenge.types';

@Component({
  selector: 'app-turnstile-challenge',
  standalone: true,
  templateUrl: './turnstile-challenge.component.html',
  styleUrls: ['./turnstile-challenge.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TurnstileChallengeComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) action: TurnstileChallengeAction = 'contact';
  @Input() active = false;

  @Output() readonly tokenChange = new EventEmitter<string>();
  @Output() readonly stateChange = new EventEmitter<TurnstileChallengeState>();

  @ViewChild('widgetContainer', { static: true })
  private readonly widgetContainer!: ElementRef<HTMLElement>;

  currentState: TurnstileChallengeState = 'idle';

  private api: TurnstileApi | null = null;
  private widgetId: string | null = null;
  private viewInitialized = false;
  private destroyed = false;
  private operation = 0;

  constructor(
    private readonly loader: TurnstileLoaderService,
    private readonly zone: NgZone,
    private readonly changeDetector: ChangeDetectorRef,
  ) { }

  ngAfterViewInit(): void {
    this.viewInitialized = true;
    if (this.active) void this.renderWidget();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.viewInitialized || this.destroyed) return;

    if (changes['active'] && !this.active) {
      this.removeWidget(true, true);
      return;
    }

    if (!this.active) return;

    if (changes['action'] && this.widgetId) {
      this.removeWidget(true, false);
    }

    if (changes['active'] || changes['action']) void this.renderWidget();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.removeWidget(true, false);
  }

  reset(): void {
    if (this.destroyed) return;

    this.tokenChange.emit('');

    if (!this.active) {
      this.setState('idle');
      return;
    }

    if (this.api && this.widgetId) {
      try {
        this.api.reset(this.widgetId);
        this.setState('ready');
        return;
      } catch {
        this.removeWidget(false, false);
      }
    }

    void this.renderWidget();
  }

  private async renderWidget(): Promise<void> {
    if (
      !this.loader.isBrowser
      || !this.viewInitialized
      || !this.active
      || this.destroyed
      || this.widgetId
      || this.currentState === 'loading'
    ) {
      return;
    }

    const siteKey = String(environment.turnstileSiteKey || '').trim();
    if (!siteKey) {
      this.tokenChange.emit('');
      this.setState('error');
      return;
    }

    const operation = ++this.operation;
    this.tokenChange.emit('');
    this.setState('loading');

    try {
      const api = await this.loader.load();
      if (!this.isCurrent(operation)) return;

      this.api = api;
      const options: TurnstileWidgetOptions = {
        sitekey: siteKey,
        action: this.action,
        appearance: 'interaction-only',
        size: 'flexible',
        theme: 'auto',
        'refresh-expired': 'auto',
        'refresh-timeout': 'auto',
        callback: (token) => this.runCallback(operation, () => {
          if (!token) {
            this.tokenChange.emit('');
            this.setState('error');
            return;
          }

          this.tokenChange.emit(token);
          this.setState('verified');
        }),
        'expired-callback': () => this.runCallback(operation, () => {
          this.tokenChange.emit('');
          this.setState('expired');
        }),
        'error-callback': () => this.runCallback(operation, () => {
          this.tokenChange.emit('');
          this.setState('error');
        }),
        'timeout-callback': () => this.runCallback(operation, () => {
          this.tokenChange.emit('');
          this.setState('expired');
        }),
        'unsupported-callback': () => this.runCallback(operation, () => {
          this.tokenChange.emit('');
          this.setState('error');
        }),
      };

      const widgetId = api.render(this.widgetContainer.nativeElement, options);
      if (!widgetId) throw new Error('Turnstile did not return a widget id.');

      this.widgetId = widgetId;
      this.markReadyAfterRender();
    } catch {
      if (!this.isCurrent(operation)) return;
      this.api = null;
      this.widgetId = null;
      this.tokenChange.emit('');
      this.setState('error');
    }
  }

  private runCallback(operation: number, callback: () => void): void {
    this.zone.run(() => {
      if (!this.isCurrent(operation)) return;
      callback();
    });
  }

  private isCurrent(operation: number): boolean {
    return operation === this.operation && this.active && !this.destroyed;
  }

  private markReadyAfterRender(): void {
    // A deterministic test stub may invoke the verification callback inside render().
    // Do not overwrite that terminal state with ready.
    if (this.currentState === 'loading') this.setState('ready');
  }

  private removeWidget(emitToken: boolean, setIdle: boolean): void {
    this.operation += 1;

    if (this.api && this.widgetId) {
      try {
        this.api.remove(this.widgetId);
      } catch {
        // The provider may already have discarded an expired or failed widget.
      }
    }

    this.api = null;
    this.widgetId = null;
    if (emitToken) this.tokenChange.emit('');
    if (setIdle) this.setState('idle');
  }

  private setState(state: TurnstileChallengeState): void {
    if (this.currentState === state) return;
    this.currentState = state;
    this.stateChange.emit(state);
    this.changeDetector.markForCheck();
  }
}
