import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  signal,
} from '@angular/core';

type LogLevel = 'log' | 'warn' | 'error' | 'info' | 'clear';

interface ConsoleEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
}

const iframeHTML = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body>
<script>
  function serializeArg(arg) {
    try {
      if (typeof arg === 'object') return JSON.stringify(arg, null, 2);
      return String(arg);
    } catch (e) {
      return String(arg);
    }
  }

  function send(level, ...args) {
    const serial = args.map(serializeArg).join(' ');
    parent.postMessage({ type: 'console', level, message: serial, timestamp: Date.now() }, '*');
  }

  console.log = (...args) => send('log', ...args);
  console.warn = (...args) => send('warn', ...args);
  console.error = (...args) => send('error', ...args);
  console.info = (...args) => send('info', ...args);
  console.clear = () => parent.postMessage({ type: 'console', level: 'clear', timestamp: Date.now() }, '*');

  window.addEventListener('error', (e) => {
    send('error', \`Uncaught error: \${e.message} at \${e.filename}:\${e.lineno}\`);
  });

  window.addEventListener('unhandledrejection', (e) => {
    const reason = (e.reason && e.reason.stack) ? e.reason.stack : e.reason;
    send('error', 'UnhandledPromiseRejection: ' + reason);
  });

  window.addEventListener('message', (ev) => {
    if (!ev.data || ev.data.type !== 'runCode') return;
    try {
      // execute in an async IIFE so top-level await-ish behavior is supported
      (async () => {
        try {
          // eslint-disable-next-line no-eval
          const result = eval(ev.data.code);
        if (result instanceof Promise) {
          result
            .then(res => {
              if (res !== undefined) {
                console.log('Promise resolved with', res);
              }
            })
            .catch(err => console.error('Promise rejected with', err));
        }

        } catch (inner) {
          console.error('Execution error:', inner);
        }
      })();
    } catch (err) {
      console.error('Eval wrapper error:', err);
    }
  });

  // signal readiness
  parent.postMessage({ type: 'ready' }, '*');
</script>
</body>
</html>
`;

@Component({
  selector: 'app-console-logger',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col h-full text-sm font-mono bg-black text-white overflow-hidden">
      <div class="flex items-center gap-2 p-2 border-b border-gray-700">
        <button (click)="clear()" class="px-2 py-1 bg-gray-800 rounded">Clear</button>
        <div class="text-xs flex-1">
          <span *ngIf="ready()">Sandbox ready</span>
          <span *ngIf="!ready()">Initializing...</span>
        </div>
      </div>
      <div class="flex-1 overflow-auto p-2 space-y-1">
        <div *ngFor="let e of entries()" class="break-words">
          <span class="opacity-60 text-[10px]">[{{ formatTime(e.timestamp) }}]</span>
          <span [ngClass]="levelClass(e.level)" class="ml-1">
            <strong>{{ e.level.toUpperCase() }}:</strong> {{ e.message }}
          </span>
        </div>
      </div>
    </div>
    <!-- hidden iframe used for sandbox execution -->
    <iframe #sandbox style="display:none" sandbox="allow-scripts"></iframe>
  `,
  styles: [
    `
      :host { display: block; height: 300px; } /* adjust externally as needed */
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsoleLoggerComponent implements AfterViewInit, OnDestroy {
  entries = signal<ConsoleEntry[]>([]);
  ready = signal(false);
  private iframeEl?: HTMLIFrameElement;
  private blobUrl?: string;
  private boundMessage = this.onMessage.bind(this);

  ngAfterViewInit() {
    // create blob URL
    const blob = new Blob([iframeHTML], { type: 'text/html' });
    this.blobUrl = URL.createObjectURL(blob);

    // build iframe
    this.iframeEl = document.createElement('iframe');
    this.iframeEl.sandbox.add('allow-scripts');
    this.iframeEl.style.display = 'none';
    this.iframeEl.src = this.blobUrl;
    document.body.appendChild(this.iframeEl);

    window.addEventListener('message', this.boundMessage);
  }

  ngOnDestroy() {
    window.removeEventListener('message', this.boundMessage);
    if (this.iframeEl) this.iframeEl.remove();
    if (this.blobUrl) URL.revokeObjectURL(this.blobUrl);
  }

  private onMessage(ev: MessageEvent) {
    const data = ev.data;
    if (!data || typeof data !== 'object') return;

    if (data.type === 'ready') {
      this.ready.set(true);
      this.append({ level: 'info', message: 'Sandbox initialized', timestamp: Date.now() });
    } else if (data.type === 'console') {
      if (data.level === 'clear') {
        this.entries.set([]);
        return;
      }
      this.append({
        level: data.level,
        message: data.message,
        timestamp: data.timestamp || Date.now(),
      });
    }
  }

  private append(entry: ConsoleEntry) {
    this.entries.set([...this.entries(), entry]);
    // optional: auto-scroll logic could be added via ViewChild if you expose scroll container
  }

  runCode(code: string) {
    if (!this.iframeEl?.contentWindow) return;
    this.iframeEl.contentWindow.postMessage({ type: 'runCode', code }, '*');
  }

  clear() {
    this.entries.set([]);
    if (this.iframeEl?.contentWindow) {
      this.iframeEl.contentWindow.postMessage({ type: 'clear' }, '*');
    }
  }

  formatTime(ts: number) {
    const d = new Date(ts);
    return d.toLocaleTimeString();
  }

  levelClass(level: LogLevel) {
    switch (level) {
      case 'error':
        return 'text-red-400';
      case 'warn':
        return 'text-yellow-300';
      case 'info':
        return 'text-sky-300';
      default:
        return 'text-gray-200';
    }
  }
}