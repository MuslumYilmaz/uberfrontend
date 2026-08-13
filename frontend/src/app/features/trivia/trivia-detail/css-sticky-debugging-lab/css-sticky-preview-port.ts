import { DOCUMENT } from '@angular/common';
import { InjectionToken, Provider, inject } from '@angular/core';
import { getCssStickyCase } from './css-sticky-debugging-lab.content';
import type {
  CssStickyCaseId,
  CssStickyInspection,
} from './css-sticky-debugging-lab.model';
import { buildCssStickyPreviewDocument } from './css-sticky-preview-document';
import {
  CSS_STICKY_MAX_ANCESTORS,
  CSS_STICKY_MAX_CSS_LENGTH,
  CSS_STICKY_PREVIEW_CHANNEL,
  CSS_STICKY_PREVIEW_VERSION,
  CssStickyHostMessage,
  normalizeCssStickyInspection,
} from './css-sticky-preview-protocol';

const DEFAULT_READY_TIMEOUT_MS = 2_000;
const DEFAULT_INSPECT_TIMEOUT_MS = 2_000;

export interface CssStickyInspectRequest {
  readonly caseId: CssStickyCaseId;
  readonly css: string;
  readonly signal: AbortSignal;
}

export interface CssStickyPreviewPort {
  mount(frame: HTMLIFrameElement, caseId: CssStickyCaseId): Promise<void>;
  inspect(request: CssStickyInspectRequest): Promise<CssStickyInspection>;
  highlight(ancestorIndex: number | null): void;
  destroy(): void;
}

export type CssStickyPreviewErrorCode =
  | 'unavailable'
  | 'unsafe-frame'
  | 'invalid-request'
  | 'ready-timeout'
  | 'inspect-timeout'
  | 'cancelled';

export class CssStickyPreviewError extends Error {
  constructor(readonly code: CssStickyPreviewErrorCode) {
    super(messageForCode(code));
    this.name = 'CssStickyPreviewError';
  }
}

interface PendingInspection {
  readonly runId: number;
  readonly runToken: string;
  readonly resolve: (inspection: CssStickyInspection) => void;
  readonly reject: (error: CssStickyPreviewError) => void;
  readonly signal: AbortSignal;
  readonly onAbort: () => void;
  readonly timer: number;
}

interface PortOptions {
  readonly readyTimeoutMs?: number;
  readonly inspectTimeoutMs?: number;
  readonly idFactory?: () => string;
}

export class BrowserCssStickyPreviewPort implements CssStickyPreviewPort {
  private readonly readyTimeoutMs: number;
  private readonly inspectTimeoutMs: number;
  private readonly idFactory: () => string;
  private frame: HTMLIFrameElement | null = null;
  private mountedCaseId: CssStickyCaseId | null = null;
  private sessionId = '';
  private frameId = '';
  private readyRunToken = '';
  private runSequence = 0;
  private lastRunId = 0;
  private lastRunToken = '';
  private readyResolve: (() => void) | null = null;
  private readyReject: ((error: CssStickyPreviewError) => void) | null = null;
  private readyTimer: number | null = null;
  private pending: PendingInspection | null = null;
  private listening = false;
  private destroyed = false;

  constructor(
    private readonly hostWindow: Window | null,
    options: PortOptions = {},
  ) {
    this.readyTimeoutMs = positiveTimeout(options.readyTimeoutMs, DEFAULT_READY_TIMEOUT_MS);
    this.inspectTimeoutMs = positiveTimeout(options.inspectTimeoutMs, DEFAULT_INSPECT_TIMEOUT_MS);
    this.idFactory = options.idFactory ?? (() => createCryptographicId(this.hostWindow));
  }

  mount(frame: HTMLIFrameElement, caseId: CssStickyCaseId): Promise<void> {
    if (this.destroyed || !this.hostWindow || !frame.contentWindow) {
      return Promise.reject(new CssStickyPreviewError('unavailable'));
    }
    if (!isSafelySandboxed(frame)) {
      return Promise.reject(new CssStickyPreviewError('unsafe-frame'));
    }

    this.resetMount();
    const stickyCase = getCssStickyCase(caseId);
    this.frame = frame;
    this.mountedCaseId = caseId;
    this.sessionId = this.idFactory();
    this.frameId = this.idFactory();
    this.readyRunToken = this.idFactory();
    this.runSequence = 0;
    this.lastRunId = 0;
    this.lastRunToken = '';

    this.hostWindow.addEventListener('message', this.onMessage);
    this.listening = true;

    const ready = new Promise<void>((resolve, reject) => {
      this.readyResolve = resolve;
      this.readyReject = reject;
      this.readyTimer = this.hostWindow?.setTimeout(() => {
        this.failReady(new CssStickyPreviewError('ready-timeout'));
      }, this.readyTimeoutMs) ?? null;
    });

    try {
      frame.srcdoc = buildCssStickyPreviewDocument(stickyCase, {
        sessionId: this.sessionId,
        frameId: this.frameId,
        readyRunToken: this.readyRunToken,
        nonce: this.idFactory(),
      });
    } catch {
      this.failReady(new CssStickyPreviewError('unavailable'));
    }
    return ready;
  }

  inspect(request: CssStickyInspectRequest): Promise<CssStickyInspection> {
    if (this.destroyed || !this.hostWindow || !this.frame?.contentWindow || !this.mountedCaseId) {
      return Promise.reject(new CssStickyPreviewError('unavailable'));
    }
    if (request.caseId !== this.mountedCaseId
      || typeof request.css !== 'string'
      || request.css.length > CSS_STICKY_MAX_CSS_LENGTH) {
      return Promise.reject(new CssStickyPreviewError('invalid-request'));
    }
    if (request.signal.aborted) {
      return Promise.reject(new CssStickyPreviewError('cancelled'));
    }

    this.cancelPending();
    const runId = ++this.runSequence;
    const runToken = this.idFactory();
    this.lastRunId = runId;
    this.lastRunToken = runToken;

    return new Promise<CssStickyInspection>((resolve, reject) => {
      const onAbort = () => this.cancelPending(runId, runToken);
      const timer = this.hostWindow?.setTimeout(() => {
        this.finishPending(runId, runToken, new CssStickyPreviewError('inspect-timeout'));
      }, this.inspectTimeoutMs) ?? 0;
      this.pending = {
        runId,
        runToken,
        resolve,
        reject,
        signal: request.signal,
        onAbort,
        timer,
      };
      request.signal.addEventListener('abort', onAbort, { once: true });

      const message: CssStickyHostMessage = {
        channel: CSS_STICKY_PREVIEW_CHANNEL,
        version: CSS_STICKY_PREVIEW_VERSION,
        sessionId: this.sessionId,
        frameId: this.frameId,
        caseId: request.caseId,
        kind: 'inspect',
        runId,
        runToken,
        css: request.css,
      };
      this.frame?.contentWindow?.postMessage(message, '*');
    });
  }

  highlight(ancestorIndex: number | null): void {
    if (!this.frame?.contentWindow
      || !this.mountedCaseId
      || this.lastRunId <= 0
      || (ancestorIndex !== null
        && (!Number.isInteger(ancestorIndex)
          || ancestorIndex < 0
          || ancestorIndex >= CSS_STICKY_MAX_ANCESTORS))) return;

    const message: CssStickyHostMessage = {
      channel: CSS_STICKY_PREVIEW_CHANNEL,
      version: CSS_STICKY_PREVIEW_VERSION,
      sessionId: this.sessionId,
      frameId: this.frameId,
      caseId: this.mountedCaseId,
      kind: 'highlight',
      runId: this.lastRunId,
      runToken: this.lastRunToken,
      ancestorIndex,
    };
    this.frame.contentWindow.postMessage(message, '*');
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.resetMount();
  }

  private readonly onMessage = (event: MessageEvent<unknown>): void => {
    if (!this.frame?.contentWindow || event.source !== this.frame.contentWindow) return;
    const payload = event.data;
    if (!isRecord(payload)
      || payload['channel'] !== CSS_STICKY_PREVIEW_CHANNEL
      || payload['version'] !== CSS_STICKY_PREVIEW_VERSION
      || payload['sessionId'] !== this.sessionId
      || payload['frameId'] !== this.frameId
      || payload['caseId'] !== this.mountedCaseId) return;

    if (payload['kind'] === 'ready') {
      if (payload['runId'] !== 0 || payload['runToken'] !== this.readyRunToken) return;
      this.finishReady();
      return;
    }

    const pending = this.pending;
    if (payload['kind'] !== 'result'
      || !pending
      || payload['runId'] !== pending.runId
      || payload['runToken'] !== pending.runToken
      || pending.runId !== this.lastRunId
      || pending.runToken !== this.lastRunToken) return;

    const inspection = normalizeCssStickyInspection(payload['inspection']);
    if (!inspection) return;
    this.finishPending(pending.runId, pending.runToken, inspection);
  };

  private finishReady(): void {
    const resolve = this.readyResolve;
    if (!resolve) return;
    this.clearReadyTimer();
    this.readyResolve = null;
    this.readyReject = null;
    resolve();
  }

  private failReady(error: CssStickyPreviewError): void {
    const reject = this.readyReject;
    if (!reject) return;
    this.clearReadyTimer();
    this.readyResolve = null;
    this.readyReject = null;
    reject(error);
  }

  private finishPending(
    runId: number,
    runToken: string,
    outcome: CssStickyInspection | CssStickyPreviewError,
  ): void {
    const pending = this.pending;
    if (!pending || pending.runId !== runId || pending.runToken !== runToken) return;
    this.pending = null;
    pending.signal.removeEventListener('abort', pending.onAbort);
    this.hostWindow?.clearTimeout(pending.timer);
    if (outcome instanceof CssStickyPreviewError) {
      pending.reject(outcome);
    } else {
      pending.resolve(outcome);
    }
  }

  private cancelPending(runId?: number, runToken?: string): void {
    const pending = this.pending;
    if (!pending) return;
    if ((runId !== undefined && pending.runId !== runId)
      || (runToken !== undefined && pending.runToken !== runToken)) return;
    this.finishPending(pending.runId, pending.runToken, new CssStickyPreviewError('cancelled'));
  }

  private resetMount(): void {
    this.cancelPending();
    this.failReady(new CssStickyPreviewError('cancelled'));
    this.clearReadyTimer();
    if (this.hostWindow && this.listening) {
      this.hostWindow.removeEventListener('message', this.onMessage);
    }
    this.listening = false;
    this.frame = null;
    this.mountedCaseId = null;
    this.sessionId = '';
    this.frameId = '';
    this.readyRunToken = '';
    this.lastRunId = 0;
    this.lastRunToken = '';
  }

  private clearReadyTimer(): void {
    if (this.readyTimer !== null) this.hostWindow?.clearTimeout(this.readyTimer);
    this.readyTimer = null;
  }
}

export const CSS_STICKY_PREVIEW_PORT = new InjectionToken<CssStickyPreviewPort>(
  'CSS_STICKY_PREVIEW_PORT',
);

export const CSS_STICKY_PREVIEW_PORT_PROVIDER: Provider = {
  provide: CSS_STICKY_PREVIEW_PORT,
  useFactory: (): CssStickyPreviewPort => {
    const document = inject(DOCUMENT);
    return new BrowserCssStickyPreviewPort(document.defaultView);
  },
};

function isSafelySandboxed(frame: HTMLIFrameElement): boolean {
  const sandboxTokens = String(frame.getAttribute('sandbox') ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const referrerPolicy = frame.getAttribute('referrerpolicy') || frame.referrerPolicy;
  return sandboxTokens.length === 1
    && sandboxTokens[0] === 'allow-scripts'
    && referrerPolicy === 'no-referrer';
}

function createCryptographicId(hostWindow: Window | null): string {
  const crypto = hostWindow?.crypto;
  if (!crypto?.getRandomValues) throw new CssStickyPreviewError('unavailable');
  const values = new Uint32Array(4);
  crypto.getRandomValues(values);
  return Array.from(values, (value) => value.toString(16).padStart(8, '0')).join('');
}

function positiveTimeout(value: number | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(1, Math.floor(value))
    : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function messageForCode(code: CssStickyPreviewErrorCode): string {
  switch (code) {
    case 'unsafe-frame': return 'CSS sticky preview requires its isolated sandbox.';
    case 'invalid-request': return 'CSS sticky preview rejected an invalid request.';
    case 'ready-timeout': return 'CSS sticky preview did not become ready.';
    case 'inspect-timeout': return 'CSS sticky inspection did not finish.';
    case 'cancelled': return 'CSS sticky inspection was cancelled.';
    default: return 'CSS sticky preview is unavailable.';
  }
}
