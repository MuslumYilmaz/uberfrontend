import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ExperimentService } from '../../../../core/services/experiment.service';
import { DecisionGraphService } from '../../../../core/services/decision-graph.service';
import type { ConsoleEntry, TestResult } from '../../console-logger/console-logger.component';
import { CodingJsPanelComponent } from './coding-js-panel.component';

class RunnerStub {
  lastArgs?: { userCode: string; testCode: string; timeoutMs?: number };
  runWithTests = jasmine.createSpy('runWithTests').and.callFake(async (args) => {
    this.lastArgs = args;
    return {
      entries: [{ level: 'log', message: 'first', timestamp: 1 }],
      results: [{ name: 'ok', passed: true }],
    } as { entries: ConsoleEntry[]; results: TestResult[] };
  });
}

class EmptyRunnerStub {
  runWithTests = jasmine.createSpy('runWithTests').and.resolveTo({
    entries: [],
    results: [],
  } as { entries: ConsoleEntry[]; results: TestResult[] });
}

class TimedOutRunnerStub {
  runWithTests = jasmine.createSpy('runWithTests').and.resolveTo({
    entries: [{
      level: 'error',
      message: 'Sandbox was force-stopped after 2000ms because execution blocked the worker.',
      timestamp: 1,
    }],
    results: [],
    timedOut: true,
    error: 'Sandbox was force-stopped after 2000ms because execution blocked the worker.',
  } as { entries: ConsoleEntry[]; results: TestResult[]; timedOut: boolean; error: string });
}

class CrashedRunnerStub {
  runWithTests = jasmine.createSpy('runWithTests').and.resolveTo({
    entries: [{ level: 'error', message: 'Worker crashed', timestamp: 1 }],
    results: [],
    error: 'Worker crashed',
  } as { entries: ConsoleEntry[]; results: TestResult[]; error: string });
}

describe('CodingJsPanelComponent', () => {
  let decisionGraphService: jasmine.SpyObj<DecisionGraphService>;

  beforeEach(() => {
    decisionGraphService = jasmine.createSpyObj<DecisionGraphService>('DecisionGraphService', ['load']);
    decisionGraphService.load.and.returnValue(of(null));

    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: ExperimentService, useValue: null },
        { provide: DecisionGraphService, useValue: decisionGraphService },
      ],
    });
  });

  it('runs tests with the latest editor buffers and updates state', async () => {
    const runner = new RunnerStub();
    const component = TestBed.runInInjectionContext(
      () => new CodingJsPanelComponent({} as any),
    );
    (component as any).loadRunner = async () => runner;
    component.question = { id: 'unique' } as any;
    component.disablePersistence = true;

    component.editorContent.set('old code');
    component.testCode.set('old tests');
    component.codeEditor = {
      getValue: () => "export default function unique(arr) { console.log('first'); }",
    } as any;
    component.testsEditor = {
      getValue: () => "test('ok', () => expect(1).toBe(1));",
    } as any;

    let lastConsole: ConsoleEntry[] = [];
    component.consoleEntriesChange.subscribe((entries) => {
      lastConsole = entries ?? [];
    });

    await component.runTests();

    expect(runner.runWithTests).toHaveBeenCalled();
    expect(runner.lastArgs?.userCode).toContain("console.log('first')");
    expect(component.editorContent()).toContain("console.log('first')");
    expect(component.testCode()).toContain("test('ok'");
    expect(component.consoleEntries().length).toBe(1);
    expect(component.testResults().length).toBe(1);
    expect(component.hasRunTests()).toBe(true);
    expect(lastConsole.length).toBe(1);
  });

  it('clears stale test results when loading a different question', async () => {
    const codeStoreStub = {
      getJsAsync: jasmine.createSpy('getJsAsync').and.resolveTo(null),
      cloneJsBundleAsync: jasmine.createSpy('cloneJsBundleAsync').and.resolveTo(true),
      setJsBaselineAsync: jasmine.createSpy('setJsBaselineAsync').and.resolveTo(undefined),
      getJsLangStateAsync: jasmine.createSpy('getJsLangStateAsync').and.resolveTo({
        code: '',
        baseline: '',
        dirty: false,
        hasUserCode: false,
      }),
      getJsForLangAsync: jasmine.createSpy('getJsForLangAsync').and.callFake(async (_key: string, lang: 'js' | 'ts') => {
        return lang === 'js' ? 'const value = 1;' : 'const value: number = 1;';
      }),
      saveJsAsync: jasmine.createSpy('saveJsAsync').and.resolveTo(undefined),
      initJsAsync: jasmine.createSpy('initJsAsync').and.resolveTo({
        initial: 'const hydrated = true;',
        restored: false,
      }),
      setLastLangAsync: jasmine.createSpy('setLastLangAsync').and.resolveTo(undefined),
    };

    const component = TestBed.runInInjectionContext(
      () => new CodingJsPanelComponent(codeStoreStub as any),
    );

    component.disablePersistence = false;
    component.question = {
      id: 'question-a',
      starterCode: 'export default function one() { return 1; }',
      starterCodeTs: 'export default function one(): number { return 1; }',
      tests: "test('one', () => expect(1).toBe(1));",
      testsTs: "test('one', () => expect(1).toBe(1));",
    } as any;

    component.hasRunTests.set(true);
    component.isRunningTests.set(true);
    component.testResults.set([{ name: 'stale result', passed: false }]);
    component.consoleEntries.set([{ level: 'error', message: 'stale log', timestamp: Date.now() }]);
    component.subTab.set('console');

    let emittedResults: TestResult[] | null = null;
    let emittedConsole: ConsoleEntry[] | null = null;
    component.testResultsChange.subscribe((results) => (emittedResults = results));
    component.consoleEntriesChange.subscribe((entries) => (emittedConsole = entries));

    await component.initFromQuestion();

    expect(component.hasRunTests()).toBe(false);
    expect(component.isRunningTests()).toBe(false);
    expect(component.testResults()).toEqual([]);
    expect(component.consoleEntries()).toEqual([]);
    expect(component.subTab()).toBe('tests');
    expect(emittedResults).not.toBeNull();
    expect(emittedConsole).not.toBeNull();
    expect(emittedResults ?? []).toEqual([]);
    expect(emittedConsole ?? []).toEqual([]);
  });

  it('loads sidecar decision graph and decorates Monaco lines in solution mode', async () => {
    const graphCode = [
      'export default function debounce(fn, delay, { leading = false } = {}) {',
      '  let timeoutId;',
      '  let lastArgs;',
      '  let lastThis;',
      '',
      '  return function (...args) {',
      '    lastArgs = args;',
      '    lastThis = this;',
      '    const shouldCallNow = leading && !timeoutId;',
      '    if (timeoutId) clearTimeout(timeoutId);',
      '  };',
      '}',
    ].join('\n');

    decisionGraphService.load.and.returnValue(of({
      questionId: 'js-debounce',
      version: 1,
      language: 'javascript',
      code: graphCode,
      nodes: [
        {
          id: 'd1',
          title: 'Leading gate',
          anchor: {
            lineStart: 9,
            lineEnd: 9,
            snippet: 'const shouldCallNow = leading && !timeoutId',
          },
          why: 'Prevent duplicate immediate calls.',
          alternative: 'Use timestamps.',
          tradeoff: 'Simpler timer-state gate.',
        },
      ],
    } as any));

    const component = TestBed.runInInjectionContext(
      () => new CodingJsPanelComponent({} as any),
    );
    component.disablePersistence = true;
    component.question = {
      id: 'js-debounce',
      starterCode: 'export default function debounce(fn, delay) {}',
      tests: "test('noop', () => expect(true).toBe(true));",
      decisionGraphAsset: 'assets/questions/javascript/decision-graphs/js-debounce.v1.json',
    } as any;

    const setLineHighlights = jasmine.createSpy('setLineHighlights');
    const clearLineHighlights = jasmine.createSpy('clearLineHighlights');
    const revealLine = jasmine.createSpy('revealLine');
    component.codeEditor = {
      setLineHighlights,
      clearLineHighlights,
      revealLine,
    } as any;
    component.codeEditorReady.set(true);
    component.topTab.set('tests');

    await component.initFromQuestion();
    expect(decisionGraphService.load).toHaveBeenCalledWith(
      'assets/questions/javascript/decision-graphs/js-debounce.v1.json',
    );

    await component.applySolution(graphCode);
    await Promise.resolve();

    expect(component.decisionGraphVisible()).toBeTrue();
    expect(component.topTab()).toBe('code');
    expect(setLineHighlights).toHaveBeenCalled();
    expect(revealLine).toHaveBeenCalledWith(9);

    const highlightBatch = setLineHighlights.calls.mostRecent().args[0];
    expect(highlightBatch[0]).toEqual(jasmine.objectContaining({
      start: 9,
      end: 9,
    }));
  });

  it('loads shared sidecar with approach key when provided', async () => {
    const graphCode = 'export default function debounce(fn, delay) { return fn; }';

    decisionGraphService.load.and.returnValue(of({
      questionId: 'js-debounce',
      version: 1,
      key: 'approach2',
      language: 'javascript',
      code: graphCode,
      nodes: [
        {
          id: 'd1',
          title: 'Approach 2 marker',
          anchor: { lineStart: 1, lineEnd: 1, snippet: 'return fn;' },
          why: 'why',
          alternative: 'alt',
          tradeoff: 'tradeoff',
        },
      ],
    } as any));

    const component = TestBed.runInInjectionContext(
      () => new CodingJsPanelComponent({} as any),
    );
    component.disablePersistence = true;
    component.question = {
      id: 'js-debounce',
      starterCode: 'export default function debounce(fn, delay) {}',
      tests: '',
      decisionGraphAsset: 'assets/questions/javascript/decision-graphs/js-debounce.v1.json',
    } as any;

    await component.applySolution(graphCode, {
      decisionGraphAsset: 'assets/questions/javascript/decision-graphs/js-debounce.v1.json',
      decisionGraphKey: 'approach2',
    });

    expect(decisionGraphService.load).toHaveBeenCalledWith(
      'assets/questions/javascript/decision-graphs/js-debounce.v1.json',
      'approach2',
    );
    expect(component.decisionGraphDoc()?.key).toBe('approach2');
  });

  it('reverts to the exact pre-solution draft instead of starter boilerplate', async () => {
    const codeStoreStub = {
      saveJsAsync: jasmine.createSpy('saveJsAsync').and.resolveTo(undefined),
      setLastLangAsync: jasmine.createSpy('setLastLangAsync').and.resolveTo(undefined),
    };

    const component = TestBed.runInInjectionContext(
      () => new CodingJsPanelComponent(codeStoreStub as any),
    );
    component.disablePersistence = false;
    component.question = {
      id: 'js-revert',
      starterCode: 'export default function noop() {}',
      starterCodeTs: 'export default function noop(): void {}',
      tests: '',
      testsTs: '',
    } as any;

    const draftCode = 'export default function noop() { return 42; }';
    const solutionCode = 'export default function noop() { return 99; }';
    component.jsLang.set('js');
    component.editorContent.set(draftCode);

    await component.applySolution(solutionCode);
    await component.revertToUserCodeFromBanner();

    expect(component.editorContent()).toBe(draftCode);
    expect(component.editorContent()).not.toBe('export default function noop() {}');
    expect(component.viewingSolution()).toBeFalse();
    expect(component.canRevertToUserCode()).toBeFalse();
    expect(component.restoreDismissed()).toBeTrue();
    expect(codeStoreStub.saveJsAsync.calls.mostRecent().args[1]).toBe(draftCode);
    expect(codeStoreStub.saveJsAsync.calls.mostRecent().args[2]).toBe('js');
    expect(codeStoreStub.saveJsAsync.calls.mostRecent().args[3]).toEqual({ force: true });
    expect(codeStoreStub.setLastLangAsync).toHaveBeenCalled();
  });

  it('keeps the original revert snapshot across repeated applySolution calls', async () => {
    const component = TestBed.runInInjectionContext(
      () => new CodingJsPanelComponent({} as any),
    );
    component.disablePersistence = true;
    component.question = {
      id: 'js-reapply',
      starterCode: 'export default function example() {}',
      starterCodeTs: 'export default function example(): void {}',
      tests: '',
      testsTs: '',
    } as any;

    const draftCode = 'export default function example() { return "draft"; }';
    component.jsLang.set('js');
    component.editorContent.set(draftCode);

    await component.applySolution('export default function example() { return "solution-1"; }');
    await component.applySolution('export default function example() { return "solution-2"; }');
    await component.revertToUserCodeFromBanner();

    expect(component.editorContent()).toBe(draftCode);
    expect(component.viewingSolution()).toBeFalse();
    expect(component.canRevertToUserCode()).toBeFalse();
  });

  it('restores code rationale visibility after refresh when stored code matches canonical rationale code', async () => {
    const graphCode = [
      'export default function debounce(fn, delay, { leading = false } = {}) {',
      '  let timeoutId;',
      '  let lastArgs;',
      '  let lastThis;',
      '',
      '  return function (...args) {',
      '    lastArgs = args;',
      '    lastThis = this;',
      '    const shouldCallNow = leading && !timeoutId;',
      '    if (timeoutId) clearTimeout(timeoutId);',
      '    timeoutId = setTimeout(() => {',
      '      timeoutId = undefined;',
      '      if (!leading) fn.apply(lastThis, lastArgs);',
      '    }, delay);',
      '    if (shouldCallNow) fn.apply(lastThis, lastArgs);',
      '  };',
      '}',
    ].join('\n');

    decisionGraphService.load.and.returnValue(of({
      questionId: 'js-debounce',
      version: 1,
      language: 'javascript',
      code: graphCode,
      nodes: [
        {
          id: 'd1',
          title: 'Leading gate',
          anchor: {
            lineStart: 9,
            lineEnd: 9,
            snippet: 'const shouldCallNow = leading && !timeoutId',
          },
          why: 'why',
          alternative: 'alt',
          tradeoff: 'tradeoff',
        },
      ],
    } as any));

    const codeStoreStub = {
      getJsAsync: jasmine.createSpy('getJsAsync').and.resolveTo(null),
      cloneJsBundleAsync: jasmine.createSpy('cloneJsBundleAsync').and.resolveTo(true),
      setJsBaselineAsync: jasmine.createSpy('setJsBaselineAsync').and.resolveTo(undefined),
      getJsLangStateAsync: jasmine.createSpy('getJsLangStateAsync').and.callFake(async (_key: string, lang: 'js' | 'ts') => ({
        code: graphCode,
        baseline: graphCode,
        dirty: lang === 'js',
        hasUserCode: lang === 'js',
      })),
      getJsForLangAsync: jasmine.createSpy('getJsForLangAsync').and.callFake(async (_key: string, lang: 'js' | 'ts') => {
        if (lang === 'js') return graphCode;
        return 'export default function debounce<F extends (...a: any[]) => void>(fn: F, delay: number): F { return fn; }';
      }),
      saveJsAsync: jasmine.createSpy('saveJsAsync').and.resolveTo(undefined),
      initJsAsync: jasmine.createSpy('initJsAsync').and.resolveTo({
        initial: graphCode,
        restored: true,
      }),
      setLastLangAsync: jasmine.createSpy('setLastLangAsync').and.resolveTo(undefined),
    };

    const component = TestBed.runInInjectionContext(
      () => new CodingJsPanelComponent(codeStoreStub as any),
    );
    component.disablePersistence = false;
    component.question = {
      id: 'js-debounce',
      starterCode: 'export default function debounce(fn, delay) {}',
      tests: '',
      decisionGraphAsset: 'assets/questions/javascript/decision-graphs/js-debounce.v1.json',
    } as any;

    await component.initFromQuestion();
    await Promise.resolve();

    expect(component.viewingSolution()).toBeTrue();
    expect(component.decisionGraphVisible()).toBeTrue();
  });

  it('falls back to reset-to-default copy when solution code is restored without a session snapshot', async () => {
    const graphCode = 'export default function debounce(fn, delay) { return fn; }';

    decisionGraphService.load.and.returnValue(of({
      questionId: 'js-debounce',
      version: 1,
      language: 'javascript',
      code: graphCode,
      nodes: [
        {
          id: 'd1',
          title: 'Return original fn',
          anchor: { lineStart: 1, lineEnd: 1, snippet: 'return fn;' },
          why: 'why',
          alternative: 'alt',
          tradeoff: 'tradeoff',
        },
      ],
    } as any));

    const codeStoreStub = {
      getJsAsync: jasmine.createSpy('getJsAsync').and.resolveTo(null),
      cloneJsBundleAsync: jasmine.createSpy('cloneJsBundleAsync').and.resolveTo(true),
      setJsBaselineAsync: jasmine.createSpy('setJsBaselineAsync').and.resolveTo(undefined),
      getJsLangStateAsync: jasmine.createSpy('getJsLangStateAsync').and.callFake(async (_key: string, lang: 'js' | 'ts') => ({
        code: lang === 'js' ? graphCode : '',
        baseline: lang === 'js' ? graphCode : '',
        dirty: lang === 'js',
        hasUserCode: lang === 'js',
      })),
      getJsForLangAsync: jasmine.createSpy('getJsForLangAsync').and.callFake(async (_key: string, lang: 'js' | 'ts') => (
        lang === 'js' ? graphCode : ''
      )),
      saveJsAsync: jasmine.createSpy('saveJsAsync').and.resolveTo(undefined),
      initJsAsync: jasmine.createSpy('initJsAsync').and.resolveTo({
        initial: graphCode,
        restored: true,
      }),
      setLastLangAsync: jasmine.createSpy('setLastLangAsync').and.resolveTo(undefined),
    };

    const component = TestBed.runInInjectionContext(
      () => new CodingJsPanelComponent(codeStoreStub as any),
    );
    component.disablePersistence = false;
    component.question = {
      id: 'js-debounce',
      starterCode: 'export default function debounce(fn, delay) {}',
      starterCodeTs: 'export default function debounce(fn: (...args: any[]) => void, delay: number): (...args: any[]) => void { return fn; }',
      tests: '',
      testsTs: '',
      decisionGraphAsset: 'assets/questions/javascript/decision-graphs/js-debounce.v1.json',
    } as any;

    await component.initFromQuestion();
    await Promise.resolve();

    expect(component.viewingSolution()).toBeTrue();
    expect(component.canRevertToUserCode()).toBeFalse();
    expect(component.restoreBannerIsSolutionContext()).toBeTrue();
    expect(component.restoreBannerActionLabel()).toBe('Reset to default');
  });

  it('restores the matching approach rationale after refresh based on persisted solution code', async () => {
    const approach1Code = [
      'export default function debounce(fn, delay) {',
      '  let timeoutId;',
      '  return function (...args) {',
      '    clearTimeout(timeoutId);',
      '    timeoutId = setTimeout(() => fn.apply(this, args), delay);',
      '  };',
      '}',
    ].join('\n');

    const approach2Code = [
      'export default function debounce(fn, delay) {',
      '  let timeoutId, lastArgs, lastThis;',
      '  function debounced(...args) {',
      '    lastArgs = args;',
      '    lastThis = this;',
      '    clearTimeout(timeoutId);',
      '    timeoutId = setTimeout(() => fn.apply(lastThis, lastArgs), delay);',
      '  }',
      '  return debounced;',
      '}',
    ].join('\n');

    decisionGraphService.load.and.callFake((assetPath: string) => {
      if (assetPath.includes('approach2')) {
        return of({
          questionId: 'js-debounce',
          version: 1,
          language: 'javascript',
          code: approach2Code,
          nodes: [
            {
              id: 'd1',
              title: 'Track latest args/context',
              anchor: {
                lineStart: 4,
                lineEnd: 5,
                snippet: 'lastArgs = args;',
              },
              why: 'why',
              alternative: 'alt',
              tradeoff: 'tradeoff',
            },
          ],
        } as any);
      }

      return of({
        questionId: 'js-debounce',
        version: 1,
        language: 'javascript',
        code: approach1Code,
        nodes: [
          {
            id: 'd1',
            title: 'Reset timer',
            anchor: {
              lineStart: 4,
              lineEnd: 4,
              snippet: 'clearTimeout(timeoutId);',
            },
            why: 'why',
            alternative: 'alt',
            tradeoff: 'tradeoff',
          },
        ],
      } as any);
    });

    const codeStoreStub = {
      getJsAsync: jasmine.createSpy('getJsAsync').and.resolveTo(null),
      cloneJsBundleAsync: jasmine.createSpy('cloneJsBundleAsync').and.resolveTo(true),
      setJsBaselineAsync: jasmine.createSpy('setJsBaselineAsync').and.resolveTo(undefined),
      getJsLangStateAsync: jasmine.createSpy('getJsLangStateAsync').and.callFake(async (_key: string, lang: 'js' | 'ts') => ({
        code: lang === 'js' ? approach2Code : '',
        baseline: lang === 'js' ? approach2Code : '',
        dirty: lang === 'js',
        hasUserCode: lang === 'js',
      })),
      getJsForLangAsync: jasmine.createSpy('getJsForLangAsync').and.callFake(async (_key: string, lang: 'js' | 'ts') => {
        if (lang === 'js') return approach2Code;
        return '';
      }),
      saveJsAsync: jasmine.createSpy('saveJsAsync').and.resolveTo(undefined),
      initJsAsync: jasmine.createSpy('initJsAsync').and.resolveTo({
        initial: approach2Code,
        restored: true,
      }),
      setLastLangAsync: jasmine.createSpy('setLastLangAsync').and.resolveTo(undefined),
    };

    const component = TestBed.runInInjectionContext(
      () => new CodingJsPanelComponent(codeStoreStub as any),
    );
    component.disablePersistence = false;
    component.question = {
      id: 'js-debounce',
      technology: 'javascript',
      starterCode: approach1Code,
      tests: '',
      decisionGraphAsset: 'assets/questions/javascript/decision-graphs/js-debounce-approach1.v1.json',
      solutionBlock: {
        approaches: [
          {
            codeJs: approach1Code,
            decisionGraphAsset: 'assets/questions/javascript/decision-graphs/js-debounce-approach1.v1.json',
          },
          {
            codeJs: approach2Code,
            decisionGraphAsset: 'assets/questions/javascript/decision-graphs/js-debounce-approach2.v1.json',
          },
        ],
      },
    } as any;

    await component.initFromQuestion();
    await Promise.resolve();

    expect(decisionGraphService.load).toHaveBeenCalledWith(
      'assets/questions/javascript/decision-graphs/js-debounce-approach2.v1.json',
    );
    expect(component.viewingSolution()).toBeTrue();
    expect(component.decisionGraphVisible()).toBeTrue();
  });

  it('restores the original language draft after switching languages post-solution', async () => {
    const codeStoreStub = {
      getJsForLangAsync: jasmine.createSpy('getJsForLangAsync').and.resolveTo(''),
      saveJsAsync: jasmine.createSpy('saveJsAsync').and.resolveTo(undefined),
      setLastLangAsync: jasmine.createSpy('setLastLangAsync').and.resolveTo(undefined),
    };

    const component = TestBed.runInInjectionContext(
      () => new CodingJsPanelComponent(codeStoreStub as any),
    );
    component.disablePersistence = false;
    component.question = {
      id: 'js-lang-switch',
      starterCode: 'export default function greet() { return "starter-js"; }',
      starterCodeTs: 'export default function greet(): string { return "starter-ts"; }',
      tests: '',
      testsTs: '',
    } as any;

    const draftCode = 'export default function greet() { return "draft-js"; }';
    const solutionCode = 'export default function greet() { return "solution-js"; }';
    component.jsLang.set('js');
    component.editorContent.set(draftCode);

    await component.applySolution(solutionCode);
    await component.setLanguage('ts');
    await component.revertToUserCodeFromBanner();

    expect(component.jsLang()).toBe('js');
    expect(component.editorContent()).toBe(draftCode);
    expect(component.viewingSolution()).toBeFalse();
    expect(component.canRevertToUserCode()).toBeFalse();
  });

  it('resets to starter state when no solution draft snapshot exists', async () => {
    const codeStoreStub = {
      resetJsBothAsync: jasmine.createSpy('resetJsBothAsync').and.resolveTo(undefined),
      saveJsAsync: jasmine.createSpy('saveJsAsync').and.resolveTo(undefined),
    };

    const component = TestBed.runInInjectionContext(
      () => new CodingJsPanelComponent(codeStoreStub as any),
    );
    component.disablePersistence = false;
    component.question = {
      id: 'js-revert',
      starterCode: 'export default function noop() {}',
      starterCodeTs: 'export default function noop(): void {}',
      tests: '',
      testsTs: '',
    } as any;

    component.viewingSolution.set(true);
    component.decisionGraphPopupOpen.set(true);
    component.restoredFromStorage.set(true);
    component.restoreDismissed.set(false);

    await component.resetToDefault();

    expect(component.viewingSolution()).toBeFalse();
    expect(component.decisionGraphPopupOpen()).toBeFalse();
    expect(component.canRevertToUserCode()).toBeFalse();
    expect(component.restoredFromStorage()).toBeFalse();
    expect(component.restoreDismissed()).toBeTrue();
    expect(codeStoreStub.resetJsBothAsync).toHaveBeenCalled();
    expect(codeStoreStub.saveJsAsync).toHaveBeenCalled();
  });

  it('keeps rationale highlights visible when code is canonical even if viewingSolution is false', () => {
    const component = TestBed.runInInjectionContext(
      () => new CodingJsPanelComponent({} as any),
    );

    const graphCode = [
      'export default function debounce(fn, delay, { leading = false } = {}) {',
      '  let timeoutId;',
      '  return function (...args) {',
      '    const shouldCallNow = leading && !timeoutId;',
      '    if (timeoutId) clearTimeout(timeoutId);',
      '  };',
      '}',
    ].join('\n');

    component.topTab.set('code');
    component.jsLang.set('js');
    component.viewingSolution.set(false);
    component.editorContent.set(graphCode);
    component.decisionGraphDoc.set({
      questionId: 'q',
      version: 1,
      language: 'javascript',
      code: graphCode,
      nodes: [
        {
          id: 'd1',
          title: 'Leading gate',
          anchor: { lineStart: 4, lineEnd: 4, snippet: 'const shouldCallNow = leading && !timeoutId' },
          why: 'why',
          alternative: 'alt',
          tradeoff: 'tradeoff',
        },
      ],
    } as any);

    expect(component.decisionGraphVisible()).toBeTrue();
    expect(component.decisionGraphShellVisible()).toBeTrue();
  });

  it('keeps selected solution code instead of forcing decision-graph canonical code', async () => {
    const graphCode = [
      'export default function debounce(fn, delay, { leading = false } = {}) {',
      '  let timeoutId;',
      '  let lastArgs;',
      '  let lastThis;',
      '',
      '  return function (...args) {',
      '    lastArgs = args;',
      '    lastThis = this;',
      '    const shouldCallNow = leading && !timeoutId;',
      '    if (timeoutId) clearTimeout(timeoutId);',
      '    timeoutId = setTimeout(() => {',
      '      timeoutId = undefined;',
      '      if (!leading) fn.apply(lastThis, lastArgs);',
      '    }, delay);',
      '    if (shouldCallNow) fn.apply(lastThis, lastArgs);',
      '  };',
      '}',
    ].join('\n');

    decisionGraphService.load.and.returnValue(of({
      questionId: 'js-debounce',
      version: 1,
      language: 'javascript',
      code: graphCode,
      nodes: [
        {
          id: 'd2',
          title: 'Reset debounce window',
          anchor: {
            lineStart: 10,
            lineEnd: 10,
            snippet: 'if (timeoutId) clearTimeout(timeoutId);',
          },
          why: 'why',
          alternative: 'alt',
          tradeoff: 'tradeoff',
        },
      ],
    } as any));

    const component = TestBed.runInInjectionContext(
      () => new CodingJsPanelComponent({} as any),
    );
    component.disablePersistence = true;
    component.question = {
      id: 'js-debounce',
      starterCode: 'export default function debounce(fn, delay) {}',
      tests: '',
      decisionGraphAsset: 'assets/questions/javascript/decision-graphs/js-debounce.v1.json',
    } as any;

    const setLineHighlights = jasmine.createSpy('setLineHighlights');
    component.codeEditor = {
      setLineHighlights,
      clearLineHighlights: jasmine.createSpy('clearLineHighlights'),
      revealLine: jasmine.createSpy('revealLine'),
    } as any;
    component.codeEditorReady.set(true);

    await component.initFromQuestion();

    // Incoming raw code intentionally does not include the graph anchor snippet.
    await component.applySolution([
      'export default function debounce(fn, delay) {',
      '  let timeoutId;',
      '  return function (...args) {',
      '    clearTimeout(timeoutId);',
      '    timeoutId = setTimeout(() => fn.apply(this, args), delay);',
      '  };',
      '}',
    ].join('\n'));
    await Promise.resolve();

    expect(component.editorContent()).toContain('clearTimeout(timeoutId);');
    expect(component.editorContent()).not.toContain('const shouldCallNow = leading && !timeoutId;');
    expect(setLineHighlights).not.toHaveBeenCalled();
  });

  it('keeps decision graph dock visible with mismatch state when graph language differs', async () => {
    decisionGraphService.load.and.returnValue(of({
      questionId: 'js-debounce',
      version: 1,
      language: 'javascript',
      code: 'export default function debounce() {}',
      nodes: [
        {
          id: 'd1',
          title: 'Leading gate',
          anchor: { lineStart: 1, lineEnd: 1, snippet: 'export default function debounce() {}' },
          why: 'why',
          alternative: 'alt',
          tradeoff: 'tradeoff',
        },
      ],
    } as any));

    const component = TestBed.runInInjectionContext(
      () => new CodingJsPanelComponent({} as any),
    );
    component.disablePersistence = true;
    component.question = {
      id: 'js-debounce',
      starterCode: 'export default function debounce() {}',
      starterCodeTs: 'export default function debounce(): void {}',
      tests: '',
      decisionGraphAsset: 'assets/questions/javascript/decision-graphs/js-debounce.v1.json',
    } as any;

    await component.initFromQuestion();
    component.jsLang.set('ts');
    await component.applySolution('export default function debounce(): void {}');
    await Promise.resolve();

    expect(component.decisionGraphLanguageMismatch()).toBeTrue();
    expect(component.decisionGraphVisible()).toBeFalse();
    expect(component.decisionGraphShellVisible()).toBeTrue();
  });

  it('opens per-line decision popup only when clicking highlighted lines', () => {
    const component = TestBed.runInInjectionContext(
      () => new CodingJsPanelComponent({} as any),
    );

    component.viewingSolution.set(true);
    component.topTab.set('code');
    component.jsLang.set('js');
    component.editorContent.set([
      'line-1',
      'line-2',
      'line-3',
      'line-4',
      'line-5',
      'line-6',
      'line-7',
      'line-8',
      'line-9',
      'line-10',
    ].join('\n'));

    component.decisionGraphDoc.set({
      questionId: 'q',
      version: 1,
      language: 'javascript',
      code: component.editorContent(),
      nodes: [
        {
          id: 'top',
          title: 'Top anchor',
          anchor: { lineStart: 2, lineEnd: 2, snippet: 'line-2' },
          why: 'why',
          alternative: 'alt',
          tradeoff: 'tradeoff',
        },
        {
          id: 'bottom',
          title: 'Bottom anchor',
          anchor: { lineStart: 9, lineEnd: 9, snippet: 'line-9' },
          why: 'why',
          alternative: 'alt',
          tradeoff: 'tradeoff',
        },
      ],
    } as any);
    component.codeEditorShell = {
      nativeElement: {
        getBoundingClientRect: () => ({
          left: 100,
          top: 50,
          width: 800,
          height: 500,
        }),
      },
    } as any;

    component.onCodeEditorLineClick({ lineNumber: 2, clientX: 240, clientY: 140 } as any);
    expect(component.decisionGraphPopupVisible()).toBeTrue();
    expect(component.decisionGraphPopupSide()).toBe('right');
    expect(component.isDecisionBranchExpanded('why')).toBeTrue();

    component.onCodeEditorLineClick({ lineNumber: 9, clientX: 820, clientY: 420 } as any);
    expect(component.decisionGraphPopupVisible()).toBeTrue();
    expect(component.decisionGraphPopupSide()).toBe('left');
    expect(component.isDecisionBranchExpanded('why')).toBeTrue();

    component.onCodeEditorLineClick({ lineNumber: 5, clientX: 420, clientY: 260 } as any);
    expect(component.decisionGraphPopupVisible()).toBeFalse();
  });

  it('allows toggling code rationale off from the hint controls', () => {
    const component = TestBed.runInInjectionContext(
      () => new CodingJsPanelComponent({} as any),
    );

    const code = [
      'export default function debounce(fn, delay) {',
      '  let timeoutId;',
      '  return function (...args) {',
      '    clearTimeout(timeoutId);',
      '    timeoutId = setTimeout(() => fn.apply(this, args), delay);',
      '  };',
      '}',
    ].join('\n');

    component.topTab.set('code');
    component.jsLang.set('js');
    component.viewingSolution.set(true);
    component.editorContent.set(code);
    component.decisionGraphDoc.set({
      questionId: 'q',
      version: 1,
      language: 'javascript',
      code,
      nodes: [
        {
          id: 'd1',
          title: 'Reset timer',
          anchor: { lineStart: 4, lineEnd: 4, snippet: 'clearTimeout(timeoutId);' },
          why: 'why',
          alternative: 'alt',
          tradeoff: 'tradeoff',
        },
      ],
    } as any);
    component.decisionGraphPopupOpen.set(true);

    expect(component.decisionGraphVisible()).toBeTrue();
    component.toggleDecisionGraphUserEnabled();
    expect(component.decisionGraphUserEnabled()).toBeFalse();
    expect(component.decisionGraphVisible()).toBeFalse();
    expect(component.decisionGraphPopupOpen()).toBeFalse();
    expect(component.decisionGraphHintVisible()).toBeTrue();
  });

  it('does not pin unresolved anchors to the last editor line', async () => {
    decisionGraphService.load.and.returnValue(of({
      questionId: 'js-debounce',
      version: 1,
      language: 'javascript',
      code: 'export default function debounce(fn, delay) {}',
      nodes: [
        {
          id: 'd1',
          title: 'First decision',
          anchor: { lineStart: 9, lineEnd: 9, snippet: 'const shouldCallNow = leading && !timeoutId' },
          why: 'why',
          alternative: 'alt',
          tradeoff: 'tradeoff',
        },
        {
          id: 'd2',
          title: 'Second decision',
          anchor: { lineStart: 11, lineEnd: 11, snippet: 'if (timeoutId) clearTimeout(timeoutId)' },
          why: 'why',
          alternative: 'alt',
          tradeoff: 'tradeoff',
        },
      ],
    } as any));

    const component = TestBed.runInInjectionContext(
      () => new CodingJsPanelComponent({} as any),
    );
    component.disablePersistence = true;
    component.question = {
      id: 'js-debounce',
      starterCode: 'export default function debounce(fn, delay) {}',
      tests: '',
      decisionGraphAsset: 'assets/questions/javascript/decision-graphs/js-debounce.v1.json',
    } as any;

    const setLineHighlights = jasmine.createSpy('setLineHighlights');
    const clearLineHighlights = jasmine.createSpy('clearLineHighlights');
    const revealLine = jasmine.createSpy('revealLine');
    component.codeEditor = {
      setLineHighlights,
      clearLineHighlights,
      revealLine,
    } as any;
    component.codeEditorReady.set(true);

    await component.initFromQuestion();
    await component.applySolution([
      'export default function debounce(fn, delay) {',
      '  let timeoutId;',
      '  return function (...args) {',
      '    clearTimeout(timeoutId);',
      '    timeoutId = setTimeout(() => fn.apply(this, args), delay);',
      '  };',
      '}',
    ].join('\n'));
    await Promise.resolve();

    expect(clearLineHighlights).toHaveBeenCalled();
    expect(setLineHighlights).not.toHaveBeenCalled();
    expect(revealLine).not.toHaveBeenCalled();
  });

  it('shows stuck nudge only after current-session test run and when level is at least 1', () => {
    const component = TestBed.runInInjectionContext(
      () => new CodingJsPanelComponent({} as any),
    );

    component.stuckState.set({
      level: 1,
      signature: 'sig',
      consecutiveCount: 2,
      firstSeenTs: Date.now() - 10_000,
      lastSeenTs: Date.now(),
    });
    expect(component.showStuckNudge()).toBeFalse();

    component.hasRunTests.set(true);
    expect(component.showStuckNudge()).toBeTrue();

    component.stuckState.set({
      level: 0,
      signature: 'sig',
      consecutiveCount: 0,
      firstSeenTs: Date.now(),
      lastSeenTs: Date.now(),
    });
    expect(component.showStuckNudge()).toBeFalse();
  });

  it('toggles interview setup panel only when interview mode is inactive', () => {
    const component = TestBed.runInInjectionContext(
      () => new CodingJsPanelComponent({} as any),
    );

    expect(component.interviewSetupOpen()).toBeFalse();
    component.toggleInterviewSetupPanel();
    expect(component.interviewSetupOpen()).toBeTrue();
    component.toggleInterviewSetupPanel();
    expect(component.interviewSetupOpen()).toBeFalse();

    component.interviewModeEnabled.set(true);
    component.toggleInterviewSetupPanel();
    expect(component.interviewSetupOpen()).toBeFalse();
  });

  it('hides interview setup while solution panel is open', () => {
    const component = TestBed.runInInjectionContext(
      () => new CodingJsPanelComponent({} as any),
    );

    expect(component.showInterviewSetup()).toBeTrue();

    component.solutionPanelOpen = true;
    expect(component.showInterviewSetup()).toBeFalse();
  });

  it('closes interview setup panel when interview mode starts', () => {
    const component = TestBed.runInInjectionContext(
      () => new CodingJsPanelComponent({} as any),
    );
    component.question = { id: 'interview-start' } as any;
    component.interviewSetupOpen.set(true);

    component.startInterviewMode();

    expect(component.interviewModeEnabled()).toBeTrue();
    expect(component.interviewSetupOpen()).toBeFalse();
  });

  it('requires level 2 when assist intervention timing variant is late_l2', () => {
    const component = TestBed.runInInjectionContext(
      () => new CodingJsPanelComponent({} as any),
    );
    (component as any).interventionTimingVariant = 'late_l2';
    component.hasRunTests.set(true);

    component.stuckState.set({
      level: 1,
      signature: 'sig',
      consecutiveCount: 2,
      firstSeenTs: Date.now() - 30_000,
      lastSeenTs: Date.now(),
    });
    expect(component.showStuckNudge()).toBeFalse();

    component.stuckState.set({
      level: 2,
      signature: 'sig',
      consecutiveCount: 4,
      firstSeenTs: Date.now() - 80_000,
      lastSeenTs: Date.now(),
    });
    expect(component.showStuckNudge()).toBeTrue();
  });

  it('trims explain actions in compact hint density variant', () => {
    const component = TestBed.runInInjectionContext(
      () => new CodingJsPanelComponent({} as any),
    );
    (component as any).hintDensityVariant = 'compact';

    const normalized = (component as any).applyHintDensityVariant({
      ruleId: 'r',
      title: 't',
      why: 'w',
      actions: ['a1', 'a2', 'a3'],
      confidence: 0.9,
    });

    expect(normalized.actions).toEqual(['a1', 'a2']);
  });

  it('dismisses explain chip until next assist hint refresh', () => {
    const component = TestBed.runInInjectionContext(
      () => new CodingJsPanelComponent({} as any),
    );

    component.explainHint.set({
      ruleId: 'r',
      title: 't',
      why: 'w',
      actions: ['a'],
      confidence: 0.8,
    });
    component.explainDismissed.set(false);
    expect(component.showExplainCard()).toBeTrue();

    component.dismissExplainPanel();

    expect(component.explainDismissed()).toBeTrue();
    expect(component.showExplainCard()).toBeFalse();
  });

  it('local fallback handles rejects/resolves tests without local runner error', async () => {
    const runner = new EmptyRunnerStub();
    const component = TestBed.runInInjectionContext(
      () => new CodingJsPanelComponent({} as any),
    );
    (component as any).loadRunner = async () => runner;
    component.question = { id: 'fallback-async-matchers' } as any;
    component.disablePersistence = true;

    component.editorContent.set('export default function addTwoPromises(p1, p2) { return Promise.all([p1, p2]).then(([a, b]) => a + b); }');
    component.testCode.set(`describe('fallback async matcher support', () => {
  test('supports rejects.toThrow', async () => {
    const p1 = Promise.resolve(1);
    const p2 = Promise.reject(new Error('boom'));
    await expect(addTwoPromises(p1, p2)).rejects.toThrow('boom');
  });
});
`);

    await component.runTests();

    expect(component.hasRunTests()).toBeTrue();
    expect(component.testResults().length).toBe(1);
    expect(component.testResults()[0].name).toBe('supports rejects.toThrow');
    expect(component.testResults()[0].passed).toBeTrue();
    expect(component.testResults().some((r) => r.name === 'Local runner error')).toBeFalse();
  });

  it('surfaces sandbox timeouts as a failed result without local fallback', async () => {
    const runner = new TimedOutRunnerStub();
    const component = TestBed.runInInjectionContext(
      () => new CodingJsPanelComponent({} as any),
    );
    (component as any).loadRunner = async () => runner;
    component.question = { id: 'timeout-case' } as any;
    component.disablePersistence = true;

    component.editorContent.set('export default function addTwoPromises(p1, p2) { return Promise.all([p1, p2]).then(([a, b]) => a + b); }');
    component.testCode.set(`test('would run locally', async () => {
  await expect(addTwoPromises(Promise.resolve(1), Promise.resolve(2))).resolves.toBe(3);
});
`);

    await component.runTests();

    expect(component.isRunningTests()).toBeFalse();
    expect(component.hasRunTests()).toBeTrue();
    expect(component.testResults().length).toBe(1);
    expect(component.testResults()[0]).toEqual(jasmine.objectContaining({
      name: 'Test execution timed out',
      passed: false,
    }));
    expect(component.testResults()[0].error).toContain('force-stopped');
    expect(component.testResults()[0].name).not.toBe('would run locally');
  });

  it('surfaces sandbox worker crashes as a failed result without local fallback', async () => {
    const runner = new CrashedRunnerStub();
    const component = TestBed.runInInjectionContext(
      () => new CodingJsPanelComponent({} as any),
    );
    (component as any).loadRunner = async () => runner;
    component.question = { id: 'crash-case' } as any;
    component.disablePersistence = true;

    component.editorContent.set('export default function addTwoPromises(p1, p2) { return Promise.all([p1, p2]).then(([a, b]) => a + b); }');
    component.testCode.set(`test('would run locally', async () => {
  await expect(addTwoPromises(Promise.resolve(1), Promise.resolve(2))).resolves.toBe(3);
});
`);

    await component.runTests();

    expect(component.isRunningTests()).toBeFalse();
    expect(component.hasRunTests()).toBeTrue();
    expect(component.testResults().length).toBe(1);
    expect(component.testResults()[0]).toEqual(jasmine.objectContaining({
      name: 'Test runner failed',
      passed: false,
    }));
    expect(component.testResults()[0].error).toContain('Worker crashed');
    expect(component.testResults()[0].name).not.toBe('would run locally');
  });
});
