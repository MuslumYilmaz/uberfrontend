import { Injectable } from '@angular/core';
import { PressureModeProgressState } from '../models/pressure-mode.model';
import { AuthService } from './auth.service';
import { PracticeProgressService } from './practice-progress.service';

type StoredPressureSession = PressureModeProgressState & {
  updatedAt: string;
};

@Injectable({ providedIn: 'root' })
export class PressureModeProgressService {
  private readonly pendingCompletionPrefix = 'fa:pressure:pending-completion:v1:';

  constructor(
    private readonly progress: PracticeProgressService,
    private readonly auth: AuthService,
  ) {}

  itemId(scenarioId: string, questionId: string): string {
    return `pressure:${scenarioId}:${questionId}`;
  }

  read(scenarioId: string, questionId: string, roundCount: number): PressureModeProgressState {
    const id = this.itemId(scenarioId, questionId);
    const record = this.progress.getRecord('question', id);
    const session = this.progress.loadSession<StoredPressureSession>('question', id);
    const pendingCompletion = this.readPendingCompletion(scenarioId, questionId);
    const clearedRounds = this.clamp(
      Math.max(
        record.bestScore || 0,
        session?.clearedRounds || 0,
        pendingCompletion?.clearedRounds || 0,
      ),
      0,
      roundCount,
    );
    const completed = record.completed === true
      || session?.completed === true
      || pendingCompletion?.completed === true;
    const defaultRound = completed
      ? Math.max(0, roundCount - 1)
      : Math.min(clearedRounds, Math.max(0, roundCount - 1));
    const activeRoundIndex = this.clamp(
      session?.activeRoundIndex ?? pendingCompletion?.activeRoundIndex ?? defaultRound,
      0,
      Math.max(0, roundCount - 1),
    );

    return { activeRoundIndex, clearedRounds, completed };
  }

  start(
    scenarioId: string,
    questionId: string,
    state: PressureModeProgressState,
  ): void {
    this.saveSession(scenarioId, questionId, state);
    if (!this.auth.isLoggedIn()) return;
    const id = this.itemId(scenarioId, questionId);
    this.progress.updateRecord('question', id, (current) => ({
      ...current,
      started: true,
      lastPlayedAt: new Date().toISOString(),
      extension: {
        ...(current.extension || {}),
        scenarioId,
        questionId,
      },
    }));
  }

  revealRound(
    scenarioId: string,
    questionId: string,
    state: PressureModeProgressState,
  ): void {
    this.saveSession(scenarioId, questionId, state);
  }

  markRoundCleared(
    scenarioId: string,
    questionId: string,
    state: PressureModeProgressState,
  ): void {
    this.saveSession(scenarioId, questionId, state);
    if (!this.auth.isLoggedIn()) return;
    const id = this.itemId(scenarioId, questionId);
    this.progress.updateRecord('question', id, (current) => ({
      ...current,
      started: true,
      completed: current.completed || state.completed,
      passed: current.passed || state.completed,
      bestScore: Math.max(current.bestScore || 0, state.clearedRounds),
      lastPlayedAt: new Date().toISOString(),
      extension: {
        ...(current.extension || {}),
        scenarioId,
        questionId,
        activeRoundIndex: state.activeRoundIndex,
      },
    }));
  }

  markPendingCompletion(
    scenarioId: string,
    questionId: string,
    state: PressureModeProgressState,
  ): void {
    if (typeof sessionStorage === 'undefined') return;
    try {
      sessionStorage.setItem(
        this.pendingCompletionKey(scenarioId, questionId),
        JSON.stringify({
          ...state,
          updatedAt: new Date().toISOString(),
        } satisfies StoredPressureSession),
      );
    } catch {
      // The completed state still remains in the scoped practice session.
    }
  }

  hasPendingCompletion(scenarioId: string, questionId: string): boolean {
    return this.readPendingCompletion(scenarioId, questionId)?.completed === true;
  }

  clearPendingCompletion(scenarioId: string, questionId: string): void {
    if (typeof sessionStorage === 'undefined') return;
    try {
      sessionStorage.removeItem(this.pendingCompletionKey(scenarioId, questionId));
    } catch {
      // Ignore storage restrictions.
    }
  }

  private saveSession(
    scenarioId: string,
    questionId: string,
    state: PressureModeProgressState,
  ): void {
    this.progress.saveSession<StoredPressureSession>(
      'question',
      this.itemId(scenarioId, questionId),
      {
        ...state,
        updatedAt: new Date().toISOString(),
      },
    );
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, Math.floor(Number(value) || 0)));
  }

  private readPendingCompletion(
    scenarioId: string,
    questionId: string,
  ): StoredPressureSession | null {
    if (typeof sessionStorage === 'undefined') return null;
    try {
      const raw = sessionStorage.getItem(this.pendingCompletionKey(scenarioId, questionId));
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<StoredPressureSession>;
      if (parsed.completed !== true) return null;
      return {
        activeRoundIndex: Number(parsed.activeRoundIndex) || 0,
        clearedRounds: Number(parsed.clearedRounds) || 0,
        completed: true,
        updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : '',
      };
    } catch {
      return null;
    }
  }

  private pendingCompletionKey(scenarioId: string, questionId: string): string {
    return `${this.pendingCompletionPrefix}${this.itemId(scenarioId, questionId)}`;
  }
}
