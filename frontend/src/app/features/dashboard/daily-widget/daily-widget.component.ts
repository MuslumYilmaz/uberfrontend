import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
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
  private authSvc = inject(AuthService);
  private actSvc = inject(ActivityService);
  private dailySvc = inject(DailyService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);


  auth = this.authSvc; // template access

  items: Array<{ kind: Kind; label: string; durationMin: number; to: any[] }> = [
    {
      kind: 'coding',
      label: 'Solve 1 coding exercise',
      durationMin: 15,
      to: ['/', (defaultPrefs().defaultTech as 'javascript' | 'angular' | undefined) ?? 'javascript', 'coding']
    },
    {
      kind: 'trivia',
      label: 'Answer 5 trivia questions',
      durationMin: 10,
      to: ['/', (defaultPrefs().defaultTech as 'javascript' | 'angular' | undefined) ?? 'javascript', 'trivia']
    },
    {
      kind: 'debug',
      label: 'Fix 1 bug in Debug',
      durationMin: 10,
      to: ['/', (defaultPrefs().defaultTech as 'javascript' | 'angular' | undefined) ?? 'javascript', 'debug']
    },
  ];

  private dailySig = this.dailySvc.daily;
  private kindsFromServer = signal<Set<Kind>>(new Set());
  private justCompletedKinds = signal<Set<Kind>>(new Set());

  doneKinds = computed<Set<Kind>>(() => {
    const merged = new Set<Kind>();
    const d = this.dailySig();
    for (const it of d?.items ?? []) if (it.state?.completedAt) merged.add(it.kind as Kind);
    for (const k of this.kindsFromServer()) merged.add(k);
    for (const k of this.justCompletedKinds()) merged.add(k);
    return merged;
  });

  // summary mirror from ActivityService (cached/TTL)
  streak = computed(() => this.actSvc.summarySig()?.streak?.current ?? this.authSvc.user()?.stats?.streak?.current ?? 0);
  xpTotal = computed(() => this.actSvc.summarySig()?.totalXp ?? this.authSvc.user()?.stats?.xpTotal ?? 0);

  totalCount = computed(() => this.items.length);
  completedCount = computed(() => this.doneKinds().size);
  progress = computed(() => {
    const t = this.totalCount(), d = this.completedCount();
    return t > 0 ? d / t : 0;
  });

  currentTech = signal<'javascript' | 'angular'>(
    (defaultPrefs().defaultTech as 'javascript' | 'angular' | undefined) ?? 'javascript'
  );

  ngOnInit(): void {
    // ensure daily exists + warm summary cache (deduped/TTL)
    this.dailySvc.ensureTodaySet(this.currentTech());
    this.actSvc.getSummary().pipe(take(1), takeUntilDestroyed(this.destroyRef)).subscribe();

    // route-driven current tech + pull today rows (cached/TTL)
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd), startWith(null), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const seg = this.router.url.split('?')[0].split('#')[0].split('/').filter(Boolean)[0] as any;
        if (seg === 'javascript' || seg === 'angular') this.currentTech.set(seg);
        this.dailySvc.ensureTodaySet(this.currentTech());
        this.pullTodayFromServer(); // cached unless forced
      });

    // on completions: mark locally + force-refresh caches once
    this.actSvc.activityCompleted$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((evt) => {
        const k = evt?.kind as Kind | undefined;
        if (k === 'coding' || k === 'trivia' || k === 'debug') {
          const next = new Set(this.justCompletedKinds());
          next.add(k);
          this.justCompletedKinds.set(next);
        }
        this.dailySvc.ensureTodaySet(this.currentTech());
        this.actSvc.getSummary({ force: true }).pipe(take(1), takeUntilDestroyed(this.destroyRef)).subscribe();
        this.pullTodayFromServer(true);
      });
  }

  /** recent() via shared cached pipe (force on completion) */
  private pullTodayFromServer(force = false) {
    if (!this.authSvc.isLoggedIn()) return;

    const now = new Date();
    const since = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;

    this.actSvc.getRecent({ since }, { force }).pipe(take(1), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (rows) => {
        const set = new Set<Kind>();
        for (const r of rows || []) {
          if (r.kind === 'coding' || r.kind === 'trivia' || r.kind === 'debug') set.add(r.kind as Kind);
        }
        this.kindsFromServer.set(set);
      },
      error: () => { /* keep last */ }
    });
  }
}