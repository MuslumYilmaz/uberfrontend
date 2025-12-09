// src/app/core/services/storage-version.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable, isDevMode } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StorageVersionService {
  private readonly VERSION_KEY = 'fa:dataVersion';
  private readonly DATA_URL = 'assets/data-version.json';

  constructor(private http: HttpClient) { }

  async ensureFreshStorage(): Promise<void> {
    // Dev: skip entirely (prevents 404 spam when the file doesn't exist)
    if (isDevMode()) return;

    const current = await this.fetchVersionSafe();
    if (!current) return; // nothing to compare; do nothing

    const stored = localStorage.getItem(this.VERSION_KEY);
    if (stored === current) return;

    this.purgeAppKeys();
    try { localStorage.setItem(this.VERSION_KEY, current); } catch { }
  }

  private async fetchVersionSafe(): Promise<string | null> {
    try {
      const data = await this.http
        .get<{ dataVersion?: string }>(this.DATA_URL, {
          headers: { 'cache-control': 'no-cache' },
        })
        .toPromise();
      return data?.dataVersion ?? null;
    } catch {
      // 404/network/etc — ignore and skip wipe
      return null;
    }
  }

  /** Remove only our app’s keys (adjust legacy prefixes if needed) */
  private purgeAppKeys() {
    const ours = /^v\d+:code:(js|ng):/;        // your CodeStorageService keys
    const legacy = /^(jsBaseline:|ngBaseline:)/; // add/adjust if you have legacy keys
    try {
      for (const k of Object.keys(localStorage)) {
        if (ours.test(k) || legacy.test(k)) localStorage.removeItem(k);
      }
    } catch { }
  }
}
