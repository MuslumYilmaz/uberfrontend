import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TransferState, makeStateKey } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';
import { firstValueFrom, Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';
import { QuestionPersistenceService } from './question-persistence.service';
import { buildAssetUrl, getSafeAssetBase, normalizeAssetPath } from '../utils/asset-url.util';

type DataVersion = { dataVersion?: string; version?: string };

@Injectable({ providedIn: 'root' })
export class PracticeAssetResolverService {
  private readonly cdnFlagKey = 'fa:cdn:enabled';
  private readonly defaultCdnEnabled =
    typeof (environment as any).cdnEnabled === 'boolean'
      ? (environment as any).cdnEnabled
      : !!(environment as any).cdnBaseUrl;
  private version$?: Observable<string>;
  private versionModeKey: string | null = null;
  private readonly cacheVersionInflight = new Map<string, Promise<void>>();

  constructor(
    private readonly http: HttpClient,
    private readonly persistence: QuestionPersistenceService,
    private readonly transferState: TransferState,
  ) {}

  setCdnEnabled(enabled: boolean): void {
    this.safeSet(this.cdnFlagKey, enabled ? '1' : '0');
    this.resetVersionState();
  }

  isCdnEnabled(): boolean {
    const raw = this.safeGet(this.cdnFlagKey);
    if (raw === '0' || raw === 'false') return false;
    if (raw === '1' || raw === 'true') return true;
    return this.defaultCdnEnabled;
  }

  resetVersionState(): void {
    this.version$ = undefined;
    this.versionModeKey = null;
  }

  getVersion(): Observable<string> {
    const base = this.getAssetBase();
    const modeKey = base ? `base:${base}` : 'assets';
    if (!this.version$ || this.versionModeKey !== modeKey) {
      this.versionModeKey = modeKey;

      const tsKey = makeStateKey<string>('practice:data-version');
      if (this.transferState.hasKey(tsKey)) {
        const cached = this.transferState.get(tsKey, '0');
        this.transferState.remove(tsKey);
        this.version$ = of(cached).pipe(shareReplay(1));
        return this.version$;
      }

      const bust = `t=${Date.now()}`;
      const { primary, fallback } = this.getAssetUrls('data-version.json');
      const primaryUrl = this.appendQuery(primary, bust);
      const fallbackUrl = this.appendQuery(fallback, bust);
      const source$ = primaryUrl !== fallbackUrl
        ? this.http.get<DataVersion>(primaryUrl).pipe(
            catchError(() => this.http.get<DataVersion>(fallbackUrl)),
          )
        : this.http.get<DataVersion>(fallbackUrl);

      this.version$ = source$.pipe(
        map((payload) => String(payload?.dataVersion ?? payload?.version ?? '0')),
        catchError(() => of('0')),
        shareReplay(1),
      );
    }

    return this.version$;
  }

  getAssetUrls(path: string, bankVersion?: string): { primary: string; fallback: string } {
    const normalized = normalizeAssetPath(path);
    const base = this.getAssetBase();
    const primary = base ? buildAssetUrl(normalized, { preferBase: base }) : normalized;
    const fallback = normalized;

    return {
      primary: this.appendVersion(primary, bankVersion),
      fallback: this.appendVersion(fallback, bankVersion),
    };
  }

  async ensureCacheVersionAsync(prefixRaw: string, versionRaw: string): Promise<void> {
    const prefix = String(prefixRaw ?? '').trim();
    const version = String(versionRaw ?? '').trim();
    if (!prefix || !version) return;

    const inflightKey = `${prefix}:${version}`;
    const existing = this.cacheVersionInflight.get(inflightKey);
    if (existing) {
      await existing;
      return;
    }

    const versionKey = `${prefix}dv`;
    const task = (async () => {
      const previous = await this.persistence.get(versionKey);
      if (previous === version) return;

      await this.persistence.clearByPrefix(prefix);
      this.clearLocalStorageByPrefix(prefix);
      await this.persistence.set(versionKey, version);
      this.safeSet(versionKey, version);
    })().finally(() => {
      this.cacheVersionInflight.delete(inflightKey);
    });

    this.cacheVersionInflight.set(inflightKey, task);
    await task;
  }

  async getCachedJson<T>(keyRaw: string): Promise<T | null> {
    const key = String(keyRaw ?? '').trim();
    if (!key) return null;

    const persisted = await this.persistence.get(key);
    if (persisted) return this.safeParse<T>(persisted);

    return this.safeParse<T>(this.safeGet(key));
  }

  async setCachedJson(keyRaw: string, value: unknown): Promise<void> {
    const key = String(keyRaw ?? '').trim();
    if (!key) return;

    const serialized = JSON.stringify(value);
    await this.persistence.set(key, serialized);
    this.safeSet(key, serialized);
  }

  async removeCachedValue(keyRaw: string): Promise<void> {
    const key = String(keyRaw ?? '').trim();
    if (!key) return;

    await this.persistence.remove(key);
    this.safeRemove(key);
  }

  private getAssetBase(): string {
    if (!this.isCdnEnabled()) return '';
    return getSafeAssetBase((environment as any).cdnBaseUrl || '');
  }

  private appendVersion(url: string, bankVersion?: string): string {
    const version = String(bankVersion ?? '').trim();
    if (!version || version === '0') return url;
    return this.appendQuery(url, `v=${encodeURIComponent(version)}`);
  }

  private appendQuery(url: string, query: string): string {
    if (!query) return url;
    const joiner = url.includes('?') ? '&' : '?';
    return `${url}${joiner}${query}`;
  }

  private safeParse<T>(raw: string | null): T | null {
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  private clearLocalStorageByPrefix(prefixRaw: string): void {
    const prefix = String(prefixRaw ?? '').trim();
    if (!prefix || !this.hasLocalStorage()) return;
    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith(prefix)) localStorage.removeItem(key);
      });
    } catch {
      // ignore
    }
  }

  private safeGet(key: string): string | null {
    if (!this.hasLocalStorage()) return null;
    try {
      const value = localStorage.getItem(key);
      return value && value.trim().length ? value : null;
    } catch {
      return null;
    }
  }

  private safeSet(key: string, value: string): void {
    if (!this.hasLocalStorage()) return;
    try {
      localStorage.setItem(key, value);
    } catch {
      // ignore quota issues
    }
  }

  private safeRemove(key: string): void {
    if (!this.hasLocalStorage()) return;
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }

  private hasLocalStorage(): boolean {
    if (typeof localStorage === 'undefined') return false;
    try {
      const key = '__practice_asset_probe__';
      localStorage.setItem(key, '1');
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }
}
