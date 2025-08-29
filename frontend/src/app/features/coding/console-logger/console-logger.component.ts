// src/app/features/coding/console-logger/console-logger.component.ts
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, ElementRef, Input, OnChanges, ViewChild
} from '@angular/core';

export type LogLevel = 'log' | 'warn' | 'error' | 'info';

export interface ConsoleEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  /** optional: consecutive duplicates will increment this */
  repeat?: number;
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
  /** raw entries (can be huge; we’ll trim & coalesce) */
  @Input() entries: ConsoleEntry[] = [];
  @Input() results: TestResult[] = [];

  @ViewChild('scroller', { read: ElementRef }) scroller?: ElementRef<HTMLDivElement>;

  processed: ConsoleEntry[] = [];

  ngOnChanges() {
    const trimmed = (this.entries ?? []).slice(-(this.max * 4));
    const out: ConsoleEntry[] = [];
    for (const e of trimmed) {
      const prev = out[out.length - 1];
      if (prev && prev.level === e.level && prev.message === e.message) {
        prev.repeat = (prev.repeat ?? 1) + 1;
        prev.timestamp = e.timestamp;
      } else {
        const msg = typeof e.message === 'string' && e.message.length > 4000
          ? (e.message.slice(0, 4000) + '…')
          : e.message;
        out.push({ ...e, message: msg, repeat: 1 });
      }
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
}
