import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, HostListener, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { AuthService } from '../../../core/services/auth.service';
import { isProActive } from '../../../core/utils/entitlements.util';

type MarketingLink = {
  label: string;
  route: any[];
  destination: string;
  queryParams?: Record<string, string>;
  activeMatch?: 'question-library' | 'essential-60' | 'path';
};

@Component({
  selector: 'app-marketing-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  styleUrls: ['./marketing-header.component.css'],
  templateUrl: './marketing-header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarketingHeaderComponent {
  private readonly hostEl = inject(ElementRef<HTMLElement>);
  private readonly router = inject(Router);
  private readonly analytics = inject(AnalyticsService);

  readonly auth = inject(AuthService);
  readonly isPro = computed(() => isProActive(this.auth.user()));
  readonly mobileMenuOpen = signal(false);
  readonly currentUrl = signal(this.router.url);

  readonly primaryLinks: MarketingLink[] = [
    {
      label: 'Essential 60',
      route: ['/interview-questions', 'essential'],
      destination: '/interview-questions/essential',
      activeMatch: 'essential-60',
    },
    {
      label: 'Question Library',
      route: ['/coding'],
      queryParams: { reset: '1' },
      destination: '/coding?reset=1',
      activeMatch: 'question-library',
    },
    {
      label: 'Study Plans',
      route: ['/tracks'],
      destination: '/tracks',
      activeMatch: 'path',
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

  readonly ctaLabel = computed(() => (this.auth.isLoggedIn() ? 'Open dashboard' : 'Start free'));
  readonly ctaLink = computed(() => (this.auth.isLoggedIn() ? ['/dashboard'] : ['/auth', 'signup']));
  readonly ctaDestination = computed(() => (this.auth.isLoggedIn() ? '/dashboard' : '/auth/signup'));

  constructor() {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.currentUrl.set(event.urlAfterRedirects || event.url);
        this.mobileMenuOpen.set(false);
      });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target;
    if (!(target instanceof Node)) {
      this.mobileMenuOpen.set(false);
      return;
    }

    if (!this.hostEl.nativeElement.contains(target)) {
      this.mobileMenuOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.mobileMenuOpen.set(false);
  }

  toggleMobileMenu(event?: Event) {
    event?.stopPropagation();
    const next = !this.mobileMenuOpen();
    this.mobileMenuOpen.set(next);

    if (next) {
      this.trackTopNavClick('mobile_menu', 'menu');
    }
  }

  trackBrandClick() {
    this.analytics.track('header_brand_clicked', {
      surface: 'marketing',
      destination: '/',
      auth_state: this.authState(),
    });
  }

  trackPrimaryClick(link: MarketingLink, area: 'primary' | 'mobile_menu' = 'primary') {
    this.trackTopNavClick(area, link.destination);
  }

  trackUtilityClick(link: MarketingLink, area: 'utility' | 'mobile_menu' = 'utility') {
    this.trackTopNavClick(area, link.destination);
  }

  trackCtaClick(area: 'utility' | 'mobile_menu' = 'utility') {
    this.trackTopNavClick(area, this.ctaDestination());
  }

  isShowcaseLanding(): boolean {
    const urlTree = this.router.parseUrl(this.currentUrl());
    const primary = urlTree.root.children['primary'];
    const path = primary ? `/${primary.segments.map((segment) => segment.path).join('/')}` : '/';
    return path === '/';
  }

  isPrimaryLinkActive(link: MarketingLink): boolean {
    const urlTree = this.router.parseUrl(this.currentUrl());
    const primary = urlTree.root.children['primary'];
    const path = primary ? `/${primary.segments.map((segment) => segment.path).join('/')}` : '/';

    switch (link.activeMatch) {
      case 'question-library':
        return path === '/coding';
      case 'essential-60':
        return path === '/interview-questions/essential';
      case 'path': {
        const targetPath = link.destination.split('?')[0];
        return path === targetPath || path.startsWith(`${targetPath}/`);
      }
      default:
        return false;
    }
  }

  private trackTopNavClick(area: 'primary' | 'utility' | 'mobile_menu', destination: string) {
    this.analytics.track('header_top_nav_clicked', {
      surface: 'marketing',
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
