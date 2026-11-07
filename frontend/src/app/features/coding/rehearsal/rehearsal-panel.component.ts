import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RehearsalDefinition, RehearsalPhase, RehearsalSession, RehearsalShortAnswer } from '../../../core/models/rehearsal.model';
import { FaButtonComponent } from '../../../shared/ui/button/fa-button.component';
import { FaFieldComponent } from '../../../shared/ui/field/fa-field.component';
import { InlineCodeComponent } from '../../../shared/ui/inline-code/inline-code.component';

export type RehearsalRow = {
  readonly path: string;
  readonly title: string;
  readonly current: boolean;
  /** A later task of a sequential rehearsal stays hidden until the person moves on. */
  readonly visible: boolean;
  readonly result: string;
  readonly status: 'passed' | 'partial' | 'not-run' | 'not-opened';
};

/** The short-answer question on screen. */
export type RehearsalQuestion = {
  readonly index: number;
  readonly total: number;
  readonly entry: RehearsalShortAnswer;
  readonly answer: string;
};

const MINUTE = 60_000;

/** Formats milliseconds as 7:05 or 1:25:00. */
export function formatRehearsalClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (value: number) => String(value).padStart(2, '0');
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
}

/** "Meta coding round: 2 problems in 40 minutes", naming the short answers first when the rehearsal opens with them. */
export function rehearsalHeading(definition: RehearsalDefinition): string {
  const problems = `${definition.items.length} problems`;
  const questions = definition.shortAnswers?.questions.length;
  return `${definition.title}: ${questions ? `${questions} short answers and ${problems}` : problems} in ${definition.minutes} minutes`;
}

/** The clock and the task list of a running rehearsal, then its review. */
@Component({
  selector: 'app-rehearsal-panel',
  imports: [RouterLink, FaButtonComponent, FaFieldComponent, InlineCodeComponent],
  templateUrl: './rehearsal-panel.component.html',
  styleUrls: ['./rehearsal-panel.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RehearsalPanelComponent {
  @Input({ required: true }) session!: RehearsalSession;
  @Input({ required: true }) phase!: RehearsalPhase;
  @Input() remainingMs = 0;
  @Input({ required: true }) questionId!: string;
  @Output() readonly endRehearsal = new EventEmitter<void>();
  @Output() readonly closeReview = new EventEmitter<void>();
  @Output() readonly answer = new EventEmitter<string>();
  @Output() readonly nextQuestion = new EventEmitter<void>();
  @Output() readonly skipToProblems = new EventEmitter<void>();
  @ViewChild('answerBox') private answerBox?: ElementRef<HTMLTextAreaElement>;

  clock(): string {
    return formatRehearsalClock(this.remainingMs);
  }

  /** The short-answer question on screen; null once the problems are open. */
  question(): RehearsalQuestion | null {
    const questions = this.session.definition.shortAnswers?.questions ?? [];
    const index = this.session.answering;
    if (this.phase !== 'active' || index >= questions.length) return null;
    return { index, total: questions.length, entry: questions[index], answer: this.session.answers[index] ?? '' };
  }

  /** How the short answers sit on the clock: the reports' time for them, then a nudge once it has passed. */
  questionNote(): string {
    const { minutes, shortAnswers } = this.session.definition;
    const budget = shortAnswers?.minutes ?? 0;
    return minutes * MINUTE - this.remainingMs >= budget * MINUTE
      ? `About ${budget} minutes have passed, which is when the reported screen moves on to coding.`
      : `The reports give these questions about ${budget} minutes. The clock keeps running for the whole screen.`;
  }

  onAnswer(event: Event): void {
    this.answer.emit((event.target as HTMLTextAreaElement).value);
  }

  onNextQuestion(current: RehearsalQuestion): void {
    this.nextQuestion.emit();
    // The next question takes the same box, so typing carries on there.
    if (current.index + 1 < current.total) this.answerBox?.nativeElement.focus();
  }

  rows(): RehearsalRow[] {
    const { definition, reached, results } = this.session;
    const answering = this.question() !== null;
    return definition.items.map((item, index) => {
      const result = results[item.questionId];
      const opened = !answering && (index <= reached || item.questionId === this.questionId);
      const status: RehearsalRow['status'] = result
        ? result.passed === result.total ? 'passed' : 'partial'
        : opened ? 'not-run' : 'not-opened';
      return {
        path: item.path,
        title: item.title,
        current: item.questionId === this.questionId,
        visible: !answering && (definition.order === 'free' || opened || this.phase === 'review'),
        status,
        result: result
          ? result.passed === result.total
            ? `All ${result.total} tests pass`
            : `${result.passed} of ${result.total} tests pass`
          : this.phase === 'review' ? (opened ? 'Not run' : 'Not opened') : opened ? 'Not run yet' : '',
      };
    });
  }

  /** What a hidden problem waits for: the short answers, or the person moving on. */
  hiddenNote(): string {
    return this.question() ? 'Opens after the short answers' : 'Opens when you move on';
  }

  next(): RehearsalRow | null {
    const rows = this.rows();
    const index = rows.findIndex((row) => row.current);
    return index >= 0 && index < rows.length - 1 ? rows[index + 1] : null;
  }

  /** Each short-answer question beside the person's answer, for the review. */
  answerReview(): Array<RehearsalShortAnswer & { readonly given: string }> {
    return (this.session.definition.shortAnswers?.questions ?? []).map((entry, index) => ({
      ...entry,
      given: (this.session.answers[index] ?? '').trim(),
    }));
  }

  /** "Time is up." or "Ended after 27 min.", then how many tasks pass every test and how many questions have an answer. */
  verdict(): string {
    const { definition, endReason, endedAt, startedAt, results } = this.session;
    const passed = definition.items.filter((item) => {
      const result = results[item.questionId];
      return !!result && result.passed === result.total;
    }).length;
    const ending = endReason === 'ended' && endedAt !== null
      ? `Ended after ${Math.max(1, Math.round((endedAt - startedAt) / 60_000))} min.`
      : 'Time is up.';
    const review = this.answerReview();
    const answered = review.length
      ? ` You answered ${review.filter((entry) => entry.given).length} of ${review.length} short questions.`
      : '';
    return `${ending} ${passed} of ${definition.items.length} problems pass every test.${answered}`;
  }
}
