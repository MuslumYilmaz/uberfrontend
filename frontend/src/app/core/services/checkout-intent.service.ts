import { Injectable } from '@angular/core';
import { PlanId } from '../utils/payments-provider.util';
import { sanitizeRedirectTarget } from '../utils/redirect.util';

export type CheckoutIntent = {
  version: 1;
  planId: PlanId;
  src: string;
  surface: string;
  campaignId?: string;
  returnUrl: string;
  createdAt: number;
};

@Injectable({ providedIn: 'root' })
export class CheckoutIntentService {
  private static readonly STORAGE_KEY = 'fa:checkout:intent:v1';
  private static readonly TTL_MS = 30 * 60 * 1000;
  private static readonly TOKEN_PATTERN = /^[a-z0-9_-]{1,64}$/;
  private static readonly PLAN_IDS: PlanId[] = ['monthly', 'quarterly', 'annual', 'lifetime'];

  save(input: Omit<CheckoutIntent, 'version' | 'createdAt'>): CheckoutIntent {
    const campaignId = this.normalizeToken(input.campaignId, '');
    const intent: CheckoutIntent = {
      version: 1,
      planId: CheckoutIntentService.PLAN_IDS.includes(input.planId) ? input.planId : 'quarterly',
      src: this.normalizeToken(input.src, 'pricing'),
      surface: this.normalizeToken(input.surface, 'pricing_page'),
      ...(campaignId ? { campaignId } : {}),
      returnUrl: sanitizeRedirectTarget(input.returnUrl, '/pricing'),
      createdAt: Date.now(),
    };

    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(CheckoutIntentService.STORAGE_KEY, JSON.stringify(intent));
      } catch { }
    }
    return intent;
  }

  load(): CheckoutIntent | null {
    if (typeof window === 'undefined') return null;
    let parsed: Partial<CheckoutIntent> | null = null;
    try {
      parsed = JSON.parse(sessionStorage.getItem(CheckoutIntentService.STORAGE_KEY) || 'null');
    } catch {
      this.clear();
      return null;
    }

    if (
      !parsed ||
      parsed.version !== 1 ||
      !CheckoutIntentService.PLAN_IDS.includes(parsed.planId as PlanId) ||
      typeof parsed.createdAt !== 'number' ||
      parsed.createdAt > Date.now() + 60_000 ||
      Date.now() - parsed.createdAt > CheckoutIntentService.TTL_MS
    ) {
      this.clear();
      return null;
    }

    const campaignId = this.normalizeToken(parsed.campaignId, '');
    return {
      version: 1,
      planId: parsed.planId as PlanId,
      src: this.normalizeToken(parsed.src, 'pricing'),
      surface: this.normalizeToken(parsed.surface, 'pricing_page'),
      ...(campaignId ? { campaignId } : {}),
      returnUrl: sanitizeRedirectTarget(parsed.returnUrl, '/pricing'),
      createdAt: parsed.createdAt,
    };
  }

  clear(): void {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.removeItem(CheckoutIntentService.STORAGE_KEY);
    } catch { }
  }

  private normalizeToken(value: unknown, fallback: string): string {
    const normalized = String(value || '').trim().toLowerCase();
    return CheckoutIntentService.TOKEN_PATTERN.test(normalized) ? normalized : fallback;
  }
}
