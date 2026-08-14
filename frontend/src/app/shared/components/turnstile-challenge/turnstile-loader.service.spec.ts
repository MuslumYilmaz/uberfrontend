import { DOCUMENT } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { fakeAsync, flushMicrotasks, TestBed, tick } from '@angular/core/testing';
import { TurnstileLoaderService } from './turnstile-loader.service';
import { TurnstileApi, TurnstileWindow } from './turnstile-challenge.types';

describe('TurnstileLoaderService', () => {
  const scriptSelector = '#cloudflare-turnstile-script';
  const browserWindow = window as TurnstileWindow;
  let originalApi: TurnstileApi | undefined;
  let loaderDocument: Document;

  beforeEach(() => {
    originalApi = browserWindow.turnstile;
    delete browserWindow.turnstile;
    loaderDocument = document.implementation.createHTMLDocument('turnstile-loader-test');
    Object.defineProperty(loaderDocument, 'defaultView', { value: window });
    TestBed.configureTestingModule({
      providers: [{ provide: DOCUMENT, useValue: loaderDocument }],
    });
  });

  afterEach(() => {
    loaderDocument.querySelector(scriptSelector)?.remove();
    if (originalApi) browserWindow.turnstile = originalApi;
    else delete browserWindow.turnstile;
    TestBed.resetTestingModule();
  });

  it('resolves an existing browser API without inserting a script', async () => {
    const api = jasmine.createSpyObj<TurnstileApi>('TurnstileApi', ['render', 'reset', 'remove']);
    browserWindow.turnstile = api;

    const loader = TestBed.inject(TurnstileLoaderService);

    await expectAsync(loader.load()).toBeResolvedTo(api);
    expect(loaderDocument.querySelector(scriptSelector)).toBeNull();
  });

  it('inserts one explicit-render script and shares the in-flight load', async () => {
    const loader = TestBed.inject(TurnstileLoaderService);
    const firstLoad = loader.load();
    const secondLoad = loader.load();
    const script = loaderDocument.querySelector(scriptSelector) as HTMLScriptElement | null;

    expect(firstLoad).toBe(secondLoad);
    expect(loaderDocument.querySelectorAll(scriptSelector).length).toBe(1);
    expect(script?.src).toBe('https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit');
    expect(script?.async).toBeTrue();
    expect(script?.defer).toBeTrue();

    const api = jasmine.createSpyObj<TurnstileApi>('TurnstileApi', ['render', 'reset', 'remove']);
    browserWindow.turnstile = api;
    script?.dispatchEvent(new Event('load'));

    await expectAsync(firstLoad).toBeResolvedTo(api);
  });

  it('times out a stalled request, removes it, and allows a clean retry', fakeAsync(() => {
    const loader = TestBed.inject(TurnstileLoaderService);
    const stalledLoad = loader.load();
    const stalledScript = loaderDocument.querySelector(scriptSelector) as HTMLScriptElement | null;
    let rejectionMessage = '';
    void stalledLoad.catch((error: unknown) => {
      rejectionMessage = error instanceof Error ? error.message : String(error);
    });

    tick(10_000);

    expect(rejectionMessage).toBe('Turnstile script loading timed out.');
    expect(stalledScript?.isConnected).toBeFalse();
    expect(loaderDocument.querySelector(scriptSelector)).toBeNull();

    const retryLoad = loader.load();
    const retryScript = loaderDocument.querySelector(scriptSelector) as HTMLScriptElement | null;
    expect(retryLoad).not.toBe(stalledLoad);
    expect(retryScript).toBeTruthy();
    expect(retryScript).not.toBe(stalledScript);

    const api = jasmine.createSpyObj<TurnstileApi>('TurnstileApi', ['render', 'reset', 'remove']);
    let resolvedApi: TurnstileApi | undefined;
    void retryLoad.then((resolved) => {
      resolvedApi = resolved;
    });
    browserWindow.turnstile = api;
    retryScript?.dispatchEvent(new Event('load'));
    flushMicrotasks();

    expect(resolvedApi).toBe(api);
  }));

  it('does not touch the document when instantiated for server rendering', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: DOCUMENT, useValue: loaderDocument },
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    });
    const loader = TestBed.inject(TurnstileLoaderService);

    expect(loader.isBrowser).toBeFalse();
    await expectAsync(loader.load()).toBeRejectedWithError(
      Error,
      'Turnstile can only be loaded in a browser.',
    );
    expect(loaderDocument.querySelector(scriptSelector)).toBeNull();
  });
});
