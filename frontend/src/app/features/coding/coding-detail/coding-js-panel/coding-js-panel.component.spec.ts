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
      () => new CodingJsPanelComponent(runner as any, {} as any),
    );
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
});
