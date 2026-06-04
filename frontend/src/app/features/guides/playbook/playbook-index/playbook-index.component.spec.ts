import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { OfflineService } from '../../../../core/services/offline';
import { SeoService } from '../../../../core/services/seo.service';
import { PlaybookIndexComponent } from './playbook-index.component';

describe('PlaybookIndexComponent', () => {
  let fixture: ComponentFixture<PlaybookIndexComponent>;
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
      imports: [PlaybookIndexComponent, RouterTestingModule],
      providers: [
        { provide: SeoService, useValue: seo },
        { provide: OfflineService, useValue: { isOnline: () => true } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PlaybookIndexComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  function text(): string {
    return fixture.nativeElement.textContent || '';
  }

  function hasLink(href: string): boolean {
    return Boolean((fixture.nativeElement as HTMLElement).querySelector(`a[href="${href}"]`));
  }

  it('renders the interview playbook as a hub with section headings', () => {
    const pageText = text();
    const headings = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('h2'))
      .map((heading) => (heading.textContent || '').trim());

    expect(pageText).toContain('Frontend Interview Playbook Hub');
    expect(pageText).toContain('Start with the Frontend interview preparation guide');
    expect(hasLink('/guides/interview-blueprint/intro')).toBeTrue();
    expect(headings).toContain('Introduction');
    expect(headings).toContain('Coding interviews');
    expect(headings).toContain('User interface');
    expect(headings).toContain('Framework prep paths');
    expect(headings).toContain('System design');
    expect(headings).toContain('Fundamentals');
    expect(headings).toContain('Resume preparation');
  });

  it('publishes CollectionPage, ItemList, BreadcrumbList, and FAQPage schema', () => {
    expect(seo.updateTags).toHaveBeenCalled();
    const payload = seo.updateTags.calls.mostRecent().args[0] as any;
    const graph = Array.isArray(payload?.jsonLd) ? payload.jsonLd : [];
    const collection = graph.find((entry: any) => entry?.['@type'] === 'CollectionPage');
    const itemList = graph.find((entry: any) => entry?.['@type'] === 'ItemList');
    const breadcrumbs = graph.find((entry: any) => entry?.['@type'] === 'BreadcrumbList');
    const faq = graph.find((entry: any) => entry?.['@type'] === 'FAQPage');

    expect(payload.title).toBe('Frontend Interview Playbook Hub');
    expect(payload.canonical).toBe('/guides/interview-blueprint');
    expect(payload.keywords).toContain('frontend interview playbook hub');
    expect(collection).toBeTruthy();
    expect(collection?.mainEntity?.['@id']).toBe('https://frontendatlas.com/guides/interview-blueprint#frontend-interview-playbook-guides');
    expect(itemList?.itemListElement?.length).toBeGreaterThan(8);
    expect(itemList?.itemListElement?.[0]?.name).toBe('Frontend Interview Preparation Guide (2026): Rounds, Roadmap, Questions');
    expect(itemList?.itemListElement?.[0]?.url).toBe('https://frontendatlas.com/guides/interview-blueprint/intro');
    expect(itemList?.itemListElement?.some((entry: any) => String(entry?.url || '').includes('/guides/framework-prep/react-prep-path'))).toBeTrue();
    expect(breadcrumbs).toBeTruthy();
    expect(faq?.mainEntity?.length).toBe(3);
    expect(faq?.mainEntity?.[0]?.name).toBe('What is the Frontend Interview Playbook Hub?');
  });
});
