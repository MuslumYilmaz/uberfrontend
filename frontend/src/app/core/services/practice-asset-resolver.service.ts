import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';
import { QuestionPersistenceService } from './question-persistence.service';
import { normalizeAssetPath } from '../utils/asset-url.util';

type DataVersion = { dataVersion?: string; version?: string };

/**
 * Content assets ship with the build and are read from the page origin's
 * /assets. data-version.json names the build: `?v=` busts the browser cache
 * after a deploy, and ensureCacheVersionAsync drops the IndexedDB copies.
 */
@Injectable({ providedIn: 'root' })
export class PracticeAssetResolverService {
  private version$?: Observable<string>;
  private readonly cacheVersionInflight = new Map<string, Promise<void>>();

  constructor(
    private readonly http: HttpClient,
    private readonly persistence: QuestionPersistenceService,
  ) {}

  /** The build's data version, fetched once per session and shared by every reader. '0' when unknown. */
  getVersion(): Observable<string> {
    if (!this.version$) {
      const url = this.appendQuery(normalizeAssetPath('data-version.json'), `t=${Date.now()}`);
      this.version$ = this.http.get<DataVersion>(url).pipe(
        map((payload) => String(payload?.dataVersion ?? payload?.version ?? '0')),
        catchError(() => of('0')),
        shareReplay(1),
      );
    }

    return this.version$;
  }

  /** Same-origin URL of a content asset, versioned so a deploy busts the browser cache. */
  getAssetUrl(path: string, bankVersion?: string): string {
    return this.appendVersion(normalizeAssetPath(path), bankVersion);
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
      await this.persistence.set(versionKey, version);
    })().finally(() => {
      this.cacheVersionInflight.delete(inflightKey);
    });

    this.cacheVersionInflight.set(inflightKey, task);
    await task;
  }

  async getCachedJson<T>(keyRaw: string): Promise<T | null> {
    const key = String(keyRaw ?? '').trim();
    if (!key) return null;
    return this.safeParse<T>(await this.persistence.get(key));
  }

  async setCachedJson(keyRaw: string, value: unknown): Promise<void> {
    const key = String(keyRaw ?? '').trim();
    if (!key) return;
    await this.persistence.set(key, JSON.stringify(value));
  }

  async removeCachedValue(keyRaw: string): Promise<void> {
    const key = String(keyRaw ?? '').trim();
    if (!key) return;
    await this.persistence.remove(key);
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
}
