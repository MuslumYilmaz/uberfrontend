import { Injectable } from '@angular/core';
import localForage from 'localforage';

type JsLang = 'js' | 'ts';
type CodeFormat = 'javascript' | 'typescript';

/** A JS draft as getJsAsync() returns it. */
export interface JsSave {
  code: string;
  language: JsLang;
  format: CodeFormat;
  version: 'v1' | 'v2';
  updatedAt: string; // ISO
}

/** New consolidated per-question blob */
export interface JsBundleV2 {
  js?: { code?: string; baseline?: string; updatedAt?: string; userCleared?: boolean };
  ts?: { code?: string; baseline?: string; updatedAt?: string; userCleared?: boolean };
  lastLang?: JsLang;
  version: 'v2';
  updatedAt: string; // ISO
}

type WebLang = 'html' | 'css';
type LocalForageInstance = ReturnType<typeof localForage.createInstance>;

export interface WebBundleV2 {
  html?: { code?: string; baseline?: string; updatedAt?: string; userCleared?: boolean };
  css?: { code?: string; baseline?: string; updatedAt?: string; userCleared?: boolean };
  version: 'v2';
  updatedAt: string;
}

type FrameworkTech = 'angular' | 'react' | 'vue';

interface FrameworkFileState {
  code?: string;
  baseline?: string;
  updatedAt?: string;
  userCleared?: boolean;
}

// Legacy baseline-only records also use code: ''. Only an explicit edit can
// distinguish a deliberately blank draft from a workspace that was never edited.
function hasSavedCode(state?: { code?: string; userCleared?: boolean }): boolean {
  return state?.userCleared === true || !!state?.code?.trim();
}

interface FrameworkBundleV2 {
  files: Record<string, FrameworkFileState>;
  entryFile?: string;
  version: 'v2';
  updatedAt: string; // ISO
}

const DATA_VERSION = '2';
const IS_BROWSER_ENV = typeof window !== 'undefined' && typeof document !== 'undefined';

let lfJs: LocalForageInstance | null = null;
let lfNg: LocalForageInstance | null = null;
let lfWeb: LocalForageInstance | null = null;

function getJsStore(): LocalForageInstance | null {
  if (!IS_BROWSER_ENV) return null;
  if (!lfJs) lfJs = localForage.createInstance({ name: 'frontendatlas', storeName: 'fa_js' });
  return lfJs;
}
function getNgStore(): LocalForageInstance | null {
  if (!IS_BROWSER_ENV) return null;
  if (!lfNg) lfNg = localForage.createInstance({ name: 'frontendatlas', storeName: 'fa_ng' });
  return lfNg;
}
function getWebStore(): LocalForageInstance | null {
  if (!IS_BROWSER_ENV) return null;
  if (!lfWeb) lfWeb = localForage.createInstance({ name: 'frontendatlas', storeName: 'fa_web' });
  return lfWeb;
}

const BASE = 'code:';
const PREFIX = `v${DATA_VERSION}:${BASE}`; // e.g. v2:code:

/** v2 consolidated key (one per question) */
const V2_JS_BUNDLE = (qid: string) => `${PREFIX}js2:${qid}`;
const V2_WEB_BUNDLE = (qid: string) => `${PREFIX}web2:${qid}`;
const V2_FW_BUNDLE = (tech: FrameworkTech, qid: string) => `${PREFIX}fw2:${tech}:${qid}`;

@Injectable({ providedIn: 'root' })
export class CodeStorageService {
  private readonly MAX_BUNDLE_CACHE = 50;
  private readonly bundleOpQueue = new Map<string, Promise<void>>();
  private readonly jsBundleCache = new Map<string, JsBundleV2>();
  private readonly webBundleCache = new Map<string, WebBundleV2>();
  private readonly fwBundleCache = new Map<string, FrameworkBundleV2>();

  private enqueueBundleOp<T>(key: string, op: () => Promise<T>): Promise<T> {
    const prev = this.bundleOpQueue.get(key) ?? Promise.resolve();
    const next = prev.catch(() => {}).then(op);
    this.bundleOpQueue.set(key, next.then(() => undefined, () => undefined));
    return next;
  }

  private cacheGet<V>(cache: Map<string, V>, key: string): V | null {
    const v = cache.get(key);
    if (v === undefined) return null;
    cache.delete(key);
    cache.set(key, v);
    return v;
  }

  private cacheSet<V>(cache: Map<string, V>, key: string, value: V): void {
    if (cache.has(key)) cache.delete(key);
    cache.set(key, value);
    if (cache.size > this.MAX_BUNDLE_CACHE) {
      const oldest = cache.keys().next().value as string | undefined;
      if (oldest) cache.delete(oldest);
    }
  }

  // ---------- PUBLIC: JS (IndexedDB) ----------

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
    const qid = String(qidRaw);
    const key = V2_JS_BUNDLE(qid);
    await this.enqueueBundleOp(key, async () => {
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
    });
  }


  // ---------- ASYNC (IndexedDB) JS API: non-breaking side-by-side ----------

  /** Read the v2 JS bundle from IndexedDB. */
  async getJsAsync(qidRaw: string | number): Promise<JsSave | null> {
    const qid = String(qidRaw);

    const b = await this.getBundleAsync(qid);
    if (b) {
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

    return null;
  }

  /** Write the v2 JS bundle to IndexedDB. */
  async saveJsAsync(
    qidRaw: string | number,
    code: string,
    lang: JsLang = 'js',
    opts?: { force?: boolean; allowEmpty?: boolean }
  ): Promise<void> {
    const qid = String(qidRaw);
    const key = V2_JS_BUNDLE(qid);
    await this.enqueueBundleOp(key, async () => {
      const now = new Date().toISOString();

      const cur = (await this.getBundleAsync(qid)) || { version: 'v2', updatedAt: now } as JsBundleV2;

      const existing = cur[lang]?.code ?? '';
      const baseline = cur[lang]?.baseline ?? null;

      // Guard 1: don't overwrite non-empty user code with empty value (unless forced or user-allowed)
      if (!opts?.force && !opts?.allowEmpty && (code ?? '').length === 0 && existing.trim().length > 0) {
        return;
      }

      // Guard 2: a programmatic write must not revert diverged user code to the baseline.
      // Forced or user-allowed writes carry what the user typed, so they always win,
      // including when the user edits their way back to the exact starter.
      if (!opts?.force && !opts?.allowEmpty && existing.trim().length > 0 && baseline != null && code === baseline) {
        return;
      }

      const next: JsBundleV2 = {
        ...cur,
        [lang]: {
          ...(cur[lang] || {}), code, updatedAt: now,
          userCleared: !code.trim() && !!(opts?.allowEmpty || opts?.force || cur[lang]?.userCleared),
        },
        lastLang: lang,
        version: 'v2',
        updatedAt: now,
      };

      await this.saveBundlePrimary(qid, next);
    });
  }

  /** Set baseline; write to IDB primarily, LS as fallback */
  async setJsBaselineAsync(qidRaw: string | number, lang: JsLang, baseline: string): Promise<void> {
    const qid = String(qidRaw);
    const key = V2_JS_BUNDLE(qid);
    await this.enqueueBundleOp(key, async () => {
      const now = new Date().toISOString();

      const cur = (await this.getBundleAsync(qid)) || { version: 'v2', updatedAt: now } as JsBundleV2;
      const prev = cur[lang] || {};
      const prevCode = typeof prev.code === 'string' ? prev.code : '';
      const prevBaseline = typeof prev.baseline === 'string' ? prev.baseline : '';
      const hasPrevCode = hasSavedCode(prev);
      const codeWasPreviousBaseline =
        hasPrevCode &&
        prevBaseline.trim().length > 0 &&
        prevCode.trim() === prevBaseline.trim();
      const nextCode = (!hasPrevCode || codeWasPreviousBaseline) ? '' : prevCode;

      const next: JsBundleV2 = {
        ...cur,
        [lang]: {
          code: nextCode,
          baseline,
          updatedAt: prev.updatedAt ?? now,
          userCleared: prev.userCleared === true && !codeWasPreviousBaseline,
        },
        version: 'v2',
        updatedAt: now,
      };

      await this.saveBundlePrimary(qid, next);
    });

  }

  /** Strict per-language getter (does not mutate lastLang). */
  async getJsForLangAsync(qidRaw: string | number, lang: JsLang): Promise<string | null> {
    const qid = String(qidRaw);
    const b = await this.getBundleAsync(qid);
    return b ? ((b[lang]?.code ?? null) as string | null) : null;
  }

  /** Async clear: remove the bundle from IndexedDB. */
  async clearJsAsync(qidRaw: string | number): Promise<void> {
    const qid = String(qidRaw);
    const key = V2_JS_BUNDLE(qid);
    await this.enqueueBundleOp(key, async () => {
      this.jsBundleCache.delete(key);
      const store = getJsStore();
      if (store) {
        try { await store.removeItem(key); } catch { /* ignore */ }
      }
    });
  }

  // helper (optional but tidy)
  private async getBundleAsync(qidRaw: string | number): Promise<JsBundleV2 | null> {
    const qid = String(qidRaw);
    const key = V2_JS_BUNDLE(qid);
    const cached = this.cacheGet(this.jsBundleCache, key);
    if (cached) return cached;

    const store = getJsStore();
    const raw = store ? await store.getItem<string>(key) : null;
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as JsBundleV2;
        this.cacheSet(this.jsBundleCache, key, parsed);
        return parsed;
      } catch { /* ignore */ }
    }
    return null;
  }

  private async saveBundlePrimary(
    qid: string,
    bundle: JsBundleV2,
    opts?: { silent?: boolean }
  ): Promise<void> {
    const key = V2_JS_BUNDLE(qid);
    const payload = JSON.stringify(bundle);

    const store = getJsStore();
    if (store) {
      try {
        // Primary: IndexedDB
        await store.setItem(key, payload);
        this.cacheSet(this.jsBundleCache, key, bundle);
        return;
      } catch {
        // Out of quota or a blocked store: nothing else to do.
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
      const hasUser = hasSavedCode(cur[lang]);

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
      js: b?.js ? { updatedAt: toMs(b.js.updatedAt), hasCode: hasSavedCode(b.js) } : undefined,
      ts: b?.ts ? { updatedAt: toMs(b.ts.updatedAt), hasCode: hasSavedCode(b.ts) } : undefined,
    };
  }

  /** Return per-lang code/baseline + a "dirty" flag (code differs from baseline) */
  async getJsLangStateAsync(
    qidRaw: string | number,
    lang: JsLang
  ): Promise<{ code: string; baseline: string; dirty: boolean; hasUserCode: boolean }> {
    const b = await this.getBundleAsync(qidRaw);
    const code = (b?.[lang]?.code ?? '') as string;
    const baseline = (b?.[lang]?.baseline ?? '') as string;
    const codeTrim = code.trim();
    const baseTrim = baseline.trim();
    const hasUserCode = hasSavedCode(b?.[lang]);
    const dirty = hasUserCode && codeTrim !== baseTrim;
    return { code, baseline, dirty, hasUserCode };
  }

  async setLastLangAsync(qidRaw: string | number, lang: JsLang): Promise<void> {
    const qid = String(qidRaw);
    const key = V2_JS_BUNDLE(qid);
    await this.enqueueBundleOp(key, async () => {
      const now = new Date().toISOString();

      const cur = (await this.getBundleAsync(qid)) || { version: 'v2', updatedAt: now } as JsBundleV2;

      const next: JsBundleV2 = {
        ...cur,
        lastLang: lang,
        version: 'v2',
        updatedAt: now,
      };

      await this.saveBundlePrimary(qid, next, { silent: true });
    });
  }

  private async getWebBundleAsync(qidRaw: string | number): Promise<WebBundleV2 | null> {
    const qid = String(qidRaw);
    const key = V2_WEB_BUNDLE(qid);
    const cached = this.cacheGet(this.webBundleCache, key);
    if (cached) return cached;

    // IDB first
    const store = getWebStore();
    const raw = store ? await store.getItem<string>(key) : null;
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as WebBundleV2;
        this.cacheSet(this.webBundleCache, key, parsed);
        return parsed;
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
    const payload = JSON.stringify(bundle);

    const store = getWebStore();
    if (store) {
      try {
        await store.setItem(key, payload);
        this.cacheSet(this.webBundleCache, key, bundle);
        return;
      } catch {
        // Out of quota or a blocked store: nothing else to do.
      }
    }
  }

  async initWebAsync(
    qidRaw: string | number,
    starters: { html: string; css: string }
  ): Promise<{ html: string; css: string; restored: boolean }> {
    const qid = String(qidRaw);
    const key = V2_WEB_BUNDLE(qid);
    return this.enqueueBundleOp(key, async () => {
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

      const htmlHasUser = hasSavedCode(bundle.html);
      const cssHasUser = hasSavedCode(bundle.css);

      const htmlInitial = htmlHasUser ? rawHtml : htmlBase;
      const cssInitial = cssHasUser ? rawCss : cssBase;

      const restored =
        (htmlHasUser && rawHtml.trim() !== htmlBase.trim()) ||
        (cssHasUser && rawCss.trim() !== cssBase.trim());

      bundle.updatedAt = now;
      await this.saveWebBundlePrimary(qid, bundle, { silent: true });

      return { html: htmlInitial, css: cssInitial, restored };
    });
  }

  async saveWebAsync(
    qidRaw: string | number,
    which: WebLang,
    code: string,
    opts?: { force?: boolean; allowEmpty?: boolean }
  ): Promise<void> {
    const qid = String(qidRaw);
    const key = V2_WEB_BUNDLE(qid);
    await this.enqueueBundleOp(key, async () => {
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

      // Guard 1: don't clobber non-empty user code with empty string (unless forced/user-allowed)
      if (!opts?.force && !opts?.allowEmpty && (code ?? '').length === 0 && existing.trim().length > 0) {
        return;
      }

      // Guard 2: a programmatic write must not revert diverged user code to the baseline;
      // forced or user-allowed writes always win (see saveJsAsync).
      if (!opts?.force && !opts?.allowEmpty && existing.trim().length > 0 && baseline != null && code === baseline) {
        return;
      }

      cur[which] = {
        ...part, code, updatedAt: now,
        userCleared: !code.trim() && !!(opts?.allowEmpty || opts?.force || part.userCleared),
      };
      cur.updatedAt = now;

      await this.saveWebBundlePrimary(qid, cur);
    });
  }

  async resetWebBothAsync(
    qidRaw: string | number,
    starters?: { html?: string; css?: string }
  ): Promise<void> {
    const qid = String(qidRaw);
    const key = V2_WEB_BUNDLE(qid);
    await this.enqueueBundleOp(key, async () => {
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
    });
  }

  async clearWebAsync(qidRaw: string | number): Promise<void> {
    const qid = String(qidRaw);
    const key = V2_WEB_BUNDLE(qid);
    await this.enqueueBundleOp(key, async () => {
      this.webBundleCache.delete(key);
      const store = getWebStore();
      if (store) {
        try { await store.removeItem(key); } catch { /* ignore */ }
      }
    });
  }

  private async getFrameworkBundleAsync(
    tech: FrameworkTech,
    qidRaw: string | number
  ): Promise<FrameworkBundleV2 | null> {
    const qid = String(qidRaw);
    const key = V2_FW_BUNDLE(tech, qid);
    const cached = this.cacheGet(this.fwBundleCache, key);
    if (cached) return cached;

    // IDB first
    const store = getNgStore();
    if (store) {
      try {
        const raw = await store.getItem<string>(key);
        if (raw) {
          const parsed = JSON.parse(raw) as FrameworkBundleV2;
          this.cacheSet(this.fwBundleCache, key, parsed);
          return parsed;
        }
      } catch { /* ignore */ }
    }

    return null;
  }

  private async saveFrameworkBundlePrimary(
    tech: FrameworkTech,
    qidRaw: string | number,
    bundle: FrameworkBundleV2,
    opts?: { silent?: boolean }
  ): Promise<void> {
    const qid = String(qidRaw);
    const key = V2_FW_BUNDLE(tech, qid);
    const payload = JSON.stringify(bundle);

    const store = getNgStore();
    if (store) {
      try {
        await store.setItem(key, payload);
        this.cacheSet(this.fwBundleCache, key, bundle);
        return;
      } catch {
        // Out of quota or a blocked store: nothing else to do.
      }
    }
  }

  async initFrameworkAsync(
    qidRaw: string | number,
    tech: FrameworkTech,
    starters: Record<string, string>,
    entryHint?: string
  ): Promise<{ files: Record<string, string>; entryFile: string; restored: boolean }> {
    const qid = String(qidRaw);
    const key = V2_FW_BUNDLE(tech, qid);
    return this.enqueueBundleOp(key, async () => {
      const now = new Date().toISOString();

      let bundle = await this.getFrameworkBundleAsync(tech, qid);

      // First time: seed from starters as baselines, no user code yet.
      if (!bundle) {
        const files: Record<string, FrameworkFileState> = {};
        for (const [path, base] of Object.entries(starters || {})) {
          const p = path.replace(/^\/+/, '');
          files[p] = { baseline: base, code: '', updatedAt: now };
        }

        const entryFile =
          (entryHint && files[entryHint.replace(/^\/+/, '')])
            ? entryHint.replace(/^\/+/, '')
            : Object.keys(files)[0] || '';

        bundle = { files, entryFile, version: 'v2', updatedAt: now };
        await this.saveFrameworkBundlePrimary(tech, qid, bundle, { silent: true });

        const initialFiles: Record<string, string> = {};
        for (const [p, st] of Object.entries(files)) {
          initialFiles[p] = st.baseline || '';
        }

        return { files: initialFiles, entryFile, restored: false };
      }

      // Existing bundle: ensure all starter baselines exist, detect restore.
      let restored = false;
      const out: Record<string, string> = {};
      const mergedPaths = new Set([
        ...Object.keys(bundle.files || {}),
        ...Object.keys(starters || {}),
      ]);

      for (const rawPath of mergedPaths) {
        const path = rawPath.replace(/^\/+/, '');
        const cur = bundle.files[path] || {};
        const starterBase = starters[path];

        // Seed baseline from starters if missing
        const baseline = cur.baseline ?? starterBase ?? '';
        const code = cur.code ?? '';

        if (!cur.baseline && baseline) {
          cur.baseline = baseline;
        }

        // Preserve legacy whitespace-only framework files as well as explicitly
        // cleared drafts. Untouched baseline-only records still use the starter.
        const hasUser = cur.userCleared === true || code.length > 0;
        const visible = hasUser ? code : baseline;
        out[path] = visible;

        // Mark restored if user code diverged from baseline
        if (hasUser && code.trim() !== baseline.trim()) {
          restored = true;
        }

        // Ensure we write back the updated file state
        cur.updatedAt = cur.updatedAt ?? now;
        bundle.files[path] = cur;
      }

      // Ensure entry file
      if (!bundle.entryFile || !Object.prototype.hasOwnProperty.call(out, bundle.entryFile)) {
        const guess =
          (entryHint && Object.prototype.hasOwnProperty.call(out, entryHint.replace(/^\/+/, '')))
            ? entryHint.replace(/^\/+/, '')
            : Object.keys(out)[0] || '';
        bundle.entryFile = guess;
      }

      bundle.updatedAt = now;
      await this.saveFrameworkBundlePrimary(tech, qid, bundle, { silent: true });

      return {
        files: out,
        entryFile: bundle.entryFile!,
        restored,
      };
    });
  }

  async saveFrameworkFileAsync(
    qidRaw: string | number,
    tech: FrameworkTech,
    pathRaw: string,
    code: string,
    opts?: { force?: boolean; allowEmpty?: boolean }
  ): Promise<void> {
    const qid = String(qidRaw);
    const path = pathRaw.replace(/^\/+/, '');
    const key = V2_FW_BUNDLE(tech, qid);
    await this.enqueueBundleOp(key, async () => {
      const now = new Date().toISOString();

      const cur = (await this.getFrameworkBundleAsync(tech, qid)) || {
        files: {},
        version: 'v2',
        updatedAt: now,
      } as FrameworkBundleV2;

      const prev = cur.files[path] || {};
      const existing = prev.code ?? '';
      const baseline = prev.baseline ?? null;

      // Guard 1: don't wipe non-empty with empty (unless forced or user-allowed)
      if (!opts?.force && !opts?.allowEmpty && (!code || !code.trim()) && existing.trim()) {
        return;
      }

      // Guard 2: a programmatic write must not revert diverged user code to the baseline;
      // forced or user-allowed writes always win (see saveJsAsync).
      if (
        !opts?.force &&
        !opts?.allowEmpty &&
        existing.trim() &&
        baseline != null &&
        code === baseline
      ) {
        return;
      }

      cur.files[path] = {
        ...prev,
        code,
        updatedAt: now,
        userCleared: !code.trim() && !!(opts?.allowEmpty || opts?.force || prev.userCleared),
      };
      cur.updatedAt = now;

      await this.saveFrameworkBundlePrimary(tech, qid, cur);
    });
  }

  async resetFrameworkAsync(
    qidRaw: string | number,
    tech: FrameworkTech,
    starters: Record<string, string>,
    entryHint?: string
  ): Promise<void> {
    const qid = String(qidRaw);
    const key = V2_FW_BUNDLE(tech, qid);
    await this.enqueueBundleOp(key, async () => {
      const now = new Date().toISOString();
      const files: Record<string, FrameworkFileState> = {};

      for (const [pathRaw, base] of Object.entries(starters || {})) {
        const path = pathRaw.replace(/^\/+/, '');
        files[path] = { baseline: base, code: base, updatedAt: now };
      }

      const entryFile =
        (entryHint && files[entryHint.replace(/^\/+/, '')])
          ? entryHint.replace(/^\/+/, '')
          : Object.keys(files)[0] || '';

      const bundle: FrameworkBundleV2 = {
        files,
        entryFile,
        version: 'v2',
        updatedAt: now,
      };

      await this.saveFrameworkBundlePrimary(tech, qid, bundle);
    });
  }

  async clearFrameworkAsync(
    tech: FrameworkTech,
    qidRaw: string | number
  ): Promise<void> {
    const qid = String(qidRaw);
    const key = V2_FW_BUNDLE(tech, qid);
    await this.enqueueBundleOp(key, async () => {
      this.fwBundleCache.delete(key);
      const store = getNgStore();
      if (store) {
        try { await store.removeItem(key); } catch { /* ignore */ }
      }
    });
  }

  async setFrameworkBundleAsync(
    qidRaw: string | number,
    tech: FrameworkTech,
    files: Record<string, string>,
    entryFile?: string
  ): Promise<void> {
    const qid = String(qidRaw);
    const now = new Date().toISOString();

    const nextFiles: Record<string, FrameworkFileState> = {};
    for (const [pRaw, code] of Object.entries(files || {})) {
      const p = pRaw.replace(/^\/+/, '');
      nextFiles[p] = {
        code,
        baseline: nextFiles[p]?.baseline, // keep existing if any in future extensions
        updatedAt: now,
        userCleared: !code.trim(),
      };
    }

    const ef =
      (entryFile && nextFiles[entryFile.replace(/^\/+/, '')])
        ? entryFile.replace(/^\/+/, '')
        : Object.keys(nextFiles)[0] || '';

    const bundle: FrameworkBundleV2 = {
      files: nextFiles,
      entryFile: ef,
      version: 'v2',
      updatedAt: now,
    };

    await this.saveFrameworkBundlePrimary(tech, qid, bundle);
  }

  // ---------- Versioned draft helpers (used by UI migration / banners) ----------

  /**
   * Clone an existing JS bundle from one qid to another.
   * - Does NOT delete or overwrite the source.
   * - By default, does NOT overwrite the destination if it exists.
   */
  async cloneJsBundleAsync(
    fromQidRaw: string | number,
    toQidRaw: string | number,
    opts?: { overwrite?: boolean }
  ): Promise<boolean> {
    const fromQid = String(fromQidRaw);
    const toQid = String(toQidRaw);
    if (!fromQid || !toQid || fromQid === toQid) return false;

    const destKey = V2_JS_BUNDLE(toQid);
    return this.enqueueBundleOp(destKey, async () => {
      const src = await this.getBundleAsync(fromQid);
      if (!src) return false;

      if (!opts?.overwrite) {
        const existing = await this.getBundleAsync(toQid);
        if (existing) return false;
      }

      // Preserve the original payload (including baselines) for safe archiving.
      const cloned = JSON.parse(JSON.stringify(src)) as JsBundleV2;
      await this.saveBundlePrimary(toQid, cloned, { silent: true });
      return true;
    });
  }

  /**
   * Clone an existing WEB bundle from one qid to another.
   * - Does NOT delete or overwrite the source.
   * - By default, does NOT overwrite the destination if it exists.
   */
  async cloneWebBundleAsync(
    fromQidRaw: string | number,
    toQidRaw: string | number,
    opts?: { overwrite?: boolean }
  ): Promise<boolean> {
    const fromQid = String(fromQidRaw);
    const toQid = String(toQidRaw);
    if (!fromQid || !toQid || fromQid === toQid) return false;

    const destKey = V2_WEB_BUNDLE(toQid);
    return this.enqueueBundleOp(destKey, async () => {
      const src = await this.getWebBundleAsync(fromQid);
      if (!src) return false;

      if (!opts?.overwrite) {
        const existing = await this.getWebBundleAsync(toQid);
        if (existing) return false;
      }

      const cloned = JSON.parse(JSON.stringify(src)) as WebBundleV2;
      await this.saveWebBundlePrimary(toQid, cloned, { silent: true });
      return true;
    });
  }

  /**
   * Clone an existing framework bundle from one qid to another.
   * - Does NOT delete or overwrite the source.
   * - By default, does NOT overwrite the destination if it exists.
   */
  async cloneFrameworkBundleAsync(
    tech: FrameworkTech,
    fromQidRaw: string | number,
    toQidRaw: string | number,
    opts?: { overwrite?: boolean }
  ): Promise<boolean> {
    const fromQid = String(fromQidRaw);
    const toQid = String(toQidRaw);
    if (!fromQid || !toQid || fromQid === toQid) return false;

    const destKey = V2_FW_BUNDLE(tech, toQid);
    return this.enqueueBundleOp(destKey, async () => {
      const src = await this.getFrameworkBundleAsync(tech, fromQid);
      if (!src) return false;

      if (!opts?.overwrite) {
        const existing = await this.getFrameworkBundleAsync(tech, toQid);
        if (existing) return false;
      }

      const cloned = JSON.parse(JSON.stringify(src)) as FrameworkBundleV2;
      await this.saveFrameworkBundlePrimary(tech, toQid, cloned, { silent: true });
      return true;
    });
  }

  async getWebDraftSnapshotAsync(qidRaw: string | number): Promise<{
    html: { code: string; baseline: string };
    css: { code: string; baseline: string };
    updatedAt: string;
  } | null> {
    const qid = String(qidRaw);
    const bundle = await this.getWebBundleAsync(qid);
    if (!bundle) return null;
    return {
      html: { code: String(bundle.html?.code ?? ''), baseline: String(bundle.html?.baseline ?? '') },
      css: { code: String(bundle.css?.code ?? ''), baseline: String(bundle.css?.baseline ?? '') },
      updatedAt: String(bundle.updatedAt ?? ''),
    };
  }

  async getFrameworkDraftSnapshotAsync(
    tech: FrameworkTech,
    qidRaw: string | number
  ): Promise<{
    files: Record<string, { code: string; baseline: string }>;
    entryFile: string;
    updatedAt: string;
  } | null> {
    const qid = String(qidRaw);
    const bundle = await this.getFrameworkBundleAsync(tech, qid);
    if (!bundle) return null;

    const files: Record<string, { code: string; baseline: string }> = {};
    for (const [path, st] of Object.entries(bundle.files || {})) {
      const p = String(path).replace(/^\/+/, '');
      files[p] = {
        code: String(st?.code ?? ''),
        baseline: String(st?.baseline ?? ''),
      };
    }

    return {
      files,
      entryFile: String(bundle.entryFile ?? ''),
      updatedAt: String(bundle.updatedAt ?? ''),
    };
  }
}
