import { ApplicationRef, Component, PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, RouterModule } from '@angular/router';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { GuideShellComponent } from './guide-shell.component';

@Component({
    imports: [GuideShellComponent, RouterModule],
    template: `
    <fa-guide-shell
      title="Guide Title"
      [minutes]="10"
      [tags]="['guides']"
      [prev]="prev"
      [next]="next"
      [leftNav]="leftNav"
      [readerPromise]="readerPromise"
    >
      <h2>Body Section</h2>
      <p><a [routerLink]="['/guides', 'system-design-blueprint', 'body-target']">Body link</a></p>
      <p><a href="#body-section">Hash link</a></p>
      <p><a href="https://example.com/external">External link</a></p>
      <h2>Another Section</h2>
      <p>More guide body text to keep the shell realistic.</p>
      <div class="table-scroll" tabindex="0" role="region" aria-label="Scrollable table">
        <table><thead><tr><th>Area</th></tr></thead><tbody><tr><td>Authored wrapper</td></tr></tbody></table>
      </div>
      <table><thead><tr><th>Bare</th></tr></thead><tbody><tr><td>Runtime wrapper</td></tr></tbody></table>
      <pre><code>const answer = 42;</code></pre>
      <div class="code-wrap"><pre><code>const authored = true;</code></pre></div>
    </fa-guide-shell>
  `
})
class TestGuideShellHostComponent {
  readerPromise: string | undefined = 'Custom guide promise for readers.';
  prev = ['/', 'guides', 'interview-blueprint', 'previous-guide'];
  next = ['/', 'guides', 'interview-blueprint', 'next-guide'];
  leftNav = {
    title: 'Guide nav',
    sections: [
      {
        title: 'Section',
        items: [
          { title: 'Previous guide', link: ['/', 'guides', 'interview-blueprint', 'previous-guide'] },
          { title: 'Current guide', link: ['/', 'guides', 'interview-blueprint', 'test-guide'], active: true },
          { title: 'Related guide', link: ['/', 'guides', 'interview-blueprint', 'related-guide'] },
        ],
      },
    ],
  };
}

describe('GuideShellComponent', () => {
  let fixture: ComponentFixture<TestGuideShellHostComponent>;
  let analytics: jasmine.SpyObj<AnalyticsService>;
  let originalPath = '';
  let originalHiddenDescriptor: PropertyDescriptor | undefined;

  function shellInstance(): GuideShellComponent {
    return fixture.debugElement.query(By.directive(GuideShellComponent)).componentInstance as GuideShellComponent;
  }

  function trackCalls(eventName: string) {
    return analytics.track.calls.allArgs().filter(([name]) => name === eventName);
  }

  function setDocumentHidden(value: boolean) {
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => value,
    });
  }

  function resetGuideAnalyticsState(shell: any) {
    if (shell.guideVisibleIntervalId !== null) {
      window.clearInterval(shell.guideVisibleIntervalId);
      shell.guideVisibleIntervalId = null;
    }

    shell.maxGuideDepthPercent = 0;
    shell.trackedGuideDepths = new Set<number>();
    shell.guideReadEngagedTracked = false;
    shell.visibleGuideMs = 0;
  }

  function dispatchTrackedClick(anchor: HTMLAnchorElement) {
    anchor.addEventListener('click', (event) => event.preventDefault(), { once: true });
    anchor.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  }

  beforeEach(async () => {
    analytics = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', ['track']);
    analytics.track.and.stub();
    originalPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    originalHiddenDescriptor = Object.getOwnPropertyDescriptor(document, 'hidden');
    setDocumentHidden(false);
    window.history.pushState({}, '', '/guides/interview-blueprint/test-guide');

    await TestBed.configureTestingModule({
      imports: [TestGuideShellHostComponent],
      providers: [
        provideRouter([]),
        { provide: AnalyticsService, useValue: analytics },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TestGuideShellHostComponent);
    fixture.detectChanges();

    // Keep analytics assertions independent from history mutations leaked by
    // unrelated specs in a randomized full-suite run.
    const shell = shellInstance() as any;
    shell.shellClickCleanup?.();
    shell.shellClickCleanup = null;
    shell.guidePath = { section: 'interview-blueprint', slug: 'test-guide' };
    shell.attachGuideLinkTracking();
  });

  afterEach(() => {
    fixture?.destroy();
    window.history.pushState({}, '', originalPath || '/');
    if (originalHiddenDescriptor) {
      Object.defineProperty(document, 'hidden', originalHiddenDescriptor);
    } else {
      delete (document as any).hidden;
    }
  });

  it('keeps Angular stable while the guide visibility timer is active', async () => {
    const shell = shellInstance() as any;

    expect(shell.guideVisibleIntervalId).not.toBeNull();
    await fixture.whenStable();
    expect(fixture.isStable()).toBeTrue();
  });

  it('fires scroll depth exactly once per threshold', () => {
    const shell = shellInstance() as any;
    analytics.track.calls.reset();
    resetGuideAnalyticsState(shell);
    spyOn(shell, 'computeGuideScrollDepth').and.returnValues(30, 60, 100, 100);

    shell.updateGuideScrollDepth();
    shell.updateGuideScrollDepth();
    shell.updateGuideScrollDepth();
    shell.updateGuideScrollDepth();

    const depths = trackCalls('guide_scroll_depth').map(([, params]) => (params as any).depth_percent);
    expect(depths).toEqual([25, 50, 75, 100]);
  });

  it('waits for both time and scroll depth before tracking engaged read', fakeAsync(() => {
    const shell = shellInstance() as any;
    analytics.track.calls.reset();
    resetGuideAnalyticsState(shell);
    spyOn(shell, 'computeGuideScrollDepth').and.returnValue(60);

    shell.startGuideVisibilityTimer();
    shell.updateGuideScrollDepth();
    tick(44_000);
    expect(trackCalls('guide_read_engaged').length).toBe(0);

    tick(1_000);
    expect(trackCalls('guide_read_engaged').length).toBe(1);
    expect(trackCalls('guide_read_engaged')[0][1]).toEqual(jasmine.objectContaining({
      guide_section: 'interview-blueprint',
      guide_slug: 'test-guide',
      max_depth_percent: 60,
      seconds_visible: 45,
    }));

    fixture.destroy();
  }));

  it('does not count hidden-tab time toward engaged read', fakeAsync(() => {
    const shell = shellInstance() as any;
    analytics.track.calls.reset();
    resetGuideAnalyticsState(shell);
    spyOn(shell, 'computeGuideScrollDepth').and.returnValue(60);

    shell.startGuideVisibilityTimer();
    shell.updateGuideScrollDepth();
    setDocumentHidden(true);
    tick(45_000);
    expect(trackCalls('guide_read_engaged').length).toBe(0);

    setDocumentHidden(false);
    tick(45_000);
    expect(trackCalls('guide_read_engaged').length).toBe(1);

    fixture.destroy();
  }));

  it('tracks body, related, footer, and left-nav internal link clicks', () => {
    analytics.track.calls.reset();

    const contentAnchors = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('.content a'),
    ) as HTMLAnchorElement[];
    const bodyLink = contentAnchors.find((anchor) => anchor.textContent?.includes('Body link')) as HTMLAnchorElement;
    const relatedLink = fixture.nativeElement.querySelector('.related a') as HTMLAnchorElement;
    const footerLink = fixture.nativeElement.querySelector('.footer-nav a') as HTMLAnchorElement;
    const leftNavLink = fixture.nativeElement.querySelector('.left .item') as HTMLAnchorElement;

    [bodyLink, relatedLink, footerLink, leftNavLink].forEach((anchor) => {
      dispatchTrackedClick(anchor);
    });

    const locations = trackCalls('guide_internal_link_clicked').map(([, params]) => (params as any).location);
    expect(locations).toEqual(['body', 'related', 'footer_nav', 'left_nav']);
  });

  it('ignores toc hash links and external links', () => {
    analytics.track.calls.reset();

    const tocLink = fixture.nativeElement.querySelector('.toc a') as HTMLAnchorElement;
    const contentAnchors = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('.content a'),
    ) as HTMLAnchorElement[];
    const externalLink = contentAnchors.find((anchor) => anchor.textContent?.includes('External link')) as HTMLAnchorElement;

    dispatchTrackedClick(tocLink);
    dispatchTrackedClick(externalLink);

    expect(trackCalls('guide_internal_link_clicked').length).toBe(0);
  });

  it('wraps projected tables and code blocks once, in the browser, after render', () => {
    TestBed.inject(ApplicationRef).tick();
    const content = fixture.nativeElement.querySelector('fa-guide-shell .content') as HTMLElement;

    const tables = Array.from(content.querySelectorAll('table'));
    expect(tables.length).toBe(2);
    for (const table of tables) {
      const wrap = table.parentElement as HTMLElement;
      expect(wrap.classList.contains('table-scroll')).toBeTrue();
      expect(wrap.getAttribute('role')).toBe('region');
      expect(wrap.getAttribute('tabindex')).toBe('0');
      expect(wrap.getAttribute('aria-label')).toBe('Scrollable table');
    }
    expect(content.querySelectorAll('.table-scroll').length).toBe(2);
    expect(content.querySelectorAll('.table-scroll > .table-scroll').length).toBe(0);
    // One wrapper per code block, whether the template authored it or not, and one Copy button each.
    expect(content.querySelectorAll('pre > code').length).toBe(2);
    expect(content.querySelectorAll('.code-wrap').length).toBe(2);
    expect(content.querySelectorAll('.code-wrap > .code-wrap').length).toBe(0);
    expect(content.querySelectorAll('.code-wrap > .code-copy').length).toBe(2);
    for (const pre of Array.from(content.querySelectorAll('pre'))) {
      expect(pre.parentElement?.classList.contains('code-wrap')).toBeTrue();
      expect(pre.parentElement?.querySelectorAll(':scope > .code-copy').length).toBe(1);
    }

    // Re-running the enhancers (a second render, a client navigation) is a no-op.
    const shell = shellInstance() as any;
    shell.enhanceTables(content);
    shell.enhanceCodeBlocks(content);
    expect(content.querySelectorAll('.table-scroll').length).toBe(2);
    expect(content.querySelectorAll('.code-wrap').length).toBe(2);
    expect(content.querySelectorAll('.code-copy').length).toBe(2);
  });

  it('only assigns heading ids during server rendering so hydration sees the authored DOM', async () => {
    fixture.destroy();
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [TestGuideShellHostComponent],
      providers: [
        provideRouter([]),
        { provide: AnalyticsService, useValue: analytics },
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    }).compileComponents();
    const serverFixture = TestBed.createComponent(TestGuideShellHostComponent);
    serverFixture.detectChanges();
    TestBed.inject(ApplicationRef).tick();
    const content = serverFixture.nativeElement.querySelector('fa-guide-shell .content') as HTMLElement;

    const headings = Array.from(content.querySelectorAll('h2')) as HTMLHeadingElement[];
    expect(headings.length).toBe(2);
    expect(headings.every((heading) => heading.id.length > 0)).toBeTrue();

    // Only the authored wrappers exist; the bare table and the bare code block keep their template structure.
    expect(content.querySelectorAll('.table-scroll').length).toBe(1);
    const bareTables = Array.from(content.querySelectorAll('table'))
      .filter((table) => !table.parentElement?.classList.contains('table-scroll'));
    expect(bareTables.length).toBe(1);
    expect(content.querySelectorAll('.code-wrap').length).toBe(1);
    expect(content.querySelectorAll('.code-copy').length).toBe(0);
    serverFixture.destroy();
  });

  it('renders readerPromise when supplied and falls back when absent', () => {
    const intentLead = fixture.nativeElement.querySelector('.intent-lead') as HTMLElement;
    expect(intentLead.textContent?.trim()).toBe('Custom guide promise for readers.');

    fixture.componentInstance.readerPromise = undefined;
    fixture.detectChanges();

    expect(intentLead.textContent?.trim()).toBe((shellInstance() as any).fallbackReaderPromise);
  });
});
