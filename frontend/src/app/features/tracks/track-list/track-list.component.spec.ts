import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TrackListComponent } from './track-list.component';
import { SeoService } from '../../../core/services/seo.service';

describe('TrackListComponent', () => {
  let seo: jasmine.SpyObj<SeoService>;

  beforeEach(async () => {
    seo = jasmine.createSpyObj<SeoService>('SeoService', ['updateTags', 'buildCanonicalUrl']);
    seo.buildCanonicalUrl.and.callFake((value: string) => {
      const raw = String(value || '').trim();
      if (!raw) return 'https://frontendatlas.com/';
      if (/^https?:\/\//i.test(raw)) return raw;
      return raw.startsWith('/')
        ? `https://frontendatlas.com${raw}`
        : `https://frontendatlas.com/${raw}`;
    });

    await TestBed.configureTestingModule({
      imports: [TrackListComponent, RouterTestingModule],
      providers: [{ provide: SeoService, useValue: seo }],
    }).compileComponents();
  });

  it('renders crawlable interview hub links in the hero section', async () => {
    const fixture = TestBed.createComponent(TrackListComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const native = fixture.nativeElement as HTMLElement;
    const masterHub = native.querySelector('a[href="/interview-questions"]');
    const reactHub = native.querySelector('a[href="/react/interview-questions"]');
    const angularHub = native.querySelector('a[href="/angular/interview-questions"]');
    const vueHub = native.querySelector('a[href="/vue/interview-questions"]');
    const htmlHub = native.querySelector('a[href="/html/interview-questions"]');
    const cssHub = native.querySelector('a[href="/css/interview-questions"]');
    const htmlCssHub = native.querySelector('a[href="/html-css/interview-questions"]');

    expect(masterHub).toBeTruthy();
    expect(reactHub).toBeTruthy();
    expect(angularHub).toBeTruthy();
    expect(vueHub).toBeTruthy();
    expect(htmlHub).toBeTruthy();
    expect(cssHub).toBeTruthy();
    expect(htmlCssHub).toBeTruthy();
  });

  it('keeps interview question hubs in prep sequence ordering', () => {
    const fixture = TestBed.createComponent(TrackListComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const hubStep = component.trackPrepSequence.find(
      (entry) => typeof entry === 'object' && entry?.route?.[0] === '/interview-questions',
    ) as { text?: string } | undefined;

    expect(hubStep).toBeTruthy();
    expect(hubStep?.text).toContain('Interview question hubs');
  });

  it('publishes tracks CollectionPage schema with breadcrumb', () => {
    const fixture = TestBed.createComponent(TrackListComponent);
    fixture.detectChanges();

    expect(seo.updateTags).toHaveBeenCalled();
    const payload = seo.updateTags.calls.mostRecent().args[0] as any;
    const graph = Array.isArray(payload?.jsonLd) ? payload.jsonLd : [];
    const collection = graph.find((entry: any) => entry?.['@type'] === 'CollectionPage');
    const breadcrumb = graph.find((entry: any) => entry?.['@type'] === 'BreadcrumbList');

    expect(collection).toBeTruthy();
    expect(collection?.url).toContain('/tracks');
    expect(collection?.mainEntity?.['@type']).toBe('ItemList');
    expect(Array.isArray(collection?.mentions)).toBeTrue();
    expect(breadcrumb).toBeTruthy();
  });
});
