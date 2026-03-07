import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal, DestroyRef, Injector } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { DashboardGamificationResponse, DashboardProgress } from '../../../core/models/gamification.model';
import { AuthService, User } from '../../../core/services/auth.service';
import { GamificationService } from '../../../core/services/gamification.service';
import { UserProgressService } from '../../../core/services/user-progress.service';
import { SolvedQuestion, SolvedQuestionsService } from '../../../core/services/solved-questions.service';
import { take } from 'rxjs';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { environment } from '../../../../environments/environment';
import { PaymentsProvider, resolvePaymentsProvider } from '../../../core/utils/payments-provider.util';
import { isProActive } from '../../../core/utils/entitlements.util';

type ProfileTab = 'activity' | 'account' | 'billing' | 'security' | 'coupons';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogModule, RouterModule],
  styleUrls: ['./profile.component.css'],
  template: `
    <div class="profile-layout" *ngIf="user(); else loadingTpl">
      <!-- Sidebar -->
      <aside class="profile-sidebar">
        <div class="profile-header">
          <div class="avatar">{{ initials() }}</div>
          <div>
            <h2 class="name">
              {{ user()!.username }}
              <span *ngIf="isPro()" class="badge-premium">⭐ Premium</span>
            </h2>
            <p class="email">{{ user()!.email }}</p>
          </div>
        </div>

        <ul class="profile-info">
          <li><i class="pi pi-id-card"></i> <span>ID: {{ user()!._id | slice:0:8 }}</span></li>
          <li><i class="pi pi-calendar"></i> <span>Joined: {{ user()!.createdAt | date:'dd.MM.yyyy' }}</span></li>
        </ul>
      </aside>

      <!-- Main -->
      <main class="profile-main">
        <nav class="tabs">
          <button [class.active]="tab() === 'activity'" (click)="tab.set('activity')">Activity</button>
          <button [class.active]="tab() === 'account'" (click)="tab.set('account')">Account</button>
          <button [class.active]="tab() === 'billing'" (click)="tab.set('billing')">Billing</button>
          <button [class.active]="tab() === 'security'" (click)="tab.set('security')">Security</button>
          <button [class.active]="tab() === 'coupons'" (click)="tab.set('coupons')">Coupons</button>
        </nav>

        <!-- Activity (solved questions) -->
        <section *ngIf="tab() === 'activity'" class="panel">
          <div class="section">
            <div class="section-head section-head--stack">
              <h3>Progress details</h3>
              <p class="muted">Detailed dashboard activity widgets are available here.</p>
            </div>

            <div class="activity-details-grid">
              <article class="activity-detail-card">
                <p class="detail-kicker">Next best action</p>
                <h4>{{ nextBestAction().title }}</h4>
                <p class="muted">{{ nextBestAction().description }}</p>
                <a class="detail-link" [routerLink]="nextBestAction().route">{{ nextBestAction().cta }} →</a>
              </article>

              <article class="activity-detail-card" *ngIf="weeklyGoal() as weekly; else weeklyDetailFallback">
                <p class="detail-kicker">Weekly goal</p>
                <h4>{{ weekly.completed }} / {{ weekly.target }} completed</h4>
                <div class="detail-bar" role="presentation">
                  <span [style.width.%]="weekly.progress * 100"></span>
                </div>
                <p class="muted">Bonus: +{{ weekly.bonusXp }} XP when completed.</p>
              </article>
              <ng-template #weeklyDetailFallback>
                <article class="activity-detail-card">
                  <p class="detail-kicker">Weekly goal</p>
                  <h4>Unavailable</h4>
                  <p class="muted">We could not load your weekly goal right now.</p>
                </article>
              </ng-template>

              <article class="activity-detail-card" *ngIf="xpLevel() as xp; else xpDetailFallback">
                <p class="detail-kicker">XP + level</p>
                <h4>Level {{ xp.level }} · {{ xp.totalXp }} XP</h4>
                <div class="detail-bar" role="presentation">
                  <span [style.width.%]="xp.progress * 100"></span>
                </div>
                <p class="muted">{{ xp.nextLevelXp - xp.totalXp }} XP to next level.</p>
              </article>
              <ng-template #xpDetailFallback>
                <article class="activity-detail-card">
                  <p class="detail-kicker">XP + level</p>
                  <h4>Unavailable</h4>
                  <p class="muted">We could not load your XP details right now.</p>
                </article>
              </ng-template>

              <article class="activity-detail-card" *ngIf="progressSummary() as progress; else progressDetailFallback">
                <p class="detail-kicker">Overall solved</p>
                <h4>{{ formatPercentLabel(overallSolvedPercent(progress)) }}</h4>
                <div class="detail-bar" role="presentation">
                  <span [style.width.%]="overallSolvedPercent(progress)"></span>
                </div>
                <p class="muted">{{ progress.solvedCount }} solved out of {{ progress.totalCount }} total.</p>
              </article>
              <ng-template #progressDetailFallback>
                <article class="activity-detail-card">
                  <p class="detail-kicker">Overall solved</p>
                  <h4>Unavailable</h4>
                  <p class="muted">We could not load solved coverage right now.</p>
                </article>
              </ng-template>
            </div>

            <p class="muted" *ngIf="activityDetailsLoading()">Refreshing progress details…</p>
            <p class="error" *ngIf="activityDetailsError()">{{ activityDetailsError() }}</p>
          </div>

          <div class="section">
            <div class="section-head">
              <h3>Solved questions</h3>
              <span class="muted" *ngIf="solved().length">{{ solved().length }} total</span>
            </div>

            <ng-container *ngIf="!solvedLoading(); else loadingSolved">
              <ul class="activity-list" *ngIf="solved().length; else noSolved">
                <li *ngFor="let row of solved()">
                  <span class="chip kind" [attr.data-kind]="row.kind">{{ formatKind(row.kind) }}</span>
                  <span class="chip tech">{{ formatTech(row.tech) }}</span>
                  <span class="label">{{ row.title }}</span>
                </li>
              </ul>
            </ng-container>

            <ng-template #loadingSolved>
              <p class="muted">Loading solved questions…</p>
            </ng-template>
            <ng-template #noSolved>
              <p class="muted">No solved questions yet. Start a coding or trivia problem to see it here.</p>
            </ng-template>
          </div>
        </section>

        <!-- Account -->
        <section *ngIf="tab() === 'account'" class="panel">
          <div class="account-card">
            <h4>Name</h4>
            <p class="desc">Shown on your profile. Max 32 characters.</p>
            <input [(ngModel)]="form.username" maxlength="32" />
            <div class="helper">{{ form.username.length || 0 }}/32</div>
            <button class="btn-save" [disabled]="saving() || !dirty()" (click)="save()">Save changes</button>
          </div>

          <div class="account-card">
            <h4>Email</h4>
            <p class="desc">Update your email address.</p>
            <input [(ngModel)]="form.email" />
            <button class="btn-save" [disabled]="saving() || !dirty()" (click)="save()">Save changes</button>
          </div>
        </section>

        <!-- Billing -->
        <section *ngIf="tab() === 'billing'" class="panel">
          <div class="account-card">
            <h4>FrontendAtlas Pro</h4>
            <p class="desc" *ngIf="billing()?.pro?.status === 'lifetime'">You are on the <b>Lifetime</b> plan.</p>
            <p class="desc" *ngIf="isPro() && proStartDate()" data-testid="pro-start-date">
              Started on {{ proStartDate() | date:'mediumDate' }}.
            </p>
            <p class="desc" *ngIf="isPro() && proEndDate()" data-testid="pro-end-date">
              {{ proEndLabel() }} {{ proEndDate() | date:'mediumDate' }}.
            </p>
            <p class="desc" *ngIf="isPro() && billing()?.pro?.status !== 'active' && billing()?.pro?.status !== 'lifetime'">
              Your plan is active.
            </p>
            <p class="desc" *ngIf="!isPro()">
              You are not subscribed.
              <a [routerLink]="['/pricing']">View subscription plans</a>
            </p>
            <div class="promo" *ngIf="!isPro()">
              <strong>Upgrade to FrontendAtlas Pro</strong>
              <p>Get access to premium challenges, guides, and exclusive tracks.</p>
            </div>
            <div class="promo" *ngIf="isPro()">
              <strong>You’re a Premium member</strong>
              <p>Thanks for supporting FrontendAtlas. Premium content is unlocked.</p>
            </div>
          </div>

          <div class="account-card" *ngIf="showManageSubscription()">
            <h4>Manage subscription</h4>
            <p class="desc">
              Manage your subscription and payment methods via {{ manageProviderLabel }}.
            </p>
            <p class="desc" *ngIf="manageError()">{{ manageError() }}</p>
            <button
              class="btn-save"
              data-testid="profile-manage-subscription"
              [disabled]="manageLoading()"
              (click)="openManageSubscription()"
            >
              {{ manageLoading() ? 'Loading…' : 'Manage on ' + manageProviderLabel }}
            </button>
          </div>
        </section>

        <!-- Security -->
        <section *ngIf="tab() === 'security'" class="panel">
          <div class="account-card">
            <h4>Change password</h4>
            <p class="desc">Update your password to keep your account secure.</p>
            <button
              class="btn-save"
              type="button"
              data-testid="profile-change-password-open"
              (click)="openChangePassword()"
            >
              Change password
            </button>
          </div>
        </section>

        <!-- Coupons -->
        <section *ngIf="tab() === 'coupons'" class="panel">
          <h3>Coupons</h3>
          <p class="muted" *ngIf="!user()?.coupons?.length">No coupons available.</p>
          <ul *ngIf="user()?.coupons?.length">
            <li *ngFor="let c of user()!.coupons!">
              <span class="chip">{{ c.code }}</span>
              <span class="muted">{{ c.scope }}</span> ·
              <span class="muted">{{ c.appliedAt | date:'mediumDate' }}</span>
            </li>
          </ul>
        </section>
      </main>
    </div>

    <ng-template #loadingTpl>
      <div class="panel" style="margin:24px">Loading profile…</div>
    </ng-template>

    <p-dialog
      [visible]="changePasswordOpen()"
      (visibleChange)="changePasswordOpen.set($event)"
      [modal]="true"
      [dismissableMask]="true"
      [draggable]="false"
      [resizable]="false"
      header="Change password"
      styleClass="profile-password-dialog"
      (onHide)="resetChangePassword()"
    >
      <div class="password-form" data-testid="profile-change-password-form">
        <label>
          Current password
          <input
            type="password"
            autocomplete="current-password"
            data-testid="profile-change-password-current"
            [(ngModel)]="changePasswordForm.currentPassword"
          />
        </label>
        <label>
          Confirm current password
          <input
            type="password"
            autocomplete="current-password"
            data-testid="profile-change-password-current-confirm"
            [(ngModel)]="changePasswordForm.currentPasswordConfirm"
          />
        </label>
        <label>
          New password
          <input
            type="password"
            autocomplete="new-password"
            data-testid="profile-change-password-new"
            [(ngModel)]="changePasswordForm.newPassword"
          />
        </label>
        <p class="field-error" *ngIf="changePasswordError()" data-testid="profile-change-password-error">
          {{ changePasswordError() }}
        </p>
        <p class="field-success" *ngIf="changePasswordSuccess()" data-testid="profile-change-password-success">
          Password updated.
        </p>
      </div>
      <ng-template pTemplate="footer">
        <button
          class="btn-secondary"
          type="button"
          data-testid="profile-change-password-close"
          (click)="closeChangePassword()"
        >
          Close
        </button>
        <button
          class="btn-save"
          type="button"
          data-testid="profile-change-password-save"
          [disabled]="changePasswordSaving() || !canSubmitChangePassword()"
          (click)="submitChangePassword()"
        >
          Save password
        </button>
      </ng-template>
    </p-dialog>
  `
})
export class ProfileComponent implements OnInit {
  tab = signal<ProfileTab>('activity');
  private readonly availableTabs: readonly ProfileTab[] = ['activity', 'account', 'billing', 'security', 'coupons'];

  user = computed(() => this.auth.user());
  billing = computed(() => this.auth.user()?.billing);
  paymentsProvider = resolvePaymentsProvider(environment);
  manageLoading = signal(false);
  manageError = signal<string | null>(null);
  manageProviderLabel = this.providerLabel(this.paymentsProvider);
  activityDetails = signal<DashboardGamificationResponse | null>(null);
  activityDetailsLoading = signal(false);
  activityDetailsError = signal<string | null>(null);
  nextBestAction = computed(() => {
    const payload = this.activityDetails();
    return (
      payload?.nextBestAction ?? {
        id: 'fallback_continue',
        title: 'Keep your preparation momentum',
        description: 'Continue with one focused coding question and build consistency.',
        route: '/coding',
        cta: 'Continue practice',
      }
    );
  });
  weeklyGoal = computed(() => this.activityDetails()?.weeklyGoal ?? null);
  xpLevel = computed(() => this.activityDetails()?.xpLevel ?? null);
  progressSummary = computed(() => this.activityDetails()?.progress ?? null);

  // Form state (editable subset)
  form: { username: string; email: string } = {
    username: '',
    email: '',
  };

  solved = signal<SolvedQuestion[]>([]);
  solvedLoading = signal(false);
  saving = signal(false);
  changePasswordOpen = signal(false);
  changePasswordSaving = signal(false);
  changePasswordError = signal<string | null>(null);
  changePasswordSuccess = signal(false);
  changePasswordForm = {
    currentPassword: '',
    currentPasswordConfirm: '',
    newPassword: '',
  };

  constructor(
    private auth: AuthService,
    private solvedSvc: SolvedQuestionsService,
    private progress: UserProgressService,
    private route: ActivatedRoute,
    private gamification: GamificationService,
    private destroyRef: DestroyRef,
    private injector: Injector
  ) { }

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const tab = params.get('tab');
        if (this.isProfileTab(tab)) this.tab.set(tab);
      });

    toObservable(this.progress.solvedIds, { injector: this.injector })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((ids) => this.refreshSolved(ids));

    this.loadActivityDetails(false);

    // Load profile
    this.auth.fetchMe().pipe(take(1)).subscribe((u) => {
      if (u) this.resetForm(u);
      this.refreshSolved(Array.isArray(u?.solvedQuestionIds) ? u!.solvedQuestionIds : undefined);
      this.loadActivityDetails(true);
    });
  }

  initials() {
    const u = this.user();
    const s = (u?.username || 'U').trim();
    return s ? s.charAt(0).toUpperCase() : 'U';
  }

  isPro(): boolean {
    return isProActive(this.user());
  }

  proStartDate(): Date | null {
    const lsStartedAt = (this.billing() as any)?.providers?.lemonsqueezy?.startedAt;
    if (lsStartedAt) return new Date(lsStartedAt);
    return null;
  }

  proEndDate(): Date | null {
    const status = (this.user() as any)?.entitlements?.pro?.status;
    if (status === 'lifetime') return null;
    const entValidUntil = (this.user() as any)?.entitlements?.pro?.validUntil;
    if (entValidUntil) return new Date(entValidUntil);
    const legacyRenewsAt = this.billing()?.pro?.renewsAt;
    return legacyRenewsAt ? new Date(legacyRenewsAt) : null;
  }

  proEndLabel(): string {
    const status = (this.user() as any)?.entitlements?.pro?.status;
    if (status === 'cancelled' || status === 'canceled') return 'Access until';
    return 'Renews on';
  }

  overallSolvedPercent(progress: DashboardProgress | null | undefined): number {
    const solvedCount = Number(progress?.solvedCount ?? 0);
    const totalCount = Number(progress?.totalCount ?? 0);
    if (Number.isFinite(totalCount) && totalCount > 0 && Number.isFinite(solvedCount) && solvedCount >= 0) {
      const precise = (solvedCount / totalCount) * 100;
      return Math.max(0, Math.min(100, precise));
    }
    const fallback = Number(progress?.solvedPercent ?? 0);
    if (!Number.isFinite(fallback)) return 0;
    return Math.max(0, Math.min(100, fallback));
  }

  formatPercentLabel(value: number | null | undefined): string {
    const numeric = Number(value ?? 0);
    if (!Number.isFinite(numeric) || numeric <= 0) return '0%';
    const rounded = Math.round(numeric * 100) / 100;
    if (Number.isInteger(rounded)) return `${rounded}%`;
    return `${rounded.toFixed(2).replace(/\.?0+$/, '')}%`;
  }

  openChangePassword(): void {
    this.resetChangePassword();
    this.changePasswordOpen.set(true);
  }

  closeChangePassword(): void {
    this.changePasswordOpen.set(false);
  }

  resetChangePassword(): void {
    this.changePasswordForm = {
      currentPassword: '',
      currentPasswordConfirm: '',
      newPassword: '',
    };
    this.changePasswordError.set(null);
    this.changePasswordSuccess.set(false);
    this.changePasswordSaving.set(false);
  }

  canSubmitChangePassword(): boolean {
    const { currentPassword, currentPasswordConfirm, newPassword } = this.changePasswordForm;
    return !!currentPassword && !!currentPasswordConfirm && !!newPassword;
  }

  submitChangePassword(): void {
    const { currentPassword, currentPasswordConfirm, newPassword } = this.changePasswordForm;
    this.changePasswordError.set(null);
    this.changePasswordSuccess.set(false);

    if (!currentPassword || !currentPasswordConfirm || !newPassword) {
      this.changePasswordError.set('All fields are required.');
      return;
    }
    if (currentPassword !== currentPasswordConfirm) {
      this.changePasswordError.set('Current passwords do not match.');
      return;
    }
    if (!this.isStrongPassword(newPassword)) {
      this.changePasswordError.set('Password must be at least 8 characters and include a letter and a number.');
      return;
    }

    this.changePasswordSaving.set(true);
    this.auth.changePassword(currentPassword, currentPasswordConfirm, newPassword).subscribe({
      next: () => {
        this.changePasswordSaving.set(false);
        this.changePasswordSuccess.set(true);
        this.changePasswordForm = {
          currentPassword: '',
          currentPasswordConfirm: '',
          newPassword: '',
        };
      },
      error: (err) => {
        this.changePasswordSaving.set(false);
        this.changePasswordError.set(err?.error?.error || 'Failed to change password.');
      },
    });
  }

  showManageSubscription(): boolean {
    if (this.paymentsProvider !== 'lemonsqueezy') return false;
    if (this.isPro()) return true;
    const lsMeta = this.user()?.billing?.providers?.lemonsqueezy;
    return !!(lsMeta?.subscriptionId || lsMeta?.customerId);
  }

  openManageSubscription(): void {
    if (this.manageLoading()) return;
    this.manageError.set(null);
    this.manageLoading.set(true);

    this.auth.getManageSubscriptionUrl().subscribe({
      next: ({ url }) => {
        this.manageLoading.set(false);
        if (!url) {
          this.manageError.set('Manage URL is not available yet. Please contact support.');
          return;
        }
        const hook = (window as any).__faCheckoutRedirect;
        if (typeof hook === 'function') {
          hook(url);
          return;
        }
        window.open(url, '_blank', 'noopener');
      },
      error: (err) => {
        this.manageLoading.set(false);
        if (err?.status === 409) {
          this.manageError.set('Manage URL is not available yet. Please contact support.');
        } else if (err?.status === 400) {
          this.manageError.set('Subscription management is not supported for this provider.');
        } else {
          this.manageError.set('Failed to load manage URL. Please try again.');
        }
      },
    });
  }

  private isProfileTab(value: string | null): value is ProfileTab {
    if (!value) return false;
    return (this.availableTabs as readonly string[]).includes(value);
  }

  private loadActivityDetails(force = false): void {
    if (!this.auth.isLoggedIn()) {
      this.activityDetails.set(null);
      this.activityDetailsLoading.set(false);
      this.activityDetailsError.set(null);
      return;
    }

    this.activityDetailsLoading.set(true);
    this.activityDetailsError.set(null);

    this.gamification
      .getDashboard({ force })
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (payload) => {
          this.activityDetails.set(payload);
          this.activityDetailsLoading.set(false);
        },
        error: () => {
          this.activityDetails.set(null);
          this.activityDetailsLoading.set(false);
          this.activityDetailsError.set('Unable to load activity details right now.');
        },
      });
  }

  private providerLabel(provider: PaymentsProvider): string {
    switch (provider) {
      case 'gumroad':
        return 'Gumroad';
      case 'lemonsqueezy':
        return 'LemonSqueezy';
      case 'stripe':
        return 'Stripe';
      default:
        return 'Provider';
    }
  }

  private isStrongPassword(value: string): boolean {
    return /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(value || '');
  }

  private resetForm(u: User) {
    this.form = {
      username: u.username,
      email: u.email,
    };
  }

  /** Has anything changed? */
  dirty(): boolean {
    const u = this.user();
    if (!u) return false;
    return (
      u.username !== this.form.username ||
      u.email !== this.form.email
    );
  }

  formatTech(t: string): string {
    if (t === 'system-design') return 'System design';
    if (t === 'unknown') return 'Unknown';
    return t.replace(/-/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
  }

  formatKind(k: string): string {
    if (k === 'system-design') return 'System design';
    if (k === 'coding') return 'Coding';
    if (k === 'trivia') return 'Trivia';
    if (k === 'debug') return 'Debug';
    return 'Unknown';
  }

  save() {
    const u = this.user();
    if (!u || !this.dirty()) return;
    this.saving.set(true);
    this.auth
      .updateProfile(u._id, {
        username: this.form.username,
        email: this.form.email,
      })
      .subscribe({
        next: (updated) => {
          this.resetForm(updated);
          this.saving.set(false);
        },
        error: () => this.saving.set(false),
      });
  }

  private refreshSolved(ids?: string[]) {
    this.solvedLoading.set(true);
    const resolvedIds = ids ?? this.progress.solvedIds();

    this.solvedSvc.resolved(resolvedIds)
      .pipe(take(1))
      .subscribe({
        next: (rows) => {
          this.solved.set(rows || []);
          this.solvedLoading.set(false);
        },
        error: () => {
          this.solved.set([]);
          this.solvedLoading.set(false);
        },
      });
  }
}
