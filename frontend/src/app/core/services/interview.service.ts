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
  InterviewFormat,
  InterviewFormatAvailability,
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
  InterviewSystemDesignCard,
  InterviewSystemDesignClarification,
  InterviewSystemDesignConnection,
  InterviewSystemDesignConnectionType,
  InterviewSystemDesignContradiction,
  InterviewSystemDesignDecision,
  InterviewSystemDesignDecisionAnswer,
  InterviewSystemDesignDraft,
  InterviewSystemDesignLane,
  InterviewSystemDesignMutationResult,
  InterviewSystemDesignPracticeSignal,
  InterviewSystemDesignRequirement,
  InterviewSystemDesignResult,
  InterviewSystemDesignScenario,
  InterviewSystemDesignState,
  InterviewSystemDesignStep,
  InterviewSystemDesignTwistAction,
  InterviewTargetAvailability,
  InterviewTrack,
  SaveInterviewAnswerRequest,
  SaveInterviewCodingDraftRequest,
  SaveInterviewSystemDesignDraftRequest,
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

  saveSystemDesignDraft(
    sessionId: string,
    request: SaveInterviewSystemDesignDraftRequest,
    expectedVersion: number,
  ): Observable<InterviewSystemDesignMutationResult> {
    return this.http
      .put<unknown>(
        `${this.base}/${this.encode(sessionId)}/system-design/draft`,
        {
          ...this.serializeSystemDesignDraft(request.draft),
          mutationId: request.mutationId,
          expectedVersion,
        },
        { withCredentials: true },
      )
      .pipe(map((payload) => this.normalizeSystemDesignMutation(payload)));
  }

  revealSystemDesignTwist(
    sessionId: string,
    draftHash: string,
    mutationId: string,
    expectedVersion: number,
  ): Observable<InterviewSystemDesignMutationResult> {
    return this.http
      .post<unknown>(
        `${this.base}/${this.encode(sessionId)}/system-design/twist/reveal`,
        { draftHash, mutationId, expectedVersion },
        { withCredentials: true },
      )
      .pipe(map((payload) => this.normalizeSystemDesignMutation(payload)));
  }

  submitSystemDesign(
    sessionId: string,
    draftHash: string,
    mutationId: string,
    expectedVersion: number,
  ): Observable<InterviewSystemDesignMutationResult> {
    return this.http
      .post<unknown>(
        `${this.base}/${this.encode(sessionId)}/system-design/submit`,
        { draftHash, mutationId, expectedVersion },
        { withCredentials: true },
      )
      .pipe(map((payload) => this.normalizeSystemDesignMutation(payload)));
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
    const quotasSource = this.record(source['quotas']);
    const activeSource = this.record(source['activeSession'] ?? source['active']);
    const rawResults = this.array(source['lastResults'] ?? source['recentResults']);
    const targets = [
      ...this.array(source['targets'] ?? source['availability']),
      ...this.array(source['systemDesignAvailability']),
    ]
      .map((value) => this.normalizeTargetAvailability(value))
      .filter((value): value is InterviewTargetAvailability => value !== null);
    const legacyQuota = quotaSource ? this.normalizeQuota(quotaSource) : null;
    const codingQuotaSource = this.record(quotasSource?.['coding']);
    const systemDesignQuotaSource = this.record(
      quotasSource?.['systemDesign'] ?? quotasSource?.['system-design'],
    );
    const formats = this.normalizeChoices<InterviewFormat>(
      source['formats'],
      ['coding', 'system-design'],
      { coding: 'Coding mock', 'system-design': 'System design mock' },
    );
    const formatAvailability = this.normalizeFormatAvailability(
      source['formatAvailability'] ?? source['formats'],
      advertisedEnabled && accessMode !== 'off',
    );
    const timing = this.record(source['timing']);
    const systemDesignTiming = this.record(
      timing?.['systemDesignSeconds'] ?? timing?.['system-design'],
    );
    return {
      enabled: advertisedEnabled && accessMode !== 'off',
      accessMode,
      unavailableReason: this.optionalText(source['unavailableReason'] ?? source['reason']),
      quota: legacyQuota,
      quotas: {
        coding: codingQuotaSource ? this.normalizeQuota(codingQuotaSource) : legacyQuota,
        'system-design': systemDesignQuotaSource
          ? this.normalizeQuota(systemDesignQuotaSource)
          : null,
      },
      activeSession: activeSource ? this.normalizeSessionLink(activeSource) : null,
      lastResults: rawResults
        .map((value) => this.normalizeResultLink(this.record(value)))
        .filter((value): value is InterviewResultLink => value !== null),
      targets,
      formats,
      formatAvailability,
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
        mcqSeconds: this.positiveInteger(timing?.['mcqSeconds']) ?? 600,
        codingReadySeconds:
          this.positiveInteger(timing?.['codingReadySeconds']) ?? 300,
        systemDesignSeconds: {
          junior: this.positiveInteger(
            systemDesignTiming?.['junior'] ?? timing?.['systemDesignJuniorSeconds'],
          ) ?? 600,
          mid: this.positiveInteger(
            systemDesignTiming?.['mid'] ?? timing?.['systemDesignMidSeconds'],
          ) ?? 900,
          senior: this.positiveInteger(
            systemDesignTiming?.['senior'] ?? timing?.['systemDesignSeniorSeconds'],
          ) ?? 1200,
        },
      },
    };
  }

  private normalizeFormatAvailability(
    value: unknown,
    mainEnabled: boolean,
  ): InterviewFormatAvailability[] {
    const byFormat = new Map<InterviewFormat, InterviewFormatAvailability>();
    this.array(value).forEach((entry) => {
      const source = this.record(entry);
      const format = this.normalizeOptionalFormat(
        source?.['format'] ?? source?.['value'] ?? source?.['id'] ?? entry,
      );
      if (!format) return;
      const explicitlyDisabled = source?.['enabled'] === false
        || source?.['available'] === false
        || source?.['disabled'] === true;
      byFormat.set(format, {
        format,
        enabled: mainEnabled && !explicitlyDisabled,
        unavailableReason: this.optionalText(
          source?.['unavailableReason'] ?? source?.['reason'],
        ),
      });
    });
    if (!byFormat.has('coding')) {
      byFormat.set('coding', {
        format: 'coding',
        enabled: mainEnabled,
        unavailableReason: null,
      });
    }
    if (!byFormat.has('system-design')) {
      byFormat.set('system-design', {
        format: 'system-design',
        enabled: false,
        unavailableReason: 'System design mock is not available yet.',
      });
    }
    return [...byFormat.values()];
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
      format: this.normalizeOptionalFormat(source['format']) ?? 'coding',
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
      format: this.normalizeFormat(
        source['format'] ?? source['interviewFormat'],
      ),
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
      systemDesign: this.normalizeSystemDesignState(
        source['systemDesign'] ?? source['system-design'],
        deadlines,
      ),
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
      interviewFormat: this.normalizeFormat(
        source['interviewFormat'] ?? source['format'],
      ),
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
      systemDesign: this.normalizeSystemDesignResult(
        source['systemDesign'] ?? source['system-design'],
      ),
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
      format: this.normalizeFormat(source['format'] ?? source['interviewFormat']),
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
      format: this.normalizeFormat(source['format'] ?? source['interviewFormat']),
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
      practiceSignal: this.normalizeOptionalPracticeSignal(
        source['practiceSignal']
          ?? this.record(source['systemDesign'])?.['practiceSignal']
          ?? this.record(source['systemDesign'])?.['overallSignal'],
      ),
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
    const snippet = this.normalizeQuestionCode(
      publicSource['code'],
      publicSource['codeLanguage'] ?? publicSource['language'],
    );
    return {
      id,
      revision: this.positiveInteger(publicSource['revision']) ?? 1,
      technology: this.text(publicSource['technology'] ?? publicSource['tech']) || 'frontend',
      competency: this.text(publicSource['competency'] ?? publicSource['topic']) || 'Frontend',
      prompt,
      code: snippet.code ?? undefined,
      codeLanguage: snippet.codeLanguage ?? undefined,
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

  private normalizeSystemDesignState(
    value: unknown,
    deadlines: JsonRecord | null,
  ): InterviewSystemDesignState | null {
    const source = this.record(value);
    if (!source) return null;
    const twistSource = this.record(source['twist']);
    const stage = this.text(source['stage']) === 'twist'
      || source['twistRevealed'] === true
      || twistSource?.['revealed'] === true
      ? 'twist'
      : 'initial';
    const scenario = this.normalizeSystemDesignScenario(
      source['scenario'] ?? source['publicScenario'],
    );
    const clarificationAnswers = new Map(
      this.array(source['clarificationAnswers'])
        .map((entry) => {
          const row = this.record(entry);
          return [
            this.text(row?.['clarificationId'] ?? row?.['id']),
            this.text(row?.['answer']),
          ] as const;
        })
        .filter(([id, answer]) => !!id && !!answer),
    );
    if (scenario && clarificationAnswers.size) {
      scenario.clarifications = scenario.clarifications.map((clarification) => ({
        ...clarification,
        answer: clarificationAnswers.get(clarification.id) ?? clarification.answer,
      }));
    }
    return {
      stage,
      deadlineAt: this.isoText(
        source['deadlineAt'] ?? deadlines?.['systemDesign'] ?? deadlines?.['system-design'],
      ),
      scenario,
      revealedClarificationIds: this.stringList(source['revealedClarificationIds']),
      draft: this.normalizeSystemDesignDraft(source['draft']),
      twist: {
        revealed: stage === 'twist',
        prompt: stage === 'twist'
          ? this.optionalText(twistSource?.['prompt'] ?? source['twistPrompt'])
          : null,
        actions: stage === 'twist'
          ? this.normalizeTwistActions(
            twistSource?.['responseActions']
              ?? twistSource?.['actions']
              ?? source['twistActions'],
          )
          : [],
        maxActions: this.positiveInteger(
          twistSource?.['maxActions'] ?? source['maxTwistActions'],
        ) ?? scenario?.selectionLimits.twistActions ?? 2,
      },
    };
  }

  private normalizeSystemDesignScenario(value: unknown): InterviewSystemDesignScenario | null {
    const source = this.record(value);
    if (!source) return null;
    const publicSource = this.record(source['public']) ?? source;
    const stepsRecord = this.record(publicSource['steps']);
    const stepRows = this.array(publicSource['steps']);
    const stepById = (id: string): JsonRecord | null => {
      const direct = this.record(stepsRecord?.[id]);
      if (direct) return direct;
      return this.record(stepRows.find((entry) => {
        const row = this.record(entry);
        return this.text(row?.['id']).toLowerCase().replace(/-/g, '_') === id;
      }));
    };
    const clarificationStep = stepById('clarifications');
    const priorityStep = stepById('requirements');
    const architectureStep = stepById('architecture');
    const decisionStep = stepById('decisions');
    const id = this.text(publicSource['id'] ?? publicSource['scenarioId']);
    const title = this.text(publicSource['title']);
    const prompt = this.text(publicSource['prompt'] ?? publicSource['brief']);
    if (!id || !title || !prompt) return null;

    const clarifications = this.array(
      publicSource['clarifications']
        ?? clarificationStep?.['items']
        ?? clarificationStep?.['clarifications'],
    )
      .map((entry) => {
        const row = this.record(entry);
        const clarificationId = this.text(row?.['id']);
        const clarificationPrompt = this.text(row?.['prompt'] ?? row?.['question']);
        return clarificationId && clarificationPrompt
          ? {
            id: clarificationId,
            prompt: clarificationPrompt,
            answer: this.optionalText(row?.['answer'] ?? row?.['interviewerAnswer']),
          } satisfies InterviewSystemDesignClarification
          : null;
      })
      .filter((entry): entry is InterviewSystemDesignClarification => entry !== null);
    const requirements = this.array(
      publicSource['requirements']
        ?? publicSource['priorities']
        ?? priorityStep?.['items']
        ?? priorityStep?.['requirements'],
    )
      .map((entry) => {
        const row = this.record(entry);
        const requirementId = this.text(row?.['id']);
        const label = this.text(row?.['label'] ?? row?.['title']);
        const description = this.optionalText(row?.['description']);
        return requirementId && label
          ? {
            id: requirementId,
            label,
            ...(description ? { description } : {}),
          } satisfies InterviewSystemDesignRequirement
          : null;
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
    const lanes = this.array(
      publicSource['lanes'] ?? architectureStep?.['lanes'],
    )
      .map((entry) => {
        const row = this.record(entry);
        const laneId = this.text(row?.['id']);
        const label = this.text(row?.['label'] ?? row?.['title']);
        const description = this.optionalText(row?.['description']);
        return laneId && label
          ? {
            id: laneId,
            label,
            ...(description ? { description } : {}),
          } satisfies InterviewSystemDesignLane
          : null;
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
    const cards = this.array(
      publicSource['cards']
        ?? publicSource['components']
        ?? architectureStep?.['cards'],
    )
      .map((entry) => {
        const row = this.record(entry);
        const cardId = this.text(row?.['id']);
        const label = this.text(row?.['label'] ?? row?.['title']);
        if (!cardId || !label) return null;
        const description = this.optionalText(row?.['description']);
        return {
          id: cardId,
          label,
          ...(description ? { description } : {}),
        } satisfies InterviewSystemDesignCard;
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
    const decisions = this.array(
      publicSource['decisions']
        ?? decisionStep?.['items']
        ?? decisionStep?.['decisions'],
    )
      .map((entry) => this.normalizeSystemDesignDecision(entry))
      .filter((entry): entry is InterviewSystemDesignDecision => entry !== null);
    const limits = this.record(publicSource['selectionLimits']);

    return {
      id,
      revision: this.positiveInteger(publicSource['revision']) ?? 1,
      title,
      prompt,
      sourceContentId: this.optionalText(publicSource['sourceContentId']),
      estimatedSeconds: this.positiveInteger(
        publicSource['estimatedSeconds'] ?? publicSource['timeLimitSeconds'],
      ) ?? 900,
      selectionLimits: {
        clarifications: this.positiveInteger(limits?.['clarifications']) ?? 3,
        priorities: this.positiveInteger(limits?.['priorities']) ?? 3,
        connections: this.positiveInteger(limits?.['connections']) ?? 8,
        rationalesPerDecision:
          this.positiveInteger(limits?.['rationalesPerDecision']) ?? 2,
        twistActions: this.positiveInteger(limits?.['twistActions']) ?? 2,
        scratchpadChars: this.positiveInteger(limits?.['scratchpadChars']) ?? 200,
      },
      clarifications,
      requirements,
      lanes,
      cards,
      decisions,
      connectionTypes: this.normalizeConnectionTypes(
        publicSource['connectionTypes'] ?? architectureStep?.['connectionTypes'],
      ),
    };
  }

  private normalizeSystemDesignDecision(value: unknown): InterviewSystemDesignDecision | null {
    const source = this.record(value);
    if (!source) return null;
    const id = this.text(source['id']);
    const prompt = this.text(source['prompt'] ?? source['question']);
    const options = this.array(source['options'])
      .map((entry) => {
        const row = this.record(entry);
        const optionId = this.text(row?.['id']);
        const label = this.text(row?.['label'] ?? row?.['text']);
        return optionId && label
          ? {
            id: optionId,
            label,
            description: this.optionalText(row?.['description']) ?? undefined,
          }
          : null;
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
    const rationales = this.array(source['rationales'] ?? source['rationaleOptions'])
      .map((entry) => {
        const row = this.record(entry);
        const rationaleId = this.text(row?.['id']);
        const label = this.text(row?.['label'] ?? row?.['text']);
        return rationaleId && label ? { id: rationaleId, label } : null;
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
    return id && prompt && options.length
      ? { id, prompt, options, rationales }
      : null;
  }

  private normalizeConnectionTypes(
    value: unknown,
  ): InterviewChoice<InterviewSystemDesignConnectionType>[] {
    const normalized = this.array(value)
      .map((entry) => {
        const source = this.record(entry);
        const id = this.text(source?.['id'] ?? source?.['value'] ?? entry);
        const label = this.text(source?.['label'] ?? source?.['title']);
        return id
          ? {
            value: id,
            label: label || id,
            description: this.optionalText(source?.['description']) ?? undefined,
          }
          : null;
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
    return normalized.length
      ? normalized
      : [
        { value: 'data', label: 'Data' },
        { value: 'event', label: 'Event' },
        { value: 'request', label: 'Request' },
        { value: 'response', label: 'Response' },
      ];
  }

  private normalizeTwistActions(value: unknown): InterviewSystemDesignTwistAction[] {
    return this.array(value)
      .map((entry) => {
        const source = this.record(entry);
        const id = this.text(source?.['id']);
        const label = this.text(source?.['label'] ?? source?.['title']);
        const description = this.optionalText(source?.['description']);
        return id && label
          ? {
            id,
            label,
            ...(description ? { description } : {}),
          }
          : null;
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
  }

  private normalizeSystemDesignDraft(value: unknown): InterviewSystemDesignDraft | null {
    const source = this.record(value);
    if (!source) return null;
    const rawStep = this.text(source['currentStep'] ?? source['step'])
      .toLowerCase()
      .replace(/-/g, '_');
    const currentStep = (
      ['clarifications', 'requirements', 'architecture', 'decisions', 'twist'].includes(rawStep)
        ? rawStep
        : 'clarifications'
    ) as InterviewSystemDesignStep;
    const placements = this.array(source['placements'])
      .map((entry, index) => {
        const row = this.record(entry);
        const cardId = this.text(row?.['cardId']);
        const laneId = this.text(row?.['laneId']);
        return cardId && laneId
          ? {
            cardId,
            laneId,
            order: this.nonNegativeInteger(row?.['order']) ?? index,
          }
          : null;
      })
      .filter((entry): entry is InterviewSystemDesignDraft['placements'][number] => entry !== null);
    const connections = this.array(source['connections'])
      .map((entry, index) => {
        const row = this.record(entry);
        const fromCardId = this.text(row?.['fromCardId'] ?? row?.['from']);
        const toCardId = this.text(row?.['toCardId'] ?? row?.['to']);
        const type = this.normalizeConnectionType(row?.['type'] ?? row?.['typeId']);
        return fromCardId && toCardId && type
          ? {
            id: this.text(row?.['id']) || `connection-${index + 1}`,
            fromCardId,
            toCardId,
            type,
          } satisfies InterviewSystemDesignConnection
          : null;
      })
      .filter((entry): entry is InterviewSystemDesignConnection => entry !== null);
    const decisions = this.array(source['decisions'] ?? source['decisionAnswers'])
      .map((entry) => {
        const row = this.record(entry);
        const decisionId = this.text(row?.['decisionId'] ?? row?.['id']);
        const optionId = this.text(row?.['optionId']);
        return decisionId && optionId
          ? {
            decisionId,
            optionId,
            rationaleIds: this.stringList(row?.['rationaleIds']),
          } satisfies InterviewSystemDesignDecisionAnswer
          : null;
      })
      .filter((entry): entry is InterviewSystemDesignDecisionAnswer => entry !== null);
    return {
      currentStep,
      selectedClarificationIds: this.stringList(
        source['selectedClarificationIds'] ?? source['clarificationIds'],
      ),
      prioritizedRequirementIds: this.stringList(
        source['prioritizedRequirementIds']
          ?? source['priorityRequirementIds']
          ?? source['priorityIds'],
      ),
      placements,
      connections,
      decisions,
      selectedTwistActionIds: this.stringList(
        source['selectedTwistActionIds']
          ?? source['twistResponseActionIds']
          ?? source['twistActionIds'],
      ),
      scratchpad: this.text(source['scratchpad']).slice(0, 200),
      hash: this.optionalText(source['hash'] ?? source['draftHash']),
      revision: this.nonNegativeInteger(source['revision']),
      updatedAt: this.isoText(source['updatedAt']),
    };
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
    const snippet = this.normalizeQuestionCode(
      source['code'],
      source['codeLanguage'] ?? source['language'],
    );
    return {
      questionId,
      technology: this.text(source['technology'] ?? source['tech']) || 'frontend',
      competency: this.text(source['competency'] ?? source['topic']) || 'Frontend',
      prompt,
      code: snippet.code,
      codeLanguage: snippet.codeLanguage,
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

  private normalizeSystemDesignMutation(payload: unknown): InterviewSystemDesignMutationResult {
    const root = this.record(payload);
    const session = this.normalizeOptionalSession(payload);
    const systemDesign = this.record(this.record(root?.['session'])?.['systemDesign']);
    return {
      version: this.normalizeResponseVersion(payload),
      draft: this.normalizeSystemDesignDraft(
        root?.['draft'] ?? systemDesign?.['draft'],
      ),
      session,
      replayed: root?.['replayed'] === true,
    };
  }

  private serializeSystemDesignDraft(
    draft: SaveInterviewSystemDesignDraftRequest['draft'],
  ): JsonRecord {
    return {
      currentStep: draft.currentStep,
      clarificationIds: [...draft.selectedClarificationIds],
      priorityRequirementIds: [...draft.prioritizedRequirementIds],
      placements: draft.placements.map(({ cardId, laneId, order }) => ({
        cardId,
        laneId,
        order,
      })),
      connections: draft.connections.map(({ fromCardId, toCardId, type }) => ({
        fromCardId,
        toCardId,
        typeId: type,
      })),
      decisions: draft.decisions.map(({ decisionId, optionId, rationaleIds }) => ({
        decisionId,
        optionId,
        rationaleIds: [...rationaleIds],
      })),
      twistResponseActionIds: [...draft.selectedTwistActionIds],
      scratchpad: draft.scratchpad,
    };
  }

  private normalizeSystemDesignResult(value: unknown): InterviewSystemDesignResult | null {
    const source = this.record(value);
    if (!source) return null;
    const scenario = this.record(source['scenario']);
    const scenarioId = this.text(
      source['scenarioId'] ?? scenario?.['id'],
    );
    if (!scenarioId) return null;
    const signal = this.normalizeOptionalPracticeSignal(
      source['practiceSignal'] ?? source['overallSignal'] ?? source['signal'],
    ) ?? 'not-enough-evidence';
    const axes = this.array(source['axes'] ?? source['rubric'])
      .map((entry, index) => {
        const row = this.record(entry);
        const label = this.text(row?.['label'] ?? row?.['title']);
        if (!label) return null;
        const rawStatus = this.text(row?.['status']).toLowerCase().replace(/_/g, '-');
        const status = [
          'strong-evidence',
          'developing',
          'needs-focus',
          'not-evaluated',
        ].includes(rawStatus)
          ? rawStatus as InterviewSystemDesignResult['axes'][number]['status']
          : 'not-evaluated';
        return {
          id: this.text(row?.['id']) || `axis-${index + 1}`,
          label,
          status,
          evidence: this.array(
            row?.['evidence'] ?? row?.['evidenceItems'] ?? row?.['observations'],
          ).map((item) => {
            const evidence = this.record(item);
            return this.text(
              evidence?.['label']
                ?? evidence?.['summary']
                ?? evidence?.['message']
                ?? item,
            );
          }).filter(Boolean),
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
    const contradictions = this.array(source['contradictions'])
      .map((entry, index) => {
        const row = this.record(entry);
        const label = this.text(
          row?.['label'] ?? row?.['title'] ?? row?.['summary'],
        );
        if (!label) return null;
        return {
          id: this.text(row?.['id']) || `contradiction-${index + 1}`,
          severity: this.text(row?.['severity']) === 'critical' ? 'critical' : 'major',
          label,
          explanation: this.text(
            row?.['explanation'] ?? row?.['message'] ?? row?.['summary'],
          ),
        } satisfies InterviewSystemDesignContradiction;
      })
      .filter((entry): entry is InterviewSystemDesignContradiction => entry !== null);
    const frameworkLensSource = this.record(source['frameworkLens']);
    const lensTitle = this.text(frameworkLensSource?.['title']);
    const lensPrompt = this.text(frameworkLensSource?.['prompt']);
    return {
      sourceContentId: this.optionalText(
        source['sourceContentId'] ?? scenario?.['sourceContentId'],
      ),
      scenarioId,
      scenarioTitle: this.text(
        source['scenarioTitle'] ?? source['title'] ?? scenario?.['title'],
      ) || 'System design scenario',
      outcome: this.text(source['outcome']) || 'pending',
      partialEvidence: source['partialEvidence'] === true,
      practiceSignal: signal,
      axes,
      contradictions,
      remediationTopics: this.array(
        source['remediationTopics'] ?? source['remediation'] ?? source['reviewNext'],
      ).map((item) => {
        const remediation = this.record(item);
        return this.text(
          remediation?.['topic']
            ?? remediation?.['label']
            ?? remediation?.['title']
            ?? item,
        );
      }).filter(Boolean),
      designSnapshot: this.normalizeSystemDesignDraft(
        source['designSnapshot'] ?? source['design'] ?? source['draft'],
      ),
      summary: this.normalizeSystemDesignSummary(source['summary']),
      frameworkLens: lensTitle && lensPrompt
        ? { title: lensTitle, prompt: lensPrompt }
        : null,
      timing: this.normalizeTiming(source['timing']),
    };
  }

  private normalizeSystemDesignSummary(
    value: unknown,
  ): InterviewSystemDesignResult['summary'] {
    const source = this.record(value);
    return {
      priorities: this.array(source?.['priorities'])
        .map((entry, index) => {
          const row = this.record(entry);
          const id = this.text(row?.['id']);
          const title = this.text(row?.['title'] ?? row?.['label']);
          return id && title
            ? { id, title, rank: this.positiveInteger(row?.['rank']) ?? index + 1 }
            : null;
        })
        .filter((entry): entry is NonNullable<typeof entry> => entry !== null),
      lanes: this.array(source?.['lanes'])
        .map((entry) => {
          const row = this.record(entry);
          const id = this.text(row?.['id']);
          const title = this.text(row?.['title'] ?? row?.['label']);
          if (!id || !title) return null;
          return {
            id,
            title,
            cards: this.array(row?.['cards'])
              .map((card, index) => {
                const cardRow = this.record(card);
                const cardId = this.text(cardRow?.['id']);
                const cardTitle = this.text(cardRow?.['title'] ?? cardRow?.['label']);
                return cardId && cardTitle
                  ? {
                    id: cardId,
                    title: cardTitle,
                    order: this.nonNegativeInteger(cardRow?.['order']) ?? index,
                  }
                  : null;
              })
              .filter((card): card is NonNullable<typeof card> => card !== null),
          };
        })
        .filter((entry): entry is NonNullable<typeof entry> => entry !== null),
      connections: this.array(source?.['connections'])
        .map((entry) => {
          const row = this.record(entry);
          const fromCardId = this.text(row?.['fromCardId']);
          const fromTitle = this.text(row?.['fromTitle']);
          const toCardId = this.text(row?.['toCardId']);
          const toTitle = this.text(row?.['toTitle']);
          const typeId = this.text(row?.['typeId']);
          const typeTitle = this.text(row?.['typeTitle']);
          return fromCardId && fromTitle && toCardId && toTitle && typeId && typeTitle
            ? { fromCardId, fromTitle, toCardId, toTitle, typeId, typeTitle }
            : null;
        })
        .filter((entry): entry is NonNullable<typeof entry> => entry !== null),
      decisions: this.array(source?.['decisions'])
        .map((entry) => {
          const row = this.record(entry);
          const option = this.record(row?.['option']);
          const id = this.text(row?.['id']);
          const title = this.text(row?.['title']);
          const optionId = this.text(option?.['id']);
          const optionLabel = this.text(option?.['label']);
          if (!id || !title || !optionId || !optionLabel) return null;
          return {
            id,
            title,
            option: { id: optionId, label: optionLabel },
            rationales: this.array(row?.['rationales'])
              .map((rationale) => {
                const rationaleRow = this.record(rationale);
                const rationaleId = this.text(rationaleRow?.['id']);
                const label = this.text(rationaleRow?.['label']);
                return rationaleId && label ? { id: rationaleId, label } : null;
              })
              .filter((rationale): rationale is NonNullable<typeof rationale> => rationale !== null),
          };
        })
        .filter((entry): entry is NonNullable<typeof entry> => entry !== null),
      twistActions: this.array(source?.['twistActions'])
        .map((entry) => {
          const row = this.record(entry);
          const id = this.text(row?.['id']);
          const label = this.text(row?.['label']);
          return id && label ? { id, label } : null;
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
    if (['system_design', 'system_design_active', 'design_active'].includes(status)) {
      return 'system_design_active';
    }
    if (['completed', 'complete', 'finalized'].includes(status)) return 'completed';
    if (['abandoned', 'expired', 'timed_out'].includes(status)) return 'abandoned';
    if (['voided_technical', 'voided', 'technical_failure'].includes(status)) return 'voided_technical';
    return 'mcq_active';
  }

  private normalizeFormat(value: unknown): InterviewFormat {
    return this.normalizeOptionalFormat(value) ?? 'coding';
  }

  private normalizeOptionalFormat(value: unknown): InterviewFormat | null {
    const format = this.text(value).toLowerCase().replace(/_/g, '-');
    if (['system-design', 'systemdesign', 'design'].includes(format)) return 'system-design';
    if (['coding', 'code', 'standard'].includes(format)) return 'coding';
    return null;
  }

  private normalizeConnectionType(value: unknown): InterviewSystemDesignConnectionType | null {
    const type = this.text(value).toLowerCase();
    return type || null;
  }

  private normalizeOptionalPracticeSignal(
    value: unknown,
  ): InterviewSystemDesignPracticeSignal | undefined {
    const signal = this.text(value).toLowerCase().replace(/_/g, '-');
    if (['strong-system-design-session', 'strong-session', 'strong'].includes(signal)) {
      return 'strong-system-design-session';
    }
    if (signal === 'on-track') return 'on-track';
    if (signal === 'needs-focus') return 'needs-focus';
    if (['not-enough-evidence', 'insufficient-evidence'].includes(signal)) {
      return 'not-enough-evidence';
    }
    return undefined;
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

  private normalizeQuestionCode(
    value: unknown,
    fallbackLanguage: unknown,
  ): { code: string | null; codeLanguage: string | null } {
    const structured = this.record(value);
    const code = this.optionalText(structured?.['source'] ?? value);
    if (!code) return { code: null, codeLanguage: null };
    return {
      code,
      codeLanguage: this.optionalText(
        structured?.['language'] ?? fallbackLanguage,
      ),
    };
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
