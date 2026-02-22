import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MasteryDifficulty, MasteryItem, MasteryItemType } from '../../../../shared/mastery/mastery-path.model';

@Component({
  selector: 'app-mastery-item-row',
  standalone: true,
  imports: [CommonModule, RouterModule],
  styles: [`
    :host { display:block; }

    .row {
      display: grid;
      grid-template-columns: auto 1fr auto auto;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      border-top: 1px solid var(--uf-border-subtle);
      background: color-mix(in srgb, var(--uf-surface) 94%, var(--uf-surface-alt));
    }

    .row--done {
      background: color-mix(in srgb, var(--uf-accent) 10%, var(--uf-surface));
    }

    .row--locked {
      opacity: 0.62;
    }

    .state {
      width: 24px;
      height: 24px;
      border-radius: var(--uf-radius-pill);
      border: 1px solid var(--uf-border-subtle);
      background: color-mix(in srgb, var(--uf-surface) 90%, var(--uf-surface-alt));
      display: grid;
      place-items: center;
      color: var(--uf-text-secondary);
      cursor: pointer;
      transition: border-color 160ms ease, background-color 160ms ease, color 160ms ease;
    }

    .state:disabled {
      cursor: not-allowed;
      opacity: 0.65;
    }

    .state--done {
      border-color: color-mix(in srgb, var(--uf-accent) 56%, var(--uf-border-subtle));
      background: color-mix(in srgb, var(--uf-accent) 24%, var(--uf-surface));
      color: var(--uf-text-primary);
      font-weight: 700;
    }

    .body {
      min-width: 0;
      display: grid;
      gap: 5px;
    }

    .title-line {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
    }

    .title {
      margin: 0;
      font-size: 0.99rem;
      color: var(--uf-text-primary);
    }

    .summary {
      margin: 0;
      color: color-mix(in srgb, var(--uf-text-secondary) 84%, transparent);
      font-size: 13px;
    }

    .chip {
      border-radius: var(--uf-radius-pill);
      border: 1px solid var(--uf-border-subtle);
      padding: 2px 8px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.01em;
      white-space: nowrap;
    }

    .chip--type {
      background: color-mix(in srgb, var(--uf-accent) 14%, var(--uf-surface));
      color: var(--uf-text-primary);
    }

    .chip--difficulty {
      background: color-mix(in srgb, var(--uf-surface-alt) 62%, var(--uf-surface));
      color: var(--uf-text-secondary);
    }

    .chip--easy { color: #138a4c; }
    .chip--intermediate { color: #a16207; }
    .chip--hard { color: #b91c1c; }

    .time {
      font-size: 12px;
      color: color-mix(in srgb, var(--uf-text-tertiary) 78%, transparent);
      white-space: nowrap;
    }

    .action {
      text-decoration: none;
      min-width: 122px;
      text-align: center;
      border-radius: var(--uf-radius-pill);
      border: 1px solid var(--uf-border-subtle);
      padding: 7px 12px;
      font-size: 12px;
      font-weight: 700;
      color: var(--uf-text-primary);
      background: color-mix(in srgb, var(--uf-surface) 90%, var(--uf-surface-alt));
      transition: border-color 160ms ease, background-color 160ms ease;
    }

    .action:hover {
      border-color: color-mix(in srgb, var(--uf-border-subtle) 60%, var(--uf-accent) 40%);
      background: color-mix(in srgb, var(--uf-accent) 16%, var(--uf-surface));
    }

    .action--disabled {
      pointer-events: none;
      opacity: 0.6;
    }

    @media (max-width: 900px) {
      .row {
        grid-template-columns: auto 1fr;
        gap: 10px;
      }

      .time,
      .action {
        margin-left: 36px;
      }

      .action {
        justify-self: start;
      }
    }
  `],
  template: `
    <article class="row"
      [class.row--done]="completed"
      [class.row--locked]="locked"
      [class.row--checkpoint]="item.type === 'checkpoint'">

      <button
        class="state"
        type="button"
        [class.state--done]="completed"
        [disabled]="locked"
        [attr.aria-pressed]="completed"
        [attr.aria-label]="completed ? 'Mark item incomplete' : 'Mark item complete'"
        (click)="onToggle()"
      >
        <span *ngIf="completed">✓</span>
      </button>

      <div class="body">
        <div class="title-line">
          <h4 class="title">{{ item.title }}</h4>
          <span class="chip chip--type">{{ typeLabel(item.type) }}</span>
          <span class="chip chip--difficulty" [ngClass]="difficultyClass(item.difficulty)">
            {{ difficultyLabel(item.difficulty) }}
          </span>
        </div>
        <p class="summary">{{ item.summary }}</p>
      </div>

      <div class="time">{{ item.estimatedMinutes }} min</div>

      <a
        *ngIf="item.target as target; else actionFallback"
        class="action"
        [class.action--disabled]="locked"
        [routerLink]="target.route"
        [queryParams]="target.queryParams"
        (click)="onActionClick($event)">
        {{ target.label || defaultActionLabel(item.type) }}
      </a>

      <ng-template #actionFallback>
        <span class="action action--disabled">No linked drill</span>
      </ng-template>
    </article>
  `,
})
export class MasteryItemRowComponent {
  @Input({ required: true }) item!: MasteryItem;
  @Input() completed = false;
  @Input() locked = false;

  @Output() toggleItem = new EventEmitter<void>();

  onToggle(): void {
    if (this.locked) return;
    this.toggleItem.emit();
  }

  onActionClick(event: Event): void {
    if (this.locked) event.preventDefault();
  }

  typeLabel(type: MasteryItemType): string {
    if (type === 'predict') return 'Predict Output';
    if (type === 'checkpoint') return 'Checkpoint';
    return type === 'coding' ? 'Coding' : 'Trivia';
  }

  defaultActionLabel(type: MasteryItemType): string {
    if (type === 'checkpoint') return 'Run checkpoint';
    return type === 'coding' ? 'Practice coding' : 'Practice trivia';
  }

  difficultyLabel(difficulty: MasteryDifficulty): string {
    if (difficulty === 'intermediate') return 'Medium';
    return difficulty === 'hard' ? 'Hard' : 'Easy';
  }

  difficultyClass(difficulty: MasteryDifficulty): string {
    if (difficulty === 'intermediate') return 'chip--intermediate';
    return difficulty === 'hard' ? 'chip--hard' : 'chip--easy';
  }
}
