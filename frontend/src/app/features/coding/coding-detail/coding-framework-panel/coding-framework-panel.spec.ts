import { PLATFORM_ID, NgZone } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AttemptInsightsService } from '../../../../core/services/attempt-insights.service';
import { CodeStorageService } from '../../../../core/services/code-storage.service';
import { PreviewBuilderService } from '../../../../core/services/preview-builder.service';
import { CodingFrameworkPanelComponent } from './coding-framework-panel';

describe('CodingFrameworkPanelComponent', () => {
  let codeStore: jasmine.SpyObj<CodeStorageService>;
  let previewBuilder: jasmine.SpyObj<PreviewBuilderService>;
  let attemptInsights: jasmine.SpyObj<AttemptInsightsService>;

  beforeEach(() => {
    codeStore = jasmine.createSpyObj<CodeStorageService>('CodeStorageService', [
      'saveFrameworkFileAsync',
      'setFrameworkBundleAsync',
      'getFrameworkDraftSnapshotAsync',
      'cloneFrameworkBundleAsync',
      'initFrameworkAsync',
      'resetFrameworkAsync',
    ]);
    codeStore.saveFrameworkFileAsync.and.resolveTo(undefined);
    codeStore.setFrameworkBundleAsync.and.resolveTo(undefined);
    codeStore.getFrameworkDraftSnapshotAsync.and.resolveTo(null);
    codeStore.cloneFrameworkBundleAsync.and.resolveTo(false);
    codeStore.initFrameworkAsync.and.callFake(async (_key: string, _tech: any, starters: Record<string, string>, entryHint?: string) => ({
      files: { ...starters },
      entryFile: entryHint || Object.keys(starters || {})[0] || '',
      restored: false,
    }));
    codeStore.resetFrameworkAsync.and.resolveTo(undefined);

    previewBuilder = jasmine.createSpyObj<PreviewBuilderService>('PreviewBuilderService', ['build']);
    previewBuilder.build.and.resolveTo('<!doctype html><html><body>preview</body></html>');
    attemptInsights = jasmine.createSpyObj<AttemptInsightsService>('AttemptInsightsService', [
      'getRunsForQuestion',
      'recordRun',
    ]);
    attemptInsights.getRunsForQuestion.and.returnValue([]);
    attemptInsights.recordRun.and.returnValue({ runsForQuestion: [] });

    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: AttemptInsightsService, useValue: attemptInsights },
      ],
    });
  });

  function createComponent(): CodingFrameworkPanelComponent {
    const sanitizer = TestBed.inject(DomSanitizer);
    const zone = TestBed.inject(NgZone);

    const component = TestBed.runInInjectionContext(
      () => new CodingFrameworkPanelComponent(
        codeStore,
        {} as any,
        sanitizer,
        zone,
        previewBuilder,
      ),
    );

    component.tech = 'react' as any;
    component.question = { id: 'react-case', tags: ['react', 'state'] } as any;
    component.filesMap.set({
      'src/App.tsx': 'export default function App() { return <div>User</div>; }',
      'src/App.css': '.user { color: white; }',
    });
    component.openPath.set('src/App.tsx');
    component.frameworkEntryFile = 'src/App.tsx';
    component.editorContent.set(component.filesMap()['src/App.tsx']);
    component.solutionFilesMap = {
      'src/App.tsx': 'export default function App() { return <div>Solution</div>; }',
      'src/App.css': '.solution { color: lime; }',
    };

    return component;
  }

  function setCounterCheck(component: CodingFrameworkPanelComponent): void {
    component.question = {
      id: 'react-counter',
      tags: ['react', 'state'],
      frameworkTests: [
        {
          id: 'counter-flow',
          name: 'Counter flow',
          steps: [
            { type: 'expectText', selector: '.value', text: '0' },
            { type: 'expectDisabled', selector: '.actions button', index: 0, disabled: true },
            { type: 'click', selector: '.actions button', index: 1 },
            { type: 'waitForText', selector: '.value', text: '1' },
            { type: 'click', selector: '.actions button', index: 2 },
            { type: 'waitForText', selector: '.value', text: '0' },
          ],
        },
      ],
    } as any;
    component.initFromQuestion();
    component.filesMap.set({
      'src/App.tsx': 'export default function App() { return <div className="value">0</div>; }',
      'src/App.css': '.value { color: white; }',
    });
  }

  function counterHtml(options: { broken?: boolean } = {}): string {
    const broken = !!options.broken;
    return `<!doctype html><html><body>
      <div class="value">0</div>
      <div class="actions">
        <button disabled>-</button>
        <button>+</button>
        <button>Reset</button>
      </div>
      <script>
        const value = document.querySelector('.value');
        const buttons = document.querySelectorAll('.actions button');
        let count = 0;
        buttons[1].addEventListener('click', () => {
          count += ${broken ? 0 : 1};
          value.textContent = String(count);
          buttons[0].disabled = count === 0;
        });
        buttons[0].addEventListener('click', () => {
          count = Math.max(0, count - 1);
          value.textContent = String(count);
          buttons[0].disabled = count === 0;
        });
        buttons[2].addEventListener('click', () => {
          count = 0;
          value.textContent = String(count);
          buttons[0].disabled = true;
        });
        setTimeout(() => window.__FA_NOTIFY_PREVIEW_READY && window.__FA_NOTIFY_PREVIEW_READY('test'), 0);
      </script>
    </body></html>`;
  }

  it('does not bootstrap from ngOnInit because input changes own framework initialization', () => {
    const component = createComponent();
    const initSpy = spyOn(component, 'initFromQuestion');

    component.ngOnInit();

    expect(initSpy).not.toHaveBeenCalled();
  });

  it('shows solution files without persisting them over the user draft', () => {
    const component = createComponent();

    component.applySolutionFiles('src/App.tsx');

    expect(component.viewingSolution()).toBeTrue();
    expect(component.editorContent()).toContain('Solution');
    expect(codeStore.setFrameworkBundleAsync).not.toHaveBeenCalled();

    component.revertToUserCodeFromBanner();

    expect(component.editorContent()).toContain('User');
    expect(codeStore.setFrameworkBundleAsync).toHaveBeenCalledWith(
      'react-case',
      'react',
      jasmine.objectContaining({
        'src/App.tsx': jasmine.stringMatching('User'),
      }),
      'src/App.tsx',
    );
  });

  it('flushes pending user edits before showing solution files', () => {
    const component = createComponent();

    component.onFrameworkCodeChange('export default function App() { return <div>Unsaved</div>; }');
    component.applySolutionFiles('src/App.tsx');

    expect(codeStore.saveFrameworkFileAsync).toHaveBeenCalledWith(
      'react-case',
      'react',
      'src/App.tsx',
      'export default function App() { return <div>Unsaved</div>; }',
      { allowEmpty: true },
    );
    expect(codeStore.setFrameworkBundleAsync).not.toHaveBeenCalled();
  });

  it('persists an intentionally emptied framework file', fakeAsync(() => {
    const component = createComponent();

    component.onFrameworkCodeChange('');
    tick(250);

    expect(codeStore.saveFrameworkFileAsync).toHaveBeenCalledWith(
      'react-case',
      'react',
      'src/App.tsx',
      '',
      { allowEmpty: true },
    );
  }));

  it('uses an editable fallback path after Monaco fails to load', fakeAsync(() => {
    const component = createComponent();
    spyOn(component as any, 'scheduleRebuild').and.stub();

    component.onEditorLoadFailed();
    component.onFrameworkCodeChange('export default function App() { return <div>Fallback</div>; }');
    tick(250);

    expect(component.monacoLoadFailed()).toBeTrue();
    expect(component.useMonaco()).toBeFalse();
    expect(component.editorContent()).toContain('Fallback');
    expect(codeStore.saveFrameworkFileAsync).toHaveBeenCalledWith(
      'react-case',
      'react',
      'src/App.tsx',
      'export default function App() { return <div>Fallback</div>; }',
      { allowEmpty: true },
    );
  }));

  it('does not expose manual checks when question has no framework tests', () => {
    const component = createComponent();

    component.initFromQuestion();

    expect(component.frameworkChecks()).toEqual([]);
  });

  it('ignores stale async framework init results from an older question', async () => {
    const component = createComponent();
    const oldInit = deferred<{ files: Record<string, string>; entryFile: string; restored: boolean }>();
    const newInit = deferred<{ files: Record<string, string>; entryFile: string; restored: boolean }>();
    codeStore.initFrameworkAsync.and.callFake(async (key: string) => {
      if (key.includes('react-old-init')) return oldInit.promise;
      return newInit.promise;
    });
    component.deferPreview = true;

    component.question = {
      id: 'react-old-init',
      tags: ['react'],
    } as any;
    component.initFromQuestion();
    await flushMicrotasks();

    component.question = {
      id: 'react-new-init',
      tags: ['react'],
    } as any;
    component.initFromQuestion();
    await flushMicrotasks();

    newInit.resolve({
      files: {
        'src/App.tsx': 'export default function App() { return <div>New</div>; }',
      },
      entryFile: 'src/App.tsx',
      restored: true,
    });
    await flushMicrotasks();

    oldInit.resolve({
      files: {
        'src/App.tsx': 'export default function App() { return <div>Old</div>; }',
      },
      entryFile: 'src/App.tsx',
      restored: true,
    });
    await flushMicrotasks();

    expect(component.question.id).toBe('react-new-init');
    expect(component.editorContent()).toContain('New');
    expect(component.filesMap()['src/App.tsx']).toContain('New');
    expect(component.showRestoreBanner()).toBeTrue();
  });

  it('does not launch a scratch check iframe when an edit cancels a delayed preview build', async () => {
    const component = createComponent();
    const delayedBuild = deferred<string>();
    const question = {
      id: 'react-delayed-check',
      tags: ['react'],
      frameworkTests: [{
        id: 'delayed-check',
        name: 'Delayed check',
        steps: [{ type: 'expectText', selector: '.value', text: '0' }],
      }],
    } as any;
    component.question = question;
    component.frameworkChecks.set(question.frameworkTests);
    previewBuilder.build.and.returnValue(delayedBuild.promise);
    const runFramework = spyOn<any>((component as any).opaqueCheckRunner, 'runFramework')
      .and.resolveTo([]);

    const pendingRun = component.runFrameworkChecks();
    await flushMicrotasks();

    component.onFrameworkCodeChange('export default function App() { return <div>Edited</div>; }');
    delayedBuild.resolve('<!doctype html><html><body><div class="value">0</div></body></html>');

    expect(await pendingRun).toEqual([]);
    expect(runFramework).not.toHaveBeenCalled();
    expect(component.frameworkChecksRunning()).toBeFalse();
    component.ngOnDestroy();
  });

  it('keeps the newest visible preview when an older build resolves last', async () => {
    const component = createComponent();
    const olderBuild = deferred<string>();
    const newerBuild = deferred<string>();
    let buildCall = 0;
    previewBuilder.build.and.callFake(() => {
      buildCall += 1;
      return buildCall === 1 ? olderBuild.promise : newerBuild.promise;
    });
    const setPreviewHtml = spyOn<any>(component as any, 'setPreviewHtml').and.stub();

    const olderPreview = component.rebuildFrameworkPreview();
    await flushMicrotasks();
    const newerPreview = component.rebuildFrameworkPreview();
    await flushMicrotasks();

    newerBuild.resolve('<!doctype html><html><body>newest</body></html>');
    await newerPreview;
    olderBuild.resolve('<!doctype html><html><body>stale</body></html>');
    await olderPreview;

    expect(setPreviewHtml).toHaveBeenCalledTimes(1);
    expect(setPreviewHtml.calls.mostRecent().args[0]).toBe(
      '<!doctype html><html><body>newest</body></html>',
    );
    component.ngOnDestroy();
  });

  it('does not let an older visible-preview build error clear a newer preview', async () => {
    const component = createComponent();
    const olderBuild = deferred<string>();
    const newerBuild = deferred<string>();
    let buildCall = 0;
    previewBuilder.build.and.callFake(() => {
      buildCall += 1;
      return buildCall === 1 ? olderBuild.promise : newerBuild.promise;
    });
    const setPreviewHtml = spyOn<any>(component as any, 'setPreviewHtml').and.stub();

    const olderPreview = component.rebuildFrameworkPreview();
    await flushMicrotasks();
    const newerPreview = component.rebuildFrameworkPreview();
    await flushMicrotasks();

    newerBuild.resolve('<!doctype html><html><body>newest</body></html>');
    await newerPreview;
    olderBuild.reject(new Error('stale compilation error'));
    await olderPreview;

    expect(setPreviewHtml).toHaveBeenCalledTimes(1);
    expect(setPreviewHtml.calls.mostRecent().args[0]).toBe(
      '<!doctype html><html><body>newest</body></html>',
    );
    component.ngOnDestroy();
  });

  it('reports a bounded infrastructure timeout when visible preview navigation never loads', fakeAsync(() => {
    const component = createComponent();
    const replace = jasmine.createSpy('replace');
    const postMessage = jasmine.createSpy('postMessage');
    const frame = {
      contentWindow: {
        location: { replace },
        postMessage,
      },
      onload: null,
      src: '',
    } as unknown as HTMLIFrameElement;
    component.previewFrame = { nativeElement: frame } as any;
    spyOn(URL, 'createObjectURL').and.returnValue('blob:preview-never-loads');
    spyOn(URL, 'revokeObjectURL').and.stub();

    (component as any).setPreviewHtml('<!doctype html><html><body>preview</body></html>');

    expect(replace).toHaveBeenCalledWith('blob:preview-never-loads');
    expect(postMessage).not.toHaveBeenCalled();
    expect(component.loadingPreview()).toBeTrue();
    expect(component.previewFailure()).toBeNull();

    tick(29_999);
    expect(component.loadingPreview()).toBeTrue();

    tick(1);
    expect(component.loadingPreview()).toBeFalse();
    expect(component.previewFailure()).toEqual({
      kind: 'infrastructure-timeout',
      message: 'Preview did not report a ready or error state before the infrastructure timeout.',
    });
    component.ngOnDestroy();
  }));

  it('runs pilot framework checks and records bounded framework telemetry', async () => {
    const component = createComponent();
    setCounterCheck(component);
    previewBuilder.build.and.resolveTo(counterHtml());

    const results = await component.runFrameworkChecks();

    expect(results.length).toBe(1);
    expect(results[0].passed).toBeTrue();
    expect(component.frameworkCheckResults()[0].passed).toBeTrue();
    expect(attemptInsights.recordRun).toHaveBeenCalledWith(jasmine.objectContaining({
      questionId: 'react-counter',
      lang: 'react',
      passCount: 1,
      totalCount: 1,
      firstFailName: '',
      errorLine: 'unknown-error',
      interviewMode: false,
      tags: ['react', 'state'],
    }));
    const record = attemptInsights.recordRun.calls.mostRecent().args[0] as any;
    expect(record.codeHash).toEqual(jasmine.any(String));
    expect(record.files).toBeUndefined();
    expect(record.code).toBeUndefined();
  });

  it('records failed framework checks with category and signature metadata', async () => {
    const component = createComponent();
    setCounterCheck(component);
    previewBuilder.build.and.resolveTo(counterHtml({ broken: true }));

    const results = await component.runFrameworkChecks();

    expect(results[0].passed).toBeFalse();
    expect(results[0].error).toContain('did not reach text "1"');
    const record = attemptInsights.recordRun.calls.mostRecent().args[0] as any;
    expect(record.lang).toBe('react');
    expect(record.passCount).toBe(0);
    expect(record.totalCount).toBe(1);
    expect(record.firstFailName).toBe('Counter flow');
    expect(record.signature).toContain('Counter flow');
    expect(record.errorCategory).toBeDefined();
  });

  it('records a failed framework attempt when preview render times out', async () => {
    const component = createComponent();
    setCounterCheck(component);
    (component as any).frameworkCheckReadyTimeoutMs = 5;
    previewBuilder.build.and.resolveTo('<!doctype html><html><body><div class="value">0</div></body></html>');

    const results = await component.runFrameworkChecks();

    expect(results[0].passed).toBeFalse();
    expect(results[0].error).toContain('timed out');
    const record = attemptInsights.recordRun.calls.mostRecent().args[0] as any;
    expect(record.lang).toBe('react');
    expect(record.errorCategory).toBe('timeout');
  });

  it('supports extended structured check steps and emits the run result', async () => {
    const component = createComponent();
    const emitted: any[] = [];
    component.question = {
      id: 'react-form-like',
      tags: ['react', 'forms'],
      frameworkTests: [
        {
          id: 'extended-dsl',
          name: 'Extended DSL',
          steps: [
            { type: 'expectCount', selector: '.item', count: 0 },
            { type: 'expectNoText', selector: 'body', text: 'Ada', match: 'contains' },
            { type: 'expectAttribute', selector: '.entry', attribute: 'aria-label', expected: 'Entry' },
            { type: 'setValue', selector: '.entry', value: 'Ada' },
            { type: 'expectValue', selector: '.entry', value: 'Ada' },
            { type: 'key', selector: '.entry', key: 'Enter' },
            { type: 'expectFocused', selector: '.entry' },
            { type: 'waitForCount', selector: '.item', count: 1 },
            { type: 'expectText', selector: '.item', text: 'Ada' },
            { type: 'expectClass', selector: '.item', className: 'active' },
            { type: 'mouseDown', selector: '.mouse-target' },
            { type: 'expectText', selector: '.interaction-state', text: 'mouse down' },
            { type: 'pointerDown', selector: '.pointer-target' },
            { type: 'expectText', selector: '.interaction-state', text: 'pointer down' },
            { type: 'wait', durationMs: 10 },
            { type: 'unmountPreview' },
            { type: 'expectNoPreviewLeaks' },
          ],
        },
      ],
    } as any;
    component.frameworkCheckRun.subscribe((event) => emitted.push(event));
    component.initFromQuestion();
    component.filesMap.set({ 'src/App.tsx': 'const marker = "hash-only";' });
    previewBuilder.build.and.resolveTo(`<!doctype html><html><body>
      <input class="entry" aria-label="Entry" />
      <button class="mouse-target" type="button">Mouse target</button>
      <button class="pointer-target" type="button">Pointer target</button>
      <div class="interaction-state"></div>
      <ul class="items"></ul>
      <script>
        const input = document.querySelector('.entry');
        const items = document.querySelector('.items');
        const state = document.querySelector('.interaction-state');
        document.querySelector('.mouse-target').addEventListener('mousedown', () => {
          state.textContent = 'mouse down';
        });
        document.querySelector('.pointer-target').addEventListener('pointerdown', () => {
          state.textContent = 'pointer down';
        });
        input.addEventListener('keydown', (event) => {
          if (event.key !== 'Enter' || !input.value.trim()) return;
          const li = document.createElement('li');
          li.className = 'item active';
          li.textContent = input.value.trim();
          items.appendChild(li);
        });
        window.__FA_UNMOUNT_PREVIEW = () => {};
        window.__FA_GET_PREVIEW_LEAKS = () => ({ timers: 0, documentListeners: 0 });
        setTimeout(() => window.__FA_NOTIFY_PREVIEW_READY && window.__FA_NOTIFY_PREVIEW_READY('test'), 0);
      </script>
    </body></html>`);

    const results = await component.runFrameworkChecks();

    expect(results[0].passed).toBeTrue();
    expect(emitted[0]).toEqual(jasmine.objectContaining({
      questionId: 'react-form-like',
      passed: true,
    }));
    expect(attemptInsights.recordRun).toHaveBeenCalledWith(jasmine.objectContaining({
      questionId: 'react-form-like',
      passCount: 1,
      totalCount: 1,
    }));
  });

  it('mounts a fresh scratch preview for each framework check', async () => {
    const component = createComponent();
    component.question = {
      id: 'react-isolated-checks',
      tags: ['react'],
      frameworkTests: [
        {
          id: 'mutates-dom',
          name: 'Mutates DOM',
          steps: [
            { type: 'click', selector: '.add' },
            { type: 'expectCount', selector: '.item', count: 1 },
          ],
        },
        {
          id: 'starts-clean',
          name: 'Starts clean',
          steps: [
            { type: 'expectCount', selector: '.item', count: 0 },
          ],
        },
      ],
    } as any;
    component.initFromQuestion();
    previewBuilder.build.and.resolveTo(`<!doctype html><html><body>
      <button class="add" type="button">Add</button>
      <ul class="items"></ul>
      <script>
        document.querySelector('.add').addEventListener('click', () => {
          const li = document.createElement('li');
          li.className = 'item';
          li.textContent = 'item';
          document.querySelector('.items').appendChild(li);
        });
        setTimeout(() => window.__FA_NOTIFY_PREVIEW_READY && window.__FA_NOTIFY_PREVIEW_READY('test'), 0);
      </script>
    </body></html>`);

    const results = await component.runFrameworkChecks();

    expect(results.map((result) => result.passed)).toEqual([true, true]);
  });
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

async function flushMicrotasks(count = 10): Promise<void> {
  for (let i = 0; i < count; i += 1) {
    await Promise.resolve();
  }
}
