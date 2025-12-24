import { Injectable, signal } from '@angular/core';

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
  isOnline = signal<boolean>(typeof navigator === 'undefined' ? true : navigator.onLine);
  private probeNonce = 0;

  constructor() {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => this.syncFromNavigator());
    window.addEventListener('offline', () => this.syncFromNavigator());

    // `navigator.onLine` can be a false-negative in some environments; verify once on startup.
    queueMicrotask(() => this.syncFromNavigator());
  }

  private syncFromNavigator() {
    const navOnline = typeof navigator === 'undefined' ? true : navigator.onLine;
    if (navOnline) {
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
