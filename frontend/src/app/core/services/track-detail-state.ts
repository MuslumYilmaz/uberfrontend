import { Injectable } from '@angular/core';

export type TrackKindFilter = 'all' | 'coding' | 'trivia' | 'system-design';
export type TrackTechFilter = 'all' | 'javascript' | 'html' | 'css' | 'ui';
export type TrackDifficulty = 'easy' | 'intermediate' | 'hard';
export type TrackImportanceTier = 'low' | 'medium' | 'high';
export type TrackSortKey = 'diff-asc' | 'diff-desc' | 'importance-desc' | 'title-asc' | 'title-desc';

export type TrackDetailFilterState = {
  q: string;
  kind: TrackKindFilter;
  tech: TrackTechFilter;
  diffs: TrackDifficulty[];
  imps: TrackImportanceTier[];
  sort: TrackSortKey;
};

type TrackStateMap = Record<string, TrackDetailFilterState>;

@Injectable({ providedIn: 'root' })
export class TrackDetailStateService {
  private readonly storageKey = 'fa:tracks:detail-state:v1';
  private state: TrackStateMap = {};

  constructor() {
    const restored = this.readFromStorage();
    if (restored) {
      this.state = restored;
    }
  }

  get(slug: string): TrackDetailFilterState | null {
    const key = (slug || '').toLowerCase();
    return this.state[key] ?? null;
  }

  set(slug: string, next: TrackDetailFilterState): void {
    const key = (slug || '').toLowerCase();
    if (!key) return;
    const normalized = this.normalizeState(next);
    this.state = { ...this.state, [key]: normalized };
    this.writeToStorage(this.state);
  }

  clear(slug: string): void {
    const key = (slug || '').toLowerCase();
    if (!key || !(key in this.state)) return;
    const copy = { ...this.state };
    delete copy[key];
    this.state = copy;
    this.writeToStorage(this.state);
  }

  private normalizeState(input: any): TrackDetailFilterState {
    const allowedKinds = new Set<TrackKindFilter>(['all', 'coding', 'trivia', 'system-design']);
    const allowedTechs = new Set<TrackTechFilter>(['all', 'javascript', 'html', 'css', 'ui']);
    const allowedDiffs = new Set<TrackDifficulty>(['easy', 'intermediate', 'hard']);
    const allowedImps = new Set<TrackImportanceTier>(['low', 'medium', 'high']);
    const allowedSorts = new Set<TrackSortKey>(['diff-asc', 'diff-desc', 'importance-desc', 'title-asc', 'title-desc']);

    const q = typeof input?.q === 'string' ? input.q : '';
    const kind = allowedKinds.has(input?.kind) ? input.kind : 'all';
    const tech = allowedTechs.has(input?.tech) ? input.tech : 'all';
    const diffs = Array.isArray(input?.diffs)
      ? input.diffs.filter((d: any) => allowedDiffs.has(d))
      : [];
    const imps = Array.isArray(input?.imps)
      ? input.imps.filter((t: any) => allowedImps.has(t))
      : [];
    const sort = allowedSorts.has(input?.sort) ? input.sort : 'diff-asc';

    return { q, kind, tech, diffs, imps, sort };
  }

  private normalizeMap(input: any): TrackStateMap | null {
    if (!input || typeof input !== 'object') return null;

    const result: TrackStateMap = {};
    for (const [slug, raw] of Object.entries(input)) {
      if (!slug) continue;
      result[String(slug).toLowerCase()] = this.normalizeState(raw);
    }
    return result;
  }

  private hasLocalStorage(): boolean {
    try {
      const k = '__fa_track_detail_probe__';
      localStorage.setItem(k, '1');
      localStorage.removeItem(k);
      return true;
    } catch {
      return false;
    }
  }

  private readFromStorage(): TrackStateMap | null {
    if (!this.hasLocalStorage()) return null;
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return this.normalizeMap(parsed);
    } catch {
      return null;
    }
  }

  private writeToStorage(map: TrackStateMap): void {
    if (!this.hasLocalStorage()) return;
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(map));
    } catch {
      // ignore quota / privacy mode issues
    }
  }
}

