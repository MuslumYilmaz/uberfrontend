import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, computed, DestroyRef, HostListener, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter, startWith, take } from 'rxjs';
import { defaultPrefs, Tech } from '../../../core/models/user.model';
import { ActivityService, ActivitySummary } from '../../../core/services/activity.service';
import { AuthService } from '../../../core/services/auth.service';
import { DailyService } from '../../../core/services/daily.service';
import { PREPARE_GROUPS, PrepareGroup, PrepareItem, TargetName } from '../../prepare/prepare.registry';

type Mode =
  | 'dashboard'
  | 'tech-list'
  | 'tech-detail'
  | 'sd-list'
  | 'sd-detail'
  | 'course'
  | 'profile'
  | 'not-found';

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
      <!-- LEFT (brand + Prepare) -->
      <div class="ufh-left">
        <a class="ufh-brand" routerLink="/">UberFrontend</a>
      </div>

      <!-- CENTER (spacer) -->
      <div class="ufh-center">
        <button
                class="ufh-navlink"
                (click)="toggleMega()"
                aria-haspopup="menu"
                [attr.aria-expanded]="megaOpen()"
                aria-controls="prepare-mega">
          Prepare <span class="caret" aria-hidden="true">▾</span>
        </button>
      </div>

      <!-- RIGHT (Pricing → Stats → Avatar → Upgrade) -->
      <div class="ufh-right" (click)="$event.stopPropagation()">
        <a class="ufh-btn" routerLink="/pricing">Pricing</a>

        <div class="ufh-stats">
          <button class="ufh-stats-chip"
                  (click)="toggleStatsMenu()"
                  aria-haspopup="menu"
                  [attr.aria-expanded]="statsOpen()"
                  title="Streak · Level">
            <span aria-hidden="true">🔥</span>
            <span class="num">{{ streakNum() }}</span>
            <span class="sep"></span>
            <span class="num">L{{ level() }}</span>
          </button>

          <div *ngIf="statsOpen()" class="ufh-stats-menu" role="menu">
            <div class="ufh-stats-header">
              <div class="ufh-stat"><div class="big">🔥 {{ streakNum() }}</div><div class="sub">day streak</div></div>
              <div class="ufh-stat"><div class="big">L{{ level() }}</div><div class="sub">{{ levelProgressPct() }}% to L{{ level()+1 }}</div></div>
            </div>

            <div class="ufh-prog">
              <div class="ufh-prog-bar"><div class="ufh-prog-fill" [style.width.%]="levelProgressPct()"></div></div>
              <div class="ufh-prog-text">Level progress</div>
            </div>

            <div class="ufh-prog">
              <div class="ufh-prog-bar"><div class="ufh-prog-fill" [style.width.%]="uiWeeklyPct()"></div></div>
              <div class="ufh-prog-text">{{ uiWeeklyDone() }}/{{ uiWeeklyTarget() }} this week
                <span *ngIf="freezeTokens()>0" class="ufh-badge">Freeze: {{ freezeTokens() }}</span>
              </div>
            </div>

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
          <button class="ufh-avatar"
                  (click)="toggleProfileMenu()"
                  aria-haspopup="menu"
                  [attr.aria-expanded]="profileOpen()">
            <i class="pi pi-user"></i>
          </button>
          <div *ngIf="profileOpen()" class="ufh-menu" role="menu">
            <div class="ufh-menu-section">Account</div>
            <ng-container *ngIf="auth.isLoggedIn(); else profileDisabled">
              <a class="ufh-menu-item" routerLink="/profile" (click)="closeAll()"><i class="pi pi-user"></i> My profile</a>
            </ng-container>
            <ng-template #profileDisabled>
              <button class="ufh-menu-item" disabled><i class="pi pi-user"></i> My profile</button>
            </ng-template>
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

        <!-- Luminous CTA -->
        <a class="ufh-cta ufh-cta-solid" routerLink="/pricing">
          {{ auth.isLoggedIn() ? 'Upgrade' : 'Get full access' }}
        </a>
      </div>
    </div>

    <!-- MEGA MENU -->
    <ng-container *ngIf="megaOpen()">
      <div class="ufh-backdrop" (click)="closeAll()"></div>
      <div id="prepare-mega" class="ufh-mega" (click)="$event.stopPropagation()" (keydown.escape)="closeAll()"
           tabindex="-1" role="menu" aria-label="Prepare menu">
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
                   class="ufh-card ufh-card-disabled"
                   role="button" aria-disabled="true" tabindex="-1">
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
                <a class="ufh-card" [routerLink]="intentToLink(item)!" (click)="closeAll()">
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
  </div>
  `
})
export class HeaderComponent implements OnInit {
  private doc = inject(DOCUMENT);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);

  mode = signal<Mode>('dashboard');
  currentTech = signal<'javascript' | 'angular' | 'react' | 'vue' | 'html' | 'css' | null>(null);
  section = signal<'coding' | 'trivia' | 'debug' | null>(null);

  groups: PrepareGroup[] = PREPARE_GROUPS;
  activeGroupKey = signal<PrepareGroup['key']>('practice');
  activeGroup = computed(() => this.groups.find(g => g.key === this.activeGroupKey()) ?? this.groups[0]);
  activeItems = computed(() => this.activeGroup().items);

  megaOpen = signal(false);
  profileOpen = signal(false);
  statsOpen = signal(false);

  private activitySvc = inject(ActivityService);
  private dailySvc = inject(DailyService);
  public auth = inject(AuthService);

  private summary = computed<ActivitySummary>(() => {
    if (!this.auth.isLoggedIn()) return EMPTY_SUMMARY;
    return this.activitySvc.summarySig() ?? EMPTY_SUMMARY;
  });

  streakNum = computed(() => this.summary().streak.current);
  level = computed(() => this.summary().level);
  levelProgressPct = computed(() => Math.round((this.summary().levelProgress?.pct ?? 0) * 100));
  freezeTokens = computed(() => this.summary().freezeTokens);

  uiTodayDone = signal(0);
  uiWeeklyDone = signal(0);
  uiWeeklyTarget = signal(5);

  daily = this.dailySvc.daily;
  uiTodayTotal = computed(() => (this.daily()?.items?.length ?? 0) || 3);

  uiTodayPct = computed(() => {
    const t = this.uiTodayTotal();
    const d = this.uiTodayDone();
    return t > 0 ? Math.round((d / t) * 100) : 0;
  });
  uiWeeklyPct = computed(() => {
    const t = this.uiWeeklyTarget();
    const d = this.uiWeeklyDone();
    return t > 0 ? Math.round((d / t) * 100) : 0;
  });

  constructor() {
    this.dailySvc.ensureTodaySet(this.resolveTech());

    this.router.events.pipe(filter(e => e instanceof NavigationEnd), startWith(null))
      .subscribe(() => {
        this.parseUrl(this.router.url);
        this.closeAll();
        this.updateSafeTop();
        this.pickDefaultGroup();
        this.refreshAll(false);
      });
  }

  ngOnInit(): void {
    this.activitySvc.getSummary({ force: true }).pipe(take(1))
      .subscribe(s => this.dailySvc.hydrateFromSummary(s));

    this.activitySvc.getRecent({ since: this.startOfWeekLocalISO() }, { force: true })
      .pipe(take(1))
      .subscribe(rows => this.dailySvc.hydrateFromRecent(rows));

    this.refreshAll(false);
    this.scheduleMidnightRefresh();

    this.activitySvc.activityCompleted$.subscribe(() => {
      this.refreshAll(true);
    });
  }

  private refreshAll(force: boolean) {
    this.dailySvc.ensureTodaySet(this.resolveTech());
    this.pullSummary(force);
    this.refreshClientProgress(force);
  }

  private pullSummary(force: boolean) {
    this.activitySvc.getSummary({ force }).pipe(take(1)).subscribe();
  }

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

  private resolveTech(): Tech {
    const pref = (defaultPrefs().defaultTech as Tech | undefined) ?? 'javascript';
    return this.currentTech() ?? pref;
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
      next.setHours(24, 0, 5, 0);
      const ms = Math.max(1000, next.getTime() - now.getTime());
      const id = setTimeout(() => { this.refreshAll(true); tick(); }, ms);
      this.destroyRef.onDestroy(() => clearTimeout(id));
    };
    tick();
  }

  isSystemDesign = computed(() =>
    this.currentTech() === null && (this.mode() === 'sd-list' || this.mode() === 'sd-detail')
  );
  isDetailPage = computed(() => this.mode() === 'tech-detail' || this.mode() === 'sd-detail');
  showContextStrip = computed(() => false);
  showTechTabs = computed(() => false);
  showPrepareTrigger = computed(() =>
    this.mode() === 'dashboard' || this.mode() === 'tech-detail' || this.mode() === 'profile'
  );

  private parseUrl(url: string) {
    const segs = url.split('?')[0].split('#')[0].split('/').filter(Boolean);

    this.mode.set('dashboard');
    this.currentTech.set(null);
    this.section.set(null);

    if (segs.length === 0) { this.mode.set('dashboard'); return; }
    if (segs[0] === '404') { this.mode.set('not-found'); return; }
    if (segs[0] === 'courses') { this.mode.set('course'); return; }
    if (segs[0] === 'system-design') { this.mode.set(segs.length === 1 ? 'sd-list' : 'sd-detail'); return; }
    if (segs[0] === 'profile') { this.mode.set('profile'); return; }

    const tech = segs[0] as 'javascript' | 'angular' | 'react' | 'vue' | 'html' | 'css';
    const isTech =
      tech === 'javascript' || tech === 'angular' || tech === 'react' ||
      tech === 'vue' || tech === 'html' || tech === 'css';
    if (isTech) this.currentTech.set(tech);

    if (!isTech) return;

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
    const base = 56;
    const ctx = this.showContextStrip() ? 48 : 0;
    this.doc.documentElement.style.setProperty('--app-safe-top', `${base + ctx}px`);
  }

  @HostListener('document:click')
  onDocumentClick() { this.closeAll(); }

  @HostListener('document:keydown.escape')
  onDocumentEsc() { this.closeAll(); }

  private openOnly(which: 'mega' | 'profile' | 'stats' | null) {
    this.megaOpen.set(which === 'mega');
    this.profileOpen.set(which === 'profile');
    this.statsOpen.set(which === 'stats');
  }

  toggleMega() { this.openOnly(this.megaOpen() ? null : 'mega'); }
  toggleProfileMenu() { this.openOnly(this.profileOpen() ? null : 'profile'); }
  toggleStatsMenu() { this.openOnly(this.statsOpen() ? null : 'stats'); }

  closeAll() { this.openOnly(null); }

  logout() {
    this.auth.logout();
    this.closeAll();
    this.activitySvc.invalidateAll();
    this.router.navigate(['/']);
  }
}