import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { MasteryProgressState } from '../../shared/mastery/mastery-path.model';

const STORAGE_PREFIX = 'fa:mastery:v1:';

const EMPTY_PROGRESS: MasteryProgressState = {
  completedItemIds: [],
  updatedAt: '',
};

@Injectable({ providedIn: 'root' })
export class MasteryProgressService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly activeSlugSig = signal<string | null>(null);
  private readonly progressSig = signal<MasteryProgressState>({ ...EMPTY_PROGRESS });

  readonly activeSlug = this.activeSlugSig.asReadonly();
  readonly progress = this.progressSig.asReadonly();
  readonly completedSet = computed(() => new Set(this.progressSig().completedItemIds));

  load(slug: string): void {
    const nextSlug = (slug || '').trim();
    if (!nextSlug) {
      this.activeSlugSig.set(null);
      this.progressSig.set({ ...EMPTY_PROGRESS });
      return;
    }

    this.activeSlugSig.set(nextSlug);
    this.progressSig.set(this.read(nextSlug));
  }

  isCompleted(itemId: string): boolean {
    if (!itemId) return false;
    return this.completedSet().has(itemId);
  }

  setCompleted(itemId: string, completed: boolean): void {
    if (!itemId) return;

    const curr = this.progressSig();
    const set = new Set(curr.completedItemIds);

    if (completed) set.add(itemId);
    else set.delete(itemId);

    const next: MasteryProgressState = {
      completedItemIds: Array.from(set),
      updatedAt: new Date().toISOString(),
    };

    this.progressSig.set(next);
    this.persistActive(next);
  }

  toggle(itemId: string): void {
    this.setCompleted(itemId, !this.isCompleted(itemId));
  }

  completedCount(itemIds: readonly string[]): number {
    const completed = this.completedSet();
    let count = 0;
    for (const id of itemIds) {
      if (completed.has(id)) count += 1;
    }
    return count;
  }

  completionPercent(itemIds: readonly string[]): number {
    const total = itemIds.length;
    if (!total) return 0;
    const done = this.completedCount(itemIds);
    return Math.round((done / total) * 100);
  }

  resetActive(): void {
    const slug = this.activeSlugSig();
    this.progressSig.set({ ...EMPTY_PROGRESS });

    if (!slug || !this.isBrowser) return;
    try {
      localStorage.removeItem(this.key(slug));
    } catch {
      // no-op
    }
  }

  private persistActive(state: MasteryProgressState): void {
    const slug = this.activeSlugSig();
    if (!slug || !this.isBrowser) return;

    try {
      localStorage.setItem(this.key(slug), JSON.stringify(state));
    } catch {
      // no-op
    }
  }

  private read(slug: string): MasteryProgressState {
    if (!this.isBrowser) return { ...EMPTY_PROGRESS };

    try {
      const raw = localStorage.getItem(this.key(slug));
      if (!raw) return { ...EMPTY_PROGRESS };

      const parsed = JSON.parse(raw) as Partial<MasteryProgressState> | null;
      const completedItemIds = Array.isArray(parsed?.completedItemIds)
        ? parsed!.completedItemIds.filter((id) => typeof id === 'string')
        : [];

      const updatedAt = typeof parsed?.updatedAt === 'string' ? parsed.updatedAt : '';

      return {
        completedItemIds,
        updatedAt,
      };
    } catch {
      return { ...EMPTY_PROGRESS };
    }
  }

  private key(slug: string): string {
    return `${STORAGE_PREFIX}${slug}`;
  }
}
