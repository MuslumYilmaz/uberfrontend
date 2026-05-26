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

  it('renders a clean frontend machine-coding hub with start-plan entry points', () => {
    const host = fixture.nativeElement as HTMLElement;
    const text = host.textContent || '';
    const primaryCta = host.querySelector('[data-testid="machine-coding-primary-cta"]') as HTMLAnchorElement | null;
    const planCta = host.querySelector('[data-testid="machine-coding-plan-cta"]') as HTMLAnchorElement | null;

    expect(text).toContain('Frontend Machine Coding Interview Questions');
    expect(text).toContain('frontend UI coding rounds');
    expect(text).toContain('Build real UI, then explain the decisions behind it');
    expect(text).toContain('JavaScript utility rounds');
    expect(text).toContain('React machine coding');
    expect(text).toContain('System design follow-up');
    expect(text).toContain('30-day guided plan');
    expect(primaryCta?.getAttribute('href') || '').toContain('/coding?view=formats&category=ui&reset=1');
    expect(planCta?.getAttribute('href') || '').toContain('/tracks/foundations-30d/preview');
  });

  it('publishes CollectionPage schema for machine-coding intent', () => {
    expect(seo.updateTags).toHaveBeenCalled();
    const payload = seo.updateTags.calls.mostRecent().args[0] as any;
    const graph = Array.isArray(payload.jsonLd) ? payload.jsonLd : [];
    const collection = graph.find((entry: any) => entry?.['@type'] === 'CollectionPage');

    expect(payload.title).toBe('Frontend Machine Coding Interview Questions');
    expect(payload.description).toContain('frontend machine coding and UI coding interview questions');
    expect(payload.canonical).toBe('/machine-coding');
    expect(collection).toBeTruthy();
    expect(collection?.about?.some((entry: any) => entry?.name === 'frontend machine coding questions')).toBeTrue();
    expect(collection?.mentions?.some((entry: any) => entry?.name === '30-day guided plan')).toBeTrue();
  });
});
