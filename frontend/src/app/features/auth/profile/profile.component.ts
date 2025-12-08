import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivityEvent, ActivityService } from '../../../core/services/activity.service';
import { AuthService, User, UserPrefs } from '../../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

        <!-- Activity (Recent only) -->
        <section *ngIf="tab() === 'activity'" class="panel">
          <div class="section">
            <h3>Recent Activity</h3>
            <ul class="activity-list" *ngIf="recent().length; else noRecent">
              <li *ngFor="let ev of recent()">
                <span class="chip kind" [attr.data-kind]="ev.kind">{{ ev.kind }}</span>
                <span class="chip tech">{{ ev.tech }}</span>
                <span class="label">{{ ev.itemId || 'Practice' }}</span>
                <span class="muted">{{ ev.durationMin }}m · {{ ev.xp }} XP · {{ ev.completedAt | date:'mediumDate' }}</span>
              </li>
            </ul>
            <ng-template #noRecent>
              <p class="muted">No recent activity yet.</p>
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

          <div class="account-card">
            <h4>Bio</h4>
            <p class="desc">A short bio (max 280 chars).</p>
            <textarea [(ngModel)]="form.bio" maxlength="280"></textarea>
            <div class="helper">{{ form.bio.length || 0 }}/280</div>
            <button class="btn-save" [disabled]="saving() || !dirty()" (click)="save()">Save changes</button>
          </div>

          <div class="account-card">
            <h4>Preferences</h4>
            <div class="grid2">
              <label>Timezone
                <input [(ngModel)]="form.prefs.tz" />
              </label>
              <label>Theme
                <select [(ngModel)]="form.prefs.theme">
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                  <option value="system">System</option>
                </select>
              </label>
              <label>Default Tech
                <select [(ngModel)]="form.prefs.defaultTech">
                  <option value="javascript">JavaScript</option>
                  <option value="angular">Angular</option>
                </select>
              </label>
              <label>Keyboard
                <select [(ngModel)]="form.prefs.keyboard">
                  <option value="default">Default</option>
                  <option value="vim">Vim</option>
                </select>
              </label>
              <label class="row">
                <input type="checkbox" [(ngModel)]="form.prefs.marketingEmails" />
                Marketing emails
              </label>
            </div>
            <button class="btn-save" [disabled]="saving() || !dirty()" (click)="save()">Save changes</button>
          </div>
        </section>

        <!-- Billing -->
        <section *ngIf="tab() === 'billing'" class="panel">
          <div class="account-card">
            <h4>UberFrontend Pro</h4>
            <p class="desc" *ngIf="billing()?.pro?.status === 'lifetime'">You are on the <b>Lifetime</b> plan.</p>
            <p class="desc" *ngIf="billing()?.pro?.status === 'active'">
              Your subscription renews on {{ billing()?.pro?.renewsAt | date:'mediumDate' }}.
            </p>
            <p class="desc" *ngIf="!billing() || billing()?.pro?.status === 'none'">You are not subscribed.</p>
          </div>

          <div class="account-card">
            <h4>UberFrontend Projects</h4>
            <p class="desc" *ngIf="billing()?.projects?.status === 'active'">
              Your subscription renews on {{ billing()?.projects?.renewsAt | date:'mediumDate' }}.
            </p>
            <p class="desc" *ngIf="!billing() || billing()?.projects?.status === 'none'">
              You are not subscribed. <a href="#">View subscription plans</a>
            </p>
            <div class="promo">
              <strong>Upgrade to Premium Projects</strong>
              <p>Get access to premium challenges, guides, and exclusive tracks.</p>
            </div>
          </div>

          <div class="account-card">
            <h4>Manage subscription</h4>
            <p class="desc">Manage your subscription and payment methods via Stripe.</p>
            <button class="btn-save" disabled>Manage on Stripe</button>
          </div>
        </section>

        <!-- Security -->
        <section *ngIf="tab() === 'security'" class="panel">
          <div class="account-card">
            <h4>Change password</h4>
            <p class="desc">Password changes will be enabled once the endpoint is added.</p>
            <button class="btn-save" disabled>Change password</button>
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
  `
})
export class ProfileComponent implements OnInit {
  tab = signal<'activity' | 'account' | 'billing' | 'security' | 'coupons'>('activity');

  user = computed(() => this.auth.user());
  billing = computed(() => this.auth.user()?.billing);

  // Form state (editable subset)
  form: { username: string; email: string; bio: string; prefs: UserPrefs } = {
    username: '',
    email: '',
    bio: '',
    prefs: {
      tz: 'Europe/Istanbul',
      theme: 'dark',
      defaultTech: 'javascript',
      keyboard: 'default',
      marketingEmails: false
    },
  };

  recent = signal<ActivityEvent[]>([]);
  saving = signal(false);

  constructor(private auth: AuthService, private activity: ActivityService) { }

  ngOnInit(): void {
    // Load profile
    this.auth.ensureMe().subscribe((u) => {
      if (u) this.resetForm(u);
    });

    // Load only recent activity for MVP
    this.loadRecent();

    // Refresh recent after completions
    this.activity.activityCompleted$.subscribe(() => this.loadRecent());
  }

  private loadRecent() {
    if (!this.auth.isLoggedIn()) {
      this.recent.set([]);
      return;
    }
    this.activity.recent({ limit: 10 }).subscribe({
      next: (rows) => this.recent.set(rows || []),
      error: () => this.recent.set([]),
    });
  }

  initials() {
    const u = this.user();
    const s = (u?.username || 'U').trim();
    return s ? s.charAt(0).toUpperCase() : 'U';
  }

  isPro(): boolean {
    const b = this.billing();
    return !!b && (b.pro?.status === 'lifetime' || b.pro?.status === 'active');
  }

  private resetForm(u: User) {
    this.form = {
      username: u.username,
      email: u.email,
      bio: u.bio || '',
      prefs: {
        tz: u.prefs?.tz || 'Europe/Istanbul',
        theme: u.prefs?.theme || 'dark',
        defaultTech: u.prefs?.defaultTech || 'javascript',
        keyboard: u.prefs?.keyboard || 'default',
        marketingEmails: !!u.prefs?.marketingEmails,
      },
    };
  }

  /** Has anything changed? */
  dirty(): boolean {
    const u = this.user();
    if (!u) return false;
    return (
      u.username !== this.form.username ||
      u.email !== this.form.email ||
      (u.bio || '') !== (this.form.bio || '') ||
      u.prefs?.tz !== this.form.prefs.tz ||
      u.prefs?.theme !== this.form.prefs.theme ||
      u.prefs?.defaultTech !== this.form.prefs.defaultTech ||
      u.prefs?.keyboard !== this.form.prefs.keyboard ||
      !!u.prefs?.marketingEmails !== !!this.form.prefs.marketingEmails
    );
  }

  save() {
    const u = this.user();
    if (!u || !this.dirty()) return;
    this.saving.set(true);
    this.auth
      .updateProfile(u._id, {
        username: this.form.username,
        email: this.form.email,
        bio: this.form.bio,
        prefs: { ...this.form.prefs },
      })
      .subscribe({
        next: (updated) => {
          this.resetForm(updated);
          this.saving.set(false);
        },
        error: () => this.saving.set(false),
      });
  }
}
