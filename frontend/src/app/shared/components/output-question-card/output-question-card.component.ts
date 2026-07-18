import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  InjectionToken,
  Input,
  Output,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';

import { PrismHighlightDirective } from '../../../core/directives/prism-highlight.directive';
import type {
  OutputChallenge,
  OutputQuestionOption,
  OutputRuntime,
} from '../../../core/models/question.model';
import { FaButtonComponent } from '../../ui/button/fa-button.component';
import { FaCardComponent } from '../../ui/card/fa-card.component';
import {
  OutputQuestionRandomSource,
  shuffleOutputOptions,
} from './output-question-shuffle';

let nextRadioGroupId = 0;

export const OUTPUT_QUESTION_RANDOM = new InjectionToken<OutputQuestionRandomSource>(
  'OUTPUT_QUESTION_RANDOM',
  { providedIn: 'root', factory: () => Math.random },
);

export interface OutputQuestionAnsweredEvent {
  correct: boolean;
  runtime: OutputRuntime;
  optionCount: number;
}

export interface OutputQuestionShownEvent {
  runtime: OutputRuntime;
  optionCount: number;
}

@Component({
  selector: 'app-output-question-card',
  standalone: true,
  imports: [
    CommonModule,
    FaButtonComponent,
    FaCardComponent,
    PrismHighlightDirective,
  ],
  templateUrl: './output-question-card.component.html',
  styleUrls: ['./output-question-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { ngSkipHydration: 'true' },
})
export class OutputQuestionCardComponent {
  private readonly random = inject(OUTPUT_QUESTION_RANDOM);

  readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly challengeState = signal<OutputChallenge | null>(null);
  readonly shuffledOptions = signal<readonly OutputQuestionOption[]>([]);
  readonly selectedOptionId = signal<string | null>(null);
  readonly checked = signal(false);
  readonly outcome = signal<'correct' | 'wrong' | null>(null);
  readonly radioGroupName = `output-question-answer-${++nextRadioGroupId}`;

  readonly correctOption = computed<OutputQuestionOption | null>(() => {
    const challenge = this.challengeState();
    if (!challenge) return null;
    return challenge.options.find((option) => option.id === challenge.correctOptionId) ?? null;
  });

  @Input() set challenge(value: OutputChallenge | null | undefined) {
    const normalized = value ?? null;
    this.challengeState.set(normalized);
    this.resetAttempt(normalized);
  }

  get challenge(): OutputChallenge | null {
    return this.challengeState();
  }

  @Input() showDeepDive = true;

  @Output() shown = new EventEmitter<OutputQuestionShownEvent>();
  @Output() answered = new EventEmitter<OutputQuestionAnsweredEvent>();
  @Output() deepDiveRequested = new EventEmitter<void>();

  selectOption(optionId: string): void {
    if (this.checked()) return;
    this.selectedOptionId.set(optionId);
  }

  checkAnswer(event?: Event): void {
    event?.preventDefault();

    const challenge = this.challengeState();
    const selectedOptionId = this.selectedOptionId();

    if (!challenge || !selectedOptionId || this.checked()) return;

    const correct = selectedOptionId === challenge.correctOptionId;
    this.checked.set(true);
    this.outcome.set(correct ? 'correct' : 'wrong');
    this.answered.emit({
      correct,
      runtime: challenge.runtime,
      optionCount: challenge.options.length,
    });
  }

  requestDeepDive(): void {
    if (!this.checked() || !this.showDeepDive) return;
    this.deepDiveRequested.emit();
  }

  trackOption(_index: number, option: OutputQuestionOption): string {
    return option.id;
  }

  optionIsCorrect(option: OutputQuestionOption): boolean {
    const challenge = this.challengeState();
    return this.checked() && !!challenge && option.id === challenge.correctOptionId;
  }

  optionIsIncorrectSelection(option: OutputQuestionOption): boolean {
    return this.checked()
      && option.id === this.selectedOptionId()
      && !this.optionIsCorrect(option);
  }

  runtimeLabel(runtime: OutputRuntime): string {
    return runtime === 'node' ? 'Node.js' : 'Browser';
  }

  private resetAttempt(challenge: OutputChallenge | null): void {
    this.selectedOptionId.set(null);
    this.checked.set(false);
    this.outcome.set(null);
    this.shuffledOptions.set(
      this.isBrowser && challenge
        ? shuffleOutputOptions(challenge.options, this.random)
        : [],
    );

    if (this.isBrowser && challenge) {
      this.shown.emit({
        runtime: challenge.runtime,
        optionCount: challenge.options.length,
      });
    }
  }
}
