import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

type FrameworkTech = 'react' | 'angular' | 'vue';

type Pending = {
  resolve: (html: string) => void;
  reject: (err: Error) => void;
};

@Injectable({ providedIn: 'root' })
export class PreviewBuilderService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private worker?: Worker;
  private pending = new Map<string, Pending>();

  async build(tech: FrameworkTech, files: Record<string, string>): Promise<string> {
    if (!this.isBrowser) return '';
    const assetBase = this.resolveAssetBase();

    try {
      const worker = this.ensureWorker();
      const id = this.makeId();
      const html = await new Promise<string>((resolve, reject) => {
        this.pending.set(id, { resolve, reject });
        worker.postMessage({ type: 'build', id, tech, files, assetBase });
      });
      return html;
    } catch {
      return this.buildInMain(tech, files, assetBase);
    }
  }

  private ensureWorker(): Worker {
    if (!this.worker) {
      this.worker = new Worker(
        new URL('../workers/preview-builder.worker', import.meta.url),
        { type: 'module' }
      );
      this.worker.addEventListener('message', this.onMessage);
      this.worker.addEventListener('error', this.onError);
    }
    return this.worker;
  }

  private onMessage = (event: MessageEvent) => {
    const msg = event.data as { type?: string; id?: string; html?: string; error?: string };
    if (!msg?.id) return;
    const pending = this.pending.get(msg.id);
    if (!pending) return;
    this.pending.delete(msg.id);
    if (msg.type === 'done') {
      pending.resolve(msg.html ?? '');
      return;
    }
    pending.reject(new Error(msg.error || 'Preview worker failed'));
  };

  private onError = () => {
    for (const pending of this.pending.values()) {
      pending.reject(new Error('Preview worker failed'));
    }
    this.pending.clear();
  };

  private async buildInMain(
    tech: FrameworkTech,
    files: Record<string, string>,
    assetBase: string
  ): Promise<string> {
    if (tech === 'react') {
      const mod = await import('../utils/react-preview-builder');
      return mod.makeReactPreviewHtml(files, assetBase);
    }
    if (tech === 'angular') {
      const mod = await import('../utils/angular-preview-builder');
      return mod.makeAngularPreviewHtmlV1(files, assetBase);
    }
    const mod = await import('../utils/vue-preview-builder');
    return mod.makeVuePreviewHtml(files, assetBase);
  }

  private makeId(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  private resolveAssetBase(): string {
    if (typeof window === 'undefined') return '';
    const origin = window.location?.origin || '';
    return origin;
  }
}
