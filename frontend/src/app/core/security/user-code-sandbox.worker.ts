/// <reference lib="webworker" />

import { normalizeError } from '../utils/console-normalize';
import type { BundleFile } from '../utils/file-bundle.util';
import { createSandboxFakeTimers } from './user-code-sandbox-fake-timers';
import { freezeHardenedPrototypes } from './user-code-sandbox-hardening';
import { createSandboxExpect } from './user-code-sandbox-matchers';
import { linkModules } from './user-code-sandbox-modules';
import { runQueue, timedOutMessage, type QueuedResult, type QueuedTest } from './user-code-sandbox-runner';

// ---------- message contracts ----------
type RunMsg = {
    type: 'run';
    nonce: string;
    userCode: string;    // transformed to set globalThis[globalName]
    testCode: string;    // transformed to reference that global; with files, imports them as they are
    files?: BundleFile[]; // a multi-file task: each file runs as its own module and userCode is unused
    timeoutMs?: number;  // loading the code and the tests; default 1500
    testTimeoutMs?: number; // each test; default 1000
    budgetMs?: number;   // all the tests together; default 4000
};
/** Sent while tests run, so the page can keep what finished if a later test blocks the worker. */
type ProgressMsg = {
    type: 'progress';
    nonce: string;
    phase: 'registered' | 'start' | 'result';
    tests?: Array<{ idx: number; name: string }>;
    test?: { idx: number; name: string };
    result?: QueuedResult;
};

type LogLevel = 'log' | 'warn' | 'error' | 'info';
type LogEntry = { level: LogLevel; message: string; timestamp: number; stack?: string; name?: string };
type TestResult = { name: string; passed: boolean; error?: string; order?: number };
type DoneMsg = {
    type: 'done';
    nonce: string;
    entries: LogEntry[];
    results: TestResult[];
    timedOut?: boolean;
    error?: string;
};
type SandboxAsyncError = {
    message: string;
    name?: string;
    stack?: string;
    testIdx: number | null;
    testName: string | null;
    reported?: boolean;
};

// ---------- state ----------
let ACTIVE_NONCE = '';
let doneSent = false;
const logs: LogEntry[] = [];
const asyncErrors: SandboxAsyncError[] = [];
let logLimitHit = false;
let activeTestIdx: number | null = null;
let activeTestName: string | null = null;
// The runner's own clock and timers, taken before any user code runs: a task or its tests may replace them.
const now = Date.now.bind(Date);
const realSetTimeout = self.setTimeout.bind(self);
const realClearTimeout = self.clearTimeout.bind(self);
const realNow = performance.now.bind(performance);
const fakeTimers = createSandboxFakeTimers(self);
const DEFAULT_TEST_TIMEOUT_MS = 1000;
const DEFAULT_RUN_BUDGET_MS = 4000;

// ---------- limits ----------
const MAX_CODE_BYTES = 200 * 1024;     // 200 KB per payload
const MAX_FILES = 24;                  // per multi-file task
const MAX_LOGS = 200;
const MAX_LOG_CHARS = 2000;
const MAX_PREVIEW_DEPTH = 4;
const MAX_PREVIEW_KEYS = 20;
const MAX_PREVIEW_ARRAY_ITEMS = 20;

// ---------- utilities ----------
const tagOf = (v: unknown) => Object.prototype.toString.call(v);

const formatSpecial = (v: unknown): string | null => {
    if (!v) return null;
    if (typeof v !== 'object' && typeof v !== 'function') return null;

    // Promise objects stringify to "{}" but the real console shows "Promise {<pending>}".
    const tag = tagOf(v);
    if (tag === '[object Promise]') return 'Promise {<pending>}';

    if (v instanceof Error) {
        const name = (v as any).name ? String((v as any).name) : 'Error';
        const msg = (v as any).message ? String((v as any).message) : '';
        return msg ? `${name}: ${msg}` : name;
    }

    return null;
};

const safeStringify = (v: unknown) => {
    try {
        if (v === null) return 'null';

        const t = typeof v;
        if (t === 'string') {
            const s = v as string;
            return s.length > MAX_LOG_CHARS ? `${s.slice(0, MAX_LOG_CHARS)}…` : s;
        }
        if (t === 'undefined') return 'undefined';
        if (t === 'number' || t === 'boolean' || t === 'bigint') return String(v);
        if (t === 'symbol') return (v as symbol).toString();
        if (t === 'function') return `[Function ${(v as any).name || 'anonymous'}]`;

        const special = formatSpecial(v);
        if (special) return special;

        const seen = new WeakSet<object>();
        const depths = new WeakMap<object, number>();
        const json = JSON.stringify(v, function (this: any, key: string, val: any) {
            const specialInner = formatSpecial(val);
            if (specialInner) return specialInner;

            if (typeof val === 'string') {
                return val.length > MAX_LOG_CHARS ? `${val.slice(0, MAX_LOG_CHARS)}…` : val;
            }
            if (typeof val === 'symbol') return val.toString();
            if (typeof val === 'function') return `[Function ${val.name || 'anonymous'}]`;

            if (!val || (typeof val !== 'object' && typeof val !== 'function')) return val;

            const holder: any = this;
            const holderDepth =
                holder && (typeof holder === 'object' || typeof holder === 'function')
                    ? (depths.get(holder) ?? 0)
                    : 0;
            const nextDepth = key === '' ? 0 : holderDepth + 1;
            if (!depths.has(val)) depths.set(val, nextDepth);
            const depth = depths.get(val) ?? nextDepth;
            if (depth > MAX_PREVIEW_DEPTH) return tagOf(val);

            if (typeof val === 'object') {
                if (seen.has(val)) return '[Circular]';
                seen.add(val);

                if (Array.isArray(val)) {
                    if (val.length > MAX_PREVIEW_ARRAY_ITEMS) {
                        const head = val.slice(0, MAX_PREVIEW_ARRAY_ITEMS);
                        return [...head, `… +${val.length - MAX_PREVIEW_ARRAY_ITEMS} more`];
                    }
                    return val;
                }

                if (val instanceof Map) {
                    const entries: any[] = [];
                    let i = 0;
                    for (const [k, v] of val.entries()) {
                        if (i++ >= MAX_PREVIEW_KEYS) { entries.push(['…', '…']); break; }
                        entries.push([k, v]);
                    }
                    return { '[[Map]]': entries, size: val.size };
                }

                if (val instanceof Set) {
                    const values: any[] = [];
                    let i = 0;
                    for (const item of val.values()) {
                        if (i++ >= MAX_PREVIEW_KEYS) { values.push('…'); break; }
                        values.push(item);
                    }
                    return { '[[Set]]': values, size: val.size };
                }

                const proto = Object.getPrototypeOf(val);
                const isPlain = proto === Object.prototype || proto === null;
                if (isPlain) {
                    const out: Record<string, any> = {};
                    let count = 0;
                    for (const k in val as any) {
                        if (!Object.prototype.hasOwnProperty.call(val, k)) continue;
                        if (count++ >= MAX_PREVIEW_KEYS) { out['…'] = '…'; break; }
                        out[k] = (val as any)[k];
                    }
                    return out;
                }
            }
            return val;
        });

        // JSON.stringify can return undefined for unsupported top-level types; fall back.
        return typeof json === 'string' ? json : String(v);
    } catch {
        try { return String(v); } catch { return '[Unserializable]'; }
    }
};
const clamp = (s: string) => s.length > MAX_LOG_CHARS ? `${s.slice(0, MAX_LOG_CHARS)}…` : s;
const formatArgs = (args: unknown[]) => {
    let msg = '';
    for (const a of args) {
        const part = safeStringify(a);
        if (!msg) msg = part;
        else msg += ` ${part}`;
        if (msg.length > MAX_LOG_CHARS) return clamp(msg);
    }
    return clamp(msg);
};
const pushEntry = (entry: LogEntry) => {
    if (logs.length >= MAX_LOGS) {
        if (!logLimitHit) {
            logs.push({ level: 'warn', message: `Log limit reached (${MAX_LOGS})`, timestamp: now() });
            logLimitHit = true;
        }
        return;
    }
    logs.push(entry);
};

const push = (level: LogLevel, ...args: unknown[]) => {
    pushEntry({ level, message: formatArgs(args), timestamp: now() });
};

const normalizeWorkerError = (err: unknown) => {
    const normalized = normalizeError(err, { mode: 'dev' });
    const stack = normalized.stack ? stripStack(String(normalized.stack)) : undefined;
    return { ...normalized, stack };
};

const pushError = (err: unknown) => {
    const normalized = normalizeWorkerError(err);
    pushEntry({
        level: 'error',
        message: normalized.message,
        timestamp: now(),
        stack: normalized.stack,
        name: normalized.name,
    });
    return normalized.message;
};

const recordAsyncError = (err: unknown) => {
    const normalized = normalizeWorkerError(err);
    pushEntry({
        level: 'error',
        message: normalized.message,
        timestamp: now(),
        stack: normalized.stack,
        name: normalized.name,
    });
    const entry: SandboxAsyncError = {
        message: normalized.message,
        name: normalized.name,
        stack: normalized.stack,
        testIdx: activeTestIdx,
        testName: activeTestName,
    };
    asyncErrors.push(entry);
    return entry;
};

const stripStack = (s: string) =>
    s.split('\n').filter(line => !/blob:|worker_|webpack|zone\.js/i.test(line)).join('\n');

// ---------- minimize capabilities in the worker ----------
const remove = (k: string) => { try { (self as any)[k] = undefined; } catch { } };
[
    'importScripts', 'XMLHttpRequest', 'fetch', 'WebSocket', 'Worker',
    'SharedArrayBuffer', 'Atomics', 'caches', 'indexedDB',
    'FileSystemHandle', 'showDirectoryPicker', 'showOpenFilePicker', 'showSaveFilePicker'
].forEach(remove);

// best-effort hardening
// Array.prototype stays extensible for catalog polyfill drills (myMap/myReduce/myFilter).
// Each run gets a fresh worker, so those extensions do not leak between attempts.
freezeHardenedPrototypes();

// ---------- console shim & global error handlers ----------
(self as any).console = {
    log: (...a: unknown[]) => push('log', ...a),
    warn: (...a: unknown[]) => push('warn', ...a),
    error: (...a: unknown[]) => push('error', ...a),
    info: (...a: unknown[]) => push('info', ...a),
    debug: (...a: unknown[]) => push('log', ...a),
} as unknown as Console;

self.addEventListener('error', (e: ErrorEvent) => {
    try { e.preventDefault(); } catch { }
    recordAsyncError(e.error ?? e.message ?? 'Uncaught sandbox error');
});
self.addEventListener('unhandledrejection', (e: any) => {
    try { e.preventDefault?.(); } catch { }
    recordAsyncError(e?.reason ?? 'Unhandled sandbox rejection');
});

// ---------- tiny test DSL (ORDERED execution) ----------
type TestCase = { idx: number; name: string; fn: () => any };
const suiteStack: string[] = [];
const queue: TestCase[] = [];
let nextIdx = 0;

const expect = createSandboxExpect(safeStringify);
function fullName(name: string) { return [...suiteStack, name].join(' › '); }
function describe(name: string, fn: () => any) { suiteStack.push(name); try { fn(); } finally { suiteStack.pop(); } }
function test(name: string, fn: () => any) { queue.push({ idx: nextIdx++, name: fullName(name), fn }); }
function it(name: string, fn: () => any) { test(name, fn); }

const postProgress = (payload: Omit<ProgressMsg, 'type' | 'nonce'>) => {
    if (doneSent) return;
    (self as any).postMessage({ type: 'progress', nonce: ACTIVE_NONCE, ...payload } as ProgressMsg);
};

// Run queued tests sequentially; return ordered results with clean errors. A test that never settles fails on its
// own after `perTestMs`, and the next one starts: one hang no longer costs the results of the whole file.
async function runQueued(perTestMs: number, budgetMs: number): Promise<TestResult[]> {
    const asyncStartByTest = new Map<number, number>();
    const currentAsyncError = (t: QueuedTest) => asyncErrors
        .slice(asyncStartByTest.get(t.idx) ?? 0)
        .find((err) => err.testIdx === t.idx && !err.reported);
    const results: TestResult[] = await runQueue(queue, {
        perTestMs,
        budgetMs,
        now: realNow,
        setTimer: (callback, ms) => realSetTimeout(callback, ms),
        clearTimer: (handle) => realClearTimeout(handle as number),
        onStart: (t) => {
            asyncStartByTest.set(t.idx, asyncErrors.length);
            activeTestIdx = t.idx;
            activeTestName = t.name;
            postProgress({ phase: 'start', test: { idx: t.idx, name: t.name } });
        },
        finish: (t, outcome) => {
            // A test that left fake timers on must not hand them to the next one.
            fakeTimers.useRealTimers();
            activeTestIdx = null;
            activeTestName = null;
            // An error thrown from a callback names the bug better than the timeout or rejection it led to.
            const asyncError = currentAsyncError(t);
            if (asyncError) {
                asyncError.reported = true;
                return { name: t.name, passed: false, error: asyncError.message, order: t.idx };
            }
            if (outcome.timedOut) {
                const message = timedOutMessage(perTestMs);
                push('error', `${t.name}: ${message}`);
                return { name: t.name, passed: false, error: message, order: t.idx };
            }
            if (outcome.error !== undefined) {
                return { name: t.name, passed: false, error: pushError(outcome.error), order: t.idx };
            }
            return { name: t.name, passed: true, order: t.idx };
        },
        onResult: (result) => postProgress({ phase: 'result', result }),
    });
    for (const err of asyncErrors) {
        if (err.reported || err.testIdx !== null) continue;
        err.reported = true;
        results.push({
            name: err.testName || 'Unhandled sandbox async error',
            passed: false,
            error: err.message,
            order: nextIdx++,
        });
    }
    return results;
}

// ---------- messaging ----------
const sendDone = (payload: Omit<DoneMsg, 'type' | 'nonce'>) => {
    if (doneSent) return;
    doneSent = true;
    (self as any).postMessage({ type: 'done', nonce: ACTIVE_NONCE, ...payload } as DoneMsg);
    try { self.close(); } catch { }
};

const codeGuard = (label: string, code: string): string | null => {
    if (code.length > MAX_CODE_BYTES) {
        return `${label} exceeds limit (${(MAX_CODE_BYTES / 1024).toFixed(0)}KB)`;
    }
    // rudimentary guard against remote imports inside user-provided code
    const remoteImport = /import\s+(?:[^'"]+from\s*)?['"]((?:https?:)?\/\/|data:|file:|chrome:|blob:)[^'"]*['"]/i;
    const dynamicRemote = /import\s*\(\s*['"]((?:https?:)?\/\/|data:|file:|chrome:|blob:)[^'"]*['"]\s*\)/i;
    if (remoteImport.test(code) || dynamicRemote.test(code)) {
        return `${label} imports from a remote/forbidden URL`;
    }
    return null;
};

// Execute string as module (no importScripts of user code)
const runAsModule = async (code: string) => {
    const url = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
    try { await (0, eval)(`import("${url}")`); } finally { URL.revokeObjectURL(url); }
};

// A multi-file task: the same guard for every file, and a size limit for all of them together.
const filesGuard = (files: unknown): string | null => {
    if (!Array.isArray(files) || !files.length || files.length > MAX_FILES) return `A task runs 1 to ${MAX_FILES} files`;
    let total = 0;
    for (const file of files) {
        if (!file || typeof file.path !== 'string' || typeof file.code !== 'string') return 'Invalid file';
        total += file.code.length;
        const problem = codeGuard(file.path, file.code);
        if (problem) return problem;
    }
    return total > MAX_CODE_BYTES ? `The files exceed the limit (${(MAX_CODE_BYTES / 1024).toFixed(0)}KB)` : null;
};

// The tests of a multi-file task import the files; test framework imports are provided as globals instead.
const stripFrameworkImports = (code: string) =>
    code.replace(/^\s*import\s+[^;]+from\s+['"](?:jest|vitest|@jest\/globals)['"];?\s*$/gm, '');

self.onmessage = async (e: MessageEvent<RunMsg>) => {
    const {
        type, nonce, userCode, testCode, files, timeoutMs = 1500,
        testTimeoutMs = DEFAULT_TEST_TIMEOUT_MS, budgetMs = DEFAULT_RUN_BUDGET_MS,
    } = e.data || ({} as any);
    if (type !== 'run' || !nonce || typeof userCode !== 'string' || typeof testCode !== 'string') return;

    // Reset per run
    ACTIVE_NONCE = nonce;
    doneSent = false;
    logs.length = 0;
    asyncErrors.length = 0;
    queue.length = 0;
    suiteStack.length = 0;
    nextIdx = 0;
    activeTestIdx = null;
    activeTestName = null;

    // expose DSL to tests
    (self as any).describe = describe;
    (self as any).test = test;
    (self as any).expect = expect;
    (self as any).it = it;
    (self as any).useFakeTimers = fakeTimers.useFakeTimers;
    (self as any).useRealTimers = fakeTimers.useRealTimers;
    (self as any).advanceTimersByTime = fakeTimers.advanceTimersByTime;
    (self as any).advanceTimersByTimeAsync = fakeTimers.advanceTimersByTimeAsync;

    // hard reset per-run log cap
    logLimitHit = false;

    // Guard against oversized or dangerous inputs
    const guardUser = files === undefined ? codeGuard('User code', userCode) : filesGuard(files);
    const guardTests = codeGuard('Tests', testCode);
    if (guardUser || guardTests) {
        sendDone({ entries: logs, results: [], error: guardUser || guardTests || 'Invalid input' });
        return;
    }

    // This limit covers loading the code and the tests; each test then has its own (runQueued).
    let timedOut = false;
    const killer = realSetTimeout(() => {
        timedOut = true;
        push('error', `Execution timed out after ${timeoutMs}ms`);
        sendDone({ entries: logs, results: [], timedOut: true });
    }, timeoutMs);

    const moduleUrls: string[] = [];
    try {
        if (files !== undefined) {
            // Each file is a module at its own URL; importing the tests loads the files they reach.
            const linkedTests = linkModules(files, stripFrameworkImports(testCode), (code) => {
                const url = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
                moduleUrls.push(url);
                return url;
            });
            await runAsModule(linkedTests);
        } else {
            await runAsModule(userCode);   // user solution (sets global)
            if (!timedOut) await runAsModule(testCode); // test file (queues tests)
        }
        if (!timedOut) {
            realClearTimeout(killer);
            postProgress({ phase: 'registered', tests: queue.map(({ idx, name }) => ({ idx, name })) });
            const ordered = await runQueued(testTimeoutMs, budgetMs); // run in definition order
            sendDone({ entries: logs, results: ordered });
        }
    } catch (err: any) {
        if (!timedOut) {
            const msg = pushError(err);
            sendDone({ entries: logs, results: [], error: msg });
        }
    } finally {
        realClearTimeout(killer);
        for (const url of moduleUrls) URL.revokeObjectURL(url);
    }
};
