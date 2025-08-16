import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  OnDestroy,
  Output,
  signal,
} from '@angular/core';

type LogLevel = 'log' | 'warn' | 'error' | 'info' | 'clear';

export interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

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
    } catch {
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

  // --- minimal test framework ---
  const results = [];
  const pendingPromises = [];

  function expect(actual) {
    return {
      toEqual(expected) {
        const pass = actual === expected;
        if (!pass) throw new Error(\`Expected \${JSON.stringify(actual)} to equal \${JSON.stringify(expected)}\`);
      },
      toBeNaN() {
        if (!Number.isNaN(actual)) throw new Error(\`Expected \${actual} to be NaN\`);
      },
      toBeCloseTo(expected, precision = 2) {
        const diff = Math.abs(actual - expected);
        const threshold = Math.pow(10, -precision) / 2;
        if (diff > threshold) {
          throw new Error(\`Expected \${actual} to be close to \${expected} with precision \${precision}\`);
        }
      },
    };
  }

  function test(name, fn) {
    try {
      const maybe = fn();
      if (maybe instanceof Promise) {
        const p = maybe
          .then(() => {
            results.push({ name, passed: true });
          })
          .catch((err) => {
            results.push({ name, passed: false, error: err.message });
          });
        pendingPromises.push(p);
      } else {
        results.push({ name, passed: true });
      }
    } catch (err) {
      results.push({ name, passed: false, error: err.message });
    }
  }

  function describe(_name, fn) {
    fn();
  }

  async function runTestsAndReport() {
    await Promise.all(pendingPromises);
    parent.postMessage({ type: 'testResults', results }, '*');
  }

  window.addEventListener('message', async (ev) => {
    if (!ev.data || typeof ev.data !== 'object') return;

    if (ev.data.type === 'readyCheck') {
      parent.postMessage({ type: 'ready' }, '*');
    }

    if (ev.data.type === 'runWithTests') {
      results.length = 0;
      pendingPromises.length = 0;

      try {
        eval(ev.data.userCode);
      } catch (e) {
        const msg = e && e.stack ? e.stack : (e && e.message) ? e.message : String(e);
        console.error('Error in user code:', msg);
      }

      try {
        eval(ev.data.testCode);
      } catch (e) {
        const msg = e && e.stack ? e.stack : (e && e.message) ? e.message : String(e);
        console.error('Error in test definitions:', msg);
      }

      await runTestsAndReport();
    }
  });

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
    <iframe #sandbox style="display:none" sandbox="allow-scripts"></iframe>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
        min-height: 200px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsoleLoggerComponent implements AfterViewInit, OnDestroy {
  entries = signal<ConsoleEntry[]>([]);
  ready = signal(false);
  testResults: TestResult[] = [];
  @Output() testsFinished = new EventEmitter<TestResult[]>();

  iframeEl?: HTMLIFrameElement;
  private readyTimeoutId?: number;
  private boundMessage = this.onMessage.bind(this);

  ngAfterViewInit() {
    this.iframeEl = document.createElement('iframe');
    this.iframeEl.sandbox.add('allow-scripts');
    this.iframeEl.style.display = 'none';
    this.iframeEl.srcdoc = iframeHTML;
    document.body.appendChild(this.iframeEl);

    window.addEventListener('message', this.boundMessage);

    this.readyTimeoutId = window.setTimeout(() => {
      if (!this.ready()) {
        this.append({
          level: 'error',
          message: 'Sandbox failed to initialize (possible srcdoc/load issue)',
          timestamp: Date.now(),
        });
      }
    }, 2000);
  }

  ngOnDestroy() {
    window.removeEventListener('message', this.boundMessage);
    if (this.iframeEl) this.iframeEl.remove();
    if (this.readyTimeoutId) window.clearTimeout(this.readyTimeoutId);
  }

  private onMessage(ev: MessageEvent) {
    const data = ev.data;
    if (!data || typeof data !== 'object') return;

    if (data.type === 'ready') {
      this.ready.set(true);
      this.append({ level: 'info', message: 'Sandbox ready', timestamp: Date.now() });
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
    } else if (data.type === 'testResults') {
      this.testResults = data.results || [];
      this.testsFinished.emit(this.testResults);
    }
  }

  private append(entry: ConsoleEntry) {
    this.entries.set([...this.entries(), entry]);
  }

  runCode(code: string) {
    if (this.iframeEl?.contentWindow) {
      this.iframeEl.contentWindow.postMessage({ type: 'runWithTests', userCode: code, testCode: '' }, '*');
    }
  }

  runWithTests(userCode: string, testCode: string) {
    if (this.iframeEl?.contentWindow) {
      this.testResults = [];
      this.entries.set([]);
      this.iframeEl.contentWindow.postMessage({ type: 'runWithTests', userCode, testCode }, '*');
    }
  }

  clear() {
    this.entries.set([]);
    this.testResults = [];
    if (this.iframeEl?.contentWindow) {
      this.iframeEl.contentWindow.postMessage({ type: 'readyCheck' }, '*');
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
