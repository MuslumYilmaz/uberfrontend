import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { SeoService } from '../../../core/services/seo.service';
import { OfflineService } from '../../../core/services/offline';
import { FrameworkPrepIndexComponent } from './framework-prep-index.component';

describe('FrameworkPrepIndexComponent', () => {
  let seo: jasmine.SpyObj<SeoService>;

  async function createComponent(): Promise<ComponentFixture<FrameworkPrepIndexComponent>> {
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
      imports: [FrameworkPrepIndexComponent, RouterTestingModule],
      providers: [
        { provide: SeoService, useValue: seo },
        { provide: OfflineService, useValue: { isOnline: () => true } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(FrameworkPrepIndexComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  function text(fixture: ComponentFixture<FrameworkPrepIndexComponent>): string {
    return fixture.nativeElement.textContent || '';
  }

  function hasLink(fixture: ComponentFixture<FrameworkPrepIndexComponent>, href: string): boolean {
    return Boolean((fixture.nativeElement as HTMLElement).querySelector(`a[href="${href}"]`));
  }

  it('renders all four framework path cards with target keywords', async () => {
    const fixture = await createComponent();
    const host = fixture.nativeElement as HTMLElement;
    const cards = host.querySelectorAll('[data-testid="framework-path-cards"] .cluster-card');
    const pageText = text(fixture);

    expect(cards.length).toBe(4);
    expect(pageText).toContain('Frontend Framework Interview Preparation Roadmap');
    expect(pageText).toContain('JavaScript Interview Prep Path');
    expect(pageText).toContain('React Interview Preparation Path');
    expect(pageText).toContain('Angular Interview Preparation Path');
    expect(pageText).toContain('Vue Interview Preparation Path');
  });

  it('renders chooser, matrix, roadmap, intent clusters, mistakes, and FAQ sections', async () => {
    const fixture = await createComponent();
    const pageText = text(fixture);

    expect(pageText).toContain('Choose your framework prep path');
    expect(pageText).toContain('Framework comparison matrix');
    expect(pageText).toContain('7/14/30-day framework prep roadmap');
    expect(pageText).toContain('Framework prep by role level');
    expect(pageText).toContain('Framework prep by interview round type');
    expect(pageText).toContain('What to practice next');
    expect(pageText).toContain('Common framework interview mistakes');
    expect(pageText).toContain('Frontend framework interview preparation FAQ');
    expect(pageText).toContain('Switching frameworks too often');
    expect(pageText).toContain('Do React interviews still test JavaScript?');
  });

  it('renders long-tail framework prep intent copy', async () => {
    const fixture = await createComponent();
    const pageText = text(fixture);

    expect(pageText).toContain('which frontend framework should I prepare for interviews');
    expect(pageText).toContain('JavaScript interview prep path for frontend developers');
    expect(pageText).toContain('React interview preparation roadmap');
    expect(pageText).toContain('React machine coding interview preparation');
    expect(pageText).toContain('Angular interview prep RxJS change detection DI');
    expect(pageText).toContain('Vue interview prep reactivity component communication');
    expect(pageText).toContain('30 day frontend interview preparation roadmap');
    expect(pageText).toContain('senior frontend framework interview preparation');
    expect(pageText).toContain('when to move from framework prep to frontend system design');
  });

  it('includes internal links to framework detail pages and next practice hubs', async () => {
    const fixture = await createComponent();

    expect(hasLink(fixture, '/guides/framework-prep/javascript-prep-path')).toBeTrue();
    expect(hasLink(fixture, '/guides/framework-prep/javascript-prep-path/mastery')).toBeTrue();
    expect(hasLink(fixture, '/guides/framework-prep/react-prep-path')).toBeTrue();
    expect(hasLink(fixture, '/guides/framework-prep/angular-prep-path')).toBeTrue();
    expect(hasLink(fixture, '/guides/framework-prep/vue-prep-path')).toBeTrue();
    expect(hasLink(fixture, '/coding')).toBeTrue();
    expect(hasLink(fixture, '/tracks')).toBeTrue();
    expect(hasLink(fixture, '/system-design')).toBeTrue();
    expect(hasLink(fixture, '/companies')).toBeTrue();
  });

  it('publishes CollectionPage with ItemList and FAQPage schema', async () => {
    await createComponent();

    expect(seo.updateTags).toHaveBeenCalled();
    const payload = seo.updateTags.calls.mostRecent().args[0] as any;
    const graph = Array.isArray(payload?.jsonLd) ? payload.jsonLd : [];
    const collection = graph.find((entry: any) => entry?.['@type'] === 'CollectionPage');
    const faq = graph.find((entry: any) => entry?.['@type'] === 'FAQPage');
    const itemList = collection?.mainEntity;

    expect(payload.title).toBe('Frontend Framework Interview Preparation Roadmap');
    expect(payload.description).toContain('7/14/30-day frontend interview preparation roadmap');
    expect(collection).toBeTruthy();
    expect(itemList?.['@type']).toBe('ItemList');
    expect(itemList?.itemListElement?.length).toBe(4);
    expect(itemList?.itemListElement?.[0]?.name).toBe('JavaScript Interview Prep Path');
    expect(payload.keywords).toContain('React machine coding interview preparation');
    expect(payload.keywords).toContain('30 day frontend interview preparation roadmap');
    expect(faq).toBeTruthy();
    expect(faq?.mainEntity?.length).toBe(5);
    expect(faq?.mainEntity?.[0]?.name).toBe('Which framework should I prepare first?');
  });
});
