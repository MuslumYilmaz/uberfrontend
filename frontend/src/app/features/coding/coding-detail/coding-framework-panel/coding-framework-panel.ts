import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  PLATFORM_ID,
  SimpleChanges,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FrameworkTest, FrameworkTestStep, Question } from '../../../../core/models/question.model';
import { Tech } from '../../../../core/models/user.model';
import { AttemptInsightsService } from '../../../../core/services/attempt-insights.service';
import { CodeStorageService } from '../../../../core/services/code-storage.service';
import { PreviewBuilderService } from '../../../../core/services/preview-builder.service';
import { computeFrameworkContentVersion } from '../../../../core/utils/content-version.util';
import { classifyFailureCategory } from '../../../../core/utils/error-taxonomy.util';
import { createFailureSignature, normalizeErrorLine, stableHash } from '../../../../core/utils/failure-signature.util';
import { fetchSdkAsset, resolveSolutionFiles } from '../../../../core/utils/solution-asset.util';
import {
  dismissUpdateBanner,
  isUpdateBannerDismissed,
  listOtherVersions,
  makeDraftKey,
  type DraftIndexEntry,
  upsertDraftIndexVersion,
} from '../../../../core/utils/versioned-drafts.util';
import { MonacoEditorComponent } from '../../../../monaco-editor.component';
import { DraftUpdateBannerComponent } from '../../../../shared/components/draft-update-banner/draft-update-banner';
import { RestoreBannerComponent } from '../../../../shared/components/restore-banner/restore-banner';
import { CodeSnapshotComponent } from '../../../../shared/ui/code-snapshot/code-snapshot.component';
import { FaGlyphComponent } from '../../../../shared/ui/icon/fa-glyph.component';
import { TestResult } from '../../console-logger/console-logger.component';

type TreeNode =
  | { type: 'dir'; name: string; path: string; children: TreeNode[] }
  | { type: 'file'; name: string; path: string; crumb?: string };

type FrameworkCheckMount = {
  frame: HTMLIFrameElement;
  doc: Document;
  cleanup: () => void;
};

export type FrameworkCheckRunEvent = {
  questionId: string;
  passed: boolean;
  results: TestResult[];
};

@Component({
  selector: 'app-coding-framework-panel',
  standalone: true,
  imports: [CommonModule, MonacoEditorComponent, RestoreBannerComponent, DraftUpdateBannerComponent, CodeSnapshotComponent, FaGlyphComponent],
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
  @Input() liteMode = false;
  @Input() deferPreview = false;
  @Output() requestEditorUpgrade = new EventEmitter<void>();
  @Output() frameworkCheckRun = new EventEmitter<FrameworkCheckRunEvent>();

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

  // Draft versioning (question updates)
  private baseDraftKey = signal<string>('');
  private currentContentVersion = signal<string>('');
  private activeDraftVersion = signal<string>('');
  isViewingOlderVersion = computed(() => {
    const cur = this.currentContentVersion();
    const active = this.activeDraftVersion();
    return !!cur && !!active && cur !== active;
  });
  availableOlderDrafts = signal<DraftIndexEntry[]>([]);
  showUpdateBanner = signal(false);

  // Solution preview (right iframe shows solution instead of user code)
  showingFrameworkSolutionPreview = signal(false);

  // Layout
  isDraggingCols = signal(false);

  // preview url
  private _previewUrl = signal<SafeResourceUrl | null>(null);
  previewUrl = () => this._previewUrl();
  private previewObjectUrl: string | null = null;
  private previewNavId = 0;
  private expectedPreviewReadyToken: string | null = null;
  private previewReadyFallbackTimer?: number;
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly attemptInsights = inject(AttemptInsightsService, { optional: true });
  useMonaco = signal(true);
  monacoLoadFailed = signal(false);
  editorReady = signal(false);
  previewReady = signal(false);

  // preview loading
  loadingPreview = signal(true);
  frameworkChecks = signal<FrameworkTest[]>([]);
  frameworkChecksRunning = signal(false);
  frameworkCheckResults = signal<TestResult[]>([]);
  frameworkChecksRan = signal(false);

  // drag state (for future extensibility; currently only simple layout)
  private rebuildTimer: any = null;
  private deferredPreviewTimer?: number;
  private persistTimer: any = null;
  private pendingPersist: { key: string; tech: Tech; path: string; code: string } | null = null;
  private userFilesBackup: Record<string, string> | null = null;
  private latestStarters: Record<string, string> | null = null;
  private latestEntryHint = '';
  private destroy = false;
  private frameworkCheckReadyTimeoutMs = 8000;

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
  private baseStorageKey(q: Question): string { return (this.storageKeyOverride || '').trim() || q.id; }
  private storageKey(q: Question): string {
    const baseKey = this.baseStorageKey(q);
    const v = String(this.activeDraftVersion() || '').trim();
    return v ? makeDraftKey(baseKey, v) : baseKey;
  }

  constructor(
    private codeStore: CodeStorageService,
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    private zone: NgZone,
    private previewBuilder: PreviewBuilderService
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
    void this.codeStore.saveFrameworkFileAsync(p.key, p.tech as any, p.path, p.code, { allowEmpty: true });
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
    this.configureLiteEditors();
  }

  ngAfterViewInit() {
    if (!this.isBrowser) return;
    // description splitter’da yaptığın gibi global dinleyici
    this.zone.runOutsideAngular(() => {
      window.addEventListener('pointermove', this.onPointerMoveFrameworkCols);
      window.addEventListener('pointerup', this.onPointerUpFrameworkCols);
      window.addEventListener('message', this.onPreviewMessage);
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
    if (changes['liteMode']) {
      this.configureLiteEditors();
    }
  }

  ngOnDestroy(): void {
    this.destroy = true;
    this.flushPendingPersist();
    if (this.persistTimer) clearTimeout(this.persistTimer);
    if (this.rebuildTimer) clearTimeout(this.rebuildTimer);
    if (this.deferredPreviewTimer) {
      clearTimeout(this.deferredPreviewTimer);
      this.deferredPreviewTimer = undefined;
    }
    this.clearPreviewReadyFallback();
    try {
      if (this.previewObjectUrl) URL.revokeObjectURL(this.previewObjectUrl);
    } catch { }
    this.previewObjectUrl = null;
    this.expectedPreviewReadyToken = null;
    try {
      const frameEl = this.previewFrame?.nativeElement;
      if (frameEl?.contentWindow) {
        frameEl.src = 'about:blank';
      }
    } catch { }

    if (this.isBrowser) {
      window.removeEventListener('pointermove', this.onPointerMoveFrameworkCols);
      window.removeEventListener('pointerup', this.onPointerUpFrameworkCols);
      window.removeEventListener('message', this.onPreviewMessage);
    }
  }

  private configureLiteEditors() {
    if (!this.isBrowser) {
      this.useMonaco.set(false);
      return;
    }
    if (!this.monacoLoadFailed()) {
      this.useMonaco.set(!this.liteMode);
    }
    this.editorReady.set(false);
  }

  onEditorReady() {
    this.editorReady.set(true);
  }

  onEditorLoadFailed(): void {
    this.monacoLoadFailed.set(true);
    this.useMonaco.set(false);
    this.editorReady.set(false);
  }

  frameworkCheckPassedCount(): number {
    return this.frameworkCheckResults().filter(result => result.passed).length;
  }

  // ---------- public API (called by parent) ----------

  /** Called by parent after question changes (also auto-called on input changes). */
  initFromQuestion(): void {
    this.flushPendingPersist();
    const q = this.question;
    if (!q || !this.isFrameworkTech()) return;
    this.previewReady.set(!this.deferPreview);
    this.frameworkChecks.set(this.normalizeFrameworkTests(q));
    this.clearFrameworkCheckResults();

    if (!this.isBrowser) {
      this.filesMap.set({});
      this.openPath.set('');
      this.frameworkEntryFile = '';
      this.editorContent.set('');
      this.loadingPreview.set(false);
      return;
    }

    this.loadingPreview.set(true);
    this.viewingSolution.set(false);
    this.showRestoreBanner.set(false);
    this.showingFrameworkSolutionPreview.set(false);
    this.userFilesBackup = null;

    this.bootstrapWorkspaceFromSdk(q)
      .catch(() => { })
      .finally(() => {
        this.scheduleDeferredPreview();
      });
  }

  /** Parent: "Load solution into editor" button from Solution panel. */
  applySolutionFiles(preferredOpenPath?: string): void {
    this.flushPendingPersist();
    const q = this.question;
    if (!q || !this.isFrameworkTech()) return;
    this.ensurePreviewReady();

    const sol = this.solutionFilesMap || {};
    const solKeys = Object.keys(sol);
    if (!solKeys.length) {
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

    this.viewingSolution.set(true);
    this.showRestoreBanner.set(true);
    this.showingFrameworkSolutionPreview.set(false);
    this.clearFrameworkCheckResults();

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
    this.ensurePreviewReady();

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
    this.clearFrameworkCheckResults();

    this.scheduleRebuild();
  }

  /** Parent: CTA "Preview what you need to build" → show solution preview in iframe. */
  async openSolutionPreview(): Promise<void> {
    const sol = this.solutionFilesMap || {};
    if (!this.isFrameworkTech() || !Object.keys(sol).length) return;
    this.ensurePreviewReady();

    try {
      const html = await this.previewBuilder.build(this.tech as 'react' | 'angular' | 'vue', sol);

      if (!html) return;

      this.setPreviewHtml(html);
      this.showingFrameworkSolutionPreview.set(true);
    } catch (e) {
    }
  }

  /** Parent: close solution preview → go back to user code preview. */
  async closeSolutionPreview(): Promise<void> {
    if (!this.showingFrameworkSolutionPreview()) return;
    this.ensurePreviewReady();
    this.showingFrameworkSolutionPreview.set(false);
    try {
      if (this.shouldBuildPreview()) {
        await this.rebuildFrameworkPreview();
      } else {
        this.setPreviewHtml(null);
        this.loadingPreview.set(true);
      }
    } catch (e) {
      this.setPreviewHtml(null);
    }
  }

  /** Parent: Reset only the framework workspace to starter state. */
  async resetToStarter(): Promise<void> {
    const q = this.question;
    if (!q || !this.isFrameworkTech()) return;
    this.ensurePreviewReady();

    this.cancelPendingPersist();
    this.viewingSolution.set(false);
    this.showRestoreBanner.set(false);
    this.showingFrameworkSolutionPreview.set(false);
    this.userFilesBackup = null;
    this.clearFrameworkCheckResults();

    await this.bootstrapWorkspaceFromSdk(q, { forceReset: true });
  }

  dismissRestoreBanner(): void {
    this.showRestoreBanner.set(false);
    if (!this.viewingSolution()) this.userFilesBackup = null;
  }

  // ---------- draft-update banner actions ----------

  dismissDraftUpdateBanner(): void {
    const baseKey = this.baseDraftKey();
    const current = this.currentContentVersion();
    if (baseKey && current) dismissUpdateBanner(baseKey, current);
    this.showUpdateBanner.set(false);
  }

  backToLatestDraft(): void {
    if (!this.isViewingOlderVersion()) return;
    this.flushPendingPersist();
    this.initFromQuestion();
  }

  async openOlderDraft(versionRaw: string): Promise<void> {
    const version = String(versionRaw ?? '').trim();
    const q = this.question;
    if (!q || !version || !this.isFrameworkTech()) return;
    if (this.disablePersistence) return;
    this.ensurePreviewReady();

    const baseKey = this.baseDraftKey() || this.baseStorageKey(q);
    const currentVersion = this.currentContentVersion();
    if (currentVersion && version === currentVersion) {
      this.backToLatestDraft();
      return;
    }

    // Persist pending changes for the current draft, then switch.
    this.flushPendingPersist();

    this.loadingPreview.set(true);
    this.viewingSolution.set(false);
    this.showRestoreBanner.set(false);
    this.showingFrameworkSolutionPreview.set(false);
    this.userFilesBackup = null;

    this.activeDraftVersion.set(version);
    const storageKey = makeDraftKey(baseKey, version);
    const snap = await this.codeStore.getFrameworkDraftSnapshotAsync(this.tech as any, storageKey);
    if (!snap || !Object.keys(snap.files || {}).length) {
      this.initFromQuestion();
      return;
    }

    const visibleFiles: Record<string, string> = {};
    let restored = false;
    for (const [path, st] of Object.entries(snap.files)) {
      const base = st.baseline ?? '';
      const code = st.code ?? '';
      const visible = code || base || '';
      visibleFiles[path] = visible;
      if (code && base && code.trim() !== base.trim()) restored = true;
    }

    const entry = snap.entryFile && visibleFiles[snap.entryFile] ? snap.entryFile : this.pickFirstOpen(visibleFiles);

    this.filesMap.set(visibleFiles);
    this.openAllDirsFromPaths(Object.keys(visibleFiles));
    this.openPath.set(entry);
    this.frameworkEntryFile = entry;
    this.editorContent.set(visibleFiles[entry] ?? '');

    await this.rebuildFrameworkPreview().catch(() => this.setPreviewHtml(null));
    this.showRestoreBanner.set(restored);
    this.loadingPreview.set(false);
  }

  async copyDraftIntoLatest(versionRaw: string): Promise<void> {
    const fromVersion = String(versionRaw ?? '').trim();
    const q = this.question;
    if (!q || !fromVersion || !this.isFrameworkTech()) return;
    if (this.disablePersistence) return;

    const baseKey = this.baseDraftKey() || this.baseStorageKey(q);
    const currentVersion = this.currentContentVersion();
    if (!currentVersion) return;

    const fromKey = makeDraftKey(baseKey, fromVersion);
    const toKey = makeDraftKey(baseKey, currentVersion);

    const snap = await this.codeStore.getFrameworkDraftSnapshotAsync(this.tech as any, fromKey);
    if (!snap || !Object.keys(snap.files || {}).length) return;

    const starters = this.latestStarters || {};
    const allowed = new Set(Object.keys(starters || {}).map((p) => String(p).replace(/^\/+/, '')));

    const writes: Array<Promise<void>> = [];
    for (const [pathRaw, st] of Object.entries(snap.files || {})) {
      const path = String(pathRaw).replace(/^\/+/, '');
      if (allowed.size && !allowed.has(path)) continue;
      const visible = (st.code || st.baseline || '').toString();
      writes.push(this.codeStore.saveFrameworkFileAsync(toKey, this.tech as any, path, visible, { force: true }));
    }

    await Promise.all(writes).catch(() => { });

    // Reload latest to show the copied content (and preserve baselines/starter merging).
    this.initFromQuestion();
  }

  copyActiveDraftIntoLatest(): Promise<void> {
    return this.copyDraftIntoLatest(this.activeDraftVersion());
  }

  // ---------- internal: workspace bootstrap ----------

  private async bootstrapWorkspaceFromSdk(
    q: Question,
    opts?: { forceReset?: boolean }
  ): Promise<void> {
    if (!this.isBrowser) {
      this.loadingPreview.set(false);
      return;
    }
    const meta = (q as any).sdk as { asset?: string; openFile?: string } | undefined;
    const baseKey = this.baseStorageKey(q);

    let starters: Record<string, string> = {};
    let entryHint: string;
    let dependencies: Record<string, string> | undefined;

    if (meta?.asset) {
      try {
        // Use shared util to fetch the asset
        const raw = await fetchSdkAsset(this.http, meta.asset);
        dependencies = raw?.dependencies;

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
        starters = this.createFrameworkFallbackFiles();
        entryHint = this.defaultEntry();
      }
    } else {
      // No sdk asset → fall back to minimal starter set
      starters = this.createFrameworkFallbackFiles();
      entryHint = this.defaultEntry();
    }

    // Compute the version for draft keying (id + contentVersion).
    const contentVersion = computeFrameworkContentVersion({
      files: starters,
      entryFile: entryHint,
      dependencies,
      contentVersion: (q as any)?.contentVersion ?? null,
    });
    this.baseDraftKey.set(baseKey);
    this.currentContentVersion.set(contentVersion);
    this.activeDraftVersion.set(contentVersion);
    const key = this.storageKey(q);
    this.latestStarters = { ...starters };
    this.latestEntryHint = entryHint;

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

      if (this.shouldBuildPreview()) {
        await this.rebuildFrameworkPreview();
      } else {
        this.loadingPreview.set(false);
        this.setPreviewHtml(null);
      }

      this.showRestoreBanner.set(false);
      this.viewingSolution.set(false);
      this.showingFrameworkSolutionPreview.set(false);
      return;
    }

    // Backward-compat: archive legacy (unversioned) draft if it exists.
    const now = new Date().toISOString();
    const legacySnap = await this.codeStore.getFrameworkDraftSnapshotAsync(this.tech as any, baseKey);
    if (legacySnap) {
      const legacyKey = makeDraftKey(baseKey, 'legacy');
      await this.codeStore.cloneFrameworkBundleAsync(this.tech as any, baseKey, legacyKey).catch(() => false);
      upsertDraftIndexVersion(baseKey, { version: 'legacy', updatedAt: legacySnap.updatedAt || now }, { latestVersion: contentVersion });
    }

    const currentSnap = await this.codeStore.getFrameworkDraftSnapshotAsync(this.tech as any, key);
    const idx = upsertDraftIndexVersion(
      baseKey,
      { version: contentVersion, updatedAt: currentSnap?.updatedAt || now },
      { latestVersion: contentVersion }
    );
    const others = listOtherVersions(idx, contentVersion);
    this.availableOlderDrafts.set(others);
    this.showUpdateBanner.set(others.length > 0 && !isUpdateBannerDismissed(baseKey, contentVersion));

    // Initialize from storage (may restore previous work)
    const { files, entryFile, restored } =
      await this.codeStore.initFrameworkAsync(key, this.tech as any, starters, entryHint);

    this.filesMap.set(files);
    this.frameworkEntryFile = entryFile;
    this.openAllDirsFromPaths(Object.keys(files));
    this.openPath.set(entryFile);
    this.editorContent.set(files[entryFile] ?? '');

    if (this.shouldBuildPreview()) {
      await this.rebuildFrameworkPreview();
    } else {
      this.setPreviewHtml(null);
      this.loadingPreview.set(true);
    }

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
    this.clearFrameworkCheckResults();

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

    this.ensurePreviewReady();
    this.scheduleRebuild();
  }

  // ---------- preview ----------

  private ensurePreviewReady() {
    if (!this.deferPreview || this.previewReady()) return;
    this.previewReady.set(true);
  }

  private scheduleDeferredPreview() {
    if (!this.isBrowser || !this.deferPreview || this.previewReady()) return;
    if (this.deferredPreviewTimer) return;
    this.deferredPreviewTimer = window.setTimeout(() => {
      this.deferredPreviewTimer = undefined;
      if (!this.deferPreview) return;
      this.previewReady.set(true);
      this.scheduleRebuild();
    }, 500);
  }

  private shouldBuildPreview(): boolean {
    return !this.deferPreview || this.previewReady();
  }

  private scheduleRebuild() {
    if (!this.shouldBuildPreview()) return;
    if (this.rebuildTimer) clearTimeout(this.rebuildTimer);
    this.rebuildTimer = setTimeout(() => {
      this.rebuildFrameworkPreview().catch(err => {
        this.setPreviewHtml(null);
      });
    }, 200);
  }

  async rebuildFrameworkPreview(): Promise<void> {
    this.ensurePreviewReady();
    this.loadingPreview.set(true);
    try {
      const files = this.filesMap();

      const html = await this.previewBuilder.build(this.tech as 'react' | 'angular' | 'vue', files);
      this.setPreviewHtml(html || null);
    } catch (e) {
      this.setPreviewHtml(null);
      this.loadingPreview.set(false);
    }
  }

  async runFrameworkChecks(options?: { emitCompletion?: boolean }): Promise<TestResult[]> {
    const q = this.question;
    const checks = this.frameworkChecks();
    if (!q || !this.isBrowser || !this.isFrameworkTech() || !checks.length) {
      return [];
    }

    this.ensurePreviewReady();
    this.flushPendingPersist();
    this.frameworkChecksRunning.set(true);
    this.frameworkChecksRan.set(true);
    this.frameworkCheckResults.set([]);

    let mount: FrameworkCheckMount | null = null;
    let results: TestResult[] = [];

    try {
      const files = this.filesMap();
      const html = await this.previewBuilder.build(this.tech as 'react' | 'angular' | 'vue', files);
      if (!html) {
        throw new Error('Preview build returned empty HTML');
      }

      mount = await this.mountFrameworkScratchDoc(html);
      results = [];
      for (const check of checks) {
        results.push(await this.executeFrameworkCheck(check, mount.doc));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error || 'Framework checks failed');
      results = [{
        name: 'Framework checks',
        passed: false,
        error: message || 'Framework checks failed',
      }];
    } finally {
      mount?.cleanup();
      this.frameworkChecksRunning.set(false);
      this.frameworkCheckResults.set(results);
      this.recordFrameworkAttempt(q, results);
      if (options?.emitCompletion !== false) {
        this.frameworkCheckRun.emit({
          questionId: q.id,
          passed: results.length > 0 && results.every((result) => result.passed),
          results,
        });
      }
    }

    return results;
  }

  private async executeFrameworkCheck(check: FrameworkTest, doc: Document): Promise<TestResult> {
    try {
      const steps = Array.isArray(check.steps) ? check.steps : [];
      if (!steps.length) {
        throw new Error('No check steps configured');
      }
      for (const step of steps) {
        await this.executeFrameworkCheckStep(step, doc);
      }
      return { name: check.name || check.id || 'Framework check', passed: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error || 'Check failed');
      return {
        name: check.name || check.id || 'Framework check',
        passed: false,
        error: message || 'Check failed',
      };
    }
  }

  private async executeFrameworkCheckStep(step: FrameworkTestStep, doc: Document): Promise<void> {
    const type = String(step.type || step.action || '').trim();
    const selector = String(step.selector || '').trim();
    if (!selector) {
      throw new Error(`${type || 'step'} is missing a selector`);
    }

    if (type === 'waitForText') {
      await this.waitForStepText(doc, step);
      return;
    }
    if (type === 'waitForCount') {
      await this.waitForStepCount(doc, step);
      return;
    }
    if (type === 'expectCount') {
      this.assertStepCount(doc, step);
      return;
    }

    const el = this.queryStepElement(doc, step);
    if (!el) {
      throw new Error(`${selector} was not found`);
    }

    if (type === 'expectExists') {
      return;
    }
    if (type === 'expectText') {
      this.assertStepText(el, step);
      return;
    }
    if (type === 'setValue') {
      this.setStepValue(el, step);
      await this.delay(50);
      return;
    }
    if (type === 'expectValue') {
      this.assertStepValue(el, step);
      return;
    }
    if (type === 'expectDisabled') {
      const expected = step.disabled !== false;
      const actual = this.isElementDisabled(el);
      if (actual !== expected) {
        throw new Error(`${selector} expected ${expected ? 'disabled' : 'enabled'} but was ${actual ? 'disabled' : 'enabled'}`);
      }
      return;
    }
    if (type === 'expectAttribute') {
      this.assertStepAttribute(el, step);
      return;
    }
    if (type === 'expectClass') {
      this.assertStepClass(el, step);
      return;
    }
    if (type === 'click') {
      const clickable = el as HTMLElement & { click?: () => void };
      if (typeof clickable.click !== 'function') {
        throw new Error(`${selector} is not clickable`);
      }
      clickable.click();
      await this.delay(50);
      return;
    }
    if (type === 'key') {
      this.dispatchStepKey(el, step);
      await this.delay(50);
      return;
    }

    throw new Error(`Unsupported framework check step: ${type || 'unknown'}`);
  }

  private queryStepElement(doc: Document, step: FrameworkTestStep): Element | null {
    const selector = String(step.selector || '').trim();
    const rawIndex = Number(step.index);
    const index = Math.max(0, Number.isFinite(rawIndex) ? rawIndex : 0);
    const matches = Array.from(doc.querySelectorAll(selector));
    return matches[index] || null;
  }

  private assertStepText(el: Element, step: FrameworkTestStep): void {
    const expected = String(step.text ?? '').trim();
    const actual = String((el.textContent || '').replace(/\s+/g, ' ')).trim();
    const match = step.match || 'equals';
    const passed = match === 'contains' ? actual.includes(expected) : actual === expected;
    if (!passed) {
      throw new Error(`${step.selector} expected text "${expected}" but found "${actual}"`);
    }
  }

  private assertStepValue(el: Element, step: FrameworkTestStep): void {
    const expected = String(step.value ?? step.text ?? '').trim();
    const actual = String((el as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value ?? '').trim();
    const match = step.match || 'equals';
    const passed = match === 'contains' ? actual.includes(expected) : actual === expected;
    if (!passed) {
      throw new Error(`${step.selector} expected value "${expected}" but found "${actual}"`);
    }
  }

  private setStepValue(el: Element, step: FrameworkTestStep): void {
    const value = String(step.value ?? step.text ?? '');
    const control = el as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    const proto = Object.getPrototypeOf(control);
    const descriptor = Object.getOwnPropertyDescriptor(proto, 'value');
    if (descriptor?.set) {
      descriptor.set.call(control, value);
    } else {
      control.value = value;
    }
    control.dispatchEvent(new Event('input', { bubbles: true }));
    control.dispatchEvent(new Event('change', { bubbles: true }));
  }

  private assertStepCount(doc: Document, step: FrameworkTestStep): void {
    const expected = Math.max(0, Number(step.count ?? step.expected ?? 0));
    const actual = doc.querySelectorAll(String(step.selector || '').trim()).length;
    if (actual !== expected) {
      throw new Error(`${step.selector} expected ${expected} match${expected === 1 ? '' : 'es'} but found ${actual}`);
    }
  }

  private async waitForStepCount(doc: Document, step: FrameworkTestStep): Promise<void> {
    const rawTimeout = Number(step.timeoutMs);
    const timeoutMs = Math.max(50, Number.isFinite(rawTimeout) ? rawTimeout : 1000);
    const expected = Math.max(0, Number(step.count ?? step.expected ?? 0));
    const startedAt = Date.now();
    let lastCount = 0;
    while (Date.now() - startedAt <= timeoutMs) {
      lastCount = doc.querySelectorAll(String(step.selector || '').trim()).length;
      if (lastCount === expected) return;
      await this.delay(25);
    }
    throw new Error(`${step.selector} did not reach ${expected} match${expected === 1 ? '' : 'es'} before timeout. Last count: ${lastCount}`);
  }

  private assertStepAttribute(el: Element, step: FrameworkTestStep): void {
    const attr = String(step.attribute || '').trim();
    if (!attr) throw new Error(`${step.selector} is missing an attribute name`);
    const actual = el.getAttribute(attr);
    if (step.expected === false) {
      if (actual !== null) throw new Error(`${step.selector} expected ${attr} to be absent`);
      return;
    }
    if (step.expected === undefined || step.expected === true) {
      if (actual === null) throw new Error(`${step.selector} expected ${attr} to exist`);
      return;
    }
    const expected = String(step.expected);
    if (actual !== expected) {
      throw new Error(`${step.selector} expected ${attr}="${expected}" but found "${actual ?? ''}"`);
    }
  }

  private assertStepClass(el: Element, step: FrameworkTestStep): void {
    const className = String(step.className || step.value || '').trim();
    if (!className) throw new Error(`${step.selector} is missing a className`);
    const expected = step.expected !== false;
    const actual = el.classList.contains(className);
    if (actual !== expected) {
      throw new Error(`${step.selector} expected class "${className}" to be ${expected ? 'present' : 'absent'}`);
    }
  }

  private dispatchStepKey(el: Element, step: FrameworkTestStep): void {
    const key = String(step.key || step.value || 'Enter');
    const target = el as HTMLElement;
    target.focus?.();
    target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    target.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true, cancelable: true }));
  }

  private async waitForStepText(doc: Document, step: FrameworkTestStep): Promise<void> {
    const rawTimeout = Number(step.timeoutMs);
    const timeoutMs = Math.max(50, Number.isFinite(rawTimeout) ? rawTimeout : 1000);
    const startedAt = Date.now();
    let lastText = '';
    while (Date.now() - startedAt <= timeoutMs) {
      const el = this.queryStepElement(doc, step);
      if (el) {
        lastText = String((el.textContent || '').replace(/\s+/g, ' ')).trim();
        try {
          this.assertStepText(el, step);
          return;
        } catch {
          // Keep polling until timeout.
        }
      }
      await this.delay(25);
    }
    throw new Error(`${step.selector} did not reach text "${String(step.text ?? '').trim()}" before timeout. Last text: "${lastText}"`);
  }

  private isElementDisabled(el: Element): boolean {
    const control = el as Element & { disabled?: boolean };
    if (typeof control.disabled === 'boolean') {
      return !!control.disabled;
    }
    return el.getAttribute('disabled') !== null || el.getAttribute('aria-disabled') === 'true';
  }

  private async mountFrameworkScratchDoc(html: string): Promise<FrameworkCheckMount> {
    const frame = document.createElement('iframe');
    frame.setAttribute('sandbox', 'allow-scripts allow-same-origin');
    frame.style.cssText = 'position:fixed;left:-10000px;top:-10000px;width:0;height:0;border:0;visibility:hidden;';

    const token = `fa-framework-check-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const bridged = this.injectPreviewReadyBridgeWithToken(html, token);

    return new Promise<FrameworkCheckMount>((resolve, reject) => {
      let done = false;
      let timer: number | undefined;

      const cleanupListener = () => {
        window.removeEventListener('message', onMessage);
        if (timer) window.clearTimeout(timer);
      };

      const finish = () => {
        if (done) return;
        done = true;
        cleanupListener();
        const doc = frame.contentDocument;
        if (!doc) {
          reject(new Error('Framework checks timed out before preview document loaded'));
          return;
        }
        resolve({
          frame,
          doc,
          cleanup: () => {
            cleanupListener();
            try { frame.remove(); } catch { }
          },
        });
      };

      const fail = (message: string) => {
        if (done) return;
        done = true;
        cleanupListener();
        try { frame.remove(); } catch { }
        reject(new Error(message));
      };

      const onMessage = (ev: MessageEvent) => {
        if (ev.source !== frame.contentWindow) return;
        const payload = ev.data as { type?: unknown; token?: unknown } | null;
        if (!payload || payload.type !== 'FA_PREVIEW_READY') return;
        const receivedToken = typeof payload.token === 'string' ? payload.token : '';
        if (receivedToken && receivedToken !== token) return;
        finish();
      };

      window.addEventListener('message', onMessage);
      timer = window.setTimeout(() => {
        fail('Framework checks timed out waiting for preview render');
      }, this.frameworkCheckReadyTimeoutMs);

      document.body.appendChild(frame);
      const doc = frame.contentDocument;
      if (!doc) {
        fail('Framework checks could not create preview document');
        return;
      }

      try {
        doc.open();
        doc.write(bridged);
        doc.close();
      } catch {
        fail('Framework checks could not mount preview document');
      }
    });
  }

  private injectPreviewReadyBridgeWithToken(html: string, token: string): string {
    const bridge = `<script>(function(){var token=${JSON.stringify(token)};var sent=false;window.__FA_PREVIEW_READY_TOKEN=token;window.__FA_NOTIFY_PREVIEW_READY=function(reason){if(sent) return; sent=true; try{if(window.parent){window.parent.postMessage({type:'FA_PREVIEW_READY',token:token,reason:String(reason||'render')},'*');}}catch(_e){}};})();</script>`;
    if (/<head[^>]*>/i.test(html)) {
      return html.replace(/<head[^>]*>/i, `$&\n${bridge}`);
    }
    if (/<body[^>]*>/i.test(html)) {
      return html.replace(/<body[^>]*>/i, `$&\n${bridge}`);
    }
    return `${bridge}\n${html}`;
  }

  private recordFrameworkAttempt(question: Question, results: TestResult[]): void {
    if (!this.attemptInsights || !Array.isArray(results) || results.length === 0 || !this.isFrameworkTech()) return;

    const totalCount = results.length;
    const passCount = results.filter((item) => item.passed).length;
    const firstFail = results.find((item) => !item.passed);
    const failCount = Math.max(0, totalCount - passCount);
    const normalizedError = normalizeErrorLine(firstFail?.error || '');
    const signature = createFailureSignature({
      firstFailName: firstFail?.name,
      errorLine: normalizedError,
      failCount,
    });
    const codeHash = stableHash(this.sortedFrameworkFilesText(this.filesMap()));
    const existingRuns = this.attemptInsights.getRunsForQuestion(question.id);
    const previousRun = existingRuns.length ? existingRuns[existingRuns.length - 1] : null;
    const prevHash = previousRun?.codeHash || '';
    const category = classifyFailureCategory(firstFail?.error || normalizedError);

    this.attemptInsights.recordRun({
      questionId: question.id,
      lang: this.tech as 'react' | 'angular' | 'vue',
      ts: Date.now(),
      passCount,
      totalCount,
      firstFailName: String(firstFail?.name || ''),
      errorLine: normalizedError,
      signature,
      codeHash,
      codeChanged: prevHash ? prevHash !== codeHash : true,
      interviewMode: false,
      errorCategory: category,
      tags: question.tags || [],
    });
  }

  private sortedFrameworkFilesText(files: Record<string, string>): string {
    return Object.keys(files || {})
      .sort()
      .map((path) => `${path}\n${files[path] ?? ''}`)
      .join('\n---FILE---\n');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => window.setTimeout(resolve, ms));
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
    this.clearPreviewReadyFallback();

    if (!html) {
      try {
        // Avoid adding iframe history entries; keep Back button on the page.
        frameEl.contentWindow?.location.replace('about:blank');
      } catch {
        frameEl.src = 'about:blank';
      }
      this._previewUrl.set(null);
      this.previewObjectUrl = null;
      this.expectedPreviewReadyToken = null;
      this.loadingPreview.set(false);
      if (prevUrl) {
        try { URL.revokeObjectURL(prevUrl); } catch { }
      }
      return;
    }

    this.loadingPreview.set(true);
    const bridged = this.injectPreviewReadyBridge(html, navId);
    this.expectedPreviewReadyToken = bridged.token;

    const blob = new Blob([bridged.html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    this.previewObjectUrl = url;
    this._previewUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));

    frameEl.onload = () => {
      if (this.destroy) return;
      if (navId !== this.previewNavId) return;
      if (this.loadingPreview()) {
        this.armPreviewReadyFallback(navId);
      }
      if (prevUrl && prevUrl !== url) {
        try { URL.revokeObjectURL(prevUrl); } catch { }
      }
    };

    try {
      // Use replace() so live preview updates don't pollute session history.
      frameEl.contentWindow?.location.replace(url);
    } catch {
      frameEl.src = url;
    }
  }

  private clearPreviewReadyFallback() {
    if (!this.previewReadyFallbackTimer) return;
    clearTimeout(this.previewReadyFallbackTimer);
    this.previewReadyFallbackTimer = undefined;
  }

  private armPreviewReadyFallback(navId: number) {
    if (!this.isBrowser) return;
    this.clearPreviewReadyFallback();
    this.previewReadyFallbackTimer = window.setTimeout(() => {
      if (this.destroy) return;
      if (navId !== this.previewNavId) return;
      if (!this.loadingPreview()) return;
      this.finishPreviewLoading(navId);
    }, 30000);
  }

  private finishPreviewLoading(navId: number) {
    if (this.destroy) return;
    if (navId !== this.previewNavId) return;
    this.clearPreviewReadyFallback();
    this.expectedPreviewReadyToken = null;
    this.zone.run(() => this.loadingPreview.set(false));
  }

  private injectPreviewReadyBridge(html: string, navId: number): { html: string; token: string } {
    const token = `fa-preview-${navId}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const bridge = `<script>(function(){var token=${JSON.stringify(token)};var sent=false;window.__FA_PREVIEW_READY_TOKEN=token;window.__FA_NOTIFY_PREVIEW_READY=function(reason){if(sent) return; sent=true; try{if(window.parent){window.parent.postMessage({type:'FA_PREVIEW_READY',token:token,reason:String(reason||'render')},'*');}}catch(_e){}};})();</script>`;

    if (/<head[^>]*>/i.test(html)) {
      return { html: html.replace(/<head[^>]*>/i, `$&\n${bridge}`), token };
    }
    if (/<body[^>]*>/i.test(html)) {
      return { html: html.replace(/<body[^>]*>/i, `$&\n${bridge}`), token };
    }
    return { html: `${bridge}\n${html}`, token };
  }

  private onPreviewMessage = (ev: MessageEvent) => {
    if (!this.isBrowser || this.destroy) return;
    if (!this.loadingPreview()) return;
    const frameWindow = this.previewFrame?.nativeElement?.contentWindow;
    if (!frameWindow || ev.source !== frameWindow) return;
    const payload = ev.data as { type?: unknown; token?: unknown } | null;
    if (!payload || payload.type !== 'FA_PREVIEW_READY') return;
    const token = typeof payload.token === 'string' ? payload.token : '';
    if (this.expectedPreviewReadyToken && token !== this.expectedPreviewReadyToken) return;
    this.finishPreviewLoading(this.previewNavId);
  };

  // ---------- helpers ----------

  private isFrameworkTech(): boolean {
    return this.tech === 'angular' || this.tech === 'react' || this.tech === 'vue';
  }

  private normalizeFrameworkTests(q: Question): FrameworkTest[] {
    const raw = Array.isArray(q?.frameworkTests) ? q.frameworkTests : [];
    return raw
      .map((item, index) => {
        const id = String(item?.id || `framework-check-${index + 1}`).trim();
        const name = String(item?.name || id || `Framework check ${index + 1}`).trim();
        const steps = Array.isArray(item?.steps) ? item.steps : [];
        return {
          id,
          name,
          steps: steps
            .filter((step) => !!step && typeof step === 'object')
            .map((step) => ({ ...step })),
        };
      })
      .filter((item) => item.id && item.steps.length > 0)
      .slice(0, 6);
  }

  private clearFrameworkCheckResults(): void {
    this.frameworkChecksRunning.set(false);
    this.frameworkCheckResults.set([]);
    this.frameworkChecksRan.set(false);
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
