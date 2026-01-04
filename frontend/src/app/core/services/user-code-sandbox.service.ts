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

@Injectable({ providedIn: 'root' })
export class UserCodeSandboxService {
  async runWithTests(args: { userCode: string; testCode: string; timeoutMs?: number }): Promise<RunnerOutput> {
    const nonce = crypto.getRandomValues(new Uint32Array(4)).join('-');

    // Module worker (Angular CLI supports `new URL(..., import.meta.url)` for TS workers)
    const worker = new Worker(new URL('../security/user-code-sandbox.worker', import.meta.url), { type: 'module' });

    const out = await new Promise<RunnerOutput>((resolve) => {
      const done = (msg: any) => {
        if (!msg || msg.data?.type !== 'done' || msg.data?.nonce !== nonce) return;
        cleanup();
        resolve({
          entries: msg.data.entries ?? [],
          results: msg.data.results ?? [],
          timedOut: !!msg.data.timedOut,
          error: msg.data.error,
        });
      };
      const err = () => {
        cleanup();
        resolve({ entries: [], results: [], error: 'Worker crashed' });
      };
      const cleanup = () => {
        worker.removeEventListener('message', done);
        worker.removeEventListener('error', err);
        try { worker.terminate(); } catch { }
      };
      worker.addEventListener('message', done);
      worker.addEventListener('error', err);

      worker.postMessage({
        type: 'run',
        nonce,
        userCode: args.userCode,
        testCode: args.testCode,
        timeoutMs: args.timeoutMs ?? 1500,
      });
    });

    return out;
  }
}
