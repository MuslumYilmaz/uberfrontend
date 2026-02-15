import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { PremiumGateReason } from '../../../core/services/premium-gate.service';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { OnboardingService } from '../../../core/services/onboarding.service';
import {
  freeChallengeForFramework,
  frameworkLabel,
  preferredFramework,
  timelineLabel,
} from '../../../core/utils/onboarding-personalization.util';

const COPY: Record<PremiumGateReason, { title: string; body: string }> = {
  tracks: {
    title: 'Premium tracks',
    body: 'These learning tracks are available on Premium. Use previews/free practice now, then upgrade when you need full depth.',
  },
  company: {
    title: 'Premium company questions',
    body: 'Company routes stay premium. You can still review public previews and free challenges before buying.',
  },
  generic: {
    title: 'This question is part of Premium',
    body: 'This challenge is premium. Keep practicing free questions now, or upgrade to unlock full access.',
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

    .premium-dialog__meta {
      margin: -2px 0 0;
      font-size: 12px;
      line-height: 1.45;
      color: color-mix(in srgb, var(--uf-text-secondary) 86%, transparent);
      font-weight: 600;
    }

    .premium-dialog__paths {
      display: grid;
      gap: 8px;
      margin-top: 2px;
      text-align: left;
    }

    .premium-dialog__path {
      border: 1px solid color-mix(in srgb, var(--uf-border-subtle) 75%, transparent);
      background: color-mix(in srgb, var(--uf-surface) 86%, transparent);
      border-radius: 10px;
      color: var(--uf-text-primary);
      padding: 9px 10px;
      cursor: pointer;
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      transition: border-color .15s ease, background-color .15s ease;
    }
    .premium-dialog__path:hover {
      border-color: color-mix(in srgb, var(--uf-accent) 45%, var(--uf-border-subtle));
      background: color-mix(in srgb, var(--uf-surface) 78%, transparent);
    }
    .premium-dialog__path i {
      color: var(--uf-accent);
      font-size: 12px;
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
        <p class="premium-dialog__meta" *ngIf="personalizedLine">{{ personalizedLine }}</p>

        <div class="premium-dialog__paths">
          <button class="premium-dialog__path" type="button" (click)="goToFreeChallenge()">
            <span>{{ freeChallengeLabel }}</span>
            <i class="pi pi-arrow-right"></i>
          </button>
          <button class="premium-dialog__path" type="button" *ngIf="hasPreviewAction" (click)="goToPreview()">
            <span>Open public preview first</span>
            <i class="pi pi-arrow-right"></i>
          </button>
        </div>

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

  constructor(
    private router: Router,
    private analytics: AnalyticsService,
    private onboarding: OnboardingService,
  ) { }

  get title(): string {
    return (COPY[this.context] || COPY.generic).title;
  }

  get body(): string {
    return (COPY[this.context] || COPY.generic).body;
  }

  get personalizedLine(): string | null {
    const profile = this.onboarding.getProfile();
    if (!profile) return null;
    const framework = preferredFramework(profile);
    return `You selected ${frameworkLabel(framework)} with a ${timelineLabel(profile.timeline)}. Premium unlocks deeper guided coverage for that path.`;
  }

  get freeChallengeLabel(): string {
    const profile = this.onboarding.getProfile();
    return freeChallengeForFramework(preferredFramework(profile)).label;
  }

  get hasPreviewAction(): boolean {
    return !!this.resolvePreviewRoute();
  }

  onClose() {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  goToPricing() {
    this.trackGateClick('view_pricing');
    this.onClose();
    this.router.navigate(['/pricing'], {
      queryParams: this.buildPricingParams(),
    });
  }

  goToLogin() {
    this.trackGateClick('go_login');
    this.onClose();
    this.router.navigate(['/auth/login'], {
      queryParams: this.targetUrl ? { redirectTo: this.targetUrl } : undefined,
    });
  }

  goToFreeChallenge() {
    this.trackGateClick('free_challenge');
    this.onClose();
    const profile = this.onboarding.getProfile();
    const challenge = freeChallengeForFramework(preferredFramework(profile));
    this.router.navigate(challenge.route, {
      queryParams: { src: 'premium_gate_free_path' },
    });
  }

  goToPreview() {
    const preview = this.resolvePreviewRoute();
    if (!preview) return;
    this.trackGateClick('open_preview');
    this.onClose();
    this.router.navigate(preview, {
      queryParams: { src: 'premium_gate_preview_path' },
    });
  }

  private buildPricingParams(): Record<string, string> {
    const params: Record<string, string> = { src: 'premium_gate_dialog' };
    const profile = this.onboarding.getProfile();
    if (this.targetUrl) params['redirectTo'] = this.targetUrl;
    if (profile) {
      params['framework'] = profile.framework;
      params['timeline'] = profile.timeline;
    }
    return params;
  }

  private resolvePreviewRoute(): any[] | null {
    if (!this.targetUrl) return null;
    const normalized = this.targetUrl.split('?')[0];
    const trackMatch = normalized.match(/^\/tracks\/([^/]+)/i);
    if (trackMatch?.[1]) return ['/tracks', trackMatch[1], 'preview'];
    const companyMatch = normalized.match(/^\/companies\/([^/]+)/i);
    if (companyMatch?.[1]) return ['/companies', companyMatch[1], 'preview'];
    return null;
  }

  private trackGateClick(action: string): void {
    const profile = this.onboarding.getProfile();
    this.analytics.track('premium_gate_path_clicked', {
      action,
      context: this.context,
      target_url: this.targetUrl || null,
      is_logged_in: this.isLoggedIn,
      framework: profile?.framework ?? null,
      timeline: profile?.timeline ?? null,
      target_role: profile?.targetRole ?? null,
    });
  }
}
