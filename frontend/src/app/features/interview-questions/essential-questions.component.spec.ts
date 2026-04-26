import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SeoService } from '../../core/services/seo.service';
import { UserProgressService } from '../../core/services/user-progress.service';
import { EssentialQuestionsComponent } from './essential-questions.component';

describe('EssentialQuestionsComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EssentialQuestionsComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: {
                essentialQuestions: {
                  collection: {
                    id: 'frontend-essential-60',
                    title: 'FrontendAtlas Essential 60',
                    description: 'Curated shortlist.',
                    updatedAt: '2026-04-23',
                    benchmarkSources: [
                      { label: 'GFE 75', url: 'https://example.com/gfe75' },
                    ],
                    items: [],
                  },
                  items: [
                    {
                      id: 'js-debounce',
                      rank: 1,
                      section: 'javascript-functions',
                      tier: 'must-know',
                      score: 93,
                      primary: { tech: 'javascript', kind: 'coding', id: 'js-debounce' },
                      alternates: [],
                      rationale: 'Timing primitive.',
                      benchmarkTopics: ['debounce'],
                      title: 'Debounce Function',
                      shortDescription: 'Debounce a function.',
                      access: 'free',
                      difficulty: 'intermediate',
                      technologies: ['javascript'],
                      companies: [],
                      tags: ['async'],
                      route: ['/', 'javascript', 'coding', 'js-debounce'],
                      path: '/javascript/coding/js-debounce',
                      isSystemDesign: false,
                      variants: [
                        {
                          tech: 'javascript',
                          kind: 'coding',
                          id: 'js-debounce',
                          title: 'Debounce Function',
                          route: ['/', 'javascript', 'coding', 'js-debounce'],
                          path: '/javascript/coding/js-debounce',
                          access: 'free',
                          difficulty: 'intermediate',
                          techLabel: 'JavaScript',
                        },
                      ],
                    },
                    {
                      id: 'ui-debounced-search',
                      rank: 2,
                      section: 'ui-coding',
                      tier: 'must-know',
                      score: 92,
                      primary: { tech: 'react', kind: 'coding', id: 'react-debounced-search' },
                      alternates: [],
                      rationale: 'Async search.',
                      benchmarkTopics: ['autocomplete'],
                      title: 'Debounced Search with Fake API',
                      shortDescription: 'Build debounced search.',
                      access: 'premium',
                      difficulty: 'intermediate',
                      technologies: ['react', 'angular', 'vue'],
                      companies: ['google', 'netflix'],
                      tags: ['react'],
                      route: ['/', 'react', 'coding', 'react-debounced-search'],
                      path: '/react/coding/react-debounced-search',
                      isSystemDesign: false,
                      variants: [
                        {
                          tech: 'react',
                          kind: 'coding',
                          id: 'react-debounced-search',
                          title: 'React Debounced Search with Fake API',
                          route: ['/', 'react', 'coding', 'react-debounced-search'],
                          path: '/react/coding/react-debounced-search',
                          access: 'premium',
                          difficulty: 'intermediate',
                          techLabel: 'React',
                        },
                        {
                          tech: 'angular',
                          kind: 'coding',
                          id: 'angular-debounced-search',
                          title: 'Angular Debounced Search with Fake API (RxJS)',
                          route: ['/', 'angular', 'coding', 'angular-debounced-search'],
                          path: '/angular/coding/angular-debounced-search',
                          access: 'premium',
                          difficulty: 'intermediate',
                          techLabel: 'Angular',
                        },
                      ],
                    },
                    {
                      id: 'sys-notification-toast-system',
                      rank: 3,
                      section: 'system-design',
                      tier: 'high-leverage',
                      score: 78,
                      primary: { kind: 'system-design', id: 'notification-toast-system' },
                      alternates: [],
                      rationale: 'Global notifications.',
                      benchmarkTopics: ['toast'],
                      title: 'Notification Toast System',
                      shortDescription: 'Design a toast API.',
                      access: 'free',
                      difficulty: 'intermediate',
                      technologies: [],
                      companies: ['google'],
                      tags: ['toast'],
                      route: ['/system-design', 'notification-toast-system'],
                      path: '/system-design/notification-toast-system',
                      isSystemDesign: true,
                      variants: [
                        {
                          kind: 'system-design',
                          id: 'notification-toast-system',
                          title: 'Notification Toast System',
                          route: ['/system-design', 'notification-toast-system'],
                          path: '/system-design/notification-toast-system',
                          access: 'free',
                          difficulty: 'intermediate',
                          techLabel: 'System design',
                        },
                      ],
                    },
                  ],
                },
                seo: {
                  title: 'FrontendAtlas Essential 60 Interview Questions',
                  description: 'Curated shortlist.',
                },
              },
            },
          },
        },
        {
          provide: AuthService,
          useValue: {
            user: signal(null),
          },
        },
        {
          provide: UserProgressService,
          useValue: {
            solvedIds: signal(['js-debounce']),
          },
        },
        {
          provide: SeoService,
          useValue: {
            updateTags: jasmine.createSpy('updateTags'),
            buildCanonicalUrl: jasmine.createSpy('buildCanonicalUrl').and.callFake((value: string) => value),
          },
        },
      ],
    }).compileComponents();
  });

  it('renders the curated grid, solved state, and framework variants', async () => {
    const fixture = TestBed.createComponent(EssentialQuestionsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelectorAll('[data-testid^="essential-card-"]').length).toBe(3);
    expect(host.textContent || '').toContain('FrontendAtlas Essential 60');
    expect(host.querySelector('[data-testid="essential-card-js-debounce"]')?.textContent || '').toContain('Debounce Function');
    expect(host.querySelector('[data-testid="essential-card-js-debounce"]')?.textContent || '').toContain('Must know');
    expect(host.querySelector('[title="Solved"]')).not.toBeNull();
    expect(host.querySelector('[data-testid="essential-variant-ui-debounced-search-react-debounced-search"]')?.textContent?.trim()).toBe('React');
    expect(host.querySelector('[data-testid="essential-variant-ui-debounced-search-angular-debounced-search"]')?.textContent?.trim()).toBe('Angular');
    const premiumCard = host.querySelector('[data-testid="essential-card-ui-debounced-search"]') as HTMLElement;
    const scoreBadge = host.querySelector('[aria-label="Importance score 93 out of 100"]') as HTMLElement;
    const companyLogos = premiumCard.querySelector('[data-testid="essential-company-logos-ui-debounced-search"]') as HTMLElement;

    expect(scoreBadge?.textContent?.trim()).toBe('93/100');
    expect(scoreBadge?.getAttribute('title')).toBeNull();
    expect(scoreBadge?.getAttribute('ng-reflect-content')).toContain('Importance score');
    expect(premiumCard.textContent || '').toContain('Premium');
    expect(premiumCard.textContent || '').not.toContain('Locked');
    expect(premiumCard.querySelector('.essential-badge--premium')?.getAttribute('aria-label')).toBe('Premium question');
    expect(companyLogos?.getAttribute('aria-label')).toBe('Company signals: Google, Netflix');
    expect(companyLogos?.querySelector('[data-testid="company-logo-mark-google"]')).not.toBeNull();
  });

  it('filters by section and tier', async () => {
    const fixture = TestBed.createComponent(EssentialQuestionsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    (host.querySelector('[data-testid="essential-section-system-design"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(host.querySelectorAll('[data-testid^="essential-card-"]').length).toBe(1);
    expect(host.textContent || '').toContain('Notification Toast System');

    (host.querySelector('[data-testid="essential-tier-must-know"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(host.querySelectorAll('[data-testid^="essential-card-"]').length).toBe(0);
  });
});
