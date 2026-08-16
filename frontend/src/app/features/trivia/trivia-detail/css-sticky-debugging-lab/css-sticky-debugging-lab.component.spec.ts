import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AnalyticsService } from '../../../../core/services/analytics.service';
import { CssStickyDebuggingLabComponent } from './css-sticky-debugging-lab.component';
import { CssStickyInspection } from './css-sticky-debugging-lab.model';
import {
  CSS_STICKY_PREVIEW_PORT,
  CssStickyPreviewPort,
} from './css-sticky-preview-port';

describe('CssStickyDebuggingLabComponent', () => {
  let fixture: ComponentFixture<CssStickyDebuggingLabComponent>;
  let component: CssStickyDebuggingLabComponent;
  let analytics: jasmine.SpyObj<AnalyticsService>;
  let preview: PreviewPortStub;
  let observerCallback: IntersectionObserverCallback | undefined;
  let observerInstance: TestIntersectionObserver | undefined;
  let originalIntersectionObserver: typeof IntersectionObserver;
  let originalVisibilityStateDescriptor: PropertyDescriptor | undefined;

  class TestIntersectionObserver implements IntersectionObserver {
    readonly root = null;
    readonly rootMargin = '0px';
    readonly thresholds = [0, 0.5, 1];
    readonly observe = jasmine.createSpy('observe');
    readonly unobserve = jasmine.createSpy('unobserve');
    readonly disconnect = jasmine.createSpy('disconnect');

    constructor(callback: IntersectionObserverCallback) {
      observerCallback = callback;
      observerInstance = this;
    }

    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }

  class PreviewPortStub implements CssStickyPreviewPort {
    readonly mount = jasmine.createSpy('mount').and.resolveTo();
    readonly inspect = jasmine.createSpy('inspect');
    readonly highlight = jasmine.createSpy('highlight');
    readonly destroy = jasmine.createSpy('destroy');
  }

  beforeEach(async () => {
    analytics = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', ['track']);
    preview = new PreviewPortStub();
    originalIntersectionObserver = window.IntersectionObserver;
    window.IntersectionObserver = TestIntersectionObserver as unknown as typeof IntersectionObserver;
    originalVisibilityStateDescriptor = Object.getOwnPropertyDescriptor(document, 'visibilityState');
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible' as DocumentVisibilityState,
    });

    await TestBed.configureTestingModule({
      imports: [CssStickyDebuggingLabComponent],
      providers: [{ provide: AnalyticsService, useValue: analytics }],
    })
      .overrideComponent(CssStickyDebuggingLabComponent, {
        set: { providers: [{ provide: CSS_STICKY_PREVIEW_PORT, useValue: preview }] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(CssStickyDebuggingLabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  afterEach(() => {
    if (!fixture.componentRef.hostView.destroyed) fixture.destroy();
    window.IntersectionObserver = originalIntersectionObserver;
    if (originalVisibilityStateDescriptor) {
      Object.defineProperty(document, 'visibilityState', originalVisibilityStateDescriptor);
    } else {
      delete (document as any).visibilityState;
    }
  });

  it('starts with five accessible cases and defers Monaco until Edit CSS', () => {
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('[data-testid="css-sticky-debugging-lab"]')).not.toBeNull();
    expect(root.querySelectorAll('[data-testid^="sticky-case-"]').length).toBe(5);
    expect(root.querySelector('app-monaco-editor')).toBeNull();
    expect(root.querySelector('[data-testid="sticky-lab-live"]')).not.toBeNull();
    expect(root.textContent).toContain('CSS-only editor');
    expect(preview.mount).toHaveBeenCalledWith(
      jasmine.any(HTMLIFrameElement),
      'missing-inset',
    );

    component.activateEditor();
    fixture.detectChanges();

    expect(root.querySelector('app-monaco-editor')).not.toBeNull();
    expect(analytics.track).toHaveBeenCalledWith(
      'trivia_lab_interacted',
      jasmine.objectContaining({ action: 'editor_activated' }),
    );
  });

  it('keeps CSS editable through a textarea after Monaco fails', () => {
    component.activateEditor();
    component.onEditorLoadFailed();
    fixture.detectChanges();

    const textarea = (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLTextAreaElement>('[data-testid="sticky-css-fallback"]');
    expect(textarea).not.toBeNull();

    component.onCssChange('.sticky-target { position: sticky; top: 4px; }');
    expect(component.state().css).toContain('top: 4px');
  });

  it('switches cases, resets CSS, and marks a prior inspection stale after edits', async () => {
    preview.inspect.and.resolveTo(inspection('missing_inset'));
    await component.runInspection();
    expect(component.state().inspection?.finding).toBe('missing_inset');

    component.onCssChange(`${component.state().css}\n.sticky-target { top: 0; }`);
    expect(component.state().stale).toBeTrue();

    component.selectCase('flex-grid-stretch');
    await Promise.resolve();

    expect(component.state().selectedCaseId).toBe('flex-grid-stretch');
    expect(component.state().inspection).toBeNull();
    expect(component.state().stale).toBeFalse();
    expect(component.state().css).toContain('align-items: stretch');
    expect(preview.mount).toHaveBeenCalledWith(
      jasmine.any(HTMLIFrameElement),
      'flex-grid-stretch',
    );
  });

  it('completes only after a broken finding is followed by working in the same attempt', async () => {
    const completed = spyOn(component.completed, 'emit');
    preview.inspect.and.resolveTo(inspection('missing_inset'));
    await component.runInspection();

    component.applySuggestedFix();
    preview.inspect.and.resolveTo(inspection('working'));
    await component.runInspection();
    fixture.detectChanges();

    expect(component.state().completed).toBeTrue();
    expect(completed).toHaveBeenCalledTimes(1);
    expect((fixture.nativeElement as HTMLElement).querySelector(
      '[data-testid="sticky-inspection-finding"]',
    )?.textContent).toContain('working');
    expect(analytics.track).toHaveBeenCalledWith(
      'trivia_lab_completed',
      jasmine.objectContaining({
        lab_id: 'css_sticky_editor_inspector_v1',
        question_id: 'css-position-sticky-not-working',
        scenario_id: 'missing-inset',
        finding: 'working',
      }),
    );
  });

  it('does not let a stale inspection replace the latest selected case', async () => {
    let resolveFirst!: (value: CssStickyInspection) => void;
    preview.inspect.and.returnValue(new Promise((resolve) => {
      resolveFirst = resolve;
    }));

    const pending = component.runInspection();
    component.selectCase('no-travel-room');
    resolveFirst(inspection('missing_inset'));
    await pending;

    expect(component.state().selectedCaseId).toBe('no-travel-room');
    expect(component.state().inspection).toBeNull();
  });

  it('aborts an in-flight inspection when CSS changes and keeps the old result from returning', async () => {
    let resolveInspection!: (value: CssStickyInspection) => void;
    preview.inspect.and.returnValue(new Promise((resolve) => {
      resolveInspection = resolve;
    }));

    const pending = component.runInspection();
    const signal = preview.inspect.calls.mostRecent().args[0].signal;
    component.onCssChange(`${component.state().css}\n.sticky-target { top: 8px; }`);

    expect(signal.aborted).toBeTrue();
    expect(component.state().status).toBe('ready');
    resolveInspection(inspection('missing_inset'));
    await pending;

    expect(component.state().inspection).toBeNull();
    expect(component.state().status).toBe('ready');
  });

  it('clears prior evidence while a fresh inspection runs and when that run fails', async () => {
    preview.inspect.and.resolveTo(inspection('missing_inset'));
    await component.runInspection();
    expect(component.state().inspection?.finding).toBe('missing_inset');

    let rejectInspection!: (reason: Error) => void;
    preview.inspect.and.returnValue(new Promise((_, reject) => {
      rejectInspection = reject;
    }));
    const pending = component.runInspection();
    expect(component.state().inspection).toBeNull();

    rejectInspection(new Error('opaque child detail'));
    await pending;
    expect(component.state().inspection).toBeNull();
    expect(component.state().status).toBe('error');
    expect(component.state().errorMessage).not.toContain('opaque child detail');
  });

  it('sends only stable enums and timing fields to analytics', async () => {
    const secretCss = '.sticky-target { color: hotpink; }';
    component.onCssChange(secretCss);
    preview.inspect.and.resolveTo(inspection('missing_inset'));
    await component.runInspection();

    const payloads = analytics.track.calls.allArgs().map(([, payload]) => payload ?? {});
    expect(payloads).not.toEqual([]);
    expect(payloads.some((payload) =>
      JSON.stringify(payload).includes(secretCss)
      || 'css' in payload
      || 'html' in payload
      || 'dom' in payload
      || 'error' in payload
    )).toBeFalse();
  });

  it('attributes reset analytics to the attempt that was reset', fakeAsync(() => {
    analytics.track.calls.reset();
    component.activateEditor();
    tick(1_600);

    component.reset();

    const resetCall = analytics.track.calls.allArgs().find(([, payload]) =>
      payload?.['action'] === 'reset',
    );
    expect(resetCall?.[0]).toBe('trivia_lab_interacted');
    expect(resetCall?.[1]).toEqual(jasmine.objectContaining({
      scenario_id: 'missing-inset',
      attempt_bucket: 'first',
      elapsed_sec: 2,
      action: 'reset',
    }));
    expect(component.state().attempt).toBe(2);
  }));

  it('tracks a qualified view only after 50% remains visible for one second', fakeAsync(() => {
    analytics.track.calls.reset();
    const observer = observerInstance as unknown as IntersectionObserver;

    observerCallback?.([
      { isIntersecting: true, intersectionRatio: 0.5 } as IntersectionObserverEntry,
    ], observer);
    tick(999);
    expect(analytics.track).not.toHaveBeenCalledWith('trivia_lab_viewed', jasmine.anything());

    tick(1);
    expect(analytics.track).toHaveBeenCalledWith(
      'trivia_lab_viewed',
      jasmine.objectContaining({ question_id: 'css-position-sticky-not-working' }),
    );
  }));

  it('cleans up preview, observation, and pending inspection on destroy', fakeAsync(() => {
    preview.inspect.and.returnValue(new Promise(() => undefined));
    void component.runInspection();
    const signal = preview.inspect.calls.mostRecent().args[0].signal;

    fixture.destroy();
    tick();

    expect(signal.aborted).toBeTrue();
    expect(preview.destroy).toHaveBeenCalledTimes(1);
    expect(observerInstance?.disconnect).toHaveBeenCalled();
  }));

  function inspection(finding: CssStickyInspection['finding']): CssStickyInspection {
    return {
      finding,
      working: finding === 'working',
      summary: finding === 'working' ? 'Sticky geometry verified.' : 'Broken geometry proved.',
      evidence: ['Measured in the isolated preview.'],
      computed: {
        position: 'sticky',
        insetBlockStart: '0px',
        insetBlockEnd: 'auto',
        zIndex: 'auto',
      },
      ancestors: [{
        index: 0,
        selector: '[data-scroll-root]',
        tagName: 'main',
        overflowX: 'auto',
        overflowY: 'auto',
        display: 'block',
        alignItems: 'normal',
        alignSelf: 'auto',
        clientHeight: 260,
        scrollHeight: 720,
        isScrollContainer: true,
      }],
      geometry: {
        targetTopBefore: 16,
        targetTopAfter: 16,
        targetHeight: 48,
        containingBlockHeight: 700,
        scrollOwnerTop: 12,
        scrollTopBefore: 64,
        scrollTopAfter: 128,
        maxScroll: 460,
        availableTravel: 652,
      },
      suspectAncestorIndex: 0,
    };
  }
});
