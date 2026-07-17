import type { FrameworkTest, FrameworkTestStep } from '../../../core/models/question.model';
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
            fail(this.lifecycleError(state, payload.error));
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

  private lifecycleError(state: Exclude<PreviewLifecycleState, 'render-ready'>, detail: unknown): OpaquePreviewLifecycleError {
    const message = this.sanitizeLifecycleError(detail);
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
  const channel = 'FA_OPAQUE_CHECK';
  const version = 2;
  const maxErrorLength = 4000;
  const parentWindow = window.parent;
  const parentPostMessage = parentWindow.postMessage.bind(parentWindow);
  const nativeSetTimeout = window.setTimeout.bind(window);
  const nativeNow = Date.now.bind(Date);
  let started = false;
  let lifecycleFailed = false;
  let lastRequestedFocus: Element | null = null;

  // Backgrounded and non-rendered sandbox frames may reject native focus even
  // though the application made the correct focus request. Track focus/blur
  // calls inside the opaque document so structured checks remain deterministic.
  const nativeFocus = HTMLElement.prototype.focus;
  const nativeBlur = HTMLElement.prototype.blur;
  HTMLElement.prototype.focus = function focus(options?: FocusOptions): void {
    lastRequestedFocus = this;
    if (options === undefined) nativeFocus.call(this);
    else nativeFocus.call(this, options);
  };
  HTMLElement.prototype.blur = function blur(): void {
    if (lastRequestedFocus === this) lastRequestedFocus = null;
    nativeBlur.call(this);
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
  const queryElement = (step: FrameworkTestStep) => {
    const selector = String(step?.selector || '').trim();
    const rawIndex = Number(step?.index);
    const index = Math.max(0, Number.isFinite(rawIndex) ? rawIndex : 0);
    return Array.from(document.querySelectorAll(selector))[index] || null;
  };
  const textOf = (element: Element | null) => String((element?.textContent || '').replace(/\s+/g, ' ')).trim();
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
        ? `${step.selector} expected not to contain text "${expected}" but found "${actual}"`
        : `${step.selector} expected text "${expected}" but found "${actual}"`);
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
        return Promise.reject(new Error(`${step.selector} did not reach text "${String(step.text ?? '').trim()}" before timeout. Last text: "${lastText}"`));
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
      lastCount = document.querySelectorAll(String(step.selector || '').trim()).length;
      if (lastCount === expected) return Promise.resolve();
      if (nativeNow() - startedAt > timeoutMs) {
        return Promise.reject(new Error(`${step.selector} did not reach ${expected} match${expected === 1 ? '' : 'es'} before timeout. Last count: ${lastCount}`));
      }
      return delay(25).then(poll);
    };
    return poll();
  };
  const executeStep = (step: FrameworkTestStep): Promise<void> => {
    const type = String(step?.type || step?.action || '').trim();
    const selector = String(step?.selector || '').trim();
    if (type === 'wait') return delay(Math.max(0, Number(step.durationMs ?? step.timeoutMs ?? 0)));
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
    if (!selector) throw new Error(`${type || 'step'} is missing a selector`);
    if (type === 'waitForText') return waitForText(step);
    if (type === 'waitForCount') return waitForCount(step);
    if (type === 'expectCount') {
      const expected = Math.max(0, Number(step.count ?? step.expected ?? 0));
      const actual = document.querySelectorAll(selector).length;
      if (actual !== expected) throw new Error(`${selector} expected ${expected} match${expected === 1 ? '' : 'es'} but found ${actual}`);
      return Promise.resolve();
    }

    const element = queryElement(step);
    if (!element) throw new Error(`${selector} was not found`);
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
      if (!passed) throw new Error(`${selector} expected value "${expected}" but found "${actual}"`);
      return Promise.resolve();
    }
    if (type === 'expectDisabled') {
      const expected = step.disabled !== false;
      const control = element as Element & { disabled?: boolean };
      const actual = typeof control.disabled === 'boolean'
        ? control.disabled
        : element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true';
      if (actual !== expected) throw new Error(`${selector} expected ${expected ? 'disabled' : 'enabled'} but was ${actual ? 'disabled' : 'enabled'}`);
      return Promise.resolve();
    }
    if (type === 'expectAttribute') {
      const attribute = String(step.attribute || '').trim();
      if (!attribute) throw new Error(`${selector} is missing an attribute name`);
      const actual = element.getAttribute(attribute);
      if (step.expected === false && actual !== null) throw new Error(`${selector} expected ${attribute} to be absent`);
      if ((step.expected === undefined || step.expected === true) && actual === null) throw new Error(`${selector} expected ${attribute} to exist`);
      if (step.expected !== undefined && step.expected !== true && step.expected !== false && actual !== String(step.expected)) {
        throw new Error(`${selector} expected ${attribute}="${String(step.expected)}" but found "${actual ?? ''}"`);
      }
      return Promise.resolve();
    }
    if (type === 'expectClass') {
      const className = String(step.className || step.value || '').trim();
      if (!className) throw new Error(`${selector} is missing a className`);
      const expected = step.expected !== false;
      if (element.classList.contains(className) !== expected) throw new Error(`${selector} expected class "${className}" to be ${expected ? 'present' : 'absent'}`);
      return Promise.resolve();
    }
    if (type === 'click') {
      const clickable = element as HTMLElement;
      if (typeof clickable.click !== 'function') throw new Error(`${selector} is not clickable`);
      clickable.click();
      return delay(50);
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
    if (type === 'key') {
      const key = String(step.key || step.value || 'Enter');
      (element as HTMLElement).focus?.();
      element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
      element.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true, cancelable: true }));
      return delay(50);
    }
    if (type === 'expectFocused') {
      if (document.activeElement !== element && lastRequestedFocus !== element) {
        throw new Error(`${selector} expected focus but active element was ${describeElement(document.activeElement)}`);
      }
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
