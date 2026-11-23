import type { FrameworkTest, FrameworkTestLocator, FrameworkTestStep } from '../../../core/models/question.model';
import type { TestResult } from '../console-logger/console-logger.component';

const OPAQUE_CHECK_CHANNEL = 'FA_OPAQUE_CHECK';
const OPAQUE_CHECK_VERSION = 2;
const DEFAULT_FRAMEWORK_READY_TIMEOUT_MS = 8_000;
const DEFAULT_WEB_READY_TIMEOUT_MS = 4_000;
const DEFAULT_CHECK_TIMEOUT_MS = 10_000;
const MAX_WEB_READY_ATTEMPTS = 4;
const MIN_WEB_READY_ATTEMPT_MS = 2_000;
const MAX_ERROR_LENGTH = 4_000;

type OpaqueCheckKind = 'framework' | 'web';
type PreviewLifecycleState = 'render-ready' | 'compile-error' | 'boot-error' | 'runtime-error';
type TestFailureKind = NonNullable<TestResult['failureKind']>;

type ChildConfig = {
  invocationId: string;
  frameId: string;
  kind: OpaqueCheckKind;
  check?: FrameworkTest;
  testCode?: string;
};

type ActiveRun = {
  controller: AbortController;
  invocationId: string;
};

export class OpaqueCheckCancelledError extends Error {
  constructor(message = 'Opaque DOM check was cancelled') {
    super(message);
    this.name = 'OpaqueCheckCancelledError';
  }
}

export class OpaquePreviewReadyTimeoutError extends Error {
  readonly failureKind: TestFailureKind = 'infrastructure-timeout';

  constructor(kind: 'framework' | 'web') {
    super(kind === 'framework'
      ? 'Framework check sandbox timed out waiting for preview render readiness'
      : 'Web check sandbox timed out waiting for preview document readiness');
    this.name = 'OpaquePreviewReadyTimeoutError';
  }
}

export class OpaquePreviewLifecycleError extends Error {
  constructor(
    readonly failureKind: Extract<TestFailureKind, 'compilation' | 'preview-boot' | 'preview-runtime'>,
    message: string,
  ) {
    super(message);
    this.name = 'OpaquePreviewLifecycleError';
  }
}

export class OpaqueCheckExecutionTimeoutError extends Error {
  readonly failureKind: TestFailureKind = 'assertion-timeout';

  constructor(kind: 'framework' | 'web') {
    super(kind === 'framework'
      ? 'Framework assertion execution timed out'
      : 'Web assertion execution timed out');
    this.name = 'OpaqueCheckExecutionTimeoutError';
  }
}

export class OpaqueDomCheckRunner {
  private activeRun: ActiveRun | null = null;

  async runFramework(
    html: string,
    checks: FrameworkTest[],
    options: { readyTimeoutMs?: number; checkTimeoutMs?: number } = {},
  ): Promise<TestResult[]> {
    const active = this.beginRun();
    const results: TestResult[] = [];

    try {
      for (const [checkIndex, check] of checks.entries()) {
        if (active.controller.signal.aborted) throw new OpaqueCheckCancelledError();
        try {
          const checkResults = await this.runFrame({
            html,
            config: {
              invocationId: active.invocationId,
              frameId: this.createId(),
              kind: 'framework',
              check,
            },
            signal: active.controller.signal,
            readyTimeoutMs: options.readyTimeoutMs ?? DEFAULT_FRAMEWORK_READY_TIMEOUT_MS,
            checkTimeoutMs: options.checkTimeoutMs ?? DEFAULT_CHECK_TIMEOUT_MS,
          });
          results.push(checkResults[0] || {
            name: check.name || check.id || 'Framework check',
            passed: false,
            error: 'Framework check returned no result',
            failureKind: 'preview-boot',
          });
        } catch (error) {
          if (error instanceof OpaqueCheckCancelledError) throw error;
          if (error instanceof OpaqueCheckExecutionTimeoutError) {
            // Assertion execution is isolated to this named check. A fresh
            // iframe may still run the remaining checks successfully.
            results.push(this.failureResult(check, error));
            continue;
          }
          // Lifecycle and runner timeouts are preview-wide. Starting another
          // identical frame would only repeat the same infrastructure failure.
          for (const remaining of checks.slice(checkIndex)) {
            results.push(this.failureResult(remaining, error));
          }
          break;
        }
      }
      return results;
    } finally {
      if (this.activeRun === active) this.activeRun = null;
    }
  }

  async runWeb(
    html: string,
    testCode: string,
    options: { readyTimeoutMs?: number; checkTimeoutMs?: number } = {},
  ): Promise<TestResult[]> {
    const active = this.beginRun();
    const readyAttemptTimeouts = this.webReadyAttemptTimeouts(
      options.readyTimeoutMs ?? DEFAULT_WEB_READY_TIMEOUT_MS,
    );

    try {
      let lastReadyError: unknown;
      for (const [attempt, readyTimeoutMs] of readyAttemptTimeouts.entries()) {
        try {
          return await this.runFrame({
            html,
            config: {
              invocationId: active.invocationId,
              frameId: this.createId(),
              kind: 'web',
              testCode,
            },
            signal: active.controller.signal,
            readyTimeoutMs,
            checkTimeoutMs: options.checkTimeoutMs ?? DEFAULT_CHECK_TIMEOUT_MS,
          });
        } catch (error) {
          if (error instanceof OpaqueCheckCancelledError) throw error;
          lastReadyError = error;
          const hasAnotherAttempt = attempt < readyAttemptTimeouts.length - 1;
          if (!(error instanceof OpaquePreviewReadyTimeoutError) || !hasAnotherAttempt) throw error;
        }
      }
      throw lastReadyError;
    } catch (error) {
      if (error instanceof OpaqueCheckCancelledError) throw error;
      return [{
        name: 'Failed to execute test file',
        passed: false,
        error: this.errorMessage(error, 'Web checks failed'),
        failureKind: this.failureKind(error),
      }];
    } finally {
      if (this.activeRun === active) this.activeRun = null;
    }
  }

  cancel(): void {
    const active = this.activeRun;
    this.activeRun = null;
    active?.controller.abort();
  }

  destroy(): void {
    this.cancel();
  }

  private beginRun(): ActiveRun {
    this.cancel();
    const active = { controller: new AbortController(), invocationId: this.createId() };
    this.activeRun = active;
    return active;
  }

  private webReadyAttemptTimeouts(totalTimeoutMs: number): number[] {
    const total = Math.max(1, Math.floor(totalTimeoutMs));
    const attemptCount = Math.min(
      MAX_WEB_READY_ATTEMPTS,
      Math.max(1, Math.floor(total / MIN_WEB_READY_ATTEMPT_MS)),
    );
    if (attemptCount === 1) return [total];
    const baseTimeout = Math.floor(total / attemptCount);
    const remainder = total % attemptCount;
    return Array.from(
      { length: attemptCount },
      (_unused, index) => baseTimeout + (index < remainder ? 1 : 0),
    );
  }

  private runFrame(options: {
    html: string;
    config: ChildConfig;
    signal: AbortSignal;
    readyTimeoutMs: number;
    checkTimeoutMs: number;
  }): Promise<TestResult[]> {
    const { html, config, signal } = options;
    const frame = document.createElement('iframe');
    frame.setAttribute('sandbox', 'allow-scripts');
    frame.setAttribute('aria-hidden', 'true');
    frame.style.cssText = 'position:fixed;left:-10000px;top:0;width:1px;height:1px;border:0;opacity:0;pointer-events:none;';

    return new Promise<TestResult[]>((resolve, reject) => {
      let settled = false;
      let ready = false;
      let readyTimer: number | undefined;
      let checkTimer: number | undefined;

      const cleanup = () => {
        window.removeEventListener('message', onMessage);
        signal.removeEventListener('abort', onAbort);
        if (readyTimer !== undefined) window.clearTimeout(readyTimer);
        if (checkTimer !== undefined) window.clearTimeout(checkTimer);
        try { frame.remove(); } catch { }
      };

      const finish = (results: TestResult[]) => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(results);
      };

      const fail = (error: Error) => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(error);
      };

      const onAbort = () => fail(new OpaqueCheckCancelledError());

      const onMessage = (event: MessageEvent) => {
        if (event.source !== frame.contentWindow) return;
        const payload = event.data as {
          channel?: unknown;
          version?: unknown;
          invocationId?: unknown;
          frameId?: unknown;
          kind?: unknown;
          state?: unknown;
          error?: unknown;
          results?: unknown;
        } | null;
        if (!payload
          || payload.channel !== OPAQUE_CHECK_CHANNEL
          || payload.version !== OPAQUE_CHECK_VERSION
          || payload.invocationId !== config.invocationId
          || payload.frameId !== config.frameId) return;

        if (payload.kind === 'lifecycle') {
          const state = payload.state as PreviewLifecycleState;
          if (state === 'render-ready') {
            if (ready) return;
            ready = true;
            if (readyTimer !== undefined) window.clearTimeout(readyTimer);
            checkTimer = window.setTimeout(() => {
              fail(new OpaqueCheckExecutionTimeoutError(config.kind));
            }, Math.max(1, options.checkTimeoutMs));
            return;
          }
          if (state === 'compile-error' || state === 'boot-error' || state === 'runtime-error') {
            fail(this.lifecycleError(state, payload.error, ready));
          }
          return;
        }

        if (payload.kind !== config.kind || !Array.isArray(payload.results)) return;
        finish(this.normalizeResults(payload.results));
      };

      window.addEventListener('message', onMessage);
      signal.addEventListener('abort', onAbort, { once: true });
      readyTimer = window.setTimeout(() => {
        fail(new OpaquePreviewReadyTimeoutError(config.kind));
      }, Math.max(1, options.readyTimeoutMs));

      if (signal.aborted) {
        onAbort();
        return;
      }

      document.body.appendChild(frame);
      // Start srcdoc navigation only after the frame is connected. Chromium can
      // defer a detached, non-rendered frame under load and never run its boot script.
      frame.srcdoc = this.injectBootstrap(html, config);
    });
  }

  private normalizeResults(raw: unknown[]): TestResult[] {
    return raw.map((item, index) => {
      const result = item && typeof item === 'object' ? item as Record<string, unknown> : {};
      const normalized: TestResult = {
        name: String(result['name'] || `Check ${index + 1}`),
        passed: result['passed'] === true,
      };
      if (result['error'] !== undefined && result['error'] !== null) {
        normalized.error = String(result['error']).slice(0, MAX_ERROR_LENGTH);
      }
      const failureKind = result['failureKind'];
      if (!normalized.passed && this.isFailureKind(failureKind)) {
        normalized.failureKind = failureKind;
      }
      return normalized;
    });
  }

  private injectBootstrap(html: string, config: ChildConfig): string {
    const serialized = JSON.stringify(config)
      .replace(/&/g, '\\u0026')
      .replace(/</g, '\\u003c')
      .replace(/>/g, '\\u003e')
      .replace(/\u2028/g, '\\u2028')
      .replace(/\u2029/g, '\\u2029');
    const bootstrap = `<script>(${opaqueChildBootstrap.toString()})(${serialized});<\/script>`;
    const source = String(html || '');
    if (/<head[^>]*>/i.test(source)) {
      return source.replace(/<head[^>]*>/i, `$&\n${bootstrap}`);
    }
    if (/<html[^>]*>/i.test(source)) {
      return source.replace(/<html[^>]*>/i, `$&\n<head>${bootstrap}</head>`);
    }
    return `${bootstrap}\n${source}`;
  }

  private createId(): string {
    const values = new Uint32Array(4);
    globalThis.crypto.getRandomValues(values);
    return Array.from(values, (value) => value.toString(16).padStart(8, '0')).join('');
  }

  private errorMessage(error: unknown, fallback: string): string {
    const message = error instanceof Error ? error.message : String(error || fallback);
    return (message || fallback).slice(0, MAX_ERROR_LENGTH);
  }

  private failureResult(check: FrameworkTest, error: unknown): TestResult {
    return {
      name: check.name || check.id || 'Framework check',
      passed: false,
      error: this.errorMessage(error, 'Framework checks failed'),
      failureKind: this.failureKind(error),
    };
  }

  private failureKind(error: unknown): TestFailureKind {
    if (error instanceof OpaquePreviewLifecycleError
      || error instanceof OpaquePreviewReadyTimeoutError
      || error instanceof OpaqueCheckExecutionTimeoutError) {
      return error.failureKind;
    }
    return 'preview-boot';
  }

  private lifecycleError(
    state: Exclude<PreviewLifecycleState, 'render-ready'>,
    detail: unknown,
    afterRender = false,
  ): OpaquePreviewLifecycleError {
    const message = this.sanitizeLifecycleError(detail);
    if (state === 'runtime-error' && afterRender) {
      return new OpaquePreviewLifecycleError(
        'preview-runtime',
        `Your code threw an error while the checks ran${message ? `: ${message}` : ''}`,
      );
    }
    if (state === 'compile-error') {
      return new OpaquePreviewLifecycleError('compilation', `Preview compilation failed${message ? `: ${message}` : ''}`);
    }
    if (state === 'boot-error') {
      return new OpaquePreviewLifecycleError('preview-boot', `Preview failed to boot${message ? `: ${message}` : ''}`);
    }
    return new OpaquePreviewLifecycleError('preview-runtime', `Preview failed during render${message ? `: ${message}` : ''}`);
  }

  private sanitizeLifecycleError(value: unknown): string {
    const firstLine = String(value || '').split(/\r?\n/, 1)[0].trim();
    return firstLine.replace(/[<>]/g, '').slice(0, 500);
  }

  private isFailureKind(value: unknown): value is TestFailureKind {
    return value === 'assertion'
      || value === 'compilation'
      || value === 'preview-boot'
      || value === 'preview-runtime'
      || value === 'infrastructure-timeout'
      || value === 'assertion-timeout';
  }
}

/** Runs inside a sandboxed opaque-origin iframe. Keep this function self-contained. */
function opaqueChildBootstrap(config: ChildConfig): void {
  // A check with a mockRandom step fixes Math.random before the app's own scripts run, so content placed at random
  // (a snake's food) lands where the check expects it. The values repeat in turn.
  const randomStep = (config.check?.steps || []).find((step) => String(step?.type || step?.action || '') === 'mockRandom');
  const randomValues = (Array.isArray(randomStep?.values) ? randomStep!.values : [])
    .map(Number)
    .filter((value) => Number.isFinite(value) && value >= 0 && value < 1);
  if (randomValues.length) {
    let nextRandom = 0;
    Math.random = () => randomValues[nextRandom++ % randomValues.length];
  }
  // The sandboxed frame has no storage of its own (localStorage throws), so each check gets fresh in-memory
  // localStorage and sessionStorage, which a mockStorage step fills before the app's own scripts run.
  const memoryStorage = (entries: Record<string, unknown>) => {
    const items = new Map(Object.entries(entries).map(([key, value]) => [key, String(value)]));
    return {
      get length() { return items.size; },
      key: (index: number) => Array.from(items.keys())[index] ?? null,
      getItem: (key: string) => items.get(String(key)) ?? null,
      setItem: (key: string, value: unknown) => { items.set(String(key), String(value)); },
      removeItem: (key: string) => { items.delete(String(key)); },
      clear: () => { items.clear(); },
    } as Storage;
  };
  const storageStep = (config.check?.steps || []).find((step) => String(step?.type || step?.action || '') === 'mockStorage');
  const pageStorage = memoryStorage(storageStep?.entries && typeof storageStep.entries === 'object' ? storageStep.entries : {});
  for (const [name, storage] of [['localStorage', pageStorage], ['sessionStorage', memoryStorage({})]] as const) {
    try { Object.defineProperty(window, name, { configurable: true, get: () => storage }); } catch { }
  }
  const channel = 'FA_OPAQUE_CHECK';
  const version = 2;
  const maxErrorLength = 4000;
  const parentWindow = window.parent;
  const parentPostMessage = parentWindow.postMessage.bind(parentWindow);
  const nativeSetTimeout = window.setTimeout.bind(window);
  const nativeClearTimeout = window.clearTimeout.bind(window);
  const nativeNow = Date.now.bind(Date);
  let started = false;
  let lifecycleFailed = false;
  let lastRequestedFocus: Element | null = null;
  const httpCalls: Array<{ method: string; url: string; body: string }> = [];
  let httpMock = {
    status: 200,
    delayMs: 0,
    error: '',
  };
  let httpMockInstalled = false;
  const httpMockDiagnostics = { constructed: 0, opened: 0, sent: 0 };

  const configureHttpMock = (step: FrameworkTestStep) => {
    const rawStatus = Number(step.status ?? 200);
    const rawDelay = Number(step.durationMs ?? 0);
    httpMock = {
      status: Number.isFinite(rawStatus) ? Math.max(100, Math.min(599, rawStatus)) : 200,
      delayMs: Number.isFinite(rawDelay) ? Math.max(0, rawDelay) : 0,
      error: String(step.error || ''),
    };
  };
  const installHttpMock = (step: FrameworkTestStep) => {
    configureHttpMock(step);
    if (httpMockInstalled) return;
    httpMockInstalled = true;

    const mockFetch = ((input: RequestInfo | URL, init?: RequestInit) => {
      const request = typeof Request !== 'undefined' && input instanceof Request ? input : null;
      const method = String(init?.method || request?.method || 'GET').toUpperCase();
      const url = String(request?.url || input);
      const body = typeof init?.body === 'string' ? init.body : String(init?.body || '');
      const signal = init?.signal ?? request?.signal ?? null;
      const abortReason = () => signal?.reason ?? new DOMException('The operation was aborted.', 'AbortError');
      // Like the real fetch, an already aborted signal sends nothing.
      if (signal?.aborted) return Promise.reject(abortReason());
      httpCalls.push({ method, url, body });
      return new Promise<Response>((resolve, reject) => {
        const onAbort = () => {
          nativeClearTimeout(timer);
          reject(abortReason());
        };
        const timer = nativeSetTimeout(() => {
          signal?.removeEventListener('abort', onAbort);
          if (httpMock.error) {
            reject(new TypeError(httpMock.error));
            return;
          }
          resolve(new Response('{"id":1}', {
            status: httpMock.status,
            headers: { 'Content-Type': 'application/json' },
          }));
        }, httpMock.delayMs);
        signal?.addEventListener('abort', onAbort, { once: true });
      });
    }) as typeof window.fetch;
    Object.defineProperty(window, 'fetch', {
      value: mockFetch,
      writable: false,
      configurable: true,
    });

    class MockXMLHttpRequest extends EventTarget {
      static readonly UNSENT = 0;
      static readonly OPENED = 1;
      static readonly HEADERS_RECEIVED = 2;
      static readonly LOADING = 3;
      static readonly DONE = 4;
      readonly UNSENT = 0;
      readonly OPENED = 1;
      readonly HEADERS_RECEIVED = 2;
      readonly LOADING = 3;
      readonly DONE = 4;
      readyState = 0;
      response: unknown = null;
      responseText = '';
      responseType: XMLHttpRequestResponseType = '';
      responseURL = '';
      responseXML: Document | null = null;
      status = 0;
      statusText = '';
      timeout = 0;
      upload = new EventTarget();
      withCredentials = false;
      onabort: ((this: XMLHttpRequest, ev: ProgressEvent<EventTarget>) => unknown) | null = null;
      onerror: ((this: XMLHttpRequest, ev: ProgressEvent<EventTarget>) => unknown) | null = null;
      onload: ((this: XMLHttpRequest, ev: ProgressEvent<EventTarget>) => unknown) | null = null;
      onloadend: ((this: XMLHttpRequest, ev: ProgressEvent<EventTarget>) => unknown) | null = null;
      onloadstart: ((this: XMLHttpRequest, ev: ProgressEvent<EventTarget>) => unknown) | null = null;
      onprogress: ((this: XMLHttpRequest, ev: ProgressEvent<EventTarget>) => unknown) | null = null;
      onreadystatechange: ((this: XMLHttpRequest, ev: Event) => unknown) | null = null;
      ontimeout: ((this: XMLHttpRequest, ev: ProgressEvent<EventTarget>) => unknown) | null = null;
      private method = 'GET';
      private url = '';
      private timer: number | undefined;

      constructor() {
        super();
        httpMockDiagnostics.constructed += 1;
      }

      open(method: string, url: string | URL): void {
        httpMockDiagnostics.opened += 1;
        this.method = String(method || 'GET').toUpperCase();
        this.url = String(url);
        this.responseURL = this.url;
        this.readyState = this.OPENED;
        this.dispatchEvent(new Event('readystatechange'));
      }

      send(body?: Document | XMLHttpRequestBodyInit | null): void {
        httpMockDiagnostics.sent += 1;
        const serializedBody = typeof body === 'string' ? body : String(body || '');
        httpCalls.push({ method: this.method, url: this.url, body: serializedBody });
        this.timer = nativeSetTimeout(() => {
          this.timer = undefined;
          this.readyState = this.DONE;
          if (httpMock.error) {
            this.status = 0;
            this.dispatchEvent(new ProgressEvent('error'));
            this.dispatchEvent(new ProgressEvent('loadend'));
            return;
          }
          this.status = httpMock.status;
          this.statusText = httpMock.status >= 200 && httpMock.status < 300 ? 'OK' : 'Error';
          this.responseText = '{"id":1}';
          this.response = this.responseType === 'json' ? { id: 1 } : this.responseText;
          this.dispatchEvent(new Event('readystatechange'));
          this.dispatchEvent(new ProgressEvent('load'));
          this.dispatchEvent(new ProgressEvent('loadend'));
        }, httpMock.delayMs);
      }

      abort(): void {
        if (this.timer !== undefined) nativeClearTimeout(this.timer);
        this.timer = undefined;
        this.readyState = this.UNSENT;
        this.dispatchEvent(new ProgressEvent('abort'));
        this.dispatchEvent(new ProgressEvent('loadend'));
      }

      setRequestHeader(): void { }
      overrideMimeType(): void { }
      getAllResponseHeaders(): string {
        return this.status ? 'content-type: application/json\r\n' : '';
      }
      getResponseHeader(name: string): string | null {
        return this.status && name.toLowerCase() === 'content-type' ? 'application/json' : null;
      }
    }

    Object.defineProperty(window, 'XMLHttpRequest', {
      value: MockXMLHttpRequest,
      writable: false,
      configurable: true,
    });
  };

  const bootstrapHttpMock = config.check?.steps.find(
    (step) => String(step?.type || step?.action || '') === 'mockHttp',
  );
  if (bootstrapHttpMock) {
    (window as Window & {
      __FA_PREPARE_ANGULAR_HTTP_CHECK?: (
        httpClient: { prototype: { post?: (...args: unknown[]) => unknown } },
        observable: new (subscribe: (subscriber: {
          next(value: unknown): void;
          error(error: unknown): void;
          complete(): void;
        }) => (() => void) | void) => unknown,
      ) => void;
    }).__FA_PREPARE_ANGULAR_HTTP_CHECK = (HttpClient, Observable) => {
      installHttpMock(bootstrapHttpMock);
      HttpClient.prototype.post = function post(url: unknown, body: unknown): unknown {
        return new Observable((subscriber) => {
          let serializedBody = '';
          try { serializedBody = typeof body === 'string' ? body : JSON.stringify(body ?? ''); }
          catch { serializedBody = String(body ?? ''); }
          httpCalls.push({ method: 'POST', url: String(url || ''), body: serializedBody });
          // Use the framework-visible timer so Angular's Zone triggers change
          // detection after success/error callbacks update template state.
          const timer = window.setTimeout(() => {
            if (httpMock.error) {
              subscriber.error(new Error(httpMock.error));
              return;
            }
            if (httpMock.status < 200 || httpMock.status >= 300) {
              subscriber.error(new Error(`HTTP ${httpMock.status}`));
              return;
            }
            subscriber.next({ id: 1 });
            subscriber.complete();
          }, httpMock.delayMs);
          return () => window.clearTimeout(timer);
        });
      };
    };
  }

  // Backgrounded and non-rendered sandbox frames may reject native focus even
  // though the application made the correct focus request. Track focus/blur
  // calls inside the opaque document so structured checks remain deterministic.
  // A request a browser always ignores, on a disabled control or inside an
  // inert element, does not count.
  const nativeFocus = HTMLElement.prototype.focus;
  const nativeBlur = HTMLElement.prototype.blur;
  HTMLElement.prototype.focus = function focus(options?: FocusOptions): void {
    const ignored = (this as HTMLElement & { disabled?: boolean }).disabled === true || !!this.closest('[inert]');
    if (!ignored) lastRequestedFocus = this;
    if (options === undefined) nativeFocus.call(this);
    else nativeFocus.call(this, options);
  };
  HTMLElement.prototype.blur = function blur(): void {
    if (lastRequestedFocus === this) lastRequestedFocus = null;
    nativeBlur.call(this);
  };
  /** Where focus is: the active element, or the last focus request when the frame did not honour native focus. */
  const focusedElement = (): Element => {
    const active = document.activeElement;
    if (active && active !== document.body) return active;
    return lastRequestedFocus?.isConnected ? lastRequestedFocus : document.body;
  };

  const errorMessage = (error: unknown, fallback: string) => {
    const value = error instanceof Error ? error.message : String(error || fallback);
    return (value || fallback).slice(0, maxErrorLength);
  };
  const send = (kind: string, results: TestResult[]) => {
    const safeResults = results.map((result) => {
      const safeResult: TestResult = {
        name: String(result?.name || 'Check'),
        passed: result?.passed === true,
      };
      if (result?.error != null) safeResult.error = String(result.error).slice(0, maxErrorLength);
      if (result?.failureKind) safeResult.failureKind = result.failureKind;
      return safeResult;
    });
    parentPostMessage({
      channel,
      version,
      invocationId: config.invocationId,
      frameId: config.frameId,
      kind,
      results: safeResults,
    }, '*');
  };
  const sanitizeLifecycleError = (value: unknown, fallback: string) => {
    const message = value instanceof Error ? value.message : String(value || fallback);
    return (message || fallback).split(/\r?\n/, 1)[0].replace(/[<>]/g, '').slice(0, 500);
  };
  const sendLifecycle = (state: PreviewLifecycleState, error?: unknown) => {
    parentPostMessage({
      channel,
      version,
      invocationId: config.invocationId,
      frameId: config.frameId,
      kind: 'lifecycle',
      state,
      error: error == null ? '' : sanitizeLifecycleError(error, 'Preview failed'),
    }, '*');
  };
  const delay = (durationMs: number) => new Promise<void>((resolve) => {
    nativeSetTimeout(resolve, Math.max(0, durationMs));
  });
  const runSequentially = <T>(items: T[], callback: (item: T) => unknown | Promise<unknown>) => {
    let chain = Promise.resolve();
    for (const item of items) {
      chain = chain.then(() => callback(item)).then(() => undefined);
    }
    return chain;
  };
  // A `by` locator finds elements the way a user or a screen reader does: by role and accessible name, by label, or
  // by an element's own text. A name also matches the visible text, so a "+" button with aria-label="increment" is
  // found as "+" too. Dashes and the minus sign compare equal, and hidden elements never match.
  const normalizeName = (value: unknown) => String(value ?? '')
    .replace(/[\u2010-\u2015\u2212]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
  const isHidden = (element: Element) => {
    for (let node: Element | null = element; node; node = node.parentElement) {
      if ((node as HTMLElement).hidden || node.getAttribute('aria-hidden') === 'true') return true;
      if (getComputedStyle(node).display === 'none') return true;
    }
    const visibility = getComputedStyle(element).visibility;
    return visibility === 'hidden' || visibility === 'collapse';
  };
  const implicitRole = (element: Element): string => {
    const tag = element.tagName.toLowerCase();
    const type = (element.getAttribute('type') || '').toLowerCase();
    if (tag === 'button') return 'button';
    if (tag === 'a' || tag === 'area') return element.hasAttribute('href') ? 'link' : '';
    if (tag === 'input') {
      if (['button', 'submit', 'reset', 'image'].includes(type)) return 'button';
      if (type === 'checkbox' || type === 'radio') return type;
      if (type === 'range') return 'slider';
      if (type === 'number') return 'spinbutton';
      if (['', 'text', 'search', 'email', 'tel', 'url'].includes(type)) {
        if (element.hasAttribute('list')) return 'combobox';
        return type === 'search' ? 'searchbox' : 'textbox';
      }
      return '';
    }
    if (tag === 'textarea') return 'textbox';
    if (tag === 'select') {
      const select = element as HTMLSelectElement;
      return select.multiple || select.size > 1 ? 'listbox' : 'combobox';
    }
    if (/^h[1-6]$/.test(tag)) return 'heading';
    if (tag === 'img') return element.getAttribute('alt') === '' ? 'presentation' : 'img';
    const roles: Record<string, string> = {
      option: 'option', ul: 'list', ol: 'list', menu: 'list', li: 'listitem', table: 'table', tr: 'row', td: 'cell',
      th: 'columnheader', dialog: 'dialog', form: 'form', nav: 'navigation', main: 'main', progress: 'progressbar',
      output: 'status', mark: 'mark',
    };
    return roles[tag] || '';
  };
  const roleOf = (element: Element) => {
    const explicit = (element.getAttribute('role') || '').trim().split(/\s+/)[0].toLowerCase();
    return explicit || implicitRole(element);
  };
  const visibleText = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent || '';
    if (node.nodeType !== Node.ELEMENT_NODE) return '';
    const element = node as Element;
    if (['SCRIPT', 'STYLE', 'TEMPLATE'].includes(element.tagName)) return '';
    if ((element as HTMLElement).hidden || element.getAttribute('aria-hidden') === 'true') return '';
    const display = getComputedStyle(element).display;
    if (display === 'none') return '';
    let text = '';
    element.childNodes.forEach((child) => { text += visibleText(child); });
    return display.startsWith('inline') ? text : ` ${text} `;
  };
  const ownText = (element: Element) => normalizeName(Array.from(element.childNodes)
    .filter((child) => child.nodeType === Node.TEXT_NODE)
    .map((child) => child.textContent || '')
    .join(''));
  const labelledByText = (element: Element) => normalizeName((element.getAttribute('aria-labelledby') || '')
    .split(/\s+/)
    .map((id) => {
      const target = id ? document.getElementById(id) : null;
      return target ? visibleText(target) : '';
    })
    .join(' '));
  const labelsText = (element: Element) => {
    const labels = (element as HTMLInputElement).labels;
    return labels ? normalizeName(Array.from(labels).map((label) => visibleText(label)).join(' ')) : '';
  };
  const NAME_FROM_CONTENT = new Set(['button', 'link', 'heading', 'option', 'checkbox', 'radio', 'switch', 'tab',
    'menuitem', 'menuitemcheckbox', 'menuitemradio', 'treeitem', 'cell', 'gridcell', 'columnheader', 'rowheader', 'row',
    'tooltip']);
  const accessibleName = (element: Element) => {
    const name = labelledByText(element) || normalizeName(element.getAttribute('aria-label')) || labelsText(element);
    if (name) return name;
    if (element.tagName === 'IMG') return normalizeName(element.getAttribute('alt'));
    const input = element as HTMLInputElement;
    if (element.tagName === 'INPUT' && ['button', 'submit', 'reset'].includes(input.type)) return normalizeName(input.value);
    const content = NAME_FROM_CONTENT.has(roleOf(element)) ? normalizeName(visibleText(element)) : '';
    return content || normalizeName(element.getAttribute('title')) || normalizeName(element.getAttribute('placeholder'));
  };
  const findAll = (step: FrameworkTestStep): Element[] => {
    const by = step?.by;
    if (!by) {
      const selector = String(step?.selector || '').trim();
      return selector ? Array.from(document.querySelectorAll(selector)) : [];
    }
    const role = by.role === undefined ? undefined : String(by.role).trim().toLowerCase();
    const name = by.name === undefined ? undefined : normalizeName(by.name);
    const label = by.label === undefined ? undefined : normalizeName(by.label);
    const text = by.text === undefined ? undefined : normalizeName(by.text);
    const matches = Array.from(document.body.querySelectorAll('*')).filter((element) => {
      if (['SCRIPT', 'STYLE', 'TEMPLATE'].includes(element.tagName)) return false;
      if (role !== undefined && roleOf(element) !== role) return false;
      if (name !== undefined && accessibleName(element) !== name && normalizeName(visibleText(element)) !== name) return false;
      if (label !== undefined && labelledByText(element) !== label
        && normalizeName(element.getAttribute('aria-label')) !== label && labelsText(element) !== label) return false;
      if (text !== undefined && ownText(element) !== text) return false;
      return !isHidden(element);
    });
    if (!by.near) return matches;
    // Near another element: the matches inside its closest ancestor that holds any, as a comment's own Reply button
    // shares a wrapper with its text before the replies' buttons do. When the other element shows more than once
    // (a product's name in its card and in the cart), the occurrence with the closest matches wins.
    let nearest: Element[] = [];
    let nearestDepth = Infinity;
    for (const anchor of findAll({ by: by.near } as FrameworkTestStep)) {
      let depth = 0;
      for (let scope = anchor.parentElement; scope && depth < nearestDepth; scope = scope.parentElement, depth += 1) {
        const inside = matches.filter((element) => scope!.contains(element));
        if (inside.length) {
          nearest = inside;
          nearestDepth = depth;
          break;
        }
      }
    }
    return nearest;
  };
  const describeLocator = (by: FrameworkTestLocator): string => {
    const own = by.text !== undefined
      ? `text "${by.text}"`
      : by.label !== undefined
        ? `${by.role || 'control'} labelled "${by.label}"`
        : `${by.role || 'element'}${by.name === undefined ? '' : ` "${by.name}"`}`;
    return by.near ? `${own} near ${describeLocator(by.near)}` : own;
  };
  const describeTarget = (step: FrameworkTestStep) => {
    const by = step?.by;
    if (!by) return String(step?.selector || '').trim();
    const rawIndex = Number(step?.index);
    const nth = Number.isFinite(rawIndex) && rawIndex > 0 ? ` #${rawIndex + 1}` : '';
    return `${describeLocator(by)}${nth}`;
  };
  // Chromium defers the first layout of this off-screen sandbox frame now and then, and until it runs every
  // rect reads as zeros, so two elements look level even when one is indented. Geometry checks read their
  // rects only once at least one element has a box, within a short bound so a hidden element still fails fast.
  const laidOutRects = (elements: Element[], attempt = 0): Promise<DOMRect[]> => {
    const rects = elements.map((node) => node.getBoundingClientRect());
    const laidOut = rects.some((rect) => rect.width > 0 || rect.height > 0);
    if (laidOut || attempt >= 20) return Promise.resolve(rects);
    return delay(25).then(() => laidOutRects(elements, attempt + 1));
  };

  const queryElement = (step: FrameworkTestStep) => {
    const rawIndex = Number(step?.index);
    const index = Math.max(0, Number.isFinite(rawIndex) ? rawIndex : 0);
    return findAll(step)[index] || null;
  };
  const textOf = (element: Element | null) => String((element?.textContent || '').replace(/\s+/g, ' ')).trim();
  // The hidden check frame may not advance transitions, so a style still fading in or out is jumped to its end
  // before it is read.
  const finishAnimations = (nodes: Element[]) => {
    for (const node of nodes) {
      for (const animation of typeof node.getAnimations === 'function' ? node.getAnimations() : []) {
        try { animation.finish(); } catch { }
      }
    }
  };
  // Names a CSS color the way a person would (red, orange, yellow, green, blue, purple), whatever syntax produced
  // it: a canvas turns any color the browser understands into sRGB pixels.
  let colorProbe: CanvasRenderingContext2D | null | undefined;
  const colorName = (cssColor: string) => {
    colorProbe ??= document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    if (!colorProbe) return 'unreadable';
    colorProbe.clearRect(0, 0, 1, 1);
    colorProbe.fillStyle = '#000';
    colorProbe.fillStyle = cssColor;
    colorProbe.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = Array.from(colorProbe.getImageData(0, 0, 1, 1).data).map((channel) => channel / 255);
    if (!cssColor.trim() || a < 0.1) return 'transparent';
    const max = Math.max(r, g, b);
    const chroma = max - Math.min(r, g, b);
    if (chroma < 0.15) return 'grey';
    const sector = max === r ? ((g - b) / chroma + 6) % 6 : max === g ? (b - r) / chroma + 2 : (r - g) / chroma + 4;
    const hue = sector * 60;
    if (hue < 15 || hue >= 340) return 'red';
    if (hue < 50) return 'orange';
    if (hue < 70) return 'yellow';
    if (hue < 170) return 'green';
    return hue < 255 ? 'blue' : 'purple';
  };
  const isTextField = (element: Element) => {
    if (element instanceof HTMLTextAreaElement) return !element.readOnly && !element.disabled;
    return element instanceof HTMLInputElement && !element.readOnly && !element.disabled
      && ['text', 'search', 'email', 'url', 'tel', 'password'].includes(element.type);
  };
  const typeCharacter = (field: HTMLInputElement | HTMLTextAreaElement, character: string) => {
    let start = field.value.length;
    let end = start;
    try {
      start = field.selectionStart ?? start;
      end = field.selectionEnd ?? start;
    } catch { }
    const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(field), 'value');
    const value = field.value.slice(0, start) + character + field.value.slice(end);
    if (descriptor?.set) descriptor.set.call(field, value); else field.value = value;
    try { field.setSelectionRange(start + 1, start + 1); } catch { }
    field.dispatchEvent(new InputEvent('input', { bubbles: true, data: character, inputType: 'insertText' }));
  };
  // A frame without system focus, such as the hidden check frame, moves focus without firing focus events. When the
  // browser fires none, these send the ones a focused window would, so React's onFocus and onBlur run.
  const moveFocus = (target: HTMLElement) => {
    const previous = document.activeElement;
    if (previous === target) return;
    let heard = false;
    const hear = () => { heard = true; };
    target.addEventListener('focus', hear);
    target.focus();
    target.removeEventListener('focus', hear);
    if (heard) return;
    if (previous instanceof HTMLElement && previous !== document.body) {
      previous.dispatchEvent(new FocusEvent('blur', { relatedTarget: target }));
      previous.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: target }));
    }
    target.dispatchEvent(new FocusEvent('focus', { relatedTarget: previous }));
    target.dispatchEvent(new FocusEvent('focusin', { bubbles: true, relatedTarget: previous }));
  };
  const leaveFocus = () => {
    const previous = document.activeElement;
    if (!(previous instanceof HTMLElement) || previous === document.body) return;
    let heard = false;
    const hear = () => { heard = true; };
    previous.addEventListener('blur', hear);
    previous.blur();
    previous.removeEventListener('blur', hear);
    if (heard) return;
    previous.dispatchEvent(new FocusEvent('blur'));
    previous.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
  };
  // The elements Tab visits, in a browser's order: positive tabindex values first, then the rest in document order.
  // Disabled, hidden and inert elements are skipped.
  const tabOrder = (): HTMLElement[] => Array.from(document.querySelectorAll<HTMLElement>(
    'a[href], area[href], button, input, select, textarea, iframe, summary, [tabindex], [contenteditable]',
  ))
    .filter((node) => node.tabIndex >= 0
      && (node as HTMLElement & { disabled?: boolean }).disabled !== true
      && !(node instanceof HTMLInputElement && node.type === 'hidden')
      && !node.closest('[inert]')
      && node.getClientRects().length > 0
      && getComputedStyle(node).visibility !== 'hidden')
    .map((node, position) => ({ node, position }))
    .sort((a, b) => (a.node.tabIndex || Infinity) - (b.node.tabIndex || Infinity) || a.position - b.position)
    .map(({ node }) => node);
  // What a browser does with a Tab the page did not cancel: focus moves to the next element in tab order (the
  // previous one with Shift), or leaves the page past either end.
  const followTab = (backwards: boolean) => {
    const order = tabOrder();
    const from = document.activeElement;
    const index = from instanceof HTMLElement ? order.indexOf(from) : -1;
    let next: HTMLElement | undefined;
    if (index >= 0) {
      next = order[index + (backwards ? -1 : 1)];
    } else if (from && from !== document.body) {
      const side = backwards ? Node.DOCUMENT_POSITION_PRECEDING : Node.DOCUMENT_POSITION_FOLLOWING;
      const candidates = order.filter((node) => from.compareDocumentPosition(node) & side);
      next = backwards ? candidates[candidates.length - 1] : candidates[0];
    } else {
      next = backwards ? order[order.length - 1] : order[0];
    }
    if (next) moveFocus(next); else leaveFocus();
  };
  // What Enter activates when the page does not cancel it: a button or a link is clicked, as a browser does.
  const activatedByEnter = (element: Element) =>
    (element instanceof HTMLButtonElement && !element.disabled)
    || (element instanceof HTMLAnchorElement && element.hasAttribute('href'))
    || (element instanceof HTMLInputElement && ['button', 'submit', 'reset'].indexOf(element.type) >= 0 && !element.disabled);
  const pressKey = (element: Element, step: FrameworkTestStep, focusFirst: boolean): Promise<void> => {
    const key = String(step.key || step.value || 'Enter');
    const shiftKey = step.shift === true;
    if (focusFirst) (element as HTMLElement).focus?.();
    const allowed = element.dispatchEvent(new KeyboardEvent('keydown', { key, shiftKey, bubbles: true, cancelable: true }));
    const typed = allowed && key.length === 1 && isTextField(element);
    // With defaultAction, a Tab the page does not cancel moves focus as a browser's would, and an Enter on a button
    // or a link clicks it; without it, nothing follows the keydown.
    const tabbed = allowed && key === 'Tab' && step.defaultAction === true;
    const clicked = allowed && key === 'Enter' && step.defaultAction === true && activatedByEnter(element);
    // A printable key the page does not cancel types its character into a text field, as a real keypress does,
    // once the page has handled the keydown and re-rendered.
    return (typed ? delay(0).then(() => typeCharacter(element as HTMLInputElement | HTMLTextAreaElement, key))
      : tabbed ? delay(0).then(() => followTab(shiftKey))
        : clicked ? delay(0).then(() => (element as HTMLElement).click()) : Promise.resolve())
      .then(() => {
        element.dispatchEvent(new KeyboardEvent('keyup', { key, shiftKey, bubbles: true, cancelable: true }));
        return delay(50);
      });
  };
  const describeElement = (element: Element | null) => {
    if (!element) return 'none';
    const id = element.id ? `#${element.id}` : '';
    const cls = typeof element.className === 'string' && element.className.trim()
      ? `.${element.className.trim().replace(/\s+/g, '.')}`
      : '';
    return `${element.tagName.toLowerCase()}${id}${cls}`;
  };
  const assertText = (element: Element, step: FrameworkTestStep, negate = false) => {
    const expected = String(step.text ?? '').trim();
    const actual = textOf(element);
    const passed = step.match === 'contains' ? actual.includes(expected) : actual === expected;
    if (negate ? passed : !passed) {
      throw new Error(negate
        ? `${describeTarget(step)} expected not to contain text "${expected}" but found "${actual}"`
        : `${describeTarget(step)} expected text "${expected}" but found "${actual}"`);
    }
  };
  const waitForText = (step: FrameworkTestStep): Promise<void> => {
    const rawTimeout = Number(step.timeoutMs);
    const timeoutMs = Math.max(50, Number.isFinite(rawTimeout) ? rawTimeout : 1000);
    const startedAt = nativeNow();
    let lastText = '';
    const poll = (): Promise<void> => {
      const element = queryElement(step);
      if (element) {
        lastText = textOf(element);
        try { assertText(element, step); return Promise.resolve(); } catch { }
      }
      if (nativeNow() - startedAt > timeoutMs) {
        return Promise.reject(new Error(`${describeTarget(step)} did not reach text "${String(step.text ?? '').trim()}" before timeout. Last text: "${lastText}"`));
      }
      return delay(25).then(poll);
    };
    return poll();
  };
  const waitForCount = (step: FrameworkTestStep): Promise<void> => {
    const rawTimeout = Number(step.timeoutMs);
    const timeoutMs = Math.max(50, Number.isFinite(rawTimeout) ? rawTimeout : 1000);
    const expected = Math.max(0, Number(step.count ?? step.expected ?? 0));
    const startedAt = nativeNow();
    let lastCount = 0;
    const poll = (): Promise<void> => {
      lastCount = findAll(step).length;
      if (lastCount === expected) return Promise.resolve();
      if (nativeNow() - startedAt > timeoutMs) {
        return Promise.reject(new Error(`${describeTarget(step)} did not reach ${expected} match${expected === 1 ? '' : 'es'} before timeout. Last count: ${lastCount}`));
      }
      return delay(25).then(poll);
    };
    return poll();
  };
  const executeStep = (step: FrameworkTestStep): Promise<void> => {
    const type = String(step?.type || step?.action || '').trim();
    const target = describeTarget(step);
    if (type === 'mockHttp') {
      installHttpMock(step);
      configureHttpMock(step);
      httpCalls.length = 0;
      return Promise.resolve();
    }
    if (type === 'expectHttpRequest') {
      const expectedMethod = String(step.method || '').trim().toUpperCase();
      const expectedUrl = String(step.url || '').trim();
      const bodyContains = String(step.bodyContains || '');
      const matches = httpCalls.filter((call) => {
        const methodMatches = !expectedMethod || call.method === expectedMethod;
        const urlMatches = !expectedUrl
          || (step.match === 'contains' ? call.url.includes(expectedUrl) : call.url === expectedUrl);
        const bodyMatches = !bodyContains || call.body.includes(bodyContains);
        return methodMatches && urlMatches && bodyMatches;
      });
      const expectedCount = Math.max(0, Number(step.count ?? 1));
      if (matches.length !== expectedCount) {
        const recorded = httpCalls.map((call) => `${call.method} ${call.url}`).join(', ') || 'none';
        const diagnostics = `mock=${httpMockInstalled ? 'installed' : 'missing'}, constructed=${httpMockDiagnostics.constructed}, opened=${httpMockDiagnostics.opened}, sent=${httpMockDiagnostics.sent}`;
        throw new Error(`Expected ${expectedCount} matching HTTP request(s) but found ${matches.length}. Recorded: ${recorded}. ${diagnostics}`);
      }
      return Promise.resolve();
    }
    if (type === 'wait') return delay(Math.max(0, Number(step.durationMs ?? step.timeoutMs ?? 0)));
    if (type === 'mockRandom' || type === 'mockStorage') return Promise.resolve();
    if (type === 'expectStorage') {
      const key = String(step.key || '');
      const expected = step.value === undefined ? null : String(step.value);
      const actual = pageStorage.getItem(key);
      if (actual !== expected) {
        const show = (value: string | null) => (value === null ? 'nothing' : `"${value}"`);
        throw new Error(`localStorage "${key}" expected ${show(expected)} but held ${show(actual)}`);
      }
      return Promise.resolve();
    }
    if (type === 'unmountPreview') {
      const hook = (window as Window & { __FA_UNMOUNT_PREVIEW?: () => void }).__FA_UNMOUNT_PREVIEW;
      if (typeof hook !== 'function') throw new Error('Preview did not expose an unmount hook');
      hook();
      return delay(25);
    }
    if (type === 'expectNoPreviewLeaks') {
      const hook = (window as Window & { __FA_GET_PREVIEW_LEAKS?: () => { timers?: number; documentListeners?: number } }).__FA_GET_PREVIEW_LEAKS;
      if (typeof hook !== 'function') throw new Error('Preview did not expose leak instrumentation');
      const leaks = hook() || {};
      const timers = Number(leaks.timers || 0);
      const documentListeners = Number(leaks.documentListeners || 0);
      if (timers || documentListeners) {
        throw new Error(`Preview leaked ${timers} timer(s) and ${documentListeners} document listener(s)`);
      }
      return Promise.resolve();
    }
    if (type === 'expectNoPreviewTimers') {
      const target = window as Window & {
        __FA_GET_PREVIEW_TIMER_LEAKS?: () => number;
        __FA_GET_PREVIEW_LEAKS?: () => { timers?: number };
      };
      const timers = typeof target.__FA_GET_PREVIEW_TIMER_LEAKS === 'function'
        ? Number(target.__FA_GET_PREVIEW_TIMER_LEAKS() || 0)
        : Number(target.__FA_GET_PREVIEW_LEAKS?.()?.timers || 0);
      if (timers) {
        throw new Error(`Preview leaked ${timers} timer(s)`);
      }
      return Promise.resolve();
    }
    // A key with no target is pressed where focus already is, as on a keyboard or a TV remote; nothing is focused first.
    // A frame that rejected native focus leaves body active, so the last focus request stands in, as for expectFocused.
    if (type === 'key' && !target) return pressKey(focusedElement(), step, false);
    if (!target) throw new Error(`${type || 'step'} is missing a selector`);
    if (type === 'waitForText') return waitForText(step);
    if (type === 'waitForCount') return waitForCount(step);
    if (type === 'expectCount') {
      const expected = Math.max(0, Number(step.count ?? step.expected ?? 0));
      const actual = findAll(step).length;
      if (actual !== expected) throw new Error(`${target} expected ${expected} match${expected === 1 ? '' : 'es'} but found ${actual}`);
      return Promise.resolve();
    }

    const element = queryElement(step);
    if (!element) throw new Error(`${target} was not found`);
    if (type === 'expectExists') return Promise.resolve();
    if (type === 'expectText') { assertText(element, step); return Promise.resolve(); }
    if (type === 'expectNoText') { assertText(element, step, true); return Promise.resolve(); }
    if (type === 'setValue') {
      const control = element as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
      const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(control), 'value');
      const value = String(step.value ?? step.text ?? '');
      if (descriptor?.set) descriptor.set.call(control, value); else control.value = value;
      control.dispatchEvent(new Event('input', { bubbles: true }));
      control.dispatchEvent(new Event('change', { bubbles: true }));
      return delay(50);
    }
    if (type === 'expectValue') {
      const expected = String(step.value ?? step.text ?? '').trim();
      const actual = String((element as HTMLInputElement).value ?? '').trim();
      const passed = step.match === 'contains' ? actual.includes(expected) : actual === expected;
      if (!passed) throw new Error(`${target} expected value "${expected}" but found "${actual}"`);
      return Promise.resolve();
    }
    if (type === 'expectDisabled') {
      const expected = step.disabled !== false;
      const control = element as Element & { disabled?: boolean };
      const actual = typeof control.disabled === 'boolean'
        ? control.disabled
        : element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true';
      if (actual !== expected) throw new Error(`${target} expected ${expected ? 'disabled' : 'enabled'} but was ${actual ? 'disabled' : 'enabled'}`);
      return Promise.resolve();
    }
    if (type === 'expectAttribute') {
      const attribute = String(step.attribute || '').trim();
      if (!attribute) throw new Error(`${target} is missing an attribute name`);
      const actual = element.getAttribute(attribute);
      if (step.expected === false && actual !== null) throw new Error(`${target} expected ${attribute} to be absent`);
      if ((step.expected === undefined || step.expected === true) && actual === null) throw new Error(`${target} expected ${attribute} to exist`);
      if (step.expected !== undefined && step.expected !== true && step.expected !== false) {
        // match: 'contains' reads one part of a longer value, such as one declaration of an inline style.
        const wanted = String(step.expected);
        if (step.match === 'contains' ? !(actual ?? '').includes(wanted) : actual !== wanted) {
          throw new Error(step.match === 'contains'
            ? `${target} expected ${attribute} to contain "${wanted}" but found "${actual ?? ''}"`
            : `${target} expected ${attribute}="${wanted}" but found "${actual ?? ''}"`);
        }
      }
      return Promise.resolve();
    }
    if (type === 'expectClass') {
      const className = String(step.className || step.value || '').trim();
      if (!className) throw new Error(`${target} is missing a className`);
      const expected = step.expected !== false;
      // With timeoutMs the step waits for the class, so a check does not bet on a timer firing inside a fixed wait.
      const rawTimeout = Number(step.timeoutMs);
      const timeoutMs = Number.isFinite(rawTimeout) && rawTimeout > 0 ? rawTimeout : 0;
      const startedAt = nativeNow();
      const poll = (): Promise<void> => {
        const current = queryElement(step);
        if (current && current.classList.contains(className) === expected) return Promise.resolve();
        if (nativeNow() - startedAt >= timeoutMs) {
          return Promise.reject(new Error(`${target} expected class "${className}" to be ${expected ? 'present' : 'absent'}${timeoutMs ? ` within ${timeoutMs} ms` : ''}`));
        }
        return delay(25).then(poll);
      };
      return poll();
    }
    if (type === 'click') {
      const clickable = element as HTMLElement;
      if (typeof clickable.click !== 'function') throw new Error(`${target} is not clickable`);
      clickable.click();
      return delay(50);
    }
    if (type === 'submit') {
      const form = element as HTMLFormElement;
      if (!(form instanceof HTMLFormElement)) throw new Error(`${target} is not a form`);
      const SubmitEventCtor = window.SubmitEvent || Event;
      form.dispatchEvent(new SubmitEventCtor('submit', { bubbles: true, cancelable: true }));
      return delay(50);
    }
    if (type === 'scroll') {
      // Moves the target's scroll position once the frame has laid it out (before that it has no height, so any
      // position clamps to 0), then fires the scroll event itself: a browser only fires it on its next frame, which
      // the offscreen check frame may not get. The frame is 1px wide, so a task's scroll box needs a min-width of
      // its own; at zero width Chromium counts none of its content as overflow and nothing scrolls.
      const scroller = element as HTMLElement;
      return laidOutRects([scroller]).then(() => {
        if (step.top !== undefined) scroller.scrollTop = Number(step.top);
        if (step.left !== undefined) scroller.scrollLeft = Number(step.left);
        scroller.dispatchEvent(new Event('scroll'));
        return delay(50);
      });
    }
    if (type === 'mouseDown') {
      element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0 }));
      element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, button: 0 }));
      return delay(50);
    }
    if (type === 'pointerDown') {
      const EventCtor = window.PointerEvent || MouseEvent;
      element.dispatchEvent(new EventCtor('pointerdown', { bubbles: true, cancelable: true, button: 0 }));
      element.dispatchEvent(new EventCtor('pointerup', { bubbles: true, cancelable: true, button: 0 }));
      return delay(50);
    }
    if (type === 'focus') {
      // Moves focus to the target, as a keyboard user's Tab does, with the focus events a focused window fires. An
      // element that cannot take focus fails the step.
      const focusable = element as HTMLElement;
      const unfocusable = typeof focusable.focus !== 'function'
        || (!focusable.hasAttribute('tabindex') && focusable.tabIndex < 0)
        || (focusable as HTMLElement & { disabled?: boolean }).disabled === true
        || !!focusable.closest('[inert]');
      if (unfocusable) throw new Error(`${target} cannot take focus`);
      moveFocus(focusable);
      return delay(50);
    }
    if (type === 'fileDrag' || type === 'chooseFiles') {
      // Files from the desktop, made of zero bytes at the sizes the step gives. No object spread in this code: it
      // runs inside the check frame, where the production build's spread helper does not exist.
      const transfer = new DataTransfer();
      for (const file of step.files || []) {
        const size = Math.max(0, Math.floor(Number(file.size ?? 0)) || 0);
        transfer.items.add(new File([new Uint8Array(size)], String(file.name || 'file'), { type: String(file.type || '') }));
      }
      if (type === 'chooseFiles') {
        const input = element as HTMLInputElement;
        if (!(input instanceof HTMLInputElement) || input.type !== 'file') throw new Error(`${target} is not a file input`);
        input.files = transfer.files;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        return delay(50);
      }
      // A drag of those files, and of `text` when the step gives it, over the target: dragenter, dragover, dragleave
      // or drop. `to` is where the pointer moves next, a dragleave's relatedTarget. With `cancelled: true` the page
      // must cancel the event, as a drop target must cancel dragover for a browser to allow the drop; with
      // `cancelled: false` it must not.
      const name = String(step.event || 'drop');
      if (step.text !== undefined) transfer.setData('text/plain', String(step.text));
      // Browsers keep the files out of reach until the drop: before it, `files` reads empty and only `types` says
      // that files are coming.
      if (name !== 'drop') Object.defineProperty(transfer, 'files', { get: () => new DataTransfer().files });
      const destination = { selector: step.to?.selector, by: step.to?.by } as FrameworkTestStep;
      const related = destination.selector || destination.by ? queryElement(destination) : null;
      const event = new DragEvent(name, {
        bubbles: true,
        cancelable: name !== 'dragleave',
        dataTransfer: transfer,
        relatedTarget: related,
      });
      const allowed = element.dispatchEvent(event);
      if (step.cancelled === true && allowed) {
        throw new Error(`${target} did not cancel ${name}, so a browser would not allow the drop`);
      }
      // With `cancelled: false` the page must leave the event alone, as with text dragged to a text field.
      if (step.cancelled === false && !allowed) throw new Error(`${target} cancelled ${name}, which only a drop target should do`);
      return delay(50);
    }
    if (type === 'drag') {
      // A press on the target released over another element, as when a text selection ends outside its field.
      // Pointer and mouse down go to the target and up to the other element, and the click goes to the nearest
      // element that contains both, where browsers send it.
      const destination = { selector: step.to?.selector, by: step.to?.by } as FrameworkTestStep;
      const other = queryElement(destination);
      if (!other) throw new Error(`${describeTarget(destination)} was not found`);
      const PointerCtor = window.PointerEvent || MouseEvent;
      const init: PointerEventInit = { bubbles: true, cancelable: true, button: 0, pointerType: 'mouse', isPrimary: true };
      element.dispatchEvent(new PointerCtor('pointerdown', init));
      element.dispatchEvent(new MouseEvent('mousedown', init));
      other.dispatchEvent(new PointerCtor('pointerup', init));
      other.dispatchEvent(new MouseEvent('mouseup', init));
      let common: Element | null = element;
      while (common && !common.contains(other)) common = common.parentElement;
      (common ?? document.body).dispatchEvent(new MouseEvent('click', init));
      return delay(50);
    }
    if (type === 'hover' || type === 'unhover') {
      // A pointer moving onto the target from outside the page (hover) or off it (unhover). The over and out events
      // bubble, and React builds onMouseEnter and onMouseLeave from them; the enter and leave events go to the target
      // alone, for listeners added with addEventListener.
      const entering = type === 'hover';
      const PointerCtor = window.PointerEvent || MouseEvent;
      // No object spread here: this code runs inside the check frame, and the production build turns spread into a
      // helper that only exists outside it.
      const bubbling: PointerEventInit = { pointerType: 'mouse', isPrimary: true, bubbles: true, cancelable: true };
      const direct: PointerEventInit = { pointerType: 'mouse', isPrimary: true };
      element.dispatchEvent(new PointerCtor(entering ? 'pointerover' : 'pointerout', bubbling));
      element.dispatchEvent(new PointerCtor(entering ? 'pointerenter' : 'pointerleave', direct));
      element.dispatchEvent(new MouseEvent(entering ? 'mouseover' : 'mouseout', { bubbles: true, cancelable: true }));
      element.dispatchEvent(new MouseEvent(entering ? 'mouseenter' : 'mouseleave'));
      return delay(50);
    }
    if (type === 'key') return pressKey(element, step, true);
    if (type === 'expectFocused') {
      if (document.activeElement !== element && lastRequestedFocus !== element) {
        throw new Error(`${target} expected focus but active element was ${describeElement(document.activeElement)}`);
      }
      return Promise.resolve();
    }
    if (type === 'expectChecked') {
      // An indeterminate checkbox (or aria-checked="mixed") is mixed, neither checked nor unchecked.
      const expected = step.expected === 'mixed' ? 'mixed' : step.expected === false ? 'unchecked' : 'checked';
      const input = element as HTMLInputElement;
      const aria = element.getAttribute('aria-checked');
      const checked = typeof input.checked === 'boolean' ? input.checked : aria === 'true';
      const actual = input.indeterminate === true || aria === 'mixed' ? 'mixed' : checked ? 'checked' : 'unchecked';
      if (actual !== expected) throw new Error(`${target} expected ${expected} but was ${actual}`);
      return Promise.resolve();
    }
    if (type === 'expectColor') {
      const property = String(step.property || 'background-color');
      const expected = String(step.hue || '').trim().toLowerCase();
      finishAnimations([element]);
      const actual = colorName(getComputedStyle(element).getPropertyValue(property));
      if (actual !== expected) throw new Error(`${target} expected ${property} to be ${expected} but it was ${actual}`);
      return Promise.resolve();
    }
    if (type === 'expectName') {
      // The accessible name a screen reader announces: present, or holding the given text.
      const actual = accessibleName(element);
      const expected = normalizeName(step.text);
      if (!actual) throw new Error(`${target} has no accessible name`);
      if (expected && !(step.match === 'equals' ? actual === expected : actual.includes(expected))) {
        throw new Error(`${target} expected an accessible name ${step.match === 'equals' ? 'of' : 'with'} "${expected}" but it was "${actual}"`);
      }
      return Promise.resolve();
    }
    if (type === 'expectLiveRegion') {
      // The live region the target sits in, itself included, announces the way the step says. role="status" is
      // polite and atomic on its own, so it passes without aria-live or aria-atomic.
      const roleDefaults = new Map<string, [string, boolean]>([
        ['status', ['polite', true]], ['alert', ['assertive', true]], ['log', ['polite', false]],
        ['marquee', ['off', false]], ['timer', ['off', false]],
      ]);
      let region: Element | null = element;
      while (region && !region.hasAttribute('aria-live') && !roleDefaults.has(roleOf(region))) region = region.parentElement;
      if (!region) throw new Error(`${target} is not inside a live region`);
      const [rolePoliteness, roleAtomic] = roleDefaults.get(roleOf(region)) ?? ['off', false];
      const politeness = region.getAttribute('aria-live')?.trim() || rolePoliteness;
      const atomicAttribute = region.getAttribute('aria-atomic');
      const atomic = atomicAttribute === null ? roleAtomic : atomicAttribute === 'true';
      if (step.politeness && politeness !== step.politeness) {
        throw new Error(`${target} sits in a live region that is ${politeness}, expected ${step.politeness}`);
      }
      if (step.atomic !== undefined && atomic !== step.atomic) {
        throw new Error(`${target} sits in a live region that is ${atomic ? '' : 'not '}atomic, expected ${step.atomic ? '' : 'not '}atomic`);
      }
      return Promise.resolve();
    }
    if (type === 'expectPlaced') {
      // Where the target sits once laid out, within a pixel: `gap` px below or above another element (a tooltip
      // against its button), and with `left`, how far its left edge is from the frame's left edge.
      const reference = { selector: step.than?.selector, by: step.than?.by } as FrameworkTestStep;
      const side = step.side;
      const other = side ? queryElement(reference) : null;
      if (side && !other) throw new Error(`${describeTarget(reference)} was not found`);
      return laidOutRects(other ? [element, other] : [element]).then(([own, theirs]) => {
        if (side && theirs) {
          const gap = Number(step.gap ?? 0);
          const actual = side === 'below' ? own.top - theirs.bottom : theirs.top - own.bottom;
          if (Math.abs(actual - gap) > 1) {
            throw new Error(`${target} sits ${Math.round(actual)}px ${side} ${describeTarget(reference)}; expected ${gap}px`);
          }
        }
        if (step.left !== undefined && Math.abs(own.left - Number(step.left)) > 1) {
          throw new Error(`${target} starts ${Math.round(own.left)}px from the left edge; expected ${step.left}px`);
        }
      });
    }
    if (type === 'expectIndented') {
      // The target starts further right than another element, as a reply sits indented under its comment.
      const reference = { selector: step.than?.selector, by: step.than?.by } as FrameworkTestStep;
      const other = queryElement(reference);
      if (!other) throw new Error(`${describeTarget(reference)} was not found`);
      return laidOutRects([element, other]).then(([own, theirs]) => {
        const shift = Math.round(own.left - theirs.left);
        if (shift < 8) throw new Error(`${target} starts ${shift}px right of ${describeTarget(reference)}; expected it indented further`);
      });
    }
    if (type === 'expectReferenced') {
      // Another element names the target in an id-reference attribute (aria-activedescendant on the active option),
      // whatever the id is.
      const attribute = String(step.attribute || '').trim();
      if (!attribute) throw new Error(`${target} is missing an attribute name`);
      const expected = step.expected !== false;
      const id = element.id;
      const named = !!id && Array.from(document.querySelectorAll(`[${CSS.escape(attribute)}]`))
        .some((node) => (node.getAttribute(attribute) || '').split(/\s+/).includes(id));
      if (named !== expected) {
        throw new Error(expected
          ? `${target} expected an element's ${attribute} to name it${id ? '' : ', but it has no id'}`
          : `${target} expected no element's ${attribute} to name it`);
      }
      return Promise.resolve();
    }
    if (type === 'expectStandsOut') {
      // The target must look different from every other element of its group (an active tab among tabs). A
      // highlight still fading out must not pass for one.
      const others = findAll({ selector: step.among?.selector, by: step.among?.by } as FrameworkTestStep)
        .filter((node) => node !== element);
      if (!others.length) throw new Error(`${target} has no group to stand out from`);
      finishAnimations([element, ...others]);
      const look = (node: Element) => {
        const style = getComputedStyle(node);
        return ['background-color', 'background-image', 'color', 'border-top-color', 'border-bottom-color',
          'border-left-color', 'border-right-color', 'border-bottom-width', 'font-weight', 'text-decoration-line',
          'box-shadow', 'outline-style', 'outline-color', 'opacity'].map((name) => style.getPropertyValue(name)).join('|');
      };
      const own = look(element);
      const alike = others.filter((node) => look(node) === own).length;
      if (alike) throw new Error(`${target} looks the same as ${alike} other element${alike === 1 ? '' : 's'} of its group`);
      return Promise.resolve();
    }
    if (type === 'expectLineThrough') {
      // A line-through drawn by an ancestor shows on its text too, so each piece of text looks up its ancestors.
      const expected = step.expected !== false;
      const struck = (node: Element) => {
        for (let current: Element | null = node; current; current = current.parentElement) {
          const style = getComputedStyle(current);
          const line = style.getPropertyValue('text-decoration-line') || style.getPropertyValue('text-decoration');
          if (line.includes('line-through')) return true;
        }
        return false;
      };
      const texts = [element, ...Array.from(element.querySelectorAll('*'))]
        .filter((node) => ownText(node) && !isHidden(node));
      const actual = texts.some(struck);
      if (actual !== expected) throw new Error(`${target} expected its text ${expected ? '' : 'not '}to be struck through`);
      return Promise.resolve();
    }
    throw new Error(`Unsupported framework check step: ${type || 'unknown'}`);
  };

  const runFramework = (): Promise<void> => {
    const check = config.check;
    const name = check?.name || check?.id || 'Framework check';
    const steps = check && Array.isArray(check.steps) ? check.steps : [];
    if (!steps.length) {
      send('framework', [{ name, passed: false, error: 'No check steps configured' }]);
      return Promise.resolve();
    }
    if (steps.some((step) => String(step?.type || step?.action || '') === 'expectNoPreviewTimers')) {
      const markBaseline = (window as Window & {
        __FA_MARK_PREVIEW_TIMER_BASELINE?: () => void;
      }).__FA_MARK_PREVIEW_TIMER_BASELINE;
      markBaseline?.();
    }
    return runSequentially(steps, executeStep).then(
      () => { send('framework', [{ name, passed: true }]); },
      (error) => {
        send('framework', [{
          name,
          passed: false,
          error: errorMessage(error, 'Check failed'),
          failureKind: 'assertion',
        }]);
      },
    );
  };

  const runWeb = (): Promise<void> => {
    const testCases: Array<{ name: string; fn: () => unknown | Promise<unknown> }> = [];
    const register = (name: string, fn: () => unknown | Promise<unknown>) => {
      testCases.push({ name: String(name || 'Web check'), fn });
    };
    const format = (value: unknown) => {
      try {
        if (value instanceof Element) return `<${value.tagName.toLowerCase()}>`;
        return JSON.stringify(value);
      } catch { return String(value); }
    };
    const expect = (received: unknown) => ({
      toBe: (expected: unknown) => { if (received !== expected) throw new Error(`Expected ${format(received)} to be ${format(expected)}`); },
      toBeTruthy: () => { if (!received) throw new Error(`Expected value to be truthy, got ${format(received)}`); },
      toHaveAttribute: (name: string, value?: string) => {
        if (!(received instanceof Element)) throw new Error('toHaveAttribute expects an Element');
        const actual = received.getAttribute(name);
        if (value === undefined ? actual === null : actual !== value) {
          throw new Error(`Expected element to have [${name}${value === undefined ? '' : `="${value}"`}], got ${format(actual)}`);
        }
      },
      toHaveText: (text: string) => {
        if (!(received instanceof Element)) throw new Error('toHaveText expects an Element');
        const actual = (received.textContent || '').trim();
        if (!actual.includes(text)) throw new Error(`Expected text to include "${text}", got "${actual}"`);
      },
      toBeVisible: () => {
        if (!(received instanceof Element)) throw new Error('toBeVisible expects Element');
        const style = window.getComputedStyle(received);
        if (style.display === 'none' || style.visibility === 'hidden') throw new Error('Element is not visible');
      },
    });
    const results: TestResult[] = [];
    let fileResult: unknown;
    try {
      const executeFile = new Function('document', 'window', 'it', 'test', 'expect', 'q', 'qa', String(config.testCode || ''));
      fileResult = executeFile.call(
        undefined,
        document,
        window,
        register,
        register,
        expect,
        (selector: string) => document.querySelector(selector),
        (selector: string) => Array.from(document.querySelectorAll(selector)),
      );
    } catch (error) {
      results.unshift({
        name: 'Failed to execute test file',
        passed: false,
        error: errorMessage(error, 'Web checks failed'),
        failureKind: 'assertion',
      });
      send('web', results);
      return Promise.resolve();
    }

    return Promise.resolve(fileResult).then(
      () => runSequentially(testCases, (testCase) => Promise.resolve()
        .then(() => testCase.fn())
        .then(
          () => { results.push({ name: testCase.name, passed: true }); },
          (error) => {
            results.push({
              name: testCase.name,
              passed: false,
              error: errorMessage(error, 'Check failed'),
              failureKind: 'assertion',
            });
          },
        )),
      (error) => {
        results.unshift({
          name: 'Failed to execute test file',
          passed: false,
          error: errorMessage(error, 'Web checks failed'),
          failureKind: 'assertion',
        });
      },
    ).then(() => { send('web', results); });
  };

  const start = () => {
    if (started || lifecycleFailed) return;
    started = true;
    sendLifecycle('render-ready');
    void (config.kind === 'framework' ? runFramework() : runWeb());
  };

  if (config.kind === 'framework') {
    (window as Window & {
      __FA_NOTIFY_PREVIEW_READY?: (reason?: string, detail?: string) => void;
    }).__FA_NOTIFY_PREVIEW_READY = (reason = 'render-ready', detail = '') => {
      const normalized = reason === 'error'
        ? 'runtime-error'
        : reason === 'compile-error' || reason === 'boot-error' || reason === 'runtime-error'
          ? reason
          : 'render-ready';
      if (normalized === 'render-ready') {
        start();
        return;
      }
      if (normalized === 'compile-error' || normalized === 'boot-error' || normalized === 'runtime-error') {
        if (lifecycleFailed) return;
        lifecycleFailed = true;
        sendLifecycle(normalized, detail);
      }
    };
  } else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    queueMicrotask(start);
  }

  const onUnhandledBootError = (event: ErrorEvent) => {
    if (lifecycleFailed) return;
    lifecycleFailed = true;
    sendLifecycle(started ? 'runtime-error' : 'boot-error', event?.message || 'Preview script failed');
  };
  const onUnhandledRejection = (event: PromiseRejectionEvent) => {
    if (lifecycleFailed) return;
    lifecycleFailed = true;
    sendLifecycle(started ? 'runtime-error' : 'boot-error', event?.reason || 'Preview promise rejected');
  };
  window.addEventListener('error', onUnhandledBootError);
  window.addEventListener('unhandledrejection', onUnhandledRejection);
}
