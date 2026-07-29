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
import { InterviewSystemDesignRoundComponent } from './interview-system-design-round.component';

type DraftSyncState = 'idle' | 'saving' | 'saved' | 'offline' | 'error';
type LocalCodingDraft = {
  sessionId: string;
  taskId: string;
  files: Array<Pick<InterviewCodingFile, 'path' | 'content'>>;
  updatedAt: string;
  activeFilePath: string | null;
  dirty: boolean;
  baseHash: string | null;
};
type PendingMcqAnswer = {
  questionId: string;
  optionId: string;
  baseOptionId: string | null;
  responseDurationMs: number;
};
type LocalMcqTiming = {
  sessionId: string;
  elapsedByQuestion: Record<string, number>;
  activeQuestionId: string | null;
  activeSinceMs: number | null;
  viewQuestionId: string | null;
  reviewing: boolean;
  pendingAnswer: PendingMcqAnswer | null;
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
    InterviewSystemDesignRoundComponent,
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
  @ViewChild(InterviewSystemDesignRoundComponent)
  private systemDesignRound?: InterviewSystemDesignRoundComponent;

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
  readonly systemDesignRoundFrozen = signal(false);
  readonly codingRoundFrozen = signal(false);
  readonly codingDraftConflict = signal(false);
  readonly localCodingPersistenceAvailable = signal(true);

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
  private codingLocalDirty = false;
  private codingLocalBaseHash: string | null = null;
  private conflictingCodingDraft: LocalCodingDraft | null = null;
  private observedCodingLocalRaw: string | null | undefined;
  private mcqTimingInitializedForSession: string | null = null;
  private readonly mcqElapsedByQuestion = new Map<string, number>();
  private mcqActiveQuestionId: string | null = null;
  private mcqActiveSinceMs: number | null = null;
  private pendingMcqAnswer: PendingMcqAnswer | null = null;
  private readonly maxMcqResponseDurationMs = 10 * 60 * 1000;
  private ending = false;
  private systemDesignDeadlineExpired = false;
  private codingDeadlineExpired = false;
  private loadEpoch = 0;
  private codingAsyncEpoch = 0;
  private destroyed = false;

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
    this.destroyed = true;
    this.loadEpoch += 1;
    this.codingAsyncEpoch += 1;
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
    const requestEpoch = ++this.loadEpoch;
    this.loading.set(true);
    this.error.set(null);
    this.interviews.getSession(this.sessionId).subscribe({
      next: (session) => {
        if (this.destroyed || requestEpoch !== this.loadEpoch) return;
        this.loading.set(false);
        this.applySession(session);
        const remainsFrozen = (
          this.systemDesignDeadlineExpired
          && session.status === 'system_design_active'
        );
        this.systemDesignRoundFrozen.set(remainsFrozen);
        if (!remainsFrozen) this.systemDesignDeadlineExpired = false;
        const codingRemainsFrozen = (
          this.codingDeadlineExpired
          && (session.status === 'coding_ready' || session.status === 'coding_active')
        );
        this.codingRoundFrozen.set(codingRemainsFrozen);
        if (!codingRemainsFrozen) this.codingDeadlineExpired = false;
      },
      error: (error) => {
        if (this.destroyed || requestEpoch !== this.loadEpoch) return;
        this.loading.set(false);
        if (!this.systemDesignDeadlineExpired) {
          this.systemDesignRoundFrozen.set(false);
        }
        if (!this.codingDeadlineExpired) this.codingRoundFrozen.set(false);
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
    this.pendingMcqAnswer = {
      questionId: question.id,
      optionId,
      baseOptionId: previous,
      responseDurationMs,
    };
    this.patchQuestionAnswer(question.id, optionId);
    this.persistMcqTiming();
    this.savingAnswerFor.set(question.id);
    this.error.set(null);
    this.interviews.saveAnswer(
      session.id,
      { questionId: question.id, optionId, responseDurationMs },
      session.version,
    ).subscribe({
      next: (ack) => {
        if (this.destroyed) return;
        this.savingAnswerFor.set(null);
        this.clearPendingMcqAnswer(question.id, optionId);
        if (ack.session) {
          this.applySession(ack.session, { keepQuestionIndex: true });
        } else if (ack.version !== null) {
          this.patchSessionVersion(ack.version);
        }
      },
      error: (error) => {
        if (this.destroyed) return;
        this.savingAnswerFor.set(null);
        this.patchQuestionAnswer(question.id, previous);
        if (error?.status === 409) {
          this.error.set('This interview changed in another tab. Reloading the latest answers…');
          this.load();
        } else {
          this.clearPendingMcqAnswer(question.id, optionId);
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
    this.persistMcqTiming();
    if (this.isBrowser) window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  showReview(): void {
    if (this.savingAnswerFor()) return;
    this.pauseQuestionTiming();
    this.reviewing.set(true);
    this.persistMcqTiming();
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
    if (
      !session
      || session.status !== 'coding_ready'
      || this.transitioning()
      || this.codingRoundFrozen()
    ) return;
    this.transitioning.set(true);
    this.error.set(null);
    const requestEpoch = this.codingAsyncEpoch;
    this.interviews.startCoding(session.id, session.version).subscribe({
      next: (updated) => {
        if (this.ignoreCodingAsyncResult(requestEpoch)) return;
        this.transitioning.set(false);
        this.applySession(updated);
      },
      error: (error) => {
        if (this.ignoreCodingAsyncResult(requestEpoch)) return;
        this.transitioning.set(false);
        if (error?.status === 409) this.load();
        else this.error.set('The coding workspace could not be started. Please try again.');
      },
    });
  }

  selectFile(path: string): void {
    if (this.codingRoundFrozen() || this.codingDraftConflict()) return;
    if (this.codingFiles().some((file) => file.path === path)) {
      this.activeFilePath.set(path);
      this.persistLocalDraft();
    }
  }

  onCodeChange(content: string): void {
    if (this.codingRoundFrozen() || this.codingDraftConflict()) return;
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
      || this.codingRoundFrozen()
      || this.codingDraftConflict()
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
    const requestEpoch = this.codingAsyncEpoch;
    this.interviews.prepareCodingCheckRun(session.id, draftHash, session.version).subscribe({
      next: (prepared) => {
        if (this.ignoreCodingAsyncResult(requestEpoch)) return;
        void this.executePreparedChecks(session, prepared, requestEpoch);
      },
      error: (error) => {
        if (this.ignoreCodingAsyncResult(requestEpoch)) return;
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
    if (
      !session
      || session.status !== 'coding_active'
      || this.submittingCoding()
      || this.codingRoundFrozen()
      || this.codingDraftConflict()
    ) return;
    if (!draftHash || this.draftSaveInFlight) {
      this.error.set('Wait for the latest draft to finish syncing before submitting.');
      this.scheduleDraftSave(0);
      return;
    }
    this.submittingCoding.set(true);
    this.error.set(null);
    this.persistLocalDraft();
    const requestEpoch = this.codingAsyncEpoch;
    this.interviews.submitCoding(
      session.id,
      draftHash,
      session.version,
    ).subscribe({
      next: () => {
        if (this.ignoreCodingAsyncResult(requestEpoch)) return;
        this.submittingCoding.set(false);
        this.clearLocalDraft();
        void this.router.navigate(['/interview', session.id, 'results']);
      },
      error: (error) => {
        if (this.ignoreCodingAsyncResult(requestEpoch)) return;
        this.submittingCoding.set(false);
        if (error?.status === 409) {
          this.codingInitializedForTask = null;
          this.load();
        } else {
          this.error.set('The coding task could not be submitted. Your local draft is safe.');
        }
      },
    });
  }

  reconcileAfterCodingDeadline(deadlineExpired = false): void {
    if (deadlineExpired) {
      this.codingDeadlineExpired = true;
      this.codingRoundFrozen.set(true);
      this.codingAsyncEpoch += 1;
      if (this.draftTimer !== null) {
        clearTimeout(this.draftTimer);
        this.draftTimer = null;
      }
      this.syncedDraftHash.set(null);
    }
    this.error.set(null);
    this.load();
  }

  reconcileAfterSystemDesignDeadline(deadlineExpired = false): void {
    if (deadlineExpired) this.systemDesignDeadlineExpired = true;
    this.systemDesignRoundFrozen.set(true);
    this.error.set(null);
    this.load();
  }

  onSystemDesignSessionUpdated(session: InterviewSession): void {
    this.applySession(session);
  }

  onSystemDesignCompleted(sessionId: string): void {
    void this.router.navigate(['/interview', sessionId, 'results']);
  }

  onFrameworkFilesChanged(files: Record<string, string>): void {
    if (this.codingRoundFrozen() || this.codingDraftConflict()) return;
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
        this.clearSystemDesignLocalDraft(session.id);
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
    if (this.codingDraftConflict()) return 'Draft choice required';
    switch (this.draftSync()) {
      case 'saving': return 'Saving draft…';
      case 'saved': return 'Draft saved';
      case 'offline':
        return this.localCodingPersistenceAvailable()
          ? 'Offline · saved on this device'
          : 'Offline · kept in this tab only';
      case 'error':
        return this.localCodingPersistenceAvailable()
          ? 'Local draft safe · sync pending'
          : 'Draft kept in this tab only · sync pending';
      default: return 'Autosave ready';
    }
  }

  useServerCodingDraft(): void {
    if (!this.codingDraftConflict() || this.codingRoundFrozen()) return;
    const discarded = this.conflictingCodingDraft;
    this.conflictingCodingDraft = null;
    this.codingDraftConflict.set(false);
    this.codingLocalDirty = false;
    this.codingLocalBaseHash = this.session()?.coding?.draft?.hash ?? null;
    if (discarded) this.removeStoredCodingDraftIfMatches(discarded);
    this.initializeCodingFromCurrentSession(true);
  }

  restoreCodingDeviceDraft(): void {
    const local = this.conflictingCodingDraft;
    const session = this.session();
    const task = session?.coding?.task;
    if (
      !local
      || !session
      || !task
      || !this.codingDraftConflict()
      || this.codingRoundFrozen()
    ) return;
    const serverFiles = session.coding?.draft?.files?.length
      ? session.coding.draft.files
      : task.files;
    const files = this.mergeLocalFiles(serverFiles, local.files);
    this.conflictingCodingDraft = null;
    this.codingDraftConflict.set(false);
    this.codingLocalDirty = true;
    this.codingLocalBaseHash = session.coding?.draft?.hash ?? null;
    this.codingFiles.set(files);
    this.frameworkStarterFiles.set(this.filesAsFrameworkStarter(files));
    this.activeFilePath.set(
      files.some((file) => file.path === local.activeFilePath)
        ? local.activeFilePath || ''
        : files.find((file) => !file.readOnly)?.path ?? files[0]?.path ?? '',
    );
    this.syncedDraftHash.set(null);
    this.draftSync.set(this.isOnline() ? 'idle' : 'offline');
    this.persistLocalDraft();
    this.scheduleDraftSave(0);
  }

  private async executePreparedChecks(
    preparedFor: InterviewSession,
    prepared: InterviewPreparedCheckRun,
    requestEpoch: number,
  ): Promise<void> {
    try {
      const runnerResults = prepared.runnerConfig.kind === 'javascript'
        ? await this.runJavaScriptChecks(prepared)
        : await this.runFrameworkChecks(prepared.runnerConfig, prepared);
      const current = this.session();
      if (
        this.ignoreCodingAsyncResult(requestEpoch)
        ||
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
          if (this.ignoreCodingAsyncResult(requestEpoch)) return;
          this.runningChecks.set(false);
          this.checkResults.set(runnerResults);
          if (completed.version !== null) this.patchSessionVersion(completed.version);
        },
        error: (error) => {
          if (this.ignoreCodingAsyncResult(requestEpoch)) return;
          this.runningChecks.set(false);
          this.error.set(
            error?.status === 409
              ? 'The draft changed before check results were recorded. Run the checks again.'
              : 'Checks ran locally, but their result could not be recorded.',
          );
        },
      });
    } catch (error) {
      if (this.ignoreCodingAsyncResult(requestEpoch)) return;
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
    const mcqResume = session.status === 'mcq_active'
      ? this.initializeMcqTiming(session)
      : null;
    if (!options.keepQuestionIndex) {
      const resumedQuestionIndex = mcqResume?.viewQuestionId
        ? session.questions.findIndex(
          (question) => question.id === mcqResume.viewQuestionId,
        )
        : -1;
      this.currentIndex.set(
        resumedQuestionIndex >= 0
          ? resumedQuestionIndex
          : Math.min(session.currentQuestionIndex, Math.max(0, session.questions.length - 1)),
      );
      this.reviewing.set(mcqResume?.reviewing === true);
    }
    if (session.status === 'mcq_active') {
      if (!this.reviewing()) {
        this.activateQuestionTiming(
          session.questions[this.currentIndex()]?.id || null,
        );
      }
      this.reconcilePendingMcqAnswer(session);
    } else {
      this.clearMcqTiming();
    }
    if (session.status === 'coding_active') this.initializeCoding(session);
    if (['completed', 'abandoned', 'voided_technical'].includes(session.status)) {
      this.codingAsyncEpoch += 1;
      this.clearLocalDraft();
      this.clearSystemDesignLocalDraft(session.id);
    }
    if (session.status === 'completed') {
      void this.router.navigate(['/interview', session.id, 'results']);
    }
  }

  private initializeCoding(session: InterviewSession): void {
    const task = session.coding?.task;
    if (!task || this.codingInitializedForTask === task.id) return;
    this.codingInitializedForTask = task.id;
    this.initializeCodingFromCurrentSession();
  }

  private initializeCodingFromCurrentSession(ignoreLocalRecovery = false): void {
    const session = this.session();
    const task = session?.coding?.task;
    if (!session || !task) return;
    const serverFiles = session.coding?.draft?.files?.length
      ? session.coding.draft.files
      : task.files;
    const preservedConflict = ignoreLocalRecovery ? null : this.conflictingCodingDraft;
    const local = ignoreLocalRecovery
      ? null
      : preservedConflict ?? this.readLocalDraft(true);
    const serverHash = session.coding?.draft?.hash ?? null;
    const serverUpdatedAt = session.coding?.draft?.updatedAt;
    const localUpdatedMs = local?.updatedAt ? Date.parse(local.updatedAt) : Number.NaN;
    const serverUpdatedMs = serverUpdatedAt ? Date.parse(serverUpdatedAt) : Number.NaN;
    const matchingLocal = local?.taskId === task.id ? local : null;
    const localMatchesServer = matchingLocal?.dirty === true
      && Boolean(serverHash)
      && this.sameCodingFiles(serverFiles, matchingLocal.files);
    const causalLocal = matchingLocal?.dirty === true
      && !localMatchesServer
      && matchingLocal.baseHash === serverHash;
    const legacyLocal = matchingLocal
      && !matchingLocal.dirty
      && matchingLocal.baseHash === null
      && (
        !session.coding?.draft
        || (
          Number.isFinite(localUpdatedMs)
          && Number.isFinite(serverUpdatedMs)
          && localUpdatedMs > serverUpdatedMs
        )
      );
    const mismatchedDirtyLocal = matchingLocal?.dirty === true
      && !localMatchesServer
      && matchingLocal.baseHash !== serverHash;
    const useLocal = Boolean(causalLocal || legacyLocal);
    const files = useLocal
      ? this.mergeLocalFiles(serverFiles, matchingLocal!.files)
      : serverFiles.map((file) => ({ ...file }));
    this.conflictingCodingDraft = mismatchedDirtyLocal ? matchingLocal : null;
    this.codingDraftConflict.set(Boolean(mismatchedDirtyLocal));
    this.codingLocalDirty = useLocal;
    this.codingLocalBaseHash = useLocal ? matchingLocal!.baseHash : serverHash;
    if (matchingLocal && !useLocal && !mismatchedDirtyLocal) {
      this.removeStoredCodingDraftIfMatches(matchingLocal);
    }
    this.codingFiles.set(files);
    this.frameworkStarterFiles.set(this.filesAsFrameworkStarter(files));
    this.frameworkQuestion.set(this.buildFrameworkQuestion(session));
    this.activeFilePath.set(
      matchingLocal?.activeFilePath
        && files.some((file) => file.path === matchingLocal.activeFilePath)
        ? matchingLocal.activeFilePath
        : files.find((file) => !file.readOnly)?.path ?? files[0]?.path ?? '',
    );
    this.checkResults.set(session.coding?.checkResults ?? []);
    this.syncedDraftHash.set(
      useLocal || mismatchedDirtyLocal ? null : serverHash,
    );
    if (useLocal) {
      this.draftSync.set(this.isOnline() ? 'idle' : 'offline');
      this.scheduleDraftSave(0);
    } else if (mismatchedDirtyLocal) {
      this.draftSync.set('error');
    } else {
      this.draftSync.set(this.syncedDraftHash() ? 'saved' : 'idle');
      if (!this.syncedDraftHash()) this.scheduleDraftSave(0);
    }
  }

  private filesAsFrameworkStarter(
    files: InterviewCodingFile[],
  ): Record<string, string> | null {
    return files.length
      ? Object.fromEntries(
        files.map((file) => [file.path.replace(/^\/+/, ''), file.content]),
      )
      : null;
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
    if (this.codingRoundFrozen() || this.codingDraftConflict() || this.destroyed) return;
    if (this.draftTimer !== null) clearTimeout(this.draftTimer);
    this.draftTimer = setTimeout(() => {
      this.draftTimer = null;
      this.saveDraftNow();
    }, delayMs);
  }

  private saveDraftNow(): void {
    const session = this.session();
    if (
      !session
      || session.status !== 'coding_active'
      || !this.codingFiles().length
      || this.codingRoundFrozen()
      || this.codingDraftConflict()
      || this.destroyed
    ) return;
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
    const requestEpoch = this.codingAsyncEpoch;
    this.interviews.saveCodingDraft(
      session.id,
      {
        language: this.codingLanguage(session),
        files: this.projectFiles(),
      },
      session.version,
    ).subscribe({
      next: (saved) => {
        if (this.ignoreCodingAsyncResult(requestEpoch)) return;
        this.draftSaveInFlight = false;
        if (saved.version !== null) this.patchSessionVersion(saved.version);
        const hash = saved.draft?.hash || null;
        if (this.draftChangedWhileSaving) {
          this.codingLocalDirty = true;
          if (hash) this.codingLocalBaseHash = hash;
          this.syncedDraftHash.set(null);
          this.draftSync.set('idle');
          this.persistLocalDraft();
          this.scheduleDraftSave(0);
          return;
        }
        this.codingLocalDirty = !hash;
        if (hash) this.codingLocalBaseHash = hash;
        this.syncedDraftHash.set(hash);
        this.draftSync.set(hash ? 'saved' : 'error');
        this.persistLocalDraft();
        if (!hash) {
          this.error.set('The draft synced, but its verification hash was missing. Reload before submitting.');
        }
      },
      error: (error) => {
        if (this.ignoreCodingAsyncResult(requestEpoch)) return;
        this.draftSaveInFlight = false;
        this.codingLocalDirty = true;
        this.syncedDraftHash.set(null);
        this.draftSync.set(this.isOnline() ? 'error' : 'offline');
        if (error?.status === 409) {
          this.error.set('Draft sync paused because this interview changed in another tab.');
          this.conflictingCodingDraft = this.localCodingDraftSnapshot(true);
          this.codingInitializedForTask = null;
          this.load();
        }
      },
    });
  }

  private projectFiles(): Array<Pick<InterviewCodingFile, 'path' | 'content'>> {
    return this.codingFiles().map(({ path, content }) => ({ path, content }));
  }

  private markDraftChanged(): void {
    if (this.codingRoundFrozen() || this.codingDraftConflict()) return;
    if (!this.codingLocalDirty) this.codingLocalBaseHash = this.syncedDraftHash();
    this.codingLocalDirty = true;
    if (this.draftSaveInFlight) this.draftChangedWhileSaving = true;
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

  private initializeMcqTiming(
    session: InterviewSession,
  ): { viewQuestionId: string | null; reviewing: boolean } | null {
    if (this.mcqTimingInitializedForSession === session.id) {
      return {
        viewQuestionId: this.currentQuestion()?.id ?? null,
        reviewing: this.reviewing(),
      };
    }
    this.mcqElapsedByQuestion.clear();
    this.mcqActiveQuestionId = null;
    this.mcqActiveSinceMs = null;
    this.pendingMcqAnswer = null;
    this.mcqTimingInitializedForSession = session.id;
    if (!this.isBrowser) return null;

    try {
      const raw = localStorage.getItem(this.mcqTimingKey());
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<LocalMcqTiming>;
      if (parsed.sessionId !== session.id || !parsed.elapsedByQuestion) return null;
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
      const viewQuestionId = typeof parsed.viewQuestionId === 'string'
        && validQuestionIds.has(parsed.viewQuestionId)
        ? parsed.viewQuestionId
        : activeQuestionId;
      const pending = parsed.pendingAnswer;
      if (pending && validQuestionIds.has(String(pending.questionId || ''))) {
        const question = session.questions.find(
          (candidate) => candidate.id === pending.questionId,
        );
        const optionIds = new Set(question?.options.map((option) => option.id) ?? []);
        const baseOptionId = pending.baseOptionId == null
          ? null
          : String(pending.baseOptionId);
        if (
          optionIds.has(String(pending.optionId || ''))
          && (baseOptionId === null || optionIds.has(baseOptionId))
        ) {
          this.pendingMcqAnswer = {
            questionId: String(pending.questionId),
            optionId: String(pending.optionId),
            baseOptionId,
            responseDurationMs: Math.min(
              this.maxMcqResponseDurationMs,
              Math.max(0, Math.round(Number(pending.responseDurationMs) || 0)),
            ),
          };
        }
      }
      return {
        viewQuestionId,
        reviewing: parsed.reviewing === true,
      };
    } catch {
      // A malformed local timing record must never block the interview.
      return null;
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
      viewQuestionId: this.currentQuestion()?.id ?? null,
      reviewing: this.reviewing(),
      pendingAnswer: this.pendingMcqAnswer,
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
    this.pendingMcqAnswer = null;
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

  private clearPendingMcqAnswer(questionId: string, optionId: string): void {
    if (
      this.pendingMcqAnswer?.questionId !== questionId
      || this.pendingMcqAnswer.optionId !== optionId
    ) return;
    this.pendingMcqAnswer = null;
    this.persistMcqTiming();
  }

  private reconcilePendingMcqAnswer(session: InterviewSession): void {
    const pending = this.pendingMcqAnswer;
    if (!pending || this.savingAnswerFor() || session.status !== 'mcq_active') return;
    const question = session.questions.find(
      (candidate) => candidate.id === pending.questionId,
    );
    if (!question) {
      this.pendingMcqAnswer = null;
      this.persistMcqTiming();
      return;
    }
    if (question.selectedOptionId === pending.optionId) {
      this.clearPendingMcqAnswer(pending.questionId, pending.optionId);
      return;
    }
    if (question.selectedOptionId !== pending.baseOptionId) {
      this.pendingMcqAnswer = null;
      this.persistMcqTiming();
      this.error.set(
        'This answer changed in another tab. The server answer was kept so no work was overwritten.',
      );
      return;
    }

    this.patchQuestionAnswer(pending.questionId, pending.optionId);
    this.savingAnswerFor.set(pending.questionId);
    this.interviews.saveAnswer(
      session.id,
      {
        questionId: pending.questionId,
        optionId: pending.optionId,
        responseDurationMs: pending.responseDurationMs,
      },
      session.version,
    ).subscribe({
      next: (ack) => {
        if (this.destroyed) return;
        this.savingAnswerFor.set(null);
        this.clearPendingMcqAnswer(pending.questionId, pending.optionId);
        if (ack.session) {
          this.applySession(ack.session, { keepQuestionIndex: true });
        } else if (ack.version !== null) {
          this.patchSessionVersion(ack.version);
        }
      },
      error: (error) => {
        if (this.destroyed) return;
        this.savingAnswerFor.set(null);
        this.patchQuestionAnswer(pending.questionId, pending.baseOptionId);
        if (error?.status === 409) {
          this.load();
        } else {
          this.clearPendingMcqAnswer(pending.questionId, pending.optionId);
          this.error.set('Your pending answer could not be restored. Please select it again.');
        }
      },
    });
  }

  private persistLocalDraft(): void {
    if (!this.isBrowser) return;
    const draft = this.localCodingDraftSnapshot();
    if (!draft) return;
    try {
      const storageKey = this.localDraftKey();
      const currentRaw = localStorage.getItem(storageKey);
      if (
        this.observedCodingLocalRaw !== undefined
        && currentRaw !== this.observedCodingLocalRaw
      ) {
        this.localCodingPersistenceAvailable.set(false);
        return;
      }
      const serialized = JSON.stringify(draft);
      localStorage.setItem(storageKey, serialized);
      this.observedCodingLocalRaw = serialized;
      this.localCodingPersistenceAvailable.set(true);
    } catch {
      this.localCodingPersistenceAvailable.set(false);
    }
  }

  private localCodingDraftSnapshot(
    dirty = this.codingLocalDirty,
  ): LocalCodingDraft | null {
    const session = this.session();
    const task = session?.coding?.task;
    if (!session || !task) return null;
    return {
      sessionId: session.id,
      taskId: task.id,
      files: this.projectFiles(),
      updatedAt: new Date().toISOString(),
      activeFilePath: this.activeFilePath() || null,
      dirty,
      baseHash: this.codingLocalBaseHash,
    };
  }

  private readLocalDraft(observe = false): LocalCodingDraft | null {
    if (!this.isBrowser) return null;
    try {
      const raw = localStorage.getItem(this.localDraftKey());
      if (observe) this.observedCodingLocalRaw = raw;
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
        activeFilePath: typeof parsed.activeFilePath === 'string'
          ? parsed.activeFilePath
          : null,
        dirty: parsed.dirty === true,
        baseHash: typeof parsed.baseHash === 'string' ? parsed.baseHash : null,
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

  private sameCodingFiles(
    serverFiles: Array<Pick<InterviewCodingFile, 'path' | 'content'>>,
    localFiles: Array<Pick<InterviewCodingFile, 'path' | 'content'>>,
  ): boolean {
    const canonicalize = (
      files: Array<Pick<InterviewCodingFile, 'path' | 'content'>>,
    ) => files
      .map((file) => ({
        path: file.path.replace(/\\/g, '/').replace(/^\/+/, ''),
        content: file.content,
      }))
      .sort((left, right) => (
        left.path.localeCompare(right.path)
        || left.content.localeCompare(right.content)
      ));
    return JSON.stringify(canonicalize(serverFiles))
      === JSON.stringify(canonicalize(localFiles));
  }

  private clearLocalDraft(): void {
    if (!this.isBrowser) return;
    try {
      localStorage.removeItem(this.localDraftKey());
      this.observedCodingLocalRaw = null;
    } catch {
      // Ignore unavailable storage.
    }
  }

  private removeStoredCodingDraftIfMatches(expected: LocalCodingDraft): void {
    const current = this.readLocalDraft();
    if (!current || JSON.stringify(current) !== JSON.stringify(expected)) return;
    this.clearLocalDraft();
  }

  private clearSystemDesignLocalDraft(sessionId: string): void {
    this.systemDesignRound?.discardLocalDraft();
    if (!this.isBrowser || !sessionId) return;
    try {
      localStorage.removeItem(`fa:interview:system-design-draft:v1:${sessionId}`);
    } catch {
      // Ignore unavailable storage after an authoritative terminal transition.
    }
  }

  private localDraftKey(): string {
    return `fa:interview:coding-draft:v1:${this.sessionId}`;
  }

  private isOnline(): boolean {
    return !this.isBrowser || navigator.onLine !== false;
  }

  private ignoreCodingAsyncResult(requestEpoch: number): boolean {
    return (
      this.destroyed
      || this.codingRoundFrozen()
      || requestEpoch !== this.codingAsyncEpoch
    );
  }
}
