import { Injectable } from '@angular/core';
import localForage from 'localforage';

type PersistenceStore = {
  keys(): Promise<unknown[]>;
  getItem<T = unknown>(key: string): Promise<T | null>;
  setItem<T = unknown>(key: string, value: T): Promise<T>;
  removeItem(key: string): Promise<void>;
};

const IS_BROWSER_ENV = typeof window !== 'undefined' && typeof document !== 'undefined';

/**
 * Content caches (question banks, incidents, tradeoff battles) in IndexedDB.
 * When the store is unavailable or fails, reads answer null and writes are
 * dropped: the caller fetches the versioned asset again, which is cheap.
 */
@Injectable({ providedIn: 'root' })
export class QuestionPersistenceService {
  private storePromise: Promise<PersistenceStore | null> | null = null;
  private idbDisabled = !IS_BROWSER_ENV;

  async get(keyRaw: string): Promise<string | null> {
    const key = String(keyRaw ?? '').trim();
    if (!key) return null;
    return this.getFromIdb(key);
  }

  async set(keyRaw: string, valueRaw: string): Promise<void> {
    const key = String(keyRaw ?? '').trim();
    if (!key) return;
    await this.setInIdb(key, String(valueRaw ?? ''));
  }

  async remove(keyRaw: string): Promise<void> {
    const key = String(keyRaw ?? '').trim();
    if (!key) return;
    await this.removeFromIdb(key);
  }

  async clearByPrefix(prefixRaw: string): Promise<void> {
    const prefix = String(prefixRaw ?? '').trim();
    if (!prefix) return;

    const keys = await this.keysByPrefix(prefix);
    await Promise.all(keys.map((key) => this.remove(key)));
  }

  async keysByPrefix(prefixRaw: string): Promise<string[]> {
    const prefix = String(prefixRaw ?? '').trim();
    if (!prefix) return [];

    const store = await this.getStore();
    if (!store) return [];
    try {
      const keys = await store.keys();
      return keys
        .map((raw) => String(raw))
        .filter((key) => key.startsWith(prefix));
    } catch {
      this.disableIdb();
      return [];
    }
  }

  private async getFromIdb(key: string): Promise<string | null> {
    const store = await this.getStore();
    if (!store) return null;
    try {
      const raw = await store.getItem<unknown>(key);
      if (raw == null) return null;
      return typeof raw === 'string' ? raw : String(raw);
    } catch {
      this.disableIdb();
      return null;
    }
  }

  private async setInIdb(key: string, value: string): Promise<void> {
    const store = await this.getStore();
    if (!store) return;
    try {
      await store.setItem(key, value);
    } catch {
      this.disableIdb();
    }
  }

  private async removeFromIdb(key: string): Promise<void> {
    const store = await this.getStore();
    if (!store) return;
    try {
      await store.removeItem(key);
    } catch {
      this.disableIdb();
    }
  }

  private async getStore(): Promise<PersistenceStore | null> {
    if (this.idbDisabled) return null;
    if (this.storePromise) return this.storePromise;

    this.storePromise = Promise.resolve(
      localForage.createInstance({
        name: 'frontendatlas',
        storeName: 'fa_questions',
      }) as PersistenceStore
    )
      .catch(() => {
        this.disableIdb();
        return null;
      });

    return this.storePromise;
  }

  private disableIdb(): void {
    this.idbDisabled = true;
    this.storePromise = Promise.resolve(null);
  }
}
