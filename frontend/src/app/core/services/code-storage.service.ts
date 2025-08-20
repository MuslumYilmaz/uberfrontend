// src/app/core/services/code-storage.service.ts
import { Injectable } from '@angular/core';

type JsLang = 'js' | 'ts';
type CodeFormat = 'javascript' | 'typescript';

export interface JsSave {
  code: string;
  language: JsLang;
  format: CodeFormat;
  version: 'v1';
  updatedAt: string; // ISO
}

export interface NgSave {
  files: Record<string, { code: string }>;
  projectId?: string;
  version: 'v1';
  updatedAt: string;
}

const DATA_VERSION = '1'; // bump if your *schema* changes
const BASE = 'code:';     // common base lets us match "any version"
const PREFIX = `v${DATA_VERSION}:${BASE}`; // e.g. v1:code:

@Injectable({ providedIn: 'root' })
export class CodeStorageService {
  // ---------- JS ----------
  private keyJs(qid: string) { return `${PREFIX}js:${qid}`; }

  getJs(qid: string): JsSave | null {
    const raw = localStorage.getItem(this.keyJs(qid));
    if (!raw) return null;
    try { return JSON.parse(raw) as JsSave; } catch { return null; }
  }

  saveJs(qid: string, code: string, lang: JsLang = 'js') {
    const payload: JsSave = {
      code,
      language: lang,
      format: lang === 'ts' ? 'typescript' : 'javascript',
      version: 'v1',
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(this.keyJs(qid), JSON.stringify(payload));
  }

  clearJs(qid: string) { localStorage.removeItem(this.keyJs(qid)); }

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

  // ---------- NEW: purge helpers (used by startup version gate) ----------
  /** Matches *any* versioned code keys like `vX:code:js:...` or `vX:code:ng:...` */
  static isOurKey(k: string): boolean {
    return /^v\d+:code:(js|ng):/.test(k);
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
}