/// <reference lib="webworker" />

import { normalizeError } from '../utils/console-normalize';

// ---------- message contracts ----------
type RunMsg = {
    type: 'run';
    nonce: string;
    userCode: string;    // transformed to set globalThis[globalName]
    testCode: string;    // transformed to reference that global
    timeoutMs?: number;  // default 1500
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

function matchObject(actual: any, expected: any): boolean {
    if (Object.is(actual, expected)) return true;
    if (expected === null || expected === undefined) return Object.is(actual, expected);
    if (typeof expected !== 'object') return Object.is(actual, expected);
    if (typeof actual !== 'object' || actual === null) return false;
    for (const k of Object.keys(expected)) {
        if (!matchObject(actual[k], expected[k])) return false;
    }
    return true;
}

function expect(received: any) {
    const makeAsync = (mode: 'resolves' | 'rejects') => {
        const run = async (cb: (value: any) => void | Promise<void>) => {
            try {
                const value = await Promise.resolve(received);
                if (mode === 'rejects') throw new Error('Expected promise to reject');
                await cb(value);
            } catch (err: any) {
                if (mode === 'resolves') {
                    const msg = err?.message ? String(err.message) : 'Expected promise to resolve';
                    throw new Error(msg);
                }
                await cb(err);
            }
        };
        return {
            toBe: (expected: any) => run((v) => expect(v).toBe(expected)),
            toEqual: (expected: any) => run((v) => expect(v).toEqual(expected)),
            toBeNaN: () => run((v) => expect(v).toBeNaN()),
            toBeCloseTo: (expected: number, precision?: number) =>
                run((v) => expect(v).toBeCloseTo(expected, precision)),
            toMatchObject: (expected: any) => run((v) => expect(v).toMatchObject(expected)),
            toThrow: () => run((v) => expect(() => { throw v; }).toThrow()),
        };
    };

    return {
        toBe(expected: any) {
            if (!Object.is(received, expected))
                throw new Error(`Expected ${safeStringify(received)} to be ${safeStringify(expected)}`);
        },
        toBeTruthy() {
            if (!received) throw new Error(`Expected ${safeStringify(received)} to be truthy`);
        },
        toBeFalsy() {
            if (received) throw new Error(`Expected ${safeStringify(received)} to be falsy`);
        },
        toEqual(expected: any) {
            if (!deepEqual(received, expected))
                throw new Error(`Expected ${safeStringify(received)} to deeply equal ${safeStringify(expected)}`);
        },
        toMatchObject(expected: any) {
            if (!matchObject(received, expected))
                throw new Error(`Expected ${safeStringify(received)} to match ${safeStringify(expected)}`);
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
        resolves: makeAsync('resolves'),
        rejects: makeAsync('rejects'),
    };
}

function fullName(name: string) { return [...suiteStack, name].join(' › '); }
function describe(name: string, fn: () => any) { suiteStack.push(name); try { fn(); } finally { suiteStack.pop(); } }
function test(name: string, fn: () => any) { queue.push({ idx: nextIdx++, name: fullName(name), fn }); }
function it(name: string, fn: () => any) { test(name, fn); }

// Run queued tests sequentially; return ordered results with clean errors
async function runQueued(): Promise<TestResult[]> {
    const results: TestResult[] = [];
    for (const t of queue) {
        try {
            const maybe = t.fn();
            if (maybe && typeof (maybe as any).then === 'function') await (maybe as any);
            results.push({ name: t.name, passed: true, order: t.idx });
        } catch (e: any) {
            const msg = pushError(e);
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
    (self as any).it = it;

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
            const msg = pushError(err);
            sendDone({ entries: logs, results: [], error: msg });
        }
    } finally {
        clearTimeout(killer);
    }
};
