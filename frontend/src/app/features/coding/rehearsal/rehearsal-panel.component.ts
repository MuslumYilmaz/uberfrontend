import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RehearsalPhase, RehearsalSession } from '../../../core/models/rehearsal.model';
import { FaButtonComponent } from '../../../shared/ui/button/fa-button.component';

export type RehearsalRow = {
  readonly path: string;
  readonly title: string;
  readonly current: boolean;
  /** A later task of a sequential rehearsal stays hidden until the person moves on. */
  readonly visible: boolean;
  readonly result: string;
  readonly status: 'passed' | 'partial' | 'not-run' | 'not-opened';
};

/** Formats milliseconds as 7:05 or 1:25:00. */
export function formatRehearsalClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (value: number) => String(value).padStart(2, '0');
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
}

/** The clock and the task list of a running rehearsal, then its review. */
@Component({
  selector: 'app-rehearsal-panel',
  imports: [RouterLink, FaButtonComponent],
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

  clock(): string {
    return formatRehearsalClock(this.remainingMs);
  }

  rows(): RehearsalRow[] {
    const { definition, reached, results } = this.session;
    return definition.items.map((item, index) => {
      const result = results[item.questionId];
      const opened = index <= reached || item.questionId === this.questionId;
      const status: RehearsalRow['status'] = result
        ? result.passed === result.total ? 'passed' : 'partial'
        : opened ? 'not-run' : 'not-opened';
      return {
        path: item.path,
        title: item.title,
        current: item.questionId === this.questionId,
        visible: definition.order === 'free' || opened || this.phase === 'review',
        status,
        result: result
          ? result.passed === result.total
            ? `All ${result.total} tests pass`
            : `${result.passed} of ${result.total} tests pass`
          : this.phase === 'review' ? (opened ? 'Not run' : 'Not opened') : opened ? 'Not run yet' : '',
      };
    });
  }

  next(): RehearsalRow | null {
    const rows = this.rows();
    const index = rows.findIndex((row) => row.current);
    return index >= 0 && index < rows.length - 1 ? rows[index + 1] : null;
  }

  /** "Time is up." or "Ended after 27 min.", then how many tasks pass every test. */
  verdict(): string {
    const { definition, endReason, endedAt, startedAt, results } = this.session;
    const passed = definition.items.filter((item) => {
      const result = results[item.questionId];
      return !!result && result.passed === result.total;
    }).length;
    const ending = endReason === 'ended' && endedAt !== null
      ? `Ended after ${Math.max(1, Math.round((endedAt - startedAt) / 60_000))} min.`
      : 'Time is up.';
    return `${ending} ${passed} of ${definition.items.length} problems pass every test.`;
  }
}
