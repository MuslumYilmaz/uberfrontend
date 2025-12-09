// src/app/core/services/question.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map, shareReplay, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Question } from '../models/question.model';
import { Tech } from '../models/user.model';

type Kind = 'coding' | 'trivia' | 'debug';
export type MixedQuestion = Question & { tech: Tech };

type DataVersion = { version: string };

@Injectable({ providedIn: 'root' })
export class QuestionService {
  private readonly cachePrefix = 'qcache:';          // normalized cache
  private readonly overridePrefix = 'qoverride:';    // manual/local overrides
  private readonly dvKey = `${this.cachePrefix}dv`;

  // NEW: CDN / LocalStorage switcher flag
  private readonly cdnFlagKey = 'fa:cdn:enabled';
  // Varsayılan: environment.cdnBaseUrl varsa CDN açık kabul ediyoruz
  private readonly defaultCdnEnabled =
    typeof (environment as any).cdnEnabled === 'boolean'
      ? (environment as any).cdnEnabled
      : !!(environment as any).cdnBaseUrl;
  private version$?: Observable<string>;

  constructor(private http: HttpClient) { }

  // ------- PUBLIC FLAG API -------------------------------------

  /** Runtime'da CDN'i aç/kapatmak için. Örn: settings ekranından çağır. */
  setCdnEnabled(enabled: boolean): void {
    this.safeSet(this.cdnFlagKey, enabled ? '1' : '0');
    // Mod değişince eski normalized cache'leri temizlemek mantıklı
    this.clearCache();
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
   * 1. Local override in localStorage (qoverride:<tech>:<kind>)
   * 2. Cached normalized list (qcache:<tech>:<kind>)
   * 3. CDN JSON (if cdnBaseUrl configured)
   * 4. Assets JSON under assets/questions/<tech>/<kind>.json
   */
  loadQuestions(technology: Tech, kind: Kind): Observable<Question[]> {
    return this.getVersion().pipe(
      switchMap(() => {
        const oKey = this.overrideKey(technology, kind);
        const cKey = this.key(technology, kind);

        // 1) Local override
        const overrideRaw = this.safeGet(oKey);
        if (overrideRaw) {
          const parsed = this.safeParse(overrideRaw);
          const list = this.normalizeQuestions(parsed, technology, kind);
          return of(list);
        }

        // 2) Normal cached list
        const cachedRaw = this.safeGet(cKey);
        if (cachedRaw) {
          const parsed = this.safeParse(cachedRaw);
          const list = this.normalizeQuestions(parsed, technology, kind);
          return of(list);
        }

        // 3) Remote source:
        //    - cdnEnabled === true  → CDN + fallback assets
        //    - cdnEnabled === false → direkt assets (CDN yok)
        const assetsUrl = this.assetUrl(technology, kind);
        const useCdn = this.cdnEnabled;
        const cdnUrl = useCdn ? this.cdnUrl(technology, kind) : '';

        const source$ = cdnUrl
          ? this.http.get<any>(cdnUrl).pipe(
            catchError(() => this.http.get<any>(assetsUrl))
          )
          : this.http.get<any>(assetsUrl);

        return source$.pipe(
          map((raw) => this.normalizeQuestions(raw, technology, kind)),
          catchError(() => of([] as Question[])),
          tap((list) => {
            this.safeSet(cKey, JSON.stringify(list));
          })
        );
      })
    );
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
    const key = `${this.cachePrefix}system-design`;
    const cachedRaw = this.safeGet(key);

    if (cachedRaw) {
      const parsed = this.safeParse(cachedRaw);
      if (Array.isArray(parsed)) return of(parsed as any[]);
    }

    const cdnBase = (environment as any).cdnBaseUrl?.replace(/\/+$/, '');
    const useCdn = this.cdnEnabled;

    const cdnUrl = useCdn && cdnBase
      ? `${cdnBase}/questions/system-design/index.json`
      : null;

    const assetsUrl = `assets/questions/system-design/index.json`;

    const source$ = cdnUrl
      ? this.http.get<any[]>(cdnUrl).pipe(
        catchError(() => this.http.get<any[]>(assetsUrl))
      )
      : this.http.get<any[]>(assetsUrl);

    return source$.pipe(
      catchError(() => of([] as any[])),
      tap((qs) => this.safeSet(key, JSON.stringify(qs)))
    );
  }

  /** Load a single system-design question (meta + section blocks). */
  loadSystemDesignQuestion(id: string): Observable<any | null> {
    const cdnBase = (environment as any).cdnBaseUrl?.replace(/\/+$/, '');
    const useCdn = this.cdnEnabled;

    const metaCdnUrl = useCdn && cdnBase
      ? `${cdnBase}/questions/system-design/${id}/meta.json`
      : null;

    const metaAssetsUrl = `assets/questions/system-design/${id}/meta.json`;

    const meta$ = metaCdnUrl
      ? this.http.get<any>(metaCdnUrl).pipe(
        catchError(() => this.http.get<any>(metaAssetsUrl))
      )
      : this.http.get<any>(metaAssetsUrl);

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

        const baseCdnFolder = metaCdnUrl
          ? metaCdnUrl.replace(/\/meta\.json$/, '')
          : null;
        const baseAssetsFolder = metaAssetsUrl.replace(/\/meta\.json$/, '');

        const sectionRequests = sections.map((s: any) => {
          const file = s.file;
          const secCdnUrl = baseCdnFolder && useCdn
            ? `${baseCdnFolder}/${file}`
            : null;
          const secAssetsUrl = `${baseAssetsFolder}/${file}`;

          const src$ = secCdnUrl
            ? this.http.get<any>(secCdnUrl).pipe(
              catchError(() => this.http.get<any>(secAssetsUrl))
            )
            : this.http.get<any>(secAssetsUrl);

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
      catchError(() => of(null))
    );
  }

  /** Clear all normalized caches (does NOT clear local overrides). */
  clearCache(): void {
    if (!this.hasLocalStorage()) return;
    Object.keys(localStorage).forEach((k) => {
      if (k.startsWith(this.cachePrefix)) localStorage.removeItem(k);
    });
  }

  // ---------- overrides (for you / devtools) --------------------------------

  /** Manually set a local override list. */
  setLocalOverride(technology: Tech, kind: Kind, questions: Question[] | any): void {
    const key = this.overrideKey(technology, kind);
    const normalized = this.normalizeQuestions(questions, technology, kind);
    this.safeSet(key, JSON.stringify(normalized));
  }

  /** Remove a specific override so CDN/assets are used again. */
  clearLocalOverride(technology: Tech, kind: Kind): void {
    const key = this.overrideKey(technology, kind);
    if (!this.hasLocalStorage()) return;
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  }

  /** Nuke all overrides. */
  clearAllOverrides(): void {
    if (!this.hasLocalStorage()) return;
    Object.keys(localStorage).forEach((k) => {
      if (k.startsWith(this.overridePrefix)) localStorage.removeItem(k);
    });
  }

  // ---------- internals -----------------------------------------------------

  private key(tech: Tech, kind: Kind) {
    return `${this.cachePrefix}${tech}:${kind}`;
  }

  private overrideKey(tech: Tech, kind: Kind) {
    return `${this.overridePrefix}${tech}:${kind}`;
  }

  private assetUrl(tech: Tech, kind: Kind) {
    return `assets/questions/${tech}/${kind}.json`;
  }

  private cdnUrl(tech: Tech, kind: Kind): string {
    const base = (environment as any).cdnBaseUrl;
    if (!base) return '';
    return `${String(base).replace(/\/+$/, '')}/questions/${tech}/${kind}.json`;
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

  /** Fetch data-version once; invalidate normalized cache when it changes. */
  private getVersion(): Observable<string> {
    if (!this.version$) {
      this.version$ = this.http.get<DataVersion>('assets/data-version.json').pipe(
        map((v) => String((v as any)?.version ?? '0')),
        catchError(() => of('0')),
        tap((ver) => this.ensureCacheVersion(ver)),
        shareReplay(1)
      );
    }
    return this.version$;
  }

  private ensureCacheVersion(ver: string): void {
    if (!this.hasLocalStorage()) return;

    const prev = localStorage.getItem(this.dvKey);
    if (prev !== ver) {
      // Clear ONLY normalized caches; keep manual overrides intact.
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith(this.cachePrefix)) localStorage.removeItem(k);
      });
      localStorage.setItem(this.dvKey, ver);
    }
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

  private safeParse(raw: string): any | null {
    try { return JSON.parse(raw); } catch { return null; }
  }
}