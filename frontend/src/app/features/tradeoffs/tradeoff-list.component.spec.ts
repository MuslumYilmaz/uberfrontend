import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { SeoService } from '../../core/services/seo.service';
import { TradeoffBattleProgressService } from '../../core/services/tradeoff-battle-progress.service';
import { TradeoffListComponent } from './tradeoff-list.component';

describe('TradeoffListComponent', () => {
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
      imports: [TradeoffListComponent, RouterTestingModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: {
                tradeoffBattleList: {
                  items: [
                    {
                      id: 'context-vs-zustand-vs-redux',
                      title: 'Context vs Zustand vs Redux for a growing React dashboard',
                      tech: 'react',
                      difficulty: 'intermediate',
                      summary: 'Shared state tradeoff question.',
                      tags: ['react', 'tradeoffs'],
                      access: 'free',
                      estimatedMinutes: 14,
                      updatedAt: '2026-03-21',
                    },
                  ],
                },
              },
            },
          },
        },
        {
          provide: TradeoffBattleProgressService,
          useValue: {
            getRecord: () => ({
              started: false,
              completed: false,
              lastPlayedAt: null,
              selectedOptionId: '',
            }),
          },
        },
        { provide: SeoService, useValue: seo },
      ],
    }).compileComponents();
  });

  it('publishes CollectionPage schema for tradeoff battles', async () => {
    const fixture = TestBed.createComponent(TradeoffListComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(seo.updateTags).toHaveBeenCalled();
    const payload = seo.updateTags.calls.mostRecent().args[0] as any;
    const graph = Array.isArray(payload?.jsonLd) ? payload.jsonLd : [];
    const collection = graph.find((entry: any) => entry?.['@type'] === 'CollectionPage');
    const breadcrumb = graph.find((entry: any) => entry?.['@type'] === 'BreadcrumbList');

    expect(collection).toBeTruthy();
    expect(collection?.url || '').toContain('/tradeoffs');
    expect(collection?.mainEntity?.itemListElement?.[0]?.url || '').toContain('/tradeoffs/context-vs-zustand-vs-redux');
    expect(breadcrumb).toBeTruthy();
  });

  it('renders a premium badge for locked battles', async () => {
    const fixture = TestBed.createComponent(TradeoffListComponent);
    fixture.componentInstance.items.set([
      {
        id: 'sse-vs-websocket-live-dashboard',
        title: 'SSE vs WebSocket for a live operations dashboard',
        tech: 'javascript',
        difficulty: 'intermediate',
        summary: 'Live transport tradeoff question.',
        tags: ['javascript', 'tradeoffs'],
        access: 'premium',
        estimatedMinutes: 13,
        updatedAt: '2026-03-21',
      } as any,
    ]);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent || '').toContain('Premium');
  });

  it('filters tradeoff battles by selected tech', async () => {
    const fixture = TestBed.createComponent(TradeoffListComponent);
    fixture.componentInstance.items.set([
      {
        id: 'context-vs-zustand-vs-redux',
        title: 'Context vs Zustand vs Redux for a growing React dashboard',
        tech: 'react',
        difficulty: 'intermediate',
        summary: 'Shared state tradeoff question.',
        tags: ['react', 'tradeoffs'],
        access: 'free',
        estimatedMinutes: 14,
        updatedAt: '2026-03-21',
      } as any,
      {
        id: 'reactive-forms-vs-template-driven-angular',
        title: 'Reactive forms vs template-driven forms for a growing Angular workflow',
        tech: 'angular',
        difficulty: 'intermediate',
        summary: 'Angular forms tradeoff question.',
        tags: ['angular', 'tradeoffs'],
        access: 'free',
        estimatedMinutes: 13,
        updatedAt: '2026-03-21',
      } as any,
    ]);

    fixture.componentInstance.setSelectedTech('react');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent || '';
    expect(text).toContain('Context vs Zustand vs Redux');
    expect(text).not.toContain('Reactive forms vs template-driven forms');
  });

  it('sorts battles from easy to hard and moves premium items to the bottom', async () => {
    const fixture = TestBed.createComponent(TradeoffListComponent);
    fixture.componentInstance.items.set([
      {
        id: 'premium-easy',
        title: 'Premium Easy Battle',
        tech: 'vue',
        difficulty: 'easy',
        summary: 'Premium easy question.',
        tags: ['vue'],
        access: 'premium',
        estimatedMinutes: 11,
        updatedAt: '2026-03-30',
      } as any,
      {
        id: 'free-hard',
        title: 'Free Hard Battle',
        tech: 'vue',
        difficulty: 'hard',
        summary: 'Free hard question.',
        tags: ['vue'],
        access: 'free',
        estimatedMinutes: 11,
        updatedAt: '2026-03-30',
      } as any,
      {
        id: 'free-medium',
        title: 'Free Medium Battle',
        tech: 'vue',
        difficulty: 'intermediate',
        summary: 'Free medium question.',
        tags: ['vue'],
        access: 'free',
        estimatedMinutes: 11,
        updatedAt: '2026-03-30',
      } as any,
      {
        id: 'free-easy',
        title: 'Free Easy Battle',
        tech: 'vue',
        difficulty: 'easy',
        summary: 'Free easy question.',
        tags: ['vue'],
        access: 'free',
        estimatedMinutes: 11,
        updatedAt: '2026-03-30',
      } as any,
    ]);

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const titles = Array.from(
      fixture.nativeElement.querySelectorAll('.tradeoff-card h2'),
      (node: Element) => node.textContent?.trim() ?? '',
    );

    expect(titles).toEqual([
      'Free Easy Battle',
      'Free Medium Battle',
      'Free Hard Battle',
      'Premium Easy Battle',
    ]);
    expect(fixture.nativeElement.textContent || '').toContain('Medium');
    expect(fixture.nativeElement.textContent || '').not.toContain('11 min');
  });
});
