import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { QuestionKind } from '../../../../core/models/question.model';
import { Tech } from '../../../../core/models/user.model';
import { QuestionListItem, QuestionService } from '../../../../core/services/question.service';
import {
  MasteryActionTarget,
  MasteryDifficulty,
  MasteryItem,
  MasteryItemType,
} from '../../../../shared/mastery/mastery-path.model';

type PracticeItem = { tech: Tech; kind: QuestionKind; id: string };
type PracticeSession = { items: PracticeItem[]; index: number };

@Component({
  selector: 'app-mastery-item-row',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    :host { display:block; }

    .row {
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      border-top: 1px solid var(--uf-border-subtle);
      background: color-mix(in srgb, var(--uf-surface) 95%, var(--uf-bg));
      transition: border-color 160ms ease, background-color 160ms ease;
    }

    .row--done {
      background: color-mix(in srgb, var(--uf-surface) 93%, var(--uf-accent) 7%);
    }

    .row--locked {
      opacity: 0.62;
    }

    .row--actionable {
      cursor: pointer;
    }

    .row--actionable:hover {
      border-color: color-mix(in srgb, var(--uf-border-subtle) 56%, var(--uf-accent) 44%);
      background: color-mix(in srgb, var(--uf-accent) 14%, var(--uf-surface));
    }

    .row--actionable:focus-visible {
      outline: 2px solid color-mix(in srgb, var(--uf-accent) 64%, transparent);
      outline-offset: -2px;
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
      border-color: color-mix(in srgb, #c89f45 68%, var(--uf-border-subtle));
      background: color-mix(in srgb, #c89f45 24%, var(--uf-surface));
      color: color-mix(in srgb, #f5d77f 88%, var(--uf-text-primary));
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
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--uf-text-primary);
      line-height: 1.28;
    }

    .summary {
      margin: 0;
      color: color-mix(in srgb, var(--uf-text-secondary) 92%, transparent);
      font-size: 13px;
      line-height: 1.4;
    }

    .hint {
      margin: 0;
      color: color-mix(in srgb, var(--uf-text-secondary) 78%, transparent);
      font-size: 12px;
      font-weight: 700;
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
      background: color-mix(in srgb, #c89f45 24%, var(--uf-surface));
      color: color-mix(in srgb, #e9cc78 90%, var(--uf-text-primary));
    }

    .chip--difficulty {
      background: color-mix(in srgb, var(--uf-surface) 90%, var(--uf-bg));
      color: color-mix(in srgb, var(--uf-text-secondary) 92%, transparent);
    }

    .chip--easy { color: #16a34a; }
    .chip--intermediate { color: #0ea5e9; }
    .chip--hard { color: #ef4444; }

    .time {
      font-size: 12px;
      color: color-mix(in srgb, var(--uf-text-tertiary) 78%, transparent);
      white-space: nowrap;
    }

    @media (max-width: 900px) {
      .row {
        grid-template-columns: auto 1fr;
        gap: 10px;
      }

      .time {
        margin-left: 36px;
      }
    }
  `],
  template: `
    <article
      class="row"
      [class.row--done]="completed"
      [class.row--locked]="locked"
      [class.row--actionable]="isActionable()"
      [class.row--checkpoint]="item.type === 'checkpoint'"
      [attr.role]="isActionable() ? 'link' : null"
      [attr.tabindex]="isActionable() ? 0 : null"
      [attr.aria-label]="rowAriaLabel()"
      (click)="onRowActivate($event)"
      (keydown.enter)="onRowActivate($event)"
      (keydown.space)="onRowActivate($event)">

      <button
        class="state"
        type="button"
        [class.state--done]="completed"
        [disabled]="locked"
        [attr.aria-pressed]="completed"
        [attr.aria-label]="completed ? 'Mark item incomplete' : 'Mark item complete'"
        (click)="onToggle($event)">
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
        <p class="hint" *ngIf="item.target as target">{{ target.label || defaultActionLabel(item.type) }}</p>
      </div>

      <div class="time">{{ item.estimatedMinutes }} min</div>
    </article>
  `,
})
export class MasteryItemRowComponent {
  private readonly router = inject(Router);
  private readonly questionService = inject(QuestionService);
  private readonly summaryCache = new Map<string, Promise<QuestionListItem[]>>();

  private readonly supportedTechs = new Set<Tech>([
    'javascript',
    'react',
    'angular',
    'vue',
    'html',
    'css',
  ]);

  @Input({ required: true }) item!: MasteryItem;
  @Input() sessionItems: MasteryItem[] = [];
  @Input() completed = false;
  @Input() locked = false;

  @Output() toggleItem = new EventEmitter<void>();

  onToggle(event: Event): void {
    event.stopPropagation();
    if (this.locked) return;
    this.toggleItem.emit();
  }

  isActionable(): boolean {
    return !this.locked && !!this.item?.target;
  }

  rowAriaLabel(): string | null {
    if (!this.isActionable()) return null;
    const target = this.item.target;
    if (!target) return null;
    const actionLabel = target.label || this.defaultActionLabel(this.item.type);
    return `${actionLabel}: ${this.item.title}`;
  }

  async onRowActivate(event: Event): Promise<void> {
    if (!this.isActionable()) return;
    if (this.isStateControlInteraction(event)) return;

    event.preventDefault();

    const target = this.item.target;
    if (!target) return;

    const resolvedTarget = await this.resolveQuestionTarget(target);
    if (resolvedTarget) {
      const session = await this.buildPracticeSession(resolvedTarget);
      await this.router.navigate(['/', resolvedTarget.tech, resolvedTarget.kind, resolvedTarget.id], {
        state: {
          session: session ?? undefined,
          returnToUrl: this.router.url,
          returnLabel: 'Back to mastery track',
          sessionSource: 'mastery',
        },
      });
      return;
    }

    await this.router.navigate(target.route, { queryParams: target.queryParams });
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

  private isStateControlInteraction(event: Event): boolean {
    const target = event.target as HTMLElement | null;
    return !!target?.closest('.state');
  }

  private async resolveQuestionTarget(target: MasteryActionTarget): Promise<PracticeItem | null> {
    if (!this.isGlobalCodingTarget(target)) return null;

    const tech = this.parseTech(target.queryParams?.['tech']);
    const kind = this.parseKind(target.queryParams?.['kind']);
    const rawQuery = target.queryParams?.['q'];
    const query = typeof rawQuery === 'string' ? rawQuery.trim() : '';

    if (!tech || !kind || !query) return null;

    try {
      const questions = await this.loadQuestionSummariesCached(tech, kind);
      const best = this.pickBestMatch(questions, query);
      if (!best) return null;

      return { tech, kind, id: best.id };
    } catch {
      return null;
    }
  }

  private async buildPracticeSession(activeItem: PracticeItem): Promise<PracticeSession | null> {
    const sourceItems = this.sessionItems.length ? this.sessionItems : [this.item];
    const resolvedItems = await Promise.all(
      sourceItems.map((sourceItem) =>
        sourceItem.target ? this.resolveQuestionTarget(sourceItem.target) : Promise.resolve(null),
      ),
    );

    const items: PracticeItem[] = [];
    const seen = new Set<string>();

    for (const resolved of resolvedItems) {
      if (!resolved) continue;
      const key = this.practiceItemKey(resolved);
      if (seen.has(key)) continue;
      seen.add(key);
      items.push(resolved);
    }

    if (!items.length) return null;

    let index = items.findIndex((entry) => this.samePracticeItem(entry, activeItem));
    if (index < 0) {
      items.unshift(activeItem);
      index = 0;
    }

    return { items, index };
  }

  private samePracticeItem(a: PracticeItem, b: PracticeItem): boolean {
    return a.tech === b.tech && a.kind === b.kind && a.id === b.id;
  }

  private practiceItemKey(item: PracticeItem): string {
    return `${item.tech}:${item.kind}:${item.id}`;
  }

  private async loadQuestionSummariesCached(
    tech: Tech,
    kind: QuestionKind,
  ): Promise<QuestionListItem[]> {
    const key = `${tech}:${kind}`;
    const cached = this.summaryCache.get(key);
    if (cached) return cached;

    const pending = firstValueFrom(
      this.questionService.loadQuestionSummaries(tech, kind, { transferState: false }),
    ).catch(() => [] as QuestionListItem[]);

    this.summaryCache.set(key, pending);
    return pending;
  }

  private isGlobalCodingTarget(target: MasteryActionTarget): boolean {
    const route = target.route;
    if (!Array.isArray(route) || route.length !== 1) return false;
    const first = String(route[0] ?? '')
      .trim()
      .replace(/^\/+/, '');
    return first === 'coding';
  }

  private parseTech(value: unknown): Tech | null {
    const tech = String(value ?? '')
      .trim()
      .toLowerCase() as Tech;
    return this.supportedTechs.has(tech) ? tech : null;
  }

  private parseKind(value: unknown): QuestionKind | null {
    const kind = String(value ?? '')
      .trim()
      .toLowerCase();
    if (kind === 'coding' || kind === 'trivia') return kind;
    return null;
  }

  private pickBestMatch(questions: QuestionListItem[], query: string): QuestionListItem | null {
    const normalizedQuery = this.normalizeText(query);
    const tokens = Array.from(
      new Set(
        normalizedQuery
          .split(' ')
          .map((token) => token.trim())
          .filter((token) => token.length >= 2),
      ),
    );

    if (!normalizedQuery || !tokens.length) return null;

    let best: { item: QuestionListItem; score: number } | null = null;

    for (const item of questions) {
      const score = this.matchScore(item, normalizedQuery, tokens);
      if (!best || score > best.score) {
        best = { item, score };
        continue;
      }

      if (score === best.score) {
        const itemImportance = Number(item.importance ?? 0);
        const bestImportance = Number(best.item.importance ?? 0);
        if (itemImportance > bestImportance) best = { item, score };
      }
    }

    if (!best || best.score <= 0) return null;
    return best.item;
  }

  private matchScore(item: QuestionListItem, normalizedQuery: string, tokens: string[]): number {
    const title = this.normalizeText(item.title);
    const tags = (item.tags ?? []).map((tag) => this.normalizeText(tag)).join(' ');
    const description = this.normalizeText(item.shortDescription ?? item.description ?? '');

    let score = 0;

    if (title.includes(normalizedQuery)) score += 80;
    if (tags.includes(normalizedQuery)) score += 50;
    if (description.includes(normalizedQuery)) score += 20;

    for (const token of tokens) {
      if (title.includes(token)) score += 12;
      if (tags.includes(token)) score += 8;
      if (description.includes(token)) score += 3;
    }

    return score;
  }

  private normalizeText(value: unknown): string {
    return String(value ?? '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }
}
