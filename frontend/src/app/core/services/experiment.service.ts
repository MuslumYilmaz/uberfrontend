import { Injectable } from '@angular/core';
import { AnalyticsService } from './analytics.service';
import { AuthService } from './auth.service';

export type ExperimentId =
  | 'hero_headline_cta_v1'
  | 'signup_prompt_copy_v1'
  | 'pricing_risk_reversal_placement_v1'
  | 'premium_gate_copy_v1';

export type ExperimentVariantMap = {
  hero_headline_cta_v1: 'control' | 'outcome';
  signup_prompt_copy_v1: 'control' | 'benefit';
  pricing_risk_reversal_placement_v1: 'top' | 'after_plans';
  premium_gate_copy_v1: 'control' | 'value';
};

type ExperimentDefinition<TVariant extends string> = {
  variants: readonly TVariant[];
  weights: readonly number[];
};

const DEFINITIONS: {
  [K in ExperimentId]: ExperimentDefinition<ExperimentVariantMap[K]>;
} = {
  hero_headline_cta_v1: {
    variants: ['control', 'outcome'],
    weights: [50, 50],
  },
  signup_prompt_copy_v1: {
    variants: ['control', 'benefit'],
    weights: [50, 50],
  },
  pricing_risk_reversal_placement_v1: {
    variants: ['top', 'after_plans'],
    weights: [50, 50],
  },
  premium_gate_copy_v1: {
    variants: ['control', 'value'],
    weights: [50, 50],
  },
};

@Injectable({ providedIn: 'root' })
export class ExperimentService {
  private static readonly ANON_ID_KEY = 'fa:exp:anon_id';
  private static readonly ASSIGN_PREFIX = 'fa:exp:assignment:';
  private static readonly EXPOSE_PREFIX = 'fa:exp:exposure:';

  constructor(
    private analytics: AnalyticsService,
    private auth: AuthService,
  ) { }

  variant<K extends ExperimentId>(experimentId: K, source = 'unknown'): ExperimentVariantMap[K] {
    const definition = DEFINITIONS[experimentId];
    const key = `${ExperimentService.ASSIGN_PREFIX}${experimentId}`;
    const existing = this.getStorageValue(key) as ExperimentVariantMap[K] | null;
    if (existing && definition.variants.includes(existing)) {
      this.trackAssignmentOnce(experimentId, existing, source, true);
      return existing;
    }

    const seed = `${this.identitySeed()}|${experimentId}`;
    const picked = this.pickVariant(definition.variants, definition.weights, seed) as ExperimentVariantMap[K];
    this.setStorageValue(key, picked);
    this.trackAssignmentOnce(experimentId, picked, source, false);
    return picked;
  }

  expose<K extends ExperimentId>(
    experimentId: K,
    variant: ExperimentVariantMap[K],
    exposureKey: string,
    source = 'unknown',
  ): void {
    const normalizedExposure = this.normalize(exposureKey) || 'default';
    const dedupeKey = `${ExperimentService.EXPOSE_PREFIX}${experimentId}:${variant}:${normalizedExposure}`;
    if (this.getSessionValue(dedupeKey) === '1') return;
    this.setSessionValue(dedupeKey, '1');

    this.analytics.track('experiment_exposed', {
      experiment_id: experimentId,
      variant,
      exposure_key: normalizedExposure,
      src: this.normalize(source) || 'unknown',
    });
  }

  private trackAssignmentOnce<K extends ExperimentId>(
    experimentId: K,
    variant: ExperimentVariantMap[K],
    source: string,
    reused: boolean,
  ) {
    const dedupeKey = `${ExperimentService.EXPOSE_PREFIX}assigned:${experimentId}:${variant}`;
    if (this.getSessionValue(dedupeKey) === '1') return;
    this.setSessionValue(dedupeKey, '1');

    this.analytics.track('experiment_assigned', {
      experiment_id: experimentId,
      variant,
      src: this.normalize(source) || 'unknown',
      assignment_type: reused ? 'reused' : 'fresh',
    });
  }

  private pickVariant<TVariant extends string>(
    variants: readonly TVariant[],
    weights: readonly number[],
    seed: string,
  ): TVariant {
    const hash = this.hash(seed);
    const total = weights.reduce((sum, value) => sum + Math.max(0, value), 0) || 1;
    let cursor = hash % total;
    for (let i = 0; i < variants.length; i += 1) {
      const weight = Math.max(0, weights[i] ?? 0);
      if (cursor < weight) return variants[i];
      cursor -= weight;
    }
    return variants[0];
  }

  private identitySeed(): string {
    const userId = this.auth.user()?._id;
    if (userId) return `user:${userId}`;

    const existing = this.getStorageValue(ExperimentService.ANON_ID_KEY);
    if (existing) return `anon:${existing}`;

    const generated = this.generateId();
    this.setStorageValue(ExperimentService.ANON_ID_KEY, generated);
    return `anon:${generated}`;
  }

  private generateId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }

  private hash(input: string): number {
    let h = 2166136261;
    for (let i = 0; i < input.length; i += 1) {
      h ^= input.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return Math.abs(h >>> 0);
  }

  private normalize(value: string): string {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_')
      .slice(0, 64);
  }

  private getStorageValue(key: string): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private setStorageValue(key: string, value: string) {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, value);
    } catch { }
  }

  private getSessionValue(key: string): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return window.sessionStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private setSessionValue(key: string, value: string) {
    if (typeof window === 'undefined') return;
    try {
      window.sessionStorage.setItem(key, value);
    } catch { }
  }
}
