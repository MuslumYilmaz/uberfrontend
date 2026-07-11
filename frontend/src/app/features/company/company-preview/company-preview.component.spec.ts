import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { QuestionService } from '../../../core/services/question.service';
import { SeoService } from '../../../core/services/seo.service';
import { CompanyPreviewComponent } from './company-preview.component';

describe('CompanyPreviewComponent', () => {
  let fixture: ComponentFixture<CompanyPreviewComponent>;
  let questionService: jasmine.SpyObj<QuestionService>;
  let seo: jasmine.SpyObj<SeoService>;

  async function createComponent(slug: string): Promise<ComponentFixture<CompanyPreviewComponent>> {
    TestBed.resetTestingModule();

    questionService = jasmine.createSpyObj<QuestionService>('QuestionService', [
      'loadAllQuestionSummaries',
      'loadSystemDesign',
    ]);
    questionService.loadAllQuestionSummaries.and.returnValue(of([] as any));
    questionService.loadSystemDesign.and.returnValue(of([] as any));

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
      imports: [CompanyPreviewComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ slug }),
            },
          },
        },
        { provide: QuestionService, useValue: questionService },
        { provide: SeoService, useValue: seo },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CompanyPreviewComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('publishes OpenAI-specific title, meta, canonical, robots, and schema', async () => {
    await createComponent('openai');

    expect(seo.updateTags).toHaveBeenCalled();
    const payload = seo.updateTags.calls.mostRecent().args[0] as any;
    const graph = Array.isArray(payload?.jsonLd) ? payload.jsonLd : [];
    const collection = graph.find((entry: any) => entry?.['@type'] === 'CollectionPage');
    const breadcrumb = graph.find((entry: any) => entry?.['@type'] === 'BreadcrumbList');

    expect(payload.title).toBe('OpenAI Frontend Interview: 5 Practice Questions + Prep Guide');
    expect(payload.description).toBe(
      'Practice for OpenAI frontend interviews with representative prompts on streaming chat UI, stale stream handling, optimistic React state, accessibility, and history design.',
    );
    expect(payload.canonical).toBe('/companies/openai/preview');
    expect(payload.robots).toBe('index,follow');
    expect(collection?.dateModified).toBe('2026-07-11T00:00:00.000Z');
    expect(collection?.mainEntity?.itemListElement?.length).toBe(5);
    expect(collection?.mainEntity?.itemListElement?.[0]?.name).toBe('Streaming chat composer');
    expect(breadcrumb?.itemListElement?.[2]?.name).toBe('OpenAI Frontend Interview Questions');
    expect(questionService.loadAllQuestionSummaries).not.toHaveBeenCalled();
    expect(questionService.loadSystemDesign).not.toHaveBeenCalled();
  });

  it('renders OpenAI public landing content without premium item title leakage', async () => {
    const fixture = await createComponent('openai');
    const host: HTMLElement = fixture.nativeElement;
    const text = host.textContent || '';

    expect(host.querySelector('h1')?.textContent?.trim()).toBe('OpenAI Frontend Interview Questions');
    expect(text).toContain('Streaming chat composer');
    expect(text).toContain('Stop/regenerate and stale stream handling');
    expect(text).toContain('React state + optimistic messages');
    expect(text).toContain('Accessibility/keyboard interaction');
    expect(text).toContain('Frontend system design/conversation history');
    expect(text).toContain('Strong answer should cover');
    expect(text).toContain('Walk through stale stream handling before you code');
    expect(text).toContain('Day 7');
    expect(text).toContain('Bunlar leaked veya confirmed OpenAI questions değildir; role-relevant representative practice prompts’tur.');
    expect(text).toContain('Unlock the full OpenAI practice set');

    expect(text).not.toContain('Openai');
    expect(text).not.toContain('Chat UI with Streaming Response');
    expect(text).not.toContain('AI Chat Text Area (ChatGPT-Style)');
    expect(text).not.toContain('AI UX Resilience and Control Patterns');
  });

  it('keeps contextual OpenAI links on free public practice pages', async () => {
    const fixture = await createComponent('openai');
    const host: HTMLElement = fixture.nativeElement;
    const hrefs = Array.from(host.querySelectorAll<HTMLAnchorElement>('a')).map((anchor) =>
      anchor.getAttribute('href'),
    );

    expect(hrefs).toContain('/javascript/trivia/ai-streaming-data-handling');
    expect(hrefs).toContain('/javascript/trivia/chat-conversation-state-management');
    expect(hrefs).toContain('/javascript/trivia/sse-vs-websocket-real-time');
    expect(hrefs).toContain('/javascript/trivia/ai-ux-integration-challenges');
    expect(hrefs).toContain('/javascript/coding/js-stream-to-text');
    expect(hrefs).toContain('/javascript/coding/js-take-latest');
  });
});
