import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { AuthService } from '../../../core/services/auth.service';
import { ConversionContextService } from '../../../core/services/conversion-context.service';
import { isProActive } from '../../../core/utils/entitlements.util';
import { FaButtonComponent } from '../../ui/button/fa-button.component';

const ANALYTICS_SURFACE = 'showcase_mobile_sticky';

/**
 * The homepage's phone shortcuts: a free account for guests and the way to pricing, once the hero has scrolled away
 * and while no plan card is on screen. Closing it is remembered on the device, so it appears until dismissed once.
 * The pricing page carries no copy of it: there the plan cards are the page.
 */
@Component({
    selector: 'app-conversion-sticky-cta',
    imports: [CommonModule, RouterModule, FaButtonComponent],
    templateUrl: './conversion-sticky-cta.component.html',
    styleUrls: ['./conversion-sticky-cta.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConversionStickyCtaComponent implements AfterViewInit, OnDestroy {
  private static readonly DISMISSED_KEY = 'fa:conversion-sticky:dismissed:v1';
  private readonly auth = inject(AuthService);
  private readonly analytics = inject(AnalyticsService);
  private readonly conversionContext = inject(ConversionContextService);

  private readonly isMobile = signal(false);
  private readonly heroOutOfView = signal(false);
  private readonly planCardsVisible = signal(false);
  private readonly overlayOpen = signal(false);
  private readonly dismissed = signal(this.wasDismissed());
  private readonly observers: IntersectionObserver[] = [];
  private mutationObserver?: MutationObserver;

  readonly authState = computed<'pending' | 'guest' | 'free' | 'pro'>(() => {
    const uiState = this.auth.authUiState();
    if (uiState === 'pending') return 'pending';
    if (uiState === 'signed_out') return 'guest';
    return isProActive(this.auth.user()) ? 'pro' : 'free';
  });

  readonly visible = computed(() => {
    if (!this.isMobile() || this.dismissed() || this.overlayOpen()) return false;
    if (this.authState() === 'pending' || this.authState() === 'pro') return false;
    return this.heroOutOfView() && !this.planCardsVisible();
  });

  ngAfterViewInit(): void {
    if (typeof window === 'undefined') return;
    this.syncViewport();
    window.addEventListener('resize', this.onResize, { passive: true });
    // AfterViewInit already runs after this component and its page landmarks
    // are rendered. Observe synchronously so the page does not flash the
    // shortcuts for one frame while its plan cards are already visible.
    this.observePageLandmarks();
    this.mutationObserver = new MutationObserver(() => this.syncOverlayState());
    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'aria-hidden'],
    });
    this.syncOverlayState();
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.onResize);
    }
    this.observers.forEach((observer) => observer.disconnect());
    this.mutationObserver?.disconnect();
  }

  dismiss(): void {
    this.dismissed.set(true);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(ConversionStickyCtaComponent.DISMISSED_KEY, '1');
      } catch { }
    }
    this.analytics.track('mobile_sticky_cta_dismissed', {
      surface: ANALYTICS_SURFACE,
      auth_state: this.analyticsAuthState(),
    });
  }

  trackSignup(): void {
    this.trackClick('create_account', '/auth/signup');
  }

  trackPricing(): void {
    this.conversionContext.rememberPricingContext(ANALYTICS_SURFACE, ANALYTICS_SURFACE);
    this.trackClick('view_pricing', '/pricing#pricing-plans');
  }

  private observePageLandmarks(): void {
    if (typeof IntersectionObserver !== 'function') {
      this.heroOutOfView.set(true);
      return;
    }

    const hero = document.querySelector('.showcase-hero');
    if (hero) {
      const observer = new IntersectionObserver(([entry]) => {
        this.heroOutOfView.set(!entry.isIntersecting && entry.boundingClientRect.bottom <= 0);
      }, { threshold: 0.01 });
      observer.observe(hero);
      this.observers.push(observer);
    } else {
      // A page without the hero landmark has nothing to wait for.
      this.heroOutOfView.set(true);
    }

    const planCards = document.querySelector('#pricing-plans');
    if (planCards) {
      const initialRect = planCards.getBoundingClientRect();
      this.planCardsVisible.set(
        initialRect.bottom > 0 && initialRect.top < window.innerHeight,
      );
      const observer = new IntersectionObserver(([entry]) => {
        this.planCardsVisible.set(entry.isIntersecting);
      // The mobile grid is much taller than the viewport, so a 10% ratio can
      // still mean several visible plan rows. Hide the sticky as soon as any
      // meaningful slice of the offer grid enters the viewport.
      }, { threshold: 0.01 });
      observer.observe(planCards);
      this.observers.push(observer);
    }
  }

  private trackClick(action: string, destination: string): void {
    this.analytics.track('mobile_sticky_cta_clicked', {
      action,
      destination,
      surface: ANALYTICS_SURFACE,
      auth_state: this.analyticsAuthState(),
    });
  }

  private analyticsAuthState(): 'guest' | 'logged_in_free' | 'logged_in_pro' {
    const state = this.authState();
    if (state === 'free') return 'logged_in_free';
    if (state === 'pro') return 'logged_in_pro';
    return 'guest';
  }

  private syncOverlayState(): void {
    if (typeof document === 'undefined') return;
    this.overlayOpen.set(!!document.querySelector('.famh-mobile-panel, .p-dialog-mask'));
  }

  private onResize = (): void => this.syncViewport();

  private syncViewport(): void {
    if (typeof window === 'undefined') return;
    this.isMobile.set(window.innerWidth <= 980);
  }

  private wasDismissed(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem(ConversionStickyCtaComponent.DISMISSED_KEY) === '1';
    } catch {
      return false;
    }
  }
}
