import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, computed, ElementRef, HostListener, inject, OnInit, signal, ViewChild } from '@angular/core';
import { NavigationEnd, Params, Router, RouterModule } from '@angular/router';
import { filter, startWith } from 'rxjs';
import { defaultPrefs, Tech } from '../../../core/models/user.model';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { AuthService } from '../../../core/services/auth.service';
import { isProActive } from '../../../core/utils/entitlements.util';
import { PREPARE_GROUPS, PrepareGroup, PrepareItem, TargetName } from '../../prepare/prepare.registry';
import { AppSidebarDrawerService } from '../../../core/services/app-sidebar-drawer.service';

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

type StudyPrimaryActionKey =
  | 'continue'
  | 'interview_blueprint'
  | 'essential_60'
  | 'question_library'
  | 'study_plans';

type StudyPrimaryAction = {
  key: StudyPrimaryActionKey;
  title: string;
  subtitle: string;
  icon: string;
  route: any[];
  queryParams?: Params;
  badge?: string | null;
  emphasis?: 'default' | 'promoted';
  item?: PrepareItem | null;
};

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  styleUrls: ['./header.component.css'],
  templateUrl: './header.component.html',
})
export class HeaderComponent implements OnInit {
  @ViewChild('desktopStudyTrigger') desktopStudyTrigger?: ElementRef<HTMLButtonElement>;
  @ViewChild('mobileStudyTrigger') mobileStudyTrigger?: ElementRef<HTMLButtonElement>;

  private doc = inject(DOCUMENT);
  private router = inject(Router);
  private hostEl = inject(ElementRef<HTMLElement>);
  private drawerState = inject(AppSidebarDrawerService);
  private analytics = inject(AnalyticsService);

  // route state
  mode = signal<Mode>('dashboard');
  currentPath = signal('/');
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
  megaAnchorX = signal<number | null>(null);
  profileOpen = signal(false);
  sidebarDrawerOpen = this.drawerState.isOpen;

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
  isStudyActive = computed(() => {
    const path = this.currentPath();
    if (
      path === '/'
      || path === '/dashboard'
      || path.startsWith('/profile')
      || path.startsWith('/admin')
      || path.startsWith('/pricing')
      || path.startsWith('/billing')
      || path.startsWith('/auth')
      || path.startsWith('/legal')
      || path.startsWith('/404')
      || path.startsWith('/changelog')
    ) {
      return false;
    }

    if (
      path.startsWith('/interview-questions')
      || path.startsWith('/coding')
      || path.startsWith('/incidents')
      || path.startsWith('/tradeoffs')
      || path.startsWith('/tracks')
      || path.startsWith('/companies')
      || path.startsWith('/focus-areas')
      || path.startsWith('/guides')
      || path.startsWith('/system-design')
    ) {
      return true;
    }

    return /^\/(javascript|angular|react|vue|html|css)(\/|$)/.test(path);
  });

  studyPrimaryActions(): StudyPrimaryAction[] {
    const recent = this.recentItems()[0] ?? null;
    const recentLink = recent ? this.intentToLink(recent) : null;
    const continueFallbackIsDashboard = this.auth.isLoggedIn();

    return [
      {
        key: 'continue',
        title: 'Continue where I left off',
        subtitle: recent
          ? recent.subtitle
          : (this.auth.isLoggedIn()
            ? 'Return to your dashboard or your last interview prep path.'
            : 'Open the fastest route back into interview prep.'),
        icon: 'pi-history',
        route: recentLink ?? (continueFallbackIsDashboard ? ['/dashboard'] : ['/guides', 'interview-blueprint', 'intro']),
        queryParams: undefined,
        badge: recent ? 'Recent' : null,
        item: recent,
      },
      {
        key: 'interview_blueprint',
        title: 'Frontend interview preparation guide',
        subtitle: 'Start with the process, round types, scoring signals, and a practical prep sequence.',
        icon: 'pi-map',
        route: ['/guides', 'interview-blueprint', 'intro'],
        badge: 'Start here',
        emphasis: 'promoted',
      },
      {
        key: 'essential_60',
        title: 'FrontendAtlas Essential 60',
        subtitle: 'Open the curated shortlist across JavaScript, UI coding, system design, and concepts.',
        icon: 'pi-compass',
        route: ['/interview-questions', 'essential'],
      },
      {
        key: 'question_library',
        title: 'Question Library',
        subtitle: 'Open the full Question Library when you want broader coverage, filters, and every practice format.',
        icon: 'pi-bolt',
        route: ['/coding'],
        queryParams: { reset: 1 },
      },
      {
        key: 'study_plans',
        title: 'Study Plans',
        subtitle: 'Open guided tracks when you want a clearer sequence and less choice load.',
        icon: 'pi-directions-alt',
        route: ['/tracks'],
      },
    ];
  }

  constructor() {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd), startWith(null))
      .subscribe(() => {
        this.parseUrl(this.router.url);
        this.closeAll();
        this.drawerState.close();
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

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.searchTerm = target?.value ?? '';
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

    this.studyPrimaryActions().forEach((action, idx) => {
      out.push({
        origin: `primary-${idx}`,
        item: action.item ?? {
          key: `study-${action.key}`,
          title: action.title,
          subtitle: action.subtitle,
          pi: action.icon,
          intent: 'route',
          target: { name: 'guides' } as any,
          badge: action.badge ?? null,
        },
        link: action.route,
      });
    });

    return out;
  }

  rowIndex(origin: string): number {
    return this.visibleItems().findIndex(v => v.origin === origin);
  }

  private parseUrl(url: string) {
    const cleanPath = url.split('?')[0].split('#')[0] || '/';
    this.currentPath.set(cleanPath === '' ? '/' : cleanPath);
    const segs = cleanPath.split('/').filter(Boolean);

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
        return ['/coding'];
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
      case 'tracks':
        return ['/tracks'];
      case 'warmup':
        return ['/interview-questions'];
      case 'tools': {
        const tool = String(t.params?.['tool'] ?? 'cv').trim();
        return ['/tools', tool || 'cv'];
      }
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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target;
    if (!(target instanceof Node)) {
      this.closeAll();
      return;
    }
    if (!this.hostEl.nativeElement.contains(target)) {
      this.closeAll();
    }
  }

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
      this.analytics.track('header_study_opened', { trigger: 'shortcut' });
      this.activeIndex.set(0);
    }
  }

  private openOnly(which: 'mega' | 'profile' | null) {
    this.megaOpen.set(which === 'mega');
    this.profileOpen.set(which === 'profile');
    if (which === 'mega') {
      this.syncMegaAnchor();
      this.searchTerm = '';
      this.activeIndex.set(-1);
      this.browseAllOpen.set(false);
      this.loadRecents();
    } else {
      this.megaAnchorX.set(null);
      this.searchTerm = '';
    }
  }

  toggleMega(ev?: Event) {
    this.drawerState.close();
    if (this.megaOpen()) {
      this.openOnly(null);
      return;
    }
    this.syncMegaAnchor(ev);
    this.openOnly('mega');
    this.trackTopNavClick('primary', 'study');
    this.analytics.track('header_study_opened', { trigger: ev ? 'button' : 'shortcut' });
  }
  toggleProfileMenu(event?: Event) {
    event?.stopPropagation();
    this.drawerState.close();
    if (!this.profileOpen()) {
      this.trackTopNavClick('utility', 'account_menu');
    }
    this.openOnly(this.profileOpen() ? null : 'profile');
  }
  toggleSidebarDrawer(event?: Event) {
    event?.stopPropagation();
    this.openOnly(null);
    if (!this.sidebarDrawerOpen()) {
      this.trackTopNavClick('mobile_menu', 'sidebar');
    }
    this.drawerState.toggle();
  }

  closeAll() { this.openOnly(null); }

  @HostListener('window:resize')
  onWindowResize() {
    if (this.megaOpen()) this.syncMegaAnchor();
  }

  logout() {
    this.auth.logout().subscribe();
    this.closeAll();
    this.router.navigate(['/']);
  }

  onStudyPrimaryAction(action: StudyPrimaryAction) {
    if (action.item) this.pushRecent(action.item);

    if (action.key === 'question_library') {
      this.analytics.track('header_study_browse_full_library_clicked', {
        destination: 'question_library',
        route: this.serializeLink(action.route, action.queryParams),
      });
    } else {
      this.analytics.track('header_study_primary_cta_clicked', {
        action: action.key,
        route: this.serializeLink(action.route, action.queryParams),
      });
    }

    this.closeAll();
  }

  trackBrandClick() {
    this.analytics.track('header_brand_clicked', {
      surface: 'app',
      destination: '/dashboard',
      auth_state: this.authState(),
    });
  }

  trackUtilityClick(destination: string) {
    this.trackTopNavClick('utility', destination);
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
    if (!this.isSearching()) {
      const action = this.studyPrimaryActions()[idx];
      if (!action) return;
      this.onStudyPrimaryAction(action);
      this.router.navigate(action.route, { queryParams: action.queryParams });
      return;
    }
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

  private syncMegaAnchor(ev?: Event) {
    const viewportWidth = this.doc.defaultView?.innerWidth ?? 1280;
    const panelWidth = Math.min(viewportWidth * 0.92, 640);
    const edgePadding = 12;
    const minCenter = edgePadding + panelWidth / 2;
    const maxCenter = viewportWidth - edgePadding - panelWidth / 2;

    const desiredCenter =
      this.readEventCenter(ev) ??
      this.findVisibleStudyTriggerCenter() ??
      viewportWidth / 2;

    const clampedCenter = minCenter <= maxCenter
      ? Math.min(maxCenter, Math.max(minCenter, desiredCenter))
      : viewportWidth / 2;

    this.megaAnchorX.set(Math.round(clampedCenter));
  }

  private readEventCenter(ev?: Event): number | null {
    const target = ev?.currentTarget;
    if (!(target instanceof HTMLElement)) return null;
    const rect = target.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    return rect.left + rect.width / 2;
  }

  private findVisibleStudyTriggerCenter(): number | null {
    const desktop = this.desktopStudyTrigger?.nativeElement;
    if (desktop && this.isVisible(desktop)) {
      const rect = desktop.getBoundingClientRect();
      return rect.left + rect.width / 2;
    }

    const mobile = this.mobileStudyTrigger?.nativeElement;
    if (mobile && this.isVisible(mobile)) {
      const rect = mobile.getBoundingClientRect();
      return rect.left + rect.width / 2;
    }

    return null;
  }

  private isVisible(el: HTMLElement): boolean {
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return false;
    const style = this.doc.defaultView?.getComputedStyle(el);
    if (!style) return true;
    return style.display !== 'none' && style.visibility !== 'hidden';
  }

  private serializeLink(route: any[], queryParams?: Params): string {
    const path = route.map((segment) => String(segment || '')).join('/') || '/';
    if (!queryParams || !Object.keys(queryParams).length) return path;
    const query = new URLSearchParams(
      Object.entries(queryParams).reduce<Record<string, string>>((acc, [key, value]) => {
        if (value !== null && value !== undefined) acc[key] = String(value);
        return acc;
      }, {})
    ).toString();
    return query ? `${path}?${query}` : path;
  }

  private trackTopNavClick(area: 'primary' | 'utility' | 'mobile_menu', destination: string) {
    this.analytics.track('header_top_nav_clicked', {
      surface: 'app',
      area,
      destination,
      auth_state: this.authState(),
    });
  }

  private authState(): 'guest' | 'logged_in_free' | 'logged_in_pro' {
    if (!this.auth.isLoggedIn()) return 'guest';
    return this.isPro() ? 'logged_in_pro' : 'logged_in_free';
  }
}
