import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  ElementRef,
  HostListener,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs';
import { PREP_MENU_SECTIONS, isPrepMenuPath } from '../../../core/content/prep-menu';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { AppUiStylesService } from '../../../core/services/app-ui-styles.service';
import { AuthService } from '../../../core/services/auth.service';
import { ConversionContextService } from '../../../core/services/conversion-context.service';
import { isProActive } from '../../../core/utils/entitlements.util';
import {
  PrepMenuPanelComponent,
  PrepMenuSelection,
  prepMenuPanelCenter,
} from '../prep-menu/prep-menu-panel.component';

type MarketingLink = {
  label: string;
  route: any[];
  destination: string;
  queryParams?: Record<string, string>;
  activeMatch?: 'interview-questions';
};

type MenuSource = 'desktop' | 'mobile';
type NavArea = 'primary' | 'utility' | 'mobile_menu' | 'prep_menu';

@Component({
    selector: 'app-marketing-header',
    imports: [CommonModule, RouterModule, PrepMenuPanelComponent],
    styleUrls: ['./marketing-header.component.css'],
    templateUrl: './marketing-header.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MarketingHeaderComponent {
  @ViewChild('menuTrigger') menuTrigger?: ElementRef<HTMLButtonElement>;
  @ViewChild('mobileMenuTrigger') mobileMenuTrigger?: ElementRef<HTMLButtonElement>;

  private readonly hostEl = inject(ElementRef<HTMLElement>);
  private readonly doc = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly analytics = inject(AnalyticsService);
  private readonly conversionContext = inject(ConversionContextService);
  private readonly appUiStyles = inject(AppUiStylesService);

  readonly auth = inject(AuthService);
  readonly isPro = computed(() => isProActive(this.auth.user()));
  readonly isAuthenticatedUi = computed(() => this.auth.authUiState() === 'authenticated');
  readonly isAuthUiResolved = computed(() => this.auth.authUiState() !== 'pending');
  readonly brandLink = computed(() => this.isAuthenticatedUi() ? ['/dashboard'] : ['/']);
  readonly brandDestination = computed(() => this.isAuthenticatedUi() ? '/dashboard' : '/');
  readonly menuOpen = signal(false);
  readonly menuAnchorX = signal<number | null>(null);
  readonly menuSection = signal<string>(PREP_MENU_SECTIONS[0]?.id ?? '');
  readonly currentUrl = signal(this.router.url);
  readonly currentPath = computed(() => this.pathOf(this.currentUrl()));
  readonly isMenuTriggerActive = computed(() => {
    const path = this.currentPath();
    return this.menuOpen() || (path !== '/interview-questions' && isPrepMenuPath(path));
  });
  private menuSource: MenuSource | null = null;

  // The other prep destinations live in the prep menu, which is rendered in the initial HTML.
  readonly primaryLinks: MarketingLink[] = [
    {
      label: 'Interview Questions',
      route: ['/interview-questions'],
      destination: '/interview-questions',
      activeMatch: 'interview-questions',
    },
  ];

  readonly guestUtilityLinks: MarketingLink[] = [
    {
      label: 'Pricing',
      route: ['/pricing'],
      destination: '/pricing',
    },
    {
      label: 'Log in',
      route: ['/auth', 'login'],
      destination: '/auth/login',
      queryParams: { src: 'marketing_header' },
    },
  ];

  readonly loggedInUtilityLinks: MarketingLink[] = [
    {
      label: 'Dashboard',
      route: ['/dashboard'],
      destination: '/dashboard',
    },
    {
      label: 'Profile',
      route: ['/profile'],
      destination: '/profile',
    },
  ];

  readonly ctaLabel = computed(() => {
    if (!this.isAuthenticatedUi()) return 'Create free account';
    return this.isPro() ? 'Open dashboard' : 'View pricing';
  });
  readonly ctaLink = computed(() => {
    if (!this.isAuthenticatedUi()) return ['/auth', 'signup'];
    return this.isPro() ? ['/dashboard'] : ['/pricing'];
  });
  readonly ctaDestination = computed(() => {
    if (!this.isAuthenticatedUi()) return '/auth/signup';
    return this.isPro() ? '/dashboard' : '/pricing';
  });
  readonly ctaQueryParams = computed(() => (
    this.isAuthenticatedUi() ? null : { src: 'marketing_header' }
  ));

  constructor() {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.currentUrl.set(event.urlAfterRedirects || event.url);
        this.closeMenu();
      });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target;
    if (!(target instanceof Node) || !this.hostEl.nativeElement.contains(target)) {
      this.closeMenu();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.closeMenu(true);
  }

  @HostListener('window:resize')
  onWindowResize() {
    if (this.menuOpen()) this.syncMenuAnchor();
  }

  toggleMenu(event: Event | undefined, source: MenuSource) {
    event?.stopPropagation();
    if (this.menuOpen()) {
      this.closeMenu();
      return;
    }

    this.menuSource = source;
    this.preloadMenuIcons();
    this.menuSection.set(PREP_MENU_SECTIONS[0]?.id ?? '');
    this.menuOpen.set(true);
    this.syncMenuAnchor();
    if (source === 'mobile') this.trackTopNavClick('mobile_menu', 'menu');
    else this.trackTopNavClick('primary', 'study');
    this.analytics.track('header_study_opened', {
      trigger: source === 'mobile' ? 'mobile_menu' : 'button',
      surface: 'marketing',
    });
  }

  // Marketing routes skip the icon font on load; fetch it once the visitor shows intent to open the menu.
  preloadMenuIcons() {
    this.appUiStyles.ensureCoreLoaded();
  }

  toggleMobileMenu(event?: Event) {
    this.toggleMenu(event, 'mobile');
  }

  closeMenu(restoreFocus = false) {
    if (!this.menuOpen()) return;
    const trigger = restoreFocus ? this.triggerFor(this.menuSource) : null;
    this.menuOpen.set(false);
    this.menuAnchorX.set(null);
    this.menuSource = null;
    trigger?.focus();
  }

  onMenuItemSelected(selection: PrepMenuSelection) {
    this.trackTopNavClick('prep_menu', selection.route, {
      section: selection.section,
      item: selection.key,
      ...(selection.chip ? { chip: selection.chip } : {}),
    });
    this.closeMenu();
  }

  trackBrandClick() {
    this.analytics.track('header_brand_clicked', {
      surface: 'marketing',
      destination: this.brandDestination(),
      auth_state: this.authState(),
    });
  }

  trackPrimaryClick(link: MarketingLink, area: 'primary' | 'mobile_menu' = 'primary') {
    this.trackTopNavClick(area, link.destination);
    if (area === 'mobile_menu') this.closeMenu();
  }

  trackUtilityClick(link: MarketingLink, area: 'utility' | 'mobile_menu' = 'utility') {
    if (link.destination === '/pricing') {
      this.conversionContext.rememberPricingContext('marketing_header', `marketing_header_${area}`);
    }
    this.trackTopNavClick(area, link.destination);
  }

  trackCtaClick(area: 'utility' | 'mobile_menu' = 'utility') {
    if (this.ctaDestination() === '/pricing') {
      this.conversionContext.rememberPricingContext('marketing_header', `marketing_header_${area}`);
    }
    this.trackTopNavClick(area, this.ctaDestination());
  }

  isShowcaseLanding(): boolean {
    return this.currentPath() === '/';
  }

  isPrimaryLinkActive(link: MarketingLink): boolean {
    return link.activeMatch === 'interview-questions' && this.currentPath() === '/interview-questions';
  }

  private syncMenuAnchor() {
    const viewportWidth = this.doc.defaultView?.innerWidth ?? 1280;
    const trigger = this.visibleTrigger();
    const rect = trigger?.getBoundingClientRect();
    const triggerCenter = rect && rect.width ? rect.left + rect.width / 2 : null;
    this.menuAnchorX.set(prepMenuPanelCenter(viewportWidth, triggerCenter));
  }

  private visibleTrigger(): HTMLButtonElement | null {
    const candidates = [
      this.triggerFor(this.menuSource),
      this.menuTrigger?.nativeElement ?? null,
      this.mobileMenuTrigger?.nativeElement ?? null,
    ];
    return candidates.find((element) => {
      if (!element) return false;
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    }) ?? null;
  }

  private triggerFor(source: MenuSource | null): HTMLButtonElement | null {
    if (source === 'desktop') return this.menuTrigger?.nativeElement ?? null;
    if (source === 'mobile') return this.mobileMenuTrigger?.nativeElement ?? null;
    return null;
  }

  private pathOf(url: string): string {
    const primary = this.router.parseUrl(url).root.children['primary'];
    return primary ? `/${primary.segments.map((segment) => segment.path).join('/')}` : '/';
  }

  private trackTopNavClick(area: NavArea, destination: string, extra: Record<string, unknown> = {}) {
    this.analytics.track('header_top_nav_clicked', {
      surface: 'marketing',
      area,
      destination,
      ...extra,
      auth_state: this.authState(),
    });
  }

  private authState(): 'guest' | 'logged_in_free' | 'logged_in_pro' {
    if (!this.auth.isLoggedIn()) return 'guest';
    return this.isPro() ? 'logged_in_pro' : 'logged_in_free';
  }
}
