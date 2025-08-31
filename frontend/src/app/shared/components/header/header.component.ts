import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, DestroyRef, HostListener, OnInit, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter, startWith, take } from 'rxjs';
import { defaultPrefs } from '../../../core/models/user.model';
import { ActivityService, ActivitySummary } from '../../../core/services/activity.service';
import { AuthService } from '../../../core/services/auth.service';
import { DailyService } from '../../../core/services/daily.service';
import { PREPARE_GROUPS, PrepareGroup, PrepareItem, TargetName } from '../../prepare/prepare.registry';

type Mode = 'dashboard' | 'tech-list' | 'tech-detail' | 'sd-list' | 'sd-detail' | 'course' | 'profile';

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
    <div class="ufh-topbar" role="banner" (click)="$event.stopPropagation()">
      <div class="ufh-inner">
        <!-- LEFT -->
        <div class="ufh-left">
          <a class="ufh-brand" routerLink="/">UberFrontend</a>

          <nav *ngIf="showTechTabs()" class="ufh-tabs">
            <a [routerLink]="'/javascript'" class="ufh-tab" [class.ufh-tab-active]="currentTech()==='javascript'">
              <span class="ufh-tab-ico"><svg viewBox="0 0 32 32" aria-hidden="true"><rect x="2" y="2" width="28" height="28" rx="4" fill="#F7DF1E"></rect><text x="16" y="21" text-anchor="middle" font-size="14" font-weight="700" font-family="Inter,system-ui,-apple-system,Segoe UI,Roboto,'Helvetica Neue',Arial,'Noto Sans'" fill="#111">JS</text></svg></span>
              JavaScript
            </a>
            <a [routerLink]="'/angular'" class="ufh-tab" [class.ufh-tab-active]="currentTech()==='angular'">
              <span class="ufh-tab-ico"><svg viewBox="0 0 32 32" aria-hidden="true"><polygon points="16,2 29,7 27,26 16,30 5,26 3,7" fill="#DD0031"></polygon><polygon points="16,5 26.2,8.9 24.8,24.5 16,27.7 7.2,24.5 5.8,8.9" fill="#C3002F"></polygon><text x="16" y="21" text-anchor="middle" font-size="14" font-weight="800" font-family="Inter,system-ui,-apple-system,Segoe UI,Roboto,'Helvetica Neue',Arial,'Noto Sans'" fill="#fff">A</text></svg></span>
              Angular
            </a>
            <a [routerLink]="'/system-design'" class="ufh-tab" [class.ufh-tab-active]="isSystemDesign()">System design</a>
          </nav>
        </div>

        <!-- CENTER -->
        <div class="ufh-center">
          <button *ngIf="showPrepareTrigger()" class="ufh-pill" (click)="toggleMega()" aria-haspopup="menu" [attr.aria-expanded]="megaOpen()" aria-controls="prepare-mega">
            Prepare ▾
          </button>
        </div>

        <!-- RIGHT -->
        <div class="ufh-right" (click)="$event.stopPropagation()">
          <div class="ufh-stats">
            <button class="ufh-stats-pill" (click)="toggleStatsMenu()" aria-haspopup="menu" [attr.aria-expanded]="statsOpen()" title="Streak · Level">
              <span aria-hidden="true">🔥</span>
              <span class="ufh-stats-num">{{ streakNum() }}</span>
              <span class="ufh-dot">·</span>
              <span class="ufh-stats-num">L{{ level() }}</span>
            </button>

            <div *ngIf="statsOpen()" class="ufh-stats-menu" role="menu">
              <div class="ufh-stats-header">
                <div class="ufh-stat"><div class="big">🔥 {{ streakNum() }}</div><div class="sub">day streak</div></div>
                <div class="ufh-stat"><div class="big">L{{ level() }}</div><div class="sub">{{ levelProgressPct() }}% to L{{ level()+1 }}</div></div>
              </div>

              <!-- Level progress (server) -->
              <div class="ufh-prog">
                <div class="ufh-prog-bar"><div class="ufh-prog-fill" [style.width.%]="levelProgressPct()"></div></div>
                <div class="ufh-prog-text">Level progress</div>
              </div>

              <!-- Weekly goal (client override) -->
              <div class="ufh-prog">
                <div class="ufh-prog-bar"><div class="ufh-prog-fill" [style.width.%]="uiWeeklyPct()"></div></div>
                <div class="ufh-prog-text">{{ uiWeeklyDone() }}/{{ uiWeeklyTarget() }} this week
                  <span *ngIf="freezeTokens()>0" class="ufh-badge">Freeze: {{ freezeTokens() }}</span>
                </div>
              </div>

              <!-- Today (client override) -->
              <div class="ufh-prog">
                <div class="ufh-prog-bar"><div class="ufh-prog-fill" [style.width.%]="uiTodayPct()"></div></div>
                <div class="ufh-prog-text">{{ uiTodayDone() }}/{{ uiTodayTotal() }} done today</div>
              </div>

              <ul class="ufh-stats-list" *ngIf="(daily()?.items?.length || 0) > 0">
                <li *ngFor="let it of daily()?.items || []">
                  <a class="ufh-stats-link" [routerLink]="it.to" (click)="closeAll()">
                    <span class="ufh-kind" [attr.data-kind]="it.kind">{{ it.kind }}</span>
                    <span class="ufh-label">{{ it.label }}</span>
                    <span class="ufh-time">{{ it.durationMin }}m</span>
                    <i class="pi" [ngClass]="it.state?.completedAt ? 'pi-check-circle text-green-400' : 'pi-chevron-right opacity-60'"></i>
                  </a>
                </li>
              </ul>

              <div *ngIf="!auth.isLoggedIn()" class="ufh-prog-text" style="margin-top:8px;">Log in to track your streak & levels.</div>
            </div>
          </div>

          <div class="ufh-profile ufh-profile-right">
            <button class="ufh-avatar" (click)="toggleProfileMenu()" aria-haspopup="menu" [attr.aria-expanded]="profileOpen()"><i class="pi pi-user"></i></button>
            <div *ngIf="profileOpen()" class="ufh-menu" role="menu">
              <div class="ufh-menu-section">Account</div>
              <ng-container *ngIf="auth.isLoggedIn(); else profileDisabled">
                <a class="ufh-menu-item" routerLink="/profile" (click)="closeAll()"><i class="pi pi-user"></i> My profile</a>
              </ng-container>
              <ng-template #profileDisabled>
                <button class="ufh-menu-item" disabled><i class="pi pi-user"></i> My profile</button>
              </ng-template>
              <button class="ufh-menu-item" disabled><i class="pi pi-check-circle"></i> Progress</button>
              <button class="ufh-menu-item" disabled><i class="pi pi-bookmark"></i> Bookmarks</button>
              <button class="ufh-menu-item"><i class="pi pi-moon"></i> Theme</button>
              <button class="ufh-menu-item"><i class="pi pi-sliders-h"></i> Keyboard shortcuts</button>
              <div class="ufh-divider"></div>
              <ng-container *ngIf="!auth.isLoggedIn(); else loggedInTpl">
                <button class="ufh-menu-item" routerLink="/auth/signup" (click)="closeAll()"><i class="pi pi-user-plus"></i> Sign up</button>
                <button class="ufh-menu-item" routerLink="/auth/login" (click)="closeAll()"><i class="pi pi-sign-in"></i> Log in</button>
              </ng-container>
              <ng-template #loggedInTpl>
                <button class="ufh-menu-item" (click)="logout()"><i class="pi pi-sign-out"></i> Log out</button>
              </ng-template>
            </div>
          </div>
        </div>
      </div>

      <!-- MEGA MENU -->
      <ng-container *ngIf="megaOpen()">
        <div class="ufh-backdrop" (click)="closeAll()"></div>
        <div id="prepare-mega" class="ufh-mega" (click)="$event.stopPropagation()" (keydown.escape)="closeAll()" tabindex="-1" role="menu" aria-label="Prepare menu">
          <div class="ufh-mega-inner">
            <div class="ufh-rail">
              <button *ngFor="let g of groups; trackBy: trackByGroupKey" class="ufh-rail-item"
                      [class.ufh-rail-active]="g.key===activeGroupKey()" (click)="activeGroupKey.set(g.key)">
                <span class="ufh-rail-text">{{ g.title }}</span><i class="pi pi-chevron-right ufh-rail-caret"></i>
              </button>
            </div>
            <div class="ufh-pane">
              <a *ngIf="continueLink() as cont" class="ufh-card ufh-card-continue" [routerLink]="cont.to" (click)="closeAll()">
                <div class="ufh-card-icon"><i class="pi pi-play-circle"></i></div>
                <div class="ufh-card-body"><div class="ufh-card-title">Continue</div><div class="ufh-card-sub">{{ cont.label }}</div><div class="ufh-skel"></div></div>
                <div aria-hidden="true">→</div>
              </a>

              <ng-container *ngFor="let item of activeItems(); trackBy: trackByItemKey">
                <div *ngIf="item.disabled || item.intent!=='route' || !item.target; else enabledRow"
                     class="ufh-card ufh-card-disabled" role="button" aria-disabled="true" tabindex="-1">
                  <div class="ufh-card-icon"><i class="pi" [ngClass]="item.pi"></i></div>
                  <div class="ufh-card-body"><div class="ufh-card-title">{{ item.title }} <span *ngIf="item.badge" class="ufh-badge">{{ item.badge }}</span></div>
                  <div class="ufh-card-sub">{{ item.subtitle }}</div><div class="ufh-skel"></div></div>
                </div>
                <ng-template #enabledRow>
                  <a class="ufh-card" [routerLink]="intentToLink(item)!" (click)="closeAll()">
                    <div class="ufh-card-icon"><i class="pi" [ngClass]="item.pi"></i></div>
                    <div class="ufh-card-body"><div class="ufh-card-title">{{ item.title }}</div>
                    <div class="ufh-card-sub">{{ item.subtitle }}</div><div class="ufh-skel"></div></div>
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
            <a class="ufh-pill-tab" [class.ufh-pill-active]="section()==='coding'"  [routerLink]="['/', currentTech(), 'coding']">Coding</a>
            <a class="ufh-pill-tab" [class.ufh-pill-active]="section()==='trivia'"  [routerLink]="['/', currentTech(), 'trivia']">Trivia</a>
            <a class="ufh-pill-tab" [class.ufh-pill-active]="section()==='debug'"   [routerLink]="['/', currentTech(), 'debug']">Debug</a>
          </div>
        </div>
      </div>
    </div>
  `
})
export class HeaderComponent implements OnInit {
  private doc = inject(DOCUMENT);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);

  // Router state
  mode = signal<Mode>('dashboard');
  currentTech = signal<'javascript' | 'angular' | null>(null);
  section = signal<'coding' | 'trivia' | 'debug' | null>(null);

  // Registry
  groups: PrepareGroup[] = PREPARE_GROUPS;
  activeGroupKey = signal<PrepareGroup['key']>('practice');
  activeGroup = computed(() => this.groups.find(g => g.key === this.activeGroupKey()) ?? this.groups[0]);
  activeItems = computed(() => this.activeGroup().items);

  // Menus
  megaOpen = signal(false);
  profileOpen = signal(false);
  statsOpen = signal(false);

  // Services
  private activitySvc = inject(ActivityService);
  private dailySvc = inject(DailyService);
  public auth = inject(AuthService);

  // Server summary (mirror ActivityService.summarySig)
  private summary = signal<ActivitySummary>(EMPTY_SUMMARY);
  streakNum = computed(() => this.summary().streak.current);
  level = computed(() => this.summary().level);
  levelProgressPct = computed(() => Math.round((this.summary().levelProgress?.pct ?? 0) * 100));
  freezeTokens = computed(() => this.summary().freezeTokens);

  // Client overrides (recomputed via recent())
  uiTodayDone = signal(0);
  uiTodayTotal = signal(3);
  uiWeeklyDone = signal(0);
  uiWeeklyTarget = signal(5);

  uiTodayPct = computed(() => {
    const t = this.uiTodayTotal(); const d = this.uiTodayDone();
    return t > 0 ? Math.round((d / t) * 100) : 0;
  });
  uiWeeklyPct = computed(() => {
    const t = this.uiWeeklyTarget(); const d = this.uiWeeklyDone();
    return t > 0 ? Math.round((d / t) * 100) : 0;
  });

  // Daily list (signal owned by DailyService)
  daily = this.dailySvc.daily;

  constructor() {
    // Ensure daily exists for current tech on boot
    this.dailySvc.ensureTodaySet(this.resolveTech());

    // Router reactions
    this.router.events.pipe(filter(e => e instanceof NavigationEnd), startWith(null))
      .subscribe(() => {
        this.parseUrl(this.router.url);
        this.closeAll();
        this.updateSafeTop();
        this.pickDefaultGroup();
        this.refreshAll(false);
      });

    // Logout -> wipe server fields immediately
    effect(() => { if (!this.auth.isLoggedIn()) this.summary.set(EMPTY_SUMMARY); });

    // Keep "today total" synced with daily list length
    effect(() => {
      const items = this.daily()?.items ?? [];
      this.uiTodayTotal.set(items.length || 3);
    });

    // Mirror the service's summarySig reactively
    effect(() => {
      const s = this.activitySvc.summarySig();
      if (s) this.summary.set(s);
    });
  }

  ngOnInit(): void {
    // Hydrate Daily list/ticks from server summary on boot
    // Pull server snapshot (streak/level/etc.)
    this.activitySvc.getSummary({ force: true }).pipe(take(1))
      .subscribe(s => this.dailySvc.hydrateFromSummary(s));

    // Pull recent rows to reconstruct today's checkmarks by kind
    this.activitySvc.getRecent({ since: this.startOfWeekLocalISO() }, { force: true })
      .pipe(take(1))
      .subscribe(rows => this.dailySvc.hydrateFromRecent(rows));

    this.refreshAll(false);
    this.scheduleMidnightRefresh();

    // When a completion is recorded, force-refresh both views
    this.activitySvc.activityCompleted$.subscribe(() => {
      this.refreshAll(true);
    });
  }

  // ---------- Data refresh ----------
  private refreshAll(force: boolean) {
    this.dailySvc.ensureTodaySet(this.resolveTech());
    this.pullSummary(force);
    this.refreshClientProgress(force);
  }

  private pullSummary(force: boolean) {
    this.activitySvc.getSummary({ force }).pipe(take(1)).subscribe({
      next: (s) => this.summary.set(s ?? EMPTY_SUMMARY),
      error: () => this.summary.set(EMPTY_SUMMARY),
    });
  }

  /** Recompute Today + Weekly from recent rows using local time. */
  private refreshClientProgress(force: boolean) {
    if (!this.auth.isLoggedIn()) { this.uiTodayDone.set(0); this.uiWeeklyDone.set(0); return; }

    const since = this.startOfWeekLocalISO();

    this.activitySvc.getRecent({ since }, { force }).pipe(take(1)).subscribe({
      next: (rows: any[] = []) => {
        const todayStr = this.localDateStr(new Date());
        const kindsToday = new Set<string>();
        const daysThisWeek = new Set<string>();

        for (const r of rows || []) {
          const ts = r.completedAt || r.ts || r.date || r.createdAt || r.updatedAt;
          if (!ts) continue;
          const localDay = this.localDateStr(new Date(ts));
          if (localDay === todayStr && r.kind) kindsToday.add(r.kind);
          if (this.isInCurrentLocalWeek(localDay)) daysThisWeek.add(localDay);
        }

        this.uiTodayDone.set(kindsToday.size);
        this.uiWeeklyDone.set(daysThisWeek.size);
      },
      error: () => { /* keep last values on error */ }
    });
  }

  // ---------- Local-time helpers ----------
  private resolveTech(): 'javascript' | 'angular' {
    return this.currentTech() ?? (defaultPrefs().defaultTech as 'javascript' | 'angular' | undefined) ?? 'javascript';
  }

  private startOfWeekLocalISO(): string {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    const dow = (d.getDay() + 6) % 7; // Mon=0..Sun=6
    d.setDate(d.getDate() - dow);
    return this.localDateStr(d);
  }

  private localDateStr(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private isInCurrentLocalWeek(isoDay: string): boolean {
    const start = this.startOfWeekLocalISO();
    const sd = new Date(start + 'T00:00:00');
    const ed = new Date(sd);
    ed.setDate(sd.getDate() + 6);
    const x = new Date(isoDay + 'T00:00:00');
    return x >= sd && x <= ed;
  }

  private scheduleMidnightRefresh() {
    const tick = () => {
      const now = new Date();
      const next = new Date(now);
      next.setHours(24, 0, 5, 0); // ~00:00:05 next day
      const ms = Math.max(1000, next.getTime() - now.getTime());
      const id = setTimeout(() => { this.refreshAll(true); tick(); }, ms);
      this.destroyRef.onDestroy(() => clearTimeout(id));
    };
    tick();
  }

  // ---------- derived flags ----------
  isSystemDesign = computed(() =>
    this.currentTech() === null && (this.mode() === 'sd-list' || this.mode() === 'sd-detail')
  );
  isDetailPage = computed(() => this.mode() === 'tech-detail' || this.mode() === 'sd-detail');
  showContextStrip = computed(() => this.mode() === 'tech-list');
  showTechTabs = computed(() => this.mode() === 'tech-list' || this.mode() === 'sd-list');
  showPrepareTrigger = computed(() => this.mode() === 'dashboard' || this.mode() === 'tech-detail' || this.mode() === 'profile');

  // ---------- url parsing ----------
  private parseUrl(url: string) {
    const segs = url.split('?')[0].split('#')[0].split('/').filter(Boolean);
    this.mode.set('dashboard'); this.currentTech.set(null); this.section.set(null);

    if (segs.length === 0) { this.mode.set('dashboard'); return; }
    if (segs[0] === 'courses') { this.mode.set('course'); return; }
    if (segs[0] === 'system-design') { this.mode.set(segs.length === 1 ? 'sd-list' : 'sd-detail'); return; }
    if (segs[0] === 'profile') { this.mode.set('profile'); return; }

    const tech = segs[0] as 'javascript' | 'angular';
    if (tech === 'javascript' || 'angular') this.currentTech.set(tech);
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

  intentToLink(it: PrepareItem): any[] | null {
    if (it.intent !== 'route' || !it.target) return null;
    const t = it.target;
    switch (t.name as TargetName) {
      case 'practice': {
        const tech = this.resolveTech();
        return ['/', tech];
      }
      case 'system': {
        const section = t.params?.['section'] as string | undefined;
        if (section === 'guide') return ['/guides', 'system-design'];
        // practice/challenges both land on the SD problems page for now
        return ['/system-design'];
      }
      case 'companies': {
        const c = t.params?.['company'] as string | undefined;
        return c ? ['/companies', c] : ['/companies'];
      }
      case 'courses':
        return ['/courses'];
      case 'guides': {
        const section = (t.params?.['section'] as string | undefined) ?? '';
        if (section === 'playbook') return ['/guides', 'playbook'];
        if (section === 'behavioral') return ['/guides', 'behavioral'];
        if (section === 'system-design') return ['/guides', 'system-design'];
        return ['/guides'];
      }
      default:
        return null;
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

  // Close any open popovers when clicking anywhere outside this component.
  @HostListener('document:click')
  onDocumentClick() {
    this.closeAll();
  }

  // Also close on Escape from anywhere
  @HostListener('document:keydown.escape')
  onDocumentEsc() {
    this.closeAll();
  }

  // Keep exactly one menu open at a time
  private openOnly(which: 'mega' | 'profile' | 'stats' | null) {
    this.megaOpen.set(which === 'mega');
    this.profileOpen.set(which === 'profile');
    this.statsOpen.set(which === 'stats');
  }

  toggleMega() {
    this.openOnly(this.megaOpen() ? null : 'mega');
  }

  toggleProfileMenu() {
    this.openOnly(this.profileOpen() ? null : 'profile');
  }

  toggleStatsMenu() {
    this.openOnly(this.statsOpen() ? null : 'stats');
  }

  // keep this as-is
  closeAll() {
    this.openOnly(null);
  }

  logout() { this.auth.logout(); this.closeAll(); this.summary.set(EMPTY_SUMMARY); this.activitySvc.invalidateAll(); this.router.navigate(['/']); }
}
