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

  it('renders the curated list, solved state, and framework variants', async () => {
    const fixture = TestBed.createComponent(EssentialQuestionsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelectorAll('[data-testid^="essential-row-"]').length).toBe(3);
    expect(host.textContent || '').toContain('FrontendAtlas Essential 60');
    const freeRow = host.querySelector('[data-testid="essential-row-js-debounce"]') as HTMLElement;
    expect(freeRow?.textContent || '').toContain('Debounce Function');
    expect(host.querySelector('[title="Solved"]')).not.toBeNull();
    expect(host.querySelector('[data-testid="question-row-variant-react-debounced-search"]')?.textContent?.trim()).toBe('React');
    expect(host.querySelector('[data-testid="question-row-variant-angular-debounced-search"]')?.textContent?.trim()).toBe('Angular');
    const premiumRow = host.querySelector('[data-testid="essential-row-ui-debounced-search"]') as HTMLElement;
    const scoreBadge = freeRow.querySelector(
      '.fa-question-row__meta-chip[aria-label="Importance score 93 out of 100"]',
    ) as HTMLElement;
    const companySignal = premiumRow.querySelector('[data-testid="company-signal-google"]') as HTMLElement;

    expect(scoreBadge?.textContent || '').toContain('93/100');
    expect(freeRow.querySelector('.fa-question-row__meta-chip[aria-label="Tier: Must know"]')).toBeNull();
    expect(freeRow.querySelector('.fa-question-row__meta-chip[aria-label="Technology: JavaScript"]')).toBeNull();
    expect(freeRow.querySelector('.fa-question-row__sr-meta')?.textContent || '').toContain('Tier: Must know');
    expect(freeRow.querySelector('.fa-question-row__sr-meta')?.textContent || '').toContain('Technology: JavaScript');
    expect(premiumRow.textContent || '').toContain('Premium');
    expect(premiumRow.textContent || '').not.toContain('Locked');
    expect(premiumRow.querySelector('[aria-label="Premium question"]')).not.toBeNull();
    expect(companySignal?.getAttribute('aria-label')).toBe('Company prep signal: Google and 1 more');
    expect(companySignal?.querySelector('[data-testid="company-signal-logo"]')).not.toBeNull();
    expect(companySignal?.querySelector('[data-testid="company-signal-overflow"]')?.textContent?.trim()).toBe('+1');
    expect(host.textContent || '').not.toContain('Benchmark topics');
    expect(host.textContent || '').not.toContain('GFE 75');
  });

  it('filters by section and tier', async () => {
    const fixture = TestBed.createComponent(EssentialQuestionsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    (host.querySelector('[data-testid="essential-section-system-design"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(host.querySelectorAll('[data-testid^="essential-row-"]').length).toBe(1);
    expect(host.textContent || '').toContain('Notification Toast System');

    (host.querySelector('[data-testid="essential-tier-must-know"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(host.querySelectorAll('[data-testid^="essential-row-"]').length).toBe(0);
  });
});
