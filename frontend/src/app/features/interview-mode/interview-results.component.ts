import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  InterviewCodingResult,
  InterviewResult,
  InterviewSystemDesignAxisStatus,
  InterviewSystemDesignPracticeSignal,
} from '../../core/models/interview.model';
import { InterviewService } from '../../core/services/interview.service';
import { InterviewRecoveryStore } from '../../core/services/interview-recovery.store';
import { interviewDisplayLabel } from './interview-display-label';
import { FaButtonComponent, FaCardComponent, InlineCodeComponent } from '../../shared/ui';

@Component({
    selector: 'app-interview-results',
    imports: [CommonModule, RouterLink, FaButtonComponent, FaCardComponent, InlineCodeComponent],
    templateUrl: './interview-results.component.html',
    styleUrls: ['./interview-results.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class InterviewResultsComponent implements OnInit {
  private readonly interviews = inject(InterviewService);
  private readonly route = inject(ActivatedRoute);
  private readonly recovery = inject(InterviewRecoveryStore);

  readonly result = signal<InterviewResult | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly voided = signal(false);
  readonly abandoned = signal(false);
  readonly interviewStillActive = signal(false);
  sessionId = '';
  readonly displayLabel = interviewDisplayLabel;

  ngOnInit(): void {
    this.sessionId = this.route.snapshot.paramMap.get('id')?.trim() || '';
    if (!this.sessionId) {
      this.loading.set(false);
      this.error.set('This result link is invalid.');
      return;
    }
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.voided.set(false);
    this.abandoned.set(false);
    this.interviewStillActive.set(false);
    this.interviews.getResult(this.sessionId).subscribe({
      next: (result) => {
        this.result.set(result);
        this.loading.set(false);
        this.clearTerminalLocalState();
      },
      error: (error) => {
        this.loading.set(false);
        const code = String(error?.error?.code || error?.error?.error?.code || '');
        if (code === 'INTERVIEW_SESSION_VOIDED') {
          this.voided.set(true);
          this.error.set('This interview was voided after a technical issue, so no answer report was created.');
          this.clearTerminalLocalState();
          return;
        }
        if (code === 'INTERVIEW_SESSION_ABANDONED') {
          this.abandoned.set(true);
          this.error.set(
            'This interview was ended before completion. Answer review is withheld to prevent extraction of the question bank.',
          );
          this.clearTerminalLocalState();
          return;
        }
        if (code === 'INTERVIEW_RESULTS_NOT_READY') {
          this.interviewStillActive.set(true);
          this.error.set('This interview is still active. Resume it before opening the report.');
          return;
        }
        this.error.set(error?.status === 409 || error?.status === 425
          ? 'This interview is still being finalized. Try again in a moment.'
          : 'The interview report could not be loaded.');
      },
    });
  }

  optionLabel(
    result: InterviewResult['questions'][number],
    optionId: string | null,
  ): string {
    if (!optionId) return 'No answer';
    return result.options.find((option) => option.id === optionId)?.label ?? 'Answer unavailable';
  }

  formatDuration(seconds: number | null): string {
    if (seconds === null) return 'Not available';
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    return `${minutes}m ${remainder}s`;
  }

  formatTiming(timing: { usedSeconds: number | null; allowedSeconds: number | null }): string {
    const used = this.formatDuration(timing.usedSeconds);
    return timing.allowedSeconds === null
      ? used
      : `${used} of ${this.formatDuration(timing.allowedSeconds)}`;
  }

  formatClock(seconds: number | null): string {
    if (seconds === null) return 'Not available';
    const total = Math.max(0, Math.floor(seconds));
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  }

  timingAccessibleLabel(timing: { usedSeconds: number | null; allowedSeconds: number | null }): string {
    const duration = (seconds: number | null) => {
      if (seconds === null) return 'not available';
      const total = Math.max(0, Math.floor(seconds));
      const minutes = Math.floor(total / 60);
      const remainder = total % 60;
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ${remainder} ${remainder === 1 ? 'second' : 'seconds'}`;
    };
    return `${duration(timing.usedSeconds)} used${timing.allowedSeconds === null ? '' : ` of ${duration(timing.allowedSeconds)} allowed`}`;
  }

  codingEvidenceText(coding: InterviewCodingResult): string {
    if (coding.submitted) {
      return coding.locallyVerified
        ? `${coding.passedChecks}/${coding.totalChecks} browser checks passed for the submitted draft.`
        : 'No matching browser check run was recorded for the submitted draft.';
    }

    if (coding.attempted) {
      return coding.locallyVerified
        ? `${coding.passedChecks}/${coding.totalChecks} browser checks passed for the latest saved draft, which was not submitted.`
        : 'No matching browser check run was recorded for the latest saved draft, which was not submitted.';
    }

    return 'No coding draft or browser check run was recorded.';
  }

  practiceSignalLabel(signal: InterviewSystemDesignPracticeSignal): string {
    switch (signal) {
      case 'strong-system-design-session': return 'Strong System Design Session';
      case 'on-track': return 'On Track';
      case 'needs-focus': return 'Needs Focus';
      default: return 'Not enough evidence';
    }
  }

  axisStatusLabel(status: InterviewSystemDesignAxisStatus): string {
    switch (status) {
      case 'strong-evidence': return 'Strong evidence';
      case 'developing': return 'Developing';
      case 'needs-focus': return 'Needs focus';
      default: return 'Not evaluated';
    }
  }

  designOutcomeLabel(outcome: string): string {
    switch (outcome) {
      case 'submitted': return 'Submitted';
      case 'timed_out': return 'Timed out';
      case 'abandoned': return 'Abandoned';
      default: return 'Completed';
    }
  }

  private clearTerminalLocalState(): void {
    if (!this.sessionId) return;
    this.recovery.clearSession(this.sessionId);
  }
}
