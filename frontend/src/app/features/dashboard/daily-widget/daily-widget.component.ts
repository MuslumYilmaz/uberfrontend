// shared/components/daily-widget/daily-widget.component.ts
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter, startWith, take } from 'rxjs';
import { defaultPrefs } from '../../../core/models/user.model';
import { ActivityService } from '../../../core/services/activity.service';
import { AuthService } from '../../../core/services/auth.service';
import { DailyService } from '../../../core/services/daily.service';
import { StatsService } from '../../../core/services/stats.service';

type Kind = 'coding' | 'trivia' | 'debug';

@Component({
  selector: 'app-daily-widget',
  standalone: true,
  imports: [CommonModule, RouterModule],
  styleUrls: ['./daily-widget.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="dw-card">
    <div class="dw-head">
      <div class="dw-title">Today’s set</div>
      <ng-container *ngIf="auth.isLoggedIn(); else signedOutBadge">
        <div class="dw-streak">🔥 {{ streak() }} <span class="dw-sub">streak</span></div>
        <div class="dw-xp">⭐ {{ xpTotal() }} XP</div>
      </ng-container>
      <ng-template #signedOutBadge>
        <div class="dw-xp">Sign in to track</div>
      </ng-template>
    </div>

    <div class="dw-progress" *ngIf="auth.isLoggedIn()">
      <div class="dw-bar"><div class="dw-fill" [style.width.%]="progress()*100"></div></div>
      <div class="dw-progress-text">{{ completedCount() }}/{{ totalCount() }} done</div>
    </div>

    <ul class="dw-list">
      <li *ngFor="let it of items">
        <a class="dw-row" [routerLink]="it.to" [title]="'Open ' + it.label">
          <input type="checkbox"
                 [checked]="doneKinds().has(it.kind)"
                 disabled
                 aria-readonly="true"
                 [attr.aria-label]="it.label + (doneKinds().has(it.kind) ? ' (completed today)' : '')">
          <span class="dw-kind" [attr.data-kind]="it.kind">{{ it.kind }}</span>
          <span class="dw-label">{{ it.label }}</span>
          <span class="dw-time">{{ it.durationMin }}m</span>
        </a>
      </li>
    </ul>

    <div class="dw-hint" aria-hidden="true">Progress is marked when you complete something in that category.</div>
  </div>
  `
})
export class DailyWidgetComponent implements OnInit {
  // services
  private authSvc = inject(AuthService);
  private actSvc = inject(ActivityService);
  private statsSvc = inject(StatsService);
  private dailySvc = inject(DailyService);
  private router = inject(Router);

  auth = this.authSvc; // template access

  // fixed rows
  items: Array<{ kind: Kind; label: string; durationMin: number; to: any[] }> = [
    { kind: 'coding', label: 'Solve 1 coding exercise', durationMin: 15, to: ['/', defaultPrefs().defaultTech || 'javascript', 'coding'] },
    { kind: 'trivia', label: 'Answer 5 trivia questions', durationMin: 10, to: ['/', defaultPrefs().defaultTech || 'javascript', 'trivia'] },
    { kind: 'debug', label: 'Fix 1 bug in Debug', durationMin: 10, to: ['/', defaultPrefs().defaultTech || 'javascript', 'debug'] },
  ];

  // signals
  private dailySig = this.dailySvc.daily;
  private kindsFromServer = signal<Set<Kind>>(new Set());
  private justCompletedKinds = signal<Set<Kind>>(new Set());

  doneKinds = computed<Set<Kind>>(() => {
    const merged = new Set<Kind>();

    const d = this.dailySig();
    for (const it of d?.items ?? []) {
      if (it.state?.completedAt) merged.add(it.kind as Kind);
    }
    for (const k of this.kindsFromServer()) merged.add(k);
    for (const k of this.justCompletedKinds()) merged.add(k);

    return merged;
  });

  // mirror Header: read ActivityService.summarySig (fallback to AuthService)
  streak = computed(() =>
    this.actSvc.summarySig()?.streak?.current
    ?? this.authSvc.user()?.stats?.streak?.current
    ?? 0
  );
  xpTotal = computed(() =>
    this.actSvc.summarySig()?.totalXp
    ?? this.authSvc.user()?.stats?.xpTotal
    ?? 0
  );

  // progress
  totalCount = computed(() => this.items.length);
  completedCount = computed(() => this.doneKinds().size);
  progress = computed(() => {
    const t = this.totalCount(), d = this.completedCount();
    return t > 0 ? d / t : 0;
  });

  // current tech
  currentTech = signal<'javascript' | 'angular'>(
    (defaultPrefs().defaultTech as 'javascript' | 'angular') || 'javascript'
  );

  ngOnInit(): void {
    // seed daily & summary
    this.dailySvc.ensureTodaySet(this.currentTech());
    this.actSvc.refreshSummary();

    // keep current tech + daily list seeded
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd), startWith(null), takeUntilDestroyed())
      .subscribe(() => {
        const seg = this.router.url.split('?')[0].split('#')[0].split('/').filter(Boolean)[0] as any;
        if (seg === 'javascript' || seg === 'angular') this.currentTech.set(seg);
        this.dailySvc.ensureTodaySet(this.currentTech());
        this.pullTodayFromServer();
      });

    // one-time fetches
    if (this.authSvc.isLoggedIn()) this.authSvc.ensureMe().pipe(take(1), takeUntilDestroyed()).subscribe();
    this.statsSvc.loadHeatmap();
    this.pullTodayFromServer();

    // react to completions (no NgZone/CDR needed)
    this.actSvc.activityCompleted$
      .pipe(takeUntilDestroyed())
      .subscribe((evt) => {
        const k = evt?.kind as Kind | undefined;
        if (k === 'coding' || k === 'trivia' || k === 'debug') {
          const next = new Set(this.justCompletedKinds());
          next.add(k);
          this.justCompletedKinds.set(next);
        }
        this.actSvc.refreshSummary();
        this.dailySvc.ensureTodaySet(this.currentTech());
        this.authSvc.ensureMe().pipe(take(1), takeUntilDestroyed()).subscribe();
        this.statsSvc.loadHeatmap();
        this.pullTodayFromServer();
      });
  }

  /** Always fetch from server. */
  private pullTodayFromServer() {
    if (!this.authSvc.isLoggedIn()) return;

    const today = new Date();
    const y = today.getUTCFullYear();
    const m = String(today.getUTCMonth() + 1).padStart(2, '0');
    const d = String(today.getUTCDate()).padStart(2, '0');
    const since = `${y}-${m}-${d}`;

    this.actSvc.recent({ since })
      .pipe(take(1), takeUntilDestroyed())
      .subscribe({
        next: (rows) => {
          const set = new Set<Kind>();
          for (const r of rows || []) {
            if (r.kind === 'coding' || r.kind === 'trivia' || r.kind === 'debug') set.add(r.kind as Kind);
          }
          this.kindsFromServer.set(set);
        },
        error: () => { /* keep last view */ }
      });
  }
}