import { PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MonacoEditorComponent, MonacoLoadError } from './monaco-editor.component';

describe('MonacoEditorComponent loader failure handling', () => {
  beforeEach(() => {
    resetMonacoGlobals();

    TestBed.configureTestingModule({
      imports: [MonacoEditorComponent],
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });
  });

  afterEach(() => {
    resetMonacoGlobals();
    TestBed.resetTestingModule();
  });

  it('emits a handled loadFailed event when AMD require reports a module load error', async () => {
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

  function makeTypescriptDefaults(): any {
    return {
      setEagerModelSync: jasmine.createSpy('setEagerModelSync'),
      addExtraLib: jasmine.createSpy('addExtraLib'),
      setCompilerOptions: jasmine.createSpy('setCompilerOptions'),
      setDiagnosticsOptions: jasmine.createSpy('setDiagnosticsOptions'),
    };
  }
});
