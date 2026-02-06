import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
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

describe('CodingJsPanelComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
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
});
