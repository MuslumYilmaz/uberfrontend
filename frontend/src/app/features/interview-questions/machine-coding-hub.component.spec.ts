import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { SeoService } from '../../core/services/seo.service';
import { MachineCodingHubComponent } from './machine-coding-hub.component';

describe('MachineCodingHubComponent', () => {
  let fixture: ComponentFixture<MachineCodingHubComponent>;
  let seo: jasmine.SpyObj<SeoService>;

  beforeEach(async () => {
    seo = jasmine.createSpyObj<SeoService>('SeoService', ['updateTags', 'buildCanonicalUrl']);
    seo.buildCanonicalUrl.and.callFake((value: string) => {
      const raw = String(value || '').trim();
      if (!raw) return 'https://frontendatlas.com/';
      return raw.startsWith('/')
        ? `https://frontendatlas.com${raw}`
        : `https://frontendatlas.com/${raw}`;
    });

    await TestBed.configureTestingModule({
      imports: [MachineCodingHubComponent, RouterTestingModule],
      providers: [{ provide: SeoService, useValue: seo }],
    }).compileComponents();

    fixture = TestBed.createComponent(MachineCodingHubComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('renders a frontend machine-coding hub with start-plan entry points', () => {
    const host = fixture.nativeElement as HTMLElement;
    const text = host.textContent || '';
    const primaryCta = host.querySelector('[data-testid="machine-coding-primary-cta"]') as HTMLAnchorElement | null;
    const planCta = host.querySelector('[data-testid="machine-coding-plan-cta"]') as HTMLAnchorElement | null;

    expect(text).toContain('Frontend Machine Coding Interview Questions');
    expect(text).toContain('Practice frontend machine coding questions with React UI prompts');
    expect(text).toContain('Most asked frontend machine coding questions');
    expect(text).toContain('JavaScript utility rounds');
    expect(text).toContain('React machine coding');
    expect(text).toContain('System design follow-up');
    expect(text).toContain('30-day guided plan');
    expect(primaryCta?.getAttribute('href') || '').toContain('/coding?view=formats&category=ui&reset=1');
    expect(planCta?.getAttribute('href') || '').toContain('/tracks/foundations-30d/preview');
  });

  it('renders the core machine-coding prompt inventory with practice links', () => {
    const host = fixture.nativeElement as HTMLElement;
    const text = host.textContent || '';
    const questionCards = host.querySelectorAll('.machine-question-card');
    const autocomplete = host.querySelector('[data-testid="machine-question-3"]') as HTMLAnchorElement | null;
    const nestedCheckbox = host.querySelector('[data-testid="machine-question-5"]') as HTMLAnchorElement | null;
    const dataTable = host.querySelector('[data-testid="machine-question-6"]') as HTMLAnchorElement | null;
    const transferList = host.querySelector('[data-testid="machine-question-12"]') as HTMLAnchorElement | null;

    expect(questionCards.length).toBe(16);
    expect(text).toContain('Autocomplete Search Bar (Hooks)');
    expect(text).toContain('React Nested Checkbox Tree');
    expect(text).toContain('React Paginated Data Table');
    expect(text).toContain('React Transfer List');
    expect(text).toContain('Sync parent, child, and indeterminate states across a recursive nested checkbox tree.');
    expect(text).toContain('Paginate rows, handle empty pages, keep controls stable, and explain client vs server paging.');
    expect(autocomplete?.getAttribute('href') || '').toContain('/react/coding/react-autocomplete-search-starter');
    expect(nestedCheckbox?.getAttribute('href') || '').toContain('/react/coding/react-nested-checkboxes');
    expect(dataTable?.getAttribute('href') || '').toContain('/react/coding/react-pagination-table');
    expect(transferList?.getAttribute('href') || '').toContain('/react/coding/react-transfer-list');
  });

  it('renders rubric, timebox, worked example, and FAQ sections', () => {
    const host = fixture.nativeElement as HTMLElement;
    const text = host.textContent || '';

    expect(host.querySelector('[data-testid="machine-rubric-section"]')).not.toBeNull();
    expect(host.querySelector('[data-testid="machine-timebox-section"]')).not.toBeNull();
    expect(host.querySelector('[data-testid="machine-worked-example"]')).not.toBeNull();
    expect(host.querySelector('[data-testid="machine-faq-section"]')).not.toBeNull();
    expect(text).toContain('How interviewers evaluate machine coding rounds');
    expect(text).toContain('60-minute machine coding strategy');
    expect(text).toContain('Worked example: React autocomplete search bar interview question');
    expect(text).toContain('Frontend machine coding FAQ');
    expect(text).toContain('State ownership');
    expect(text).toContain('0-10 min');
    expect(text).toContain('Support keyboard navigation, selection, loading, no-results, and error states.');
    expect(text).toContain('What is a frontend machine coding round?');
    expect(text).toContain('How are frontend UI coding interviews evaluated?');
    expect(text).toContain('How should I prepare for a 60-minute machine coding round?');
  });

  it('publishes CollectionPage schema for machine-coding intent', () => {
    expect(seo.updateTags).toHaveBeenCalled();
    const payload = seo.updateTags.calls.mostRecent().args[0] as any;
    const graph = Array.isArray(payload.jsonLd) ? payload.jsonLd : [];
    const collection = graph.find((entry: any) => entry?.['@type'] === 'CollectionPage');
    const itemList = graph.find((entry: any) => entry?.['@type'] === 'ItemList');
    const faqPage = graph.find((entry: any) => entry?.['@type'] === 'FAQPage');

    expect(payload.title).toBe('Frontend Machine Coding Interview Questions');
    expect(payload.description).toContain('Practice frontend machine coding questions with React UI prompts');
    expect(payload.canonical).toBe('/machine-coding');
    expect(payload.keywords).toContain('frontend machine coding questions');
    expect(payload.keywords).toContain('frontend UI coding interview questions');
    expect(payload.keywords).toContain('React UI coding interview questions');
    expect(payload.keywords).toContain('frontend coding interview practice with tests');
    expect(collection).toBeTruthy();
    expect(collection?.about?.some((entry: any) => entry?.name === 'frontend machine coding questions')).toBeTrue();
    expect(collection?.about?.some((entry: any) => entry?.name === 'UI component coding interview questions')).toBeTrue();
    expect(collection?.mentions?.some((entry: any) => entry?.name === '30-day guided plan')).toBeTrue();
    expect(itemList?.numberOfItems).toBe(16);
    expect(itemList?.itemListElement?.some((entry: any) => entry?.name === 'Autocomplete Search Bar (Hooks)')).toBeTrue();
    expect(faqPage?.mainEntity?.some((entry: any) => entry?.name === 'What is a frontend machine coding round?')).toBeTrue();
    expect(faqPage?.mainEntity?.some((entry: any) => entry?.name === 'How should I prepare for a 60-minute machine coding round?')).toBeTrue();
  });
});
