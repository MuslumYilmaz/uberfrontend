// src/app/core/services/question.service.ts
import { HttpClient } from '@angular/common/http';
import { isPlatformServer } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { TransferState, makeStateKey } from '@angular/platform-browser';
import { firstValueFrom, forkJoin, from, Observable, of } from 'rxjs';
import { catchError, finalize, map, shareReplay, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AccessLevel, Question } from '../models/question.model';
import { Tech } from '../models/user.model';
import { ASSET_READER, AssetReader } from './asset-reader';
import { QuestionPersistenceService } from './question-persistence.service';
import { buildAssetUrl, getSafeAssetBase, normalizeAssetPath } from '../utils/asset-url.util';

type Kind = 'coding' | 'trivia' | 'debug';
type LoadQuestionsOptions = {
  transferState?: boolean;
};
export type MixedQuestion = Question & { tech: Tech };

type DataVersion = { dataVersion?: string; version?: string };

@Injectable({ providedIn: 'root' })
export class QuestionService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isServer = isPlatformServer(this.platformId);
  private readonly transferState = inject(TransferState);
  private readonly assetReader = inject(ASSET_READER) as AssetReader;
  private readonly persistence = inject(QuestionPersistenceService);

  private readonly cachePrefix = 'qcache:';          // normalized cache
  private readonly overridePrefix = 'qoverride:';    // manual/local overrides
  private readonly dvKey = `${this.cachePrefix}dv`;
  private readonly inflightLoads = new Map<string, Observable<Question[]>>();
  private readonly cacheVersionInflight = new Map<string, Promise<void>>();

  // NEW: CDN / LocalStorage switcher flag
  private readonly cdnFlagKey = 'fa:cdn:enabled';
  // Varsayılan: environment.cdnBaseUrl varsa CDN açık kabul ediyoruz
  private readonly defaultCdnEnabled =
    typeof (environment as any).cdnEnabled === 'boolean'
      ? (environment as any).cdnEnabled
      : !!(environment as any).cdnBaseUrl;
  private version$?: Observable<string>;
  private versionModeKey: string | null = null;

  constructor(private http: HttpClient) { }

  // ------- PUBLIC FLAG API -------------------------------------

  /** Runtime'da CDN'i aç/kapatmak için. Örn: settings ekranından çağır. */
  setCdnEnabled(enabled: boolean): void {
    this.safeSet(this.cdnFlagKey, enabled ? '1' : '0');
    // Mod değişince eski normalized cache'leri temizlemek mantıklı
    this.clearCache();
    // Re-read data-version from the new source (CDN vs assets)
    this.version$ = undefined;
    this.versionModeKey = null;
  }

  /** Şu an CDN modunun açık mı, local-only mod mu olduğunu döner. */
  isCdnEnabled(): boolean {
    return this.cdnEnabled;
  }

  // Internal getter
  private get cdnEnabled(): boolean {
    const raw = this.safeGet(this.cdnFlagKey);
    if (raw === '0' || raw === 'false') return false;
    if (raw === '1' || raw === 'true') return true;
    return this.defaultCdnEnabled;
  }

  // ---------- public API ----------------------------------------------------

  /**
   * Load questions for a given tech + kind.
   *
   * Order of precedence:
   * 1. Local override in persistence store (qoverride:<tech>:<kind>)
   * 2. Cached normalized list (qcache:<tech>:<kind>)
   * 3. Preferred asset base (if enabled)
   * 4. Assets JSON under assets/questions/<tech>/<kind>.json
   */
  loadQuestions(
    technology: Tech,
    kind: Kind,
    options: LoadQuestionsOptions = {},
  ): Observable<Question[]> {
    const useTransferState = options.transferState !== false;
    if (this.isServer) {
      return this.loadQuestionsFromFs(technology, kind, useTransferState);
    }

    const tsKey = this.questionsStateKey(technology, kind);
    if (useTransferState && this.transferState.hasKey(tsKey)) {
      const list = this.transferState.get(tsKey, [] as Question[]);
      this.transferState.remove(tsKey);
      return of(list);
    }

    const inflightKey = `${technology}:${kind}:${this.cdnEnabled ? 'cdn' : 'assets'}`;
    const existing = this.inflightLoads.get(inflightKey);
    if (existing) return existing;

    const request$ = this.getVersion().pipe(
      switchMap((bankVersion) => from(this.loadQuestionsClient(technology, kind, bankVersion))),
    ).pipe(
      finalize(() => this.inflightLoads.delete(inflightKey)),
      shareReplay(1),
    );

    this.inflightLoads.set(inflightKey, request$);
    return request$;
  }


  /** Load all questions for multiple techs (for companies pages, etc.). */
  loadAllQuestions(kind: Exclude<Kind, 'debug'>): Observable<MixedQuestion[]> {
    const TECHS: Tech[] = ['javascript', 'angular', 'react', 'vue', 'html', 'css'];
    return forkJoin(
      TECHS.map((t) =>
        this.loadQuestions(t, kind).pipe(
          map((list) => list.map((q) => ({ ...q, tech: t } as MixedQuestion)))
        )
      )
    ).pipe(map((buckets) => buckets.flat()));
  }

  /** Convenience: fetch a single question by id. */
  getById(technology: Tech, kind: Kind, id: string): Observable<Question | null> {
    return this.loadQuestions(technology, kind).pipe(
      map((list) => list.find((q) => q.id === id) ?? null)
    );
  }

  /** System design list (now using index.json). */
  loadSystemDesign(): Observable<any[]> {
    if (this.isServer) {
      return this.loadSystemDesignFromFs();
    }

    const tsKey = this.systemDesignStateKey();
    if (this.transferState.hasKey(tsKey)) {
      const list = this.transferState.get(tsKey, [] as any[]);
      this.transferState.remove(tsKey);
      return of(list);
    }

    return this.getVersion().pipe(
      switchMap((bankVersion) => from(this.loadSystemDesignClient(bankVersion))),
    );
  }

  /** Load a single system-design question (meta + section blocks). */
  loadSystemDesignQuestion(id: string): Observable<any | null> {
    if (this.isServer) {
      return this.loadSystemDesignQuestionFromFs(id);
    }

    const tsKey = this.systemDesignQuestionStateKey(id);
    if (this.transferState.hasKey(tsKey)) {
      const cached = this.transferState.get(tsKey, null as any);
      this.transferState.remove(tsKey);
      return of(cached);
    }

    const { primary: metaPrimary, fallback: metaFallback } = this.getAssetUrls(
      `questions/system-design/${id}/meta.json`
    );
    const meta$ = metaPrimary !== metaFallback
      ? this.http.get<any>(metaPrimary).pipe(catchError(() => this.http.get<any>(metaFallback)))
      : this.http.get<any>(metaFallback);

    return meta$.pipe(
      switchMap((meta) => {
        // Eski radio-based formatı da idare edelim (ileride backward compat için iyi)
        const sections = Array.isArray(meta.sections) ? meta.sections : [];
        if (!sections.length) {
          // meta zaten radio içeriyorsa dokunma
          if (Array.isArray(meta.radio)) {
            return of(meta);
          }
          return of(meta);
        }

        const sectionRequests = sections.map((s: any) => {
          const file = s.file;
          const { primary, fallback } = this.getAssetUrls(`questions/system-design/${id}/${file}`);
          const src$ = primary !== fallback
            ? this.http.get<any>(primary).pipe(catchError(() => this.http.get<any>(fallback)))
            : this.http.get<any>(fallback);

          return src$.pipe(
            catchError(() => of(null)),
            map((sec) => ({
              key: s.key,
              title: s.title,
              // section json -> { key, title, blocks: Block[] } bekliyoruz
              blocks: (sec && (sec as any).blocks) || []
            }))
          );
        });

        if (!sectionRequests.length) {
          return of(meta);
        }

        return forkJoin(sectionRequests).pipe(
          map((radioSections) => ({
            ...meta,
            radio: radioSections
          }))
        );
      }),
      tap((full) => {
        if (full) {
          this.transferState.set(this.systemDesignQuestionStateKey(id), full);
        }
      }),
      catchError(() => of(null))
    );
  }

  /** Clear all normalized caches (does NOT clear local overrides). */
  clearCache(): void {
    this.clearLocalStorageByPrefix(this.cachePrefix);
    this.runBackground(this.persistence.clearByPrefix(this.cachePrefix));
  }

  // ---------- overrides (for you / devtools) --------------------------------

  /** Manually set a local override list. */
  setLocalOverride(technology: Tech, kind: Kind, questions: Question[] | any): void {
    const key = this.overrideKey(technology, kind);
    const normalized = this.normalizeQuestions(questions, technology, kind);
    const payload = JSON.stringify(normalized);
    this.safeSet(key, payload); // immediate compatibility for same-tick reads
    this.runBackground(this.persistence.set(key, payload));
  }

  /** Remove a specific override so CDN/assets are used again. */
  clearLocalOverride(technology: Tech, kind: Kind): void {
    const key = this.overrideKey(technology, kind);
    this.safeRemove(key);
    this.runBackground(this.persistence.remove(key));
  }

  /** Nuke all overrides. */
  clearAllOverrides(): void {
    this.clearLocalStorageByPrefix(this.overridePrefix);
    this.runBackground(this.persistence.clearByPrefix(this.overridePrefix));
  }

  // ---------- internals -----------------------------------------------------

  private key(tech: Tech, kind: Kind) {
    return `${this.cachePrefix}${tech}:${kind}`;
  }

  private overrideKey(tech: Tech, kind: Kind) {
    return `${this.overridePrefix}${tech}:${kind}`;
  }

  private async loadQuestionsClient(
    technology: Tech,
    kind: Kind,
    bankVersion: string,
  ): Promise<Question[]> {
    await this.ensureCacheVersionAsync(bankVersion);

    const oKey = this.overrideKey(technology, kind);
    const cKey = this.key(technology, kind);

    // 1) Local override
    const overrideRaw = await this.persistence.get(oKey);
    if (overrideRaw) {
      const parsed = this.safeParse(overrideRaw);
      return this.normalizeQuestions(parsed, technology, kind);
    }

    // 2) Normal cached list
    const cachedRaw = await this.persistence.get(cKey);
    if (cachedRaw) {
      const parsed = this.safeParse(cachedRaw);
      return this.normalizeQuestions(parsed, technology, kind);
    }

    // 3) Remote source:
    //    - cdnEnabled === true  → CDN + fallback assets
    //    - cdnEnabled === false → direkt assets (CDN yok)
    const { primary, fallback } = this.getAssetUrls(`questions/${technology}/${kind}.json`, bankVersion);
    const source$ = primary !== fallback
      ? this.http.get<any>(primary).pipe(catchError(() => this.http.get<any>(fallback)))
      : this.http.get<any>(fallback);

    const list = await firstValueFrom(source$.pipe(
      map((raw) => this.normalizeQuestions(raw, technology, kind)),
      catchError(() => of([] as Question[])),
    ));

    await this.persistence.set(cKey, JSON.stringify(list));
    return list;
  }

  private async loadSystemDesignClient(bankVersion: string): Promise<any[]> {
    await this.ensureCacheVersionAsync(bankVersion);

    const key = `${this.cachePrefix}system-design`;
    const cachedRaw = await this.persistence.get(key);
    if (cachedRaw) {
      const parsed = this.safeParse(cachedRaw);
      if (Array.isArray(parsed)) {
        const hasAccess = parsed.every((q: any) => q && typeof q === 'object' && 'access' in q);
        if (hasAccess) return parsed as any[];
      }
      await this.persistence.remove(key);
    }

    const { primary, fallback } = this.getAssetUrls('questions/system-design/index.json', bankVersion);
    const source$ = primary !== fallback
      ? this.http.get<any[]>(primary).pipe(catchError(() => this.http.get<any[]>(fallback)))
      : this.http.get<any[]>(fallback);

    const list = await firstValueFrom(source$.pipe(
      catchError(() => of([] as any[])),
    ));

    await this.persistence.set(key, JSON.stringify(list));
    return list;
  }

  /** Normalize any supported JSON shape to Question[] and add safe defaults. */
  private normalizeQuestions(raw: any, technology: Tech, kind: Kind): Question[] {
    const list: any[] = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.questions)
        ? raw.questions
        : raw && typeof raw === 'object'
          ? [raw]
          : [];

    const normalized: Question[] = list.map((q: any) => ({
      ...q,
      technology: q?.technology ?? technology,
      type: q?.type ?? kind,
      access: (q?.access as AccessLevel) ?? 'free',
      difficulty: q?.difficulty ?? 'easy',
      importance: Number(q?.importance ?? 0),
      languageDefault: q?.languageDefault ?? 'js',
    }));

    normalized.sort((a, b) => {
      const ia = Number((a as any).importance ?? 0);
      const ib = Number((b as any).importance ?? 0);
      if (ia !== ib) return ib - ia;
      return (a.title || '').localeCompare(b.title || '');
    });

    return normalized;
  }

  private questionsStateKey(technology: Tech, kind: Kind) {
    return makeStateKey<Question[]>(`questions:${technology}:${kind}`);
  }

  private systemDesignStateKey() {
    return makeStateKey<any[]>('system-design:index');
  }

  private systemDesignQuestionStateKey(id: string) {
    return makeStateKey<any>(`system-design:${id}`);
  }

  private loadQuestionsFromFs(
    technology: Tech,
    kind: Kind,
    transferState = true,
  ): Observable<Question[]> {
    const rel = `assets/questions/${technology}/${kind}.json`;
    const key = this.questionsStateKey(technology, kind);
    return this.assetReader.readJson(rel).pipe(
      map((raw) => this.normalizeQuestions(raw, technology, kind)),
      tap((list) => {
        if (transferState) this.transferState.set(key, list);
      }),
      catchError(() => of([] as Question[])),
    );
  }

  private loadSystemDesignFromFs(): Observable<any[]> {
    const rel = 'assets/questions/system-design/index.json';
    const key = this.systemDesignStateKey();
    return this.assetReader.readJson(rel).pipe(
      map((raw) => Array.isArray(raw) ? raw : []),
      tap((list) => this.transferState.set(key, list)),
      catchError(() => of([] as any[])),
    );
  }

  private loadSystemDesignQuestionFromFs(id: string): Observable<any | null> {
    const metaRel = `assets/questions/system-design/${id}/meta.json`;
    const key = this.systemDesignQuestionStateKey(id);
    return this.assetReader.readJson(metaRel).pipe(
      switchMap((meta) => {
        if (!meta) return of(null);
        const sections = Array.isArray(meta.sections) ? meta.sections : [];
        if (!sections.length) {
          return of(meta);
        }
        const sectionRequests = sections.map((s: any) =>
          this.assetReader.readJson(`assets/questions/system-design/${id}/${s.file}`).pipe(
            catchError(() => of(null)),
            map((sec) => ({
              key: s.key,
              title: s.title,
              blocks: (sec && (sec as any).blocks) || [],
            }))
          )
        );
        return forkJoin(sectionRequests).pipe(
          map((sectionsResolved) => ({
            ...meta,
            radio: sectionsResolved,
          }))
        );
      }),
      tap((full) => {
        if (full) this.transferState.set(key, full);
      }),
      catchError(() => of(null))
    );
  }

  /** Fetch data-version once; invalidate normalized cache when it changes. */
  private getVersion(): Observable<string> {
    const base = this.getAssetBase();
    const modeKey = base ? `base:${base}` : 'assets';
    if (!this.version$ || this.versionModeKey !== modeKey) {
      this.versionModeKey = modeKey;

      const bust = `t=${Date.now()}`;
      const { primary, fallback } = this.getAssetUrls('data-version.json');
      const primaryUrl = this.appendQuery(primary, bust);
      const fallbackUrl = this.appendQuery(fallback, bust);
      const src$ = primaryUrl !== fallbackUrl
        ? this.http.get<DataVersion>(primaryUrl).pipe(
          catchError(() => this.http.get<DataVersion>(fallbackUrl))
        )
        : this.http.get<DataVersion>(fallbackUrl);

      this.version$ = src$.pipe(
        map((v) => String(v?.dataVersion ?? v?.version ?? '0')),
        catchError(() => of('0')),
        shareReplay(1)
      );
    }

    return this.version$;
  }

  private getAssetBase(): string {
    if (!this.cdnEnabled) return '';
    return getSafeAssetBase((environment as any).cdnBaseUrl || '');
  }

  private getAssetUrls(path: string, bankVersion?: string): { primary: string; fallback: string } {
    const normalized = normalizeAssetPath(path);
    const base = this.getAssetBase();
    const primary = base ? buildAssetUrl(normalized, { preferBase: base }) : normalized;
    const fallback = normalized;

    const versionedPrimary = this.appendVersion(primary, bankVersion);
    const versionedFallback = this.appendVersion(fallback, bankVersion);
    return { primary: versionedPrimary, fallback: versionedFallback };
  }

  private appendVersion(url: string, bankVersion?: string): string {
    const v = String(bankVersion ?? '').trim();
    if (!v || v === '0') return url;
    return this.appendQuery(url, `v=${encodeURIComponent(v)}`);
  }

  private appendQuery(url: string, query: string): string {
    if (!query) return url;
    const joiner = url.includes('?') ? '&' : '?';
    return `${url}${joiner}${query}`;
  }

  private async ensureCacheVersionAsync(verRaw: string): Promise<void> {
    const ver = String(verRaw ?? '').trim();
    if (!ver) return;

    const existingInflight = this.cacheVersionInflight.get(ver);
    if (existingInflight) {
      await existingInflight;
      return;
    }

    const task = (async () => {
      const prev = await this.persistence.get(this.dvKey);
      if (prev === ver) return;

      await this.persistence.clearByPrefix(this.cachePrefix);
      await this.persistence.set(this.dvKey, ver);
    })().finally(() => {
      this.cacheVersionInflight.delete(ver);
    });

    this.cacheVersionInflight.set(ver, task);
    await task;
  }

  // ---------- small helpers -------------------------------------------------

  private hasLocalStorage(): boolean {
    try {
      const k = '__q_probe__';
      localStorage.setItem(k, '1');
      localStorage.removeItem(k);
      return true;
    } catch {
      return false;
    }
  }

  private safeGet(key: string): string | null {
    if (!this.hasLocalStorage()) return null;
    try {
      const v = localStorage.getItem(key);
      return v && v.trim().length ? v : null;
    } catch {
      return null;
    }
  }

  private safeSet(key: string, value: string): void {
    if (!this.hasLocalStorage()) return;
    try {
      localStorage.setItem(key, value);
    } catch {
      // ignore quota issues; worst case falls back to network next load
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

  private runBackground(task: Promise<unknown>): void {
    void task.catch(() => { /* ignore */ });
  }

  private safeParse(raw: string): any | null {
    try { return JSON.parse(raw); } catch { return null; }
  }
}
