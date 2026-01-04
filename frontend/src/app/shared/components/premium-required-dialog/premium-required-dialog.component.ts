import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { PremiumGateReason } from '../../../core/services/premium-gate.service';

const COPY: Record<PremiumGateReason, { title: string; action: string }> = {
  tracks: {
    title: 'Premium tracks',
    action: 'unlock these tracks',
  },
  company: {
    title: 'Premium company questions',
    action: "unlock this company's questions",
  },
  generic: {
    title: 'Premium question',
    action: 'unlock this challenge',
  },
};

@Component({
  selector: 'app-premium-required-dialog',
  standalone: true,
  imports: [CommonModule, DialogModule],
  styles: [`
    :host { display: block; }

    :host ::ng-deep .p-dialog-mask.p-component-overlay {
      background: rgba(0, 0, 0, .55) !important;
      backdrop-filter: blur(2px);
    }

    :host ::ng-deep .premium-dialog.p-dialog {
      width: min(560px, calc(100vw - 32px)) !important;
      border-radius: 18px;
      overflow: hidden;
      border: 1px solid color-mix(in srgb, var(--uf-text-primary) 10%, transparent);
      box-shadow:
        0 24px 80px rgba(0, 0, 0, .55),
        0 2px 0 rgba(255, 255, 255, .03) inset;
      background: color-mix(in srgb, var(--uf-surface) 92%, var(--uf-text-primary) 8%);
    }

    :host ::ng-deep .premium-dialog .p-dialog-content {
      background: transparent !important;
      color: var(--uf-text-primary);
      padding: 0 !important;
    }

    :host ::ng-deep .premium-dialog .p-dialog-header {
      display: none !important;
    }

    .premium-dialog__panel {
      position: relative;
      padding: 24px 24px 22px;
      display: grid;
      gap: 12px;
      text-align: center;
      background: linear-gradient(
        180deg,
        color-mix(in srgb, var(--uf-surface) 88%, var(--uf-text-primary) 12%),
        color-mix(in srgb, var(--uf-surface) 96%, var(--uf-text-primary) 4%)
      );
    }

    .premium-dialog__close {
      position: absolute;
      top: 14px;
      right: 14px;
      width: 34px;
      height: 34px;
      border-radius: 10px;
      border: 1px solid transparent;
      background: transparent;
      color: var(--uf-text-secondary);
      display: grid;
      place-items: center;
      cursor: pointer;
      transition: background-color .15s ease, color .15s ease, border-color .15s ease;
    }
    .premium-dialog__close:hover {
      background: color-mix(in srgb, var(--uf-text-primary) 8%, transparent);
      color: var(--uf-text-primary);
    }
    .premium-dialog__close:focus-visible {
      outline: none;
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--uf-accent) 55%, transparent);
    }

    .premium-dialog__pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 6px 12px;
      border-radius: 999px;
      background: color-mix(in srgb, var(--uf-accent) 25%, transparent);
      color: var(--uf-text-primary);
      font-weight: 800;
      font-size: 12px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin: 0 auto;
    }

    .premium-dialog__title {
      margin: 4px 0 0;
      font-size: 22px;
      letter-spacing: -0.01em;
    }

    .premium-dialog__text {
      margin: 0;
      color: color-mix(in srgb, var(--uf-text-secondary) 88%, transparent);
      font-size: 14px;
      line-height: 1.55;
    }

    .premium-dialog__actions {
      display: flex;
      justify-content: center;
      gap: 12px;
      margin-top: 6px;
    }

    @media (max-width: 600px) {
      .premium-dialog__panel { padding: 18px; }
      .premium-dialog__title { font-size: 20px; }
      .premium-dialog__actions { flex-direction: column; }
    }
  `],
  template: `
    <p-dialog
      [(visible)]="visible"
      [modal]="true"
      [dismissableMask]="true"
      [draggable]="false"
      [resizable]="false"
      [closable]="false"
      [showHeader]="false"
      styleClass="premium-dialog"
      (onHide)="onClose()"
    >
      <div
        class="premium-dialog__panel"
        role="dialog"
        [attr.aria-labelledby]="dialogTitleId"
        [attr.aria-describedby]="dialogDescId"
      >
        <button class="premium-dialog__close" type="button" aria-label="Close" (click)="onClose()">
          <i class="pi pi-times"></i>
        </button>

        <div class="premium-dialog__pill">Premium</div>
        <h3 class="premium-dialog__title" [id]="dialogTitleId">{{ title }}</h3>
        <p class="premium-dialog__text" [id]="dialogDescId">{{ body }}</p>

        <div class="premium-dialog__actions">
          <button class="fa-btn fa-btn--primary" type="button" (click)="goToPricing()">View pricing</button>
          <button *ngIf="!isLoggedIn" class="fa-btn fa-btn--ghost" type="button" (click)="goToLogin()">Sign in</button>
        </div>
      </div>
    </p-dialog>
  `,
})
export class PremiumRequiredDialogComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  @Input() context: PremiumGateReason = 'generic';
  @Input() isLoggedIn = false;
  @Input() targetUrl?: string;

  dialogTitleId = 'premium-dialog-title';
  dialogDescId = 'premium-dialog-desc';

  constructor(private router: Router) { }

  get title(): string {
    return (COPY[this.context] || COPY.generic).title;
  }

  get body(): string {
    const action = (COPY[this.context] || COPY.generic).action;
    if (this.isLoggedIn) {
      return `You're on the free tier. Upgrade to ${action}.`;
    }
    return `Upgrade to FrontendAtlas Premium to ${action}. Already upgraded? Sign in to continue.`;
  }

  onClose() {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  goToPricing() {
    this.onClose();
    this.router.navigate(['/pricing'], {
      queryParams: this.targetUrl ? { redirectTo: this.targetUrl } : undefined,
    });
  }

  goToLogin() {
    this.onClose();
    this.router.navigate(['/auth/login'], {
      queryParams: this.targetUrl ? { redirectTo: this.targetUrl } : undefined,
    });
  }
}
