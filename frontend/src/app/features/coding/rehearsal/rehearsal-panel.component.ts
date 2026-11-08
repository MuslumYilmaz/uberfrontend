import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  RehearsalDefinition,
  RehearsalPhase,
  RehearsalQuestion,
  RehearsalSession,
  rehearsalAnswerRight,
  rehearsalPicked,
} from '../../../core/models/rehearsal.model';
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

/** The question on screen, with the options its answer picked. */
export type RehearsalQuestionOnScreen = {
  readonly index: number;
  readonly total: number;
  readonly entry: RehearsalQuestion;
  readonly answer: string;
  readonly picked: readonly number[];
};

/** A question in the review: the person's answer beside a sample one, or beside the right options. */
export type RehearsalAnswerReview = RehearsalQuestion & {
  readonly given: string;
  /** For a multiple-choice question: the picked options, the right ones, and whether they match. */
  readonly pickedText?: string;
  readonly correctText?: string;
  readonly right?: boolean;
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

const count = (value: number, one: string, many: string) => `${value} ${value === 1 ? one : many}`;

/** "2 problems in 40 minutes", naming the questions first when the rehearsal opens with them. */
function rehearsalShape(definition: RehearsalDefinition): string {
  const questions = definition.quiz?.questions ?? [];
  const short = questions.filter((question) => !question.choices).length;
  const choice = questions.length - short;
  const parts = [
    ...(short ? [count(short, 'short answer', 'short answers')] : []),
    ...(choice ? [count(choice, 'multiple-choice question', 'multiple-choice questions')] : []),
    count(definition.items.length, 'problem', 'problems'),
  ];
  return `${parts.slice(0, -1).join(', ')}${parts.length > 1 ? ' and ' : ''}${parts.at(-1)} in ${definition.minutes} minutes`;
}

/** "Meta coding round: 2 problems in 40 minutes". */
export function rehearsalHeading(definition: RehearsalDefinition): string {
  return `${definition.title}: ${rehearsalShape(definition)}`;
}

/**
 * A phone shows no rehearsal card, since a rehearsal runs on a desktop or tablet: one sentence names the rehearsals
 * this problem belongs to, so nobody takes it for a plain warm-up.
 */
export function rehearsalPhoneNote(offers: readonly RehearsalDefinition[]): string | null {
  if (!offers.length) return null;
  if (offers.length === 1) {
    return `This problem is also part of the ${offers[0].title} rehearsal (Premium): ${rehearsalShape(offers[0])}, on a desktop or tablet.`;
  }
  const titles = offers.map((offer) => `the ${offer.title}`);
  return `This problem is also part of ${offers.length} timed rehearsals (Premium), each on a desktop or tablet: ${titles.slice(0, -1).join(', ')} and ${titles.at(-1)}.`;
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
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  clock(): string {
    return formatRehearsalClock(this.remainingMs);
  }

  /** The question on screen; null once the problems are open. */
  question(): RehearsalQuestionOnScreen | null {
    const questions = this.session.definition.quiz?.questions ?? [];
    const index = this.session.answering;
    if (this.phase !== 'active' || index >= questions.length) return null;
    const answer = this.session.answers[index] ?? '';
    return { index, total: questions.length, entry: questions[index], answer, picked: questions[index].choices ? rehearsalPicked(answer) : [] };
  }

  /** How the questions sit on the clock: the reports' time for them when they give one, then a nudge once it has passed. */
  questionNote(): string {
    const { minutes, quiz } = this.session.definition;
    if (!quiz?.minutes) return 'The clock keeps running for the whole rehearsal.';
    return minutes * MINUTE - this.remainingMs >= quiz.minutes * MINUTE
      ? `About ${quiz.minutes} minutes have passed, which is when the reported round moves on to the problems.`
      : `The reports give these questions about ${quiz.minutes} minutes. The clock keeps running for the whole rehearsal.`;
  }

  onAnswer(event: Event): void {
    this.answer.emit((event.target as HTMLTextAreaElement).value);
  }

  /** One option replaces the pick; for every right option, each box adds or removes its own. */
  onChoice(current: RehearsalQuestionOnScreen, index: number, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const picked = current.entry.pick === 'all'
      ? [...current.picked.filter((entry) => entry !== index), ...(checked ? [index] : [])]
      : [index];
    this.answer.emit([...picked].sort((a, b) => a - b).join(','));
  }

  onNextQuestion(current: RehearsalQuestionOnScreen): void {
    this.nextQuestion.emit();
    // Typing or picking carries on in the next question, once it is on screen.
    if (current.index + 1 < current.total) {
      setTimeout(() => this.host.nativeElement.querySelector<HTMLElement>('[data-testid="rehearsal-answer"], [data-testid="rehearsal-choice"]')?.focus());
    }
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

  /** What a hidden problem waits for: the questions, or the person moving on. */
  hiddenNote(): string {
    return this.question() ? 'Opens after the questions' : 'Opens when you move on';
  }

  next(): RehearsalRow | null {
    const rows = this.rows();
    const index = rows.findIndex((row) => row.current);
    return index >= 0 && index < rows.length - 1 ? rows[index + 1] : null;
  }

  /** Each question beside the person's answer, for the review. */
  answerReview(): RehearsalAnswerReview[] {
    return (this.session.definition.quiz?.questions ?? []).map((entry, index) => {
      const given = (this.session.answers[index] ?? '').trim();
      if (!entry.choices) return { ...entry, given };
      const options = entry.choices;
      const text = (indexes: readonly number[]) => indexes.map((at) => options[at]).filter(Boolean).join('; ');
      return {
        ...entry,
        given,
        pickedText: text(rehearsalPicked(given)),
        correctText: text([...(entry.correct ?? [])].sort((a, b) => a - b)),
        right: rehearsalAnswerRight(entry, given),
      };
    });
  }

  /**
   * "Time is up." or "Ended after 27 min.", then how many tasks pass every test, how many short questions have an
   * answer and how many multiple-choice questions are right.
   */
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
    const short = review.filter((entry) => !entry.choices);
    const choice = review.filter((entry) => !!entry.choices);
    const answered = short.length ? ` You answered ${short.filter((entry) => entry.given).length} of ${short.length} short questions.` : '';
    const right = choice.length ? ` You got ${choice.filter((entry) => entry.right).length} of ${choice.length} multiple-choice questions right.` : '';
    return `${ending} ${passed} of ${definition.items.length} problems pass every test.${answered}${right}`;
  }
}
