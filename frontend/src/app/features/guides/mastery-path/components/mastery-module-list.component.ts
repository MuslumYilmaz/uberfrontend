import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MasteryModuleView } from '../../../../shared/mastery/mastery-path.model';
import { MasteryItemRowComponent } from './mastery-item-row.component';

@Component({
  selector: 'app-mastery-module-list',
  standalone: true,
  imports: [CommonModule, MasteryItemRowComponent],
  styles: [`
    :host {
      display: grid;
      gap: 14px;
    }

    .module {
      border-radius: var(--uf-card-radius);
      border: 1px solid var(--uf-border-subtle);
      overflow: hidden;
      background: var(--uf-surface);
      box-shadow: var(--uf-card-shadow);
    }

    .module__head {
      width: 100%;
      border: 0;
      text-align: left;
      padding: 12px 14px;
      background: color-mix(in srgb, var(--uf-surface) 84%, var(--uf-surface-alt));
      display: grid;
      gap: 8px;
      cursor: pointer;
      transition: background-color 160ms ease;
    }

    .module__head:hover {
      background: color-mix(in srgb, var(--uf-accent) 12%, var(--uf-surface));
    }

    .module--active .module__head {
      background: color-mix(in srgb, var(--uf-accent) 16%, var(--uf-surface));
    }

    .module--locked .module__head {
      background: color-mix(in srgb, var(--uf-surface-alt) 78%, var(--uf-surface));
    }

    .module__top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .module__title {
      margin: 0;
      font-size: 1rem;
      color: var(--uf-text-primary);
    }

    .module__band {
      border-radius: var(--uf-radius-pill);
      border: 1px solid var(--uf-border-subtle);
      padding: 3px 8px;
      font-size: 11px;
      font-weight: 700;
      color: var(--uf-text-secondary);
      background: color-mix(in srgb, var(--uf-surface) 92%, var(--uf-surface-alt));
    }

    .module__summary {
      margin: 0;
      font-size: 13px;
      color: color-mix(in srgb, var(--uf-text-secondary) 84%, transparent);
    }

    .module__meta {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .module__status {
      font-size: 12px;
      font-weight: 700;
      color: color-mix(in srgb, var(--uf-text-tertiary) 84%, transparent);
    }

    .module__status--locked {
      color: #b45309;
    }

    .module__bar {
      position: relative;
      height: 6px;
      flex: 1 1 180px;
      border-radius: 999px;
      background: color-mix(in srgb, var(--uf-surface-alt) 80%, var(--uf-surface));
      overflow: hidden;
    }

    .module__bar > span {
      position: absolute;
      inset: 0;
      width: var(--module-progress, 0%);
      border-radius: 999px;
      background: color-mix(in srgb, var(--uf-accent) 62%, #10b981 38%);
    }

    .module__empty {
      border-top: 1px solid var(--uf-border-subtle);
      padding: 12px 14px;
      font-size: 13px;
      color: color-mix(in srgb, var(--uf-text-tertiary) 82%, transparent);
      background: color-mix(in srgb, var(--uf-surface) 94%, var(--uf-surface-alt));
    }
  `],
  template: `
    <section
      *ngFor="let view of moduleViews"
      class="module"
      [class.module--active]="view.module.id === activeModuleId"
      [class.module--locked]="view.locked"
      [attr.aria-label]="view.module.title">

      <button class="module__head" type="button" (click)="selectModule(view.module.id)">
        <div class="module__top">
          <h3 class="module__title">{{ view.module.title }}</h3>
          <span class="module__band">{{ view.module.scoreBand }}</span>
        </div>

        <p class="module__summary">{{ view.module.summary }}</p>

        <div class="module__meta">
          <div class="module__status" [class.module__status--locked]="view.locked">
            {{ view.locked ? 'Locked' : (view.completedCount + '/' + view.totalCount + ' complete') }}
          </div>
          <div class="module__bar" [style.--module-progress]="view.completionPercent + '%'">
            <span></span>
          </div>
        </div>
      </button>

      <ng-container *ngIf="view.items.length; else emptyState">
        <app-mastery-item-row
          *ngFor="let item of view.items"
          [item]="item"
          [sessionItems]="view.items"
          [locked]="view.locked"
          [completed]="completedItemIds.has(item.id)"
          (toggleItem)="toggleItemCompletion.emit(item.id)">
        </app-mastery-item-row>
      </ng-container>

      <ng-template #emptyState>
        <div class="module__empty">No drills match the active filters in this module.</div>
      </ng-template>
    </section>
  `,
})
export class MasteryModuleListComponent {
  @Input() moduleViews: MasteryModuleView[] = [];
  @Input() activeModuleId: string | null = null;
  @Input() completedItemIds: Set<string> = new Set<string>();

  @Output() moduleSelected = new EventEmitter<string>();
  @Output() toggleItemCompletion = new EventEmitter<string>();

  selectModule(moduleId: string): void {
    this.moduleSelected.emit(moduleId);
  }
}
