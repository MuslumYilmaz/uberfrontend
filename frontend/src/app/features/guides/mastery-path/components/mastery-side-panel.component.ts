import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MasteryModule } from '../../../../shared/mastery/mastery-path.model';

@Component({
  selector: 'app-mastery-side-panel',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    :host {
      display: grid;
      gap: 12px;
      align-content: start;
    }

    .panel {
      border-radius: var(--uf-card-radius);
      border: 1px solid var(--uf-border-subtle);
      background: color-mix(in srgb, var(--uf-surface) 92%, var(--uf-surface-alt));
      box-shadow: var(--uf-card-shadow);
      padding: 12px 14px;
      display: grid;
      gap: 10px;
    }

    .panel h3,
    .panel h4 {
      margin: 0;
      color: var(--uf-text-primary);
    }

    .meta {
      font-size: 12px;
      color: color-mix(in srgb, var(--uf-text-secondary) 84%, transparent);
    }

    .bar {
      position: relative;
      height: 7px;
      border-radius: 999px;
      background: color-mix(in srgb, var(--uf-surface-alt) 80%, var(--uf-surface));
      overflow: hidden;
    }

    .bar > span {
      position: absolute;
      inset: 0;
      width: var(--progress, 0%);
      border-radius: 999px;
      background: color-mix(in srgb, var(--uf-accent) 62%, #10b981 38%);
    }

    ul {
      margin: 0;
      padding-left: 18px;
      display: grid;
      gap: 7px;
      color: color-mix(in srgb, var(--uf-text-secondary) 88%, transparent);
      font-size: 13px;
    }

    .rule {
      border-radius: 10px;
      border: 1px solid var(--uf-border-subtle);
      background: color-mix(in srgb, var(--uf-surface) 94%, var(--uf-surface-alt));
      padding: 9px 10px;
      font-size: 13px;
      color: color-mix(in srgb, var(--uf-text-secondary) 88%, transparent);
    }

    .lock {
      color: #b45309;
      font-weight: 700;
    }

    .score-row {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 8px;
      font-size: 13px;
      color: color-mix(in srgb, var(--uf-text-secondary) 86%, transparent);
    }
  `],
  template: `
    <section class="panel" *ngIf="module as current; else emptyState">
      <h3>{{ current.title }}</h3>
      <div class="meta">{{ moduleCompletedCount }}/{{ moduleTotalCount }} complete ({{ moduleCompletionPercent }}%)</div>
      <div class="bar" [style.--progress]="moduleCompletionPercent + '%'">
        <span></span>
      </div>

      <div class="rule">
        <strong>Unlock rule:</strong>
        {{ current.unlockRule.label }}
        <div class="lock" *ngIf="moduleLocked">Module currently locked.</div>
      </div>

      <h4>This module teaches</h4>
      <ul>
        <li *ngFor="let goal of current.learningGoals">{{ goal }}</li>
      </ul>

      <h4>Common mistakes</h4>
      <ul>
        <li *ngFor="let mistake of current.commonMistakes">{{ mistake }}</li>
      </ul>
    </section>

    <section class="panel">
      <h4>Scoring model</h4>
      <div class="score-row">
        <span>Trivia + predict output</span>
        <strong>{{ knowledgeWeight }}%</strong>
      </div>
      <div class="score-row">
        <span>Coding drills</span>
        <strong>{{ codingWeight }}%</strong>
      </div>
    </section>

    <ng-template #emptyState>
      <section class="panel">
        <h3>Select a module</h3>
        <div class="meta">Pick a module in the list to see goals, mistakes, and unlock rules.</div>
      </section>
    </ng-template>
  `,
})
export class MasterySidePanelComponent {
  @Input() module: MasteryModule | null = null;
  @Input() moduleCompletionPercent = 0;
  @Input() moduleCompletedCount = 0;
  @Input() moduleTotalCount = 0;
  @Input() moduleLocked = false;
  @Input() knowledgeWeight = 35;
  @Input() codingWeight = 65;
}
