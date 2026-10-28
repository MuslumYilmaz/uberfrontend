export type DraftIndexEntry = {
  version: string;
  updatedAt: string; // ISO
  lang?: string;
};

export type DraftIndex = {
  latestVersion: string;
  versions: DraftIndexEntry[];
};

const INDEX_PREFIX = 'fa:draftIndex:'; // key: fa:draftIndex:<baseKey>
const DISMISS_PREFIX = 'fa:draftUpdateDismissed:'; // key: fa:draftUpdateDismissed:<baseKey>:<currentVersion>

export const DRAFT_KEY_SEPARATOR = '@';

function hasLocalStorage(): boolean {
  try {
    const k = '__fa_draft_probe__';
    localStorage.setItem(k, '1');
    localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

function safeGet(key: string): string | null {
  if (!hasLocalStorage()) return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  if (!hasLocalStorage()) return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore quota / denied
  }
}

function safeParse(raw: string | null): any {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function makeDraftKey(baseKeyRaw: string, contentVersionRaw: string): string {
  const baseKey = String(baseKeyRaw ?? '').trim();
  const version = String(contentVersionRaw ?? '').trim();
  return `${baseKey}${DRAFT_KEY_SEPARATOR}${version}`;
}

export function draftIndexKey(baseKeyRaw: string): string {
  return `${INDEX_PREFIX}${String(baseKeyRaw ?? '').trim()}`;
}

export function readDraftIndex(baseKeyRaw: string): DraftIndex | null {
  const parsed = safeParse(safeGet(draftIndexKey(baseKeyRaw)));
  if (!parsed || typeof parsed !== 'object') return null;

  const latestVersion = String((parsed as any).latestVersion ?? '').trim();
  const versionsRaw = Array.isArray((parsed as any).versions) ? (parsed as any).versions : [];
  const versions: DraftIndexEntry[] = versionsRaw
    .map((v: any) => ({
      version: String(v?.version ?? '').trim(),
      updatedAt: String(v?.updatedAt ?? '').trim(),
      lang: v?.lang != null ? String(v.lang) : undefined,
    }))
    .filter((v: DraftIndexEntry) => v.version && v.updatedAt);

  return latestVersion ? { latestVersion, versions } : null;
}

export function writeDraftIndex(baseKeyRaw: string, index: DraftIndex): void {
  safeSet(draftIndexKey(baseKeyRaw), JSON.stringify(index));
}

export function upsertDraftIndexVersion(
  baseKeyRaw: string,
  entry: DraftIndexEntry,
  opts?: { latestVersion?: string }
): DraftIndex {
  const baseKey = String(baseKeyRaw ?? '').trim();
  const now = new Date().toISOString();
  const v = String(entry?.version ?? '').trim();
  const updatedAt = String(entry?.updatedAt ?? '').trim() || now;
  const lang = entry?.lang != null ? String(entry.lang) : undefined;

  const cur = readDraftIndex(baseKey) || { latestVersion: v, versions: [] as DraftIndexEntry[] };
  const nextVersions = cur.versions.filter((x) => x.version !== v);
  nextVersions.push({ version: v, updatedAt, ...(lang ? { lang } : {}) });
  nextVersions.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const latestVersion = String(opts?.latestVersion ?? cur.latestVersion ?? v).trim() || v;
  const next: DraftIndex = { latestVersion, versions: nextVersions };

  writeDraftIndex(baseKey, next);
  return next;
}

export function listOtherVersions(index: DraftIndex | null, currentVersionRaw: string): DraftIndexEntry[] {
  const current = String(currentVersionRaw ?? '').trim();
  const versions = index?.versions ?? [];
  return versions.filter((v) => v.version && v.version !== current);
}

export function isUpdateBannerDismissed(baseKeyRaw: string, currentVersionRaw: string): boolean {
  const baseKey = String(baseKeyRaw ?? '').trim();
  const current = String(currentVersionRaw ?? '').trim();
  return !!safeGet(`${DISMISS_PREFIX}${baseKey}:${current}`);
}

export function dismissUpdateBanner(baseKeyRaw: string, currentVersionRaw: string): void {
  const baseKey = String(baseKeyRaw ?? '').trim();
  const current = String(currentVersionRaw ?? '').trim();
  safeSet(`${DISMISS_PREFIX}${baseKey}:${current}`, '1');
}

// ---------- Sidecars of the code draft: the pre-solution snapshot and edited tests ----------

export type JsDraftLang = 'js' | 'ts';

export type SolutionDraftRecord = {
  lang: JsDraftLang;
  /** The user's own code from before "Load into editor" replaced it. */
  code: string;
  /** True until the user edits, reverts or resets; drives the solution banner after a refresh. */
  viewingSolution: boolean;
  savedAt: string; // ISO
};

const SOLUTION_PREFIX = 'fa:solutionDraft:'; // key: fa:solutionDraft:<storageKey>
const TESTS_PREFIX = 'fa:testsDraft:'; // key: fa:testsDraft:<storageKey>:<lang>

function safeRemove(key: string): void {
  if (!hasLocalStorage()) return;
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

function solutionDraftKey(storageKeyRaw: string): string {
  return `${SOLUTION_PREFIX}${String(storageKeyRaw ?? '').trim()}`;
}

function testsDraftKey(storageKeyRaw: string, lang: JsDraftLang): string {
  return `${TESTS_PREFIX}${String(storageKeyRaw ?? '').trim()}:${lang}`;
}

export function readSolutionDraft(storageKeyRaw: string): SolutionDraftRecord | null {
  const storageKey = String(storageKeyRaw ?? '').trim();
  if (!storageKey) return null;
  const parsed = safeParse(safeGet(solutionDraftKey(storageKey)));
  if (!parsed || typeof parsed.code !== 'string') return null;
  return {
    lang: parsed.lang === 'ts' ? 'ts' : 'js',
    code: parsed.code,
    viewingSolution: parsed.viewingSolution === true,
    savedAt: typeof parsed.savedAt === 'string' ? parsed.savedAt : '',
  };
}

export function writeSolutionDraft(
  storageKeyRaw: string,
  record: Omit<SolutionDraftRecord, 'savedAt'>,
): void {
  const storageKey = String(storageKeyRaw ?? '').trim();
  if (!storageKey) return;
  const payload: SolutionDraftRecord = {
    lang: record.lang === 'ts' ? 'ts' : 'js',
    code: String(record.code ?? ''),
    viewingSolution: record.viewingSolution === true,
    savedAt: new Date().toISOString(),
  };
  safeSet(solutionDraftKey(storageKey), JSON.stringify(payload));
}

export function clearSolutionDraft(storageKeyRaw: string): void {
  const storageKey = String(storageKeyRaw ?? '').trim();
  if (!storageKey) return;
  safeRemove(solutionDraftKey(storageKey));
}

export function readTestsDraft(storageKeyRaw: string, lang: JsDraftLang): string | null {
  const storageKey = String(storageKeyRaw ?? '').trim();
  if (!storageKey) return null;
  const parsed = safeParse(safeGet(testsDraftKey(storageKey, lang)));
  return parsed && typeof parsed.code === 'string' ? parsed.code : null;
}

export function writeTestsDraft(storageKeyRaw: string, lang: JsDraftLang, code: string): void {
  const storageKey = String(storageKeyRaw ?? '').trim();
  if (!storageKey) return;
  safeSet(testsDraftKey(storageKey, lang), JSON.stringify({ code: String(code ?? ''), savedAt: new Date().toISOString() }));
}

export function clearTestsDraft(storageKeyRaw: string, lang?: JsDraftLang): void {
  const storageKey = String(storageKeyRaw ?? '').trim();
  if (!storageKey) return;
  const langs: JsDraftLang[] = lang ? [lang] : ['js', 'ts'];
  for (const entry of langs) safeRemove(testsDraftKey(storageKey, entry));
}
