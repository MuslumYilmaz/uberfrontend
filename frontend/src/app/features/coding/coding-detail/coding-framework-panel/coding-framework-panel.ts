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
import { FrameworkTest, Question } from '../../../../core/models/question.model';
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
import { OpaqueCheckCancelledError, OpaqueDomCheckRunner } from '../opaque-dom-check-runner';

type TreeNode =
  | { type: 'dir'; name: string; path: string; children: TreeNode[] }
  | { type: 'file'; name: string; path: string; crumb?: string };

type PreviewFailure = {
  kind: 'compilation' | 'preview-boot' | 'preview-runtime' | 'infrastructure-timeout';
  message: string;
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
  @Input() frameworkTestsOverride: FrameworkTest[] | null = null;
  @Input() storageKeyOverride: string | null = null;
  @Input() interviewMode = false;
  @Input() disablePersistence = false;
  @Input() liteMode = false;
  @Input() deferPreview = false;
  @Output() requestEditorUpgrade = new EventEmitter<void>();
  @Output() frameworkCheckRun = new EventEmitter<FrameworkCheckRunEvent>();

  @ViewChild('previewFrame', { read: ElementRef }) previewFrame?: ElementRef<HTMLIFrameElement>;
  @ViewChild('frameworkEditor') frameworkEditor?: MonacoEditorComponent;

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
  private previewBuildGeneration = 0;
  private expectedPreviewReadyToken: string | null = null;
  private previewReadyFallbackTimer?: number;
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly attemptInsights = inject(AttemptInsightsService, { optional: true });
  useMonaco = signal(true);
  monacoLoadFailed = signal(false);
  editorReady = signal(false);
  previewReady = signal(false);
  previewFailure = signal<PreviewFailure | null>(null);

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
  private initSeq = 0;
  private frameworkCheckRunSeq = 0;
  private readonly opaqueCheckRunner = new OpaqueDomCheckRunner();
  private frameworkCheckReadyTimeoutMs = 8000;
  private frameworkCheckTimeoutMs = 10000;

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

    const workspaceIdentityChanged =
      !!changes['question']
      || !!changes['tech']
      || !!changes['storageKeyOverride'];

    if (workspaceIdentityChanged) {
      this.cancelFrameworkCheckRun();
      this.invalidatePreviewBuilds();
    }
    if (workspaceIdentityChanged && this.question && this.tech && this.isFrameworkTech()) {
      this.initFromQuestion();
    } else if (changes['frameworkTestsOverride'] && this.question && this.isFrameworkTech()) {
      this.frameworkChecks.set(this.normalizeFrameworkTests(this.activeFrameworkTests(this.question)));
      this.clearFrameworkCheckResults();
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
    this.initSeq += 1;
    this.frameworkCheckRunSeq += 1;
    this.invalidatePreviewBuilds();
    this.opaqueCheckRunner.destroy();
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
    const initToken = ++this.initSeq;
    this.invalidatePreviewBuilds();
    this.flushPendingPersist();
    const q = this.question;
    if (!q || !this.isFrameworkTech()) return;
    this.previewReady.set(!this.deferPreview);
    this.frameworkChecks.set(this.normalizeFrameworkTests(this.activeFrameworkTests(q)));
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

    this.bootstrapWorkspaceFromSdk(q, undefined, initToken)
      .catch(() => { })
      .finally(() => {
        if (this.isActiveInit(initToken, q)) {
          this.scheduleDeferredPreview(initToken, q);
        }
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
    const q = this.question;
    const initToken = this.initSeq;
    if (!q || !this.isFrameworkTech() || !Object.keys(sol).length) return;
    this.ensurePreviewReady();
    const buildGeneration = this.beginPreviewBuild();
    const activeTech = this.tech;

    try {
      const html = await this.previewBuilder.build(this.tech as 'react' | 'angular' | 'vue', sol);
      if (!this.isCurrentPreviewBuild(buildGeneration, q, activeTech)) return;
      if (!this.isActiveInit(initToken, q)) return;

      if (!html) return;

      this.setPreviewHtml(html, null, buildGeneration);
      this.showingFrameworkSolutionPreview.set(true);
    } catch (e) {
    }
  }

  /** Parent: close solution preview → go back to user code preview. */
  async closeSolutionPreview(): Promise<void> {
    if (!this.showingFrameworkSolutionPreview()) return;
    const q = this.question;
    const initToken = this.initSeq;
    this.ensurePreviewReady();
    this.showingFrameworkSolutionPreview.set(false);
    try {
      if (this.shouldBuildPreview()) {
        await this.rebuildFrameworkPreview(initToken, q);
      } else {
        if (q && !this.isActiveInit(initToken, q)) return;
        this.setPreviewHtml(null);
        this.loadingPreview.set(true);
      }
    } catch (e) {
      if (q && !this.isActiveInit(initToken, q)) return;
      this.setPreviewHtml(null);
    }
  }

  /** Parent: Reset only the framework workspace to starter state. */
  async resetToStarter(): Promise<void> {
    const q = this.question;
    if (!q || !this.isFrameworkTech()) return;
    const initToken = ++this.initSeq;
    this.invalidatePreviewBuilds();
    this.ensurePreviewReady();

    this.cancelPendingPersist();
    this.viewingSolution.set(false);
    this.showRestoreBanner.set(false);
    this.showingFrameworkSolutionPreview.set(false);
    this.userFilesBackup = null;
    this.clearFrameworkCheckResults();

    await this.bootstrapWorkspaceFromSdk(q, { forceReset: true }, initToken);
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
    const initToken = ++this.initSeq;
    this.invalidatePreviewBuilds();
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
    if (!this.isActiveInit(initToken, q)) return;
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

    await this.rebuildFrameworkPreview(initToken, q).catch(() => {
      if (this.isActiveInit(initToken, q)) this.setPreviewHtml(null);
    });
    if (!this.isActiveInit(initToken, q)) return;
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
    opts?: { forceReset?: boolean },
    initToken = this.initSeq
  ): Promise<void> {
    if (!this.isBrowser) {
      if (this.isActiveInit(initToken, q)) {
        this.loadingPreview.set(false);
      }
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
        if (!this.isActiveInit(initToken, q)) return;
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
        if (!this.isActiveInit(initToken, q)) return;
        starters = this.createFrameworkFallbackFiles();
        entryHint = this.defaultEntry();
      }
    } else {
      // No sdk asset → fall back to minimal starter set
      starters = this.createFrameworkFallbackFiles();
      entryHint = this.defaultEntry();
    }
    if (!this.isActiveInit(initToken, q)) return;

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
      if (!this.isActiveInit(initToken, q)) return;
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
        await this.rebuildFrameworkPreview(initToken, q);
      } else {
        if (!this.isActiveInit(initToken, q)) return;
        this.loadingPreview.set(false);
        this.setPreviewHtml(null);
      }
      if (!this.isActiveInit(initToken, q)) return;

      this.showRestoreBanner.set(false);
      this.viewingSolution.set(false);
      this.showingFrameworkSolutionPreview.set(false);
      return;
    }

    // Backward-compat: archive legacy (unversioned) draft if it exists.
    const now = new Date().toISOString();
    const legacySnap = await this.codeStore.getFrameworkDraftSnapshotAsync(this.tech as any, baseKey);
    if (!this.isActiveInit(initToken, q)) return;
    if (legacySnap) {
      const legacyKey = makeDraftKey(baseKey, 'legacy');
      await this.codeStore.cloneFrameworkBundleAsync(this.tech as any, baseKey, legacyKey).catch(() => false);
      if (!this.isActiveInit(initToken, q)) return;
      upsertDraftIndexVersion(baseKey, { version: 'legacy', updatedAt: legacySnap.updatedAt || now }, { latestVersion: contentVersion });
    }

    const currentSnap = await this.codeStore.getFrameworkDraftSnapshotAsync(this.tech as any, key);
    if (!this.isActiveInit(initToken, q)) return;
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
    if (!this.isActiveInit(initToken, q)) return;

    this.filesMap.set(files);
    this.frameworkEntryFile = entryFile;
    this.openAllDirsFromPaths(Object.keys(files));
    this.openPath.set(entryFile);
    this.editorContent.set(files[entryFile] ?? '');

    if (this.shouldBuildPreview()) {
      await this.rebuildFrameworkPreview(initToken, q);
    } else {
      if (!this.isActiveInit(initToken, q)) return;
      this.setPreviewHtml(null);
      this.loadingPreview.set(true);
    }
    if (!this.isActiveInit(initToken, q)) return;

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

  private scheduleDeferredPreview(initToken?: number, q?: Question) {
    if (!this.isBrowser || !this.deferPreview || this.previewReady()) return;
    if (this.deferredPreviewTimer) return;
    this.deferredPreviewTimer = window.setTimeout(() => {
      this.deferredPreviewTimer = undefined;
      if (initToken !== undefined && q && !this.isActiveInit(initToken, q)) return;
      if (!this.deferPreview) return;
      this.previewReady.set(true);
      this.scheduleRebuild();
    }, 500);
  }

  private isActiveInit(initToken: number, q: Question): boolean {
    return !this.destroy && initToken === this.initSeq && this.question?.id === q.id;
  }

  private shouldBuildPreview(): boolean {
    return !this.deferPreview || this.previewReady();
  }

  private scheduleRebuild() {
    // Edits and workspace swaps must invalidate an already-running build now,
    // rather than waiting for the debounced replacement build to start.
    this.invalidatePreviewBuilds();
    if (!this.shouldBuildPreview()) return;
    if (this.rebuildTimer) clearTimeout(this.rebuildTimer);
    this.rebuildTimer = setTimeout(() => {
      this.rebuildTimer = null;
      this.rebuildFrameworkPreview().catch(err => {
        this.setPreviewHtml(null);
      });
    }, 200);
  }

  async rebuildFrameworkPreview(initToken?: number, q?: Question): Promise<void> {
    if (this.destroy) return;
    this.ensurePreviewReady();
    if (this.rebuildTimer) {
      clearTimeout(this.rebuildTimer);
      this.rebuildTimer = null;
    }
    // Initialization owns its cancellation through initSeq. User-initiated and
    // edit-scheduled rebuilds explicitly invalidate any active check run.
    if (initToken === undefined || !q) this.clearFrameworkCheckResults();
    this.previewFailure.set(null);
    this.loadingPreview.set(true);
    const activeQuestion = q ?? this.question;
    const activeTech = this.tech;
    const buildGeneration = this.beginPreviewBuild();
    try {
      const files = this.filesMap();

      const html = await this.previewBuilder.build(this.tech as 'react' | 'angular' | 'vue', files);
      if (!this.isCurrentPreviewBuild(buildGeneration, activeQuestion, activeTech)) return;
      if (initToken !== undefined && q && !this.isActiveInit(initToken, q)) return;
      this.setPreviewHtml(html || null, null, buildGeneration);
    } catch (e) {
      if (!this.isCurrentPreviewBuild(buildGeneration, activeQuestion, activeTech)) return;
      if (initToken !== undefined && q && !this.isActiveInit(initToken, q)) return;
      const message = e instanceof Error ? e.message : String(e || 'Preview build failed');
      this.setPreviewHtml(null, {
        kind: 'compilation',
        message: `Preview compilation failed: ${message.split(/\r?\n/, 1)[0].slice(0, 500)}`,
      }, buildGeneration);
      this.loadingPreview.set(false);
    }
  }

  async runFrameworkChecks(options?: { emitCompletion?: boolean }): Promise<TestResult[]> {
    const q = this.question;
    const activeTech = this.tech;
    const checks = this.frameworkChecks();
    if (!q || !this.isBrowser || !this.isFrameworkTech() || !checks.length) {
      return [];
    }

    this.ensurePreviewReady();
    this.flushPendingPersist();
    if (this.rebuildTimer) {
      clearTimeout(this.rebuildTimer);
      this.rebuildTimer = null;
    }
    this.frameworkChecksRunning.set(true);
    this.frameworkChecksRan.set(true);
    this.frameworkCheckResults.set([]);
    const runSeq = ++this.frameworkCheckRunSeq;

    let results: TestResult[] = [];

    try {
      const files = this.filesMap();
      const html = await this.previewBuilder.build(this.tech as 'react' | 'angular' | 'vue', files);
      // The builder may be asynchronous. Re-check cancellation and input
      // identity before creating any scratch iframe for this invocation.
      if (!this.isCurrentFrameworkCheckRun(runSeq, q, activeTech)) return [];
      if (!html) {
        throw new Error('Preview build returned empty HTML');
      }

      results = await this.opaqueCheckRunner.runFramework(html, checks, {
        readyTimeoutMs: this.frameworkCheckReadyTimeoutMs,
        checkTimeoutMs: this.frameworkCheckTimeoutMs,
      });
    } catch (error) {
      if (error instanceof OpaqueCheckCancelledError) return [];
      if (!this.isCurrentFrameworkCheckRun(runSeq, q, activeTech)) return [];
      const message = error instanceof Error ? error.message : String(error || 'Framework checks failed');
      results = [{
        name: 'Framework checks',
        passed: false,
        error: message || 'Framework checks failed',
        failureKind: 'compilation',
      }];
    }

    if (!this.isCurrentFrameworkCheckRun(runSeq, q, activeTech)) return results;
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

    return results;
  }

  private cancelFrameworkCheckRun(): void {
    this.frameworkCheckRunSeq += 1;
    this.opaqueCheckRunner.cancel();
    this.frameworkChecksRunning.set(false);
  }

  private isCurrentFrameworkCheckRun(runSeq: number, q: Question, tech: Tech): boolean {
    return !this.destroy
      && runSeq === this.frameworkCheckRunSeq
      && this.question === q
      && this.question?.id === q.id
      && this.tech === tech;
  }

  private beginPreviewBuild(): number {
    return ++this.previewBuildGeneration;
  }

  private invalidatePreviewBuilds(): void {
    this.previewBuildGeneration += 1;
  }

  private isCurrentPreviewBuild(generation: number, q: Question | undefined, tech: Tech): boolean {
    return !this.destroy
      && generation === this.previewBuildGeneration
      && this.question === q
      && this.tech === tech;
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
      interviewMode: this.interviewMode,
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

  private setPreviewHtml(
    html: string | null,
    failure: PreviewFailure | null = null,
    buildGeneration?: number,
  ) {
    if (this.destroy) return;
    if (buildGeneration !== undefined && buildGeneration !== this.previewBuildGeneration) return;
    const frameEl = this.previewFrame?.nativeElement;
    if (!frameEl) {
      // iframe not ready yet; retry once
      requestAnimationFrame(() => {
        if (this.previewFrame?.nativeElement) {
          this.setPreviewHtml(html, failure, buildGeneration);
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
      this.previewFailure.set(failure);
      this.loadingPreview.set(false);
      if (prevUrl) {
        try { URL.revokeObjectURL(prevUrl); } catch { }
      }
      return;
    }

    this.loadingPreview.set(true);
    this.previewFailure.set(null);
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
        try {
          frameEl.contentWindow?.postMessage({
            type: 'FA_PREVIEW_STATUS_REQUEST',
            version: 2,
            token: this.expectedPreviewReadyToken,
          }, '*');
        } catch { }
      }
      if (prevUrl && prevUrl !== url) {
        try { URL.revokeObjectURL(prevUrl); } catch { }
      }
    };

    // Bound the navigation itself as well as the lifecycle handshake. Some
    // iframe failures never dispatch `load`, so waiting until onload to arm
    // this timer could leave the visible preview loading forever.
    this.armPreviewReadyFallback(navId);
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
      this.finishPreviewLoading(navId, {
        kind: 'infrastructure-timeout',
        message: 'Preview did not report a ready or error state before the infrastructure timeout.',
      });
    }, 30000);
  }

  private finishPreviewLoading(navId: number, failure: PreviewFailure | null = null) {
    if (this.destroy) return;
    if (navId !== this.previewNavId) return;
    this.clearPreviewReadyFallback();
    this.expectedPreviewReadyToken = null;
    this.zone.run(() => {
      this.previewFailure.set(failure);
      this.loadingPreview.set(false);
    });
  }

  private injectPreviewReadyBridge(html: string, navId: number): { html: string; token: string } {
    const token = `fa-preview-${navId}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const bridge = `<script>(function(){var token=${JSON.stringify(token)};var last=null;window.__FA_PREVIEW_READY_TOKEN=token;function normalize(reason){if(reason==='error')return'runtime-error';if(reason==='compile-error'||reason==='boot-error'||reason==='runtime-error')return reason;return'render-ready';}function publish(){if(!last)return;try{if(window.parent){window.parent.postMessage({type:'FA_PREVIEW_LIFECYCLE',version:2,token:token,state:last.state,error:last.error},'*');}}catch(_e){}}window.__FA_NOTIFY_PREVIEW_READY=function(reason,detail){last={state:normalize(reason),error:String(detail||'').split(/\\r?\\n/,1)[0].slice(0,500)};publish();};window.addEventListener('message',function(event){var data=event&&event.data;if(!data||data.type!=='FA_PREVIEW_STATUS_REQUEST'||data.version!==2||data.token!==token)return;publish();});})();</script>`;

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
    const payload = ev.data as {
      type?: unknown;
      version?: unknown;
      token?: unknown;
      state?: unknown;
      error?: unknown;
    } | null;
    if (!payload || payload.type !== 'FA_PREVIEW_LIFECYCLE' || payload.version !== 2) return;
    const token = typeof payload.token === 'string' ? payload.token : '';
    if (!this.expectedPreviewReadyToken || token !== this.expectedPreviewReadyToken) return;
    const state = typeof payload.state === 'string' ? payload.state : '';
    if (state === 'render-ready') {
      this.finishPreviewLoading(this.previewNavId);
      return;
    }
    const kind = state === 'compile-error'
      ? 'compilation'
      : state === 'boot-error'
        ? 'preview-boot'
        : state === 'runtime-error'
          ? 'preview-runtime'
          : null;
    if (!kind) return;
    const detail = String(payload.error || '').split(/\r?\n/, 1)[0].replace(/[<>]/g, '').slice(0, 500);
    const prefix = kind === 'compilation'
      ? 'Preview compilation failed'
      : kind === 'preview-boot'
        ? 'Preview failed to boot'
        : 'Preview failed during render';
    this.finishPreviewLoading(this.previewNavId, {
      kind,
      message: `${prefix}${detail ? `: ${detail}` : ''}`,
    });
  };

  // ---------- helpers ----------

  private isFrameworkTech(): boolean {
    return this.tech === 'angular' || this.tech === 'react' || this.tech === 'vue';
  }

  private activeFrameworkTests(q: Question): FrameworkTest[] {
    return Array.isArray(this.frameworkTestsOverride)
      ? this.frameworkTestsOverride
      : Array.isArray(q.frameworkTests)
        ? q.frameworkTests
        : [];
  }

  private normalizeFrameworkTests(raw: FrameworkTest[]): FrameworkTest[] {
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
    this.cancelFrameworkCheckRun();
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
