import { NgZone } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { AttemptInsightsService } from '../../../../core/services/attempt-insights.service';
import { CodeStorageService } from '../../../../core/services/code-storage.service';
import { CodingWebPanelComponent } from './coding-web-panel.component';

describe('CodingWebPanelComponent attempt feedback', () => {
  let component: CodingWebPanelComponent;
  let attemptInsights: jasmine.SpyObj<AttemptInsightsService>;

  const question: any = {
    id: 'html-card',
    title: 'Accessible card',
    type: 'coding',
    technology: 'html',
    access: 'free',
    difficulty: 'intermediate',
    tags: ['semantic', 'accessibility'],
    importance: 80,
  };

  beforeEach(() => {
    attemptInsights = jasmine.createSpyObj<AttemptInsightsService>('AttemptInsightsService', [
      'getRunsForQuestion',
      'recordRun',
    ]);
    attemptInsights.getRunsForQuestion.and.returnValue([]);

    TestBed.configureTestingModule({
      providers: [
        { provide: AttemptInsightsService, useValue: attemptInsights },
        {
          provide: CodeStorageService,
          useValue: {
            getWebDraftSnapshotAsync: jasmine.createSpy('getWebDraftSnapshotAsync').and.resolveTo(null),
            cloneWebBundleAsync: jasmine.createSpy('cloneWebBundleAsync').and.resolveTo(false),
            initWebAsync: jasmine.createSpy('initWebAsync').and.resolveTo({
              html: '<main>Stored</main>',
              css: '.stored { color: white; }',
              restored: false,
            }),
            saveWebAsync: jasmine.createSpy('saveWebAsync').and.resolveTo(undefined),
            resetWebBothAsync: jasmine.createSpy('resetWebBothAsync').and.resolveTo(undefined),
          },
        },
        {
          provide: DomSanitizer,
          useValue: {
            bypassSecurityTrustResourceUrl: (value: string) => value,
          },
        },
      ],
    });

    component = TestBed.runInInjectionContext(() => new CodingWebPanelComponent(
      TestBed.inject(DomSanitizer),
      TestBed.inject(NgZone),
      TestBed.inject(CodeStorageService),
    ));
    component.question = question;
    component.tech = 'html';
    component.disablePersistence = true;
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('records a web attempt after DOM tests run', async () => {
    (component as any).htmlCode.set('<button class="cta">Save</button>');
    (component as any).cssCode.set('.cta { display: block; }');
    component.testCode.set(`
      test('renders cta text', () => {
        expect(q('.cta')?.textContent?.trim()).toBe('Save');
      });
    `);

    const results = await component.runWebTests();

    expect(results).toEqual([{ name: 'renders cta text', passed: true }]);
    expect(attemptInsights.recordRun).toHaveBeenCalledWith(jasmine.objectContaining({
      questionId: 'html-card',
      lang: 'web',
      passCount: 1,
      totalCount: 1,
      firstFailName: '',
      interviewMode: false,
      errorCategory: 'unknown',
      tags: ['semantic', 'accessibility'],
    }));
    const payload = attemptInsights.recordRun.calls.mostRecent().args[0] as any;
    expect(payload.codeHash).toEqual(jasmine.any(String));
    expect(payload.codeHash).not.toContain('Save');
    expect(payload.rawCode).toBeUndefined();
    expect(payload.sourceCode).toBeUndefined();
  });

  it('updates and persists fallback textarea buffers after Monaco fails to load', fakeAsync(() => {
    const codeStorage = TestBed.inject(CodeStorageService) as jasmine.SpyObj<CodeStorageService>;
    component.disablePersistence = false;
    spyOn(component as any, 'scheduleWebPreview').and.stub();

    component.onEditorLoadFailed();
    component.onHtmlChange('<main class="fallback">Fallback</main>');
    tick(200);

    expect(component.monacoLoadFailed()).toBeTrue();
    expect(component.useMonaco()).toBeFalse();
    expect(component.webHtml()).toContain('Fallback');
    expect(codeStorage.saveWebAsync).toHaveBeenCalledWith(
      jasmine.any(String),
      'html',
      '<main class="fallback">Fallback</main>',
      { allowEmpty: true },
    );

    component.onCssChange('.fallback { color: lime; }');
    tick(200);

    expect(component.webCss()).toContain('lime');
    expect(codeStorage.saveWebAsync).toHaveBeenCalledWith(
      jasmine.any(String),
      'css',
      '.fallback { color: lime; }',
      { allowEmpty: true },
    );
  }));

  it('persists rapid HTML and CSS edits from the same debounce window', fakeAsync(() => {
    const codeStorage = TestBed.inject(CodeStorageService) as jasmine.SpyObj<CodeStorageService>;
    component.disablePersistence = false;
    spyOn(component as any, 'scheduleWebPreview').and.stub();

    component.onHtmlChange('<section>Saved HTML</section>');
    component.onCssChange('section { color: red; }');
    tick(200);

    expect(codeStorage.saveWebAsync).toHaveBeenCalledWith(
      jasmine.any(String),
      'html',
      '<section>Saved HTML</section>',
      { allowEmpty: true },
    );
    expect(codeStorage.saveWebAsync).toHaveBeenCalledWith(
      jasmine.any(String),
      'css',
      'section { color: red; }',
      { allowEmpty: true },
    );
  }));

  it('flushes a pending web edit on destroy', fakeAsync(() => {
    const codeStorage = TestBed.inject(CodeStorageService) as jasmine.SpyObj<CodeStorageService>;
    component.disablePersistence = false;
    spyOn(component as any, 'scheduleWebPreview').and.stub();

    component.onHtmlChange('<main>Late draft</main>');
    component.ngOnDestroy();

    expect(codeStorage.saveWebAsync).toHaveBeenCalledWith(
      jasmine.any(String),
      'html',
      '<main>Late draft</main>',
      { allowEmpty: true },
    );
  }));

  it('persists intentionally emptied web editor content', fakeAsync(() => {
    const codeStorage = TestBed.inject(CodeStorageService) as jasmine.SpyObj<CodeStorageService>;
    component.disablePersistence = false;
    spyOn(component as any, 'scheduleWebPreview').and.stub();

    component.onHtmlChange('');
    tick(200);

    expect(codeStorage.saveWebAsync).toHaveBeenCalledWith(
      jasmine.any(String),
      'html',
      '',
      { allowEmpty: true },
    );
  }));

  it('keeps solution preview active when a pending live preview rebuild fires', fakeAsync(() => {
    component.question = {
      ...question,
      webSolutionHtml: '<main class="solution">Solution preview</main>',
      webSolutionCss: '.solution { color: green; }',
    };
    const setPreviewHtml = spyOn(component as any, 'setPreviewHtml').and.stub();

    (component as any).scheduleWebPreview();
    component.openSolutionPreview();
    tick(120);

    expect(component.showingSolutionPreview).toBeTrue();
    expect(setPreviewHtml.calls.count()).toBe(1);
    expect(setPreviewHtml.calls.mostRecent().args[0]).toContain('Solution preview');
  }));

  it('ignores stale async init results from an older question', async () => {
    const codeStorage = TestBed.inject(CodeStorageService) as jasmine.SpyObj<CodeStorageService>;
    const oldInit = deferred<{ html: string; css: string; restored: boolean }>();
    const newInit = deferred<{ html: string; css: string; restored: boolean }>();
    codeStorage.initWebAsync.and.callFake(async (key: string) => {
      if (key.includes('web-old')) return oldInit.promise;
      return newInit.promise;
    });
    spyOn(component as any, 'scheduleWebPreview').and.stub();
    component.disablePersistence = false;

    component.question = {
      ...question,
      id: 'web-old',
      title: 'Old web',
      web: { starterHtml: '<main>Old starter</main>', starterCss: '.old {}' },
    };
    const firstInit = component.initFromQuestion();
    await flushMicrotasks();

    component.question = {
      ...question,
      id: 'web-new',
      title: 'New web',
      web: { starterHtml: '<main>New starter</main>', starterCss: '.new {}' },
    };
    const secondInit = component.initFromQuestion();
    await flushMicrotasks();

    newInit.resolve({ html: '<main>New draft</main>', css: '.new { color: green; }', restored: true });
    await secondInit;

    oldInit.resolve({ html: '<main>Old draft</main>', css: '.old { color: red; }', restored: true });
    await firstInit;

    expect(component.webHtml()).toBe('<main>New draft</main>');
    expect(component.webCss()).toBe('.new { color: green; }');
    expect(component.showRestoreBanner()).toBeTrue();
  });

  it('records failure metadata for failing DOM tests', async () => {
    (component as any).htmlCode.set('<button class="cta">Cancel</button>');
    (component as any).cssCode.set('.cta { display: block; }');
    component.testCode.set(`
      test('renders cta text', () => {
        expect(q('.cta')?.textContent?.trim()).toBe('Save');
      });
    `);

    await component.runWebTests();

    const payload = attemptInsights.recordRun.calls.mostRecent().args[0] as any;
    expect(payload).toEqual(jasmine.objectContaining({
      questionId: 'html-card',
      lang: 'web',
      passCount: 0,
      totalCount: 1,
      firstFailName: 'renders cta text',
      codeChanged: true,
      tags: ['semantic', 'accessibility'],
    }));
    expect(payload.errorLine).toContain('Expected "Cancel" to be "Save"');
    expect(payload.signature).toContain('renders cta text');
    expect(payload.errorCategory).toEqual(jasmine.any(String));
  });

  it('does not record an attempt when no tests run', async () => {
    (component as any).htmlCode.set('<button>Save</button>');
    (component as any).cssCode.set('');
    component.testCode.set('');

    const results = await component.runWebTests();

    expect(results).toEqual([]);
    expect(attemptInsights.recordRun).not.toHaveBeenCalled();
  });
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

async function flushMicrotasks(count = 8): Promise<void> {
  for (let i = 0; i < count; i += 1) {
    await Promise.resolve();
  }
}
