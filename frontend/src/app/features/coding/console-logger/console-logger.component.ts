import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export type LogLevel = 'log' | 'warn' | 'error' | 'info';

export interface ConsoleEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
}

export interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

/**
 * DUMB VIEW ONLY
 * Renders logs and (optionally) shows results summary if you want to extend it.
 * No iframes, no execution, no postMessage.
 */
@Component({
  selector: 'app-console-logger',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col h-full text-sm font-mono bg-black text-white overflow-hidden">
      <div class="flex items-center gap-2 p-2 border-b border-gray-700">
        <div class="text-xs flex-1">Console</div>
      </div>

      <div class="flex-1 overflow-auto p-2 space-y-1">
        <div *ngFor="let e of entries" class="break-words">
          <span class="opacity-60 text-[10px]">[{{ formatTime(e.timestamp) }}]</span>
          <span [ngClass]="levelClass(e.level)" class="ml-1">
            <strong>{{ e.level.toUpperCase() }}:</strong> {{ e.message }}
          </span>
        </div>
        <div *ngIf="!entries?.length" class="opacity-60">No logs yet.</div>
      </div>
    </div>
  `,
  styles: [`
    :host { display:block; height:100%; min-height:200px; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsoleLoggerComponent {
  @Input() entries: ConsoleEntry[] = [];
  @Input() results: TestResult[] = [];

  formatTime(ts: number) { return new Date(ts).toLocaleTimeString(); }

  levelClass(level: LogLevel) {
    switch (level) {
      case 'error': return 'text-red-400';
      case 'warn': return 'text-yellow-300';
      case 'info': return 'text-sky-300';
      default: return 'text-gray-200';
    }
  }
}