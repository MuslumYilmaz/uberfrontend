import { NgZone, signal } from '@angular/core';
import type { InterviewModeSession } from '../models/editor-assist.model';

type TimedPracticeStep = InterviewModeSession['durationMin'];

/** A finished timed practice: its runs, the best share of tests passed (a percent) and the seconds it took. */
export type TimedPracticeSummary = { runs: number; bestPassPct: number; elapsedSec: number };

/** Where a running session is kept so a reload finds it (AttemptInsightsService keeps it in sessionStorage). */
export interface TimedPracticeStore {
  getInterviewSession(questionId: string): InterviewModeSession | null;
  saveInterviewSession(session: InterviewModeSession): void;
  clearInterviewSession(questionId: string): void;
}

/**
 * A task's timed practice, shared by the JavaScript and the framework workspaces: the session, the seconds left and
 * a ticker that ends the session when the time runs out. The ticker runs outside the zone: a session restored while
 * the page loads would otherwise keep the app from turning stable, and hydration would leave the prerendered markup.
 */
export class TimedPracticeClock {
  readonly active = signal(false);
  readonly remainingSec = signal(0);
  readonly summary = signal<TimedPracticeSummary | null>(null);
  private session: InterviewModeSession | null = null;
  private ticker: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly options: {
    zone: NgZone;
    isBrowser: boolean;
    store: TimedPracticeStore | null;
    /** Called once the time is up; the owner ends the session (end()) and does its own clean-up. */
    onExpired: () => void;
  }) {}

  start(questionId: string, durationMin: TimedPracticeStep, now = Date.now()): void {
    this.summary.set(null);
    this.session = { questionId, startedAt: now, durationMin, runs: 0, bestPassPct: 0, updatedAt: now };
    this.options.store?.saveInterviewSession(this.session);
    this.active.set(true);
    this.sync();
    this.startTicker();
  }

  /** Picks up the task's session after a reload while it still runs; returns its minutes, or null. */
  restore(questionId: string): TimedPracticeStep | null {
    const session = this.options.store?.getInterviewSession(questionId);
    if (!session) return null;
    if (Date.now() >= session.startedAt + session.durationMin * 60_000) {
      this.options.store?.clearInterviewSession(questionId);
      return null;
    }
    this.session = session;
    this.active.set(true);
    this.sync();
    this.startTicker();
    return session.durationMin;
  }

  /** Counts a run of the tests or checks toward the summary. */
  recordRun(passCount: number, totalCount: number): void {
    if (!this.active() || !this.session) return;
    const passPct = totalCount > 0 ? passCount / totalCount : 0;
    this.session = {
      ...this.session,
      runs: this.session.runs + 1,
      bestPassPct: Math.max(this.session.bestPassPct, passPct),
      updatedAt: Date.now(),
    };
    this.options.store?.saveInterviewSession(this.session);
    this.sync();
  }

  /** Ends the running session and returns its summary, also kept in `summary`; null when none ran. */
  end(): TimedPracticeSummary | null {
    if (!this.active()) return null;
    const session = this.session;
    this.active.set(false);
    this.remainingSec.set(0);
    this.stopTicker();
    this.session = null;
    if (!session) return null;
    this.options.store?.clearInterviewSession(session.questionId);
    const summary: TimedPracticeSummary = {
      runs: session.runs,
      bestPassPct: Math.round(session.bestPassPct * 100),
      elapsedSec: Math.max(0, Math.round((Date.now() - session.startedAt) / 1000)),
    };
    this.summary.set(summary);
    return summary;
  }

  /** Back to no session and no summary, for another task; the stored session of this one stays for a reload. */
  reset(): void {
    this.stopTicker();
    this.session = null;
    this.active.set(false);
    this.remainingSec.set(0);
    this.summary.set(null);
  }

  /** "29:05 left". */
  remainingLabel(): string {
    const total = Math.max(0, this.remainingSec());
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')} left`;
  }

  dispose(): void {
    this.stopTicker();
  }

  private sync(): void {
    if (!this.session) {
      this.remainingSec.set(0);
      return;
    }
    const remainingMs = Math.max(0, this.session.startedAt + this.session.durationMin * 60_000 - Date.now());
    this.remainingSec.set(Math.ceil(remainingMs / 1000));
    if (remainingMs <= 0) this.options.onExpired();
  }

  private startTicker(): void {
    this.stopTicker();
    if (!this.options.isBrowser || !this.active()) return;
    this.ticker = this.options.zone.runOutsideAngular(() =>
      setInterval(() => this.options.zone.run(() => this.sync()), 1000));
  }

  private stopTicker(): void {
    if (this.ticker !== null) {
      clearInterval(this.ticker);
      this.ticker = null;
    }
  }
}
