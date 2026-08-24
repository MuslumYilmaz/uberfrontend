import { Injectable } from '@angular/core';
import {
  ExternalWindowReservation,
  navigateReservedExternalWindow,
  releaseExternalWindowReservation,
  reserveExternalWindow,
} from '../utils/external-window.util';

export type LemonSqueezyCheckoutContext = {
  userId?: string;
  email?: string;
  username?: string;
  checkoutSurface?: LemonSqueezyCheckoutSurface;
  /** Backend-issued return URL for the checkout attempt. */
  successUrl?: string;
};

export type LemonSqueezyCheckoutSurface = 'hosted_new_tab' | 'overlay';
export type LemonSqueezyV2LaunchResult = 'overlay' | 'same_tab' | 'failed';
export type LemonSqueezyLaunchResult = LemonSqueezyV2LaunchResult | 'new-tab' | 'blocked';

type LemonSqueezyWindow = Window & {
  createLemonSqueezy?: () => void;
  LemonSqueezy?: {
    Setup?: (options: {
      eventHandler: (event: LemonSqueezyEvent) => void;
    }) => void;
    Url?: {
      Open?: (url: string) => void;
      Close?: () => void;
    };
  };
  __faCheckoutRedirect?: (url: string) => void;
};

type LemonSqueezyEvent = {
  event?: string;
  data?: unknown;
};

type ActiveOverlayCheckout = {
  launchId: number;
  successUrl: string;
  redirectStarted: boolean;
};

@Injectable({ providedIn: 'root' })
export class LemonSqueezyCheckoutService {
  private static readonly SCRIPT_SRC = 'https://app.lemonsqueezy.com/js/lemon.js';
  private static readonly SCRIPT_TIMEOUT_MS = 8_000;
  private lemonJsPromise?: Promise<void>;
  private overlayLaunchId = 0;
  private activeOverlayCheckout?: ActiveOverlayCheckout;

  private isValidBuyUrl(value: string): boolean {
    try {
      const parsed = new URL(value);
      return parsed.protocol === 'https:'
        && parsed.hostname === 'frontendatlas.lemonsqueezy.com'
        && /^\/checkout\/buy\/[^/]+/.test(parsed.pathname);
    } catch {
      return false;
    }
  }

  async prefetch(surface: LemonSqueezyCheckoutSurface = 'hosted_new_tab'): Promise<void> {
    if (surface !== 'overlay') return;
    await this.ensureLemonJs();
  }

  reserve(): ExternalWindowReservation {
    return reserveExternalWindow();
  }

  release(reservation: ExternalWindowReservation | null | undefined): void {
    releaseExternalWindowReservation(reservation);
  }

  async open(
    url: string,
    context?: LemonSqueezyCheckoutContext,
    reservation?: ExternalWindowReservation,
  ): Promise<LemonSqueezyLaunchResult> {
    const overlayRequested = context?.checkoutSurface === 'overlay';
    if (!url) {
      if (overlayRequested) this.invalidateOverlayLaunch();
      return overlayRequested ? 'failed' : 'new-tab';
    }
    if (typeof window === 'undefined') return overlayRequested ? 'failed' : 'new-tab';

    const finalUrl = String(url || '').trim();
    if (!finalUrl || !this.isValidBuyUrl(finalUrl)) {
      if (overlayRequested) this.invalidateOverlayLaunch();
      this.release(reservation);
      console.error('[billing] invalid LemonSqueezy checkout URL.');
      return overlayRequested ? 'failed' : 'new-tab';
    }

    if (overlayRequested) {
      return this.openOverlayWithFallback(finalUrl, context?.successUrl, reservation);
    }

    this.invalidateOverlayLaunch();
    const openResult = navigateReservedExternalWindow(reservation || this.reserve(), finalUrl);
    if (openResult === 'blocked') {
      console.warn('[billing] LemonSqueezy checkout popup was blocked.');
      return 'blocked';
    }
    return 'new-tab';
  }

  private async openOverlayWithFallback(
    url: string,
    successUrl: string | undefined,
    reservation?: ExternalWindowReservation,
  ): Promise<LemonSqueezyV2LaunchResult> {
    // Overlay checkout does not need a popup reservation. Release any blank
    // window reserved before the backend response revealed the surface.
    this.release(reservation);

    const launchId = this.invalidateOverlayLaunch();
    const verifiedSuccessUrl = this.resolveBackendSuccessUrl(successUrl);
    if (!verifiedSuccessUrl) {
      console.warn('[billing] overlay checkout is missing a valid backend success URL; continuing in this tab.');
      return 'same_tab';
    }

    const overlayUrl = this.withEmbedMode(url);
    try {
      await this.ensureLemonJs();
      if (launchId !== this.overlayLaunchId) return 'failed';

      const lemon = (window as LemonSqueezyWindow).LemonSqueezy;
      if (typeof lemon?.Setup !== 'function' || typeof lemon.Url?.Open !== 'function') {
        throw new Error('Lemon.js Setup or Url.Open is unavailable');
      }

      lemon.Setup({
        eventHandler: (event) => this.handleLemonSqueezyEvent(event, launchId),
      });
      if (launchId !== this.overlayLaunchId) return 'failed';

      this.activeOverlayCheckout = {
        launchId,
        successUrl: verifiedSuccessUrl,
        redirectStarted: false,
      };
      lemon.Url.Open(overlayUrl);
      return 'overlay';
    } catch (error) {
      if (launchId !== this.overlayLaunchId) return 'failed';
      if (this.activeOverlayCheckout?.launchId === launchId) {
        this.activeOverlayCheckout = undefined;
      }
      console.warn('[billing] Lemon.js overlay unavailable, continuing in this tab.', error);
      return 'same_tab';
    }
  }

  private handleLemonSqueezyEvent(event: LemonSqueezyEvent, launchId: number): void {
    if (event?.event !== 'Checkout.Success') return;

    const activeCheckout = this.activeOverlayCheckout;
    if (
      !activeCheckout
      || activeCheckout.launchId !== launchId
      || activeCheckout.redirectStarted
    ) {
      return;
    }

    // Checkout.Success is only a browser navigation signal. Entitlement and
    // purchase analytics continue to come from the verified server flow.
    activeCheckout.redirectStarted = true;
    this.activeOverlayCheckout = undefined;
    this.overlayLaunchId += 1;
    this.closeOverlay();
    this.navigateSameTab(activeCheckout.successUrl);
  }

  private invalidateOverlayLaunch(): number {
    this.overlayLaunchId += 1;
    const hadActiveOverlay = !!this.activeOverlayCheckout;
    this.activeOverlayCheckout = undefined;
    if (hadActiveOverlay) this.closeOverlay();
    return this.overlayLaunchId;
  }

  private closeOverlay(): void {
    try {
      (window as LemonSqueezyWindow).LemonSqueezy?.Url?.Close?.();
    } catch (error) {
      console.warn('[billing] Lemon.js overlay could not be closed before navigation.', error);
    }
  }

  private resolveBackendSuccessUrl(value: string | undefined): string | null {
    const candidate = String(value || '').trim();
    if (!candidate) return null;

    try {
      const parsed = new URL(candidate);
      const currentOrigin = new URL(window.location.href);
      const localHttp = parsed.protocol === 'http:'
        && (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1');
      if (parsed.protocol !== 'https:' && !localHttp) return null;
      const localHosts = new Set(['localhost', '127.0.0.1']);
      const localOriginParity = localHosts.has(parsed.hostname)
        && localHosts.has(currentOrigin.hostname)
        && parsed.protocol === currentOrigin.protocol
        && parsed.port === currentOrigin.port;
      if (parsed.origin !== currentOrigin.origin && !localOriginParity) return null;
      if (parsed.pathname !== '/billing/success') return null;
      if (!String(parsed.searchParams.get('attempt') || '').trim()) return null;
      return candidate;
    } catch {
      return null;
    }
  }

  private ensureLemonJs(): Promise<void> {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return Promise.reject(new Error('Lemon.js requires a browser document'));
    }

    const win = window as LemonSqueezyWindow;
    if (typeof win.LemonSqueezy?.Url?.Open === 'function') {
      win.createLemonSqueezy?.();
      return Promise.resolve();
    }
    if (this.lemonJsPromise) return this.lemonJsPromise;

    this.lemonJsPromise = new Promise<void>((resolve, reject) => {
      const selector = `script[src="${LemonSqueezyCheckoutService.SCRIPT_SRC}"]`;
      const existing = document.querySelector<HTMLScriptElement>(selector);
      const script = existing || document.createElement('script');
      let settled = false;

      const cleanup = () => {
        window.clearTimeout(timeoutId);
        script.removeEventListener('load', onLoad);
        script.removeEventListener('error', onError);
      };
      const succeed = () => {
        if (settled) return;
        settled = true;
        cleanup();
        try {
          win.createLemonSqueezy?.();
        } catch { }
        if (typeof win.LemonSqueezy?.Url?.Open !== 'function') {
          reject(new Error('Lemon.js loaded without Url.Open'));
          return;
        }
        resolve();
      };
      const fail = (reason: unknown) => {
        if (settled) return;
        settled = true;
        cleanup();
        if (!existing) script.remove();
        reject(reason instanceof Error ? reason : new Error('Unable to load Lemon.js'));
      };
      const onLoad = () => succeed();
      const onError = () => fail(new Error('Unable to load Lemon.js'));
      const timeoutId = window.setTimeout(
        () => fail(new Error('Timed out loading Lemon.js')),
        LemonSqueezyCheckoutService.SCRIPT_TIMEOUT_MS,
      );

      script.addEventListener('load', onLoad, { once: true });
      script.addEventListener('error', onError, { once: true });

      if (!existing) {
        script.src = LemonSqueezyCheckoutService.SCRIPT_SRC;
        script.defer = true;
        script.dataset['faLemonSqueezy'] = 'true';
        document.head.appendChild(script);
      }
    }).catch((error) => {
      this.lemonJsPromise = undefined;
      throw error;
    });

    return this.lemonJsPromise;
  }

  private withEmbedMode(url: string): string {
    const parsed = new URL(url);
    parsed.searchParams.set('embed', '1');
    return parsed.toString();
  }

  private navigateSameTab(url: string): boolean {
    const win = window as LemonSqueezyWindow;
    try {
      if (typeof win.__faCheckoutRedirect === 'function') {
        win.__faCheckoutRedirect(url);
      } else {
        win.location.assign(url);
      }
      return true;
    } catch (error) {
      console.error('[billing] same-tab LemonSqueezy fallback failed.', error);
      return false;
    }
  }
}
