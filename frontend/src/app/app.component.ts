import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component, OnInit, OnDestroy, computed, signal, inject } from '@angular/core';
import { NavigationEnd, Router, RouterModule, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { HeaderComponent } from './shared/components/header/header.component';

// ⬇️ services we added earlier
import { DailyService } from './core/services/daily.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule, HttpClientModule, HeaderComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  // --- routing state used to hide header on auth pages ---
  private router = inject(Router);
  private currentUrl = signal(this.router.url || '/');
  isAuthRoute = computed(() => this.currentUrl().startsWith('/auth'));
  showHeader = computed(() => !this.isAuthRoute());

  // --- daily set + rollover ---
  private daily = inject(DailyService);
  // just injecting creates the listener (if you added the service)
  // remove this line if you didn’t add RouteTrackerService

  private midnightTimer?: number;

  ngOnInit() {
    // keep currentUrl in sync
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => this.currentUrl.set(e.urlAfterRedirects || e.url));

    // ensure we always have “today’s set” available
    this.daily.ensureTodaySet();

    // rollover at local midnight
    this.scheduleToNextMidnight();

    // if the tab was hidden across midnight, refresh on focus
    document.addEventListener('visibilitychange', this.onVisibility);
  }

  ngOnDestroy() {
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
    if (this.midnightTimer) window.clearTimeout(this.midnightTimer);
    const now = new Date();
    const next = new Date(now);
    next.setHours(24, 0, 0, 0); // start of next local day
    this.midnightTimer = window.setTimeout(() => {
      this.daily.ensureTodaySet();    // generates the new set, resets today’s progress
      this.scheduleToNextMidnight();  // schedule again
    }, next.getTime() - now.getTime());
  }
}
