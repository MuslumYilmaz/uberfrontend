import { PLATFORM_ID, NgZone } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CodeStorageService } from '../../../../core/services/code-storage.service';
import { PreviewBuilderService } from '../../../../core/services/preview-builder.service';
import { CodingFrameworkPanelComponent } from './coding-framework-panel';

describe('CodingFrameworkPanelComponent', () => {
  let codeStore: jasmine.SpyObj<CodeStorageService>;
  let previewBuilder: jasmine.SpyObj<PreviewBuilderService>;

  beforeEach(() => {
    codeStore = jasmine.createSpyObj<CodeStorageService>('CodeStorageService', [
      'saveFrameworkFileAsync',
      'setFrameworkBundleAsync',
    ]);
    codeStore.saveFrameworkFileAsync.and.resolveTo(undefined);
    codeStore.setFrameworkBundleAsync.and.resolveTo(undefined);

    previewBuilder = jasmine.createSpyObj<PreviewBuilderService>('PreviewBuilderService', ['build']);
    previewBuilder.build.and.resolveTo('<!doctype html><html><body>preview</body></html>');

    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
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
    component.question = { id: 'react-case' } as any;
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
});
