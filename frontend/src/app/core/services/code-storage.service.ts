import { Injectable } from '@angular/core';

type JsLang = 'js' | 'ts';
type CodeFormat = 'javascript' | 'typescript';

/** Old shape (kept for compatibility with getJs()/saveJs() call sites) */
export interface JsSave {
  code: string;
  language: JsLang;
  format: CodeFormat;
  version: 'v1' | 'v2';
  updatedAt: string; // ISO
}

export interface NgSave {
  files: Record<string, { code: string }>;
  projectId?: string;
  version: 'v1';
  updatedAt: string;
}

/** New consolidated per-question blob */
export interface JsBundleV2 {
  js?: { code?: string; baseline?: string };
  ts?: { code?: string; baseline?: string };
  lastLang?: JsLang;
  version: 'v2';
  updatedAt: string; // ISO
}

const DATA_VERSION = '2';                 // ⬅️ bump for schema changes
const BASE = 'code:';                     // common base
const PREFIX = `v${DATA_VERSION}:${BASE}`; // e.g. v2:code:

/** v1 key helpers (what you already have in LS today) */
const V1_PREFIX = 'v1:code:';
const V1_JS_RECORD = (qid: string) => `${V1_PREFIX}js:${qid}`;                      // {"code":"...","language":"js|ts",...}
const V1_JS_BASELINE = (qid: string, lang: JsLang) => `${V1_PREFIX}js:baseline:${qid}:${lang}`; // {"code":"..."}

/** Non-service key currently used for lang preference; we’ll migrate & delete it */
const UF_LANG_PREF = (qid: string) => `uf:lang:${qid}`;

/** v2 consolidated key (one per question) */
const V2_JS_BUNDLE = (qid: string) => `${PREFIX}js2:${qid}`; // single blob for both js & ts

@Injectable({ providedIn: 'root' })
export class CodeStorageService {
  // ---- one-time migration guard
  private migrated = false;

  // ---------- JS (consolidated) ----------

  /**
   * Return a JsSave snapshot shaped like v1 for compatibility with existing callers:
   * - code = bundle[ lastLang ].code (or '')
   * - language = lastLang (or 'js')
   */
  getJs(qid: string): JsSave | null {
    this.ensureMigrated();

    const b = this.getBundle(qid);
    if (!b) return null;

    const lang: JsLang = (b.lastLang as JsLang) || 'js';
    const code = (b[lang]?.code ?? '') as string;
    return {
      code,
      language: lang,
      format: lang === 'ts' ? 'typescript' : 'javascript',
      version: 'v2',
      updatedAt: b.updatedAt,
    };
  }

  /**
   * Save current buffer for a specific language (and mark it lastLang).
   * Keeps everything in a single v2 blob.
   */
  saveJs(qid: string, code: string, lang: JsLang = 'js') {
    this.ensureMigrated();

    const now = new Date().toISOString();
    const cur = this.getBundle(qid) || { version: 'v2', updatedAt: now } as JsBundleV2;

    const next: JsBundleV2 = {
      ...cur,
      [lang]: { ...(cur[lang] || {}), code },
      lastLang: lang,
      version: 'v2',
      updatedAt: now,
    };

    localStorage.setItem(V2_JS_BUNDLE(qid), JSON.stringify(next));
  }

  /**
   * Optional helpers if you want to manage baselines from the component.
   */
  setJsBaseline(qid: string, lang: JsLang, baseline: string) {
    this.ensureMigrated();
    const now = new Date().toISOString();
    const cur = this.getBundle(qid) || { version: 'v2', updatedAt: now } as JsBundleV2;

    const next: JsBundleV2 = {
      ...cur,
      [lang]: { code: cur[lang]?.code ?? baseline, baseline },
      version: 'v2',
      updatedAt: now,
    };
    localStorage.setItem(V2_JS_BUNDLE(qid), JSON.stringify(next));
  }

  getJsBaseline(qid: string, lang: JsLang): string | null {
    this.ensureMigrated();
    const b = this.getBundle(qid);
    return b?.[lang]?.baseline ?? null;
  }

  /** Clear everything for this question (both languages). */
  clearJs(qid: string) {
    try { localStorage.removeItem(V2_JS_BUNDLE(qid)); } catch { }
  }

  // ---------- Angular (StackBlitz via SDK) ----------
  private keyNg(qid: string) { return `${PREFIX}ng:${qid}`; }

  getNg(qid: string): NgSave | null {
    const raw = localStorage.getItem(this.keyNg(qid));
    if (!raw) return null;
    try { return JSON.parse(raw) as NgSave; } catch { return null; }
  }

  saveNg(qid: string, filesSnapshot: Record<string, string>, projectId?: string) {
    const files: Record<string, { code: string }> = {};
    for (const [path, code] of Object.entries(filesSnapshot)) files[path] = { code };
    const payload: NgSave = { files, projectId, version: 'v1', updatedAt: new Date().toISOString() };
    localStorage.setItem(this.keyNg(qid), JSON.stringify(payload));
  }

  clearNg(qid: string) { localStorage.removeItem(this.keyNg(qid)); }

  // ---------- purge / utils ----------
  /** Matches any versioned keys this service writes (all versions). */
  static isOurKey(k: string): boolean {
    // vX:code:ng:..., vX:code:js2:... (v2), vX:code:js:... (legacy), vX:code:js:baseline:...
    return /^v\d+:code:(ng|js2|js):/.test(k);
  }

  /** Remove everything created by this service (all versions). */
  static purgeAll(): void {
    try {
      const keys = Object.keys(localStorage);
      for (const k of keys) {
        if (CodeStorageService.isOurKey(k)) localStorage.removeItem(k);
      }
    } catch { }
  }

  // ---------- internals ----------

  /** Read v2 consolidated blob */
  private getBundle(qid: string): JsBundleV2 | null {
    const raw = localStorage.getItem(V2_JS_BUNDLE(qid));
    if (!raw) return null;
    try { return JSON.parse(raw) as JsBundleV2; } catch { return null; }
  }

  /** One-time migration from:
   *  - v1:code:js:<qid> (single-lang record with {code, language, ...})
   *  - v1:code:js:baseline:<qid>:js|ts ({code})
   *  - uf:lang:<qid> (preference)
   * into:
   *  - v2:code:js2:<qid>  (both langs + lastLang)
   */
  private ensureMigrated() {
    if (this.migrated) return;
    this.migrated = true;

    try {
      const keys = Object.keys(localStorage);
      // Collect question ids that have v1 JS records
      const qids = new Set<string>();
      for (const k of keys) {
        const m = k.match(/^v1:code:js:(?:baseline:)?([^:]+)/);
        if (m) qids.add(m[1]);
      }

      qids.forEach((qid) => this.migrateQuestionFromV1(qid));
    } catch {
      /* ignore */
    }
  }

  private migrateQuestionFromV1(qid: string) {
    const existingV2 = this.getBundle(qid);
    if (existingV2) return; // already migrated

    const now = new Date().toISOString();

    // 1) main v1 record (whatever last save was)
    const v1Raw = localStorage.getItem(V1_JS_RECORD(qid));
    let v1: Partial<JsSave> | null = null;
    try { v1 = v1Raw ? JSON.parse(v1Raw) : null; } catch { v1 = null; }

    // 2) baselines
    const baseJs = this.readBaseline(V1_JS_BASELINE(qid, 'js'));
    const baseTs = this.readBaseline(V1_JS_BASELINE(qid, 'ts'));

    // 3) lang preference key (external)
    const pref = (localStorage.getItem(UF_LANG_PREF(qid)) as JsLang | null) ?? undefined;

    if (!v1 && !baseJs && !baseTs && !pref) return; // nothing to migrate

    const bundle: JsBundleV2 = {
      version: 'v2',
      updatedAt: now,
      lastLang: (pref || v1?.language || 'js') as JsLang,
    };

    if (v1?.language === 'js') {
      bundle.js = { code: v1.code ?? '', baseline: baseJs ?? undefined };
      if (baseTs != null) bundle.ts = { code: bundle.ts?.code, baseline: baseTs };
    } else if (v1?.language === 'ts') {
      bundle.ts = { code: v1.code ?? '', baseline: baseTs ?? undefined };
      if (baseJs != null) bundle.js = { code: bundle.js?.code, baseline: baseJs };
    } else {
      if (baseJs != null) bundle.js = { code: baseJs, baseline: baseJs };
      if (baseTs != null) bundle.ts = { code: baseTs, baseline: baseTs };
    }

    try { localStorage.setItem(V2_JS_BUNDLE(qid), JSON.stringify(bundle)); } catch { }

    // Clean up v1 leftovers (optional but recommended)
    try { localStorage.removeItem(V1_JS_RECORD(qid)); } catch { }
    try { localStorage.removeItem(V1_JS_BASELINE(qid, 'js')); } catch { }
    try { localStorage.removeItem(V1_JS_BASELINE(qid, 'ts')); } catch { }
    try { localStorage.removeItem(UF_LANG_PREF(qid)); } catch { }
  }

  private readBaseline(key: string): string | null {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try {
      const obj = JSON.parse(raw);
      return typeof obj?.code === 'string' ? obj.code : null;
    } catch {
      return null;
    }
  }

  // ADD to CodeStorageService

  /** Get the saved code for a specific language without changing lastLang. */
  getJsForLang(qid: string, lang: JsLang): string | null {
    this.ensureMigrated();
    const b = this.getBundle(qid);
    return (b && b[lang]?.code != null) ? (b[lang]!.code as string) : null;
  }

  /** Switch lastLang without touching code buffers. */
  setLastLang(qid: string, lang: JsLang): void {
    this.ensureMigrated();
    const now = new Date().toISOString();
    const cur = this.getBundle(qid) || { version: 'v2', updatedAt: now } as JsBundleV2;

    const next: JsBundleV2 = {
      ...cur,
      lastLang: lang,
      version: 'v2',
      updatedAt: now,
    };
    localStorage.setItem((V2_JS_BUNDLE as any)(qid), JSON.stringify(next));
  }
}
