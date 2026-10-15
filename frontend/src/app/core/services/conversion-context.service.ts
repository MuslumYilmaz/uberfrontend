import { Injectable } from '@angular/core';

export type PricingConversionContext = {
  version: 1;
  src: string;
  surface: string;
  createdAt: number;
};

export type FirstTouchContext = {
  version: 1;
  landingPath: string | null;
  referrerHost: string | null;
  createdAt: number;
};

export type FirstTouchInput = {
  path?: string | null;
  referrer?: string | null;
  host?: string | null;
};

@Injectable({ providedIn: 'root' })
export class ConversionContextService {
  private static readonly STORAGE_KEY = 'fa:conversion:pricing-context:v1';
  private static readonly TTL_MS = 30 * 60 * 1000;
  private static readonly TOKEN_PATTERN = /^[a-z0-9_-]{1,64}$/;
  static readonly FIRST_TOUCH_KEY = 'fa:conversion:first-touch:v1';
  private static readonly FIRST_TOUCH_TTL_MS = 30 * 24 * 60 * 60 * 1000;
  private static readonly FIRST_TOUCH_MAX_LENGTH = 200;
  private static readonly LANDING_PATH_PATTERN = /^\/[A-Za-z0-9/_\-.~%]*$/;
  private static readonly HOSTNAME_PATTERN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/;

  rememberPricingContext(src: string, surface: string): PricingConversionContext {
    const context: PricingConversionContext = {
      version: 1,
      src: this.normalize(src, 'pricing'),
      surface: this.normalize(surface, 'pricing_page'),
      createdAt: Date.now(),
    };
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(ConversionContextService.STORAGE_KEY, JSON.stringify(context));
      } catch { }
    }
    return context;
  }

  resolvePricingContext(legacySource?: string | null): PricingConversionContext {
    const normalizedLegacy = this.normalize(legacySource, '');
    if (normalizedLegacy) {
      const legacyContext = this.rememberPricingContext(normalizedLegacy, 'pricing_page');
      this.clear();
      return legacyContext;
    }

    const stored = this.readStored();
    if (stored) this.clear();
    return stored || {
      version: 1,
      src: 'pricing_page',
      surface: 'pricing_page',
      createdAt: Date.now(),
    };
  }

  /**
   * Records the first page and the external referrer of a visit once. Later
   * calls return the stored record and never overwrite it until it expires, so
   * a checkout started days later is attributed to the page that brought the
   * visitor in. Browser only; storage failures leave attribution empty.
   */
  captureFirstTouch(input?: FirstTouchInput): FirstTouchContext | null {
    if (typeof window === 'undefined') return null;
    const existing = this.resolveFirstTouch();
    if (existing) return existing;

    const ownHost = input?.host ?? window.location.hostname;
    const context: FirstTouchContext = {
      version: 1,
      landingPath: this.normalizeLandingPath(input?.path ?? window.location.pathname),
      referrerHost: this.normalizeReferrerHost(input?.referrer ?? document.referrer, ownHost),
      createdAt: Date.now(),
    };
    try {
      localStorage.setItem(ConversionContextService.FIRST_TOUCH_KEY, JSON.stringify(context));
    } catch { }
    return context;
  }

  resolveFirstTouch(): FirstTouchContext | null {
    if (typeof window === 'undefined') return null;
    let parsed: Partial<FirstTouchContext> | null = null;
    try {
      parsed = JSON.parse(localStorage.getItem(ConversionContextService.FIRST_TOUCH_KEY) || 'null');
    } catch {
      this.clearFirstTouch();
      return null;
    }
    if (
      !parsed ||
      parsed.version !== 1 ||
      typeof parsed.createdAt !== 'number' ||
      parsed.createdAt > Date.now() + 60_000 ||
      Date.now() - parsed.createdAt > ConversionContextService.FIRST_TOUCH_TTL_MS
    ) {
      this.clearFirstTouch();
      return null;
    }
    return {
      version: 1,
      landingPath: this.normalizeLandingPath(parsed.landingPath),
      referrerHost: this.normalizeReferrerHost(parsed.referrerHost, window.location.hostname),
      createdAt: parsed.createdAt,
    };
  }

  private readStored(): PricingConversionContext | null {
    if (typeof window === 'undefined') return null;
    let parsed: Partial<PricingConversionContext> | null = null;
    try {
      parsed = JSON.parse(sessionStorage.getItem(ConversionContextService.STORAGE_KEY) || 'null');
    } catch {
      this.clear();
      return null;
    }
    if (
      !parsed ||
      parsed.version !== 1 ||
      typeof parsed.createdAt !== 'number' ||
      parsed.createdAt > Date.now() + 60_000 ||
      Date.now() - parsed.createdAt > ConversionContextService.TTL_MS
    ) {
      this.clear();
      return null;
    }
    return {
      version: 1,
      src: this.normalize(parsed.src, 'pricing'),
      surface: this.normalize(parsed.surface, 'pricing_page'),
      createdAt: parsed.createdAt,
    };
  }

  private clear(): void {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.removeItem(ConversionContextService.STORAGE_KEY);
    } catch { }
  }

  private clearFirstTouch(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(ConversionContextService.FIRST_TOUCH_KEY);
    } catch { }
  }

  private normalize(value: unknown, fallback: string): string {
    const normalized = String(value || '').trim().toLowerCase();
    return ConversionContextService.TOKEN_PATTERN.test(normalized) ? normalized : fallback;
  }

  private normalizeLandingPath(value: unknown): string | null {
    const raw = String(value || '').trim();
    if (!raw.startsWith('/')) return null;
    const path = raw.split(/[?#]/)[0];
    if (
      !path ||
      path.length > ConversionContextService.FIRST_TOUCH_MAX_LENGTH ||
      !ConversionContextService.LANDING_PATH_PATTERN.test(path)
    ) {
      return null;
    }
    return path;
  }

  private normalizeReferrerHost(value: unknown, ownHost: string | null | undefined): string | null {
    const raw = String(value || '').trim();
    if (!raw) return null;
    let host = raw;
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)) {
      try {
        host = new URL(raw).hostname;
      } catch {
        return null;
      }
    }
    host = host.toLowerCase().replace(/\.$/, '');
    if (
      !host ||
      host.length > ConversionContextService.FIRST_TOUCH_MAX_LENGTH ||
      !ConversionContextService.HOSTNAME_PATTERN.test(host)
    ) {
      return null;
    }
    if (ownHost && host === String(ownHost).trim().toLowerCase()) return null;
    return host;
  }
}
