import { Injectable } from '@angular/core';
import localForage from 'localforage';

type LocalForageInstance = ReturnType<typeof localForage.createInstance>;

const IS_BROWSER_ENV = typeof window !== 'undefined' && typeof document !== 'undefined';

@Injectable({ providedIn: 'root' })
export class QuestionPersistenceService {
  private readonly store: LocalForageInstance | null = IS_BROWSER_ENV
    ? localForage.createInstance({ name: 'frontendatlas', storeName: 'fa_questions' })
    : null;

  async get(keyRaw: string): Promise<string | null> {
    const key = String(keyRaw ?? '').trim();
    if (!key) return null;

    const idbValue = await this.getFromIdb(key);
    if (idbValue !== null) return idbValue;

    return this.getFromLocalStorage(key);
  }

  async set(keyRaw: string, valueRaw: string): Promise<void> {
    const key = String(keyRaw ?? '').trim();
    if (!key) return;
    const value = String(valueRaw ?? '');

    await this.setInIdb(key, value);
    this.setInLocalStorage(key, value);
  }

  async remove(keyRaw: string): Promise<void> {
    const key = String(keyRaw ?? '').trim();
    if (!key) return;

    await this.removeFromIdb(key);
    this.removeFromLocalStorage(key);
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

    const idbKeys = await this.keysByPrefixFromIdb(prefix);
    const lsKeys = this.keysByPrefixFromLocalStorage(prefix);
    return Array.from(new Set([...idbKeys, ...lsKeys]));
  }

  private async keysByPrefixFromIdb(prefix: string): Promise<string[]> {
    if (!this.store) return [];
    try {
      const keys = await this.store.keys();
      return keys
        .map((raw) => String(raw))
        .filter((key) => key.startsWith(prefix));
    } catch {
      return [];
    }
  }

  private keysByPrefixFromLocalStorage(prefix: string): string[] {
    if (!this.hasLocalStorage()) return [];
    try {
      return Object.keys(localStorage).filter((key) => key.startsWith(prefix));
    } catch {
      return [];
    }
  }

  private async getFromIdb(key: string): Promise<string | null> {
    if (!this.store) return null;
    try {
      const raw = await this.store.getItem<unknown>(key);
      if (raw == null) return null;
      return typeof raw === 'string' ? raw : String(raw);
    } catch {
      return null;
    }
  }

  private async setInIdb(key: string, value: string): Promise<void> {
    if (!this.store) return;
    try {
      await this.store.setItem(key, value);
    } catch {
      // localStorage fallback handles failures
    }
  }

  private async removeFromIdb(key: string): Promise<void> {
    if (!this.store) return;
    try {
      await this.store.removeItem(key);
    } catch {
      // localStorage cleanup still runs
    }
  }

  private getFromLocalStorage(key: string): string | null {
    if (!this.hasLocalStorage()) return null;
    try {
      const value = localStorage.getItem(key);
      return value && value.trim().length ? value : null;
    } catch {
      return null;
    }
  }

  private setInLocalStorage(key: string, value: string): void {
    if (!this.hasLocalStorage()) return;
    try {
      localStorage.setItem(key, value);
    } catch {
      // ignore quota issues
    }
  }

  private removeFromLocalStorage(key: string): void {
    if (!this.hasLocalStorage()) return;
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }

  private hasLocalStorage(): boolean {
    if (typeof localStorage === 'undefined') return false;
    try {
      const key = '__q_persist_probe__';
      localStorage.setItem(key, '1');
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }
}
