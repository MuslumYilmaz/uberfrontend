import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
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
import { firstValueFrom } from 'rxjs';
import { Question } from '../../../../core/models/question.model';
import { Tech } from '../../../../core/models/user.model';
import { CodeStorageService } from '../../../../core/services/code-storage.service';
import { makeAngularPreviewHtmlV1 } from '../../../../core/utils/angular-preview-builder';
import { makeReactPreviewHtml } from '../../../../core/utils/react-preview-builder';
import { normalizeSdkFiles } from '../../../../core/utils/snapshot.utils';
import { makeVuePreviewHtml } from '../../../../core/utils/vue-preview-builder';
import { MonacoEditorComponent } from '../../../../monaco-editor.component';

type SdkAsset = {
  files: Record<string, string>;
  dependencies?: Record<string, string>;
  openFile?: string;
};

type TreeNode =
  | { type: 'dir'; name: string; path: string; children: TreeNode[] }
  | { type: 'file'; name: string; path: string; crumb?: string };

@Component({
  selector: 'app-coding-framework-panel',
  standalone: true,
  imports: [CommonModule, MonacoEditorComponent],
  templateUrl: './coding-framework-panel.component.html',
  styleUrls: ['./coding-framework-panel.component.css'],
})
export class CodingFrameworkPanelComponent implements OnInit, OnChanges, OnDestroy {
  @Input({ required: true }) question!: Question;
  @Input({ required: true }) tech!: Tech; // 'angular' | 'react' | 'vue'
  @Input() editorOptions: any;
  /** Normalized solution files from solutionAsset, provided by parent */
  @Input() solutionFilesMap: Record<string, string> = {};

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

  // drag state (for future extensibility; currently only simple layout)
  private rebuildTimer: any = null;
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

  constructor(
    private codeStore: CodeStorageService,
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    private zone: NgZone
  ) { }

  // ---------- lifecycle ----------
  ngOnInit(): void {
    if (this.question && this.tech && this.isFrameworkTech()) {
      this.initFromQuestion();
    }
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
    if (this.rebuildTimer) clearTimeout(this.rebuildTimer);
    try {
      const frameEl = this.previewFrame?.nativeElement;
      if (frameEl?.contentWindow) {
        frameEl.src = 'about:blank';
      }
    } catch { }
  }

  // ---------- public API (called by parent) ----------

  /** Called by parent after question changes (also auto-called on input changes). */
  initFromQuestion(): void {
    const q = this.question;
    if (!q || !this.isFrameworkTech()) return;

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
  applySolutionFiles(): void {
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
    const open = this.pickFirstOpen(nextFiles);

    this.filesMap.set(nextFiles);
    this.openPath.set(open);
    this.frameworkEntryFile = open;
    this.editorContent.set(nextFiles[open] ?? '');

    // Persist via CodeStorageService
    void this.codeStore.setFrameworkBundleAsync(q.id, this.tech as any, nextFiles, open);

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

    void this.codeStore.setFrameworkBundleAsync(q.id, this.tech as any, nextFiles, open);

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

    let starters: Record<string, string> = {};
    let entryHint: string | undefined;

    if (meta?.asset) {
      try {
        const asset = await this.fetchSdkAsset(meta.asset);
        starters = normalizeSdkFiles(asset.files || {});
        entryHint = (meta.openFile || asset.openFile || this.defaultEntry()).replace(/^\/+/, '');
      } catch (e) {
        console.warn('[framework-panel] asset load failed, using fallback', e);
        starters = this.createFrameworkFallbackFiles();
        entryHint = this.defaultEntry();
      }
    } else {
      starters = this.createFrameworkFallbackFiles();
      entryHint = this.defaultEntry();
    }

    if (opts?.forceReset) {
      await this.codeStore.resetFrameworkAsync(q.id, this.tech as any, starters, entryHint);
    }

    const { files, entryFile, restored } =
      await this.codeStore.initFrameworkAsync(q.id, this.tech as any, starters, entryHint);

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
    this.openPath.set(path);
    this.frameworkEntryFile = path;
    this.editorContent.set(files[path] ?? '');
  }

  langFromPath(p: string): 'typescript' | 'javascript' | 'html' | 'css' | 'json' | 'plaintext' {
    const lc = (p || '').toLowerCase();
    if (lc.endsWith('.ts') || lc.endsWith('.tsx')) return 'typescript';
    if (lc.endsWith('.js') || lc.endsWith('.jsx')) return 'javascript';
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

    this.filesMap.update(m => ({ ...m, [path]: code }));
    void this.codeStore.saveFrameworkFileAsync(q.id, this.tech as any, path, code);

    // any edit exits solution/solution-preview modes
    this.viewingSolution.set(false);
    this.showingFrameworkSolutionPreview.set(false);
    this.showRestoreBanner.set(false);

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
    }
  }

  private setPreviewHtml(html: string | null) {
    // cleanup old URL
    const frameEl = this.previewFrame?.nativeElement;
    try {
      const current = this._previewUrl();
      if (current && (current as any).changingThisBreaksApplicationSecurity) {
        // Angular SafeValue → cannot directly revoke; rely on iframe GC.
      }
    } catch { }

    if (!frameEl) {
      // iframe not ready yet; retry once
      requestAnimationFrame(() => {
        if (this.previewFrame?.nativeElement) {
          this.setPreviewHtml(html);
        }
      });
      return;
    }

    if (!html) {
      const doc = frameEl.contentDocument;
      if (doc) {
        doc.open();
        doc.write('<!doctype html><meta charset="utf-8">');
        doc.close();
      }
      this._previewUrl.set(null);
      return;
    }

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    if (frameEl.contentWindow) {
      frameEl.contentWindow.location.replace(url);
    } else {
      frameEl.onload = () => frameEl.contentWindow?.location.replace(url);
      frameEl.src = url;
    }

    this._previewUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
  }

  // ---------- helpers ----------

  private isFrameworkTech(): boolean {
    return this.tech === 'angular' || this.tech === 'react' || this.tech === 'vue';
  }

  private defaultEntry(): string {
    if (this.tech === 'angular') return 'src/app/app.component.ts';
    if (this.tech === 'react') return 'src/App.tsx';
    return 'src/App.ts';
  }

  private pickFirstOpen(files: Record<string, string>): string {
    const dflt = this.defaultEntry();
    if (files[dflt]) return dflt;
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

  private async fetchSdkAsset(url: string): Promise<SdkAsset> {
    const href = new URL(url, document.baseURI).toString();
    return await firstValueFrom(this.http.get<SdkAsset>(href));
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
}