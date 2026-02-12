import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, computed, HostListener, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter, startWith } from 'rxjs';
import { defaultPrefs, Tech } from '../../../core/models/user.model';
import { AuthService } from '../../../core/services/auth.service';
import { isProActive } from '../../../core/utils/entitlements.util';
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

type VisibleEntry = {
  origin: string;
  item: PrepareItem;
  link: any[] | null;
  group?: string;
  isViewAll?: boolean;
};

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  styleUrls: ['./header.component.css'],
  template: `
  <div class="fah-topbar" role="banner" (click)="$event.stopPropagation()">
    <div class="fah-inner">
      <!-- LEFT (brand) -->
      <div class="fah-left">
        <a class="fah-brand" routerLink="/">FrontendAtlas</a>
      </div>

      <!-- CENTER (Prepare trigger) -->
      <div class="fah-center">
        <button
          class="fah-navlink"
          (click)="toggleMega()"
          aria-haspopup="menu"
          [attr.aria-expanded]="megaOpen()"
          aria-controls="prepare-mega">
          Study <span class="caret" aria-hidden="true">▾</span>
        </button>
      </div>

      <!-- RIGHT (Desktop actions + compact mobile menu) -->
      <div class="fah-right" (click)="$event.stopPropagation()">
        <div class="fah-desktop-actions">
          <a class="fah-btn" routerLink="/dashboard">Dashboard</a>
          <a *ngIf="!isPro()" class="fah-btn" routerLink="/pricing">Pricing</a>

          <div class="fah-profile fah-profile-right">
            <button class="fah-avatar" data-testid="header-profile-button"
                    (click)="toggleProfileMenu()"
                    aria-haspopup="menu"
                    [attr.aria-expanded]="profileOpen()">
              <i class="pi pi-user"></i>
            </button>
            <div *ngIf="profileOpen()" class="fah-menu" role="menu" data-testid="header-profile-menu">
              <div class="fah-menu-section">Account</div>

              <ng-container *ngIf="auth.isLoggedIn(); else profileDisabled">
                <a class="fah-menu-item" routerLink="/profile" (click)="closeAll()" data-testid="header-menu-profile">
                  <i class="pi pi-user"></i> My profile
                </a>
                <a *ngIf="isAdmin()" class="fah-menu-item" routerLink="/admin/users" (click)="closeAll()" data-testid="header-menu-admin-users">
                  <i class="pi pi-shield"></i> Admin: Users
                </a>
                <div class="fah-divider"></div>
                <button class="fah-menu-item" (click)="logout()" data-testid="header-menu-logout"><i class="pi pi-sign-out"></i> Log out</button>
              </ng-container>

              <ng-template #profileDisabled>
                <button class="fah-menu-item" routerLink="/auth/signup" (click)="closeAll()" data-testid="header-menu-signup">
                  <i class="pi pi-user-plus"></i> Sign up
                </button>
                <button class="fah-menu-item" routerLink="/auth/login" (click)="closeAll()" data-testid="header-menu-login">
                  <i class="pi pi-sign-in"></i> Log in
                </button>
              </ng-template>
            </div>
          </div>

          <!-- Luminous CTA -->
          <a *ngIf="!isPro()" class="fah-cta fah-cta-solid" [routerLink]="ctaLink()">
            {{ ctaLabel() }}
          </a>
        </div>

        <div class="fah-mobile-actions">
          <button
            type="button"
            class="fah-iconbtn"
            data-testid="header-mobile-study-button"
            (click)="toggleMega()"
            aria-haspopup="menu"
            [attr.aria-expanded]="megaOpen()"
            aria-controls="prepare-mega"
            aria-label="Open study menu">
            <i class="pi pi-book"></i>
          </button>
          <button
            type="button"
            class="fah-iconbtn"
            data-testid="header-mobile-menu-button"
            (click)="toggleMobileMenu()"
            aria-haspopup="menu"
            [attr.aria-expanded]="mobileNavOpen()"
            aria-controls="header-mobile-menu"
            aria-label="Open navigation menu">
            <i class="pi" [ngClass]="mobileNavOpen() ? 'pi-times' : 'pi-bars'"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- MOBILE NAV PANEL -->
    <ng-container *ngIf="mobileNavOpen()">
      <div class="fah-backdrop" (click)="closeAll()"></div>
      <div id="header-mobile-menu" class="fah-mobile-panel" role="menu" (click)="$event.stopPropagation()"
           data-testid="header-mobile-menu">
        <a class="fah-mobile-item" routerLink="/dashboard" (click)="closeAll()" data-testid="header-mobile-dashboard">
          <i class="pi pi-home"></i>
          <span>Dashboard</span>
        </a>
        <a *ngIf="!isPro()" class="fah-mobile-item" routerLink="/pricing" (click)="closeAll()" data-testid="header-mobile-pricing">
          <i class="pi pi-tag"></i>
          <span>Pricing</span>
        </a>
        <a *ngIf="!isPro()" class="fah-mobile-item fah-mobile-item--accent" [routerLink]="ctaLink()" (click)="closeAll()" data-testid="header-mobile-cta">
          <i class="pi pi-star"></i>
          <span>{{ ctaLabel() }}</span>
        </a>
        <div class="fah-divider"></div>
        <ng-container *ngIf="auth.isLoggedIn(); else mobileGuest">
          <a class="fah-mobile-item" routerLink="/profile" (click)="closeAll()" data-testid="header-mobile-profile">
            <i class="pi pi-user"></i>
            <span>My profile</span>
          </a>
          <a *ngIf="isAdmin()" class="fah-mobile-item" routerLink="/admin/users" (click)="closeAll()" data-testid="header-mobile-admin-users">
            <i class="pi pi-shield"></i>
            <span>Admin: Users</span>
          </a>
          <button type="button" class="fah-mobile-item" (click)="logout()" data-testid="header-mobile-logout">
            <i class="pi pi-sign-out"></i>
            <span>Log out</span>
          </button>
        </ng-container>
        <ng-template #mobileGuest>
          <button type="button" class="fah-mobile-item" routerLink="/auth/signup" (click)="closeAll()" data-testid="header-mobile-signup">
            <i class="pi pi-user-plus"></i>
            <span>Sign up</span>
          </button>
          <button type="button" class="fah-mobile-item" routerLink="/auth/login" (click)="closeAll()" data-testid="header-mobile-login">
            <i class="pi pi-sign-in"></i>
            <span>Log in</span>
          </button>
        </ng-template>
      </div>
    </ng-container>

    <!-- STUDY PANEL -->
    <ng-container *ngIf="megaOpen()">
      <div class="fah-backdrop" (click)="closeAll()"></div>
      <div id="prepare-mega" class="study-panel" (click)="$event.stopPropagation()" (keydown.escape)="closeAll()"
           (keydown.arrowdown)="moveActive(1)" (keydown.arrowup)="moveActive(-1)" (keydown.enter)="activateActive()"
           tabindex="-1" role="menu" aria-label="Study menu">
        <div class="study-search">
          <i class="pi pi-search"></i>
          <input type="text" [(ngModel)]="searchTerm" placeholder="Search study resources" />
          <span class="shortcut" aria-hidden="true">/</span>
        </div>
        <div class="study-scroll">
          <ng-container *ngIf="!isSearching(); else searchMode">
            <ng-container *ngIf="recentItems().length">
              <div class="study-section">
                <div class="study-section__title">Recent</div>
                <div class="study-list">
                  <a *ngFor="let r of recentItems(); let idx = index"
                     class="study-row"
                     [class.active]="activeIndex() === rowIndex('recent-' + idx)"
                     [routerLink]="intentToLink(r)!"
                     (click)="onItemNavigate(r)">
                    <div class="row-icon"><i class="pi" [ngClass]="r.pi"></i></div>
                    <div class="row-body">
                      <div class="row-title">{{ r.title }}</div>
                      <div class="row-sub">{{ r.subtitle }}</div>
                    </div>
                    <div class="row-meta"><span class="badge">Recent</span><i class="pi pi-arrow-right"></i></div>
                  </a>
                </div>
              </div>
            </ng-container>

            <ng-container *ngIf="topPicks().length">
              <div class="study-section">
                <div class="study-section__title">Top picks</div>
                <div class="study-list">
                  <ng-container *ngFor="let item of topPicks(); let idx = index">
                    <div *ngIf="item.disabled || !intentToLink(item); else topPickRow" class="study-row disabled" role="button" aria-disabled="true">
                      <div class="row-icon"><i class="pi" [ngClass]="item.pi"></i></div>
                      <div class="row-body">
                        <div class="row-title">
                          {{ item.title }}
                          <span *ngIf="item.badge" class="badge">{{ item.badge }}</span>
                        </div>
                        <div class="row-sub">{{ item.subtitle }}</div>
                      </div>
                      <div class="row-meta"><i class="pi pi-lock"></i></div>
                    </div>
                    <ng-template #topPickRow>
                      <a class="study-row"
                         [class.active]="activeIndex() === rowIndex('top-' + idx)"
                         [routerLink]="intentToLink(item)!"
                         (click)="onItemNavigate(item)">
                        <div class="row-icon"><i class="pi" [ngClass]="item.pi"></i></div>
                        <div class="row-body">
                          <div class="row-title">
                            {{ item.title }}
                            <span *ngIf="item.badge" class="badge">{{ item.badge }}</span>
                          </div>
                          <div class="row-sub">{{ item.subtitle }}</div>
                        </div>
                        <div class="row-meta"><i class="pi pi-arrow-right"></i></div>
                      </a>
                    </ng-template>
                  </ng-container>
                </div>
              </div>
            </ng-container>

            <button type="button" class="browse-row" (click)="toggleBrowseAll()">
              <span>Browse all study resources</span>
              <i class="pi" [ngClass]="browseAllOpen() ? 'pi-chevron-up' : 'pi-chevron-down'"></i>
            </button>

            <ng-container *ngIf="browseAllOpen()">
              <div *ngFor="let g of limitedGroups()" class="study-section">
                <button type="button" class="group-header" (click)="toggleGroup(g.key)">
                  <span>{{ g.title }}</span>
                  <i class="pi" [ngClass]="isGroupExpanded(g.key) ? 'pi-chevron-up' : 'pi-chevron-down'"></i>
                </button>
                <div class="study-list" *ngIf="isGroupExpanded(g.key)">
                  <ng-container *ngFor="let item of g.items; let ii = index">
                    <div *ngIf="item.disabled || !intentToLink(item); else groupRow" class="study-row disabled" role="button" aria-disabled="true">
                      <div class="row-icon"><i class="pi" [ngClass]="item.pi"></i></div>
                      <div class="row-body">
                        <div class="row-title">
                          {{ item.title }}
                          <span *ngIf="item.badge" class="badge">{{ item.badge }}</span>
                        </div>
                        <div class="row-sub">{{ item.subtitle }}</div>
                      </div>
                      <div class="row-meta"><i class="pi pi-lock"></i></div>
                    </div>
                    <ng-template #groupRow>
                      <a class="study-row"
                         [class.active]="activeIndex() === rowIndex('grp-' + g.key + '-' + ii)"
                         [routerLink]="intentToLink(item)!"
                         (click)="onItemNavigate(item)">
                        <div class="row-icon"><i class="pi" [ngClass]="item.pi"></i></div>
                        <div class="row-body">
                          <div class="row-title">
                            {{ item.title }}
                            <span *ngIf="item.badge" class="badge">{{ item.badge }}</span>
                          </div>
                          <div class="row-sub">{{ item.subtitle }}</div>
                        </div>
                        <div class="row-meta"><i class="pi pi-arrow-right"></i></div>
                      </a>
                    </ng-template>
                  </ng-container>
                  <a *ngIf="viewAllLink(g)" class="study-row viewall-row"
                     [class.active]="activeIndex() === rowIndex('grp-' + g.key + '-viewall')"
                     [routerLink]="viewAllLink(g)!"
                     (click)="onViewAll()">
                    <div class="row-icon"><i class="pi pi-compass"></i></div>
                    <div class="row-body">
                      <div class="row-title">View all {{ g.title }}</div>
                    </div>
                    <div class="row-meta"><i class="pi pi-arrow-right"></i></div>
                  </a>
                </div>
              </div>
            </ng-container>
          </ng-container>

          <ng-template #searchMode>
            <div class="study-section">
              <div class="study-section__title">Results</div>
              <div class="study-list">
                <ng-container *ngFor="let item of searchResults(); let idx = index">
                  <div *ngIf="item.disabled || !intentToLink(item); else searchRow" class="study-row disabled" role="button" aria-disabled="true">
                    <div class="row-icon"><i class="pi" [ngClass]="item.pi"></i></div>
                    <div class="row-body">
                      <div class="row-title">
                        {{ item.title }}
                        <span *ngIf="item.badge" class="badge">{{ item.badge }}</span>
                      </div>
                      <div class="row-sub">{{ item.subtitle }}</div>
                    </div>
                    <div class="row-meta"><span class="badge">{{ item._group }}</span></div>
                  </div>
                  <ng-template #searchRow>
                    <a class="study-row"
                       [class.active]="activeIndex() === rowIndex('search-' + idx)"
                       [routerLink]="intentToLink(item)!"
                       (click)="onItemNavigate(item)">
                      <div class="row-icon"><i class="pi" [ngClass]="item.pi"></i></div>
                      <div class="row-body">
                        <div class="row-title">
                          {{ item.title }}
                          <span *ngIf="item.badge" class="badge">{{ item.badge }}</span>
                        </div>
                        <div class="row-sub">{{ item.subtitle }}</div>
                      </div>
                      <div class="row-meta">
                        <span class="badge">{{ item._group }}</span>
                        <i class="pi pi-arrow-right"></i>
                      </div>
                    </a>
                  </ng-template>
                </ng-container>
                <div *ngIf="!searchResults().length" class="empty-state">No matches</div>
              </div>
            </div>
          </ng-template>
        </div>
      </div>
    </ng-container>
  </div>
  `
})
export class HeaderComponent implements OnInit {
  private doc = inject(DOCUMENT);
  private router = inject(Router);

  // route state
  mode = signal<Mode>('dashboard');
  currentTech = signal<'javascript' | 'angular' | 'react' | 'vue' | 'html' | 'css' | null>(null);
  section = signal<'coding' | 'trivia' | 'debug' | null>(null);

  // prepare groups
  groups: PrepareGroup[] = PREPARE_GROUPS.filter(g => g.key !== 'courses');
  private recentKey = 'fa:recent:study';
  recentItems = signal<PrepareItem[]>([]);
  searchTerm = '';
  activeIndex = signal<number>(-1);
  browseAllOpen = signal(false);
  expanded = signal<Record<string, boolean>>({ foundations: true, practice: true });

  // menus
  megaOpen = signal(false);
  profileOpen = signal(false);
  mobileNavOpen = signal(false);

  topPicks(): PrepareItem[] {
    if (this.isSearching()) return [];
    const picks: PrepareItem[] = [];
    for (const g of this.groups) {
      for (const it of g.items) {
        picks.push(it);
        if (picks.length >= 8) return picks;
      }
    }
    return picks;
  }

  limitedGroups(): PrepareGroup[] {
    return this.groups.map(g => ({ ...g, items: g.items.slice(0, 2) }));
  }

  public auth = inject(AuthService);
  isPro = computed(() => isProActive(this.auth.user()));
  ctaLabel = computed(() => {
    if (this.isPro()) return 'Manage subscription';
    return this.auth.isLoggedIn() ? 'Upgrade' : 'Get full access';
  });
  ctaLink = computed(() => (this.isPro() ? ['/profile'] : ['/pricing']));

  constructor() {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd), startWith(null))
      .subscribe(() => {
        this.parseUrl(this.router.url);
        this.closeAll();
        this.updateSafeTop();
        this.loadRecents();
      });
  }

  isAdmin(): boolean {
    return (this.auth.user()?.role ?? 'user') === 'admin';
  }

  ngOnInit(): void { }

  // —— utils / routing ——
  isSearching(): boolean {
    return (this.searchTerm || '').trim().length > 0;
  }

  private resolveTech(): Tech {
    const pref = (defaultPrefs().defaultTech as Tech | undefined) ?? 'javascript';
    return this.currentTech() ?? pref;
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

  visibleItems(): VisibleEntry[] {
    const out: VisibleEntry[] = [];
    if (this.isSearching()) {
      this.searchResults().forEach((it, idx) => {
        const link = this.intentToLink(it);
        if (!link || it.disabled) return;
        out.push({ origin: `search-${idx}`, item: it, link, group: (it as any)._group });
      });
      return out;
    }

    this.recentItems().forEach((it, idx) => {
      const link = this.intentToLink(it);
      if (!link || it.disabled) return;
      out.push({ origin: `recent-${idx}`, item: it, link });
    });

    this.topPicks().forEach((it, idx) => {
      const link = this.intentToLink(it);
      if (!link || it.disabled) return;
      out.push({ origin: `top-${idx}`, item: it, link });
    });

    if (this.browseAllOpen()) {
      this.limitedGroups().forEach(g => {
        if (!this.isGroupExpanded(g.key)) return;
        g.items.forEach((it, ii) => {
          const link = this.intentToLink(it);
          if (!link || it.disabled) return;
          out.push({ origin: `grp-${g.key}-${ii}`, item: it, link, group: g.title });
        });
        const viewAll = this.viewAllLink(g);
        if (viewAll) {
          const placeholder: PrepareItem = {
            key: `viewall-${g.key}`,
            title: `View all ${g.title}`,
            subtitle: '',
            pi: 'pi pi-compass',
            intent: 'route',
            target: { name: 'guides' } as any
          };
          out.push({
            origin: `grp-${g.key}-viewall`,
            item: placeholder,
            link: viewAll,
            isViewAll: true,
            group: g.title
          });
        }
      });
    }
    return out;
  }

  rowIndex(origin: string): number {
    return this.visibleItems().findIndex(v => v.origin === origin);
  }

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

  trackByGroupKey(_: number, g: PrepareGroup) { return g.key; }
  trackByItemKey(_: number, it: PrepareItem) { return it.key; }

  toggleBrowseAll() {
    this.browseAllOpen.update(v => !v);
  }

  toggleGroup(key: string) {
    this.expanded.update(prev => ({ ...prev, [key]: !prev[key] }));
  }

  isGroupExpanded(key: string) {
    return !!this.expanded()[key];
  }

  viewAllLink(g: PrepareGroup): any[] | null {
    switch (g.key) {
      case 'foundations':
      case 'resources':
        return ['/guides'];
      case 'practice':
        return ['/', this.resolveTech()];
      case 'system':
        return ['/system-design'];
      case 'companies':
        return ['/companies'];
      default:
        return null;
    }
  }

  searchResults(): (PrepareItem & { _group?: string })[] {
    if (!this.isSearching()) return [];
    const term = this.searchTerm.trim().toLowerCase();
    const all: (PrepareItem & { _group?: string })[] = [];
    this.groups.forEach(g => all.push(...g.items.map(it => ({ ...it, _group: g.title }))));
    const match = (it: PrepareItem & { _group?: string }) => {
      const hay = [it.title, it.subtitle, it.badge, it._group].filter(Boolean).map(v => String(v).toLowerCase()).join(' ');
      return hay.includes(term);
    };
    return all.filter(match).slice(0, 20);
  }

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
        if (section === 'guide') return ['/guides', 'system-design-blueprint'];
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
        if (section === 'playbook' || section === 'interview-blueprint') return (['/guides', 'interview-blueprint']);
        if (section === 'framework-prep') return (['/guides', 'framework-prep']);
        if (section === 'behavioral') return (['/guides', 'behavioral']);
        if (section === 'system-design' || section === 'system-design-blueprint') return (['/guides', 'system-design-blueprint']);
        return ['/guides'];
      }
      default:
        return null;
    }
  }

  private updateSafeTop() {
    const base = 56;
    const ctx = this.showContextStrip() ? 48 : 0;
    this.doc.documentElement.style.setProperty('--app-safe-top', `${base + ctx}px`);
  }

  @HostListener('document:click')
  onDocumentClick() { this.closeAll(); }

  @HostListener('document:keydown.escape')
  onDocumentEsc() { this.closeAll(); }

  @HostListener('document:keydown', ['$event'])
  onGlobalKey(ev: KeyboardEvent) {
    const target = ev.target as HTMLElement | null;
    const inInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
    const key = ev.key.toLowerCase();
    if ((ev.ctrlKey || ev.metaKey) && key === 'k') {
      ev.preventDefault();
      this.toggleMega();
      return;
    }
    if (!inInput && key === '/') {
      ev.preventDefault();
      this.openOnly('mega');
      this.activeIndex.set(0);
    }
  }

  private openOnly(which: 'mega' | 'profile' | 'mobile' | null) {
    this.megaOpen.set(which === 'mega');
    this.profileOpen.set(which === 'profile');
    this.mobileNavOpen.set(which === 'mobile');
    if (which === 'mega') {
      this.activeIndex.set(-1);
      this.browseAllOpen.set(false);
      this.loadRecents();
    }
  }

  toggleMega() { this.openOnly(this.megaOpen() ? null : 'mega'); }
  toggleProfileMenu() { this.openOnly(this.profileOpen() ? null : 'profile'); }
  toggleMobileMenu() { this.openOnly(this.mobileNavOpen() ? null : 'mobile'); }

  closeAll() { this.openOnly(null); }

  logout() {
    this.auth.logout().subscribe();
    this.closeAll();
    this.router.navigate(['/']);
  }

  onItemNavigate(it: PrepareItem) {
    this.pushRecent(it);
    this.closeAll();
  }

  onViewAll() {
    this.closeAll();
  }

  moveActive(delta: number) {
    const list = this.visibleItems();
    if (!list.length) return;
    const next = (this.activeIndex() + delta + list.length) % list.length;
    this.activeIndex.set(next);
  }

  activateActive() {
    const list = this.visibleItems();
    const idx = this.activeIndex();
    if (idx < 0 || idx >= list.length) return;
    const entry = list[idx];
    if (!entry.link) return;
    this.onItemNavigate(entry.item);
    this.router.navigate(entry.link);
  }

  private loadRecents() {
    try {
      const raw = localStorage.getItem(this.recentKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const map = new Map(this.groups.flatMap(g => g.items.map(it => [it.key, it])));
        const items: PrepareItem[] = [];
        for (const k of parsed) {
          const it = map.get(k);
          if (it) items.push(it);
        }
        this.recentItems.set(items.slice(0, 5));
      }
    } catch { }
  }

  private pushRecent(it: PrepareItem) {
    const existing = this.recentItems().filter(r => r.key !== it.key);
    const next = [it, ...existing].slice(0, 5);
    this.recentItems.set(next);
    try { localStorage.setItem(this.recentKey, JSON.stringify(next.map(x => x.key))); } catch { }
  }
}
