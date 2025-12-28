import { Injectable } from '@angular/core';
import { Difficulty } from '../models/question.model';
import { Tech } from '../models/user.model';

export type ListSource = 'tech' | 'company' | 'global-coding';
export type Kind = 'coding' | 'trivia' | 'all';

export type CategoryKey = 'ui' | 'js-fn' | 'html-css' | 'algo' | 'system';
export type ViewMode = 'tech' | 'formats';

export type ImportanceTier = 'low' | 'medium' | 'high';

export type SortKey =
  | 'default'
  | 'title-asc' | 'title-desc'
  | 'difficulty-asc' | 'difficulty-desc'
  | 'importance-desc' | 'importance-asc'
  | 'created-desc' | 'created-asc'
  | 'diff-asc' | 'diff-desc';

export interface CodingListFilterState {
  searchTerm: string;
  sliderValue: number;
  diffs: Difficulty[];
  impTiers: ImportanceTier[];
  selectedTech: Tech | null;
  selectedKind: Kind;
  selectedCategory: CategoryKey | null;
  selectedTags: string[];
  sort: SortKey;
  tagMatchMode: 'all' | 'any';
}

export interface GlobalCodingViewState {
  tech: CodingListFilterState | null;
  formats: CodingListFilterState | null;
}

@Injectable({ providedIn: 'root' })
export class CodingListStateService {
  private static _counter = 0;
  readonly instanceId = ++CodingListStateService._counter;

  private readonly storageKey = 'fa:coding:list-state:v1';

  private _globalCodingState: GlobalCodingViewState = {
    tech: null,
    formats: null,
  };

  constructor() {
    const restored = this.readFromStorage();
    if (restored) {
      this._globalCodingState = restored;
    }
  }

  get globalCodingState(): GlobalCodingViewState {
    return this._globalCodingState;
  }

  set globalCodingState(val: GlobalCodingViewState) {
    this._globalCodingState = this.normalize(val);
    this.writeToStorage(this._globalCodingState);
  }

  private normalize(input: any): GlobalCodingViewState {
    const tech = input?.tech ?? null;
    const formats = input?.formats ?? null;
    return {
      tech: this.isFilterState(tech) ? tech : null,
      formats: this.isFilterState(formats) ? formats : null,
    };
  }

  private isFilterState(val: any): val is CodingListFilterState {
    return !!val && typeof val === 'object' && typeof val.searchTerm === 'string';
  }

  private hasLocalStorage(): boolean {
    try {
      const k = '__fa_coding_list_probe__';
      localStorage.setItem(k, '1');
      localStorage.removeItem(k);
      return true;
    } catch {
      return false;
    }
  }

  private readFromStorage(): GlobalCodingViewState | null {
    if (!this.hasLocalStorage()) return null;
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return null;
      return this.normalize(JSON.parse(raw));
    } catch {
      return null;
    }
  }

  private writeToStorage(state: GlobalCodingViewState): void {
    if (!this.hasLocalStorage()) return;
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch {
      // ignore quota / privacy mode issues
    }
  }
}
