// app.component.ts
import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Component, OnDestroy, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterModule, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { BugReportService } from './core/services/bug-report.service';
import { DailyService } from './core/services/daily.service';
import { PremiumGateService } from './core/services/premium-gate.service';
import { AnalyticsService } from './core/services/analytics.service';
import { TelemetryBootstrapService } from './core/services/telemetry-bootstrap.service';
import { AppUiStylesService } from './core/services/app-ui-styles.service';
import { AppSidebarDrawerService } from './core/services/app-sidebar-drawer.service';
import { AuthService } from './core/services/auth.service';
import { isMarketingPath, normalizePathname } from './core/utils/marketing-route.util';
import { AppSidebarComponent } from './features/app-sidebar/app-sidebar.component';
import { BugReportDialogComponent } from './shared/components/bug-report-dialog/bug-report-dialog.component';
import { PremiumRequiredDialogComponent } from './shared/components/premium-required-dialog/premium-required-dialog.component';
import { HeaderComponent } from './shared/components/header/header.component';
import { MarketingHeaderComponent } from './shared/components/marketing-header/marketing-header.component';
import { PrepRoadmapSwitcherComponent } from './shared/components/prep-roadmap/prep-roadmap-switcher.component';
import { AchievementToastComponent } from './shared/components/achievement-toast/achievement-toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterModule,
    HeaderComponent,
    MarketingHeaderComponent,
    AppSidebarComponent,
    BugReportDialogComponent,
    PremiumRequiredDialogComponent,
    PrepRoadmapSwitcherComponent,
    AchievementToastComponent,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private readonly doc = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly currentUrl = signal(this.initialUrl());
  bugReport = inject(BugReportService);
  premiumGate = inject(PremiumGateService);
  premiumGateState = this.premiumGate.dialogState;
  private readonly analytics = inject(AnalyticsService);
  private readonly telemetry = inject(TelemetryBootstrapService);
  private readonly appUiStyles = inject(AppUiStylesService);
  readonly auth = inject(AuthService);
  readonly sidebarDrawerOpen = inject(AppSidebarDrawerService).isOpen;

  // hide header on /auth/*
  isAuthRoute = computed(() => this.currentUrl().startsWith('/auth'));
  isMarketingRoute = computed(() => isMarketingPath(this.currentUrl()));
  showAppHeader = computed(() => !this.isAuthRoute() && !this.isMarketingRoute());
  showMarketingHeader = computed(() => !this.isAuthRoute() && this.isMarketingRoute());

  // --- HIDE SIDEBAR on guide detail routes ---
  // any of: /guides/interview-blueprint/*, /guides/system-design-blueprint/*, /guides/behavioral/*
  private readonly HIDE_SIDEBAR_PATTERNS = [
    /^\/guides\/interview-blueprint\/.+/,
    /^\/guides\/framework-prep\/.+/,
    /^\/guides\/system-design-blueprint\/.+/,
    /^\/guides\/playbook\/.+/,
    /^\/guides\/system-design\/.+/,
    /^\/guides\/behavioral\/.+/,
    /^\/system-design\/[^/]+\/?$/,
    /^\/incidents\/[^/]+\/?$/,
    /^\/(javascript|angular|react|vue|html|css)\/trivia\/[^/]+$/,
    /^\/coding\/[^/]+$/,
    /^\/(javascript|angular|react|vue|html|css)\/coding\/[^/]+$/,
    /^\/$/,
    /^\/showcase\/?$/,
  ];

  // strip query/hash before testing
  private pathOnly = computed(() => this.currentUrl().split('?')[0].split('#')[0]);

  readonly isGuestStarterRoute = computed(() => {
    if (this.auth.isLoggedIn()) return false;
    const path = this.pathOnly().replace(/\/+$/, '') || '/';
    return path === '/dashboard'
      || path === '/interview-questions'
      || path === '/interview-questions/essential'
      || path === '/coding'
      || path === '/tracks';
  });

  hideSidebar = computed(() =>
    this.HIDE_SIDEBAR_PATTERNS.some(rx => rx.test(this.pathOnly()))
  );
  showSidebar = computed(() => !this.hideSidebar());

  // --- daily set + rollover ---
  private daily = inject(DailyService);
  private midnightTimer?: number;

  ngOnInit() {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        const url = e.urlAfterRedirects || e.url;
        this.currentUrl.set(url);
        this.configureRouteRuntime(url);
        this.analytics.trackPageView(url);
      });

    if (!this.isBrowser) return;

    const initialUrl = this.initialUrl();
    this.currentUrl.set(initialUrl);
    this.configureRouteRuntime(initialUrl);
    this.analytics.trackPageView(initialUrl);
    this.daily.ensureTodaySet();
    this.scheduleToNextMidnight();
    document.addEventListener('visibilitychange', this.onVisibility);
  }

  ngOnDestroy() {
    if (!this.isBrowser) return;
    if (this.midnightTimer) window.clearTimeout(this.midnightTimer);
    document.removeEventListener('visibilitychange', this.onVisibility);
  }

  private onVisibility = () => {
    if (!document.hidden) {
      this.daily.ensureTodaySet();
      this.scheduleToNextMidnight();
    }
  };

  private scheduleToNextMidnight() {
    if (!this.isBrowser) return;
    if (this.midnightTimer) window.clearTimeout(this.midnightTimer);
    const now = new Date();
    const next = new Date(now);
    next.setHours(24, 0, 0, 0);
    this.midnightTimer = window.setTimeout(() => {
      this.daily.ensureTodaySet();
      this.scheduleToNextMidnight();
    }, next.getTime() - now.getTime());
  }

  private configureRouteRuntime(url: string) {
    const path = normalizePathname(url);
    if (!isMarketingPath(path)) {
      this.appUiStyles.ensureCoreLoaded();
      if (this.routeMayUseFontAwesome(path)) {
        this.appUiStyles.ensureIconFontsLoaded({ defer: true });
      }
    }
    this.telemetry.armForUrl(path);
  }

  private routeMayUseFontAwesome(path: string): boolean {
    if (/^\/(javascript|angular|react|vue|html|css)\/trivia\/[^/]+\/?$/.test(path)) {
      return false;
    }

    if (/^\/(javascript|angular|react|vue|html|css)\/coding\/[^/]+\/?$/.test(path) || /^\/coding\/[^/]+\/?$/.test(path)) {
      return false;
    }

    return this.showSidebar()
      || /^\/pricing\/?$/.test(path)
      || /^\/system-design\/[^/]+\/?$/.test(path)
      || /^\/guides\//.test(path);
  }

  private initialUrl(): string {
    const routerUrl = this.router.url || '/';
    if (routerUrl !== '/') return routerUrl;
    if (!this.isBrowser) return routerUrl;

    const location = this.doc.location;
    return `${location.pathname || '/'}${location.search || ''}${location.hash || ''}`;
  }
}
