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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  InterviewAvailability,
  InterviewFormat,
  InterviewLevel,
  InterviewSystemDesignPracticeSignal,
  InterviewTrack,
} from '../../core/models/interview.model';
import {
  resolveSystemDesignPractice,
  SystemDesignListItem,
} from '../../core/models/system-design.model';
import { InterviewService } from '../../core/services/interview.service';
import { InterviewAvailabilityStore } from '../../core/services/interview-availability.store';
import { QuestionService } from '../../core/services/question.service';
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
  private readonly availabilityStore = inject(InterviewAvailabilityStore);
  private readonly questions = inject(QuestionService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly availability = signal<InterviewAvailability | null>(null);
  readonly loading = signal(true);
  readonly starting = signal(false);
  readonly error = signal<string | null>(null);
  readonly abandonedNotice = signal(false);
  readonly viewportWidth = signal(this.isBrowser ? window.innerWidth : 1366);
  readonly selectedLevel = signal<InterviewLevel>('mid');
  readonly selectedTrack = signal<InterviewTrack>('core-web');
  readonly selectedFormat = signal<InterviewFormat>('coding');
  readonly targetedQuestion = signal<SystemDesignListItem | null>(null);
  readonly targetResolution = signal<'none' | 'loading' | 'ready' | 'error'>('none');
  readonly targetResolutionError = signal<string | null>(null);
  readonly levelLocked = computed(() => this.targetResolution() !== 'none');
  readonly targetedSetupBlocked = computed(() =>
    this.targetResolution() === 'loading' || this.targetResolution() === 'error'
  );
  private createIdempotencyKey: string | null = null;
  private requestedSourceContentId: string | null = null;
  private targetRequestEpoch = 0;

  readonly viewportBlocked = computed(() => {
    const minimum = this.availability()?.minViewportWidth ?? 768;
    return this.viewportWidth() < minimum;
  });
  readonly selectedQuota = computed(() => {
    const availability = this.availability();
    if (!availability) return null;
    return this.selectedFormat() === 'coding'
      ? availability.quota ?? availability.quotas.coding
      : availability.quotas['system-design'];
  });
  readonly quotaExhausted = computed(() => {
    const quota = this.selectedQuota();
    return !!quota && !quota.unlimited && quota.remaining === 0;
  });
  readonly formatUnavailable = computed(() => {
    const availability = this.availability();
    const entry = availability?.formatAvailability.find(
      (candidate) => candidate.format === this.selectedFormat(),
    );
    return entry ? !entry.enabled : this.selectedFormat() !== 'coding';
  });
  readonly targetUnavailable = computed(() => {
    const availability = this.availability();
    if (!availability?.targets.length) return false;
    const matchingTargets = availability.targets.filter(
      (target) => target.format === this.selectedFormat(),
    );
    if (!matchingTargets.length) return false;
    return !matchingTargets.some((target) =>
      target.level === this.selectedLevel()
      && target.track === this.selectedTrack()
      && target.available
    );
  });
  readonly canStart = computed(() => {
    const availability = this.availability();
    return !!availability
      && availability.enabled
      && availability.canCreate !== false
      && !this.loading()
      && !availability.activeSession
      && !this.formatUnavailable()
      && !this.quotaExhausted()
      && !this.targetUnavailable()
      && !this.viewportBlocked()
      && !this.targetedSetupBlocked()
      && !this.starting();
  });

  private readonly onResize = () => this.viewportWidth.set(window.innerWidth);
  private availabilityRequestEpoch = 0;

  ngOnInit(): void {
    if (this.isBrowser) window.addEventListener('resize', this.onResize, { passive: true });
    this.applyQueryDefaults();
    this.loadTargetedQuestion();
    this.load(false);
  }

  ngOnDestroy(): void {
    this.availabilityRequestEpoch += 1;
    this.targetRequestEpoch += 1;
    if (this.isBrowser) window.removeEventListener('resize', this.onResize);
  }

  load(force = true): void {
    const requestEpoch = ++this.availabilityRequestEpoch;
    this.loading.set(true);
    this.error.set(null);
    this.availabilityStore.resolve({ force }).subscribe({
      next: (availability) => {
        if (requestEpoch !== this.availabilityRequestEpoch) return;
        this.availability.set(availability);
        this.applyAvailableDefaults(availability);
        this.loading.set(false);
      },
      error: () => {
        if (requestEpoch !== this.availabilityRequestEpoch) return;
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
        ...(this.selectedFormat() === 'system-design'
          ? {
            format: 'system-design' as const,
            ...(this.targetedQuestion()
              ? { systemDesignSourceContentId: this.targetedQuestion()!.id }
              : {}),
          }
          : {}),
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
          this.availabilityStore.invalidate();
          this.load(true);
          return;
        }
        this.error.set(this.createErrorMessage(error));
      },
    });
  }

  resume(sessionId: string): void {
    void this.router.navigate(['/interview', sessionId]);
  }

  onLevelChange(value: unknown): void {
    if (this.levelLocked()) return;
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

  onFormatChange(value: unknown): void {
    if (value !== 'coding' && value !== 'system-design') return;
    if (this.requestedSourceContentId && value !== 'system-design') {
      this.clearTargetedCase();
    }
    this.selectedFormat.set(value);
    this.createIdempotencyKey = null;
    this.applyAvailableTargetDefault();
  }

  codingMinutes(): number {
    return this.selectedLevel() === 'junior' ? 25 : this.selectedLevel() === 'senior' ? 45 : 35;
  }

  mcqDurationLabel(): string {
    const timing = this.availability()?.timing;
    const seconds = timing?.mcqSecondsByLevel?.[this.selectedLevel()]
      ?? timing?.mcqSeconds
      ?? 600;
    if (seconds % 60 === 0) return `${seconds / 60} minutes`;
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  }

  questionMix(): string {
    return this.selectedTrack() === 'core-web'
      ? '3 JavaScript/browser + 1 HTML/accessibility + 1 CSS/layout'
      : `1 JavaScript/browser + 1 HTML/accessibility + 1 CSS/layout + 2 ${this.selectedTrack()} questions`;
  }

  systemDesignMinutes(): number {
    const seconds = this.availability()?.timing.systemDesignSeconds[this.selectedLevel()]
      ?? (this.selectedLevel() === 'junior' ? 600 : this.selectedLevel() === 'senior' ? 1200 : 900);
    return Math.max(1, Math.round(seconds / 60));
  }

  formatDescription(format: InterviewFormat): string {
    return format === 'coding'
      ? 'Five MCQs followed by one coding task.'
      : 'A guided architecture case with a production twist.';
  }

  formatEnabled(format: InterviewFormat): boolean {
    return this.availability()?.formatAvailability.some(
      (entry) => entry.format === format && entry.enabled,
    ) ?? format === 'coding';
  }

  practiceSignalLabel(signal: InterviewSystemDesignPracticeSignal): string {
    switch (signal) {
      case 'strong-system-design-session': return 'Strong System Design Session';
      case 'on-track': return 'On Track';
      case 'needs-focus': return 'Needs Focus';
      default: return 'Not enough evidence';
    }
  }

  chooseAnotherCase(): void {
    this.clearTargetedCase();
  }

  targetedLevelLabel(): string {
    const level = this.targetedQuestion()
      ? resolveSystemDesignPractice(this.targetedQuestion()!).targetLevel
      : this.selectedLevel();
    return level === 'mid' ? 'Mid-level' : `${level.charAt(0).toUpperCase()}${level.slice(1)}`;
  }

  private applyQueryDefaults(): void {
    const format = this.route.snapshot.queryParamMap.get('format');
    const level = this.route.snapshot.queryParamMap.get('level');
    this.abandonedNotice.set(
      this.route.snapshot.queryParamMap.get('ended') === 'abandoned',
    );
    if (format === 'coding' || format === 'system-design') this.selectedFormat.set(format);
    if (level === 'junior' || level === 'mid' || level === 'senior') this.selectedLevel.set(level);
  }

  private loadTargetedQuestion(): void {
    const sourceQuestionId = String(
      this.route.snapshot.queryParamMap.get('sourceQuestionId') || '',
    ).trim();
    if (!sourceQuestionId) return;

    const requestEpoch = ++this.targetRequestEpoch;
    this.requestedSourceContentId = sourceQuestionId;
    this.targetedQuestion.set(null);
    this.targetResolution.set('loading');
    this.targetResolutionError.set(null);
    this.selectedFormat.set('system-design');
    this.createIdempotencyKey = null;

    this.questions.loadSystemDesign({ transferState: false }).subscribe({
      next: (questions) => {
        if (
          requestEpoch !== this.targetRequestEpoch
          || this.requestedSourceContentId !== sourceQuestionId
        ) return;
        const targeted = questions.find((question) => question.id === sourceQuestionId) ?? null;
        if (!targeted) {
          this.failTargetResolution('This guided case could not be found. Choose another case.');
          return;
        }
        const practice = resolveSystemDesignPractice(targeted);
        if (!practice.guidedMock) {
          this.failTargetResolution('This question is not available as a guided mock. Choose another case.');
          return;
        }

        this.targetedQuestion.set(targeted);
        this.targetResolution.set('ready');
        this.selectedFormat.set('system-design');
        this.selectedLevel.set(practice.targetLevel);
        this.createIdempotencyKey = null;
        const availability = this.availability();
        if (availability) this.applyAvailableTargetDefault();
      },
      error: () => {
        if (
          requestEpoch !== this.targetRequestEpoch
          || this.requestedSourceContentId !== sourceQuestionId
        ) return;
        this.failTargetResolution(
          'The selected guided case could not be validated. Try again or choose another case.',
        );
      },
    });
  }

  private clearTargetedCase(updateUrl = true): void {
    if (!this.requestedSourceContentId && !this.targetedQuestion()) return;
    this.targetRequestEpoch += 1;
    this.requestedSourceContentId = null;
    this.targetedQuestion.set(null);
    this.targetResolution.set('none');
    this.targetResolutionError.set(null);
    this.createIdempotencyKey = null;
    if (!updateUrl) return;
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        sourceQuestionId: null,
        src: null,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private failTargetResolution(message: string): void {
    this.targetedQuestion.set(null);
    this.targetResolution.set('error');
    this.targetResolutionError.set(message);
    this.createIdempotencyKey = null;
  }

  private createErrorMessage(error: unknown): string {
    const response = error && typeof error === 'object'
      ? error as { error?: { code?: unknown } }
      : null;
    const code = String(response?.error?.code || '');
    if (code === 'INTERVIEW_SYSTEM_DESIGN_SOURCE_INVALID') {
      return 'This guided case could not be found. Choose another system design case.';
    }
    if (code === 'INTERVIEW_SYSTEM_DESIGN_SOURCE_LEVEL_MISMATCH') {
      return 'This case is not available at the selected level. Choose another case.';
    }
    if (code === 'INTERVIEW_SYSTEM_DESIGN_SOURCE_UNAVAILABLE') {
      return 'This guided case is temporarily unavailable. Choose another case.';
    }
    return 'The interview could not be started. Please try again.';
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
    const selectedFormatAvailable = availability.formatAvailability.some(
      (entry) => entry.format === this.selectedFormat() && entry.enabled,
    );
    if (!selectedFormatAvailable) {
      const firstFormat = availability.formats.find((choice) =>
        !choice.disabled
        && availability.formatAvailability.some(
          (entry) => entry.format === choice.value && entry.enabled,
        )
      );
      if (firstFormat) this.selectedFormat.set(firstFormat.value);
    }
    const targeted = this.targetedQuestion();
    if (targeted) {
      this.selectedFormat.set('system-design');
      this.selectedLevel.set(resolveSystemDesignPractice(targeted).targetLevel);
    }
    this.applyAvailableTargetDefault();
  }

  private applyAvailableTargetDefault(): void {
    const availability = this.availability();
    if (this.targetedQuestion()) return;
    if (!availability?.targets.length || !this.targetUnavailable()) return;
    const firstTarget = availability.targets.find((target) =>
      target.format === this.selectedFormat()
      && target.available
      && availability.levels.some((choice) => choice.value === target.level && !choice.disabled)
      && availability.tracks.some((choice) => choice.value === target.track && !choice.disabled)
    );
    if (firstTarget) {
      this.selectedLevel.set(firstTarget.level);
      this.selectedTrack.set(firstTarget.track);
    }
  }

  private newIdempotencyKey(): string {
    if (this.isBrowser && typeof crypto?.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return `interview-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}
