import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  PLATFORM_ID,
  SimpleChanges,
  inject,
  signal,
} from '@angular/core';

@Component({
  selector: 'app-interview-deadline-timer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="timer"
      [class.timer--warning]="remainingSeconds() <= 300 && remainingSeconds() > 60"
      [class.timer--urgent]="remainingSeconds() <= 60"
      [attr.aria-label]="label + ': ' + remainingLabel()"
      data-testid="interview-timer">
      <span class="timer__label">{{ label }}</span>
      <strong class="timer__value">{{ remainingLabel() }}</strong>
    </div>
    <span class="sr-only" aria-live="polite" aria-atomic="true">{{ announcement() }}</span>
  `,
  styles: [`
    :host { display: inline-block; }
    .timer {
      display: inline-flex;
      align-items: baseline;
      gap: var(--uf-space-2);
      padding: 8px 12px;
      border: 1px solid var(--uf-border-subtle);
      border-radius: var(--uf-radius-pill);
      background: var(--uf-surface-alt);
      color: var(--uf-text-primary);
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }
    .timer--warning {
      border-color: var(--uf-status-warn-border);
      background: var(--uf-status-warn-bg);
    }
    .timer--urgent {
      border-color: var(--uf-status-danger-border);
      background: var(--uf-status-danger-bg);
      color: var(--uf-status-danger-text);
    }
    .timer__label {
      color: var(--uf-text-secondary);
      font-size: var(--uf-meta-size);
    }
    .timer__value { font-size: var(--uf-subsection-title-size); }
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InterviewDeadlineTimerComponent implements OnChanges, OnDestroy {
  @Input() deadlineAt: string | null = null;
  @Input() serverNow: string | null = null;
  @Input() label = 'Time remaining';
  @Output() readonly expired = new EventEmitter<void>();

  readonly remainingSeconds = signal(0);
  readonly announcement = signal('');

  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private serverOffsetMs = 0;
  private ticker: ReturnType<typeof setInterval> | null = null;
  private emittedExpiry = false;
  private readonly announcedThresholds = new Set<number>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['serverNow']) {
      const parsedServerNow = Date.parse(this.serverNow || '');
      this.serverOffsetMs = Number.isFinite(parsedServerNow)
        ? parsedServerNow - Date.now()
        : 0;
    }
    if (changes['deadlineAt']) {
      this.emittedExpiry = false;
      this.announcedThresholds.clear();
    }
    this.restart();
  }

  ngOnDestroy(): void {
    this.stop();
  }

  remainingLabel(): string {
    const total = Math.max(0, this.remainingSeconds());
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    return hours > 0
      ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      : `${minutes}:${String(seconds).padStart(2, '0')}`;
  }

  private restart(): void {
    this.stop();
    this.tick();
    if (this.isBrowser && this.deadlineTimestamp() !== null && !this.emittedExpiry) {
      this.ticker = setInterval(() => this.tick(), 1000);
    }
  }

  private stop(): void {
    if (this.ticker !== null) {
      clearInterval(this.ticker);
      this.ticker = null;
    }
  }

  private tick(): void {
    const deadline = this.deadlineTimestamp();
    if (deadline === null) {
      this.remainingSeconds.set(0);
      return;
    }
    const serverAlignedNow = Date.now() + this.serverOffsetMs;
    const remaining = Math.max(0, Math.ceil((deadline - serverAlignedNow) / 1000));
    const previous = this.remainingSeconds();
    this.remainingSeconds.set(remaining);
    this.maybeAnnounce(previous, remaining);
    if (remaining === 0 && !this.emittedExpiry) {
      this.emittedExpiry = true;
      this.announcement.set(`${this.label} has ended.`);
      this.stop();
      this.expired.emit();
    }
  }

  private maybeAnnounce(previous: number, current: number): void {
    const thresholds = [300, 60, 10];
    for (const threshold of thresholds) {
      if (
        current > 0
        && current <= threshold
        && (previous > threshold || (previous === 0 && current === threshold))
        && !this.announcedThresholds.has(threshold)
      ) {
        this.announcedThresholds.add(threshold);
        this.announcement.set(
          threshold >= 60
            ? `${Math.floor(threshold / 60)} ${threshold === 60 ? 'minute' : 'minutes'} remaining.`
            : `${threshold} seconds remaining.`,
        );
        return;
      }
    }
  }

  private deadlineTimestamp(): number | null {
    const parsed = Date.parse(this.deadlineAt || '');
    return Number.isFinite(parsed) ? parsed : null;
  }
}
