import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { isMainThread, parentPort, workerData } from 'node:worker_threads';

const monacoSource = readFileSync(
  new URL('../node_modules/monaco-editor/min/vs/editor/editor.main.js', import.meta.url),
  'utf8',
);
const zoneSource = readFileSync(
  new URL('../node_modules/zone.js/bundles/zone.umd.js', import.meta.url),
  'utf8',
);

// Exercise the actual production distribution. The package is pinned, so fail
// explicitly if an upgrade changes these method boundaries or patch targets.
const workaroundStart = monacoSource.indexOf('installWebKitWriteTextWorkaround(){const g=');
const workaroundEndMarker = '{container:this.layoutService.mainContainer,disposables:this._store}))}';
const workaroundEnd = monacoSource.indexOf(workaroundEndMarker, workaroundStart);
assert.ok(workaroundStart > 0 && workaroundEnd > workaroundStart, 'Expected Monaco 0.52.2 WebKit clipboard workaround');
const workaroundSource = monacoSource.slice(workaroundStart, workaroundEnd + workaroundEndMarker.length);

const writeTextStart = monacoSource.indexOf('async writeText(g,c){', workaroundEnd);
const writeTextEndMarker = 'this.fallbackWriteText(g)}';
const writeTextEnd = monacoSource.indexOf(writeTextEndMarker, writeTextStart);
assert.ok(writeTextStart > 0 && writeTextEnd > writeTextStart, 'Expected Monaco 0.52.2 clipboard writeText');
const writeTextSource = monacoSource.slice(writeTextStart, writeTextEnd + writeTextEndMarker.length);

// Monaco's own DeferredPromise, so cancel()/isSettled semantics are the shipped ones.
const deferredEnd = monacoSource.indexOf('e.DeferredPromise=h;');
const deferredStart = monacoSource.lastIndexOf('class h{', deferredEnd);
assert.ok(deferredStart > 0 && deferredEnd > deferredStart, 'Expected Monaco 0.52.2 DeferredPromise');
const deferredPromiseSource = monacoSource.slice(deferredStart, deferredEnd);

export const upstreamHandler = 'const g=()=>{const c=new E.DeferredPromise;this.webKitPendingClipboardWritePromise&&!this.webKitPendingClipboardWritePromise.isSettled&&this.webKitPendingClipboardWritePromise.cancel(),this.webKitPendingClipboardWritePromise=c,(0,k.getActiveWindow)().navigator.clipboard.write([new ClipboardItem({"text/plain":c.p})]).catch(async l=>{(!(l instanceof Error)||l.name!=="NotAllowedError"||!c.isRejected)&&this.logService.error(l)})};';
export const patchedHandler = 'const g=()=>{const a=(0,k.getActiveWindow)().navigator.clipboard;if(!a)return;const c=new E.DeferredPromise;this.webKitPendingClipboardWritePromise&&!this.webKitPendingClipboardWritePromise.isSettled&&this.webKitPendingClipboardWritePromise.cancel(),this.webKitPendingClipboardWritePromise=c,a.write([new ClipboardItem({"text/plain":c.p})]).catch(async l=>{!c.isSettled&&this.webKitPendingClipboardWritePromise===c&&(this.webKitPendingClipboardWritePromise=void 0),(!(l instanceof Error)||l.name!=="NotAllowedError"||!c.isRejected)&&this.logService.error(l)})};';
assert.ok(workaroundSource.includes(patchedHandler), 'The Monaco clipboard cancellation patch must be installed');

// A WebKit stand-in. ClipboardItem converts each value with the realm's intrinsic
// Promise (WebIDL), so a page-level ZoneAwarePromise is adopted by a native promise
// that only the bindings hold. Clipboard::write rejects before collecting item data
// when no user gesture is active (Escape, for example); the item promises only get
// handlers when the write is actually processed.
const webKitSource = `
  const NativePromise = globalThis.__NativePromise;
  class NotAllowedError extends Error {
    constructor() { super('The request is not allowed by the user agent'); this.name = 'NotAllowedError'; }
  }
  globalThis.ClipboardItem = class ClipboardItem {
    constructor(items) { this.promises = Object.values(items).map((value) => NativePromise.resolve(value)); }
  };
  globalThis.__webkit = {
    gesture: true,
    text: undefined,
    writeTextCalls: [],
    write(items) {
      if (!this.gesture) return NativePromise.reject(new NotAllowedError());
      return new NativePromise((resolve, reject) => {
        for (const item of items) {
          for (const promise of item.promises) {
            promise.then((text) => { __webkit.text = text; resolve(); }, () => reject(new NotAllowedError()));
          }
        }
      });
    },
    writeText(text) { this.writeTextCalls.push(text); return NativePromise.resolve(); },
  };
`;

export function createHarness({ upstream = false, clipboardAvailable = true } = {}) {
  const consoleErrors = [];
  const logErrors = [];
  const listeners = new Map();
  class CancellationError extends Error {
    constructor() {
      super('Canceled');
      this.name = 'Canceled';
    }
  }
  const context = vm.createContext({
    console: { ...console, error: (...args) => consoleErrors.push(args) },
    setTimeout, clearTimeout, setInterval, clearInterval,
  });
  vm.runInContext('globalThis.__NativePromise = Promise;', context);
  vm.runInContext(zoneSource, context, { filename: 'zone.umd.js' });
  vm.runInContext(webKitSource, context, { filename: 'webkit-clipboard-stub.js' });
  const webkit = context.__webkit;

  // Only editor/service dependencies are stubbed; Monaco's DeferredPromise, the
  // handler, writeText, ZoneAwarePromise and the native adoption path run unchanged.
  context.k = {
    CancellationError,
    getActiveWindow: () => ({ navigator: { clipboard: clipboardAvailable ? webkit : undefined } }),
    addDisposableListener: (target, type, handler) => {
      listeners.set(type, handler);
      return { dispose() {} };
    },
  };
  context.y = { Event: { runAndSubscribe: (event, handler, initial) => { handler(initial); return { dispose() {} }; } } };
  vm.runInContext(`globalThis.E = { DeferredPromise: ${deferredPromiseSource} };`, context, { filename: 'monaco-async-runtime.js' });
  vm.runInContext(
    `globalThis.ClipboardServiceUnderTest = class ClipboardServiceUnderTest {
      constructor(layoutService, logService) {
        this.layoutService = layoutService;
        this.logService = logService;
        this.mapTextToType = new Map();
        this._store = { add() {} };
        this.fallbackWrites = [];
        this.installWebKitWriteTextWorkaround();
      }
      _register(value) { return value; }
      clearResourcesState() {}
      fallbackWriteText(text) { this.fallbackWrites.push(text); }
      ${upstream ? workaroundSource.replace(patchedHandler, upstreamHandler) : workaroundSource}
      ${writeTextSource}
    };`,
    context,
    { filename: 'monaco-clipboard-runtime.js' },
  );
  const service = new context.ClipboardServiceUnderTest(
    { onDidAddContainer: {}, mainContainer: {} },
    { error: (error) => logErrors.push(error) },
  );

  return {
    service, webkit, consoleErrors, logErrors, CancellationError,
    dispatch: (type, { gesture = true } = {}) => {
      webkit.gesture = gesture;
      listeners.get(type)();
    },
    flush: () => new Promise((resolve) => setTimeout(resolve, 0)),
    // Values from the vm realm have foreign prototypes; copy them before deep-equal.
    copy: (values) => Array.from(values),
  };
}

// Worker entry: the test runner fails any test whose thread sees an unhandled
// rejection, so the reproduction runs in its own isolate and reports what escaped.
if (!isMainThread && workerData?.scenario === 'escape-then-key') {
  const unhandledRejections = [];
  process.on('unhandledRejection', (reason) => {
    unhandledRejections.push({ name: reason?.name, message: reason?.message, stack: String(reason?.stack ?? '') });
  });
  const harness = createHarness({ upstream: workerData.upstream });
  harness.dispatch('click');
  await harness.flush();
  harness.dispatch('keydown', { gesture: false }); // Escape: rejected before the item is read
  await harness.flush();
  const afterEscape = unhandledRejections.length;
  harness.dispatch('keydown'); // the next key supersedes the orphaned promise
  await harness.flush();
  await harness.flush();
  parentPort.postMessage({
    afterEscape,
    unhandledRejections,
    consoleErrors: harness.consoleErrors.map((args) => args.map(String).join(' ')),
    logErrors: harness.logErrors.map((error) => error?.name),
  });
}
