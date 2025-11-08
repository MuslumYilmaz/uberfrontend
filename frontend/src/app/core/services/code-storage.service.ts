import { Injectable } from '@angular/core';
import localForage from 'localforage';

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
  js?: { code?: string; baseline?: string; updatedAt?: string };   // CHANGED
  ts?: { code?: string; baseline?: string; updatedAt?: string };   // CHANGED
  lastLang?: JsLang;
  version: 'v2';
  updatedAt: string; // ISO
}

type WebLang = 'html' | 'css';

export interface WebBundleV2 {
  html?: { code?: string; baseline?: string; updatedAt?: string };
  css?: { code?: string; baseline?: string; updatedAt?: string };
  version: 'v2';
  updatedAt: string;
}

const DATA_VERSION = '2';

const LF_JS = localForage.createInstance({ name: 'uberfrontend', storeName: 'uf_js' });
const LF_NG = localForage.createInstance({ name: 'uberfrontend', storeName: 'uf_ng' });
const LF_WEB = localForage.createInstance({ name: 'uberfrontend', storeName: 'uf_web' });

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
const V2_WEB_BUNDLE = (qid: string) => `${PREFIX}web2:${qid}`;

/** one-time flag so we don't re-copy on every load */
const MIGRATION_FLAG_JS_IDB = 'uf:js:idb:migrated:v1';

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
    lang: JsLang = 'js',
    opts?: { force?: boolean }
  ): void {
    // Legacy wrapper: use async path (IDB-first).
    void this.saveJsAsync(qidRaw, code, lang, opts);
  }

  setJsBaseline(qidRaw: string | number, lang: JsLang, baseline: string): void {
    void this.setJsBaselineAsync(qidRaw, lang, baseline);
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
  // LEGACY sync helper: delegate to async, avoid direct LS writes.
  setLastLang(qidRaw: string | number, lang: JsLang): void {
    void this.setLastLangAsync(qidRaw, lang);
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
  resetJsToBaseline(qidRaw: string | number, lang: JsLang): void {
    // Minimal implementation: load current bundle and push baseline into code via async helpers.
    void (async () => {
      const qid = String(qidRaw);
      const cur = await this.getBundleAsync(qid);
      const baseline = cur?.[lang]?.baseline ?? '';
      if (!baseline) return;
      await this.saveJsAsync(qid, baseline, lang, { force: true });
    })();
  }

  resetJsBoth(
    qidRaw: string | number,
    starters?: { js?: string; ts?: string }
  ): void {
    void this.resetJsBothAsync(qidRaw, starters);
  }

  async resetJsBothAsync(
    qidRaw: string | number,
    starters?: { js?: string; ts?: string }
  ): Promise<void> {
    this.ensureMigrated();
    const qid = String(qidRaw);
    const now = new Date().toISOString();

    const cur = (await this.getBundleAsync(qid)) || { version: 'v2', updatedAt: now } as JsBundleV2;

    const jsBaseline = starters?.js ?? cur.js?.baseline ?? '';
    const tsBaseline = starters?.ts ?? cur.ts?.baseline ?? '';

    const next: JsBundleV2 = {
      ...cur,
      js: { code: jsBaseline, baseline: jsBaseline, updatedAt: now },
      ts: { code: tsBaseline, baseline: tsBaseline, updatedAt: now },
      version: 'v2',
      updatedAt: now,
      lastLang: cur.lastLang ?? 'js',
    };

    await this.saveBundlePrimary(qid, next);
  }


  // ---------- ASYNC (IndexedDB) JS API: non-breaking side-by-side ----------

  /** Read the v2 JS bundle from IndexedDB (falls back to localStorage if not found) */
  async getJsAsync(qidRaw: string | number): Promise<JsSave | null> {
    const qid = String(qidRaw);

    // Try IDB first
    const raw = await LF_JS.getItem<string>(V2_JS_BUNDLE(qid));
    if (raw) {
      try {
        const b = JSON.parse(raw) as JsBundleV2;
        const lang: JsLang = (b.lastLang === 'ts' || b.lastLang === 'js') ? b.lastLang : 'js';
        const code = (b[lang]?.code ?? '') as string;
        return {
          code,
          language: lang,
          format: lang === 'ts' ? 'typescript' : 'javascript',
          version: 'v2',
          updatedAt: b.updatedAt,
        };
      } catch { /* fall through */ }
    }

    // Fallback to your existing localStorage bundle (so current users still work)
    return this.getJs(qid);
  }

  /** Write v2 JS bundle to IndexedDB (primary) with localStorage as fallback */
  async saveJsAsync(
    qidRaw: string | number,
    code: string,
    lang: JsLang = 'js',
    opts?: { force?: boolean }
  ): Promise<void> {
    this.ensureMigrated();
    const qid = String(qidRaw);
    const now = new Date().toISOString();

    // Read current bundle (IDB first, then LS)
    const cur = (await this.getBundleAsync(qid)) || { version: 'v2', updatedAt: now } as JsBundleV2;

    const existing = cur[lang]?.code ?? '';
    const baseline = cur[lang]?.baseline ?? null;

    // Guard 1: don't overwrite non-empty user code with empty value (unless force)
    if (!opts?.force && (code ?? '').length === 0 && existing.trim().length > 0) {
      return;
    }

    // Guard 2: don't "revert" to baseline if user already has custom code (unless force)
    if (!opts?.force && existing.trim().length > 0 && baseline != null && code === baseline) {
      return;
    }

    const next: JsBundleV2 = {
      ...cur,
      [lang]: { ...(cur[lang] || {}), code, updatedAt: now },
      lastLang: lang,
      version: 'v2',
      updatedAt: now,
    };

    await this.saveBundlePrimary(qid, next);

  }

  /** Set baseline; write to IDB primarily, LS as fallback */
  async setJsBaselineAsync(qidRaw: string | number, lang: JsLang, baseline: string): Promise<void> {
    this.ensureMigrated();
    const qid = String(qidRaw);
    const now = new Date().toISOString();

    const cur = (await this.getBundleAsync(qid)) || { version: 'v2', updatedAt: now } as JsBundleV2;

    const next: JsBundleV2 = {
      ...cur,
      [lang]: {
        code: cur[lang]?.code ?? baseline,
        baseline,
        updatedAt: cur[lang]?.updatedAt ?? now,
      },
      version: 'v2',
      updatedAt: now,
    };

    await this.saveBundlePrimary(qid, next);

  }

  /** Strict per-language getter (IDB first, then LS) */
  async getJsForLangAsync(qidRaw: string | number, lang: JsLang): Promise<string | null> {
    const qid = String(qidRaw);
    const raw = await LF_JS.getItem<string>(V2_JS_BUNDLE(qid));
    if (raw) {
      try {
        const b = JSON.parse(raw) as JsBundleV2;
        return (b && b[lang]?.code != null) ? (b[lang]!.code as string) : null;
      } catch { /* fall through */ }
    }
    return this.getJsForLang(qid, lang);
  }

  /** Async clear: remove from IDB first, then LS */
  async clearJsAsync(qidRaw: string | number): Promise<void> {
    const qid = String(qidRaw);
    try { await LF_JS.removeItem(V2_JS_BUNDLE(qid)); } catch { /* ignore */ }
    if (hasLocalStorage()) {
      try { localStorage.removeItem(V2_JS_BUNDLE(qid)); } catch { /* ignore */ }
    }
  }

  // helper (optional but tidy)
  private async getBundleAsync(qidRaw: string | number): Promise<JsBundleV2 | null> {
    const qid = String(qidRaw);
    const raw = await LF_JS.getItem<string>(V2_JS_BUNDLE(qid));
    if (raw) { try { return JSON.parse(raw) as JsBundleV2; } catch { /* ignore */ } }
    // fallback to LS if IDB missing/invalid
    try {
      const ls = localStorage.getItem(V2_JS_BUNDLE(qid));
      return ls ? (JSON.parse(ls) as JsBundleV2) : null;
    } catch { return null; }
  }

  private async saveBundlePrimary(
    qid: string,
    bundle: JsBundleV2,
    opts?: { silent?: boolean }
  ): Promise<void> {
    const key = V2_JS_BUNDLE(qid);

    try {
      // Primary: IndexedDB
      await LF_JS.setItem(key, JSON.stringify(bundle));
      return;
    } catch {
      // Fallback: localStorage (only if available)
      if (!hasLocalStorage()) {
        if (!opts?.silent) {
          // optionally log in dev
        }
        return;
      }
      try {
        localStorage.setItem(key, JSON.stringify(bundle));
      } catch {
        // Out of quota both in IDB/LS → nothing else to do.
      }
    }
  }

  async initJsAsync(
    qidRaw: string | number,
    lang: 'js' | 'ts',
    starter: string
  ): Promise<{ initial: string; restored: boolean }> {
    const qid = String(qidRaw);
    const now = new Date().toISOString();

    const existing = await this.getBundleAsync(qid);
    if (existing) {
      const cur: JsBundleV2 = { ...existing };

      // Seed baseline if missing (do NOT write starter as user code)
      if (!cur[lang]?.baseline) {
        cur[lang] = {
          ...(cur[lang] || {}),
          baseline: starter,
          code: cur[lang]?.code ?? '',
        };
      }

      const saved = cur[lang]?.code ?? '';
      const base = cur[lang]?.baseline ?? starter;
      const hasUser = saved.trim().length > 0;

      const initial = hasUser ? saved : starter;
      const restored = hasUser && saved.trim() !== base.trim();

      cur.lastLang = lang;
      cur.version = 'v2';
      cur.updatedAt = now;

      await this.saveBundlePrimary(qid, cur, { silent: true });

      return { initial, restored };
    }

    // First-time: create a fresh bundle with baseline only.
    const fresh: JsBundleV2 = {
      version: 'v2',
      updatedAt: now,
      lastLang: lang,
      [lang]: { baseline: starter, code: '' },
    };

    await this.saveBundlePrimary(qid, fresh, { silent: true });

    return { initial: starter, restored: false };
  }

  // NEW: read last selected language (IDB first, then LS)
  async getLastLang(qidRaw: string | number): Promise<JsLang | null> {
    const b = await this.getBundleAsync(qidRaw);
    const v = b?.lastLang;
    return (v === 'js' || v === 'ts') ? v : null;
  }

  // NEW: tiny meta for deciding preferred lang on hydrate
  async getJsMetaAsync(qidRaw: string | number): Promise<{
    js?: { updatedAt?: number; hasCode: boolean };
    ts?: { updatedAt?: number; hasCode: boolean };
  }> {
    const b = await this.getBundleAsync(qidRaw);
    const toMs = (s?: string) => s ? Date.parse(s) : undefined;
    return {
      js: b?.js ? { updatedAt: toMs(b.js.updatedAt), hasCode: !!(b.js.code && b.js.code.trim()) } : undefined,
      ts: b?.ts ? { updatedAt: toMs(b.ts.updatedAt), hasCode: !!(b.ts.code && b.ts.code.trim()) } : undefined,
    };
  }

  async setLastLangAsync(qidRaw: string | number, lang: JsLang): Promise<void> {
    const qid = String(qidRaw);
    const now = new Date().toISOString();

    // Reuse existing bundle (IDB first, then LS)
    const cur = (await this.getBundleAsync(qid)) || { version: 'v2', updatedAt: now } as JsBundleV2;

    const next: JsBundleV2 = {
      ...cur,
      lastLang: lang,
      version: 'v2',
      updatedAt: now,
    };

    await this.saveBundlePrimary(qid, next, { silent: true });
  }

  private async getWebBundleAsync(qidRaw: string | number): Promise<WebBundleV2 | null> {
    const qid = String(qidRaw);

    // IDB first
    const raw = await LF_WEB.getItem<string>(V2_WEB_BUNDLE(qid));
    if (raw) {
      try { return JSON.parse(raw) as WebBundleV2; } catch { /* ignore */ }
    }

    // Fallback: localStorage (legacy / migration)
    if (hasLocalStorage()) {
      try {
        const ls = localStorage.getItem(V2_WEB_BUNDLE(qid));
        return ls ? (JSON.parse(ls) as WebBundleV2) : null;
      } catch { /* ignore */ }
    }

    return null;
  }

  private async saveWebBundlePrimary(
    qid: string,
    bundle: WebBundleV2,
    opts?: { silent?: boolean }
  ): Promise<void> {
    const key = V2_WEB_BUNDLE(qid);

    try {
      await LF_WEB.setItem(key, JSON.stringify(bundle));
      return;
    } catch {
      if (!hasLocalStorage()) {
        if (!opts?.silent) {
          // optionally log in dev
        }
        return;
      }
      try {
        localStorage.setItem(key, JSON.stringify(bundle));
      } catch {
        // both stores failed; nothing else to do
      }
    }
  }

  /**
 * One-time migration: copy all v2 JS bundles from localStorage into IndexedDB.
 * Safe to call on startup; it no-ops after the first successful run.
 */
  async migrateAllJsToIndexedDbOnce(): Promise<void> {
    if (!hasLocalStorage()) return;

    // Already migrated? bail.
    if (localStorage.getItem(MIGRATION_FLAG_JS_IDB) === '1') {
      return;
    }

    try {
      const keys = Object.keys(localStorage);

      for (const k of keys) {
        // only care about our consolidated v2 JS bundles
        if (!k.startsWith('v2:code:js2:')) continue;

        const raw = localStorage.getItem(k);
        if (!raw) continue;

        try {
          await LF_JS.setItem(k, raw);   // mirror LS -> IDB as-is
        } catch {
          // ignore per-key failure; continue others
        }
      }

      // mark as done (even if a few keys failed; worst case they'll sync on next save)
      localStorage.setItem(MIGRATION_FLAG_JS_IDB, '1');
    } catch {
      // swallow: if this explodes, normal lazy-writes will still populate IDB over time
    }
  }

  async initWebAsync(
    qidRaw: string | number,
    starters: { html: string; css: string }
  ): Promise<{ html: string; css: string; restored: boolean }> {
    const qid = String(qidRaw);
    const now = new Date().toISOString();

    let bundle = await this.getWebBundleAsync(qid);

    // First-time: create baseline-only bundle
    if (!bundle) {
      bundle = {
        version: 'v2',
        updatedAt: now,
        html: { baseline: starters.html, code: '' },
        css: { baseline: starters.css, code: '' },
      };
      await this.saveWebBundlePrimary(qid, bundle, { silent: true });
      return { html: starters.html, css: starters.css, restored: false };
    }

    // Ensure structure
    if (!bundle.html) bundle.html = {};
    if (!bundle.css) bundle.css = {};

    // Seed missing baselines without overwriting code
    if (!bundle.html.baseline) bundle.html.baseline = starters.html;
    if (!bundle.css.baseline) bundle.css.baseline = starters.css;

    const rawHtml = bundle.html.code ?? '';
    const rawCss = bundle.css.code ?? '';

    const htmlBase = bundle.html.baseline || starters.html;
    const cssBase = bundle.css.baseline || starters.css;

    const htmlHasUser = rawHtml.trim().length > 0;
    const cssHasUser = rawCss.trim().length > 0;

    const htmlInitial = htmlHasUser ? rawHtml : htmlBase;
    const cssInitial = cssHasUser ? rawCss : cssBase;

    const restored =
      (htmlHasUser && rawHtml.trim() !== htmlBase.trim()) ||
      (cssHasUser && rawCss.trim() !== cssBase.trim());

    bundle.updatedAt = now;
    await this.saveWebBundlePrimary(qid, bundle, { silent: true });

    return { html: htmlInitial, css: cssInitial, restored };
  }

  async saveWebAsync(
    qidRaw: string | number,
    which: WebLang,
    code: string,
    opts?: { force?: boolean }
  ): Promise<void> {
    const qid = String(qidRaw);
    const now = new Date().toISOString();

    const cur = (await this.getWebBundleAsync(qid)) || {
      version: 'v2',
      updatedAt: now,
      html: {},
      css: {},
    } as WebBundleV2;

    const part = cur[which] || {};
    const existing = part.code ?? '';
    const baseline = part.baseline ?? null;

    // Guard 1: don't clobber non-empty user code with empty string (unless forced)
    if (!opts?.force && (code ?? '').length === 0 && existing.trim().length > 0) {
      return;
    }

    // Guard 2: don't silently revert to baseline when user already has custom code
    if (!opts?.force && existing.trim().length > 0 && baseline != null && code === baseline) {
      return;
    }

    cur[which] = { ...part, code, updatedAt: now };
    cur.updatedAt = now;

    await this.saveWebBundlePrimary(qid, cur);
  }

  async resetWebBothAsync(
    qidRaw: string | number,
    starters?: { html?: string; css?: string }
  ): Promise<void> {
    const qid = String(qidRaw);
    const now = new Date().toISOString();
    const cur = (await this.getWebBundleAsync(qid)) || { version: 'v2', updatedAt: now } as WebBundleV2;

    const htmlBaseline = starters?.html ?? cur.html?.baseline ?? '';
    const cssBaseline = starters?.css ?? cur.css?.baseline ?? '';

    const next: WebBundleV2 = {
      ...cur,
      html: { code: htmlBaseline, baseline: htmlBaseline, updatedAt: now },
      css: { code: cssBaseline, baseline: cssBaseline, updatedAt: now },
      version: 'v2',
      updatedAt: now,
    };

    await this.saveWebBundlePrimary(qid, next);
  }

  async clearWebAsync(qidRaw: string | number): Promise<void> {
    const qid = String(qidRaw);
    try { await LF_WEB.removeItem(V2_WEB_BUNDLE(qid)); } catch { /* ignore */ }
    if (hasLocalStorage()) {
      try { localStorage.removeItem(V2_WEB_BUNDLE(qid)); } catch { /* ignore */ }
    }
  }
}
