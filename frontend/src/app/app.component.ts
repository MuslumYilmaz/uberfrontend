// app.component.ts
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component, OnDestroy, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterModule, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { DailyService } from './core/services/daily.service';
import { PremiumGateService } from './core/services/premium-gate.service';
import { AppSidebarComponent } from './features/app-sidebar/app-sidebar.component';
import { PremiumRequiredDialogComponent } from './shared/components/premium-required-dialog/premium-required-dialog.component';
import { HeaderComponent } from './shared/components/header/header.component';
import { OfflineBannerComponent } from './shared/components/offline-banner/offline-banner';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterModule,
    HttpClientModule,
    HeaderComponent,
    AppSidebarComponent,
    OfflineBannerComponent,
    PremiumRequiredDialogComponent,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private currentUrl = signal(this.router.url || '/');
  premiumGate = inject(PremiumGateService);
  premiumGateState = this.premiumGate.dialogState;
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  // hide header on /auth/*
  isAuthRoute = computed(() => this.currentUrl().startsWith('/auth'));
  showHeader = computed(() => !this.isAuthRoute());

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
    /^\/(javascript|angular|react|vue|html|css)\/trivia\/[^/]+$/,
    /^\/coding\/[^/]+$/,
    /^\/(javascript|angular|react|vue|html|css)\/coding\/[^/]+$/,
    /^\/$/,
    /^\/showcase\/?$/,
  ];

  // strip query/hash before testing
  private pathOnly = computed(() => this.currentUrl().split('?')[0].split('#')[0]);

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
      .subscribe((e: any) => this.currentUrl.set(e.urlAfterRedirects || e.url));

    if (!this.isBrowser) return;

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
}
