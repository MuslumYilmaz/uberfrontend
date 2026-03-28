import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { IncidentListComponent } from './incident-list.component';
import { IncidentProgressService } from '../../core/services/incident-progress.service';
import { SeoService } from '../../core/services/seo.service';

describe('IncidentListComponent', () => {
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
      imports: [IncidentListComponent, RouterTestingModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: {
                incidentList: {
                  items: [
                    {
                      id: 'search-typing-lag',
                      title: 'Search box typing lag under product-card load',
                      tech: 'react',
                      difficulty: 'easy',
                      summary: 'Typing gets laggy after the third character.',
                      signals: ['Typing gets sticky after the third character'],
                      estimatedMinutes: 12,
                      tags: ['performance', 'search', 'react'],
                      updatedAt: '2026-03-19',
                      access: 'free',
                    },
                  ],
                },
              },
            },
          },
        },
        {
          provide: IncidentProgressService,
          useValue: {
            getRecord: () => ({
              started: false,
              completed: false,
              passed: false,
              bestScore: 0,
              lastPlayedAt: null,
              reflectionNote: '',
            }),
          },
        },
        { provide: SeoService, useValue: seo },
      ],
    }).compileComponents();
  });

  it('publishes CollectionPage schema for debug scenarios', async () => {
    const fixture = TestBed.createComponent(IncidentListComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(seo.updateTags).toHaveBeenCalled();
    const payload = seo.updateTags.calls.mostRecent().args[0] as any;
    const graph = Array.isArray(payload?.jsonLd) ? payload.jsonLd : [];
    const collection = graph.find((entry: any) => entry?.['@type'] === 'CollectionPage');
    const breadcrumb = graph.find((entry: any) => entry?.['@type'] === 'BreadcrumbList');

    expect(collection).toBeTruthy();
    expect(collection?.url || '').toContain('/incidents');
    expect(collection?.mainEntity?.['@type']).toBe('ItemList');
    expect(Array.isArray(collection?.mainEntity?.itemListElement)).toBeTrue();
    expect(collection?.mainEntity?.itemListElement?.[0]?.url || '').toContain('/incidents/search-typing-lag');
    expect(breadcrumb).toBeTruthy();
  });

  it('renders a premium chip and preview copy for premium incidents', async () => {
    const fixture = TestBed.createComponent(IncidentListComponent);
    fixture.componentInstance.items.set([
      {
        id: 'context-rerender-storm',
        title: 'Context update causes rerender storm',
        tech: 'react',
        difficulty: 'hard',
        summary: 'One big shared context wakes up too much UI.',
        signals: ['Typing rerenders unrelated UI'],
        estimatedMinutes: 16,
        tags: ['react', 'context'],
        updatedAt: '2026-03-19',
        access: 'premium',
      } as any,
    ]);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent || '').toContain('Premium');
    expect(fixture.nativeElement.textContent || '').toContain('View preview');
    const card = fixture.nativeElement.querySelector('[data-testid="incident-card-context-rerender-storm"]') as HTMLElement | null;
    expect(card?.classList.contains('is-premium')).toBeTrue();
  });
});
