// src/app/core/services/question.service.ts
import { HttpClient } from '@angular/common/http';
import { isPlatformServer } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { TransferState, makeStateKey } from '@angular/platform-browser';
import { firstValueFrom, forkJoin, from, Observable, of } from 'rxjs';
import { catchError, finalize, map, shareReplay, switchMap, tap } from 'rxjs/operators';
import { AccessLevel, Question } from '../models/question.model';
import { Tech } from '../models/user.model';
import { ASSET_READER, AssetReader } from './asset-reader';
import { QuestionPersistenceService } from './question-persistence.service';
import { PracticeAssetResolverService } from './practice-asset-resolver.service';

type Kind = 'coding' | 'trivia' | 'debug';
type LoadQuestionsOptions = {
  transferState?: boolean;
};
export type MixedQuestion = Question & { tech: Tech };
type LoadSystemDesignOptions = {
  transferState?: boolean;
};
export type QuestionListItem = Pick<
  Question,
  'id' | 'title' | 'type' | 'technology' | 'access' | 'difficulty' | 'tags' | 'importance' | 'companies' | 'description'
> & {
  shortDescription?: string;
};
export type MixedQuestionListItem = QuestionListItem & { tech: Tech };
export type ShowcaseStatsPayload = {
  totalQuestions: number;
  companyCounts: Record<string, { all: number; coding: number; trivia: number; system: number }>;
};

@Injectable({ providedIn: 'root' })
export class QuestionService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isServer = isPlatformServer(this.platformId);
  private readonly transferState = inject(TransferState);
  private readonly assetReader = inject(ASSET_READER) as AssetReader;
  private readonly persistence = inject(QuestionPersistenceService);
  private readonly assetResolver = inject(PracticeAssetResolverService);

  private readonly cachePrefix = 'qcache:';          // normalized cache
  private readonly overridePrefix = 'qoverride:';    // manual/local overrides
  private readonly inflightLoads = new Map<string, Observable<Question[]>>();

  constructor(private http: HttpClient) { }

  // ------- PUBLIC FLAG API -------------------------------------

  /** Runtime'da CDN'i aç/kapatmak için. Örn: settings ekranından çağır. */
  setCdnEnabled(enabled: boolean): void {
    this.assetResolver.setCdnEnabled(enabled);
    this.clearCache();
  }

  /** Şu an CDN modunun açık mı, local-only mod mu olduğunu döner. */
  isCdnEnabled(): boolean {
    return this.assetResolver.isCdnEnabled();
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

    const inflightKey = `${technology}:${kind}:${this.assetResolver.isCdnEnabled() ? 'cdn' : 'assets'}`;
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


  /** Load all questions for multiple techs (for detail-grade views). */
  loadAllQuestions(
    kind: Exclude<Kind, 'debug'>,
    options: LoadQuestionsOptions = {},
  ): Observable<MixedQuestion[]> {
    const TECHS: Tech[] = ['javascript', 'angular', 'react', 'vue', 'html', 'css'];
    return forkJoin(
      TECHS.map((t) =>
        this.loadQuestions(t, kind, options).pipe(
          map((list) => list.map((q) => ({ ...q, tech: t } as MixedQuestion)))
        )
      )
    ).pipe(map((buckets) => buckets.flat()));
  }

  /** List-safe summary payload for high-cardinality list pages. */
  loadQuestionSummaries(
    technology: Tech,
    kind: Kind,
    options: LoadQuestionsOptions = { transferState: false },
  ): Observable<QuestionListItem[]> {
    const requestOptions: LoadQuestionsOptions = {
      transferState: options.transferState ?? false,
    };
    return this.loadQuestions(technology, kind, requestOptions).pipe(
      map((list) => list.map((q) => this.toQuestionListItem(q))),
    );
  }

  /** List-safe summary payload for aggregated list pages. */
  loadAllQuestionSummaries(
    kind: Exclude<Kind, 'debug'>,
    options: LoadQuestionsOptions = { transferState: false },
  ): Observable<MixedQuestionListItem[]> {
    const TECHS: Tech[] = ['javascript', 'angular', 'react', 'vue', 'html', 'css'];
    return forkJoin(
      TECHS.map((t) =>
        this.loadQuestionSummaries(t, kind, options).pipe(
          map((list) => list.map((q) => ({ ...q, tech: t } as MixedQuestionListItem))),
        ),
      ),
    ).pipe(map((buckets) => buckets.flat()));
  }

  loadShowcaseStats(
    options: { transferState?: boolean } = {},
  ): Observable<ShowcaseStatsPayload> {
    const useTransferState = options.transferState !== false;
    if (this.isServer) {
      return this.loadShowcaseStatsFromFs(useTransferState);
    }

    const tsKey = this.showcaseStatsStateKey();
    if (useTransferState && this.transferState.hasKey(tsKey)) {
      const stats = this.transferState.get(tsKey, this.emptyShowcaseStats());
      this.transferState.remove(tsKey);
      return of(stats);
    }

    const { primary, fallback } = this.getAssetUrls('questions/showcase-stats.json');
    const source$ = primary !== fallback
      ? this.http
        .get<ShowcaseStatsPayload>(primary)
        .pipe(catchError(() => this.http.get<ShowcaseStatsPayload>(fallback)))
      : this.http.get<ShowcaseStatsPayload>(fallback);

    return source$.pipe(
      map((raw) => this.normalizeShowcaseStats(raw)),
      tap((stats) => {
        if (useTransferState) this.transferState.set(tsKey, stats);
      }),
      catchError(() => of(this.emptyShowcaseStats())),
    );
  }

  /** Convenience: fetch a single question by id. */
  getById(technology: Tech, kind: Kind, id: string): Observable<Question | null> {
    return this.loadQuestions(technology, kind).pipe(
      map((list) => list.find((q) => q.id === id) ?? null)
    );
  }

  /** System design list (now using index.json). */
  loadSystemDesign(options: LoadSystemDesignOptions = {}): Observable<any[]> {
    const useTransferState = options.transferState !== false;
    if (this.isServer) {
      return this.loadSystemDesignFromFs(useTransferState);
    }

    const tsKey = this.systemDesignStateKey();
    if (useTransferState && this.transferState.hasKey(tsKey)) {
      const list = this.transferState.get(tsKey, [] as any[]);
      this.transferState.remove(tsKey);
      return of(list);
    }

    return this.getVersion().pipe(
      switchMap((bankVersion) => from(this.loadSystemDesignClient(bankVersion))),
    );
  }

  /** Load a single system-design question (meta + section blocks). */
  loadSystemDesignQuestion(
    id: string,
    options: LoadSystemDesignOptions = {},
  ): Observable<any | null> {
    const useTransferState = options.transferState !== false;
    if (this.isServer) {
      return this.loadSystemDesignQuestionFromFs(id, useTransferState);
    }

    const tsKey = this.systemDesignQuestionStateKey(id);
    if (useTransferState && this.transferState.hasKey(tsKey)) {
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
        if (useTransferState && full) {
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
    await this.assetResolver.ensureCacheVersionAsync(this.cachePrefix, bankVersion);

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
    await this.assetResolver.ensureCacheVersionAsync(this.cachePrefix, bankVersion);

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

  private toQuestionListItem(q: Question): QuestionListItem {
    const shortDescription = this.extractShortDescription(q.description);
    return {
      id: q.id,
      title: q.title,
      type: q.type,
      technology: q.technology,
      access: q.access,
      difficulty: q.difficulty,
      tags: Array.isArray(q.tags) ? q.tags : [],
      importance: Number(q.importance ?? 0),
      companies: Array.isArray(q.companies) ? q.companies : [],
      description: shortDescription || undefined,
      shortDescription: shortDescription || undefined,
    };
  }

  private extractShortDescription(description: Question['description']): string {
    const summary =
      description && typeof description === 'object'
        ? (description.summary || '')
        : '';
    const text =
      typeof description === 'string'
        ? description
        : summary;
    const normalized = String(text || '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!normalized) return '';
    const maxLength = 220;
    return normalized.length > maxLength
      ? `${normalized.slice(0, maxLength - 1).trimEnd()}…`
      : normalized;
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

  private showcaseStatsStateKey() {
    return makeStateKey<ShowcaseStatsPayload>('showcase:stats');
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

  private loadSystemDesignFromFs(transferState = true): Observable<any[]> {
    const rel = 'assets/questions/system-design/index.json';
    const key = this.systemDesignStateKey();
    return this.assetReader.readJson(rel).pipe(
      map((raw) => Array.isArray(raw) ? raw : []),
      tap((list) => {
        if (transferState) this.transferState.set(key, list);
      }),
      catchError(() => of([] as any[])),
    );
  }

  private loadShowcaseStatsFromFs(transferState = true): Observable<ShowcaseStatsPayload> {
    const rel = 'assets/questions/showcase-stats.json';
    const key = this.showcaseStatsStateKey();
    return this.assetReader.readJson(rel).pipe(
      map((raw) => this.normalizeShowcaseStats(raw)),
      tap((stats) => {
        if (transferState) this.transferState.set(key, stats);
      }),
      catchError(() => of(this.emptyShowcaseStats())),
    );
  }

  private loadSystemDesignQuestionFromFs(id: string, transferState = true): Observable<any | null> {
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
        if (transferState && full) this.transferState.set(key, full);
      }),
      catchError(() => of(null))
    );
  }

  private getVersion(): Observable<string> {
    return this.assetResolver.getVersion();
  }

  private getAssetUrls(path: string, bankVersion?: string): { primary: string; fallback: string } {
    return this.assetResolver.getAssetUrls(path, bankVersion);
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

  private emptyShowcaseStats(): ShowcaseStatsPayload {
    return { totalQuestions: 0, companyCounts: {} };
  }

  private normalizeShowcaseStats(raw: unknown): ShowcaseStatsPayload {
    const source = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
    const totalQuestionsRaw = Number(source['totalQuestions']);
    const totalQuestions = Number.isFinite(totalQuestionsRaw) && totalQuestionsRaw > 0
      ? Math.floor(totalQuestionsRaw)
      : 0;

    const companyCountsRaw = source['companyCounts'];
    const companyCountsSource =
      companyCountsRaw && typeof companyCountsRaw === 'object'
        ? companyCountsRaw as Record<string, unknown>
        : {};

    const companyCounts: ShowcaseStatsPayload['companyCounts'] = {};
    for (const [slugRaw, bucketRaw] of Object.entries(companyCountsSource)) {
      const slug = String(slugRaw || '').trim().toLowerCase();
      if (!slug || !bucketRaw || typeof bucketRaw !== 'object') continue;

      const bucket = bucketRaw as Record<string, unknown>;
      const coding = this.safePositiveInt(bucket['coding']);
      const trivia = this.safePositiveInt(bucket['trivia']);
      const system = this.safePositiveInt(bucket['system']);
      const allRaw = this.safePositiveInt(bucket['all']);
      const all = allRaw || coding + trivia + system;

      companyCounts[slug] = { all, coding, trivia, system };
    }

    return { totalQuestions, companyCounts };
  }

  private safePositiveInt(value: unknown): number {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) return 0;
    return Math.floor(n);
  }
}
