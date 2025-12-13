import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-login-required-dialog',
  standalone: true,
  imports: [CommonModule, DialogModule, ButtonModule],
  styles: [`
  :host { display: block; }

  /* Darken + blur overlay so dialog pops from page */
  :host ::ng-deep .p-dialog-mask.p-component-overlay {
    background: rgba(0, 0, 0, .55) !important;
    backdrop-filter: blur(2px);
  }

  /* Dialog shell: elevation, border, distinct surface */
  :host ::ng-deep .login-dialog.p-dialog {
    width: min(640px, calc(100vw - 32px)) !important;
    border-radius: 18px;
    overflow: hidden;

    border: 1px solid color-mix(in srgb, var(--uf-text-primary) 10%, transparent);
    box-shadow:
      0 24px 80px rgba(0, 0, 0, .55),
      0 2px 0 rgba(255, 255, 255, .03) inset;

    /* slightly different from page surface */
    background: color-mix(in srgb, var(--uf-surface) 92%, var(--uf-text-primary) 8%);
  }

  /* Let dialog shell background show through */
  :host ::ng-deep .login-dialog .p-dialog-content {
    background: transparent !important;
    color: var(--uf-text-primary);
    padding: 0 !important;
  }

  /* We’re not using Prime header at all */
  :host ::ng-deep .login-dialog .p-dialog-header {
    display: none !important;
  }

  /* Inner panel: subtle gradient highlight */
  .login-dialog__panel {
    background: linear-gradient(
      180deg,
      color-mix(in srgb, var(--uf-surface) 88%, var(--uf-text-primary) 12%),
      color-mix(in srgb, var(--uf-surface) 96%, var(--uf-text-primary) 4%)
    );
    position: relative;
    padding: 22px 22px 20px;
    display: grid;
    gap: 16px;
  }

  .login-dialog__close {
    position: absolute;
    top: 14px;
    right: 14px;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    border: 1px solid transparent;
    background: transparent;
    color: var(--uf-text-secondary);
    display: grid;
    place-items: center;
    cursor: pointer;
    transition: background-color .15s ease, color .15s ease, border-color .15s ease;
  }
  .login-dialog__close:hover {
    background: color-mix(in srgb, var(--uf-text-primary) 8%, transparent);
    color: var(--uf-text-primary);
  }
  .login-dialog__close:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--uf-accent) 55%, transparent);
  }

  .login-dialog__header-row {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 16px;
    align-items: center;
    padding-right: 44px; /* space for the close button */
  }

  .login-dialog__icon {
    width: 56px;
    height: 56px;
    border-radius: 16px;
    display: grid;
    place-items: center;

    /* make the icon container feel “raised” too */
    background: color-mix(in srgb, var(--uf-accent-soft) 85%, var(--uf-surface));
    border: 1px solid color-mix(in srgb, var(--uf-text-primary) 10%, transparent);

    color: var(--uf-text-primary);
    font-size: 20px;
  }

  .login-dialog__title {
    margin: 0;
    font-size: 28px;
    font-weight: 800;
    line-height: 1.15;
    letter-spacing: -0.01em;
  }

  .login-dialog__text {
    margin: 6px 0 0;
    color: var(--uf-text-secondary);
    font-size: 16px;
    line-height: 1.5;
    max-width: 52ch;
  }

  .login-dialog__footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 6px;
  }

  .btn-secondary, .btn-primary {
    appearance: none;
    border: 1px solid var(--uf-border-subtle);
    border-radius: 14px;
    height: 44px;
    padding: 0 18px;
    font-weight: 800;
    cursor: pointer;
    transition: background-color .15s ease, border-color .15s ease, box-shadow .15s ease, transform .05s ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 140px;
  }

  .btn-secondary {
    background: color-mix(in srgb, var(--uf-text-primary) 4%, transparent);
    color: var(--uf-text-primary);
    border-color: color-mix(in srgb, var(--uf-text-primary) 12%, transparent);
  }
  .btn-secondary:hover {
    background: color-mix(in srgb, var(--uf-text-primary) 7%, transparent);
  }

  .btn-primary {
    background: var(--uf-accent);
    border-color: var(--uf-accent);
    color: #111;
    box-shadow: 0 10px 22px color-mix(in srgb, var(--uf-accent) 35%, transparent);
  }
  .btn-primary:hover {
    background: var(--uf-accent-strong);
    border-color: var(--uf-accent-strong);
  }

  .btn-primary:active, .btn-secondary:active { transform: translateY(1px); }

  .btn-primary:focus-visible, .btn-secondary:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--uf-accent) 55%, transparent);
  }

  @media (max-width: 600px) {
    .login-dialog__panel { padding: 16px; gap: 14px; }
    .login-dialog__title { font-size: 22px; }
    .login-dialog__footer { flex-direction: column-reverse; }
    .btn-secondary, .btn-primary { width: 100%; min-width: 0; }
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
      styleClass="login-dialog"
      (onHide)="onClose()"
    >
      <div
        class="login-dialog__panel"
        role="dialog"
        [attr.aria-labelledby]="dialogTitleId"
        [attr.aria-describedby]="dialogDescId"
      >
        <button class="login-dialog__close" type="button" aria-label="Close" (click)="onClose()">
          <i class="pi pi-times"></i>
        </button>

        <div class="login-dialog__header-row">
          <div class="login-dialog__icon"><i class="pi pi-lock"></i></div>
          <div>
            <h3 class="login-dialog__title" [id]="dialogTitleId">{{ title }}</h3>
            <p class="login-dialog__text" [id]="dialogDescId">{{ body }}</p>
          </div>
        </div>

        <div class="login-dialog__footer">
          <button class="btn-secondary" type="button" (click)="onClose()">Cancel</button>
          <button class="btn-primary" type="button" (click)="goToLogin()">{{ ctaLabel }}</button>
        </div>
      </div>
    </p-dialog>
  `
})
export class LoginRequiredDialogComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  @Input() title = 'Sign in to submit';
  @Input() body = 'Please log in to submit solutions and track completions.';
  @Input() ctaLabel = 'Go to login';

  dialogTitleId = 'login-dialog-title';
  dialogDescId = 'login-dialog-desc';

  constructor(private router: Router) { }

  onClose() {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  goToLogin() {
    this.onClose();
    this.router.navigate(['/auth/login']);
  }
}
