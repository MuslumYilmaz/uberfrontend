import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import type { DraftIndexEntry } from '../../../core/utils/versioned-drafts.util';

type Mode = 'updated' | 'older';

@Component({
  selector: 'app-draft-update-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="isVisible" class="draft-update-banner" data-testid="draft-update-banner">
      <span class="msg" data-testid="draft-update-banner-message">
        <ng-container *ngIf="mode === 'older'; else updatedTpl">
          You’re viewing an older draft. It may not match the current tests.
        </ng-container>
        <ng-template #updatedTpl>
          This question was updated. We started a fresh draft for the new version. Your older draft is still available.
        </ng-template>
      </span>

      <div class="actions">
        <ng-container *ngIf="mode === 'updated'">
          <ng-container *ngIf="(otherDrafts?.length || 0) === 1; else multiTpl">
            <button class="action" type="button" data-testid="draft-update-open-older"
              (click)="openVersion.emit(otherDrafts[0].version)">
              Open older draft
            </button>
            <button class="action" type="button" data-testid="draft-update-copy-older"
              (click)="copyVersion.emit(otherDrafts[0].version)">
              Copy into new draft
            </button>
          </ng-container>

          <ng-template #multiTpl>
            <select #sel class="select" data-testid="draft-update-version-select" aria-label="Select older draft">
              <option *ngFor="let d of (otherDrafts || [])" [value]="d.version">
                {{ labelFor(d) }}
              </option>
            </select>
            <button class="action" type="button" data-testid="draft-update-open-older"
              (click)="openVersion.emit(sel.value)">
              Open
            </button>
            <button class="action" type="button" data-testid="draft-update-copy-older"
              (click)="copyVersion.emit(sel.value)">
              Copy
            </button>
          </ng-template>

          <button class="close" type="button" data-testid="draft-update-dismiss" (click)="dismiss.emit()">✕</button>
        </ng-container>

        <ng-container *ngIf="mode === 'older'">
          <button class="action" type="button" data-testid="draft-update-back-latest"
            (click)="switchToCurrent.emit()">
            Back to latest
          </button>
          <button class="action" type="button" data-testid="draft-update-copy-into-latest"
            (click)="copyVersion.emit(activeVersion)">
            Copy into latest
          </button>
        </ng-container>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      position: relative;
      width: 100%;
      z-index: 25;
    }

    .draft-update-banner {
      position: relative;
      padding: .375rem .75rem;
      text-align: center;
      background: var(--uf-status-info-bg);
      color: var(--uf-status-info-text);
      font-size: .75rem;
      line-height: 1.3;
      border-bottom: 1px solid var(--uf-status-info-border);
      animation: fadeIn .2s ease;
    }

    .msg { font-weight: 500; }

    .actions {
      position: absolute;
      right: .5rem;
      inset-block: 0;
      display: flex;
      align-items: center;
      gap: .6rem;
    }

    .action {
      text-decoration: underline;
      font-weight: 500;
      background: transparent;
      border: none;
      padding: 0;
      color: inherit;
      cursor: pointer;
      white-space: nowrap;
    }

    .select {
      background: color-mix(in srgb, var(--uf-surface) 80%, var(--uf-surface-alt));
      border: 1px solid color-mix(in srgb, var(--uf-border-subtle) 74%, var(--uf-text-secondary));
      border-radius: 6px;
      padding: 2px 6px;
      font-size: .75rem;
      max-width: 14rem;
      color: inherit;
    }

    .close {
      opacity: .7;
      background: transparent;
      border: none;
      color: inherit;
      font-size: .85rem;
      cursor: pointer;
      transition: opacity .15s ease;
    }

    .close:hover { opacity: 1; }

    @media (max-width: 900px) {
      .draft-update-banner {
        padding-right: .75rem;
      }

      .actions {
        position: static;
        justify-content: center;
        flex-wrap: wrap;
        margin-top: .25rem;
      }
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-3px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class DraftUpdateBannerComponent {
  @Input() isVisible = false;
  @Input() mode: Mode = 'updated';
  @Input() otherDrafts: DraftIndexEntry[] = [];
  @Input() activeVersion = '';

  @Output() openVersion = new EventEmitter<string>();
  @Output() copyVersion = new EventEmitter<string>();
  @Output() switchToCurrent = new EventEmitter<void>();
  @Output() dismiss = new EventEmitter<void>();

  labelFor(d: DraftIndexEntry): string {
    const v = d?.version || '';
    const stamp = d?.updatedAt ? ` · ${String(d.updatedAt).slice(0, 10)}` : '';
    if (v === 'legacy') return `legacy${stamp}`;
    return `${v}${stamp}`;
  }
}
