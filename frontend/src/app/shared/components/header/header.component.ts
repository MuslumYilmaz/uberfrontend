import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter, startWith } from 'rxjs';
import { defaultPrefs } from '../../../core/models/user.model';
import { ActivityService, ActivitySummary } from '../../../core/services/activity.service';
import { AuthService } from '../../../core/services/auth.service';
import { DailyService } from '../../../core/services/daily.service';
import {
  PREPARE_GROUPS,
  PrepareGroup,
  PrepareItem,
  TargetName
} from '../../shared/prepare/prepare.registry';

type Mode =
  | 'dashboard'
  | 'tech-list'
  | 'tech-detail'
  | 'sd-list'
  | 'sd-detail'
  | 'course'
  | 'profile';

const EMPTY_SUMMARY: ActivitySummary = {
  totalXp: 0,
  level: 1,
  nextLevelXp: 100,
  levelProgress: { current: 0, needed: 100, pct: 0 },
  streak: { current: 0, best: 0 },
  freezeTokens: 0,
  weekly: { completed: 0, target: 5, progress: 0 },
  today: { completed: 0, total: 1, progress: 0 },
};

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  styleUrls: ['./header.component.css'],
  template: `
    <div class="ufh-topbar" role="banner">
      <div class="ufh-inner">
        <!-- LEFT -->
        <div class="ufh-left">
          <a class="ufh-brand" routerLink="/">UberFrontend</a>

          <nav *ngIf="showTechTabs()" class="ufh-tabs">
            <a [routerLink]="'/javascript'"
               class="ufh-tab"
               [class.ufh-tab-active]="currentTech()==='javascript'">
              <span class="ufh-tab-ico">
                <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
                  <rect x="2" y="2" width="28" height="28" rx="4" fill="#F7DF1E"></rect>
                  <text x="16" y="21" text-anchor="middle" font-size="14" font-weight="700"
                        font-family="Inter,system-ui,-apple-system,Segoe UI,Roboto,'Helvetica Neue',Arial,'Noto Sans'"
                        fill="#111">JS</text>
                </svg>
              </span>
              JavaScript
            </a>

            <a [routerLink]="'/angular'"
               class="ufh-tab"
               [class.ufh-tab-active]="currentTech()==='angular'">
              <span class="ufh-tab-ico">
                <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
                  <polygon points="16,2 29,7 27,26 16,30 5,26 3,7" fill="#DD0031"></polygon>
                  <polygon points="16,5 26.2,8.9 24.8,24.5 16,27.7 7.2,24.5 5.8,8.9" fill="#C3002F"></polygon>
                  <text x="16" y="21" text-anchor="middle" font-size="14" font-weight="800"
                        font-family="Inter,system-ui,-apple-system,Segoe UI,Roboto,'Helvetica Neue',Arial,'Noto Sans'"
                        fill="#fff">A</text>
                </svg>
              </span>
              Angular
            </a>

            <a [routerLink]="'/system-design'"
               class="ufh-tab"
               [class.ufh-tab-active]="isSystemDesign()">System design</a>
          </nav>
        </div>

        <!-- CENTER -->
        <div class="ufh-center">
          <button *ngIf="showPrepareTrigger()"
                  class="ufh-pill"
                  (click)="toggleMega()"
                  aria-haspopup="menu"
                  [attr.aria-expanded]="megaOpen()"
                  aria-controls="prepare-mega">
            Prepare ▾
          </button>
        </div>

        <!-- RIGHT -->
        <div class="ufh-right" (click)="$event.stopPropagation()">
          <div class="ufh-stats" *ngIf="true">
            <button class="ufh-stats-pill"
                    (click)="toggleStatsMenu()"
                    aria-haspopup="menu"
                    [attr.aria-expanded]="statsOpen()"
                    title="Streak · Level">
              <span aria-hidden="true">🔥</span>
              <span class="ufh-stats-num">{{ streakNum() }}</span>
              <span class="ufh-dot">·</span>
              <span class="ufh-stats-num">L{{ level() }}</span>
            </button>

            <div *ngIf="statsOpen()" class="ufh-stats-menu" role="menu">
              <div class="ufh-stats-header">
                <div class="ufh-stat">
                  <div class="big">🔥 {{ streakNum() }}</div>
                  <div class="sub">day streak</div>
                </div>
                <div class="ufh-stat">
                  <div class="big">L{{ level() }}</div>
                  <div class="sub">{{ levelProgressPct() }}% to L{{ level()+1 }}</div>
                </div>
              </div>

              <!-- Level progress -->
              <div class="ufh-prog">
                <div class="ufh-prog-bar">
                  <div class="ufh-prog-fill" [style.width.%]="levelProgressPct()"></div>
                </div>
                <div class="ufh-prog-text">Level progress</div>
              </div>

              <!-- Weekly goal -->
              <div class="ufh-prog">
                <div class="ufh-prog-bar">
                  <div class="ufh-prog-fill" [style.width.%]="weeklyProgressPct()"></div>
                </div>
                <div class="ufh-prog-text">{{ weeklyCompleted() }}/{{ weeklyTarget() }} this week
                  <span *ngIf="freezeTokens()>0" class="ufh-badge">Freeze: {{ freezeTokens() }}</span>
                </div>
              </div>

              <!-- Today progress (kept) -->
              <div class="ufh-prog">
                <div class="ufh-prog-bar">
                  <div class="ufh-prog-fill" [style.width.%]="todayProgressPct()"></div>
                </div>
                <div class="ufh-prog-text">{{ todayCompleted() }}/{{ todayTotal() }} done today</div>
              </div>

              <ul class="ufh-stats-list" *ngIf="(daily()?.items?.length || 0) > 0">
                <li *ngFor="let it of daily()?.items || []">
                  <a class="ufh-stats-link" [routerLink]="it.to" (click)="closeAll()">
                    <span class="ufh-kind" [attr.data-kind]="it.kind">{{ it.kind }}</span>
                    <span class="ufh-label">{{ it.label }}</span>
                    <span class="ufh-time">{{ it.durationMin }}m</span>
                    <i class="pi"
                       [ngClass]="it.state?.completedAt ? 'pi-check-circle text-green-400' : 'pi-chevron-right opacity-60'"></i>
                  </a>
                </li>
              </ul>

              <div *ngIf="!auth.isLoggedIn()" class="ufh-prog-text" style="margin-top:8px;">
                Log in to track your streak & levels.
              </div>
            </div>
          </div>

          <div class="ufh-profile ufh-profile-right">
            <button class="ufh-avatar"
                    (click)="toggleProfileMenu()"
                    aria-haspopup="menu"
                    [attr.aria-expanded]="profileOpen()">
              <i class="pi pi-user"></i>
            </button>

            <div *ngIf="profileOpen()" class="ufh-menu" role="menu">
              <div class="ufh-menu-section">Account</div>

              <ng-container *ngIf="auth.isLoggedIn(); else profileDisabled">
                <a class="ufh-menu-item" routerLink="/profile" (click)="closeAll()">
                  <i class="pi pi-user"></i> My profile
                </a>
              </ng-container>
              <ng-template #profileDisabled>
                <button class="ufh-menu-item" disabled>
                  <i class="pi pi-user"></i> My profile
                </button>
              </ng-template>

              <button class="ufh-menu-item" disabled><i class="pi pi-check-circle"></i> Progress</button>
              <button class="ufh-menu-item" disabled><i class="pi pi-bookmark"></i> Bookmarks</button>
              <button class="ufh-menu-item"><i class="pi pi-moon"></i> Theme</button>
              <button class="ufh-menu-item"><i class="pi pi-sliders-h"></i> Keyboard shortcuts</button>
              <div class="ufh-divider"></div>

              <ng-container *ngIf="!auth.isLoggedIn(); else loggedInTpl">
                <button class="ufh-menu-item" routerLink="/auth/signup" (click)="closeAll()">
                  <i class="pi pi-user-plus"></i> Sign up
                </button>
                <button class="ufh-menu-item" routerLink="/auth/login" (click)="closeAll()">
                  <i class="pi pi-sign-in"></i> Log in
                </button>
              </ng-container>

              <ng-template #loggedInTpl>
                <button class="ufh-menu-item" (click)="logout()">
                  <i class="pi pi-sign-out"></i> Log out
                </button>
              </ng-template>
            </div>
          </div>
        </div>
      </div>

      <!-- MEGA MENU -->
      <ng-container *ngIf="megaOpen()">
        <div class="ufh-backdrop" (click)="closeAll()"></div>
        <div id="prepare-mega" class="ufh-mega"
             (click)="$event.stopPropagation()"
             (keydown.escape)="closeAll()" tabindex="-1" role="menu" aria-label="Prepare menu">
          <div class="ufh-mega-inner">
            <div class="ufh-rail">
              <button *ngFor="let g of groups; trackBy: trackByGroupKey"
                      class="ufh-rail-item"
                      [class.ufh-rail-active]="g.key===activeGroupKey()"
                      (click)="activeGroupKey.set(g.key)">
                <span class="ufh-rail-text">{{ g.title }}</span>
                <i class="pi pi-chevron-right ufh-rail-caret"></i>
              </button>
            </div>

            <div class="ufh-pane">
              <a *ngIf="continueLink() as cont"
                 class="ufh-card ufh-card-continue"
                 [routerLink]="cont.to"
                 (click)="closeAll()">
                <div class="ufh-card-icon"><i class="pi pi-play-circle"></i></div>
                <div class="ufh-card-body">
                  <div class="ufh-card-title">Continue</div>
                  <div class="ufh-card-sub">{{ cont.label }}</div>
                  <div class="ufh-skel"></div>
                </div>
                <div aria-hidden="true">→</div>
              </a>

              <ng-container *ngFor="let item of activeItems(); trackBy: trackByItemKey">
                <div *ngIf="item.disabled || item.intent!=='route' || !item.target; else enabledRow"
                     class="ufh-card ufh-card-disabled" role="button" aria-disabled="true" tabindex="-1">
                  <div class="ufh-card-icon"><i class="pi" [ngClass]="item.pi"></i></div>
                  <div class="ufh-card-body">
                    <div class="ufh-card-title">
                      {{ item.title }}
                      <span *ngIf="item.badge" class="ufh-badge">{{ item.badge }}</span>
                    </div>
                    <div class="ufh-card-sub">{{ item.subtitle }}</div>
                    <div class="ufh-skel"></div>
                  </div>
                </div>

                <ng-template #enabledRow>
                  <a class="ufh-card"
                     [routerLink]="intentToLink(item)!"
                     (click)="closeAll()">
                    <div class="ufh-card-icon"><i class="pi" [ngClass]="item.pi"></i></div>
                    <div class="ufh-card-body">
                      <div class="ufh-card-title">{{ item.title }}</div>
                      <div class="ufh-card-sub">{{ item.subtitle }}</div>
                      <div class="ufh-skel"></div>
                    </div>
                    <div aria-hidden="true">→</div>
                  </a>
                </ng-template>
              </ng-container>
            </div>
          </div>
        </div>
      </ng-container>

      <!-- Context strip -->
      <div class="ufh-context" *ngIf="showContextStrip()">
        <div class="ufh-context-inner" *ngIf="mode()==='tech-list'">
          <div class="ufh-pill-tabs">
            <a class="ufh-pill-tab"
               [class.ufh-pill-active]="section()==='coding'"
               [routerLink]="['/', currentTech(), 'coding']">Coding</a>
            <a class="ufh-pill-tab"
               [class.ufh-pill-active]="section()==='trivia'"
               [routerLink]="['/', currentTech(), 'trivia']">Trivia</a>
            <a class="ufh-pill-tab"
               [class.ufh-pill-active]="section()==='debug'"
               [routerLink]="['/', currentTech(), 'debug']">Debug</a>
          </div>
        </div>
      </div>
    </div>
  `
})
export class HeaderComponent implements OnInit {
  private doc = inject(DOCUMENT);

  // Router state
  mode = signal<Mode>('dashboard');
  currentTech = signal<'javascript' | 'angular' | null>(null);
  section = signal<'coding' | 'trivia' | 'debug' | null>(null);

  // Registry
  groups: PrepareGroup[] = PREPARE_GROUPS;
  activeGroupKey = signal<PrepareGroup['key']>('practice');
  activeGroup = computed(
    () => this.groups.find(g => g.key === this.activeGroupKey()) ?? this.groups[0]
  );
  activeItems = computed(() => this.activeGroup().items);

  // Menus
  megaOpen = signal(false);
  profileOpen = signal(false);
  statsOpen = signal(false);

  // Services
  private activitySvc = inject(ActivityService);
  private dailySvc = inject(DailyService);

  // Local summary signal
  private summary = signal<ActivitySummary>(EMPTY_SUMMARY);

  // Read-only derivations for the UI
  streakNum = computed(() => this.summary().streak.current);
  level = computed(() => this.summary().level);
  levelProgressPct = computed(() => Math.round((this.summary().levelProgress?.pct ?? 0) * 100));
  freezeTokens = computed(() => this.summary().freezeTokens);

  weeklyCompleted = computed(() => this.summary().weekly.completed);
  weeklyTarget = computed(() => this.summary().weekly.target);
  weeklyProgressPct = computed(() => Math.round((this.summary().weekly.progress ?? 0) * 100));

  todayCompleted = computed(() => this.summary().today.completed);
  todayTotal = computed(() => this.summary().today.total);
  todayProgressPct = computed(() => Math.round((this.summary().today.progress ?? 0) * 100));

  // Daily list (signal owned by DailyService)
  daily = this.dailySvc.daily;

  constructor(private router: Router, public auth: AuthService) {
    this.dailySvc.ensureTodaySet(defaultPrefs().defaultTech || 'javascript');

    this.router.events.pipe(filter(e => e instanceof NavigationEnd), startWith(null))
      .subscribe(() => {
        this.parseUrl(this.router.url);
        this.megaOpen.set(false);
        this.profileOpen.set(false);
        this.statsOpen.set(false);
        this.updateSafeTop();
        this.pickDefaultGroup();
      });

    window.addEventListener('click', () => {
      this.profileOpen.set(false);
      this.statsOpen.set(false);
    });

    // Reset summary on logout
    effect(() => {
      const loggedIn = this.auth.isLoggedIn();
      if (!loggedIn) this.summary.set(EMPTY_SUMMARY);
    });
  }

  ngOnInit(): void {
    this.pullSummary();

    // When a completion is recorded, refresh both summary and the daily set
    this.activitySvc.activityCompleted$.subscribe(() => {
      this.pullSummary();
      const tech =
        this.currentTech() ?? (defaultPrefs().defaultTech as 'javascript' | 'angular');
      this.dailySvc.ensureTodaySet(tech);
    });
  }

  // --- Data pulls ---
  private pullSummary() {
    this.activitySvc.refreshSummary?.();
    this.activitySvc.summary().subscribe({
      next: (s) => this.summary.set(s ?? EMPTY_SUMMARY),
      error: () => this.summary.set(EMPTY_SUMMARY),
    });
  }

  // ---------- derived flags ----------
  isSystemDesign = computed(
    () =>
      this.currentTech() === null &&
      (this.mode() === 'sd-list' || this.mode() === 'sd-detail')
  );
  isDetailPage = computed(() => this.mode() === 'tech-detail' || this.mode() === 'sd-detail');
  showContextStrip = computed(() => this.mode() === 'tech-list');
  showTechTabs = computed(() => this.mode() === 'tech-list' || this.mode() === 'sd-list');
  showPrepareTrigger = computed(
    () => this.mode() === 'dashboard' || this.mode() === 'tech-detail' || this.mode() === 'profile'
  );

  // ---------- url parsing ----------
  private parseUrl(url: string) {
    const segs = url.split('?')[0].split('#')[0].split('/').filter(Boolean);
    this.mode.set('dashboard');
    this.currentTech.set(null);
    this.section.set(null);

    if (segs.length === 0) { this.mode.set('dashboard'); return; }
    if (segs[0] === 'courses') { this.mode.set('course'); return; }
    if (segs[0] === 'system-design') { this.mode.set(segs.length === 1 ? 'sd-list' : 'sd-detail'); return; }
    if (segs[0] === 'profile') { this.mode.set('profile'); return; }

    const tech = segs[0] as 'javascript' | 'angular';
    if (tech === 'javascript' || tech === 'angular') this.currentTech.set(tech);
    if (segs.length === 1) { this.mode.set('tech-list'); this.section.set('coding'); return; }

    const sec = segs[1] as 'coding' | 'trivia' | 'debug';
    if (sec === 'coding' || sec === 'trivia' || sec === 'debug') {
      this.section.set(sec);
      this.mode.set(segs.length === 2 ? 'tech-list' : 'tech-detail');
    }
  }

  private pickDefaultGroup() {
    if (this.mode() === 'tech-list' || this.mode() === 'tech-detail') { this.activeGroupKey.set('practice'); return; }
    if (this.mode() === 'sd-list' || this.mode() === 'sd-detail') { this.activeGroupKey.set('system'); return; }
    if (this.router.url.startsWith('/companies')) { this.activeGroupKey.set('companies'); return; }
    if (this.router.url.startsWith('/courses')) { this.activeGroupKey.set('courses'); return; }
    this.activeGroupKey.set('foundations');
  }

  // helpers
  trackByGroupKey(_: number, g: PrepareGroup) { return g.key; }
  trackByItemKey(_: number, it: PrepareItem) { return it.key; }

  // route intents
  intentToLink(it: PrepareItem): any[] | null {
    if (it.intent !== 'route' || !it.target) return null;
    const t = it.target;
    switch (t.name as TargetName) {
      case 'practice': {
        const tech = (t.params?.['tech'] as 'javascript' | 'angular' | undefined)
          ?? this.currentTech() ?? 'javascript';
        return ['/', tech];
      }
      case 'system': return ['/system-design'];
      case 'companies': {
        const c = t.params?.['company'] as string | undefined;
        return c ? ['/companies', c] : ['/companies'];
      }
      case 'courses': return ['/courses'];
      case 'guides': return ['/guides'];
      default: return null;
    }
  }

  continueLink = computed(() => {
    try {
      const raw = localStorage.getItem('uf:lastVisited');
      if (!raw) return null;
      const obj = JSON.parse(raw) as { to: any[]; label?: string };
      if (!Array.isArray(obj.to)) return null;
      return { to: obj.to, label: obj.label ?? 'Pick up where you left off' };
    } catch { return null; }
  });

  private updateSafeTop() {
    const base = 48;
    const ctx = this.showContextStrip() ? 48 : 0;
    this.doc.documentElement.style.setProperty('--app-safe-top', `${base + ctx}px`);
  }

  toggleMega() { this.megaOpen.update(v => !v); }
  toggleProfileMenu() { this.profileOpen.update(v => !v); }
  toggleStatsMenu() { this.statsOpen.update(v => !v); }
  closeAll() { this.megaOpen.set(false); this.profileOpen.set(false); this.statsOpen.set(false); }

  logout() {
    this.auth.logout();
    this.closeAll();
    this.router.navigate(['/']);
    this.summary.set(EMPTY_SUMMARY);
  }
}