import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject } from '@angular/core';
import {
  IncidentProgressRecord,
  IncidentSessionState,
} from '../models/incident.model';
import { PracticeProgressCoreRecord } from '../models/practice.model';
import { PracticeProgressService } from './practice-progress.service';

@Injectable({ providedIn: 'root' })
export class IncidentProgressService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly coreProgress = inject(PracticeProgressService);

  readonly records = computed<Record<string, IncidentProgressRecord>>(() =>
    Object.entries(this.coreProgress.records())
      .filter(([, record]) => record.family === 'incident')
      .reduce<Record<string, IncidentProgressRecord>>((acc, [key, record]) => {
        acc[key.replace(/^incident:/, '')] = this.fromCore(record);
        return acc;
      }, {}),
  );

  getRecord(id: string): IncidentProgressRecord {
    return this.fromCore(this.coreProgress.getRecord('incident', id));
  }

  markStarted(id: string): IncidentProgressRecord {
    return this.fromCore(
      this.coreProgress.updateRecord('incident', id, (current) => ({
        ...current,
        started: true,
        lastPlayedAt: new Date().toISOString(),
      })),
    );
  }

  completeAttempt(id: string, score: number, reflectionNote?: string): IncidentProgressRecord {
    return this.fromCore(
      this.coreProgress.updateRecord('incident', id, (current) => ({
        ...current,
        started: true,
        completed: true,
        passed: current.passed || score >= 70,
        bestScore: Math.max(current.bestScore, score),
        lastPlayedAt: new Date().toISOString(),
        extension: {
          ...(current.extension ?? {}),
          reflectionNote: reflectionNote ?? this.getReflectionNote(current.extension),
        },
      })),
    );
  }

  saveReflection(id: string, note: string): IncidentProgressRecord {
    return this.fromCore(
      this.coreProgress.updateRecord('incident', id, (current) => ({
        ...current,
        started: current.started || note.trim().length > 0,
        lastPlayedAt: new Date().toISOString(),
        extension: {
          ...(current.extension ?? {}),
          reflectionNote: note.slice(0, 240),
        },
      })),
    );
  }

  saveSession(id: string, session: IncidentSessionState): void {
    if (!this.isBrowser) return;
    this.coreProgress.saveSession('incident', id, session);
  }

  loadSession(id: string): IncidentSessionState | null {
    const parsed = this.coreProgress.loadSession<Partial<IncidentSessionState>>('incident', id);
    if (!parsed) return null;

    const answers = typeof parsed.answers === 'object' && parsed.answers
      ? parsed.answers as Record<string, string | string[]>
      : {};
    const submittedStageIds = Array.isArray(parsed.submittedStageIds)
      ? parsed.submittedStageIds.filter((value): value is string => typeof value === 'string')
      : [];
    const activeStepIndex = typeof parsed.activeStepIndex === 'number' ? parsed.activeStepIndex : 0;

    return {
      activeStepIndex,
      answers,
      submittedStageIds,
    };
  }

  clearSession(id: string): void {
    this.coreProgress.clearSession('incident', id);
  }

  private fromCore(record: PracticeProgressCoreRecord): IncidentProgressRecord {
    return {
      started: record.started,
      completed: record.completed,
      passed: record.passed,
      bestScore: record.bestScore,
      lastPlayedAt: record.lastPlayedAt,
      reflectionNote: this.getReflectionNote(record.extension),
    };
  }

  private getReflectionNote(extension: Record<string, unknown> | undefined): string {
    return typeof extension?.['reflectionNote'] === 'string' ? String(extension['reflectionNote']) : '';
  }
}
