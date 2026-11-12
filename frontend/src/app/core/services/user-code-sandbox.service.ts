import { Injectable } from '@angular/core';
import type { BundleFile } from '../utils/file-bundle.util';
import { userVisibleFailures } from '../utils/user-visible-failure-reporter';

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
const DEFAULT_TEST_TIMEOUT_MS = 1000;
const HARD_TIMEOUT_BUFFER_MS = 500;

type ProgressTest = { idx: number; name: string };

@Injectable({ providedIn: 'root' })
export class UserCodeSandboxService {
  /**
   * With `files`, each file runs as its own module, the tests import them, and `userCode` is unused.
   * `timeoutMs` covers loading the code and the tests, `testTimeoutMs` each test.
   */
  async runWithTests(args: {
    userCode: string;
    testCode: string;
    files?: readonly BundleFile[];
    timeoutMs?: number;
    testTimeoutMs?: number;
  }): Promise<RunnerOutput> {
    const nonce = crypto.getRandomValues(new Uint32Array(4)).join('-');
    const softTimeoutMs = args.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const testTimeoutMs = args.testTimeoutMs ?? DEFAULT_TEST_TIMEOUT_MS;
    let hardTimeoutMs = softTimeoutMs + HARD_TIMEOUT_BUFFER_MS;

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
      // What the worker reported while it ran: the tests it found, the one running now, the ones that finished.
      let registered: ProgressTest[] = [];
      let running: ProgressTest | null = null;
      const finished: Array<TestResult & { order?: number }> = [];

      const forceStop = () => {
        const message = `Sandbox was force-stopped after ${hardTimeoutMs}ms because execution blocked the worker.`;
        userVisibleFailures.report('runner_force_stopped', { timeoutMs: hardTimeoutMs });
        // Keep the tests that finished; the blocked one and the ones after it say what happened to them.
        const finishedIdx = new Set(finished.map((result) => result.order));
        const blocked = running;
        const unfinished = registered
          .filter((test) => !finishedIdx.has(test.idx))
          .map((test) => ({
            name: test.name,
            passed: false,
            error: test.idx === blocked?.idx
              ? `Stopped after ${hardTimeoutMs} ms: this test kept the runner busy, as an endless loop does.`
              : 'Not run: the runner was stopped before this test.',
          }));
        resolveOnce({
          entries: [{ level: 'error', message, timestamp: Date.now() }],
          results: [...finished.map(({ name, passed, error }) => ({ name, passed, error })), ...unfinished],
          timedOut: true,
          error: message,
        });
      };
      // Once tests run, the watchdog waits for the next sign of progress instead of the whole file.
      const armWatchdog = (ms: number) => {
        if (hardTimeoutHandle) clearTimeout(hardTimeoutHandle);
        hardTimeoutMs = ms;
        hardTimeoutHandle = setTimeout(forceStop, ms);
      };

      const done = (msg: any) => {
        if (!msg || msg.data?.nonce !== nonce) return;
        if (msg.data.type === 'progress') {
          const { phase, tests, test, result } = msg.data;
          if (phase === 'registered' && Array.isArray(tests)) registered = tests;
          if (phase === 'start' && test) running = test;
          if (phase === 'result' && result) {
            finished.push(result);
            running = null;
          }
          armWatchdog(testTimeoutMs + HARD_TIMEOUT_BUFFER_MS);
          return;
        }
        if (msg.data.type !== 'done') return;
        resolveOnce({
          entries: msg.data.entries ?? [],
          results: msg.data.results ?? [],
          timedOut: !!msg.data.timedOut,
          error: msg.data.error,
        });
      };
      const err = (event?: Event) => {
        try { event?.preventDefault?.(); } catch { }
        userVisibleFailures.report('runner_crashed');
        resolveOnce({
          entries: [{ level: 'error', message: 'Worker crashed', timestamp: Date.now() }],
          results: [],
          error: 'Worker crashed',
        });
      };
      worker.addEventListener('message', done);
      worker.addEventListener('error', err);

      armWatchdog(hardTimeoutMs);

      worker.postMessage({
        type: 'run',
        nonce,
        userCode: args.userCode,
        testCode: args.testCode,
        ...(args.files ? { files: args.files.map((file) => ({ path: file.path, code: file.code })) } : {}),
        timeoutMs: softTimeoutMs,
        testTimeoutMs,
      });
    });

    return out;
  }
}
