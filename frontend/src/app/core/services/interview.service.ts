import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  CreateInterviewSessionRequest,
  InterviewAvailability,
  InterviewAccessMode,
  InterviewCheckResult,
  InterviewCheckRunResult,
  InterviewChoice,
  InterviewCodingDraft,
  InterviewCodingFile,
  InterviewCodingResult,
  InterviewCodingState,
  InterviewCodingTask,
  InterviewDraftSaveResult,
  InterviewFrameworkCheck,
  InterviewFrameworkRunnerConfig,
  InterviewJavaScriptRunnerConfig,
  InterviewLevel,
  InterviewMcqOption,
  InterviewMcqQuestion,
  InterviewMcqResult,
  InterviewMutationAck,
  InterviewPreparedCheckRun,
  InterviewQuota,
  InterviewResult,
  InterviewResultLink,
  InterviewSectionResult,
  InterviewSession,
  InterviewSessionLink,
  InterviewSessionStatus,
  InterviewTargetAvailability,
  InterviewTrack,
  SaveInterviewAnswerRequest,
  SaveInterviewCodingDraftRequest,
} from '../models/interview.model';
import { apiUrl } from '../utils/api-base';

type JsonRecord = Record<string, unknown>;

@Injectable({ providedIn: 'root' })
export class InterviewService {
  private readonly http = inject(HttpClient);
  private readonly base = apiUrl('/interviews');

  getAvailability(): Observable<InterviewAvailability> {
    return this.http
      .get<unknown>(`${this.base}/availability`, { withCredentials: true })
      .pipe(map((payload) => this.normalizeAvailability(payload)));
  }

  createSession(
    request: CreateInterviewSessionRequest,
    idempotencyKey: string,
  ): Observable<InterviewSession> {
    return this.http
      .post<unknown>(this.base, request, {
        withCredentials: true,
        headers: new HttpHeaders({ 'Idempotency-Key': idempotencyKey }),
      })
      .pipe(map((payload) => this.normalizeSession(payload)));
  }

  getActiveSession(): Observable<InterviewSession | null> {
    return this.http
      .get<unknown>(`${this.base}/active`, { withCredentials: true })
      .pipe(map((payload) => this.normalizeOptionalSession(payload)));
  }

  getSession(sessionId: string): Observable<InterviewSession> {
    return this.http
      .get<unknown>(`${this.base}/${this.encode(sessionId)}`, { withCredentials: true })
      .pipe(map((payload) => this.normalizeSession(payload)));
  }

  saveAnswer(
    sessionId: string,
    request: SaveInterviewAnswerRequest,
    expectedVersion: number,
  ): Observable<InterviewMutationAck> {
    return this.http
      .put<unknown>(
        `${this.base}/${this.encode(sessionId)}/mcq/${this.encode(request.questionId)}`,
        {
          optionId: request.optionId,
          ...(Number.isFinite(request.responseDurationMs)
            ? { responseDurationMs: Math.max(0, Math.round(request.responseDurationMs!)) }
            : {}),
          expectedVersion,
        },
        { withCredentials: true },
      )
      .pipe(map((payload) => ({
        version: this.normalizeResponseVersion(payload),
        session: this.normalizeOptionalSession(payload),
      })));
  }

  submitMcq(sessionId: string, expectedVersion: number): Observable<InterviewSession> {
    return this.http
      .post<unknown>(
        `${this.base}/${this.encode(sessionId)}/mcq/submit`,
        { expectedVersion },
        { withCredentials: true },
      )
      .pipe(map((payload) => this.normalizeSession(payload)));
  }

  startCoding(sessionId: string, expectedVersion: number): Observable<InterviewSession> {
    return this.http
      .post<unknown>(
        `${this.base}/${this.encode(sessionId)}/coding/start`,
        { expectedVersion },
        { withCredentials: true },
      )
      .pipe(map((payload) => this.normalizeSession(payload)));
  }

  saveCodingDraft(
    sessionId: string,
    request: SaveInterviewCodingDraftRequest,
    expectedVersion: number,
  ): Observable<InterviewDraftSaveResult> {
    return this.http
      .put<unknown>(
        `${this.base}/${this.encode(sessionId)}/coding/draft`,
        { ...request, expectedVersion },
        { withCredentials: true },
      )
      .pipe(map((payload) => ({
        version: this.normalizeResponseVersion(payload),
        draft: this.normalizeOptionalDraft(payload),
      })));
  }

  prepareCodingCheckRun(
    sessionId: string,
    draftHash: string,
    expectedVersion: number,
  ): Observable<InterviewPreparedCheckRun> {
    return this.http
      .post<unknown>(
        `${this.base}/${this.encode(sessionId)}/coding/check-runs`,
        { action: 'prepare', draftHash, expectedVersion },
        { withCredentials: true },
      )
      .pipe(map((payload) => this.normalizePreparedCheckRun(payload)));
  }

  completeCodingCheckRun(
    sessionId: string,
    prepared: Pick<InterviewPreparedCheckRun, 'runToken' | 'draftHash'>,
    checks: Array<Pick<InterviewCheckResult, 'id' | 'passed'>>,
    expectedVersion: number,
  ): Observable<InterviewCheckRunResult> {
    return this.http
      .post<unknown>(
        `${this.base}/${this.encode(sessionId)}/coding/check-runs`,
        {
          action: 'complete',
          runToken: prepared.runToken,
          draftHash: prepared.draftHash,
          checks,
          expectedVersion,
        },
        { withCredentials: true },
      )
      .pipe(map((payload) => ({
        version: this.normalizeResponseVersion(payload),
        results: this.normalizeChecks(payload),
      })));
  }

  submitCoding(
    sessionId: string,
    draftHash: string,
    expectedVersion: number,
  ): Observable<InterviewResult | null> {
    return this.http
      .post<unknown>(
        `${this.base}/${this.encode(sessionId)}/coding/submit`,
        { draftHash, expectedVersion },
        { withCredentials: true },
      )
      .pipe(map((payload) => this.normalizeOptionalResult(payload)));
  }

  endSession(sessionId: string, expectedVersion: number): Observable<InterviewResult | null> {
    return this.http
      .post<unknown>(
        `${this.base}/${this.encode(sessionId)}/end`,
        { expectedVersion },
        { withCredentials: true },
      )
      .pipe(map((payload) => this.normalizeOptionalResult(payload)));
  }

  getResult(sessionId: string): Observable<InterviewResult> {
    return this.http
      .get<unknown>(
        `${this.base}/${this.encode(sessionId)}/results`,
        { withCredentials: true },
      )
      .pipe(map((payload) => this.normalizeResult(payload)));
  }

  normalizeAvailability(payload: unknown): InterviewAvailability {
    const source = this.unwrap(payload, 'availability');
    const advertisedEnabled = source['enabled'] === true;
    const accessMode = advertisedEnabled
      ? this.normalizeAccessMode(source['accessMode'])
      : 'off';
    const quotaSource = this.record(source['quota']);
    const activeSource = this.record(source['activeSession'] ?? source['active']);
    const rawResults = this.array(source['lastResults'] ?? source['recentResults']);
    const targets = this.array(source['availability'])
      .map((value) => this.normalizeTargetAvailability(value))
      .filter((value): value is InterviewTargetAvailability => value !== null);
    return {
      enabled: advertisedEnabled && accessMode !== 'off',
      accessMode,
      unavailableReason: this.optionalText(source['unavailableReason'] ?? source['reason']),
      quota: quotaSource ? this.normalizeQuota(quotaSource) : null,
      activeSession: activeSource ? this.normalizeSessionLink(activeSource) : null,
      lastResults: rawResults
        .map((value) => this.normalizeResultLink(this.record(value)))
        .filter((value): value is InterviewResultLink => value !== null),
      targets,
      levels: this.normalizeChoices<InterviewLevel>(
        source['levels'],
        ['junior', 'mid', 'senior'],
        { junior: 'Junior', mid: 'Mid-level', senior: 'Senior' },
      ),
      tracks: this.normalizeChoices<InterviewTrack>(
        source['tracks'],
        ['core-web', 'react', 'angular', 'vue'],
        { 'core-web': 'Core Web', react: 'React', angular: 'Angular', vue: 'Vue' },
      ),
      minViewportWidth: this.positiveInteger(source['minViewportWidth']) ?? 768,
      timing: {
        mcqSeconds: this.positiveInteger(this.record(source['timing'])?.['mcqSeconds']) ?? 600,
        codingReadySeconds:
          this.positiveInteger(this.record(source['timing'])?.['codingReadySeconds']) ?? 300,
      },
    };
  }

  private normalizeAccessMode(value: unknown): InterviewAccessMode {
    const normalized = this.text(value).toLowerCase();
    if (!normalized) return 'off';
    if (normalized === 'on') return 'public';
    if (normalized === 'off' || normalized === 'internal' || normalized === 'public') {
      return normalized;
    }
    return 'off';
  }

  private normalizeTargetAvailability(value: unknown): InterviewTargetAvailability | null {
    const source = this.record(value);
    if (!source) return null;
    const level = this.text(source['level']).toLowerCase();
    const track = this.text(source['track']).toLowerCase();
    if (!['junior', 'mid', 'senior'].includes(level)) return null;
    if (!['core-web', 'react', 'angular', 'vue'].includes(track)) return null;
    return {
      level: level as InterviewLevel,
      track: track as InterviewTrack,
      available: source['available'] === true,
    };
  }

  normalizeSession(payload: unknown): InterviewSession {
    const source = this.unwrap(payload, 'session');
    const mcqSource = this.record(source['mcq']);
    const deadlines = this.record(source['deadlines']);
    const bank = this.record(source['bank']);
    const answerMap = this.normalizeAnswerMap(
      source['responses'] ?? source['answers'] ?? mcqSource?.['answers'],
    );
    const questions = this.array(source['questions'] ?? mcqSource?.['questions'])
      .map((value) => this.normalizeQuestion(value, answerMap))
      .filter((value): value is InterviewMcqQuestion => value !== null);
    const id = this.text(source['id'] ?? source['sessionId']);
    if (!id) throw new Error('Interview session response is missing an id.');

    return {
      id,
      status: this.normalizeStatus(source['status'] ?? source['phase']),
      level: this.normalizeLevel(source['level']),
      track: this.normalizeTrack(source['track'] ?? source['framework']),
      version: this.nonNegativeInteger(source['version'] ?? source['sessionVersion']) ?? 0,
      bankVersion: this.text(
        source['bankVersion'] ?? source['contentVersion'] ?? bank?.['version'],
      ) || 'unknown',
      serverNow: this.isoText(source['serverNow']) ?? new Date().toISOString(),
      mcqDeadlineAt: this.isoText(
        source['mcqDeadlineAt'] ?? mcqSource?.['deadlineAt'] ?? deadlines?.['mcq'],
      ),
      codingReadyDeadlineAt: this.isoText(
        source['codingReadyDeadlineAt']
          ?? this.record(source['coding'])?.['readyDeadlineAt']
          ?? deadlines?.['codingReady'],
      ),
      questions,
      currentQuestionIndex: this.clampIndex(
        this.nonNegativeInteger(
          source['currentQuestionIndex'] ?? mcqSource?.['currentQuestionIndex'],
        ) ?? 0,
        questions.length,
      ),
      coding: this.normalizeCodingState(source['coding'], deadlines),
    };
  }

  normalizeResult(payload: unknown): InterviewResult {
    const root = this.record(payload);
    const source = this.record(root?.['results'])
      ?? this.record(root?.['result'])
      ?? root
      ?? {};
    const mcqSource = this.record(source['mcq']);
    const scoreSource = this.record(
      source['score'] ?? source['mcqScore'] ?? mcqSource,
    ) ?? {};
    const correct = this.nonNegativeInteger(scoreSource['correct']) ?? 0;
    const incorrect = this.nonNegativeInteger(scoreSource['incorrect'] ?? scoreSource['wrong']) ?? 0;
    const unanswered = this.nonNegativeInteger(scoreSource['unanswered']) ?? 0;
    const total = this.nonNegativeInteger(scoreSource['total']) ?? correct + incorrect + unanswered;
    const sessionId = this.text(source['sessionId'] ?? source['id']);
    if (!sessionId) throw new Error('Interview result response is missing a session id.');
    const breakdown = this.record(mcqSource?.['breakdown']);
    const breakdownRows = breakdown
      ? [
        {
          id: 'core-web',
          label: 'Core Web',
          ...(this.record(breakdown['coreWeb'] ?? breakdown['core']) ?? {}),
        },
        {
          id: 'framework',
          label: 'Framework',
          ...(this.record(breakdown['framework']) ?? {}),
        },
      ]
      : this.array(source['sections'] ?? source['breakdown']);
    const reviewNext = this.array(source['reviewNext']);
    const remediationTopics = (
      reviewNext.length
        ? reviewNext.map((entry) => this.text(this.record(entry)?.['topic'] ?? entry))
        : this.stringList(source['remediationTopics'] ?? source['reviewTopics'])
    ).filter(Boolean).slice(0, 3);

    return {
      sessionId,
      level: this.normalizeLevel(source['level']),
      track: this.normalizeTrack(source['track'] ?? source['framework']),
      completedAt: this.isoText(source['completedAt'] ?? source['finalizedAt']),
      score: {
        correct,
        incorrect,
        unanswered,
        total,
      },
      sections: breakdownRows
        .map((value) => this.normalizeSectionResult(value))
        .filter((value): value is InterviewSectionResult => value !== null)
        .filter((value) => value.total > 0),
      questions: this.array(
        source['questions'] ?? source['mcqResults'] ?? mcqSource?.['questions'],
      )
        .map((value) => this.normalizeQuestionResult(value))
        .filter((value): value is InterviewMcqResult => value !== null),
      remediationTopics,
      coding: this.normalizeCodingResult(source['coding']),
      disclaimer: this.text(source['disclaimer'] ?? source['evidenceNotice'])
        || 'This mock interview is preparation feedback, not an employment decision.',
      mcqTiming: this.normalizeTiming(
        mcqSource?.['timing'] ?? source['mcqTiming'],
      ),
      codingTiming: this.record(source['coding'])
        ? this.normalizeTiming(this.record(source['coding'])?.['timing'])
        : null,
      xpAwarded: 0,
    };
  }

  private normalizeQuota(source: JsonRecord): InterviewQuota {
    const unlimited = source['unlimited'] === true;
    return {
      remaining: unlimited ? null : this.nonNegativeInteger(source['remaining']) ?? 0,
      limit: this.nonNegativeInteger(source['limit']),
      resetAt: this.isoText(source['resetAt']),
      unlimited,
    };
  }

  private normalizeSessionLink(source: JsonRecord): InterviewSessionLink | null {
    const id = this.text(source['id'] ?? source['sessionId']);
    if (!id) return null;
    return {
      id,
      status: this.normalizeStatus(source['status'] ?? source['phase']),
      level: this.optionalLevel(source['level']),
      track: this.optionalTrack(source['track'] ?? source['framework']),
      updatedAt: this.isoText(source['updatedAt']) ?? undefined,
    };
  }

  private normalizeResultLink(source: JsonRecord | null): InterviewResultLink | null {
    if (!source) return null;
    const sessionId = this.text(source['sessionId'] ?? source['id']);
    if (!sessionId) return null;
    const mcq = this.record(source['mcq']);
    return {
      sessionId,
      completedAt: this.isoText(
        source['completedAt'] ?? source['endedAt'] ?? source['finalizedAt'],
      ) ?? undefined,
      level: this.optionalLevel(source['level']),
      track: this.optionalTrack(source['track'] ?? source['framework']),
      correct: this.nonNegativeInteger(
        source['correct'] ?? this.record(source['score'])?.['correct'] ?? mcq?.['correct'],
      ) ?? undefined,
      total: this.nonNegativeInteger(
        source['total'] ?? this.record(source['score'])?.['total'] ?? mcq?.['total'],
      ) ?? undefined,
    };
  }

  private normalizeQuestion(
    value: unknown,
    answerMap: Map<string, string>,
  ): InterviewMcqQuestion | null {
    const source = this.record(value);
    if (!source) return null;
    const publicSource = this.record(source['public']) ?? source;
    const id = this.text(publicSource['id'] ?? source['id']);
    const prompt = this.text(publicSource['prompt'] ?? publicSource['stem']);
    const options = this.array(publicSource['options'])
      .map((option) => this.normalizeOption(option))
      .filter((option): option is InterviewMcqOption => option !== null);
    if (!id || !prompt || options.length < 2) return null;
    const selected = this.optionalText(
      source['selectedOptionId'] ?? answerMap.get(id),
    );
    return {
      id,
      revision: this.positiveInteger(publicSource['revision']) ?? 1,
      technology: this.text(publicSource['technology'] ?? publicSource['tech']) || 'frontend',
      competency: this.text(publicSource['competency'] ?? publicSource['topic']) || 'Frontend',
      prompt,
      code: this.optionalText(publicSource['code']) ?? undefined,
      codeLanguage: this.optionalText(publicSource['codeLanguage'] ?? publicSource['language']) ?? undefined,
      options,
      estimatedSeconds: this.positiveInteger(publicSource['estimatedSeconds']) ?? undefined,
      selectedOptionId: selected && options.some((option) => option.id === selected)
        ? selected
        : null,
    };
  }

  private normalizeOption(value: unknown): InterviewMcqOption | null {
    const source = this.record(value);
    if (!source) return null;
    const id = this.text(source['id'] ?? source['optionId']);
    const label = this.text(source['label'] ?? source['text']);
    return id && label ? { id, label } : null;
  }

  private normalizeCodingState(
    value: unknown,
    deadlines: JsonRecord | null,
  ): InterviewCodingState | null {
    const source = this.record(value);
    if (!source) return null;
    const checkRuns = this.array(source['checkRuns']);
    const latestRun = this.record(checkRuns[checkRuns.length - 1]);
    return {
      readyDeadlineAt: this.isoText(source['readyDeadlineAt'] ?? deadlines?.['codingReady']),
      deadlineAt: this.isoText(source['deadlineAt'] ?? deadlines?.['coding']),
      task: this.normalizeCodingTask(
        source['task'] ?? source['question'] ?? source['variant'],
      ),
      draft: this.normalizeOptionalDraft(source['draft']),
      checkResults: this.normalizeCheckArray(
        source['checkResults'] ?? source['checks'] ?? latestRun?.['checks'],
      ),
      runCount: this.nonNegativeInteger(source['runCount'] ?? source['runs'])
        ?? checkRuns.length,
    };
  }

  private normalizeCodingTask(value: unknown): InterviewCodingTask | null {
    const source = this.record(value);
    if (!source) return null;
    const id = this.text(source['id'] ?? source['taskId']);
    const title = this.text(source['title']);
    const files = this.normalizeFiles(source['files'] ?? source['starterFiles']);
    const starterAsset = this.optionalText(source['starterAsset']);
    if (!id || !title || (!files.length && !starterAsset)) return null;
    const rawRequirements = this.array(
      source['publicRequirements'] ?? source['requirements'] ?? source['acceptanceCriteria'],
    );
    return {
      id,
      title,
      prompt: this.text(source['prompt'] ?? source['description']),
      runner: this.text(source['runner']) === 'framework-preview'
        ? 'framework-preview'
        : 'javascript',
      sourceQuestionId: this.text(source['sourceQuestionId']) || id,
      sourceContentVersion: this.text(source['sourceContentVersion']) || 'unknown',
      starterAsset,
      requirements: rawRequirements
        .map((entry, index) => {
          const requirement = this.record(entry);
          if (!requirement) {
            const label = this.text(entry);
            return label
              ? {
                id: `requirement-${index + 1}`,
                title: label,
                prompt: '',
                constraints: [],
              }
              : null;
          }
          const title = this.text(requirement['title'] ?? requirement['label']);
          if (!title) return null;
          return {
            id: this.text(requirement['id']) || `requirement-${index + 1}`,
            title,
            prompt: this.text(requirement['prompt'] ?? requirement['description']),
            constraints: this.stringList(
              requirement['constraints'] ?? requirement['criteria'],
            ),
          };
        })
        .filter((requirement): requirement is NonNullable<typeof requirement> => requirement !== null),
      files,
    };
  }

  private normalizeFiles(value: unknown): InterviewCodingFile[] {
    const rows = Array.isArray(value)
      ? value
      : this.record(value)
        ? Object.entries(this.record(value)!).map(([path, content]) => ({ path, content }))
        : [];
    return rows
      .map((row) => {
        const source = this.record(row);
        if (!source) return null;
        const path = this.text(source['path'] ?? source['name']);
        if (!path) return null;
        return {
          path,
          language: this.text(source['language']) || this.languageFromPath(path),
          content: typeof source['content'] === 'string'
            ? source['content']
            : typeof source['starterContent'] === 'string'
              ? source['starterContent']
              : typeof source['code'] === 'string'
                ? source['code']
                : '',
          readOnly: source['readOnly'] === true,
        } satisfies InterviewCodingFile;
      })
      .filter((file): file is InterviewCodingFile => file !== null);
  }

  private normalizeOptionalDraft(payload: unknown): InterviewCodingDraft | null {
    const root = this.record(payload);
    const session = this.record(root?.['session']);
    const coding = this.record(session?.['coding']);
    const source = this.record(root?.['draft'])
      ?? this.record(coding?.['draft'])
      ?? (
        root && (
          Array.isArray(root['files'])
          || this.record(root['files'])
        )
          ? root
          : null
      );
    if (!source) return null;
    const files = this.normalizeFiles(source['files']);
    if (!files.length) return null;
    return {
      files,
      hash: this.text(source['hash'] ?? source['draftHash']),
      revision: this.nonNegativeInteger(source['revision']),
      updatedAt: this.isoText(source['updatedAt']),
    };
  }

  private normalizePreparedCheckRun(payload: unknown): InterviewPreparedCheckRun {
    const root = this.record(payload);
    const source = this.record(root?.['prepared'])
      ?? this.record(root?.['preparedRun'])
      ?? root
      ?? {};
    const runToken = this.text(source['runToken']);
    const draftHash = this.text(source['draftHash']);
    const expiresAt = this.isoText(source['expiresAt']);
    const expectedCheckIds = this.stringList(source['expectedCheckIds']);
    const config = this.record(source['runnerConfig']);
    const evidenceMode = this.text(source['evidenceMode']);
    const authoritative = source['authoritative'] === true;
    if (
      !runToken
      || !draftHash
      || !expiresAt
      || !expectedCheckIds.length
      || !config
      || evidenceMode !== 'client-self-report'
      || authoritative
    ) {
      throw new Error('Interview check preparation response is incomplete.');
    }

    const kind = this.text(config['kind']);
    if (kind === 'javascript') {
      const checks = this.normalizeRunnerChecks(config['checks']);
      const tests = this.text(config['tests']);
      if (!checks.length || !tests) {
        throw new Error('Interview JavaScript runner response is incomplete.');
      }
      const runnerConfig: InterviewJavaScriptRunnerConfig = {
        kind: 'javascript',
        language: this.text(config['language']) === 'typescript'
          ? 'typescript'
          : 'javascript',
        tests,
        testsTs: this.optionalText(config['testsTs']) ?? undefined,
        checks,
      };
      return {
        runToken,
        draftHash,
        expiresAt,
        expectedCheckIds,
        runnerConfig,
        evidenceMode: 'client-self-report',
        authoritative: false,
      };
    }

    if (kind === 'framework-preview') {
      const framework = this.text(config['framework']);
      if (!['react', 'angular', 'vue'].includes(framework)) {
        throw new Error('Interview framework runner is unsupported.');
      }
      const groups = this.array(config['groups'])
        .map((rawGroup, groupIndex) => {
          const group = this.record(rawGroup);
          if (!group) return null;
          const checks = this.normalizeFrameworkChecks(group['checks']);
          if (!checks.length) return null;
          return {
            id: this.text(group['id']) || `group-${groupIndex + 1}`,
            title: this.text(group['title']) || `Requirement ${groupIndex + 1}`,
            checks,
          };
        })
        .filter((group): group is NonNullable<typeof group> => group !== null);
      if (!groups.length) {
        throw new Error('Interview framework runner response is incomplete.');
      }
      const runnerConfig: InterviewFrameworkRunnerConfig = {
        kind: 'framework-preview',
        framework: framework as InterviewFrameworkRunnerConfig['framework'],
        groups,
      };
      return {
        runToken,
        draftHash,
        expiresAt,
        expectedCheckIds,
        runnerConfig,
        evidenceMode: 'client-self-report',
        authoritative: false,
      };
    }

    throw new Error('Interview runner type is unsupported.');
  }

  private normalizeRunnerChecks(value: unknown): Array<{ id: string; name: string }> {
    return this.array(value)
      .map((entry) => {
        const source = this.record(entry);
        const id = this.text(source?.['id']);
        const name = this.text(source?.['name'] ?? source?.['label']);
        return id && name ? { id, name } : null;
      })
      .filter((check): check is { id: string; name: string } => check !== null);
  }

  private normalizeFrameworkChecks(value: unknown): InterviewFrameworkCheck[] {
    return this.array(value)
      .map((entry) => {
        const source = this.record(entry);
        const id = this.text(source?.['id']);
        const name = this.text(source?.['name'] ?? source?.['label']);
        const steps = this.array(source?.['steps'])
          .map((step) => this.record(step))
          .filter((step): step is JsonRecord => step !== null)
          .map((step) => ({ ...step }));
        return id && name && steps.length ? { id, name, steps } : null;
      })
      .filter((check): check is InterviewFrameworkCheck => check !== null);
  }

  private normalizeChecks(payload: unknown): InterviewCheckResult[] {
    const source = this.record(payload);
    const session = this.record(source?.['session']);
    const coding = this.record(session?.['coding']);
    const runs = this.array(coding?.['checkRuns']);
    const latestRun = this.record(runs[runs.length - 1]);
    return this.normalizeCheckArray(
      source?.['checkResults']
        ?? source?.['checks']
        ?? source?.['results']
        ?? latestRun?.['checks']
        ?? payload,
    );
  }

  private normalizeCheckArray(value: unknown): InterviewCheckResult[] {
    const results: InterviewCheckResult[] = [];
    this.array(value).forEach((entry, index) => {
        const source = this.record(entry);
        if (!source) return;
        const id = this.text(source['id']) || `check-${index + 1}`;
        const name = this.text(source['name'] ?? source['label']) || id;
        results.push({
          id,
          name,
          passed: source['passed'] === true,
          message: this.optionalText(source['message'] ?? source['error']) ?? undefined,
          failureKind: this.optionalText(source['failureKind'] ?? source['kind']) ?? undefined,
        });
      });
    return results;
  }

  private normalizeSectionResult(value: unknown): InterviewSectionResult | null {
    const source = this.record(value);
    if (!source) return null;
    const id = this.text(source['id'] ?? source['technology'] ?? source['competency']);
    const label = this.text(source['label'] ?? source['name'] ?? id);
    if (!id || !label) return null;
    return {
      id,
      label,
      correct: this.nonNegativeInteger(source['correct']) ?? 0,
      incorrect: this.nonNegativeInteger(source['incorrect'] ?? source['wrong']) ?? 0,
      unanswered: this.nonNegativeInteger(source['unanswered']) ?? 0,
      total: this.nonNegativeInteger(source['total']) ?? 0,
    };
  }

  private normalizeQuestionResult(value: unknown): InterviewMcqResult | null {
    const source = this.record(value);
    if (!source) return null;
    const questionId = this.text(source['questionId'] ?? source['id']);
    const prompt = this.text(source['prompt']);
    const options = this.array(source['options'])
      .map((option) => this.normalizeOption(option))
      .filter((option): option is InterviewMcqOption => option !== null);
    const correctOptionId = this.text(source['correctOptionId']);
    if (!questionId || !prompt || !correctOptionId || !options.length) return null;
    const selectedOptionId = this.optionalText(source['selectedOptionId']);
    return {
      questionId,
      technology: this.text(source['technology'] ?? source['tech']) || 'frontend',
      competency: this.text(source['competency'] ?? source['topic']) || 'Frontend',
      prompt,
      code: this.optionalText(source['code']),
      codeLanguage: this.optionalText(source['codeLanguage'] ?? source['language']),
      options,
      selectedOptionId: selectedOptionId && options.some((option) => option.id === selectedOptionId)
        ? selectedOptionId
        : null,
      correctOptionId,
      correct: source['correct'] === true
        || source['outcome'] === 'correct'
        || selectedOptionId === correctOptionId,
      explanation: this.text(source['explanation']),
      remediationTopics: this.stringList(
        source['remediationTopics'] ?? source['reviewTopics'],
      ),
    };
  }

  private normalizeCodingResult(value: unknown): InterviewCodingResult | null {
    const source = this.record(value);
    if (!source) return null;
    const checkRun = this.record(source['checkRun']);
    const checks = this.normalizeCheckArray(
      source['checks'] ?? source['checkResults'] ?? checkRun?.['checks'],
    );
    const outcome = this.text(source['outcome']);
    return {
      sourceQuestionId: this.optionalText(source['sourceQuestionId']),
      attempted: source['attempted'] === true
        || ['submitted', 'timed_out'].includes(outcome)
        || !!source['draftHash'],
      submitted: source['submitted'] === true || outcome === 'submitted',
      locallyVerified: source['locallyVerified'] === true,
      authoritativeEvaluation: false,
      evidenceMode: 'client-self-report',
      passedChecks: this.nonNegativeInteger(
        source['passedChecks'] ?? checkRun?.['passedCount'],
      )
        ?? checks.filter((check) => check.passed).length,
      totalChecks: this.nonNegativeInteger(
        source['totalChecks'] ?? checkRun?.['totalCount'],
      ) ?? checks.length,
      checks,
      rubric: this.array(source['rubric'])
        .map((value, index) => {
          const entry = this.record(value);
          if (!entry) return null;
          const label = this.text(entry['label'] ?? entry['name'] ?? entry['title']);
          if (!label) return null;
          const rawStatus = this.text(entry['status']);
          const status = ['passed', 'failed', 'not_evaluated'].includes(rawStatus)
            ? rawStatus as 'passed' | 'failed' | 'not_evaluated'
            : 'not_evaluated';
          return {
            id: this.text(entry['id']) || `rubric-${index + 1}`,
            label,
            criteria: this.stringList(entry['criteria']),
            status,
          };
        })
        .filter((entry): entry is NonNullable<typeof entry> => entry !== null),
    };
  }

  private normalizeTiming(value: unknown): { usedSeconds: number | null; allowedSeconds: number | null } {
    const source = this.record(value);
    return {
      usedSeconds: this.nonNegativeInteger(
        source?.['usedSeconds'] ?? source?.['elapsedSeconds'],
      ),
      allowedSeconds: this.nonNegativeInteger(
        source?.['allowedSeconds'] ?? source?.['limitSeconds'],
      ),
    };
  }

  private normalizeOptionalSession(payload: unknown): InterviewSession | null {
    const source = this.unwrapOptional(payload, 'session');
    if (!source || !this.text(source['id'] ?? source['sessionId'])) return null;
    return this.normalizeSession(source);
  }

  private normalizeResponseVersion(payload: unknown): number | null {
    const source = this.record(payload);
    const nestedSession = this.record(source?.['session']);
    const nestedDraft = this.record(source?.['draft']);
    return this.nonNegativeInteger(
      source?.['version']
        ?? source?.['sessionVersion']
        ?? nestedSession?.['version']
        ?? nestedDraft?.['sessionVersion'],
    );
  }

  private normalizeOptionalResult(payload: unknown): InterviewResult | null {
    const root = this.record(payload);
    const source = this.record(root?.['results'])
      ?? this.record(root?.['result'])
      ?? root;
    if (!source || !this.text(source['sessionId'] ?? source['id'])) return null;
    return this.normalizeResult(source);
  }

  private normalizeAnswerMap(value: unknown): Map<string, string> {
    const map = new Map<string, string>();
    const object = this.record(value);
    if (object) {
      Object.entries(object).forEach(([questionId, raw]) => {
        const optionId = this.text(this.record(raw)?.['optionId'] ?? raw);
        if (questionId && optionId) map.set(questionId, optionId);
      });
      return map;
    }
    this.array(value).forEach((raw) => {
      const source = this.record(raw);
      const questionId = this.text(source?.['questionId']);
      const optionId = this.text(source?.['optionId'] ?? source?.['selectedOptionId']);
      if (questionId && optionId) map.set(questionId, optionId);
    });
    return map;
  }

  private normalizeChoices<T extends string>(
    value: unknown,
    allowed: readonly T[],
    defaultLabels: Record<T, string>,
  ): InterviewChoice<T>[] {
    const rows = this.array(value);
    const normalized: InterviewChoice<T>[] = [];
    rows.forEach((row) => {
        const source = this.record(row);
        const rawValue = this.text(source?.['value'] ?? source?.['id'] ?? row).toLowerCase() as T;
        if (!allowed.includes(rawValue)) return;
        normalized.push({
          value: rawValue,
          label: this.text(source?.['label']) || defaultLabels[rawValue],
          description: this.optionalText(source?.['description']) ?? undefined,
          disabled: source?.['disabled'] === true,
        });
      });
    return normalized.length
      ? normalized
      : allowed.map((choice) => ({ value: choice, label: defaultLabels[choice] }));
  }

  private normalizeStatus(value: unknown): InterviewSessionStatus {
    const status = this.text(value).toLowerCase().replace(/-/g, '_');
    if (['mcq', 'mcq_active', 'trivia', 'trivia_active'].includes(status)) return 'mcq_active';
    if (['coding_ready', 'ready_for_coding', 'transition'].includes(status)) return 'coding_ready';
    if (['coding', 'coding_active'].includes(status)) return 'coding_active';
    if (['completed', 'complete', 'finalized'].includes(status)) return 'completed';
    if (['abandoned', 'expired', 'timed_out'].includes(status)) return 'abandoned';
    if (['voided_technical', 'voided', 'technical_failure'].includes(status)) return 'voided_technical';
    return 'mcq_active';
  }

  private normalizeLevel(value: unknown): InterviewLevel {
    return this.optionalLevel(value) ?? 'mid';
  }

  private optionalLevel(value: unknown): InterviewLevel | undefined {
    const level = this.text(value).toLowerCase();
    return ['junior', 'mid', 'senior'].includes(level)
      ? level as InterviewLevel
      : undefined;
  }

  private normalizeTrack(value: unknown): InterviewTrack {
    return this.optionalTrack(value) ?? 'core-web';
  }

  private optionalTrack(value: unknown): InterviewTrack | undefined {
    const track = this.text(value).toLowerCase();
    const normalized = track === 'javascript' ? 'core-web' : track;
    return ['core-web', 'react', 'angular', 'vue'].includes(normalized)
      ? normalized as InterviewTrack
      : undefined;
  }

  private languageFromPath(path: string): string {
    const normalized = path.toLowerCase();
    if (normalized.endsWith('.tsx') || normalized.endsWith('.ts')) return 'typescript';
    if (normalized.endsWith('.jsx') || normalized.endsWith('.js')) return 'javascript';
    if (normalized.endsWith('.html')) return 'html';
    if (normalized.endsWith('.css') || normalized.endsWith('.scss')) return 'css';
    if (normalized.endsWith('.json')) return 'json';
    return 'plaintext';
  }

  private unwrap(payload: unknown, key: string): JsonRecord {
    const source = this.record(payload);
    const nested = this.record(source?.[key]);
    return nested ?? source ?? {};
  }

  private unwrapOptional(payload: unknown, key: string): JsonRecord | null {
    const source = this.record(payload);
    if (!source) return null;
    return this.record(source[key]) ?? source;
  }

  private record(value: unknown): JsonRecord | null {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? value as JsonRecord
      : null;
  }

  private array(value: unknown): unknown[] {
    return Array.isArray(value) ? value : [];
  }

  private stringList(value: unknown): string[] {
    return this.array(value).map((entry) => this.text(entry)).filter(Boolean);
  }

  private text(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
  }

  private optionalText(value: unknown): string | null {
    const text = this.text(value);
    return text || null;
  }

  private isoText(value: unknown): string | null {
    const text = this.text(value);
    if (!text || !Number.isFinite(Date.parse(text))) return null;
    return text;
  }

  private finiteNumber(value: unknown): number | null {
    const parsed = typeof value === 'number'
      ? value
      : typeof value === 'string' && value.trim()
        ? Number(value)
        : Number.NaN;
    return Number.isFinite(parsed) ? parsed : null;
  }

  private nonNegativeInteger(value: unknown): number | null {
    const parsed = this.finiteNumber(value);
    return parsed !== null && parsed >= 0 ? Math.floor(parsed) : null;
  }

  private positiveInteger(value: unknown): number | null {
    const parsed = this.nonNegativeInteger(value);
    return parsed !== null && parsed > 0 ? parsed : null;
  }

  private clampIndex(index: number, length: number): number {
    if (length <= 0) return 0;
    return Math.min(Math.max(0, index), length - 1);
  }

  private encode(value: string): string {
    return encodeURIComponent(value);
  }
}
