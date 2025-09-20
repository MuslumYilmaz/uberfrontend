import { Injectable } from '@angular/core';

// esbuild-init.service.ts
@Injectable({ providedIn: 'root' })
export class EsbuildInitService {
  private ready?: Promise<void>;

  init(): Promise<void> {
    if (this.ready) return this.ready;

    this.ready = (async () => {
      const esbuild = await import('esbuild-wasm');
      // Use CDN unconditionally (no local HEAD → no 404 in console)
      const wasmURL = 'https://unpkg.com/esbuild-wasm@0.25.10/esbuild.wasm';
      await esbuild.initialize({ wasmURL, worker: true });
    })().catch(err => {
      console.error('[esbuild] init failed', err);
      this.ready = undefined;
      throw err;
    });

    return this.ready;
  }
}
