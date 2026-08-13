import { fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { CssStickyInspection } from './css-sticky-debugging-lab.model';
import {
  BrowserCssStickyPreviewPort,
  CssStickyPreviewError,
} from './css-sticky-preview-port';
import {
  CSS_STICKY_MAX_CSS_LENGTH,
  CSS_STICKY_PREVIEW_CHANNEL,
  CSS_STICKY_PREVIEW_VERSION,
} from './css-sticky-preview-protocol';
import { validInspection } from './css-sticky-preview-protocol.spec';

describe('BrowserCssStickyPreviewPort', () => {
  it('requires the exact sandbox and referrer policy', async () => {
    const port = createPort();
    const unsafe = createFrame({ sandbox: 'allow-scripts allow-same-origin' });

    await expectAsync(port.mount(unsafe.frame, 'missing-inset'))
      .toBeRejectedWith(jasmine.objectContaining({ code: 'unsafe-frame' }));
    expect(unsafe.postMessage).not.toHaveBeenCalled();
    port.destroy();
  });

  it('fails closed before mounting under a non-HTTP parent origin', async () => {
    const opaqueHost = { location: { origin: 'null' } } as unknown as Window;
    const port = new BrowserCssStickyPreviewPort(opaqueHost);
    const mounted = createFrame();

    await expectAsync(port.mount(mounted.frame, 'missing-inset'))
      .toBeRejectedWith(jasmine.objectContaining({ code: 'unavailable' }));
    expect(mounted.srcdoc()).toBe('');
    expect(mounted.postMessage).not.toHaveBeenCalled();
    port.destroy();
  });

  it('accepts ready only from the mounted frame with the current protocol IDs', fakeAsync(() => {
    const port = createPort();
    const mounted = createFrame();
    let ready = false;
    void port.mount(mounted.frame, 'missing-inset').then(() => { ready = true; });
    const ids = protocolIds(mounted.srcdoc());

    dispatchChild({ ...readyMessage(ids), sessionId: 'forged' }, mounted.childWindow);
    dispatchChild(readyMessage(ids), {} as Window);
    dispatchChild(readyMessage(ids), mounted.childWindow, 'https://attacker.invalid');
    flushMicrotasks();
    expect(ready).toBeFalse();

    dispatchChild(readyMessage(ids), mounted.childWindow);
    flushMicrotasks();
    expect(ready).toBeTrue();
    expect(ids.parentOrigin).toBe(window.location.origin);
    expect(mounted.srcdoc()).toContain(`default-src 'none'`);
    port.destroy();
  }));

  it('sends CSS over postMessage and accepts only the current run result', fakeAsync(() => {
    const port = createPort();
    const mounted = readyFrame(port);
    const controller = new AbortController();
    let result: CssStickyInspection | undefined;

    void port.inspect({
      caseId: 'missing-inset',
      css: `.sticky-target { position: sticky; top: 0; }`,
      signal: controller.signal,
    }).then((inspection) => { result = inspection; });
    const command = latestCommand(mounted.postMessage);

    expect(command['css']).toContain('top: 0');
    expect(mounted.postMessage.calls.mostRecent().args[1]).toBe('*');
    expect(mounted.srcdoc()).not.toContain(`.sticky-target { position: sticky; top: 0; }`);
    dispatchChild(resultMessage(command, validInspection()), foreignSource());
    dispatchChild(resultMessage({ ...command, runToken: 'stale' }, validInspection()), mounted.childWindow);
    flushMicrotasks();
    expect(result).toBeUndefined();

    dispatchChild(resultMessage(command, validInspection()), mounted.childWindow);
    flushMicrotasks();
    expect(result?.finding).toBe('missing_inset');
    port.destroy();
  }));

  it('cancels the previous run and ignores its stale result', fakeAsync(() => {
    const port = createPort();
    const mounted = readyFrame(port);
    const firstController = new AbortController();
    const secondController = new AbortController();
    let firstCode = '';
    let secondFinding = '';

    void port.inspect({ caseId: 'missing-inset', css: 'a{}', signal: firstController.signal })
      .catch((error: CssStickyPreviewError) => { firstCode = error.code; });
    const first = latestCommand(mounted.postMessage);
    void port.inspect({ caseId: 'missing-inset', css: 'b{}', signal: secondController.signal })
      .then((inspection) => { secondFinding = inspection.finding; });
    const second = latestCommand(mounted.postMessage);
    flushMicrotasks();

    expect(firstCode).toBe('cancelled');
    expect(second['runId']).toBe((first['runId'] as number) + 1);
    dispatchChild(resultMessage(first, { ...validInspection(), finding: 'working', working: true }), mounted.childWindow);
    flushMicrotasks();
    expect(secondFinding).toBe('');

    dispatchChild(resultMessage(second, validInspection()), mounted.childWindow);
    flushMicrotasks();
    expect(secondFinding).toBe('missing_inset');
    port.destroy();
  }));

  it('rejects oversized CSS before sending it to the opaque frame', async () => {
    const port = createPort();
    const mounted = await readyFrameAsync(port);
    mounted.postMessage.calls.reset();

    await expectAsync(port.inspect({
      caseId: 'missing-inset',
      css: 'x'.repeat(CSS_STICKY_MAX_CSS_LENGTH + 1),
      signal: new AbortController().signal,
    })).toBeRejectedWith(jasmine.objectContaining({ code: 'invalid-request' }));
    expect(mounted.postMessage).not.toHaveBeenCalled();
    port.destroy();
  });

  it('rejects aborted work, removes it on destroy, and never exposes child error text', fakeAsync(() => {
    const port = createPort();
    const mounted = readyFrame(port);
    const controller = new AbortController();
    let code = '';
    let message = '';

    void port.inspect({ caseId: 'missing-inset', css: 'a{}', signal: controller.signal })
      .catch((error: CssStickyPreviewError) => {
        code = error.code;
        message = error.message;
      });
    controller.abort('sensitive raw reason');
    flushMicrotasks();

    expect(code).toBe('cancelled');
    expect(message).not.toContain('sensitive raw reason');
    port.destroy();
  }));

  it('enforces ready and inspect timeouts', fakeAsync(() => {
    const readyPort = createPort({ readyTimeoutMs: 5, inspectTimeoutMs: 5 });
    const waiting = createFrame();
    let readyCode = '';
    void readyPort.mount(waiting.frame, 'missing-inset')
      .catch((error: CssStickyPreviewError) => { readyCode = error.code; });
    tick(5);
    flushMicrotasks();
    expect(readyCode).toBe('ready-timeout');
    readyPort.destroy();

    const inspectPort = createPort({ readyTimeoutMs: 5, inspectTimeoutMs: 5 });
    readyFrame(inspectPort);
    let inspectCode = '';
    void inspectPort.inspect({
      caseId: 'missing-inset', css: 'a{}', signal: new AbortController().signal,
    }).catch((error: CssStickyPreviewError) => { inspectCode = error.code; });
    tick(5);
    flushMicrotasks();
    expect(inspectCode).toBe('inspect-timeout');
    inspectPort.destroy();
  }));

  it('sends bounded highlight commands only after an inspection run', fakeAsync(() => {
    const port = createPort();
    const mounted = readyFrame(port);
    port.highlight(0);
    expect(mounted.postMessage).not.toHaveBeenCalled();

    void port.inspect({ caseId: 'missing-inset', css: 'a{}', signal: new AbortController().signal })
      .catch(() => undefined);
    const inspect = latestCommand(mounted.postMessage);
    port.highlight(2);
    const highlight = latestCommand(mounted.postMessage);
    expect(highlight['kind']).toBe('highlight');
    expect(highlight['runId']).toBe(inspect['runId']);
    expect(highlight['runToken']).toBe(inspect['runToken']);
    expect(mounted.postMessage.calls.mostRecent().args[1]).toBe('*');

    const calls = mounted.postMessage.calls.count();
    port.highlight(99);
    expect(mounted.postMessage.calls.count()).toBe(calls);
    port.destroy();
  }));
});

type FrameHarness = {
  frame: HTMLIFrameElement;
  childWindow: Window;
  postMessage: jasmine.Spy;
  srcdoc: () => string;
};

function createFrame(options: { sandbox?: string; referrerPolicy?: string } = {}): FrameHarness {
  const postMessage = jasmine.createSpy('child postMessage');
  const childWindow = new EventTarget() as EventTarget & { postMessage?: jasmine.Spy };
  childWindow.postMessage = postMessage;
  let source = '';
  const attributes: Record<string, string> = {
    sandbox: options.sandbox ?? 'allow-scripts',
    referrerpolicy: options.referrerPolicy ?? 'no-referrer',
  };
  const frame = {
    contentWindow: childWindow as unknown as Window,
    referrerPolicy: attributes['referrerpolicy'],
    getAttribute: (name: string) => attributes[name] ?? null,
    set srcdoc(value: string) { source = value; },
    get srcdoc() { return source; },
  } as unknown as HTMLIFrameElement;
  return { frame, childWindow: childWindow as unknown as Window, postMessage, srcdoc: () => source };
}

function createPort(options: { readyTimeoutMs?: number; inspectTimeoutMs?: number } = {}): BrowserCssStickyPreviewPort {
  let id = 0;
  return new BrowserCssStickyPreviewPort(window, {
    ...options,
    idFactory: () => (++id).toString(16).padStart(32, '0'),
  });
}

function readyFrame(port: BrowserCssStickyPreviewPort): FrameHarness {
  const mounted = createFrame();
  void port.mount(mounted.frame, 'missing-inset');
  const ids = protocolIds(mounted.srcdoc());
  dispatchChild(readyMessage(ids), mounted.childWindow);
  flushMicrotasks();
  mounted.postMessage.calls.reset();
  return mounted;
}

async function readyFrameAsync(port: BrowserCssStickyPreviewPort): Promise<FrameHarness> {
  const mounted = createFrame();
  const ready = port.mount(mounted.frame, 'missing-inset');
  const ids = protocolIds(mounted.srcdoc());
  dispatchChild(readyMessage(ids), mounted.childWindow);
  await ready;
  return mounted;
}

function protocolIds(source: string): {
  parentOrigin: string;
  sessionId: string;
  frameId: string;
  readyRunToken: string;
  caseId: string;
} {
  const read = (name: string): string => {
    const match = source.match(new RegExp(`"${name}":"([^"]+)"`));
    if (!match) throw new Error(`Missing ${name} in preview document`);
    return match[1];
  };
  return {
    parentOrigin: read('parentOrigin'),
    sessionId: read('sessionId'),
    frameId: read('frameId'),
    readyRunToken: read('readyRunToken'),
    caseId: read('caseId'),
  };
}

function readyMessage(ids: ReturnType<typeof protocolIds>): Record<string, unknown> {
  return {
    channel: CSS_STICKY_PREVIEW_CHANNEL,
    version: CSS_STICKY_PREVIEW_VERSION,
    sessionId: ids.sessionId,
    frameId: ids.frameId,
    caseId: ids.caseId,
    kind: 'ready',
    runId: 0,
    runToken: ids.readyRunToken,
  };
}

function resultMessage(command: Record<string, unknown>, inspection: CssStickyInspection): Record<string, unknown> {
  return {
    channel: command['channel'],
    version: command['version'],
    sessionId: command['sessionId'],
    frameId: command['frameId'],
    caseId: command['caseId'],
    kind: 'result',
    runId: command['runId'],
    runToken: command['runToken'],
    inspection,
  };
}

function latestCommand(spy: jasmine.Spy): Record<string, unknown> {
  return spy.calls.mostRecent().args[0] as Record<string, unknown>;
}

function dispatchChild(data: Record<string, unknown>, source: Window, origin = 'null'): void {
  const event = new Event('message') as MessageEvent;
  Object.defineProperties(event, {
    data: { configurable: true, value: data },
    source: { configurable: true, value: source },
    origin: { configurable: true, value: origin },
  });
  window.dispatchEvent(event);
}

function foreignSource(): Window {
  return new EventTarget() as unknown as Window;
}
