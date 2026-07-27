import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  InterviewAvailability,
  InterviewLevel,
  InterviewTrack,
} from '../../core/models/interview.model';
import { InterviewService } from '../../core/services/interview.service';
import {
  FaButtonComponent,
  FaCardComponent,
  FaFieldComponent,
  FaSelectComponent,
} from '../../shared/ui';

@Component({
  selector: 'app-interview-setup',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    FaButtonComponent,
    FaCardComponent,
    FaFieldComponent,
    FaSelectComponent,
  ],
  templateUrl: './interview-setup.component.html',
  styleUrls: ['./interview-setup.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InterviewSetupComponent implements OnInit, OnDestroy {
  private readonly interviews = inject(InterviewService);
  private readonly router = inject(Router);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly availability = signal<InterviewAvailability | null>(null);
  readonly loading = signal(true);
  readonly starting = signal(false);
  readonly error = signal<string | null>(null);
  readonly viewportWidth = signal(this.isBrowser ? window.innerWidth : 1366);
  readonly selectedLevel = signal<InterviewLevel>('mid');
  readonly selectedTrack = signal<InterviewTrack>('core-web');
  private createIdempotencyKey: string | null = null;

  readonly viewportBlocked = computed(() => {
    const minimum = this.availability()?.minViewportWidth ?? 768;
    return this.viewportWidth() < minimum;
  });
  readonly quotaExhausted = computed(() => {
    const quota = this.availability()?.quota;
    return !!quota && !quota.unlimited && quota.remaining === 0;
  });
  readonly targetUnavailable = computed(() => {
    const availability = this.availability();
    if (!availability?.targets.length) return false;
    return !availability.targets.some((target) =>
      target.level === this.selectedLevel()
      && target.track === this.selectedTrack()
      && target.available
    );
  });
  readonly canStart = computed(() => {
    const availability = this.availability();
    return !!availability
      && availability.enabled
      && !availability.activeSession
      && !this.quotaExhausted()
      && !this.targetUnavailable()
      && !this.viewportBlocked()
      && !this.starting();
  });

  private readonly onResize = () => this.viewportWidth.set(window.innerWidth);

  ngOnInit(): void {
    if (this.isBrowser) window.addEventListener('resize', this.onResize, { passive: true });
    this.load();
  }

  ngOnDestroy(): void {
    if (this.isBrowser) window.removeEventListener('resize', this.onResize);
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.interviews.getAvailability().subscribe({
      next: (availability) => {
        this.availability.set(availability);
        this.applyAvailableDefaults(availability);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Interview setup could not be loaded. Please try again.');
      },
    });
  }

  start(): void {
    if (!this.canStart()) return;
    this.starting.set(true);
    this.error.set(null);
    this.createIdempotencyKey ??= this.newIdempotencyKey();
    this.interviews.createSession(
      {
        level: this.selectedLevel(),
        track: this.selectedTrack(),
        viewportWidth: Math.floor(this.viewportWidth()),
      },
      this.createIdempotencyKey,
    ).subscribe({
      next: (session) => {
        this.createIdempotencyKey = null;
        void this.router.navigate(['/interview', session.id]);
      },
      error: (error) => {
        this.starting.set(false);
        if (error?.status === 409 || error?.status === 429) {
          this.createIdempotencyKey = null;
          this.load();
          return;
        }
        this.error.set('The interview could not be started. Please try again.');
      },
    });
  }

  resume(sessionId: string): void {
    void this.router.navigate(['/interview', sessionId]);
  }

  onLevelChange(value: unknown): void {
    if (value === 'junior' || value === 'mid' || value === 'senior') {
      this.selectedLevel.set(value);
      this.createIdempotencyKey = null;
    }
  }

  onTrackChange(value: unknown): void {
    if (value === 'core-web' || value === 'react' || value === 'angular' || value === 'vue') {
      this.selectedTrack.set(value);
      this.createIdempotencyKey = null;
    }
  }

  codingMinutes(): number {
    return this.selectedLevel() === 'junior' ? 25 : this.selectedLevel() === 'senior' ? 45 : 35;
  }

  mcqDurationLabel(): string {
    const seconds = this.availability()?.timing.mcqSeconds ?? 600;
    if (seconds % 60 === 0) return `${seconds / 60} minutes`;
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  }

  questionMix(): string {
    return this.selectedTrack() === 'core-web'
      ? '3 JavaScript/browser + 1 HTML/accessibility + 1 CSS/layout'
      : `1 JavaScript/browser + 1 HTML/accessibility + 1 CSS/layout + 2 ${this.selectedTrack()} questions`;
  }

  private applyAvailableDefaults(availability: InterviewAvailability): void {
    const firstLevel = availability.levels.find((choice) => !choice.disabled);
    const firstTrack = availability.tracks.find((choice) => !choice.disabled);
    if (!availability.levels.some((choice) => choice.value === this.selectedLevel() && !choice.disabled) && firstLevel) {
      this.selectedLevel.set(firstLevel.value);
    }
    if (!availability.tracks.some((choice) => choice.value === this.selectedTrack() && !choice.disabled) && firstTrack) {
      this.selectedTrack.set(firstTrack.value);
    }
    if (availability.targets.length && this.targetUnavailable()) {
      const firstTarget = availability.targets.find((target) =>
        target.available
        && availability.levels.some((choice) => choice.value === target.level && !choice.disabled)
        && availability.tracks.some((choice) => choice.value === target.track && !choice.disabled)
      );
      if (firstTarget) {
        this.selectedLevel.set(firstTarget.level);
        this.selectedTrack.set(firstTarget.track);
      }
    }
  }

  private newIdempotencyKey(): string {
    if (this.isBrowser && typeof crypto?.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return `interview-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}
