import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
  computed,
  signal,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Question } from '../../../../core/models/question.model';
import { Tech } from '../../../../core/models/user.model';
import { CodeStorageService } from '../../../../core/services/code-storage.service';
import { makeAngularPreviewHtmlV1 } from '../../../../core/utils/angular-preview-builder';
import { makeReactPreviewHtml } from '../../../../core/utils/react-preview-builder';
import { fetchSdkAsset, resolveSolutionFiles } from '../../../../core/utils/solution-asset.util';
import { makeVuePreviewHtml } from '../../../../core/utils/vue-preview-builder';
import { MonacoEditorComponent } from '../../../../monaco-editor.component';
import { RestoreBannerComponent } from '../../../../shared/components/restore-banner/restore-banner';

type TreeNode =
  | { type: 'dir'; name: string; path: string; children: TreeNode[] }
  | { type: 'file'; name: string; path: string; crumb?: string };

@Component({
  selector: 'app-coding-framework-panel',
  standalone: true,
  imports: [CommonModule, MonacoEditorComponent, RestoreBannerComponent],
  templateUrl: './coding-framework-panel.component.html',
  styleUrls: ['./coding-framework-panel.component.css'],
})
export class CodingFrameworkPanelComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) question!: Question;
  @Input({ required: true }) tech!: Tech; // 'angular' | 'react' | 'vue'
  @Input() editorOptions: any;
  /** Normalized solution files from solutionAsset, provided by parent */
  @Input() solutionFilesMap: Record<string, string> = {};
  @Input() storageKeyOverride: string | null = null;
  @Input() disablePersistence = false;

  @ViewChild('previewFrame', { read: ElementRef }) previewFrame?: ElementRef<HTMLIFrameElement>;

  // Workspace state
  filesMap = signal<Record<string, string>>({});
  openPath = signal<string>('');
  frameworkEntryFile = '';
  editorContent = signal<string>('');

  // UI: file tree & drawer
  private openDirs = signal<Set<string>>(new Set());
  showFileDrawer = signal(false);

  // Restore banner + solution mode
  showRestoreBanner = signal(false);
  viewingSolution = signal(false);

  // Solution preview (right iframe shows solution instead of user code)
  showingFrameworkSolutionPreview = signal(false);

  // Layout
  isDraggingCols = signal(false);

  // preview url
  private _previewUrl = signal<SafeResourceUrl | null>(null);
  previewUrl = () => this._previewUrl();
  private previewObjectUrl: string | null = null;
  private previewNavId = 0;

  // preview loading
  loadingPreview = signal(true);

  // drag state (for future extensibility; currently only simple layout)
  private rebuildTimer: any = null;
  private persistTimer: any = null;
  private pendingPersist: { key: string; tech: Tech; path: string; code: string } | null = null;
  private userFilesBackup: Record<string, string> | null = null;
  private destroy = false;

  // File tree computed
  fileList = computed(() =>
    Object.keys(this.filesMap()).sort((a, b) => {
      const da = a.split('/').length;
      const db = b.split('/').length;
      if (da !== db) return da - db;
      return a.localeCompare(b);
    })
  );

  treeRoots = computed<TreeNode[]>(() => this.buildTree(this.fileList()));

  currentPath = computed(() => this.openPath() || this.frameworkEntryFile || '');
  currentFileLabel = computed(() => {
    const p = this.currentPath();
    if (!p) return 'Select a file';
    const i = p.lastIndexOf('/');
    return i >= 0 ? p.slice(i + 1) : p;
  });

  // editor | preview oranı (0–1)
  frameworkColsRatio = signal(0.55); // editor ~%55
  frameworkEditorFlex = computed(
    () => `0 0 ${this.frameworkColsRatio() * 100}%`
  );

  isDraggingFrameworkCols = signal(false);

  private draggingFrameworkCols = false;
  private startXFrameworkCols = 0;
  private startFrameworkColsRatio = 0;
  private storageKey(q: Question): string { return (this.storageKeyOverride || '').trim() || q.id; }

  constructor(
    private codeStore: CodeStorageService,
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    private zone: NgZone
  ) { }

  private cancelPendingPersist() {
    if (this.persistTimer) {
      clearTimeout(this.persistTimer);
      this.persistTimer = null;
    }
    this.pendingPersist = null;
  }

  private flushPendingPersist() {
    if (!this.pendingPersist) return;
    if (this.persistTimer) {
      clearTimeout(this.persistTimer);
      this.persistTimer = null;
    }
    const p = this.pendingPersist;
    this.pendingPersist = null;
    if (this.disablePersistence) return;
    void this.codeStore.saveFrameworkFileAsync(p.key, p.tech as any, p.path, p.code);
  }

  private schedulePersist(path: string, code: string) {
    if (this.disablePersistence) return;
    const q = this.question;
    if (!q || !this.isFrameworkTech()) return;
    this.pendingPersist = { key: this.storageKey(q), tech: this.tech, path, code };

    if (this.persistTimer) clearTimeout(this.persistTimer);
    this.persistTimer = setTimeout(() => {
      this.flushPendingPersist();
    }, 250);
  }

  // ---------- lifecycle ----------
  ngOnInit(): void {
    if (this.question && this.tech && this.isFrameworkTech()) {
      this.initFromQuestion();
    }
  }

  ngAfterViewInit() {
    // description splitter’da yaptığın gibi global dinleyici
    this.zone.runOutsideAngular(() => {
      window.addEventListener('pointermove', this.onPointerMoveFrameworkCols);
      window.addEventListener('pointerup', this.onPointerUpFrameworkCols);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.destroy) return;

    if ((changes['question'] || changes['tech']) && this.question && this.tech && this.isFrameworkTech()) {
      this.initFromQuestion();
    }

    // If solution files change while viewing solution/preview, keep behavior sane:
    if (changes['solutionFilesMap'] && this.viewingSolution()) {
      // re-apply updated solution bundle
      this.applySolutionFiles();
    }
  }

  ngOnDestroy(): void {
    this.destroy = true;
    this.flushPendingPersist();
    if (this.persistTimer) clearTimeout(this.persistTimer);
    if (this.rebuildTimer) clearTimeout(this.rebuildTimer);
    try {
      if (this.previewObjectUrl) URL.revokeObjectURL(this.previewObjectUrl);
    } catch { }
    this.previewObjectUrl = null;
    try {
      const frameEl = this.previewFrame?.nativeElement;
      if (frameEl?.contentWindow) {
        frameEl.src = 'about:blank';
      }
    } catch { }

    window.removeEventListener('pointermove', this.onPointerMoveFrameworkCols);
    window.removeEventListener('pointerup', this.onPointerUpFrameworkCols);
  }

  // ---------- public API (called by parent) ----------

  /** Called by parent after question changes (also auto-called on input changes). */
  initFromQuestion(): void {
    this.flushPendingPersist();
    const q = this.question;
    if (!q || !this.isFrameworkTech()) return;

    this.loadingPreview.set(true);
    this.viewingSolution.set(false);
    this.showRestoreBanner.set(false);
    this.showingFrameworkSolutionPreview.set(false);
    this.userFilesBackup = null;

    this.bootstrapWorkspaceFromSdk(q)
      .catch(err => {
        console.error('[framework-panel] initFromQuestion failed', err);
      });
  }

  /** Parent: "Load solution into editor" button from Solution panel. */
  applySolutionFiles(preferredOpenPath?: string): void {
    this.cancelPendingPersist();
    const q = this.question;
    if (!q || !this.isFrameworkTech()) return;

    const sol = this.solutionFilesMap || {};
    const solKeys = Object.keys(sol);
    if (!solKeys.length) {
      console.warn('[framework-panel] No solution files to apply.');
      return;
    }

    // Backup once
    if (!this.userFilesBackup) {
      this.userFilesBackup = { ...this.filesMap() };
    }

    const nextFiles = { ...sol };
    const preferredClean = (preferredOpenPath || '').replace(/^\/+/, '');
    const open =
      (preferredClean && preferredClean in nextFiles && preferredClean) ||
      this.pickFirstOpen(nextFiles);

    this.filesMap.set(nextFiles);
    this.openPath.set(open);
    this.frameworkEntryFile = open;
    this.editorContent.set(nextFiles[open] ?? '');

    // Persist via CodeStorageService
    if (!this.disablePersistence) {
      void this.codeStore.setFrameworkBundleAsync(this.storageKey(q), this.tech as any, nextFiles, open);
    }

    this.viewingSolution.set(true);
    this.showRestoreBanner.set(true);
    this.showingFrameworkSolutionPreview.set(false);

    this.scheduleRebuild();
  }

  /** Parent: "Revert to your code" from restore banner. */
  revertToUserCodeFromBanner(): void {
    const q = this.question;
    if (!q) {
      this.viewingSolution.set(false);
      this.showRestoreBanner.set(false);
      this.userFilesBackup = null;
      return;
    }

    if (!this.userFilesBackup || !Object.keys(this.userFilesBackup).length) {
      this.viewingSolution.set(false);
      this.showRestoreBanner.set(false);
      return;
    }

    const nextFiles = { ...this.userFilesBackup };
    this.filesMap.set(nextFiles);

    const open = this.pickFirstOpen(nextFiles);
    this.openPath.set(open);
    this.frameworkEntryFile = open;
    this.editorContent.set(nextFiles[open] ?? '');

    if (!this.disablePersistence) {
      void this.codeStore.setFrameworkBundleAsync(this.storageKey(q), this.tech as any, nextFiles, open);
    }

    this.viewingSolution.set(false);
    this.showRestoreBanner.set(false);
    this.userFilesBackup = null;

    this.scheduleRebuild();
  }

  /** Parent: CTA "Preview what you need to build" → show solution preview in iframe. */
  openSolutionPreview(): void {
    const sol = this.solutionFilesMap || {};
    if (!this.isFrameworkTech() || !Object.keys(sol).length) return;

    try {
      let html: string | null = null;
      if (this.tech === 'react') {
        html = makeReactPreviewHtml(sol);
      } else if (this.tech === 'angular') {
        html = makeAngularPreviewHtmlV1(sol);
      } else if (this.tech === 'vue') {
        html = makeVuePreviewHtml(sol);
      }

      if (!html) return;

      this.setPreviewHtml(html);
      this.showingFrameworkSolutionPreview.set(true);
    } catch (e) {
      console.error('[framework-panel] openSolutionPreview failed', e);
    }
  }

  /** Parent: close solution preview → go back to user code preview. */
  async closeSolutionPreview(): Promise<void> {
    if (!this.showingFrameworkSolutionPreview()) return;
    this.showingFrameworkSolutionPreview.set(false);
    try {
      await this.rebuildFrameworkPreview();
    } catch (e) {
      console.error('[framework-panel] closeSolutionPreview rebuild failed', e);
      this.setPreviewHtml(null);
    }
  }

  /** Parent: Reset only the framework workspace to starter state. */
  async resetToStarter(): Promise<void> {
    const q = this.question;
    if (!q || !this.isFrameworkTech()) return;

    this.cancelPendingPersist();
    this.viewingSolution.set(false);
    this.showRestoreBanner.set(false);
    this.showingFrameworkSolutionPreview.set(false);
    this.userFilesBackup = null;

    await this.bootstrapWorkspaceFromSdk(q, { forceReset: true });
  }

  dismissRestoreBanner(): void {
    this.showRestoreBanner.set(false);
    if (!this.viewingSolution()) this.userFilesBackup = null;
  }

  // ---------- internal: workspace bootstrap ----------

  private async bootstrapWorkspaceFromSdk(
    q: Question,
    opts?: { forceReset?: boolean }
  ): Promise<void> {
    const meta = (q as any).sdk as { asset?: string; openFile?: string } | undefined;
    const key = this.storageKey(q);

    let starters: Record<string, string> = {};
    let entryHint: string;

    if (meta?.asset) {
      try {
        // Use shared util to fetch the asset
        const raw = await fetchSdkAsset(this.http, meta.asset);

        // Prefer explicit openFile from meta, otherwise asset.openFile
        const { files, initialPath } = resolveSolutionFiles({
          ...raw,
          openFile: meta.openFile || raw.openFile,
        });

        if (!Object.keys(files).length) {
          throw new Error('Empty sdk asset files');
        }

        starters = files;
        entryHint = initialPath || this.defaultEntry();
      } catch (e) {
        console.warn('[framework-panel] asset load failed, using fallback', e);
        starters = this.createFrameworkFallbackFiles();
        entryHint = this.defaultEntry();
      }
    } else {
      // No sdk asset → fall back to minimal starter set
      starters = this.createFrameworkFallbackFiles();
      entryHint = this.defaultEntry();
    }

    // If caller requested a hard reset, overwrite stored workspace
    if (opts?.forceReset && !this.disablePersistence) {
      await this.codeStore.resetFrameworkAsync(key, this.tech as any, starters, entryHint);
    }

    if (this.disablePersistence) {
      const files = starters;
      const entryFile = entryHint;
      this.filesMap.set(files);
      this.frameworkEntryFile = entryFile;
      this.openAllDirsFromPaths(Object.keys(files));
      this.openPath.set(entryFile);
      this.editorContent.set(files[entryFile] ?? '');

      await this.rebuildFrameworkPreview();

      this.showRestoreBanner.set(false);
      this.viewingSolution.set(false);
      this.showingFrameworkSolutionPreview.set(false);
      return;
    }

    // Initialize from storage (may restore previous work)
    const { files, entryFile, restored } =
      await this.codeStore.initFrameworkAsync(key, this.tech as any, starters, entryHint);

    this.filesMap.set(files);
    this.frameworkEntryFile = entryFile;
    this.openAllDirsFromPaths(Object.keys(files));
    this.openPath.set(entryFile);
    this.editorContent.set(files[entryFile] ?? '');

    await this.rebuildFrameworkPreview();

    this.showRestoreBanner.set(restored);
    this.viewingSolution.set(false);
    this.showingFrameworkSolutionPreview.set(false);
  }

  // ---------- file-tree + editor handlers ----------

  isOpen = (p: string) => this.openDirs().has(p);

  toggleDir(p: string) {
    const s = new Set(this.openDirs());
    if (s.has(p)) s.delete(p); else s.add(p);
    this.openDirs.set(s);
  }

  toggleFiles() { this.showFileDrawer.set(!this.showFileDrawer()); }
  closeFiles() { this.showFileDrawer.set(false); }

  openFile(path: string) {
    const files = this.filesMap();
    if (!path || !(path in files)) return;
    this.flushPendingPersist();
    this.openPath.set(path);
    this.frameworkEntryFile = path;
    this.editorContent.set(files[path] ?? '');
  }

  langFromPath(p: string): 'typescript' | 'javascript' | 'html' | 'css' | 'json' | 'plaintext' {
    const lc = (p || '').toLowerCase();

    if (lc.endsWith('.ts') || lc.endsWith('.tsx')) return 'typescript';
    if (lc.endsWith('.js') || lc.endsWith('.jsx')) return 'javascript';
    if (lc.endsWith('.vue')) return 'html';
    if (lc.endsWith('.html')) return 'html';
    if (lc.endsWith('.css') || lc.endsWith('.scss')) return 'css';
    if (lc.endsWith('.json')) return 'json';

    return 'plaintext';
  }
  onFrameworkCodeChange(code: string) {
    this.editorContent.set(code);
    const q = this.question;
    if (!q) return;

    const path = this.openPath() || this.frameworkEntryFile;
    if (!path) return;

    // update current file content
    this.filesMap.update(m => ({ ...m, [path]: code }));

    // persist user changes
    this.schedulePersist(path, code);

    // If user was viewing the solution, mark it as edited
    // but keep the restore banner visible so they can still revert manually.
    if (this.viewingSolution()) {
      this.viewingSolution.set(false);
      // Do NOT hide the banner here — user can still click "Revert to your code"
      // this.showRestoreBanner.set(false);
    }

    // Close solution preview (if open)
    if (this.showingFrameworkSolutionPreview()) {
      this.showingFrameworkSolutionPreview.set(false);
    }

    this.scheduleRebuild();
  }

  // ---------- preview ----------

  private scheduleRebuild() {
    if (this.rebuildTimer) clearTimeout(this.rebuildTimer);
    this.rebuildTimer = setTimeout(() => {
      this.rebuildFrameworkPreview().catch(err => {
        console.error('[framework-panel] rebuild failed', err);
        this.setPreviewHtml(null);
      });
    }, 200);
  }

  async rebuildFrameworkPreview(): Promise<void> {
    this.loadingPreview.set(true);
    try {
      const files = this.filesMap();

      let html: string | null = null;

      if (this.tech === 'react') {
        html = makeReactPreviewHtml(files);
      } else if (this.tech === 'angular') {
        html = makeAngularPreviewHtmlV1(files);
      } else if (this.tech === 'vue') {
        html = makeVuePreviewHtml(files);
      } else {
        html = files['index.html'] || files['public/index.html'] || '';
      }

      this.setPreviewHtml(html || null);
    } catch (e) {
      console.error('[framework-panel] preview build failed', e);
      this.setPreviewHtml(null);
      this.loadingPreview.set(false);
    }
  }

  private setPreviewHtml(html: string | null) {
    const frameEl = this.previewFrame?.nativeElement;
    if (!frameEl) {
      // iframe not ready yet; retry once
      requestAnimationFrame(() => {
        if (this.previewFrame?.nativeElement) {
          this.setPreviewHtml(html);
        }
      });
      return;
    }

    const prevUrl = this.previewObjectUrl;
    const navId = ++this.previewNavId;

    if (!html) {
      try {
        frameEl.src = 'about:blank';
      } catch { }
      this._previewUrl.set(null);
      this.previewObjectUrl = null;
      this.loadingPreview.set(false);
      if (prevUrl) {
        try { URL.revokeObjectURL(prevUrl); } catch { }
      }
      return;
    }

    this.loadingPreview.set(true);

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    this.previewObjectUrl = url;
    this._previewUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));

    frameEl.onload = () => {
      if (this.destroy) return;
      if (navId !== this.previewNavId) return;
      this.zone.run(() => this.loadingPreview.set(false));
      if (prevUrl && prevUrl !== url) {
        try { URL.revokeObjectURL(prevUrl); } catch { }
      }
    };

    frameEl.src = url;
  }

  // ---------- helpers ----------

  private isFrameworkTech(): boolean {
    return this.tech === 'angular' || this.tech === 'react' || this.tech === 'vue';
  }

  private defaultEntry(): string {
    if (this.tech === 'angular') return 'src/app/app.component.ts';
    if (this.tech === 'react') return 'src/App.tsx';
    if (this.tech === 'vue') return 'src/App.vue';
    return 'src/App.ts';
  }

  private pickFirstOpen(files: Record<string, string>): string {
    const dflt = this.defaultEntry();
    if (files[dflt]) return dflt;

    if (this.tech === 'vue') {
      if (files['src/App.vue']) return 'src/App.vue';
      if (files['App.vue']) return 'App.vue';

      const anyVue = Object.keys(files).find(p =>
        p.toLowerCase().endsWith('.vue')
      );
      if (anyVue) return anyVue;
    }

    const candidates = [
      'src/main.tsx', 'src/main.ts', 'src/index.tsx', 'src/index.ts',
      'src/App.tsx', 'src/App.ts', 'src/App.js', 'src/App.vue',
      'src/app/app.component.ts'
    ];

    const found = candidates.find(f => f in files);
    if (found) return found;

    const [first] = Object.keys(files);
    return (first || dflt).replace(/^\/+/, '');
  }

  private createFrameworkFallbackFiles(): Record<string, string> {
    if (this.tech === 'react') {
      return {
        'public/index.html': `<!doctype html><html><head><meta charset="utf-8"><title>React</title></head><body><div id="root">React preview placeholder</div></body></html>`,
        'src/App.tsx': `export default function App(){ return <div>Hello React</div> }`,
      };
    } else if (this.tech === 'vue') {
      return {
        'index.html': `<!doctype html><html><head><meta charset="utf-8"><title>Vue</title></head><body><div id="app">Vue preview placeholder</div></body></html>`,
        'src/App.vue': `<template><div>Hello Vue</div></template>`,
      };
    } else {
      return {
        'src/app/app.component.ts': `import { Component } from '@angular/core';\n@Component({selector:'app-root', standalone:true, template:\`<h1>Hello Angular</h1>\`})\nexport class AppComponent{}`,
        'src/main.ts': `import { bootstrapApplication } from '@angular/platform-browser';\nimport { AppComponent } from './app/app.component';\nbootstrapApplication(AppComponent);`,
        'index.html': `<!doctype html><html><head><meta charset="utf-8"><title>Angular</title></head><body><app-root>Angular preview placeholder</app-root></body></html>`,
      };
    }
  }

  private buildTree(paths: string[]): TreeNode[] {
    const root: Record<string, any> = {};
    for (const full of paths) {
      const parts = full.split('/').filter(Boolean);
      let cur = root;
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isFile = i === parts.length - 1;
        cur[part] = cur[part] || (isFile ? { __file: full } : { __dir: true });
        cur = isFile ? cur : cur[part];
      }
    }

    const toNodes = (node: any, prefix: string): TreeNode[] => {
      const dirs: TreeNode[] = [];
      const files: TreeNode[] = [];

      for (const key of Object.keys(node).sort()) {
        const v = node[key];
        if (v?.__dir) {
          const path = prefix ? `${prefix}/${key}` : key;
          dirs.push({ type: 'dir', name: key, path, children: toNodes(v, path) });
        } else if (v?.__file) {
          const full = v.__file as string;
          const name = key;
          const crumb = prefix || '';
          files.push({ type: 'file', name, path: full, crumb });
        }
      }
      return [...dirs, ...files];
    };

    return toNodes(root, '');
  }

  private openAllDirsFromPaths(paths: string[]) {
    const opened = new Set(this.openDirs());
    for (const full of paths) {
      const parts = full.split('/').filter(Boolean);
      let pref = '';
      for (let i = 0; i < parts.length - 1; i++) {
        pref = pref ? `${pref}/${parts[i]}` : parts[i];
        opened.add(pref);
      }
    }
    this.openDirs.set(opened);
  }

  // --- VERTICAL SPLITTER (editor | preview) ---

  startFrameworkColsDrag = (ev: PointerEvent) => {
    ev.preventDefault();
    this.draggingFrameworkCols = true;
    this.isDraggingFrameworkCols.set(true);
    this.startXFrameworkCols = ev.clientX;
    this.startFrameworkColsRatio = this.frameworkColsRatio();

    (ev.target as HTMLElement).setPointerCapture(ev.pointerId);
    const stop = () => {
      this.draggingFrameworkCols = false;
      this.isDraggingFrameworkCols.set(false);
      document.removeEventListener('pointerup', stop);
    };
    document.addEventListener('pointerup', stop);
  };

  private onPointerMoveFrameworkCols = (ev: PointerEvent) => {
    if (!this.draggingFrameworkCols) return;

    const totalWidth = window.innerWidth;
    const delta = ev.clientX - this.startXFrameworkCols;

    let next = this.startFrameworkColsRatio + delta / totalWidth;

    // description splitter’daki mantığa benzer clamp
    const min = 0.25; // editor min %25
    const max = 0.8;  // editor max %80
    if (next < min) next = min;
    if (next > max) next = max;

    this.zone.run(() => this.frameworkColsRatio.set(next));
  };

  private onPointerUpFrameworkCols = () => {
    if (!this.draggingFrameworkCols) return;
    this.draggingFrameworkCols = false;
    this.isDraggingFrameworkCols.set(false);
  };
}
