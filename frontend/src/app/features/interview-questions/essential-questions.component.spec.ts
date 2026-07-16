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
                      { label: 'GreatFrontEnd GFE 75', url: 'https://www.greatfrontend.com/interviews/gfe75' },
                      {
                        label: 'Front End Interview Handbook: JavaScript coding',
                        url: 'https://www.frontendinterviewhandbook.com/coding/javascript-utility-function',
                      },
                      {
                        label: 'Front End Interview Handbook: UI machine coding',
                        url: 'https://www.frontendinterviewhandbook.com/coding/build-front-end-user-interfaces',
                      },
                      {
                        label: 'Front End Interview Handbook: frontend system design',
                        url: 'https://www.frontendinterviewhandbook.com/front-end-system-design',
                      },
                      {
                        label: 'BFE JavaScript questions',
                        url: 'https://bigfrontend.dev/problem?sort=oldest&tags=JavaScript',
                      },
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
                    'A curated, grouped shortlist of frontend interview questions in FrontendAtlas Essential 60, covering JavaScript utilities, UI coding, system design, frontend concepts, and a compact practice path.',
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

  it('renders a grouped evidence-backed shortlist without public scores, ranks, or company badges', async () => {
    const fixture = TestBed.createComponent(EssentialQuestionsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const text = host.textContent || '';
    expect(host.querySelectorAll('[data-testid^="essential-row-"]').length).toBe(3);
    expect(text).toContain('FrontendAtlas Essential 60');
    expect(text).toContain('Updated April 23, 2026');
    expect(text).toContain('60 curated frontend interview prompts');
    expect(text).toContain('compact, curated practice list');
    expect(text).toContain('Why these 60?');
    expect(text).toContain('How to use Essential 60');
    expect(text).toContain('Coverage references (5)');
    expect(text).toContain(
      'These references informed topic coverage; they do not verify company provenance or a numeric score.',
    );
    expect(text).toContain('7-day refresh');
    expect(text).toContain('14-day practice loop');
    expect(text).toContain('30-day baseline');
    expect(text).toContain('Essential 60 FAQ');
    expect(text.indexOf('Why these 60?')).toBeLessThan(text.indexOf('Sections'));
    expect(text.indexOf('How to use Essential 60')).toBeLessThan(text.indexOf('Sections'));
    expect(text.indexOf('Coverage references (5)')).toBeLessThan(text.indexOf('Sections'));

    const groups = Array.from(host.querySelectorAll('[data-testid^="essential-group-"]')) as HTMLElement[];
    expect(groups.map((group) => group.getAttribute('data-testid'))).toEqual([
      'essential-group-javascript-functions',
      'essential-group-ui-coding',
      'essential-group-system-design',
    ]);

    const referenceLinks = Array.from(
      host.querySelectorAll('[data-testid="essential-coverage-references"] a'),
    ) as HTMLAnchorElement[];
    expect(referenceLinks.length).toBe(5);
    expect(referenceLinks.map((link) => link.getAttribute('href'))).toEqual([
      'https://www.greatfrontend.com/interviews/gfe75',
      'https://www.frontendinterviewhandbook.com/coding/javascript-utility-function',
      'https://www.frontendinterviewhandbook.com/coding/build-front-end-user-interfaces',
      'https://www.frontendinterviewhandbook.com/front-end-system-design',
      'https://bigfrontend.dev/problem?sort=oldest&tags=JavaScript',
    ]);
    for (const link of referenceLinks) {
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    }

    const freeRow = host.querySelector('[data-testid="essential-row-js-debounce"]') as HTMLElement;
    const premiumRow = host.querySelector('[data-testid="essential-row-ui-debounced-search"]') as HTMLElement;
    expect(freeRow?.textContent || '').toContain('Debounce Function');
    expect(freeRow?.textContent || '').toContain('Timing primitive.');
    expect(host.querySelector('[title="Solved"]')).not.toBeNull();
    expect(host.querySelector('[data-testid="question-row-variant-react-debounced-search"]')?.textContent?.trim()).toBe('React');
    expect(host.querySelector('[data-testid="question-row-variant-angular-debounced-search"]')?.textContent?.trim()).toBe('Angular');
    expect(freeRow.querySelector('.fa-question-row__meta-chip[aria-label="Tier: Must know"]')).not.toBeNull();
    expect(freeRow.querySelector('.fa-question-row__meta-chip[aria-label="Difficulty: Intermediate"]')).not.toBeNull();
    expect(freeRow.querySelector('.fa-question-row__meta-chip[aria-label="Technology: JavaScript"]')).not.toBeNull();
    expect(premiumRow.textContent || '').toContain('Premium');
    expect(premiumRow.textContent || '').not.toContain('Locked');
    expect(premiumRow.querySelector('[aria-label="Premium question"]')).not.toBeNull();

    expect(host.querySelector('[data-testid^="company-signal-"]')).toBeNull();
    expect(text).not.toMatch(/\b\d{1,3}\s*\/\s*100\b/);
    expect(text).not.toMatch(/#\s*\d+/);
    expect(text).not.toContain('importance score');
    expect(text).not.toContain('reference surfaces checked');
    expect(text).not.toContain('Updated May 21, 2026');
    expect(text).not.toContain('FrontendAtlas Team');
    expect(text).not.toContain('reviewer');
    expect(text).not.toContain('internal review');
    expect(text).not.toContain('Benchmark topics');
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
      author: { '@type': string; name: string };
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

    expect(payload.description).toContain('curated, grouped shortlist');
    expect(payload.description).toContain('frontend interview questions');
    expect(collectionPage.dateModified).toBe('2026-04-23T00:00:00.000Z');
    expect(collectionPage.author).toEqual({
      '@type': 'Organization',
      name: 'FrontendAtlas Editorial',
    });
    expect(collectionPage.mainEntity['@type']).toBe('ItemList');
    expect(itemList.itemListElement.length).toBe(3);
    expect(collectionPage.about.map((entity) => entity.name)).toEqual(jasmine.arrayContaining([
      'FrontendAtlas Essential 60',
      'must-know frontend interview questions',
      'curated frontend interview questions',
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
      'framework variants',
    ]));
    expect(collectionPage.mentions.map((entity) => entity.name)).not.toContain('importance score');
    expect(faqPage.mainEntity.length).toBe(5);
    expect(faqPage.mainEntity.map((entry) => entry.name)).toEqual(jasmine.arrayContaining([
      'What is FrontendAtlas Essential 60?',
      'How were the Essential 60 questions selected?',
      'How should I use Essential 60 in 7, 14, or 30 days?',
      'Is Essential 60 different from the full frontend interview questions hub?',
      'Does Essential 60 include UI coding, JavaScript utilities, concepts, and system design?',
    ]));
    expect(faqPage.mainEntity[0].acceptedAnswer.text).toContain('curated shortlist');

    const schemaText = JSON.stringify(payload.jsonLd);
    expect(schemaText).not.toContain('FrontendAtlas Team');
    expect(schemaText).not.toContain('reviewer');
    expect(schemaText).not.toContain('internal review');
    expect(schemaText).not.toContain('importance score');
    expect(schemaText).not.toContain('Google');
    expect(schemaText).not.toContain('Netflix');
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
