import { Injectable } from '@angular/core';
import sdk, { VM } from '@stackblitz/sdk';
import { normalizeSdkFiles } from '../utils/snapshot.utils';

type Asset = {
  files: Record<string, string>;
  dependencies?: Record<string, string>;
  openFile?: string;
};

@Injectable({ providedIn: 'root' })
export class StackBlitzEmbed {
  private autosaveTimers = new Map<VM, number>();

  private normalizePath(p?: string): string | undefined {
    return typeof p === 'string' ? p.replace(/^\/+/, '') : undefined;
  }
  private resolveAssetUrl(assetUrl: string): string {
    const cleaned = assetUrl.replace(/^\/+/, '');
    return cleaned.startsWith('assets/') ? `/${cleaned}` : `/assets/${cleaned}`;
  }

  /** Load an asset JSON and normalize its shape for the SDK. */
  async fetchAsset(assetUrl: string): Promise<Asset | null> {
    try {
      const res = await fetch(this.resolveAssetUrl(assetUrl), { cache: 'no-store' });
      if (!res.ok) return null;

      const json: any = await res.json();
      // Accept either { files: {...}, dependencies, openFile } or a flat files map.
      const rawFiles: Record<string, string> = json?.files ?? json ?? {};

      return {
        files: normalizeSdkFiles(rawFiles),
        dependencies: json?.dependencies ?? undefined,
        openFile: this.normalizePath(json?.openFile),
      };
    } catch {
      return null;
    }
  }

  /** Embed a project and autosave the virtual FS to localStorage. */
  async embedProject(
    host: HTMLElement,
    opts: {
      title: string;
      files: Record<string, string>;
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>; // merged into dependencies
      openFile: string;
      storageKey: string;
      template?: 'angular-cli' | 'create-react-app' | 'javascript' | 'typescript' | 'node';

    }
  ): Promise<{ vm: VM; cleanup: () => void }> {
    const deps: Record<string, string> = {
      ...(opts.dependencies ?? {}),
      ...(opts.devDependencies ?? {}),
    };

    const vm = await sdk.embedProject(
      host,
      {
        template: opts.template ?? 'angular-cli',
        title: opts.title,
        description: 'Embedded via StackBlitz SDK',
        files: normalizeSdkFiles(opts.files),
        dependencies: deps,
      },
      {
        height: '100%',
        view: 'preview',
        hideExplorer: true,
        hideNavigation: true,
        hideDevTools: true,
        terminalHeight: 0,
        forceEmbedLayout: true,
        openFile: this.normalizePath(opts.openFile)!,
      }
    );

    const saveNow = async () => {
      try {
        const snap = await vm.getFsSnapshot();
        localStorage.setItem(opts.storageKey, JSON.stringify(snap ?? {}));
      } catch { /* noop */ }
    };

    // Initial save + autosave
    void saveNow();
    const t = window.setInterval(saveNow, 4000);
    this.autosaveTimers.set(vm, t);

    // Save on tab hide/close
    const onVis = () => { if (document.hidden) void saveNow(); };
    const onUnload = () => { void saveNow(); };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('beforeunload', onUnload);

    const cleanup = () => {
      void saveNow();
      const timer = this.autosaveTimers.get(vm);
      if (timer) clearInterval(timer);
      this.autosaveTimers.delete(vm);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('beforeunload', onUnload);
      try { (vm as any)?.destroy?.(); } catch { /* noop */ }
    };

    return { vm, cleanup };
  }

  /** Replace files from an asset and persist them as the new working snapshot. */
  async replaceFromAsset(
    vm: VM,
    newFiles: Record<string, string>,
    openFile: string,
    storageKey: string
  ) {
    const normalized = normalizeSdkFiles(newFiles);
    const current = (await vm.getFsSnapshot()) as Record<string, string> | null;
    const destroy = Object.keys(current ?? {}).filter(p => !(p in normalized));

    await vm.applyFsDiff({ create: normalized, destroy });
    localStorage.setItem(storageKey, JSON.stringify(normalized));

    const primary = this.normalizePath(openFile) || 'src/main.ts';

    // Nudge Monaco: hop to a different file, then back to the target file.
    const open = async (path: string) => {
      try { await (vm as any).editor?.openFile?.(path); } catch { /* noop */ }
    };
    try {
      const alt = Object.keys(normalized).find(p => p !== primary) || 'src/main.ts';
      await open(alt);
      await new Promise(r => setTimeout(r, 16));
      await open(primary);
      (vm as any).editor?.layout?.();
    } catch { /* noop */ }
  }
}
