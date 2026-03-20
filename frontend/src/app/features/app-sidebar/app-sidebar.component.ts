import { CommonModule } from '@angular/common';
import { Component, HostListener, Input, OnDestroy, OnInit, effect, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { BugReportService } from '../../core/services/bug-report.service';
import { PracticeCatalogEntry } from '../../core/models/practice.model';
import { PracticeRegistryService } from '../../core/services/practice-registry.service';

interface LinkItem {
  key: string;
  type: 'link';
  label: string;
  to: string;
  icon?: string;
  query?: Record<string, any>;
}
interface GroupItem {
  type: 'group';
  label: string;
  icon?: string;
  open?: boolean;
  children: LinkItem[];
}
type NavItem = LinkItem | GroupItem;

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    TooltipModule
  ],
  templateUrl: './app-sidebar.component.html',
  styleUrls: ['./app-sidebar.component.css'],
})
export class AppSidebarComponent implements OnInit, OnDestroy {
  @Input() collapsed = false;
  drawerOpen = signal(false);

  private navSub?: Subscription;
  private currentPath = '/';
  private currentQuery: Record<string, any> = {};
  private readonly router = inject(Router);
  private readonly bugReport = inject(BugReportService);
  private readonly practiceRegistry = inject(PracticeRegistryService);

  isLink = (i: NavItem): i is LinkItem => i.type === 'link';
  isGroup = (i: NavItem): i is GroupItem => i.type === 'group';

  nav: NavItem[] = this.buildNav(this.practiceRegistry.catalogEntries());

  private readonly syncNavEffect = effect(() => {
    this.nav = this.buildNav(this.practiceRegistry.catalogEntries());
    this.applyDefaultOpen(this.router.url);
  });

  toggleGroup(i: number) {
    const wasCollapsed = this.collapsed;
    if (wasCollapsed) {
      this.collapsed = false;
      document.body.classList.remove('sidebar-mini');
    }
    this.nav.forEach((item, idx) => {
      if (!this.isGroup(item)) return;
      if (idx === i) {
        item.open = wasCollapsed ? true : !item.open;
      } else {
        item.open = false;
      }
    });
  }

  toggleDrawer() { this.drawerOpen.update(v => !v); }

  ngOnInit(): void {
    this.applyDefaultOpen(this.router.url);
    this.navSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => this.applyDefaultOpen(e.urlAfterRedirects || e.url));
  }

  ngOnDestroy(): void {
    if (this.navSub?.unsubscribe) this.navSub.unsubscribe();
  }

  toggleCollapsed() {
    this.collapsed = !this.collapsed;
    document.body.classList.toggle('sidebar-mini', this.collapsed);
  }

  @HostListener('window:keydown.escape') onEsc() {
    if (this.drawerOpen()) this.drawerOpen.set(false);
  }

  // --- Bug modal actions ---
  openBugModal() {
    this.bugReport.open({
      source: 'sidebar',
      url: typeof window !== 'undefined' ? window.location.href : this.router.url,
      route: this.router.url,
    });
  }

  isLinkActive(item: LinkItem): boolean {
    const path = this.currentPath;
    const view = this.queryValue('view');
    const category = this.queryValue('category');
    const isQuestionDetailRoute = /^\/(javascript|react|angular|vue|html|css)\/(coding|trivia|debug)(\/|$)/.test(path);

    switch (item.key) {
      case 'dashboard':
        return path === '/dashboard';
      case 'question-library':
        return (path === '/coding' || path.startsWith('/coding/') || isQuestionDetailRoute)
          && view !== 'formats'
          && category !== 'system';
      case 'incidents':
        return path === '/incidents' || path.startsWith('/incidents/');
      case 'system-design':
        return path === '/system-design'
          || path.startsWith('/system-design/')
          || (path === '/coding' && view === 'formats' && category === 'system');
      case 'code-reviews':
        return path === '/code-reviews' || path.startsWith('/code-reviews/');
      case 'tradeoff-battles':
        return path === '/tradeoffs' || path.startsWith('/tradeoffs/');
      case 'tracks':
        return path === '/tracks' || path.startsWith('/tracks/');
      case 'question-formats':
        return path === '/coding' && view === 'formats' && category !== 'system';
      case 'track-crash':
        return path === '/tracks/crash-7d';
      case 'track-foundations':
        return path === '/tracks/foundations-30d';
      case 'focus-areas':
        return path === '/focus-areas';
      case 'companies':
        return path === '/companies' || path.startsWith('/companies/');
      case 'guide-interview-blueprint':
        return path === '/guides/interview-blueprint' || path.startsWith('/guides/interview-blueprint/');
      case 'guide-behavioral':
        return path === '/guides/behavioral' || path.startsWith('/guides/behavioral/');
      case 'guide-system-design-blueprint':
        return path === '/guides/system-design-blueprint' || path.startsWith('/guides/system-design-blueprint/');
      case 'cv-linter':
        return path === '/tools/cv' || path === '/tools/cv-linter';
      case 'changelog':
        return path === '/changelog';
      default:
        return path === item.to;
    }
  }

  private applyDefaultOpen(url: string) {
    const tree = this.router.parseUrl(url || '/');
    const primarySegments = tree.root.children['primary']?.segments ?? [];

    this.currentPath = `/${primarySegments.map((segment) => segment.path).join('/')}` || '/';
    this.currentQuery = tree.queryParams ?? {};

    const activeGroupIndex = this.nav.findIndex((item) =>
      this.isGroup(item) && item.children.some((child) => this.isLinkActive(child)),
    );

    if (activeGroupIndex >= 0) {
      this.nav.forEach((item, idx) => {
        if (!this.isGroup(item)) return;
        item.open = idx === activeGroupIndex;
      });
      return;
    }

    if (this.currentPath === '/dashboard') {
      this.nav.forEach((item, idx) => {
        if (!this.isGroup(item)) return;
        item.open = idx === 1;
      });
    }
  }

  private queryValue(key: string): string | null {
    const value = this.currentQuery[key];
    if (value === undefined || value === null) return null;
    return String(value);
  }

  private buildNav(practiceEntries: PracticeCatalogEntry[]): NavItem[] {
    return [
      { key: 'dashboard', type: 'link', label: 'Dashboard', icon: 'pi pi-th-large', to: '/dashboard' },
      {
        type: 'group',
        label: 'Practice questions',
        icon: 'pi pi-code',
        open: false,
        children: practiceEntries.map((entry) => ({
          key: entry.key,
          type: 'link' as const,
          label: entry.label,
          to: entry.route,
          icon: entry.icon,
          query: entry.query,
        })),
      },
      {
        type: 'group',
        label: 'Study paths',
        icon: 'pi pi-directions-alt',
        open: false,
        children: [
          { key: 'track-crash', type: 'link', label: 'Crash Track (7 days)', to: '/tracks/crash-7d', icon: 'pi pi-bolt' },
          { key: 'track-foundations', type: 'link', label: 'Foundations Track (30 days)', to: '/tracks/foundations-30d', icon: 'pi pi-calendar' },
          { key: 'focus-areas', type: 'link', label: 'All focus areas', to: '/focus-areas', icon: 'pi pi-compass' },
          { key: 'companies', type: 'link', label: 'Company interview questions', to: '/companies', icon: 'pi pi-building' },
        ],
      },
      {
        type: 'group',
        label: 'Guides',
        icon: 'pi pi-book',
        open: false,
        children: [
          { key: 'guide-interview-blueprint', type: 'link', label: 'Interview Blueprint', to: '/guides/interview-blueprint', icon: 'pi pi-book' },
          { key: 'guide-behavioral', type: 'link', label: 'Behavioral Interview Blueprint', to: '/guides/behavioral', icon: 'pi pi-users' },
          { key: 'guide-system-design-blueprint', type: 'link', label: 'System Design Blueprint', to: '/guides/system-design-blueprint', icon: 'pi pi-sitemap' },
        ],
      },
      {
        type: 'group',
        label: 'Shortcuts & tools',
        icon: 'pi pi-stopwatch',
        open: false,
        children: [
          { key: 'cv-linter', type: 'link', label: 'CV Linter', to: '/tools/cv', icon: 'pi pi-file-edit' },
          { key: 'changelog', type: 'link', label: 'Product changelog', to: '/changelog', icon: 'pi pi-megaphone' },
        ],
      },
    ];
  }

}
