import { Injectable } from '@angular/core';
import sdk from '@stackblitz/sdk';
import { normalizeSdkFiles } from '../utils/snapshot.utils';

@Injectable({ providedIn: 'root' })
export class StackBlitzEmbed {
  private autosaveTimers = new Map<any, number>();

  async fetchAsset(assetUrl: string): Promise<{
    files: Record<string, string>;
    dependencies?: Record<string, string>;
    openFile?: string;
  } | null> {
    try {
      const res = await fetch(assetUrl, { cache: 'no-store' });
      if (!res.ok) return null;
      const json = await res.json();
      return {
        files: normalizeSdkFiles(json),
        dependencies: (json?.dependencies ?? undefined) as Record<string, string> | undefined,
        openFile: (json?.openFile as string | undefined) ?? undefined,
      };
    } catch {
      return null;
    }
  }

  /** Embed project + ensure we persist to localStorage regularly and on teardown. */
  async embedProject(
    host: HTMLElement,
    opts: {
      title: string;
      files: Record<string, string>;
      dependencies?: Record<string, string>;
      openFile: string;
      storageKey: string;
    }
  ): Promise<{ vm: any; cleanup: () => void }> {
    const vm = await sdk.embedProject(
      host,
      {
        template: 'angular-cli',
        title: opts.title,
        description: 'Embedded via StackBlitz SDK',
        files: opts.files,
        dependencies: opts.dependencies,
      },
      { height: '100%', openFile: opts.openFile }
    );

    const saveNow = async () => {
      try {
        const snap = await vm.getFsSnapshot();
        localStorage.setItem(opts.storageKey, JSON.stringify(snap));
      } catch { /* noop */ }
    };

    // Save immediately once (covers quick nav after reset)
    void saveNow();

    // Autosave every 4s
    const t = window.setInterval(saveNow, 4000);
    this.autosaveTimers.set(vm, t);

    // Save when tab is hidden or closing
    const onVis = () => { if (document.hidden) void saveNow(); };
    const onUnload = () => { void saveNow(); };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('beforeunload', onUnload);

    const cleanup = () => {
      // Final flush + cleanup timers/listeners
      void saveNow();
      const timer = this.autosaveTimers.get(vm);
      if (timer) clearInterval(timer);
      this.autosaveTimers.delete(vm);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('beforeunload', onUnload);
    };

    return { vm, cleanup };
  }

  /** Replace files from asset and persist them as the new working snapshot. */
  async replaceFromAsset(vm: any, newFiles: Record<string, string>, openFile: string, storageKey: string) {
    const current = await vm.getFsSnapshot();
    const destroy = Object.keys(current).filter(p => !(p in newFiles));

    await vm.applyFsDiff({ create: newFiles, destroy });
    localStorage.setItem(storageKey, JSON.stringify(newFiles));

    // Hop files so Monaco picks up changes
    const alt = Object.keys(newFiles).find(p => p !== openFile) || 'src/main.ts';
    try {
      await vm.setCurrentFile(alt);
      await new Promise(r => setTimeout(r, 16));
      await vm.setCurrentFile(openFile);
      vm.editor?.layout?.();
    } catch { /* noop */ }
  }
}