/// <reference lib="webworker" />

// ---------- message contracts ----------
type RunMsg = {
    type: 'run';
    nonce: string;
    userCode: string;    // transformed to set globalThis[globalName]
    testCode: string;    // transformed to reference that global
    timeoutMs?: number;  // default 1500
};

type LogLevel = 'log' | 'warn' | 'error' | 'info';
type LogEntry = { level: LogLevel; message: string; timestamp: number };
type TestResult = { name: string; passed: boolean; error?: string; order?: number };
type DoneMsg = {
    type: 'done';
    nonce: string;
    entries: LogEntry[];
    results: TestResult[];
    timedOut?: boolean;
    error?: string;
};

// ---------- state ----------
let ACTIVE_NONCE = '';
let doneSent = false;
const logs: LogEntry[] = [];
let logLimitHit = false;
const now = () => Date.now();

// ---------- limits ----------
const MAX_CODE_BYTES = 200 * 1024;     // 200 KB per payload
const MAX_LOGS = 200;
const MAX_LOG_CHARS = 2000;

// ---------- utilities ----------
const safeStringify = (v: unknown) => {
    try {
        if (typeof v === 'string') return v;
        const seen = new WeakSet();
        return JSON.stringify(v, (k, val) => {
            if (typeof val === 'object' && val !== null) {
                if (seen.has(val)) return '[Circular]';
                seen.add(val);
            }
            if (typeof val === 'function') return `[Function ${val.name || 'anonymous'}]`;
            return val;
        });
    } catch {
        try { return String(v); } catch { return '[Unserializable]'; }
    }
};
const clamp = (s: string) => s.length > MAX_LOG_CHARS ? `${s.slice(0, MAX_LOG_CHARS)}…` : s;
const push = (level: LogLevel, ...args: unknown[]) => {
    if (logs.length >= MAX_LOGS) {
        if (!logLimitHit) {
            logs.push({ level: 'warn', message: `Log limit reached (${MAX_LOGS})`, timestamp: now() });
            logLimitHit = true;
        }
        return;
    }
    logs.push({ level, message: clamp(args.map(safeStringify).join(' ')), timestamp: now() });
};

const cleanErrorMessage = (e: any) =>
    e?.message ? String(e.message) : String(e);

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
[
    Object, Array, Map, Set, Date, RegExp, Error, Math, JSON, Promise, URL, URLSearchParams
].forEach((ctor: any) => { try { Object.freeze(ctor.prototype); } catch { } });

// ---------- console shim & global error handlers ----------
(self as any).console = {
    log: (...a: unknown[]) => push('log', ...a),
    warn: (...a: unknown[]) => push('warn', ...a),
    error: (...a: unknown[]) => push('error', ...a),
    info: (...a: unknown[]) => push('info', ...a),
    debug: (...a: unknown[]) => push('log', ...a),
} as unknown as Console;

self.addEventListener('error', (e) => push('error', `Uncaught: ${e.message}`));
self.addEventListener('unhandledrejection', (e: any) =>
    push('error', `Unhandled rejection: ${safeStringify(e?.reason)}`));

// ---------- tiny test DSL (ORDERED execution) ----------
type TestCase = { idx: number; name: string; fn: () => any };
const suiteStack: string[] = [];
const queue: TestCase[] = [];
let nextIdx = 0;

function deepEqual(a: any, b: any): boolean {
    if (Object.is(a, b)) return true;
    if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) return false;
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    const ak = Object.keys(a), bk = Object.keys(b);
    if (ak.length !== bk.length) return false;
    for (const k of ak) if (!deepEqual(a[k], b[k])) return false;
    return true;
}

function expect(received: any) {
    return {
        toBe(expected: any) {
            if (!Object.is(received, expected))
                throw new Error(`Expected ${safeStringify(received)} to be ${safeStringify(expected)}`);
        },
        toEqual(expected: any) {
            if (!deepEqual(received, expected))
                throw new Error(`Expected ${safeStringify(received)} to deeply equal ${safeStringify(expected)}`);
        },
        toBeNaN() {
            if (!Number.isNaN(received)) throw new Error(`Expected ${safeStringify(received)} to be NaN`);
        },
        toBeCloseTo(expected: number, precision = 2) {
            const diff = Math.abs(Number(received) - Number(expected));
            const thr = Math.pow(10, -precision) / 2;
            if (!(Number.isFinite(diff) && diff <= thr))
                throw new Error(`Expected ${safeStringify(received)} to be close to ${safeStringify(expected)} (±${thr})`);
        },
        toThrow() {
            if (typeof received !== 'function') throw new Error('toThrow expects a function');
            let threw = false; try { received(); } catch { threw = true; }
            if (!threw) throw new Error('Expected function to throw');
        },
    };
}

function fullName(name: string) { return [...suiteStack, name].join(' › '); }
function describe(name: string, fn: () => any) { suiteStack.push(name); try { fn(); } finally { suiteStack.pop(); } }
function test(name: string, fn: () => any) { queue.push({ idx: nextIdx++, name: fullName(name), fn }); }

// Run queued tests sequentially; return ordered results with clean errors
async function runQueued(): Promise<TestResult[]> {
    const results: TestResult[] = [];
    for (const t of queue) {
        try {
            const maybe = t.fn();
            if (maybe && typeof (maybe as any).then === 'function') await (maybe as any);
            results.push({ name: t.name, passed: true, order: t.idx });
        } catch (e: any) {
            const msg = cleanErrorMessage(e);
            if (e?.stack) push('error', 'Stack:', stripStack(String(e.stack)));
            results.push({ name: t.name, passed: false, error: msg, order: t.idx });
        }
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

self.onmessage = async (e: MessageEvent<RunMsg>) => {
    const { type, nonce, userCode, testCode, timeoutMs = 1500 } = e.data || ({} as any);
    if (type !== 'run' || !nonce || typeof userCode !== 'string' || typeof testCode !== 'string') return;

    // Reset per run
    ACTIVE_NONCE = nonce;
    doneSent = false;
    logs.length = 0;
    queue.length = 0;
    suiteStack.length = 0;
    nextIdx = 0;

    // expose DSL to tests
    (self as any).describe = describe;
    (self as any).test = test;
    (self as any).expect = expect;

    // hard reset per-run log cap
    logLimitHit = false;

    // Guard against oversized or dangerous inputs
    const guardUser = codeGuard('User code', userCode);
    const guardTests = codeGuard('Tests', testCode);
    if (guardUser || guardTests) {
        sendDone({ entries: logs, results: [], error: guardUser || guardTests || 'Invalid input' });
        return;
    }

    let timedOut = false;
    const killer = setTimeout(() => {
        timedOut = true;
        push('error', `Execution timed out after ${timeoutMs}ms`);
        sendDone({ entries: logs, results: [], timedOut: true });
    }, timeoutMs);

    try {
        await runAsModule(userCode);   // user solution (sets global)
        if (!timedOut) await runAsModule(testCode); // test file (queues tests)
        if (!timedOut) {
            const ordered = await runQueued();        // run in definition order
            sendDone({ entries: logs, results: ordered });
        }
    } catch (err: any) {
        if (!timedOut) {
            const msg = cleanErrorMessage(err);
            if (err?.stack) push('error', 'Stack:', stripStack(String(err.stack)));
            sendDone({ entries: logs, results: [], error: msg });
        }
    } finally {
        clearTimeout(killer);
    }
};
