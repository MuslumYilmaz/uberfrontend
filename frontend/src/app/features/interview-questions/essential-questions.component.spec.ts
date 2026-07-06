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
                      title: 'Design a Toast Notification System',
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
                          title: 'Design a Toast Notification System',
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
                  description:
                    'A ranked shortlist of must-know frontend interview questions in FrontendAtlas Essential 60, covering JavaScript utilities, UI coding, system design, frontend concepts, and a compact practice path.',
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
    expect(host.textContent || '').toContain('Reviewed May 21, 2026');
    expect(host.textContent || '').toContain('60 ranked frontend interview prompts');
    expect(host.textContent || '').toContain('compact ranked practice list');
    expect(host.textContent || '').toContain('Why these 60?');
    expect(host.textContent || '').toContain('How to use Essential 60');
    expect(host.textContent || '').toContain('Coverage benchmark');
    expect(host.textContent || '').toContain('7-day refresh');
    expect(host.textContent || '').toContain('14-day practice loop');
    expect(host.textContent || '').toContain('30-day baseline');
    expect(host.textContent || '').toContain('reference surfaces checked');
    expect(host.textContent || '').toContain('Essential 60 FAQ');
    expect((host.textContent || '').indexOf('Why these 60?')).toBeLessThan(
      (host.textContent || '').indexOf('Sections'),
    );
    expect((host.textContent || '').indexOf('How to use Essential 60')).toBeLessThan(
      (host.textContent || '').indexOf('Sections'),
    );
    expect((host.textContent || '').indexOf('Coverage benchmark')).toBeLessThan(
      (host.textContent || '').indexOf('Sections'),
    );
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

  it('emits Essential 60 CollectionPage, ItemList, and FAQPage schema', async () => {
    const fixture = TestBed.createComponent(EssentialQuestionsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const seo = TestBed.inject(SeoService) as jasmine.SpyObj<SeoService>;
    const payload = seo.updateTags.calls.mostRecent().args[0] as {
      description: string;
      jsonLd: Array<Record<string, unknown>>;
    };
    const collectionPage = payload.jsonLd.find((entry) => entry['@type'] === 'CollectionPage') as {
      dateModified: string;
      reviewedBy: { name: string };
      about: Array<{ name: string }>;
      mentions: Array<{ name: string }>;
      mainEntity: { '@type': string };
    };
    const itemList = payload.jsonLd.find((entry) => entry['@type'] === 'ItemList') as {
      itemListElement: unknown[];
    };
    const faqPage = payload.jsonLd.find((entry) => entry['@type'] === 'FAQPage') as {
      mainEntity: Array<{ name: string; acceptedAnswer: { text: string } }>;
    };

    expect(payload.description).toContain('ranked shortlist');
    expect(payload.description).toContain('must-know frontend interview questions');
    expect(collectionPage.dateModified).toBe('2026-04-23T00:00:00.000Z');
    expect(collectionPage.reviewedBy.name).toBe('FrontendAtlas Editor');
    expect(collectionPage.mainEntity['@type']).toBe('ItemList');
    expect(itemList.itemListElement.length).toBe(3);
    expect(collectionPage.about.map((entity) => entity.name)).toEqual(jasmine.arrayContaining([
      'FrontendAtlas Essential 60',
      'must-know frontend interview questions',
      'ranked frontend interview questions',
      'frontend interview practice shortlist',
      'JavaScript utility interview questions',
      'UI coding interview questions',
      'frontend machine coding questions',
      'frontend system design interview questions',
      'frontend concept questions',
      'frontend interview questions with progress tracking',
    ]));
    expect(collectionPage.mentions.map((entity) => entity.name)).toEqual(jasmine.arrayContaining([
      'practice routes',
      'importance score',
      'framework variants',
    ]));
    expect(faqPage.mainEntity.length).toBe(5);
    expect(faqPage.mainEntity.map((entry) => entry.name)).toEqual(jasmine.arrayContaining([
      'What is FrontendAtlas Essential 60?',
      'How were the Essential 60 questions selected?',
      'How should I use Essential 60 in 7, 14, or 30 days?',
      'Is Essential 60 different from the full frontend interview questions hub?',
      'Does Essential 60 include UI coding, JavaScript utilities, concepts, and system design?',
    ]));
    expect(faqPage.mainEntity[0].acceptedAnswer.text).toContain('ranked shortlist');
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
    expect(host.textContent || '').toContain('Design a Toast Notification System');

    (host.querySelector('[data-testid="essential-tier-must-know"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(host.querySelectorAll('[data-testid^="essential-row-"]').length).toBe(0);
  });
});
