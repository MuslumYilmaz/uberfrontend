import { Injectable } from '@angular/core';

export type PricingConversionContext = {
  version: 1;
  src: string;
  surface: string;
  createdAt: number;
};

@Injectable({ providedIn: 'root' })
export class ConversionContextService {
  private static readonly STORAGE_KEY = 'fa:conversion:pricing-context:v1';
  private static readonly TTL_MS = 30 * 60 * 1000;
  private static readonly TOKEN_PATTERN = /^[a-z0-9_-]{1,64}$/;

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

  private normalize(value: unknown, fallback: string): string {
    const normalized = String(value || '').trim().toLowerCase();
    return ConversionContextService.TOKEN_PATTERN.test(normalized) ? normalized : fallback;
  }
}
