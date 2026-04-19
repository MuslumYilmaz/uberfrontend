import { Injectable } from '@angular/core';

export type ConsoleEntry = {
  level: 'log' | 'warn' | 'error';
  message: string;
  timestamp: number;
  stack?: string;
  name?: string;
};
export type TestResult = { name: string; passed: boolean; error?: string };
export type RunnerOutput = { entries: ConsoleEntry[]; results: TestResult[]; timedOut?: boolean; error?: string };

const DEFAULT_TIMEOUT_MS = 1500;
const HARD_TIMEOUT_BUFFER_MS = 500;

@Injectable({ providedIn: 'root' })
export class UserCodeSandboxService {
  async runWithTests(args: { userCode: string; testCode: string; timeoutMs?: number }): Promise<RunnerOutput> {
    const nonce = crypto.getRandomValues(new Uint32Array(4)).join('-');
    const softTimeoutMs = args.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const hardTimeoutMs = softTimeoutMs + HARD_TIMEOUT_BUFFER_MS;

    // Module worker (Angular CLI supports `new URL(..., import.meta.url)` for TS workers)
    const worker = new Worker(new URL('../security/user-code-sandbox.worker', import.meta.url), { type: 'module' });

    const out = await new Promise<RunnerOutput>((resolve) => {
      let settled = false;
      let hardTimeoutHandle: ReturnType<typeof setTimeout> | null = null;

      const cleanup = () => {
        if (hardTimeoutHandle) {
          clearTimeout(hardTimeoutHandle);
          hardTimeoutHandle = null;
        }
        worker.removeEventListener('message', done);
        worker.removeEventListener('error', err);
        try { worker.terminate(); } catch { }
      };
      const resolveOnce = (value: RunnerOutput) => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(value);
      };
      const done = (msg: any) => {
        if (!msg || msg.data?.type !== 'done' || msg.data?.nonce !== nonce) return;
        resolveOnce({
          entries: msg.data.entries ?? [],
          results: msg.data.results ?? [],
          timedOut: !!msg.data.timedOut,
          error: msg.data.error,
        });
      };
      const err = () => {
        resolveOnce({
          entries: [{ level: 'error', message: 'Worker crashed', timestamp: Date.now() }],
          results: [],
          error: 'Worker crashed',
        });
      };
      worker.addEventListener('message', done);
      worker.addEventListener('error', err);

      hardTimeoutHandle = setTimeout(() => {
        const message = `Sandbox was force-stopped after ${hardTimeoutMs}ms because execution blocked the worker.`;
        resolveOnce({
          entries: [{ level: 'error', message, timestamp: Date.now() }],
          results: [],
          timedOut: true,
          error: message,
        });
      }, hardTimeoutMs);

      worker.postMessage({
        type: 'run',
        nonce,
        userCode: args.userCode,
        testCode: args.testCode,
        timeoutMs: softTimeoutMs,
      });
    });

    return out;
  }
}
