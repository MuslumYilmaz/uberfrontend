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

const DATA_VERSION = '2';
const BASE = 'code:';
const PREFIX = `v${DATA_VERSION}:${BASE}`; // e.g. v2:code:

/** v1 key helpers (legacy) */
const V1_PREFIX = 'v1:code:';
const V1_JS_RECORD = (qid: string) => `${V1_PREFIX}js:${qid}`;
const V1_JS_BASELINE = (qid: string, lang: JsLang) => `${V1_PREFIX}js:baseline:${qid}:${lang}`;

/** Old external pref key */
const UF_LANG_PREF = (qid: string) => `uf:lang:${qid}`;

/** v2 consolidated key (one per question) */
const V2_JS_BUNDLE = (qid: string) => `${PREFIX}js2:${qid}`;

/** Guard: is localStorage usable? (some browsers/iframes can throw) */
function hasLocalStorage(): boolean {
  try {
    const k = '__ls_probe__';
    localStorage.setItem(k, '1');
    localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

@Injectable({ providedIn: 'root' })
export class CodeStorageService {
  private migrated = false;

  // ---------- PUBLIC: JS (consolidated) ----------

  getJs(qidRaw: string | number): JsSave | null {
    this.ensureMigrated();
    const qid = String(qidRaw);
    const b = this.getBundle(qid);
    if (!b) return null;
    const lang: JsLang = (b.lastLang === 'ts' || b.lastLang === 'js') ? b.lastLang : 'js';
    const code = (b[lang]?.code ?? '') as string;
    return {
      code,
      language: lang,
      format: lang === 'ts' ? 'typescript' : 'javascript',
      version: 'v2',
      updatedAt: b.updatedAt,
    };
  }

  saveJs(
    qidRaw: string | number,
    code: string,
    lang: 'js' | 'ts' = 'js',
    opts?: { force?: boolean } // ← allow bypass for "Reset to default"
  ): void {
    this.ensureMigrated();
    if (!hasLocalStorage()) return;

    const qid = String(qidRaw);
    const now = new Date().toISOString();
    const cur = this.getBundle(qid) || { version: 'v2', updatedAt: now } as JsBundleV2;

    const existing = cur[lang]?.code ?? '';
    const baseline = cur[lang]?.baseline ?? null;

    // 🚫 Guard 1: prevent accidental empty init overwriting valid user code
    if (!opts?.force && (code ?? '').length === 0 && existing.trim().length > 0) {
      return;
    }

    // 🚫 Guard 2: prevent re-writing the baseline if we already have user code
    if (!opts?.force && existing.trim().length > 0 && baseline != null && code === baseline) {
      return;
    }

    // ✅ Apply update
    const next: JsBundleV2 = {
      ...cur,
      [lang]: { ...(cur[lang] || {}), code },
      lastLang: lang,
      version: 'v2',
      updatedAt: now,
    };

    try {
      localStorage.setItem(V2_JS_BUNDLE(qid), JSON.stringify(next));
    } catch { }
  }

  setJsBaseline(qidRaw: string | number, lang: JsLang, baseline: string): void {
    this.ensureMigrated();
    if (!hasLocalStorage()) return;
    const qid = String(qidRaw);

    const now = new Date().toISOString();
    const cur = this.getBundle(qid) || { version: 'v2', updatedAt: now } as JsBundleV2;

    const next: JsBundleV2 = {
      ...cur,
      [lang]: { code: cur[lang]?.code ?? baseline, baseline },
      version: 'v2',
      updatedAt: now,
    };

    try {
      localStorage.setItem(V2_JS_BUNDLE(qid), JSON.stringify(next));
    } catch { }
  }

  getJsBaseline(qidRaw: string | number, lang: JsLang): string | null {
    this.ensureMigrated();
    const qid = String(qidRaw);
    const b = this.getBundle(qid);
    return b?.[lang]?.baseline ?? null;
  }

  /** Strict per-language getter (does not mutate lastLang) */
  getJsForLang(qidRaw: string | number, lang: JsLang): string | null {
    this.ensureMigrated();
    const qid = String(qidRaw);
    const b = this.getBundle(qid);
    return (b && b[lang]?.code != null) ? (b[lang]!.code as string) : null;
  }

  /** Switch lastLang without touching code buffers. */
  setLastLang(qidRaw: string | number, lang: JsLang): void {
    this.ensureMigrated();
    if (!hasLocalStorage()) return;
    const qid = String(qidRaw);

    const now = new Date().toISOString();
    const cur = this.getBundle(qid) || { version: 'v2', updatedAt: now } as JsBundleV2;

    const next: JsBundleV2 = { ...cur, lastLang: lang, version: 'v2', updatedAt: now };
    try {
      localStorage.setItem(V2_JS_BUNDLE(qid), JSON.stringify(next));
    } catch { }
  }

  /** Clear everything for this question (both languages). */
  clearJs(qidRaw: string | number): void {
    if (!hasLocalStorage()) return;
    const qid = String(qidRaw);
    try { localStorage.removeItem(V2_JS_BUNDLE(qid)); } catch { }
  }

  // ---------- PUBLIC: Angular (StackBlitz snapshot) ----------

  private keyNg(qid: string) { return `${PREFIX}ng:${qid}`; }

  getNg(qidRaw: string | number): NgSave | null {
    if (!hasLocalStorage()) return null;
    const qid = String(qidRaw);
    const raw = localStorage.getItem(this.keyNg(qid));
    if (!raw) return null;
    try { return JSON.parse(raw) as NgSave; } catch { return null; }
  }

  saveNg(qidRaw: string | number, filesSnapshot: Record<string, string>, projectId?: string): void {
    if (!hasLocalStorage()) return;
    const qid = String(qidRaw);
    const files: Record<string, { code: string }> = {};
    for (const [path, code] of Object.entries(filesSnapshot)) files[path] = { code };
    const payload: NgSave = { files, projectId, version: 'v1', updatedAt: new Date().toISOString() };
    try {
      localStorage.setItem(this.keyNg(qid), JSON.stringify(payload));
    } catch { }
  }

  clearNg(qidRaw: string | number): void {
    if (!hasLocalStorage()) return;
    const qid = String(qidRaw);
    try { localStorage.removeItem(this.keyNg(qid)); } catch { }
  }

  // ---------- purge / utils ----------

  static isOurKey(k: string): boolean {
    return /^v\d+:code:(ng|js2|js):/.test(k);
  }

  static purgeAll(): void {
    if (!hasLocalStorage()) return;
    try {
      const keys = Object.keys(localStorage);
      for (const k of keys) if (CodeStorageService.isOurKey(k)) localStorage.removeItem(k);
    } catch { }
  }

  // ---------- internals ----------

  private getBundle(qid: string): JsBundleV2 | null {
    if (!hasLocalStorage()) return null;
    const raw = localStorage.getItem(V2_JS_BUNDLE(qid));
    if (!raw) return null;
    try { return JSON.parse(raw) as JsBundleV2; } catch { return null; }
  }

  /** One-time migration from v1 keys to v2 (no overwrite if v2 exists) */
  private ensureMigrated(): void {
    if (this.migrated) return;
    this.migrated = true;
    if (!hasLocalStorage()) return;

    try {
      const keys = Object.keys(localStorage);
      const qids = new Set<string>();

      // capture both v1 record and baseline forms
      for (const k of keys) {
        // v1:code:js:<qid> or v1:code:js:baseline:<qid>:<lang>
        const rec = k.match(/^v1:code:js:([^:]+)$/);
        if (rec) { qids.add(rec[1]); continue; }
        const base = k.match(/^v1:code:js:baseline:([^:]+):(js|ts)$/);
        if (base) { qids.add(base[1]); continue; }
        const pref = k.match(/^uf:lang:([^:]+)$/);
        if (pref) { qids.add(pref[1]); continue; }
      }

      qids.forEach((qid) => this.migrateQuestionFromV1(qid));
    } catch { /* ignore */ }
  }

  private migrateQuestionFromV1(qid: string): void {
    if (this.getBundle(qid)) return; // already migrated — never clobber

    const now = new Date().toISOString();

    // 1) main v1 record
    let v1: Partial<JsSave> | null = null;
    try {
      const raw = localStorage.getItem(V1_JS_RECORD(qid));
      v1 = raw ? JSON.parse(raw) : null;
    } catch { v1 = null; }

    // 2) baselines
    const baseJs = this.readBaseline(V1_JS_BASELINE(qid, 'js'));
    const baseTs = this.readBaseline(V1_JS_BASELINE(qid, 'ts'));

    // 3) lang preference
    const prefRaw = localStorage.getItem(UF_LANG_PREF(qid));
    const pref = (prefRaw === 'ts' || prefRaw === 'js') ? (prefRaw as JsLang) : undefined;

    if (!v1 && !baseJs && !baseTs && !pref) return; // nothing to migrate

    const bundle: JsBundleV2 = { version: 'v2', updatedAt: now, lastLang: (pref || v1?.language || 'js') as JsLang };

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

    // optional cleanup
    try { localStorage.removeItem(V1_JS_RECORD(qid)); } catch { }
    try { localStorage.removeItem(V1_JS_BASELINE(qid, 'js')); } catch { }
    try { localStorage.removeItem(V1_JS_BASELINE(qid, 'ts')); } catch { }
    try { localStorage.removeItem(UF_LANG_PREF(qid)); } catch { }
  }

  private readBaseline(key: string): string | null {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const obj = JSON.parse(raw);
      return typeof obj?.code === 'string' ? obj.code : null;
    } catch { return null; }
  }

  initJs(qidRaw: string | number, lang: 'js' | 'ts', starter: string) {
    this.ensureMigrated();
    if (!hasLocalStorage()) {
      return { initial: starter, restored: false };
    }
    const qid = String(qidRaw);
    const now = new Date().toISOString();
    const cur = this.getBundle(qid) || { version: 'v2', updatedAt: now } as JsBundleV2;

    // Seed baseline once (no code write)
    const baseline = cur[lang]?.baseline ?? null;
    if (baseline == null) {
      cur[lang] = { ...(cur[lang] || {}), baseline: starter, code: cur[lang]?.code ?? '' };
    }

    // Decide what to show
    const saved = cur[lang]?.code ?? '';
    const hasUser = saved.trim().length > 0;
    const initial = hasUser ? saved : starter;
    const restored = hasUser && saved.trim() !== (cur[lang]?.baseline ?? starter).trim();

    // write back only if we changed baseline or lastLang; never write starter as code
    const next: JsBundleV2 = { ...cur, lastLang: lang, version: 'v2', updatedAt: now };
    try {
      localStorage.setItem(V2_JS_BUNDLE(qid), JSON.stringify(next));
    } catch { }

    return { initial, restored };
  }

  // in CodeStorageService
  resetJsToBaseline(qidRaw: string | number, lang: 'js' | 'ts'): void {
    this.ensureMigrated();
    if (!hasLocalStorage()) return;
    const qid = String(qidRaw);

    const now = new Date().toISOString();
    const cur = this.getBundle(qid) || { version: 'v2', updatedAt: now } as JsBundleV2;

    const baseline = cur[lang]?.baseline ?? '';
    // overwrite code with baseline explicitly (bypass normal guards)
    const next: JsBundleV2 = {
      ...cur,
      [lang]: { ...(cur[lang] || {}), code: baseline, baseline },
      lastLang: lang,
      version: 'v2',
      updatedAt: now,
    };

    try { localStorage.setItem(V2_JS_BUNDLE(qid), JSON.stringify(next)); } catch { }
  }

  resetJsBoth(
    qidRaw: string | number,
    starters?: { js?: string; ts?: string } // optional: pass to override/update baselines too
  ): void {
    this.ensureMigrated();
    if (!hasLocalStorage()) return;

    const qid = String(qidRaw);
    const now = new Date().toISOString();
    const cur = this.getBundle(qid) || { version: 'v2', updatedAt: now } as JsBundleV2;

    const jsBaseline = starters?.js ?? cur.js?.baseline ?? '';
    const tsBaseline = starters?.ts ?? cur.ts?.baseline ?? '';

    const next: JsBundleV2 = {
      ...cur,
      js: { code: jsBaseline, baseline: jsBaseline },
      ts: { code: tsBaseline, baseline: tsBaseline },
      version: 'v2',
      updatedAt: now,
      // keep current lastLang so the same tab remains active after reset
      lastLang: cur.lastLang ?? 'js',
    };

    try { localStorage.setItem(V2_JS_BUNDLE(qid), JSON.stringify(next)); } catch { }
  }
}
