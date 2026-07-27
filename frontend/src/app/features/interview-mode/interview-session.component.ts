import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  SimpleChange,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  InterviewCheckResult,
  InterviewCodingFile,
  InterviewFrameworkRunnerConfig,
  InterviewPreparedCheckRun,
  InterviewMcqQuestion,
  InterviewSession,
} from '../../core/models/interview.model';
import { FrameworkTest, Question } from '../../core/models/question.model';
import { InterviewService } from '../../core/services/interview.service';
import { UserCodeSandboxService } from '../../core/services/user-code-sandbox.service';
import { MonacoEditorComponent } from '../../monaco-editor.component';
import { FaButtonComponent, FaCardComponent } from '../../shared/ui';
import { CodingFrameworkPanelComponent } from '../coding/coding-detail/coding-framework-panel/coding-framework-panel';
import { InterviewDeadlineTimerComponent } from './interview-deadline-timer.component';

type DraftSyncState = 'idle' | 'saving' | 'saved' | 'offline' | 'error';
type LocalCodingDraft = {
  sessionId: string;
  taskId: string;
  files: Array<Pick<InterviewCodingFile, 'path' | 'content'>>;
  updatedAt: string;
};
type LocalMcqTiming = {
  sessionId: string;
  elapsedByQuestion: Record<string, number>;
  activeQuestionId: string | null;
  activeSinceMs: number | null;
};

@Component({
  selector: 'app-interview-session',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MonacoEditorComponent,
    CodingFrameworkPanelComponent,
    FaButtonComponent,
    FaCardComponent,
    InterviewDeadlineTimerComponent,
  ],
  templateUrl: './interview-session.component.html',
  styleUrls: ['./interview-session.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InterviewSessionComponent implements OnInit, OnDestroy {
  private readonly interviews = inject(InterviewService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly sandbox = inject(UserCodeSandboxService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  @ViewChild('frameworkPanel') private frameworkPanel?: CodingFrameworkPanelComponent;

  readonly session = signal<InterviewSession | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly currentIndex = signal(0);
  readonly reviewing = signal(false);
  readonly savingAnswerFor = signal<string | null>(null);
  readonly transitioning = signal(false);
  readonly codingFiles = signal<InterviewCodingFile[]>([]);
  readonly activeFilePath = signal('');
  readonly editorFallback = signal(false);
  readonly draftSync = signal<DraftSyncState>('idle');
  readonly runningChecks = signal(false);
  readonly checkResults = signal<InterviewCheckResult[]>([]);
  readonly frameworkTests = signal<FrameworkTest[] | null>(null);
  readonly frameworkStarterFiles = signal<Record<string, string> | null>(null);
  readonly frameworkQuestion = signal<Question | null>(null);
  readonly syncedDraftHash = signal<string | null>(null);
  readonly submittingCoding = signal(false);

  readonly currentQuestion = computed<InterviewMcqQuestion | null>(() => {
    const session = this.session();
    return session?.questions[this.currentIndex()] ?? null;
  });
  readonly answeredCount = computed(
    () => this.session()?.questions.filter((question) => !!question.selectedOptionId).length ?? 0,
  );
  readonly activeFile = computed(
    () => this.codingFiles().find((file) => file.path === this.activeFilePath()) ?? null,
  );
  readonly checkSummary = computed(() => ({
    passed: this.checkResults().filter((result) => result.passed).length,
    total: this.checkResults().length,
  }));

  private sessionId = '';
  private draftTimer: ReturnType<typeof setTimeout> | null = null;
  private draftSaveInFlight = false;
  private draftChangedWhileSaving = false;
  private codingInitializedForTask: string | null = null;
  private mcqTimingInitializedForSession: string | null = null;
  private readonly mcqElapsedByQuestion = new Map<string, number>();
  private mcqActiveQuestionId: string | null = null;
  private mcqActiveSinceMs: number | null = null;
  private readonly maxMcqResponseDurationMs = 10 * 60 * 1000;
  private ending = false;

  private readonly onOnline = () => {
    if (this.draftSync() === 'offline' || this.draftSync() === 'error') {
      this.scheduleDraftSave(0);
    }
  };

  ngOnInit(): void {
    this.sessionId = this.route.snapshot.paramMap.get('id')?.trim() || '';
    if (!this.sessionId) {
      this.loading.set(false);
      this.error.set('This interview link is invalid.');
      return;
    }
    if (this.isBrowser) window.addEventListener('online', this.onOnline);
    this.load();
  }

  ngOnDestroy(): void {
    if (this.isBrowser) window.removeEventListener('online', this.onOnline);
    if (this.draftTimer !== null) clearTimeout(this.draftTimer);
    if (this.session()?.status === 'mcq_active') {
      this.persistMcqTiming();
    }
    if (this.session()?.status === 'coding_active' && this.codingFiles().length) {
      this.persistLocalDraft();
    }
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.interviews.getSession(this.sessionId).subscribe({
      next: (session) => {
        this.loading.set(false);
        this.applySession(session);
      },
      error: (error) => {
        this.loading.set(false);
        this.error.set(
          error?.status === 404
            ? 'This interview could not be found.'
            : 'The interview could not be loaded. Please try again.',
        );
      },
    });
  }

  selectAnswer(question: InterviewMcqQuestion, optionId: string): void {
    const session = this.session();
    if (
      !session
      || session.status !== 'mcq_active'
      || this.savingAnswerFor()
      || !question.options.some((option) => option.id === optionId)
    ) {
      return;
    }
    const previous = question.selectedOptionId;
    const responseDurationMs = this.snapshotQuestionDuration(question.id);
    this.patchQuestionAnswer(question.id, optionId);
    this.savingAnswerFor.set(question.id);
    this.error.set(null);
    this.interviews.saveAnswer(
      session.id,
      { questionId: question.id, optionId, responseDurationMs },
      session.version,
    ).subscribe({
      next: (ack) => {
        this.savingAnswerFor.set(null);
        if (ack.session) {
          this.applySession(ack.session, { keepQuestionIndex: true });
        } else if (ack.version !== null) {
          this.patchSessionVersion(ack.version);
        }
      },
      error: (error) => {
        this.savingAnswerFor.set(null);
        this.patchQuestionAnswer(question.id, previous);
        if (error?.status === 409) {
          this.error.set('This interview changed in another tab. Reloading the latest answers…');
          this.load();
        } else {
          this.error.set('Your answer was not saved. Please select it again.');
        }
      },
    });
  }

  goToQuestion(index: number): void {
    const questions = this.session()?.questions ?? [];
    const total = questions.length;
    if (index < 0 || index >= total) return;
    this.activateQuestionTiming(questions[index].id);
    this.currentIndex.set(index);
    this.reviewing.set(false);
    if (this.isBrowser) window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  showReview(): void {
    if (this.savingAnswerFor()) return;
    this.pauseQuestionTiming();
    this.reviewing.set(true);
  }

  submitMcq(fromTimer = false): void {
    const session = this.session();
    if (!session || session.status !== 'mcq_active' || this.transitioning()) return;
    this.pauseQuestionTiming();
    this.transitioning.set(true);
    this.error.set(null);
    this.interviews.submitMcq(session.id, session.version).subscribe({
      next: (updated) => {
        this.transitioning.set(false);
        this.reviewing.set(false);
        this.clearMcqTiming();
        this.applySession(updated);
      },
      error: (error) => {
        this.transitioning.set(false);
        if (error?.status === 409 || fromTimer) {
          this.load();
        } else {
          this.activateQuestionTiming(this.currentQuestion()?.id || null);
          this.error.set('The MCQ section could not be submitted. Please try again.');
        }
      },
    });
  }

  startCoding(): void {
    const session = this.session();
    if (!session || session.status !== 'coding_ready' || this.transitioning()) return;
    this.transitioning.set(true);
    this.error.set(null);
    this.interviews.startCoding(session.id, session.version).subscribe({
      next: (updated) => {
        this.transitioning.set(false);
        this.applySession(updated);
      },
      error: (error) => {
        this.transitioning.set(false);
        if (error?.status === 409) this.load();
        else this.error.set('The coding workspace could not be started. Please try again.');
      },
    });
  }

  selectFile(path: string): void {
    if (this.codingFiles().some((file) => file.path === path)) {
      this.activeFilePath.set(path);
    }
  }

  onCodeChange(content: string): void {
    const activePath = this.activeFilePath();
    const file = this.codingFiles().find((candidate) => candidate.path === activePath);
    if (!file || file.readOnly || file.content === content) return;
    this.codingFiles.update((files) =>
      files.map((candidate) => candidate.path === activePath
        ? { ...candidate, content }
        : candidate),
    );
    this.markDraftChanged();
  }

  useTextareaFallback(): void {
    this.editorFallback.set(true);
  }

  runChecks(): void {
    const session = this.session();
    const draftHash = this.syncedDraftHash();
    if (
      !session
      || session.status !== 'coding_active'
      || this.runningChecks()
      || this.submittingCoding()
      || this.draftSaveInFlight
    ) {
      return;
    }
    if (!draftHash) {
      this.error.set('Wait for the latest draft to finish syncing before running checks.');
      this.scheduleDraftSave(0);
      return;
    }
    this.runningChecks.set(true);
    this.error.set(null);
    this.interviews.prepareCodingCheckRun(session.id, draftHash, session.version).subscribe({
      next: (prepared) => void this.executePreparedChecks(session, prepared),
      error: (error) => {
        this.runningChecks.set(false);
        if (error?.status === 409) {
          this.error.set('The session or draft changed. Your local draft is safe; reload before running checks.');
        } else {
          this.error.set('Checks could not be prepared. Your draft is still saved locally.');
        }
      },
    });
  }

  submitCoding(): void {
    const session = this.session();
    const draftHash = this.syncedDraftHash();
    if (!session || session.status !== 'coding_active' || this.submittingCoding()) return;
    if (!draftHash || this.draftSaveInFlight) {
      this.error.set('Wait for the latest draft to finish syncing before submitting.');
      this.scheduleDraftSave(0);
      return;
    }
    this.submittingCoding.set(true);
    this.error.set(null);
    this.persistLocalDraft();
    this.interviews.submitCoding(
      session.id,
      draftHash,
      session.version,
    ).subscribe({
      next: () => {
        this.submittingCoding.set(false);
        this.clearLocalDraft();
        void this.router.navigate(['/interview', session.id, 'results']);
      },
      error: (error) => {
        this.submittingCoding.set(false);
        if (error?.status === 409) {
          this.load();
        } else {
          this.error.set('The coding task could not be submitted. Your local draft is safe.');
        }
      },
    });
  }

  reconcileAfterCodingDeadline(): void {
    this.error.set(null);
    this.load();
  }

  onFrameworkFilesChanged(files: Record<string, string>): void {
    const current = this.codingFiles();
    const currentByPath = new Map(
      current.map((file) => [file.path.replace(/^\/+/, ''), file]),
    );
    const next = Object.entries(files).map(([path, content]) => {
      const existing = currentByPath.get(path.replace(/^\/+/, ''));
      return existing
        ? { ...existing, content }
        : {
          path,
          language: this.languageFromPath(path),
          content,
          readOnly: false,
        };
    });
    if (
      next.length === current.length
      && next.every((file, index) => file.content === current[index]?.content)
    ) {
      return;
    }
    this.codingFiles.set(next);
    this.markDraftChanged();
  }

  abandon(): void {
    const session = this.session();
    if (!session || this.ending) return;
    if (this.isBrowser && !window.confirm('End this interview? Your current work will be submitted as incomplete.')) {
      return;
    }
    this.ending = true;
    this.error.set(null);
    this.interviews.endSession(session.id, session.version).subscribe({
      next: () => {
        this.ending = false;
        this.clearMcqTiming();
        this.clearLocalDraft();
        void this.router.navigate(['/interview', session.id, 'results']);
      },
      error: (error) => {
        this.ending = false;
        if (error?.status === 409) this.load();
        else this.error.set('The interview could not be ended. Please try again.');
      },
    });
  }

  draftStatusLabel(): string {
    switch (this.draftSync()) {
      case 'saving': return 'Saving draft…';
      case 'saved': return 'Draft saved';
      case 'offline': return 'Offline · saved on this device';
      case 'error': return 'Local draft safe · sync pending';
      default: return 'Autosave ready';
    }
  }

  private async executePreparedChecks(
    preparedFor: InterviewSession,
    prepared: InterviewPreparedCheckRun,
  ): Promise<void> {
    try {
      const runnerResults = prepared.runnerConfig.kind === 'javascript'
        ? await this.runJavaScriptChecks(prepared)
        : await this.runFrameworkChecks(prepared.runnerConfig, prepared);
      const current = this.session();
      if (
        !current
        || current.id !== preparedFor.id
        || current.status !== 'coding_active'
        || this.syncedDraftHash() !== prepared.draftHash
      ) {
        throw new Error('The draft changed while checks were running.');
      }
      this.interviews.completeCodingCheckRun(
        current.id,
        prepared,
        runnerResults.map(({ id, passed }) => ({ id, passed })),
        current.version,
      ).subscribe({
        next: (completed) => {
          this.runningChecks.set(false);
          this.checkResults.set(runnerResults);
          if (completed.version !== null) this.patchSessionVersion(completed.version);
        },
        error: (error) => {
          this.runningChecks.set(false);
          this.error.set(
            error?.status === 409
              ? 'The draft changed before check results were recorded. Run the checks again.'
              : 'Checks ran locally, but their result could not be recorded.',
          );
        },
      });
    } catch (error) {
      this.runningChecks.set(false);
      this.error.set(
        error instanceof Error && error.message
          ? error.message
          : 'Checks could not run in the browser sandbox.',
      );
    } finally {
      this.frameworkTests.set(null);
    }
  }

  private async runJavaScriptChecks(
    prepared: InterviewPreparedCheckRun,
  ): Promise<InterviewCheckResult[]> {
    if (!this.isBrowser || prepared.runnerConfig.kind !== 'javascript') {
      throw new Error('The browser sandbox is unavailable.');
    }
    const source = this.codingFiles().find((file) => !file.readOnly)
      ?? this.codingFiles()[0];
    if (!source) throw new Error('No editable JavaScript file is available.');
    const output = await this.sandbox.runWithTests({
      userCode: this.wrapDefaultExport(source.content),
      testCode: this.transformTestImports(prepared.runnerConfig.tests),
      timeoutMs: 2500,
    });
    return this.alignRunnerResults(
      prepared,
      prepared.runnerConfig.checks,
      output.results,
      output.error || (output.timedOut ? 'Browser checks timed out.' : undefined),
    );
  }

  private async runFrameworkChecks(
    config: InterviewFrameworkRunnerConfig,
    prepared: InterviewPreparedCheckRun,
  ): Promise<InterviewCheckResult[]> {
    const panel = this.frameworkPanel;
    if (!panel || !this.isBrowser) {
      throw new Error('The framework preview runner is unavailable.');
    }
    const checks = config.groups.flatMap((group) =>
      group.checks.map((check) => ({
        id: check.id,
        name: check.name,
        steps: check.steps as FrameworkTest['steps'],
      })),
    );
    if (!checks.length) throw new Error('No framework checks were prepared.');
    const previous = panel.frameworkTestsOverride;
    this.frameworkTests.set(checks);
    panel.frameworkTestsOverride = checks;
    panel.ngOnChanges({
      frameworkTestsOverride: new SimpleChange(previous, checks, false),
    });
    const output = await panel.runFrameworkChecks({ emitCompletion: false });
    panel.frameworkTestsOverride = null;
    panel.ngOnChanges({
      frameworkTestsOverride: new SimpleChange(checks, null, false),
    });
    return this.alignRunnerResults(prepared, checks, output);
  }

  private alignRunnerResults(
    prepared: InterviewPreparedCheckRun,
    declaredChecks: Array<{ id: string; name: string }>,
    rawResults: Array<{ name?: string; passed?: boolean; error?: string; failureKind?: string }>,
    runnerError?: string,
  ): InterviewCheckResult[] {
    const rawByName = new Map(
      rawResults.map((result) => [String(result.name || ''), result]),
    );
    const used = new Set<number>();
    const declaredById = new Map(declaredChecks.map((check) => [check.id, check]));
    return prepared.expectedCheckIds.map((id) => {
      const declared = declaredById.get(id);
      let raw = declared
        ? rawByName.get(declared.name)
          ?? rawResults.find((result) => String(result.name || '').endsWith(`› ${declared.name}`))
        : undefined;
      if (!raw && declared) {
        const declaredIndex = declaredChecks.findIndex((check) => check.id === id);
        if (declaredIndex >= 0 && !used.has(declaredIndex)) {
          raw = rawResults[declaredIndex];
          used.add(declaredIndex);
        }
      }
      const passed = raw?.passed === true;
      return {
        id,
        name: declared?.name || id,
        passed,
        message: passed
          ? undefined
          : this.safeRunnerMessage(raw?.error || runnerError || 'This requirement did not pass.'),
        failureKind: raw?.failureKind,
      };
    });
  }

  private wrapDefaultExport(source: string): string {
    let name: string | null = null;
    let code = source;
    code = code.replace(
      /\bexport\s+default\s+(async\s+)?function\s+([A-Za-z0-9_]+)?/m,
      (_match, asyncKeyword, functionName) => {
        name = functionName || '__FA_DefaultFn__';
        return `${asyncKeyword || ''}function ${name}`;
      },
    );
    code = code.replace(
      /\bexport\s+default\s+class\s+([A-Za-z0-9_]+)?/m,
      (_match, className) => {
        name = className || '__FA_DefaultClass__';
        return `class ${name}`;
      },
    );
    if (!name) {
      const before = code;
      code = code.replace(/\bexport\s+default\s+/m, 'const __FA_Default__ = ');
      if (code !== before) name = '__FA_Default__';
    }
    const reference = name || '__FA_MissingDefault__';
    return `${code}
      ;globalThis.__FA_USER_DEFAULT__ =
        typeof ${reference} !== "undefined" ? ${reference} : undefined;`;
  }

  private transformTestImports(source: string): string {
    return source
      .replace(
        /import\s+([A-Za-z0-9_$*\s{},]+)\s+from\s+['"]\.\/[A-Za-z0-9_\-./]+['"];?/g,
        (_match, bindings: string) => {
          const first = bindings.includes('{')
            ? bindings.replace(/[{}*\s]/g, '').split(',')[0] || '__user'
            : bindings.trim();
          return `const ${first} = globalThis.__FA_USER_DEFAULT__;`;
        },
      )
      .replace(/^\s*import\s+[^;]+from\s+['"](jest|vitest)['"];\s*$/mg, '')
      .replace(/^\s*export\s*\{\s*\};?\s*$/mg, '');
  }

  private safeRunnerMessage(value: string): string {
    return String(value || '')
      .replace(/[<>]/g, '')
      .split(/\r?\n/, 1)[0]
      .slice(0, 500);
  }

  private applySession(
    session: InterviewSession,
    options: { keepQuestionIndex?: boolean } = {},
  ): void {
    this.session.set(session);
    if (!options.keepQuestionIndex) {
      this.currentIndex.set(
        Math.min(session.currentQuestionIndex, Math.max(0, session.questions.length - 1)),
      );
    }
    if (session.status === 'mcq_active') {
      this.initializeMcqTiming(session);
      if (!this.reviewing()) {
        this.activateQuestionTiming(
          session.questions[this.currentIndex()]?.id || null,
        );
      }
    } else {
      this.clearMcqTiming();
    }
    if (session.status === 'coding_active') this.initializeCoding(session);
    if (['completed', 'abandoned', 'voided_technical'].includes(session.status)) {
      this.clearLocalDraft();
    }
    if (session.status === 'completed') {
      void this.router.navigate(['/interview', session.id, 'results']);
    }
  }

  private initializeCoding(session: InterviewSession): void {
    const task = session.coding?.task;
    if (!task || this.codingInitializedForTask === task.id) return;
    this.codingInitializedForTask = task.id;
    const serverFiles = session.coding?.draft?.files?.length
      ? session.coding.draft.files
      : task.files;
    const local = this.readLocalDraft();
    const serverUpdatedAt = session.coding?.draft?.updatedAt;
    const localUpdatedMs = local?.updatedAt ? Date.parse(local.updatedAt) : Number.NaN;
    const serverUpdatedMs = serverUpdatedAt ? Date.parse(serverUpdatedAt) : Number.NaN;
    const useLocal = local?.taskId === task.id
      && (
        !session.coding?.draft
        || (
          Number.isFinite(localUpdatedMs)
          && Number.isFinite(serverUpdatedMs)
          && localUpdatedMs > serverUpdatedMs
        )
      );
    const files = useLocal
      ? this.mergeLocalFiles(serverFiles, local.files)
      : serverFiles.map((file) => ({ ...file }));
    if (local?.taskId === task.id && !useLocal) this.clearLocalDraft();
    this.codingFiles.set(files);
    this.frameworkStarterFiles.set(files.length
      ? Object.fromEntries(
        files.map((file) => [file.path.replace(/^\/+/, ''), file.content]),
      )
      : null);
    this.frameworkQuestion.set(this.buildFrameworkQuestion(session));
    this.activeFilePath.set(
      files.find((file) => !file.readOnly)?.path ?? files[0]?.path ?? '',
    );
    this.checkResults.set(session.coding?.checkResults ?? []);
    this.syncedDraftHash.set(
      useLocal ? null : session.coding?.draft?.hash || null,
    );
    if (useLocal) {
      this.draftSync.set(this.isOnline() ? 'idle' : 'offline');
      this.scheduleDraftSave(0);
    } else {
      this.draftSync.set(this.syncedDraftHash() ? 'saved' : 'idle');
      if (!this.syncedDraftHash()) this.scheduleDraftSave(0);
    }
  }

  private patchQuestionAnswer(questionId: string, optionId: string | null): void {
    this.session.update((session) => session
      ? {
        ...session,
        questions: session.questions.map((question) => question.id === questionId
          ? { ...question, selectedOptionId: optionId }
          : question),
      }
      : session);
  }

  private patchSessionVersion(version: number): void {
    this.session.update((session) => session ? { ...session, version } : session);
  }

  private scheduleDraftSave(delayMs = 800): void {
    if (this.draftTimer !== null) clearTimeout(this.draftTimer);
    this.draftTimer = setTimeout(() => {
      this.draftTimer = null;
      this.saveDraftNow();
    }, delayMs);
  }

  private saveDraftNow(): void {
    const session = this.session();
    if (!session || session.status !== 'coding_active' || !this.codingFiles().length) return;
    if (!this.isOnline()) {
      this.draftSync.set('offline');
      return;
    }
    if (this.draftSaveInFlight) {
      this.draftChangedWhileSaving = true;
      return;
    }
    this.draftSaveInFlight = true;
    this.draftChangedWhileSaving = false;
    this.draftSync.set('saving');
    this.interviews.saveCodingDraft(
      session.id,
      {
        language: this.codingLanguage(session),
        files: this.projectFiles(),
      },
      session.version,
    ).subscribe({
      next: (saved) => {
        this.draftSaveInFlight = false;
        if (saved.version !== null) this.patchSessionVersion(saved.version);
        if (this.draftChangedWhileSaving) {
          this.syncedDraftHash.set(null);
          this.draftSync.set('idle');
          this.scheduleDraftSave(0);
          return;
        }
        const hash = saved.draft?.hash || null;
        this.syncedDraftHash.set(hash);
        this.draftSync.set(hash ? 'saved' : 'error');
        if (!hash) {
          this.error.set('The draft synced, but its verification hash was missing. Reload before submitting.');
        }
      },
      error: (error) => {
        this.draftSaveInFlight = false;
        this.syncedDraftHash.set(null);
        this.draftSync.set(this.isOnline() ? 'error' : 'offline');
        if (error?.status === 409) {
          this.error.set('Draft sync paused because this interview changed in another tab.');
        }
      },
    });
  }

  private projectFiles(): Array<Pick<InterviewCodingFile, 'path' | 'content'>> {
    return this.codingFiles().map(({ path, content }) => ({ path, content }));
  }

  private markDraftChanged(): void {
    this.syncedDraftHash.set(null);
    this.checkResults.set([]);
    this.persistLocalDraft();
    this.draftSync.set(this.isOnline() ? 'idle' : 'offline');
    this.scheduleDraftSave();
  }

  private codingLanguage(session: InterviewSession): string {
    if (session.track === 'core-web') {
      return this.codingFiles().some((file) => /\.tsx?$/.test(file.path))
        ? 'typescript'
        : 'javascript';
    }
    return session.track;
  }

  private buildFrameworkQuestion(session: InterviewSession): Question | null {
    const task = session.coding?.task;
    if (!task || task.runner !== 'framework-preview' || session.track === 'core-web') {
      return null;
    }
    return {
      id: task.id,
      title: task.title,
      description: task.prompt,
      type: 'coding',
      technology: session.track,
      access: 'free',
      difficulty: session.level === 'junior'
        ? 'easy'
        : session.level === 'senior'
          ? 'hard'
          : 'intermediate',
      tags: [session.track, 'interview'],
      importance: 1,
      frameworkTests: [],
      code: '',
      ...(task.starterAsset ? { sdk: { asset: task.starterAsset } } : {}),
    } as Question;
  }

  private languageFromPath(path: string): string {
    const normalized = path.toLowerCase();
    if (normalized.endsWith('.ts') || normalized.endsWith('.tsx')) return 'typescript';
    if (normalized.endsWith('.js') || normalized.endsWith('.jsx')) return 'javascript';
    if (normalized.endsWith('.html') || normalized.endsWith('.vue')) return 'html';
    if (normalized.endsWith('.css') || normalized.endsWith('.scss')) return 'css';
    if (normalized.endsWith('.json')) return 'json';
    return 'plaintext';
  }

  private initializeMcqTiming(session: InterviewSession): void {
    if (this.mcqTimingInitializedForSession === session.id) return;
    this.mcqElapsedByQuestion.clear();
    this.mcqActiveQuestionId = null;
    this.mcqActiveSinceMs = null;
    this.mcqTimingInitializedForSession = session.id;
    if (!this.isBrowser) return;

    try {
      const raw = localStorage.getItem(this.mcqTimingKey());
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<LocalMcqTiming>;
      if (parsed.sessionId !== session.id || !parsed.elapsedByQuestion) return;
      const validQuestionIds = new Set(session.questions.map((question) => question.id));
      Object.entries(parsed.elapsedByQuestion).forEach(([questionId, duration]) => {
        const parsedDuration = Number(duration);
        if (validQuestionIds.has(questionId) && Number.isFinite(parsedDuration) && parsedDuration >= 0) {
          this.mcqElapsedByQuestion.set(
            questionId,
            Math.min(Math.round(parsedDuration), this.maxMcqResponseDurationMs),
          );
        }
      });
      const activeQuestionId = typeof parsed.activeQuestionId === 'string'
        && validQuestionIds.has(parsed.activeQuestionId)
        ? parsed.activeQuestionId
        : null;
      const activeSinceMs = Number(parsed.activeSinceMs);
      if (activeQuestionId && Number.isFinite(activeSinceMs)) {
        const resumedDelta = Math.min(
          this.maxMcqResponseDurationMs,
          Math.max(0, Date.now() - activeSinceMs),
        );
        this.mcqElapsedByQuestion.set(
          activeQuestionId,
          Math.min(
            this.maxMcqResponseDurationMs,
            (this.mcqElapsedByQuestion.get(activeQuestionId) || 0) + resumedDelta,
          ),
        );
      }
    } catch {
      // A malformed local timing record must never block the interview.
    }
  }

  private activateQuestionTiming(questionId: string | null): void {
    if (!questionId || this.session()?.status !== 'mcq_active') return;
    if (this.mcqActiveQuestionId === questionId && this.mcqActiveSinceMs !== null) return;
    this.pauseQuestionTiming();
    this.mcqActiveQuestionId = questionId;
    this.mcqActiveSinceMs = Date.now();
    this.persistMcqTiming();
  }

  private pauseQuestionTiming(): void {
    if (this.mcqActiveQuestionId && this.mcqActiveSinceMs !== null) {
      const current = this.mcqElapsedByQuestion.get(this.mcqActiveQuestionId) || 0;
      const delta = Math.max(0, Date.now() - this.mcqActiveSinceMs);
      this.mcqElapsedByQuestion.set(
        this.mcqActiveQuestionId,
        Math.min(this.maxMcqResponseDurationMs, current + delta),
      );
    }
    this.mcqActiveQuestionId = null;
    this.mcqActiveSinceMs = null;
    this.persistMcqTiming();
  }

  private snapshotQuestionDuration(questionId: string): number {
    if (this.mcqActiveQuestionId === questionId && this.mcqActiveSinceMs !== null) {
      const current = this.mcqElapsedByQuestion.get(questionId) || 0;
      const delta = Math.max(0, Date.now() - this.mcqActiveSinceMs);
      this.mcqElapsedByQuestion.set(
        questionId,
        Math.min(this.maxMcqResponseDurationMs, current + delta),
      );
      this.mcqActiveSinceMs = Date.now();
    }
    this.persistMcqTiming();
    return Math.round(this.mcqElapsedByQuestion.get(questionId) || 0);
  }

  private persistMcqTiming(): void {
    if (!this.isBrowser || !this.sessionId || this.mcqTimingInitializedForSession !== this.sessionId) {
      return;
    }
    const payload: LocalMcqTiming = {
      sessionId: this.sessionId,
      elapsedByQuestion: Object.fromEntries(this.mcqElapsedByQuestion),
      activeQuestionId: this.mcqActiveQuestionId,
      activeSinceMs: this.mcqActiveSinceMs,
    };
    try {
      localStorage.setItem(this.mcqTimingKey(), JSON.stringify(payload));
    } catch {
      // Calibration timing is best-effort and must not block answer saving.
    }
  }

  private clearMcqTiming(): void {
    this.mcqActiveQuestionId = null;
    this.mcqActiveSinceMs = null;
    this.mcqElapsedByQuestion.clear();
    this.mcqTimingInitializedForSession = null;
    if (!this.isBrowser || !this.sessionId) return;
    try {
      localStorage.removeItem(this.mcqTimingKey());
    } catch {
      // Ignore unavailable storage.
    }
  }

  private mcqTimingKey(): string {
    return `fa:interview:mcq-timing:v1:${this.sessionId}`;
  }

  private persistLocalDraft(): void {
    const session = this.session();
    const task = session?.coding?.task;
    if (!this.isBrowser || !session || !task) return;
    const draft: LocalCodingDraft = {
      sessionId: session.id,
      taskId: task.id,
      files: this.projectFiles(),
      updatedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(this.localDraftKey(), JSON.stringify(draft));
    } catch {
      // Server autosave can still succeed when storage is unavailable.
    }
  }

  private readLocalDraft(): LocalCodingDraft | null {
    if (!this.isBrowser) return null;
    try {
      const raw = localStorage.getItem(this.localDraftKey());
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<LocalCodingDraft>;
      if (
        parsed.sessionId !== this.sessionId
        || typeof parsed.taskId !== 'string'
        || !Array.isArray(parsed.files)
      ) {
        return null;
      }
      const files = parsed.files.filter(
        (file): file is Pick<InterviewCodingFile, 'path' | 'content'> =>
          !!file && typeof file.path === 'string' && typeof file.content === 'string',
      );
      return {
        sessionId: parsed.sessionId,
        taskId: parsed.taskId,
        files,
        updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : '',
      };
    } catch {
      return null;
    }
  }

  private mergeLocalFiles(
    serverFiles: InterviewCodingFile[],
    localFiles: Array<Pick<InterviewCodingFile, 'path' | 'content'>>,
  ): InterviewCodingFile[] {
    const localByPath = new Map(
      localFiles.map((file) => [file.path.replace(/^\/+/, ''), file.content]),
    );
    const merged = serverFiles.map((file) => {
      const normalizedPath = file.path.replace(/^\/+/, '');
      return file.readOnly || !localByPath.has(normalizedPath)
      ? { ...file }
      : { ...file, content: localByPath.get(normalizedPath) ?? file.content };
    });
    const known = new Set(serverFiles.map((file) => file.path.replace(/^\/+/, '')));
    localFiles.forEach((file) => {
      const path = file.path.replace(/\\/g, '/').replace(/^\/+/, '');
      const parts = path.split('/');
      if (
        known.has(path)
        || !path
        || path.length > 160
        || parts.some((part) => !part || part === '.' || part === '..')
        || /[\0\r\n]/.test(path)
      ) {
        return;
      }
      known.add(path);
      merged.push({
        path,
        language: this.languageFromPath(path),
        content: file.content,
        readOnly: false,
      });
    });
    return merged;
  }

  private clearLocalDraft(): void {
    if (!this.isBrowser) return;
    try {
      localStorage.removeItem(this.localDraftKey());
    } catch {
      // Ignore unavailable storage.
    }
  }

  private localDraftKey(): string {
    return `fa:interview:coding-draft:v1:${this.sessionId}`;
  }

  private isOnline(): boolean {
    return !this.isBrowser || navigator.onLine !== false;
  }
}
