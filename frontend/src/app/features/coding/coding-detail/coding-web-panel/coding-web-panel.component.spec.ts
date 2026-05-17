import { NgZone } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';
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
