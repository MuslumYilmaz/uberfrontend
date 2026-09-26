import { DOCUMENT } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, ActivatedRouteSnapshot, TitleStrategy, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { robotsForContentAccess } from '../utils/content-access-policy.util';
import { SeoService } from './seo.service';
import { SeoTitleStrategy } from './seo-title.strategy';

@Component({ standalone: true, template: '' })
class ResolvedQuestionSeoTestComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly seo = inject(SeoService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    // Match the synchronous route-data publication used by question components.
    this.route.data.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((data) => {
      const detail = data['questionDetail'];
      const question = detail?.question;
      if (!question) return;
      const canonical = this.seo.buildCanonicalUrl(`/questions/${detail.kind}/${question.id}`);
      this.seo.updateTags({
        title: question.title,
        description: question.description,
        canonical,
        robots: robotsForContentAccess(question.access),
        ogType: 'article',
        jsonLd: { '@type': 'Article', '@id': canonical, headline: question.title },
      });
    });
  }
}

@Component({ standalone: true, template: '' })
class StaticSeoTestComponent {}

describe('SeoTitleStrategy question detail ownership', () => {
  let document: Document;
  let meta: Meta;
  let title: Title;
  let seo: SeoService;
  let originalTitle: string;
  let originalHostOverride: string | undefined;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: 'questions/:kind/:id',
            component: ResolvedQuestionSeoTestComponent,
            resolve: {
              questionDetail: (route: ActivatedRouteSnapshot) => {
                const id = route.paramMap.get('id');
                return {
                  kind: route.paramMap.get('kind'),
                  question: id === 'missing' ? null : {
                    id,
                    title: `Question ${id}: complete title`,
                    description: `Specific explanation for question ${id}.`,
                    access: id === 'premium' ? 'premium' : 'free',
                  },
                };
              },
            },
            data: { seo: { title: 'Generic question fallback', description: 'Fallback explanation.' } },
          },
          {
            path: 'library',
            component: StaticSeoTestComponent,
            data: { seo: { title: 'Question library', description: 'Browse the question library.' } },
          },
          { path: 'named', component: StaticSeoTestComponent, title: 'Named route title' },
          { path: 'untitled', component: StaticSeoTestComponent },
        ]),
        { provide: TitleStrategy, useClass: SeoTitleStrategy },
      ],
    });
    document = TestBed.inject(DOCUMENT);
    meta = TestBed.inject(Meta);
    title = TestBed.inject(Title);
    seo = TestBed.inject(SeoService);
    originalTitle = title.getTitle();
    const win = document.defaultView as Window & { __FA_SEO_HOST__?: string };
    originalHostOverride = win.__FA_SEO_HOST__;
    win.__FA_SEO_HOST__ = 'frontendatlas.com';
  });

  afterEach(() => {
    const win = document.defaultView as Window & { __FA_SEO_HOST__?: string };
    if (originalHostOverride === undefined) delete win.__FA_SEO_HOST__;
    else win.__FA_SEO_HOST__ = originalHostOverride;
    title.setTitle(originalTitle);
  });

  function articleGraph(): Array<Record<string, unknown>> {
    return JSON.parse(document.head.querySelector('#seo-jsonld')?.textContent || '{}')['@graph'] || [];
  }

  function expectQuestionHead(kind: string, id: string, robots = id === 'premium' ? 'noindex,follow' : 'index,follow'): void {
    const expectedTitle = `Question ${id}: complete title`;
    const description = `Specific explanation for question ${id}.`;
    const canonical = seo.buildCanonicalUrl(`/questions/${kind}/${id}`);
    expect(title.getTitle()).toBe(expectedTitle);
    expect(meta.getTag('name="description"')?.content).toBe(description);
    expect(meta.getTag('property="og:title"')?.content).toBe(expectedTitle);
    expect(meta.getTag('property="og:description"')?.content).toBe(description);
    expect(meta.getTag('name="twitter:title"')?.content).toBe(expectedTitle);
    expect(meta.getTag('name="twitter:description"')?.content).toBe(description);
    expect(meta.getTag('name="robots"')?.content).toBe(robots);
    expect(meta.getTag('property="og:type"')?.content).toBe('article');
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(canonical);
    expect(articleGraph().find((entry) => entry['@type'] === 'Article')).toEqual({
      '@type': 'Article', '@id': canonical, headline: expectedTitle,
    });
  }

  for (const kind of ['trivia', 'coding', 'debug']) {
    it(`preserves ${kind} metadata on initial and reused navigation, then hands ownership back to static routes`, async () => {
      const harness = await RouterTestingHarness.create();
      const first = await harness.navigateByUrl(`/questions/${kind}/free`, ResolvedQuestionSeoTestComponent);
      expectQuestionHead(kind, 'free');

      const second = await harness.navigateByUrl(`/questions/${kind}/premium`, ResolvedQuestionSeoTestComponent);
      expect(second).toBe(first);
      expectQuestionHead(kind, 'premium');

      await harness.navigateByUrl(`/questions/${kind}/free`, ResolvedQuestionSeoTestComponent);
      expectQuestionHead(kind, 'free');

      await harness.navigateByUrl('/library', StaticSeoTestComponent);
      expect(title.getTitle()).toBe('Question library');
      expect(meta.getTag('name="description"')?.content).toBe('Browse the question library.');
      expect(meta.getTag('name="robots"')?.content).toBe('index,follow');
      expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href'))
        .toBe(seo.buildCanonicalUrl('/library'));
      expect(articleGraph().some((entry) => entry['@type'] === 'Article')).toBeFalse();
    });
  }

  it('refreshes free question robots when queries are added or removed without replacing detail metadata', async () => {
    const harness = await RouterTestingHarness.create();
    const first = await harness.navigateByUrl('/questions/trivia/free', ResolvedQuestionSeoTestComponent);
    expectQuestionHead('trivia', 'free');

    const withQuery = await harness.navigateByUrl('/questions/trivia/free?source=sidebar', ResolvedQuestionSeoTestComponent);
    expect(withQuery).toBe(first);
    expectQuestionHead('trivia', 'free', 'noindex,follow');

    const withoutQuery = await harness.navigateByUrl('/questions/trivia/free', ResolvedQuestionSeoTestComponent);
    expect(withoutQuery).toBe(first);
    expectQuestionHead('trivia', 'free');
  });

  it('preserves premium robots when queries are added or removed, while static query URLs remain noindex', async () => {
    const harness = await RouterTestingHarness.create();
    const first = await harness.navigateByUrl('/questions/trivia/premium', ResolvedQuestionSeoTestComponent);
    expectQuestionHead('trivia', 'premium');

    const withQuery = await harness.navigateByUrl('/questions/trivia/premium?source=sidebar', ResolvedQuestionSeoTestComponent);
    expect(withQuery).toBe(first);
    expectQuestionHead('trivia', 'premium');

    const withoutQuery = await harness.navigateByUrl('/questions/trivia/premium', ResolvedQuestionSeoTestComponent);
    expect(withoutQuery).toBe(first);
    expectQuestionHead('trivia', 'premium');

    await harness.navigateByUrl('/library?source=sidebar', StaticSeoTestComponent);
    expect(title.getTitle()).toBe('Question library');
    expect(meta.getTag('name="description"')?.content).toBe('Browse the question library.');
    expect(meta.getTag('name="robots"')?.content).toBe('noindex,follow');
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href'))
      .toBe(seo.buildCanonicalUrl('/library'));
    expect(articleGraph().some((entry) => entry['@type'] === 'Article')).toBeFalse();
  });

  it('applies the static fallback when the resolver cannot find the question', async () => {
    const harness = await RouterTestingHarness.create();
    const first = await harness.navigateByUrl('/questions/trivia/premium', ResolvedQuestionSeoTestComponent);
    const missing = await harness.navigateByUrl('/questions/trivia/missing', ResolvedQuestionSeoTestComponent);
    expect(missing).toBe(first);
    expect(title.getTitle()).toBe('Generic question fallback');
    expect(meta.getTag('name="description"')?.content).toBe('Fallback explanation.');
    expect(meta.getTag('name="robots"')?.content).toBe('index,follow');
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href'))
      .toBe(seo.buildCanonicalUrl('/questions/trivia/missing'));
    expect(articleGraph().some((entry) => entry['@type'] === 'Article')).toBeFalse();
  });

  it('retains title and default metadata handling when no resolved data exists', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/named', StaticSeoTestComponent);
    expect(title.getTitle()).toBe('Named route title');
    await harness.navigateByUrl('/untitled', StaticSeoTestComponent);
    expect(title.getTitle()).toBe('FrontendAtlas | High-signal frontend interview preparation platform.');
    expect(meta.getTag('name="description"')?.content).toContain('FrontendAtlas helps you prepare');
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href'))
      .toBe(seo.buildCanonicalUrl('/untitled'));
  });
});
