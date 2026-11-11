import { PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { userVisibleFailures } from './core/utils/user-visible-failure-reporter';
import { MonacoEditorComponent, MonacoLoadError } from './monaco-editor.component';

describe('MonacoEditorComponent loader failure handling', () => {
  let previousGlobals: ReturnType<typeof captureMonacoGlobals>;

  beforeEach(() => {
    previousGlobals = captureMonacoGlobals();
    resetMonacoGlobals();
    spyOn(userVisibleFailures, 'report');

    TestBed.configureTestingModule({
      imports: [MonacoEditorComponent],
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });
  });

  afterEach(() => {
    resetMonacoGlobals();
    restoreMonacoGlobals(previousGlobals);
    TestBed.resetTestingModule();
  });

  it('emits a handled loadFailed event and reports it when AMD require reports a module load error', async () => {
    const win = window as any;
    win.require = jasmine.createSpy('require').and.callFake((_deps: string[], _ok: () => void, fail: (error: unknown) => void) => {
      fail({ message: '[object Event]', phase: 'loading', moduleId: 'vs/editor/editor.main' });
    });
    win.require.config = jasmine.createSpy('config');

    const fixture = createComponent();
    const failed: MonacoLoadError[] = [];
    fixture.componentInstance.loadFailed.subscribe((error) => failed.push(error));

    fixture.detectChanges();
    await Promise.resolve();

    expect(failed.length).toBe(1);
    expect(failed[0]).toEqual(jasmine.objectContaining({
      message: 'Monaco editor assets failed to load.',
      phase: 'loading',
      moduleId: 'vs/editor/editor.main',
    }));
    expect(failed[0].url).toContain('/assets/monaco/min/vs/editor/editor.main.js');
    expect(userVisibleFailures.report).toHaveBeenCalledOnceWith('editor_load_failed', {
      reason: 'Monaco editor assets failed to load.',
      phase: 'loading',
      moduleId: 'vs/editor/editor.main',
      url: failed[0].url,
    });
  });

  it('lets the AMD loader download a failed Monaco module a second time', async () => {
    const fakeMonaco = makeFakeMonaco();
    (window as any).monaco = fakeMonaco.api;
    (window as any).require = jasmine.createSpy('require').and.callFake((_deps: string[], ok: () => void) => {
      ok();
    });
    (window as any).require.config = jasmine.createSpy('config');

    const fixture = createComponent();
    fixture.detectChanges();
    await Promise.resolve();

    const { paths } = (window as any).require.config.calls.mostRecent().args[0];
    expect(paths.vs).toEqual(['assets/monaco/min/vs', 'assets/monaco/min/vs']);
    expect(userVisibleFailures.report).not.toHaveBeenCalled();
  });

  it('loads the tokenizers of files opened later once per module, without surfacing failures', async () => {
    const fakeMonaco = makeFakeMonaco();
    (window as any).monaco = fakeMonaco.api;
    const requests: string[][] = [];
    (window as any).require = jasmine.createSpy('require').and.callFake(
      (deps: string[], ok: () => void, fail: (error: unknown) => void) => {
        if (deps[0] === 'vs/editor/editor.main') {
          ok();
          return;
        }
        requests.push(deps);
        fail(new Error('[object Event]'));
      },
    );
    (window as any).require.config = jasmine.createSpy('config');

    const firstFixture = createComponent();
    firstFixture.componentRef.setInput('preloadLanguages', ['typescript', 'html', 'css', 'json', 'plaintext']);
    firstFixture.detectChanges();
    await Promise.resolve();

    expect(requests).toEqual([[
      'vs/basic-languages/typescript/typescript',
      'vs/basic-languages/html/html',
      'vs/basic-languages/css/css',
    ]]);

    firstFixture.componentRef.setInput('preloadLanguages', ['vue', 'scss']);
    firstFixture.detectChanges();
    const secondFixture = createComponent();
    secondFixture.componentRef.setInput('preloadLanguages', ['html', 'scss']);
    secondFixture.detectChanges();
    await Promise.resolve();

    expect(requests).toEqual([
      jasmine.any(Array),
      ['vs/basic-languages/scss/scss'],
    ]);
    expect(userVisibleFailures.report).not.toHaveBeenCalled();
  });

  it('normalizes loader script errors and clears the cached promise so a later mount can retry', async () => {
    const firstFixture = createComponent();
    (firstFixture.componentInstance as any).amdLoaderPath = 'assets/missing-monaco-loader.js';
    const firstFailures: MonacoLoadError[] = [];
    firstFixture.componentInstance.loadFailed.subscribe((error) => firstFailures.push(error));

    firstFixture.detectChanges();
    const firstScript = currentLoaderScript();
    expect(firstScript).not.toBeNull();

    firstScript!.dispatchEvent(new Event('error'));
    await Promise.resolve();

    expect(firstFailures.length).toBe(1);
    expect(firstFailures[0]).toEqual(jasmine.objectContaining({
      message: 'Monaco AMD loader script failed to load.',
      phase: 'loading',
    }));
    expect((MonacoEditorComponent as any).loaderPromise).toBeNull();
    expect((window as any).__faMonacoLoaderPromise).toBeUndefined();

    firstFixture.destroy();
    const secondFixture = createComponent();
    (secondFixture.componentInstance as any).amdLoaderPath = 'assets/missing-monaco-loader.js';
    secondFixture.detectChanges();

    const secondScript = currentLoaderScript();
    expect(secondScript).not.toBeNull();
    expect(secondScript).not.toBe(firstScript);

    secondScript!.dispatchEvent(new Event('error'));
    await Promise.resolve();
    secondFixture.destroy();
  });

  it('emits ready after the AMD loader exposes a usable Monaco API', async () => {
    const fakeMonaco = makeFakeMonaco();
    (window as any).monaco = fakeMonaco.api;
    (window as any).require = jasmine.createSpy('require').and.callFake((_deps: string[], ok: () => void) => {
      ok();
    });
    (window as any).require.config = jasmine.createSpy('config');

    const fixture = createComponent({ width: 320, height: 180 });
    let readyCount = 0;
    const failures: MonacoLoadError[] = [];
    fixture.componentInstance.ready.subscribe(() => {
      readyCount += 1;
    });
    fixture.componentInstance.loadFailed.subscribe((error) => failures.push(error));

    fixture.detectChanges();
    await Promise.resolve();

    expect(failures).toEqual([]);
    expect(readyCount).toBe(1);
    expect((window as any).__faMonacoReady).toBeTrue();
    expect(fakeMonaco.api.editor.create.calls.mostRecent().args[1]).toEqual(
      jasmine.objectContaining({ occurrencesHighlight: 'off' }),
    );
  });

  it('configures Monaco to create a named worker from the absolute workerMain URL', async () => {
    const fakeMonaco = makeFakeMonaco();
    const worker = {} as Worker;
    const workerConstructor = spyOn(window, 'Worker').and.returnValue(worker);
    (window as any).monaco = fakeMonaco.api;
    (window as any).require = jasmine.createSpy('require').and.callFake((_deps: string[], ok: () => void) => {
      ok();
    });
    (window as any).require.config = jasmine.createSpy('config');

    const fixture = createComponent();
    fixture.detectChanges();
    await Promise.resolve();

    const createdWorker = (window as any).MonacoEnvironment.getWorker('workerMain.js', 'css');

    expect(createdWorker).toBe(worker);
    expect(workerConstructor).toHaveBeenCalledOnceWith(
      new URL('assets/monaco/min/vs/base/worker/workerMain.js', document.baseURI).toString(),
      { name: 'css' },
    );
  });

  it('configures both signature-help workers before the first model and reuses them on remount', async () => {
    const fakeMonaco = makeFakeMonaco();
    (window as any).monaco = fakeMonaco.api;
    (window as any).require = jasmine.createSpy('require').and.callFake((_deps: string[], ok: () => void) => {
      ok();
    });
    (window as any).require.config = jasmine.createSpy('config');

    const firstFixture = createComponent();
    firstFixture.detectChanges();
    await Promise.resolve();

    const customWorkerPath = new URL('assets/monaco/signature-help-worker.js', document.baseURI).toString();
    const { typescriptDefaults, javascriptDefaults } = fakeMonaco.api.languages.typescript;
    for (const defaults of [typescriptDefaults, javascriptDefaults]) {
      expect(defaults.setWorkerOptions).toHaveBeenCalledOnceWith({ customWorkerPath });
      expect(defaults.setWorkerOptions.calls.first().invocationOrder)
        .toBeLessThan(fakeMonaco.api.editor.createModel.calls.first().invocationOrder);
    }

    firstFixture.destroy();
    const secondFixture = createComponent();
    secondFixture.detectChanges();
    await Promise.resolve();

    expect(fakeMonaco.api.editor.create).toHaveBeenCalledTimes(2);
    for (const defaults of [typescriptDefaults, javascriptDefaults]) {
      expect(defaults.setWorkerOptions).toHaveBeenCalledTimes(1);
    }
    secondFixture.destroy();
  });

  it('gives the editor typings it can parse, with the Angular signal API a candidate imports', async () => {
    const fakeMonaco = makeFakeMonaco();
    (window as any).monaco = fakeMonaco.api;
    (window as any).require = jasmine.createSpy('require').and.callFake((_deps: string[], ok: () => void) => {
      ok();
    });
    (window as any).require.config = jasmine.createSpy('config');

    const fixture = createComponent();
    fixture.detectChanges();
    await Promise.resolve();

    const libs = new Map<string, string>(
      fakeMonaco.api.languages.typescript.typescriptDefaults.addExtraLib.calls.allArgs()
        .map(([content, path]: [string, string]) => [path, content]),
    );
    // Lines joined with a literal backslash-n made each file one line of invalid characters for the worker.
    for (const [path, content] of libs) expect(content).withContext(path).not.toContain('\\n');
    const angularCore = libs.get('file:///node_modules/@angular/core/index.d.ts') ?? '';
    expect(angularCore.split('\n').length).toBeGreaterThan(40);
    for (const name of ['signal', 'computed', 'input', 'output', 'model', 'viewChild', 'ChangeDetectionStrategy']) {
      expect(angularCore).withContext(name).toMatch(new RegExp(`export (function|const|enum) ${name}\\b`));
    }
    fixture.destroy();
  });

  it('applies comments with AA contrast before rendering the default dark editor', async () => {
    const fakeMonaco = makeFakeMonaco();
    (window as any).monaco = fakeMonaco.api;
    (window as any).__faMonacoReady = true;

    const fixture = createComponent({ width: 320, height: 180 });
    fixture.detectChanges();
    await Promise.resolve();

    const [themeName, theme] = fakeMonaco.api.editor.defineTheme.calls.mostRecent().args;
    const commentColor = theme.rules.find((rule: { token: string }) => rule.token === 'comment').foreground;
    const sharedMutedColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--uf-text-tertiary').trim().replace(/^#/, '');
    expect(commentColor).toBe(sharedMutedColor);
    expect(contrastRatio(commentColor, '1e1e1e')).toBeGreaterThanOrEqual(4.5);
    expect(theme.base).toBe('vs-dark');
    expect(theme.inherit).toBeTrue();
    expect(fakeMonaco.api.editor.setTheme).toHaveBeenCalledWith(themeName);
    expect(fakeMonaco.api.editor.create.calls.mostRecent().args[1].theme).toBe(themeName);
    expect(fakeMonaco.api.editor.defineTheme.calls.first().invocationOrder)
      .toBeLessThan(fakeMonaco.api.editor.create.calls.first().invocationOrder);
  });

  for (const source of ['theme', 'options'] as const) {
    it(`uses accessible regexp colors only when the interview theme is selected through ${source}`, async () => {
      const fakeMonaco = makeFakeMonaco();
      (window as any).monaco = fakeMonaco.api;
      (window as any).__faMonacoReady = true;
      const fixture = createComponent({ width: 320, height: 180 });
      fixture.componentRef.setInput(source, source === 'theme' ? 'fa-interview-dark' : { theme: 'fa-interview-dark' });
      fixture.detectChanges();
      await Promise.resolve();
      const [name, theme] = fakeMonaco.api.editor.defineTheme.calls.mostRecent().args;
      expect(name).toBe('fa-interview-dark');
      expect(fakeMonaco.api.editor.create.calls.mostRecent().args[1].theme).toBe(name);
      const regexpColor = theme.rules.find((rule: { token: string }) => rule.token === 'regexp').foreground;
      expect(contrastRatio(regexpColor, '1e1e1e')).toBeGreaterThanOrEqual(4.5);
    });
  }

  for (const customTheme of ['vs', 'hc-black']) {
    it(`preserves an explicit ${customTheme} theme and can switch back to the accessible default`, async () => {
      const fakeMonaco = makeFakeMonaco();
      (window as any).monaco = fakeMonaco.api;
      (window as any).__faMonacoReady = true;

      const fixture = createComponent({ width: 320, height: 180 });
      const defaultTheme = fixture.componentInstance.theme;
      fixture.componentRef.setInput('theme', customTheme);
      fixture.detectChanges();
      await Promise.resolve();

      expect(fakeMonaco.api.editor.create.calls.mostRecent().args[1].theme).toBe(customTheme);
      expect(fakeMonaco.api.editor.setTheme).toHaveBeenCalledWith(customTheme);

      fixture.componentRef.setInput('theme', defaultTheme);
      fixture.detectChanges();

      expect(fakeMonaco.api.editor.setTheme.calls.mostRecent().args).toEqual([defaultTheme]);
      expect(fakeMonaco.api.editor.defineTheme.calls.mostRecent().args[0]).toBe(defaultTheme);
    });
  }

  it('disposes the editor and model once when the fixture is destroyed', async () => {
    const fakeMonaco = makeFakeMonaco();
    (window as any).monaco = fakeMonaco.api;
    (window as any).require = jasmine.createSpy('require').and.callFake((_deps: string[], ok: () => void) => {
      ok();
    });
    (window as any).require.config = jasmine.createSpy('config');

    const fixture = createComponent();
    fixture.detectChanges();
    await Promise.resolve();

    expect(fakeMonaco.api.editor.create).toHaveBeenCalledTimes(1);
    expect(fakeMonaco.api.editor.createModel).toHaveBeenCalledTimes(1);

    fixture.destroy();

    expect(fakeMonaco.editor.dispose).toHaveBeenCalledTimes(1);
    expect(fakeMonaco.model.dispose).toHaveBeenCalledTimes(1);
  });

  it('gives TypeScript the workspace files around the open one at their own paths, and follows file switches and edits', async () => {
    const fakeMonaco = makeFakeMonaco();
    (window as any).monaco = fakeMonaco.api;
    (window as any).require = jasmine.createSpy('require').and.callFake((_deps: string[], ok: () => void) => {
      ok();
    });
    (window as any).require.config = jasmine.createSpy('config');
    const addExtraLib = fakeMonaco.api.languages.typescript.typescriptDefaults.addExtraLib;
    const removed: string[] = [];
    addExtraLib.and.callFake((_content: string, path: string) => ({ dispose: () => removed.push(path) }));
    const added = () => addExtraLib.calls.allArgs()
      .filter(([, path]: [string, string]) => path.startsWith('file:///src/'))
      .map(([content, path]: [string, string]) => `${path}: ${content}`);
    const types = 'export type Point = { x: number; y: number };';

    const fixture = createComponent();
    fixture.componentRef.setInput('language', 'typescript');
    fixture.componentRef.setInput('modelKey', '/src/app/snake.component.ts');
    fixture.componentRef.setInput('siblingFiles', {
      '/src/app/types.ts': types,
      '/src/app/snake.component.html': '<canvas></canvas>',
    });
    fixture.detectChanges();
    await Promise.resolve();

    // Only TypeScript files go to the worker, and before the model that imports them.
    expect(added()).toEqual([`file:///src/app/types.ts: ${types}`]);
    const siblingCall = addExtraLib.calls.all().find((call: any) => call.args[1] === 'file:///src/app/types.ts');
    expect(siblingCall?.invocationOrder)
      .toBeLessThan(fakeMonaco.api.editor.createModel.calls.first().invocationOrder);

    // Opening types.ts takes it out of the siblings and puts the edited component in.
    fixture.componentRef.setInput('modelKey', '/src/app/types.ts');
    fixture.componentRef.setInput('siblingFiles', { '/src/app/snake.component.ts': 'edited component' });
    fixture.detectChanges();
    expect(removed).toEqual(['file:///src/app/types.ts']);
    expect(added()).toEqual([
      `file:///src/app/types.ts: ${types}`,
      'file:///src/app/snake.component.ts: edited component',
    ]);

    // The same sibling content adds nothing; new content replaces the lib.
    fixture.componentRef.setInput('siblingFiles', { '/src/app/snake.component.ts': 'edited component' });
    fixture.detectChanges();
    fixture.componentRef.setInput('siblingFiles', { '/src/app/snake.component.ts': 'edited again' });
    fixture.detectChanges();
    expect(added().length).toBe(3);
    expect(added()[2]).toBe('file:///src/app/snake.component.ts: edited again');

    fixture.destroy();
    expect(removed).toEqual(['file:///src/app/types.ts', 'file:///src/app/snake.component.ts']);
  });

  it('attaches a replacement model before disposing the previous model', () => {
    const fakeMonaco = makeFakeMonaco();
    const order: string[] = [];
    const previousModel = {
      uri: { toString: () => 'file:///question.js' },
      dispose: jasmine.createSpy('disposePrevious').and.callFake(() => order.push('dispose')),
    };
    const replacementModel = {
      uri: { toString: () => 'file:///question.ts' },
      getValue: () => 'next',
      setValue: jasmine.createSpy('setValue'),
      dispose: jasmine.createSpy('disposeReplacement'),
    };
    fakeMonaco.api.editor.createModel.and.returnValue(replacementModel);
    fakeMonaco.editor.setModel.and.callFake(() => order.push('attach'));
    (window as any).monaco = fakeMonaco.api;

    const fixture = createComponent();
    const component = fixture.componentInstance;
    component.modelKey = 'question';
    component.language = 'typescript';
    (component as any).editor = fakeMonaco.editor;
    (component as any).model = previousModel;

    (component as any).createOrSwapModel('typescript', 'next');

    expect(fakeMonaco.editor.setModel).toHaveBeenCalledOnceWith(replacementModel);
    expect(previousModel.dispose).toHaveBeenCalledTimes(1);
    expect(order).toEqual(['attach', 'dispose']);
  });

  function createComponent(size: { width?: number; height?: number } = {}): ComponentFixture<MonacoEditorComponent> {
    const fixture = TestBed.createComponent(MonacoEditorComponent);
    const container = fixture.componentInstance.container.nativeElement;
    Object.defineProperty(container, 'clientWidth', {
      configurable: true,
      value: size.width ?? 0,
    });
    Object.defineProperty(container, 'clientHeight', {
      configurable: true,
      value: size.height ?? 0,
    });
    return fixture;
  }

  function currentLoaderScript(): HTMLScriptElement | null {
    return document.querySelector<HTMLScriptElement>('script[data-fa-monaco-loader]');
  }

  function captureMonacoGlobals() {
    const win = window as any;
    return {
      require: win.require,
      monaco: win.monaco,
      faMonacoReady: win.__faMonacoReady,
      faMonacoLoaderPromise: win.__faMonacoLoaderPromise,
      monacoEnvironment: win.MonacoEnvironment,
      loaderPromise: (MonacoEditorComponent as any).loaderPromise,
      monacoReady: (MonacoEditorComponent as any).monacoReady,
      webCompletionsInstalled: (MonacoEditorComponent as any).webCompletionsInstalled,
      requestedLanguageModules: (MonacoEditorComponent as any).requestedLanguageModules,
    };
  }

  function restoreMonacoGlobals(snapshot: ReturnType<typeof captureMonacoGlobals>): void {
    const win = window as any;
    win.require = snapshot.require;
    win.monaco = snapshot.monaco;
    restoreOptionalGlobal(win, '__faMonacoReady', snapshot.faMonacoReady);
    restoreOptionalGlobal(win, '__faMonacoLoaderPromise', snapshot.faMonacoLoaderPromise);
    restoreOptionalGlobal(win, 'MonacoEnvironment', snapshot.monacoEnvironment);
    (MonacoEditorComponent as any).loaderPromise = snapshot.loaderPromise;
    (MonacoEditorComponent as any).monacoReady = snapshot.monacoReady;
    (MonacoEditorComponent as any).webCompletionsInstalled = snapshot.webCompletionsInstalled;
    (MonacoEditorComponent as any).requestedLanguageModules = snapshot.requestedLanguageModules;
  }

  function restoreOptionalGlobal(
    win: Record<string, unknown>,
    key: string,
    value: unknown,
  ): void {
    if (value === undefined) delete win[key];
    else win[key] = value;
  }

  function resetMonacoGlobals(): void {
    document.querySelectorAll('script[data-fa-monaco-loader], script[src*="monaco/min/vs/loader.js"]').forEach((script) => script.remove());
    (window as any).require = undefined;
    (window as any).monaco = undefined;
    delete (window as any).__faMonacoReady;
    delete (window as any).__faMonacoLoaderPromise;
    delete (window as any).MonacoEnvironment;
    (MonacoEditorComponent as any).loaderPromise = null;
    (MonacoEditorComponent as any).monacoReady = false;
    (MonacoEditorComponent as any).webCompletionsInstalled = false;
    (MonacoEditorComponent as any).requestedLanguageModules = new Set<string>();
  }

  function makeFakeMonaco(): { api: any; editor: any; model: any } {
    const model = {
      uri: { toString: () => 'file:///fa-1.js' },
      getValue: () => '',
      setValue: jasmine.createSpy('setValue'),
      dispose: jasmine.createSpy('dispose'),
    };
    const editor = {
      addCommand: jasmine.createSpy('addCommand'),
      onDidChangeModelContent: jasmine.createSpy('onDidChangeModelContent'),
      onMouseDown: jasmine.createSpy('onMouseDown'),
      updateOptions: jasmine.createSpy('updateOptions'),
      layout: jasmine.createSpy('layout'),
      getContentHeight: () => 24,
      dispose: jasmine.createSpy('dispose'),
      deltaDecorations: jasmine.createSpy('deltaDecorations').and.returnValue([]),
      getValue: () => '',
      setModel: jasmine.createSpy('setModel'),
    };
    const typescriptDefaults = makeTypescriptDefaults();
    const javascriptDefaults = makeTypescriptDefaults();

    const api = {
      editor: {
        ContextKeyExpr: { has: () => ({}) },
        create: jasmine.createSpy('create').and.returnValue(editor),
        createModel: jasmine.createSpy('createModel').and.returnValue(model),
        getModel: jasmine.createSpy('getModel').and.returnValue(null),
        setModelLanguage: jasmine.createSpy('setModelLanguage'),
        setTheme: jasmine.createSpy('setTheme'),
        defineTheme: jasmine.createSpy('defineTheme'),
      },
      languages: {
        registerCompletionItemProvider: jasmine.createSpy('registerCompletionItemProvider'),
        typescript: {
          typescriptDefaults,
          javascriptDefaults,
          ScriptTarget: { ES2020: 'ES2020' },
          ModuleKind: { ESNext: 'ESNext' },
          ModuleResolutionKind: { Bundler: 'Bundler' },
          JsxEmit: { ReactJSX: 'ReactJSX' },
        },
        CompletionItemKind: {
          Class: 'Class',
          Snippet: 'Snippet',
          Value: 'Value',
        },
        CompletionItemInsertTextRule: {
          InsertAsSnippet: 'InsertAsSnippet',
        },
      },
      KeyCode: {
        Enter: 3,
        Tab: 2,
      },
      Range: class {
        constructor(
          readonly startLineNumber: number,
          readonly startColumn: number,
          readonly endLineNumber: number,
          readonly endColumn: number,
        ) { }
      },
      Uri: {
        parse: (value: string) => ({ toString: () => value }),
      },
    };

    return { api, editor, model };
  }

  function contrastRatio(foreground: string, background: string): number {
    const luminance = (hex: string) => {
      const channels = [0, 2, 4].map((offset) => {
        const channel = parseInt(hex.slice(offset, offset + 2), 16) / 255;
        return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      });
      return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    };
    const foregroundLuminance = luminance(foreground);
    const backgroundLuminance = luminance(background);
    return (Math.max(foregroundLuminance, backgroundLuminance) + 0.05)
      / (Math.min(foregroundLuminance, backgroundLuminance) + 0.05);
  }

  function makeTypescriptDefaults(): any {
    return {
      setWorkerOptions: jasmine.createSpy('setWorkerOptions'),
      setEagerModelSync: jasmine.createSpy('setEagerModelSync'),
      addExtraLib: jasmine.createSpy('addExtraLib'),
      setCompilerOptions: jasmine.createSpy('setCompilerOptions'),
      setDiagnosticsOptions: jasmine.createSpy('setDiagnosticsOptions'),
    };
  }
});
