// src/app/features/coding/console-logger/console-logger.component.ts
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, ElementRef, Input, OnChanges, ViewChild, isDevMode
} from '@angular/core';
import { normalizeError, normalizeMessageLine } from '../../../core/utils/console-normalize';

export type LogLevel = 'log' | 'warn' | 'error' | 'info';

export interface ConsoleEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  /** optional: consecutive duplicates will increment this */
  repeat?: number;
  stack?: string;
  name?: string;
}

export interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

@Component({
  selector: 'app-console-logger',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host { display:block; height:100%; min-height:200px; }
    .wrap { display:flex; flex-direction:column; height:100%; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
    .head { display:flex; align-items:center; gap:.5rem; padding:.5rem; border-bottom:1px solid rgba(255,255,255,.15); }
    .title { font-size:.7rem; opacity:.8; }
    .body { flex:1; overflow:auto; padding:.5rem; }
    .row { word-break: break-word; }
    .ts { opacity:.6; font-size:.65rem; }
    .msg { margin-left:.25rem; }
    .badge { margin-left:.5rem; font-size:.65rem; opacity:.7; border:1px solid rgba(255,255,255,.25); border-radius:999px; padding:0 .35rem; }
    .details { margin:.35rem 0 0 1.25rem; font-size:.7rem; opacity:.9; }
    .details summary { cursor:pointer; opacity:.75; }
    .details pre { margin:.35rem 0 0; white-space:pre-wrap; word-break:break-word; }
    .l-log   { color:#e5e7eb; }
    .l-info  { color:#7dd3fc; }
    .l-warn  { color:#fde68a; }
    .l-error { color:#fca5a5; }
    .body { overflow-anchor: none; }
  `],
  template: `
    <div class="wrap bg-black text-white">
      <div class="head">
        <div class="title">Console</div>
        <div class="ml-auto text-xs opacity-70">{{ processed.length }} line{{ processed.length===1?'':'s' }}</div>
      </div>

      <div #scroller class="body">
        <div *ngFor="let e of processed; trackBy: trackByIdx" class="row">
          <span class="ts">[{{ formatTime(e.timestamp) }}]</span>
          <span class="msg" [ngClass]="levelClass(e.level)">
            <strong>{{ e.level.toUpperCase() }}:</strong> {{ e.message }}
            <span *ngIf="(e.repeat ?? 1) > 1" class="badge">×{{ e.repeat }}</span>
          </span>
          <details *ngIf="showDetails && e.stack" class="details">
            <summary>Details</summary>
            <pre>{{ e.stack }}</pre>
          </details>
        </div>

        <div *ngIf="processed.length===0" class="opacity-60">No logs yet.</div>
      </div>
    </div>
  `,
})
export class ConsoleLoggerComponent implements OnChanges {
  /** hard cap to prevent DOM blowups */
  @Input() max = 500;
  /** auto-scroll to bottom if user is already near bottom */
  @Input() autoScroll = true;
  /** dev-only stack details */
  @Input() showDetails = isDevMode();
  /** window in ms for deduping identical messages */
  @Input() dedupeWindowMs = 200;
  /** raw entries (can be huge; we’ll trim & coalesce) */
  @Input() entries: ConsoleEntry[] = [];
  @Input() results: TestResult[] = [];

  @ViewChild('scroller', { read: ElementRef }) scroller?: ElementRef<HTMLDivElement>;

  processed: ConsoleEntry[] = [];

  ngOnChanges() {
    const trimmed = (this.entries ?? []).slice(-(this.max * 4));
    const out: ConsoleEntry[] = [];
    const lastSeen = new Map<string, { idx: number; ts: number }>();
    for (const raw of trimmed) {
      const normalized = this.normalizeEntry(raw);
      const key = this.entryKey(normalized);
      const prev = lastSeen.get(key);
      if (prev && Math.abs(normalized.timestamp - prev.ts) <= this.dedupeWindowMs) {
        const target = out[prev.idx];
        if (target) {
          target.repeat = (target.repeat ?? 1) + 1;
          target.timestamp = normalized.timestamp;
          prev.ts = normalized.timestamp;
          continue;
        }
      }

      const msg = this.clampMessage(normalized.message);
      out.push({ ...normalized, message: msg, repeat: 1 });
      lastSeen.set(key, { idx: out.length - 1, ts: normalized.timestamp });
    }
    this.processed = out.slice(-this.max);
    queueMicrotask(() => this.maybeAutoScroll());
  }

  private maybeAutoScroll() {
    if (!this.autoScroll || !this.scroller) return;
    const el = this.scroller.nativeElement;
    const nearBottom = (el.scrollHeight - el.scrollTop - el.clientHeight) < 64;
    if (nearBottom) el.scrollTop = el.scrollHeight;
  }

  formatTime(ts: number) { return new Date(ts).toLocaleTimeString(); }
  levelClass(level: LogLevel) {
    return level === 'error' ? 'l-error'
      : level === 'warn' ? 'l-warn'
        : level === 'info' ? 'l-info'
          : 'l-log';
  }

  // ✅ Correct TrackByFunction signature: (index: number, item: ConsoleEntry) => any
  trackByIdx(index: number, _item: ConsoleEntry) { return index; }

  private normalizeEntry(entry: ConsoleEntry): ConsoleEntry {
    const mode = this.showDetails ? 'dev' : 'prod';
    if (entry.level === 'error' || entry.stack) {
      const normalized = normalizeError(entry, { mode });
      return {
        ...entry,
        message: normalizeMessageLine(normalized.message),
        stack: normalized.stack,
        name: normalized.name,
      };
    }
    return { ...entry, message: normalizeMessageLine(entry.message) };
  }

  private clampMessage(message: string): string {
    return typeof message === 'string' && message.length > 4000
      ? (message.slice(0, 4000) + '…')
      : message;
  }

  private entryKey(entry: ConsoleEntry): string {
    const stackHash = entry.stack ? this.hashString(entry.stack) : '';
    const name = entry.name ? `:${entry.name}` : '';
    return `${entry.level}|${entry.message}${name}|${stackHash}`;
  }

  private hashString(value: string): string {
    let hash = 5381;
    for (let i = 0; i < value.length; i += 1) {
      hash = ((hash << 5) + hash) + value.charCodeAt(i);
    }
    return (hash >>> 0).toString(16);
  }
}
