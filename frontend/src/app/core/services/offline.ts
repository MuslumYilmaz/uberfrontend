import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';

const PROBE_URLS = [
  // Lightweight "no content" endpoints commonly used for connectivity checks.
  'https://www.gstatic.com/generate_204',
  'https://www.google.com/generate_204',
  // Fallback to a highly stable domain.
  'https://example.com/',
] as const;

const PROBE_TIMEOUT_MS = 2500;

@Injectable({ providedIn: 'root' })
export class OfflineService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  isOnline = signal<boolean>(this.resolveInitialOnline());
  private probeNonce = 0;

  constructor() {
    if (!this.isBrowser) return;

    window.addEventListener('online', () => {
      // Cancel any pending "offline probe" and reflect the event immediately.
      this.probeNonce++;
      this.isOnline.set(true);
    });

    window.addEventListener('offline', () => {
      // Treat the event as authoritative for UI (tests may dispatch it without toggling navigator.onLine).
      this.isOnline.set(false);

      // If `navigator.onLine` still reports "online", assume this is a synthetic offline event (e.g. tests)
      // and keep the UI in offline-mode until we get an `online` event.
      const navOnline = typeof navigator === 'undefined' ? true : navigator.onLine;
      if (navOnline) return;

      const nonce = ++this.probeNonce;
      // Defer the probe to the next task so the offline UI has a chance to render first.
      window.setTimeout(() => {
        void this.probeConnectivity().then((ok) => {
          if (nonce !== this.probeNonce) return;
          this.isOnline.set(ok);
        });
      }, 0);
    });

    // `navigator.onLine` can be a false-negative in some environments; verify once on startup.
    queueMicrotask(() => this.syncFromNavigator());
  }

  private syncFromNavigator() {
    const navOnline = typeof navigator === 'undefined' ? true : navigator.onLine;
    if (typeof navOnline !== 'boolean') {
      this.probeNonce++;
      this.isOnline.set(true);
      return;
    }
    if (navOnline) {
      this.probeNonce++;
      this.isOnline.set(true);
      return;
    }

    // If the browser reports offline, try a lightweight probe to avoid false-offline UI.
    const nonce = ++this.probeNonce;
    void this.probeConnectivity().then((ok) => {
      if (nonce !== this.probeNonce) return;
      this.isOnline.set(ok);
    });
  }

  private resolveInitialOnline(): boolean {
    if (!this.isBrowser) return true;
    const navOnline = typeof navigator === 'undefined' ? true : navigator.onLine;
    return typeof navOnline === 'boolean' ? navOnline : true;
  }

  private async probeConnectivity(): Promise<boolean> {
    for (const baseUrl of PROBE_URLS) {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
      const url = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}_=${Date.now()}`;

      try {
        // `no-cors` avoids CORS issues; a resolved fetch indicates we have network connectivity.
        await fetch(url, { mode: 'no-cors', cache: 'no-store', signal: controller.signal });
        return true;
      } catch {
        // try next URL
      } finally {
        window.clearTimeout(timeout);
      }
    }
    return false;
  }
}
