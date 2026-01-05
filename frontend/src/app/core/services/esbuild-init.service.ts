import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class EsbuildInitService {
  private inited = false;
  private pending: Promise<void> | null = null;

  /**
   * Optional lazy init. Only call this from a feature that truly needs esbuild.
   * Always resolves; safe to call multiple times.
   */
  init(): Promise<void> {
    if (this.inited) return Promise.resolve();
    if (this.pending) return this.pending;

    this.pending = this.tryInit()
      .then(() => { this.inited = true; })
      .catch(() => { })
      .finally(() => { this.pending = null; });

    return this.pending;
  }

  private async tryInit(): Promise<void> {
    // If you never ship esbuild, bail out immediately.
    // Comment this return and fill in the real loader if/when you add it.
    return;

    // Example (for later):
    // const mod: any = await import('esbuild-wasm');
    // await mod.initialize({ wasmURL: '/assets/esbuild/wasm/esbuild.wasm', worker: true });
  }
}
