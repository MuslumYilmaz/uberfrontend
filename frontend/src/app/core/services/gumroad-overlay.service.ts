import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class GumroadOverlayService {
  private static loadPromise: Promise<void> | null = null;
  private static overlayReadyPromise: Promise<void> | null = null;

  async ensureLoaded(): Promise<void> {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      throw new Error('Gumroad overlay requires a browser context.');
    }

    if (GumroadOverlayService.loadPromise) {
      return GumroadOverlayService.loadPromise;
    }

    GumroadOverlayService.loadPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>('script[data-gumroad-overlay]');
      if (existing) {
        if ((window as any).GumroadOverlay) return resolve();
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => reject(new Error('Gumroad overlay failed to load.')));
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://gumroad.com/js/gumroad.js';
      script.async = true;
      script.defer = true;
      script.dataset['gumroadOverlay'] = 'true';
      script.addEventListener('load', () => resolve());
      script.addEventListener('error', () => reject(new Error('Gumroad overlay failed to load.')));
      document.head.appendChild(script);
    });

    return GumroadOverlayService.loadPromise;
  }

  private async ensureOverlayReady(): Promise<void> {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    if (GumroadOverlayService.overlayReadyPromise) {
      return GumroadOverlayService.overlayReadyPromise;
    }

    const isReady = () => {
      if (typeof document === 'undefined') return false;
      return Array.from(document.body?.children || []).some(
        (el) => (el as HTMLElement).style?.zIndex === '999999'
      );
    };

    if (isReady()) return;

    GumroadOverlayService.overlayReadyPromise = new Promise((resolve) => {
      const observer = new MutationObserver(() => {
        if (isReady()) {
          observer.disconnect();
          resolve();
        }
      });

      observer.observe(document.body, { childList: true });
      window.setTimeout(() => {
        observer.disconnect();
        resolve();
      }, 1500);
    });

    await GumroadOverlayService.overlayReadyPromise;
  }

  private async nextFrame(): Promise<void> {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }

  async prefetch(): Promise<void> {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    await this.ensureLoaded();
    await this.ensureOverlayReady();
  }

  async open(productUrl: string): Promise<'overlay' | 'new-tab'> {
    if (!productUrl) return 'new-tab';
    if (typeof window === 'undefined' || typeof document === 'undefined') return 'new-tab';

    const testHook = (window as any).__faCheckoutRedirect;
    if (typeof testHook === 'function') {
      testHook(productUrl);
      return 'overlay';
    }

    try {
      await this.ensureLoaded();
      await this.ensureOverlayReady();
    } catch (err) {
      console.warn('[billing] gumroad overlay script blocked, opening checkout in a new tab.', err);
      window.open(productUrl, '_blank', 'noopener');
      return 'new-tab';
    }

    const anchor = document.createElement('a');
    anchor.className = 'gumroad-button';
    anchor.href = productUrl;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    // Give the overlay script a tick to attach its click handler.
    await this.nextFrame();
    anchor.click();
    window.setTimeout(() => anchor.remove(), 0);
    return 'overlay';
  }
}
