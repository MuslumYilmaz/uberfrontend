import { Injectable, computed, inject } from '@angular/core';
import {
  TradeoffBattleProgressRecord,
  createEmptyTradeoffBattleProgressRecord,
} from '../models/tradeoff-battle.model';
import { PracticeProgressCoreRecord } from '../models/practice.model';
import { PracticeProgressService } from './practice-progress.service';

@Injectable({ providedIn: 'root' })
export class TradeoffBattleProgressService {
  private readonly coreProgress = inject(PracticeProgressService);

  readonly records = computed<Record<string, TradeoffBattleProgressRecord>>(() =>
    Object.entries(this.coreProgress.records())
      .filter(([, record]) => record.family === 'tradeoff-battle')
      .reduce<Record<string, TradeoffBattleProgressRecord>>((acc, [key, record]) => {
        acc[key.replace(/^tradeoff-battle:/, '')] = this.fromCore(record);
        return acc;
      }, {}),
  );

  getRecord(id: string): TradeoffBattleProgressRecord {
    return this.fromCore(this.coreProgress.getRecord('tradeoff-battle', id));
  }

  saveDraft(id: string, payload: { selectedOptionId?: string }): TradeoffBattleProgressRecord {
    return this.fromCore(
      this.coreProgress.updateRecord('tradeoff-battle', id, (current) => ({
        ...current,
        started: current.started || !!payload.selectedOptionId,
        lastPlayedAt: new Date().toISOString(),
        extension: {
          ...(current.extension ?? {}),
          selectedOptionId: payload.selectedOptionId ?? this.selectedOptionId(current.extension),
        },
      })),
    );
  }

  markCompleted(id: string, payload: { selectedOptionId?: string }): TradeoffBattleProgressRecord {
    return this.fromCore(
      this.coreProgress.updateRecord('tradeoff-battle', id, (current) => ({
        ...current,
        started: true,
        completed: true,
        lastPlayedAt: new Date().toISOString(),
        extension: {
          ...(current.extension ?? {}),
          selectedOptionId: payload.selectedOptionId ?? this.selectedOptionId(current.extension),
          revealed: true,
        },
      })),
    );
  }

  private fromCore(record: PracticeProgressCoreRecord): TradeoffBattleProgressRecord {
    return {
      started: record.started,
      completed: record.completed,
      lastPlayedAt: record.lastPlayedAt,
      selectedOptionId: this.selectedOptionId(record.extension),
    };
  }

  private selectedOptionId(extension: Record<string, unknown> | undefined): string {
    return typeof extension?.['selectedOptionId'] === 'string' ? String(extension['selectedOptionId']) : '';
  }
}
