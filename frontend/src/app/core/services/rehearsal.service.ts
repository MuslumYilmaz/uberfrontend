import { HttpClient } from '@angular/common/http';
import { Injectable, NgZone, OnDestroy, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay, switchMap } from 'rxjs/operators';
import {
  RehearsalDefinition,
  RehearsalEndReason,
  RehearsalItem,
  RehearsalItemResult,
  RehearsalOrder,
  RehearsalPhase,
  RehearsalQuestion,
  RehearsalQuiz,
  RehearsalSession,
  rehearsalAnswerRight,
} from '../models/rehearsal.model';
import { AnalyticsService } from './analytics.service';
import { PracticeAssetResolverService } from './practice-asset-resolver.service';

/** Every rehearsal, in one list: the tasks stay untouched, and some of them are pinned by the interview content. */
export const REHEARSAL_LIST_ASSET = 'assets/questions/rehearsals/rehearsals.v1.json';
const STORAGE_KEY = 'fa:rehearsal:v1';
const ORDERS: readonly RehearsalOrder[] = ['sequential', 'free'];
const END_REASONS: readonly RehearsalEndReason[] = ['expired', 'ended'];
// The editor panel that records runs and turns read-only serves plain JavaScript tasks.
const ITEM_PATH = /^\/javascript\/(coding|debug)\/([a-z0-9-]+)$/;
// A question links the concept page that answers it in full.
const CONCEPT_PATH = /^\/[a-z]+\/trivia\/[a-z0-9-]+$/;
const MAX_ANSWER = 400;
const PICKS: readonly NonNullable<RehearsalQuestion['pick']>[] = ['one', 'all'];

/**
 * Reads the rehearsal list and keeps the one running rehearsal on the device. The clock is the start time plus
 * the rehearsal's minutes, so it survives reloads and moving between the task pages.
 */
@Injectable({ providedIn: 'root' })
export class RehearsalService implements OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly assets = inject(PracticeAssetResolverService);
  private readonly analytics = inject(AnalyticsService, { optional: true });
  private readonly zone = inject(NgZone);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private list$: Observable<RehearsalDefinition[]> | null = null;
  private ticker: ReturnType<typeof setInterval> | null = null;

  readonly session = signal<RehearsalSession | null>(null);
  readonly now = signal(Date.now());
  readonly remainingMs = computed(() => {
    const session = this.session();
    if (!session || session.endedAt !== null) return 0;
    return Math.max(0, this.deadline(session) - this.now());
  });
  readonly phase = computed<RehearsalPhase | null>(() => {
    const session = this.session();
    if (!session) return null;
    return session.endedAt !== null || this.remainingMs() === 0 ? 'review' : 'active';
  });
  /** The questions are on screen; the problems open after them. */
  readonly answering = computed(() => {
    const session = this.session();
    return !!session && this.phase() === 'active' && session.answering < this.questionCount(session.definition);
  });

  // Another tab started, ended or closed a rehearsal.
  private readonly onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) this.adopt(this.read());
  };

  constructor() {
    if (!this.isBrowser) return;
    this.adopt(this.read());
    window.addEventListener('storage', this.onStorage);
  }

  ngOnDestroy(): void {
    if (this.ticker) clearInterval(this.ticker);
    this.ticker = null;
    if (this.isBrowser) window.removeEventListener('storage', this.onStorage);
  }

  /** Every rehearsal, read once; an entry the panel could not run is left out. */
  loadAll(): Observable<RehearsalDefinition[]> {
    if (this.list$) return this.list$;
    this.list$ = this.assets.getVersion().pipe(
      switchMap((version) => {
        const { primary, fallback } = this.assets.getAssetUrls(REHEARSAL_LIST_ASSET, version);
        return primary !== fallback
          ? this.http.get<unknown>(primary).pipe(catchError(() => this.http.get<unknown>(fallback)))
          : this.http.get<unknown>(fallback);
      }),
      map((payload) => this.normalizeList(payload)),
      catchError(() => of([])),
      shareReplay(1),
    );
    return this.list$;
  }

  /** The rehearsals that include a task page, such as /javascript/coding/js-debounce. */
  forTask(path: string): Observable<RehearsalDefinition[]> {
    return this.loadAll().pipe(
      map((list) => list.filter((definition) => definition.items.some((item) => item.path === path))),
    );
  }

  normalizeList(payload: unknown): RehearsalDefinition[] {
    const source = this.asObject(payload);
    if (!source || source['schemaVersion'] !== 1 || !Array.isArray(source['rehearsals'])) return [];
    const ids = new Set<string>();
    const list: RehearsalDefinition[] = [];
    for (const entry of source['rehearsals'] as unknown[]) {
      const definition = this.normalize(entry);
      if (!definition || ids.has(definition.id)) continue;
      ids.add(definition.id);
      list.push(definition);
    }
    return list;
  }

  normalize(value: unknown): RehearsalDefinition | null {
    const source = this.asObject(value);
    if (!source) return null;
    const id = this.text(source['id']);
    const company = this.text(source['company']);
    const title = this.text(source['title']);
    const round = this.text(source['round']);
    const summary = this.text(source['summary']);
    const minutes = Number(source['minutes']);
    const order = ORDERS.find((entry) => entry === source['order']) ?? null;
    const rawItems = Array.isArray(source['items']) ? (source['items'] as unknown[]) : [];
    const items = rawItems.map((item) => this.item(item)).filter((item): item is RehearsalItem => item !== null);
    const quiz = source['quiz'] === undefined ? undefined : this.quiz(source['quiz'], minutes);

    if (!id || !company || !title || !round || !summary || !order) return null;
    if (!Number.isInteger(minutes) || minutes < 5 || minutes > 240) return null;
    // A rehearsal with a task the panel cannot open, or the same task twice, would leave the clock without its list.
    if (items.length < 2 || items.length !== rawItems.length) return null;
    if (new Set(items.map((item) => item.questionId)).size !== items.length) return null;
    if (quiz === null) return null;
    return { id, company, title, round, summary, minutes, order, ...(quiz ? { quiz } : {}), items };
  }

  includes(questionId: string | null | undefined): boolean {
    const session = this.session();
    return !!questionId && !!session?.definition.items.some((item) => item.questionId === questionId);
  }

  /** The draft key for a task during the rehearsal; null outside it. */
  draftKey(questionId: string | null | undefined): string | null {
    const session = this.session();
    return session && questionId && this.includes(questionId) ? `rehearsal:${session.key}:${questionId}` : null;
  }

  start(definition: RehearsalDefinition, fromQuestionId?: string): void {
    const startedAt = Date.now();
    this.now.set(startedAt);
    this.write({
      version: 1,
      key: `${definition.id}:${startedAt}`,
      definition,
      startedAt,
      endedAt: null,
      endReason: null,
      reached: 0,
      results: {},
      answers: Array.from({ length: this.questionCount(definition) }, () => ''),
      answering: 0,
    });
    this.analytics?.track('rehearsal_started', {
      rehearsal_id: definition.id,
      question_id: fromQuestionId || 'unknown',
      minutes: definition.minutes,
    });
  }

  /** Ends the rehearsal early; the review opens as it does when the time is up. */
  end(): void {
    const session = this.session();
    if (!session || this.phase() !== 'active') return;
    this.finish(session, Date.now(), 'ended');
  }

  /** Closes the review and gives the tasks back their own drafts. */
  close(): void {
    this.write(null);
  }

  /** Marks a task as opened; a sequential rehearsal shows tasks up to the furthest one opened. */
  reach(questionId: string): void {
    const session = this.session();
    if (!session || this.phase() !== 'active') return;
    const index = session.definition.items.findIndex((item) => item.questionId === questionId);
    if (index > session.reached) this.write({ ...session, reached: index });
  }

  /** Keeps the answer to the question on screen: its text, or the indexes of the picked options. */
  answer(text: string): void {
    this.refresh();
    const session = this.session();
    if (!session || !this.answering()) return;
    const answers = [...session.answers];
    answers[session.answering] = text.slice(0, MAX_ANSWER);
    this.write({ ...session, answers });
  }

  /** Moves on to the next question; past the last one, the problems open. */
  nextQuestion(): void {
    const session = this.session();
    if (session && this.answering()) this.write({ ...session, answering: session.answering + 1 });
  }

  /** Opens the problems now, leaving the questions not reached unanswered. */
  skipToProblems(): void {
    const session = this.session();
    if (session && this.answering()) this.write({ ...session, answering: this.questionCount(session.definition) });
  }

  /** Keeps the best test run of a task while the clock runs. */
  record(questionId: string, passed: number, total: number): void {
    this.refresh();
    const session = this.session();
    if (!session || this.phase() !== 'active' || this.answering() || !this.includes(questionId) || total <= 0) return;
    const previous = session.results[questionId];
    // On a tie the run with more tests wins, so a runner error (0 of 1) does not hide the real suite.
    const keep = !!previous && (previous.passed / previous.total > passed / total
      || (previous.passed / previous.total === passed / total && previous.total >= total));
    const best = keep && previous ? previous : { passed, total };
    const next: RehearsalItemResult = { passed: best.passed, total: best.total, runs: (previous?.runs ?? 0) + 1 };
    this.write({ ...session, results: { ...session.results, [questionId]: next } });
  }

  /** Moves the clock to the present and ends a rehearsal whose time is up. */
  refresh(): void {
    this.now.set(Date.now());
    const session = this.session();
    if (session && session.endedAt === null && this.now() >= this.deadline(session)) {
      this.finish(session, this.deadline(session), 'expired');
    }
  }

  private finish(session: RehearsalSession, endedAt: number, endReason: RehearsalEndReason): void {
    this.write({ ...session, endedAt, endReason });
    const passedItems = session.definition.items
      .filter((item) => {
        const result = session.results[item.questionId];
        return !!result && result.passed === result.total;
      }).length;
    this.analytics?.track('rehearsal_ended', {
      rehearsal_id: session.definition.id,
      reason: endReason,
      passed_items: passedItems,
      items: session.definition.items.length,
      ...this.quizCounts(session),
      elapsed_sec: Math.round((endedAt - session.startedAt) / 1000),
    });
  }

  /** How many questions of each kind the rehearsal asked, how many have an answer and how many picks are right. */
  private quizCounts(session: RehearsalSession) {
    const asked = (session.definition.quiz?.questions ?? []).map((question, index) => ({ question, answer: session.answers[index] ?? '' }));
    const short = asked.filter(({ question }) => !question.choices);
    const choice = asked.filter(({ question }) => !!question.choices);
    return {
      short_answers: short.length,
      short_answers_given: short.filter(({ answer }) => answer.trim()).length,
      choice_questions: choice.length,
      choice_right: choice.filter(({ question, answer }) => rehearsalAnswerRight(question, answer)).length,
    };
  }

  private deadline(session: RehearsalSession): number {
    return session.startedAt + session.definition.minutes * 60_000;
  }

  private questionCount(definition: RehearsalDefinition): number {
    return definition.quiz?.questions.length ?? 0;
  }

  private write(session: RehearsalSession | null): void {
    this.session.set(session);
    this.syncTicker();
    if (!this.isBrowser) return;
    try {
      if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Storage can be full or blocked; the rehearsal still runs in this tab.
    }
  }

  private adopt(session: RehearsalSession | null): void {
    this.session.set(session);
    this.syncTicker();
    this.refresh();
  }

  private syncTicker(): void {
    const running = this.isBrowser && this.session()?.endedAt === null;
    if (running && !this.ticker) {
      // Outside the zone, so a rehearsal of an hour does not keep the app from ever becoming stable; the signals
      // still schedule change detection.
      this.ticker = this.zone.runOutsideAngular(() => setInterval(() => this.refresh(), 1000));
    } else if (!running && this.ticker) {
      clearInterval(this.ticker);
      this.ticker = null;
    }
  }

  private read(): RehearsalSession | null {
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
    if (!raw) return null;
    try {
      return this.restore(JSON.parse(raw));
    } catch {
      return null;
    }
  }

  private restore(value: unknown): RehearsalSession | null {
    const source = this.asObject(value);
    if (!source || source['version'] !== 1) return null;
    const stored = this.asObject(source['definition']);
    const definition = stored ? this.normalize(stored) : null;
    const key = this.text(source['key']);
    const startedAt = Number(source['startedAt']);
    const endedAt = source['endedAt'] === null ? null : Number(source['endedAt']);
    const endReason = END_REASONS.find((entry) => entry === source['endReason']) ?? null;
    const reached = Number(source['reached']);
    if (!definition || !key || !Number.isFinite(startedAt)) return null;
    if (endedAt !== null && (!Number.isFinite(endedAt) || !endReason)) return null;
    if (!Number.isInteger(reached) || reached < 0 || reached >= definition.items.length) return null;
    const count = this.questionCount(definition);
    // A session kept before questions existed has none to answer.
    const answering = source['answering'] === undefined ? count : Number(source['answering']);
    if (!Number.isInteger(answering) || answering < 0 || answering > count) return null;
    const storedAnswers = Array.isArray(source['answers']) ? (source['answers'] as unknown[]) : [];
    const answers = Array.from({ length: count }, (_, index) => {
      const answer = storedAnswers[index];
      return typeof answer === 'string' ? answer.slice(0, MAX_ANSWER) : '';
    });

    const results: Record<string, RehearsalItemResult> = {};
    const storedResults = this.asObject(source['results']) ?? {};
    for (const item of definition.items) {
      const result = this.asObject(storedResults[item.questionId]);
      const passed = Number(result?.['passed']);
      const total = Number(result?.['total']);
      const runs = Number(result?.['runs']);
      if (Number.isInteger(passed) && Number.isInteger(total) && Number.isInteger(runs) && total > 0 && passed >= 0 && passed <= total) {
        results[item.questionId] = { passed, total, runs };
      }
    }
    return {
      version: 1,
      key,
      definition,
      startedAt,
      endedAt,
      endReason: endedAt === null ? null : endReason,
      reached,
      results,
      answers,
      answering,
    };
  }

  private item(value: unknown): RehearsalItem | null {
    const source = this.asObject(value);
    const path = this.text(source?.['path']);
    const title = this.text(source?.['title']);
    const match = ITEM_PATH.exec(path);
    if (!match || !title) return null;
    return { path, questionId: match[2], title };
  }

  private quiz(value: unknown, minutes: number): RehearsalQuiz | null {
    const source = this.asObject(value);
    const raw = Array.isArray(source?.['questions']) ? (source['questions'] as unknown[]) : [];
    const questions = raw.map((entry) => this.quizQuestion(entry)).filter((entry): entry is RehearsalQuestion => entry !== null);
    // The questions take part of the clock, never all of it, and each one links its full answer.
    if (!source || questions.length < 2 || questions.length !== raw.length) return null;
    if (source['minutes'] === undefined) return { questions };
    const budget = Number(source['minutes']);
    if (!Number.isInteger(budget) || budget < 1 || budget >= minutes) return null;
    return { minutes: budget, questions };
  }

  private quizQuestion(value: unknown): RehearsalQuestion | null {
    const source = this.asObject(value);
    const question = this.text(source?.['question']);
    const answer = this.text(source?.['answer']);
    const path = this.text(source?.['path']);
    if (!source || !question || !answer || !CONCEPT_PATH.test(path)) return null;
    if (source['choices'] === undefined) return { question, answer, path };
    // A multiple-choice question offers two to six distinct options, and the right ones are among them.
    const choices = Array.isArray(source['choices']) ? (source['choices'] as unknown[]).map((choice) => this.text(choice)) : [];
    const correct = Array.isArray(source['correct']) ? (source['correct'] as unknown[]).map(Number) : [];
    const pick = PICKS.find((entry) => entry === source['pick']) ?? null;
    if (choices.length < 2 || choices.length > 6 || choices.some((choice) => !choice) || new Set(choices).size !== choices.length) return null;
    if (!pick || !correct.length || new Set(correct).size !== correct.length) return null;
    if (correct.some((index) => !Number.isInteger(index) || index < 0 || index >= choices.length)) return null;
    if (pick === 'one' && correct.length !== 1) return null;
    return { question, answer, path, choices, correct, pick };
  }

  private asObject(value: unknown): Record<string, unknown> | null {
    return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
  }

  private text(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
  }
}
