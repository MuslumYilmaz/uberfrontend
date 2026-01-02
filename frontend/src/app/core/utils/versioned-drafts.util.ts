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
