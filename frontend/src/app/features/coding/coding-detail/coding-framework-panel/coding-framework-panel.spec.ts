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
    ]);
    codeStore.saveFrameworkFileAsync.and.resolveTo(undefined);
    codeStore.setFrameworkBundleAsync.and.resolveTo(undefined);

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

  it('does not expose manual checks when question has no framework tests', () => {
    const component = createComponent();

    component.initFromQuestion();

    expect(component.frameworkChecks()).toEqual([]);
  });

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
            { type: 'expectAttribute', selector: '.entry', attribute: 'aria-label', expected: 'Entry' },
            { type: 'setValue', selector: '.entry', value: 'Ada' },
            { type: 'expectValue', selector: '.entry', value: 'Ada' },
            { type: 'key', selector: '.entry', key: 'Enter' },
            { type: 'waitForCount', selector: '.item', count: 1 },
            { type: 'expectText', selector: '.item', text: 'Ada' },
            { type: 'expectClass', selector: '.item', className: 'active' },
          ],
        },
      ],
    } as any;
    component.frameworkCheckRun.subscribe((event) => emitted.push(event));
    component.initFromQuestion();
    component.filesMap.set({ 'src/App.tsx': 'const marker = "hash-only";' });
    previewBuilder.build.and.resolveTo(`<!doctype html><html><body>
      <input class="entry" aria-label="Entry" />
      <ul class="items"></ul>
      <script>
        const input = document.querySelector('.entry');
        const items = document.querySelector('.items');
        input.addEventListener('keydown', (event) => {
          if (event.key !== 'Enter' || !input.value.trim()) return;
          const li = document.createElement('li');
          li.className = 'item active';
          li.textContent = input.value.trim();
          items.appendChild(li);
        });
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
});
