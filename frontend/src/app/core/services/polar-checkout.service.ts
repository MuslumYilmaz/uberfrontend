import { Injectable } from '@angular/core';
import type { PolarEmbedCheckout } from '@polar-sh/checkout/embed';
import {
  ExternalWindowReservation,
  navigateReservedExternalWindow,
  releaseExternalWindowReservation,
  reserveExternalWindow,
} from '../utils/external-window.util';
import { isPolarCheckoutUrl } from '../utils/payments-provider.util';

export type PolarCheckoutSurface = 'hosted_new_tab' | 'overlay';
export type PolarOverlayLaunchResult = 'overlay' | 'same_tab' | 'failed';
export type PolarLaunchResult = PolarOverlayLaunchResult | 'new-tab' | 'blocked';

export type PolarCheckoutContext = {
  userId?: string;
  email?: string;
  username?: string;
  checkoutSurface?: PolarCheckoutSurface;
  /** Backend-issued return URL for the checkout attempt. */
  successUrl?: string;
};

type PolarEmbedModule = typeof import('@polar-sh/checkout/embed');
type PolarEmbedInstance = Pick<PolarEmbedCheckout, 'addEventListener' | 'close'>;
export type PolarEmbedLoader = () => Promise<{ PolarEmbedCheckout: { create: (url: string, options?: { theme?: 'light' | 'dark' }) => Promise<PolarEmbedInstance> } }>;

type ActiveOverlayCheckout = {
  launchId: number;
  embed: PolarEmbedInstance | null;
  successUrl: string;
  redirectStarted: boolean;
};

type PolarWindow = Window & {
  __faCheckoutRedirect?: (url: string) => void;
};

/**
 * Opens Polar checkout sessions the backend created. The overlay uses Polar's
 * embed (an iframe on polar.sh, loaded from the bundled `@polar-sh/checkout`
 * module, no third-party script); the embed's `success` message is only a
 * navigation signal, entitlement comes from the verified server flow, so the
 * page continues to the backend's own success URL and never to one the message
 * carries. When the embed cannot load, the checkout continues in this tab.
 */
@Injectable({ providedIn: 'root' })
export class PolarCheckoutService {
  private static readonly EMBED_LOAD_TIMEOUT_MS = 10_000;
  private embedModulePromise?: Promise<PolarEmbedModule>;
  private embedLoaderOverride?: PolarEmbedLoader;
  private overlayLaunchId = 0;
  private activeOverlayCheckout?: ActiveOverlayCheckout;

  /** Unit tests replace the bundled embed with a fake; production never calls this. */
  setEmbedLoaderForTesting(loader: PolarEmbedLoader | undefined): void {
    this.embedLoaderOverride = loader;
    this.embedModulePromise = undefined;
  }

  async prefetch(surface: PolarCheckoutSurface = 'hosted_new_tab'): Promise<void> {
    if (surface !== 'overlay') return;
    await this.loadEmbedModule();
  }

  reserve(): ExternalWindowReservation {
    return reserveExternalWindow();
  }

  release(reservation: ExternalWindowReservation | null | undefined): void {
    releaseExternalWindowReservation(reservation);
  }

  async open(
    url: string,
    context?: PolarCheckoutContext,
    reservation?: ExternalWindowReservation,
  ): Promise<PolarLaunchResult> {
    const overlayRequested = context?.checkoutSurface === 'overlay';
    if (typeof window === 'undefined') return overlayRequested ? 'failed' : 'new-tab';

    const finalUrl = String(url || '').trim();
    if (!finalUrl || !isPolarCheckoutUrl(finalUrl)) {
      if (overlayRequested) this.invalidateOverlayLaunch();
      this.release(reservation);
      console.error('[billing] invalid Polar checkout URL.');
      return overlayRequested ? 'failed' : 'new-tab';
    }

    if (overlayRequested) {
      return this.openOverlayWithFallback(finalUrl, context?.successUrl, reservation);
    }

    this.invalidateOverlayLaunch();
    const openResult = navigateReservedExternalWindow(reservation || this.reserve(), finalUrl);
    if (openResult === 'blocked') {
      console.warn('[billing] Polar checkout popup was blocked.');
      return 'blocked';
    }
    return 'new-tab';
  }

  private async openOverlayWithFallback(
    url: string,
    successUrl: string | undefined,
    reservation?: ExternalWindowReservation,
  ): Promise<PolarOverlayLaunchResult> {
    // The overlay needs no popup; release any blank window reserved before the
    // backend response revealed the surface.
    this.release(reservation);

    const launchId = this.invalidateOverlayLaunch();
    const verifiedSuccessUrl = this.resolveBackendSuccessUrl(successUrl);
    if (!verifiedSuccessUrl) {
      console.warn('[billing] overlay checkout is missing a valid backend success URL; continuing in this tab.');
      return 'same_tab';
    }

    this.activeOverlayCheckout = { launchId, embed: null, successUrl: verifiedSuccessUrl, redirectStarted: false };
    try {
      const module = await this.loadEmbedModule();
      if (launchId !== this.overlayLaunchId) return 'failed';

      // `create` resolves only once the iframe reports `loaded`; a blocked or
      // unreachable frame would otherwise wait forever.
      const embed = await this.withTimeout(
        module.PolarEmbedCheckout.create(url, { theme: resolveEmbedTheme() }),
        PolarCheckoutService.EMBED_LOAD_TIMEOUT_MS,
      );
      if (launchId !== this.overlayLaunchId) {
        embed.close();
        return 'failed';
      }

      const active = this.activeOverlayCheckout;
      if (!active || active.launchId !== launchId) {
        embed.close();
        return 'failed';
      }
      active.embed = embed;
      embed.addEventListener('success', (event) => {
        // The embed would redirect to the URL in the message; the page goes to
        // the backend's own success URL instead.
        event.preventDefault();
        this.handleOverlaySuccess(launchId);
      });
      embed.addEventListener('close', () => {
        if (this.activeOverlayCheckout?.launchId === launchId && !this.activeOverlayCheckout.redirectStarted) {
          this.activeOverlayCheckout = undefined;
        }
      });
      return 'overlay';
    } catch (error) {
      if (launchId !== this.overlayLaunchId) return 'failed';
      if (this.activeOverlayCheckout?.launchId === launchId) {
        this.activeOverlayCheckout = undefined;
      }
      removeOrphanedEmbedElements(url);
      console.warn('[billing] Polar embed unavailable, continuing in this tab.', error);
      return 'same_tab';
    }
  }

  private handleOverlaySuccess(launchId: number): void {
    const active = this.activeOverlayCheckout;
    if (!active || active.launchId !== launchId || active.redirectStarted) return;
    active.redirectStarted = true;
    this.activeOverlayCheckout = undefined;
    this.overlayLaunchId += 1;
    try {
      active.embed?.close();
    } catch (error) {
      console.warn('[billing] Polar embed could not be closed before navigation.', error);
    }
    this.navigateSameTab(active.successUrl);
  }

  private invalidateOverlayLaunch(): number {
    this.overlayLaunchId += 1;
    const active = this.activeOverlayCheckout;
    this.activeOverlayCheckout = undefined;
    if (active?.embed) {
      try {
        active.embed.close();
      } catch {
        // an already removed frame is fine
      }
    }
    return this.overlayLaunchId;
  }

  private resolveBackendSuccessUrl(value: string | undefined): string | null {
    const candidate = String(value || '').trim();
    if (!candidate) return null;

    try {
      const parsed = new URL(candidate);
      const currentOrigin = new URL(window.location.href);
      const localHosts = new Set(['localhost', '127.0.0.1']);
      const localHttp = parsed.protocol === 'http:' && localHosts.has(parsed.hostname);
      if (parsed.protocol !== 'https:' && !localHttp) return null;
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

  private loadEmbedModule(): Promise<PolarEmbedModule> {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return Promise.reject(new Error('The Polar embed requires a browser document'));
    }
    if (this.embedLoaderOverride) {
      return this.embedLoaderOverride() as unknown as Promise<PolarEmbedModule>;
    }
    if (!this.embedModulePromise) {
      this.embedModulePromise = import('@polar-sh/checkout/embed').catch((error) => {
        this.embedModulePromise = undefined;
        throw error;
      });
    }
    return this.embedModulePromise;
  }

  private withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = window.setTimeout(() => reject(new Error('Timed out loading the Polar embed')), timeoutMs);
      promise.then(
        (value) => {
          window.clearTimeout(timer);
          resolve(value);
        },
        (error) => {
          window.clearTimeout(timer);
          reject(error);
        },
      );
    });
  }

  private navigateSameTab(url: string): boolean {
    const win = window as PolarWindow;
    try {
      if (typeof win.__faCheckoutRedirect === 'function') {
        win.__faCheckoutRedirect(url);
      } else {
        win.location.assign(url);
      }
      return true;
    } catch (error) {
      console.error('[billing] same-tab Polar fallback failed.', error);
      return false;
    }
  }
}

function resolveEmbedTheme(): 'light' | 'dark' {
  try {
    const root = document.documentElement;
    // The app marks its theme on <html class="fa-dark"> (see index.html).
    if (root.classList.contains('fa-dark')) return 'dark';
    if (root.classList.contains('fa-light')) return 'light';
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

// `PolarEmbedCheckout.create` injects its frame and spinner before the frame
// reports `loaded`; when that never happens, nothing else removes them.
function removeOrphanedEmbedElements(url: string): void {
  try {
    const origin = new URL(url).origin;
    document.querySelectorAll<HTMLIFrameElement>('iframe').forEach((frame) => {
      if (String(frame.src || '').startsWith(`${origin}/checkout/`)) frame.remove();
    });
    document.querySelectorAll('.polar-loader-spinner').forEach((spinner) => spinner.parentElement?.remove());
    document.body.classList.remove('polar-no-scroll');
  } catch {
    // best effort cleanup
  }
}
