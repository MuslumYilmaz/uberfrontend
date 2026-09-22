import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CompanyPreviewQuestion, CompanyPreviewResolved } from '../../../core/models/company-public.model';
import { Difficulty } from '../../../core/models/question.model';
import { COMPANY_PRACTICE_DISCLAIMER } from '../../../core/content/public-editorial-facts';
import { Tech } from '../../../core/models/user.model';
import { SeoService } from '../../../core/services/seo.service';
import { companyBrandFor } from '../../../shared/company-branding';
import {
  FaQuestionRowComponent,
  FaQuestionRowMetaChip,
} from '../../../shared/ui/question-row/fa-question-row.component';
import {
  GOOGLE_PRACTICE_PROMPTS,
  GOOGLE_PREP_SEQUENCE,
  GOOGLE_PREVIEW_CANONICAL_PATH,
  GOOGLE_PREVIEW_DATE_MODIFIED,
  GOOGLE_PREVIEW_DESCRIPTION,
  GOOGLE_PREVIEW_FAQS,
  GOOGLE_PREVIEW_H1,
  GOOGLE_PREVIEW_TITLE,
  GOOGLE_PREVIEW_TRUST_NOTE,
  GOOGLE_PROCESS_NOTE,
  GOOGLE_RESOURCE_LINKS,
} from './google-preview-content';
import {
  NETFLIX_OFFICIAL_SOURCES,
  NETFLIX_PRACTICE_PROMPTS,
  NETFLIX_PREP_SEQUENCE,
  NETFLIX_PREVIEW_CANONICAL_PATH,
  NETFLIX_PREVIEW_DATE_MODIFIED,
  NETFLIX_PREVIEW_DESCRIPTION,
  NETFLIX_PREVIEW_FAQS,
  NETFLIX_PREVIEW_H1,
  NETFLIX_PREVIEW_TITLE,
  NETFLIX_PREVIEW_TRUST_NOTE,
  NETFLIX_RESOURCE_LINKS,
  NETFLIX_ROLE_LENSES,
  NETFLIX_WALKTHROUGH_STEPS,
} from './netflix-preview-content';

type OpenAiPracticePrompt = {
  id: string;
  title: string;
  intent: string;
  rubric: string[];
};

type OpenAiPrepDay = {
  day: string;
  focus: string;
};

type OpenAiResourceLink = {
  label: string;
  route: string[];
  path: string;
};

const OPENAI_PREVIEW_TITLE = 'OpenAI Frontend Interview: 5 Practice Questions + Prep Guide';
const OPENAI_PREVIEW_H1 = 'OpenAI Frontend Interview Questions';
const OPENAI_PREVIEW_DESCRIPTION =
  'Practice for OpenAI frontend interviews with representative prompts on streaming chat UI, stale stream handling, optimistic React state, accessibility, and history design.';
const OPENAI_PREVIEW_CANONICAL_PATH = '/companies/openai/preview';
const OPENAI_PREVIEW_DATE_MODIFIED = '2026-07-11T00:00:00.000Z';
const OPENAI_TRUST_NOTE =
  'These are not leaked or confirmed OpenAI interview questions; they are representative, role-relevant practice prompts.';

const OPENAI_RESOURCE_LINKS: OpenAiResourceLink[] = [
  {
    label: 'AI streaming data handling',
    route: ['/javascript', 'trivia', 'ai-streaming-data-handling'],
    path: '/javascript/trivia/ai-streaming-data-handling',
  },
  {
    label: 'Chat conversation state management',
    route: ['/javascript', 'trivia', 'chat-conversation-state-management'],
    path: '/javascript/trivia/chat-conversation-state-management',
  },
  {
    label: 'SSE vs WebSocket trade-offs',
    route: ['/javascript', 'trivia', 'sse-vs-websocket-real-time'],
    path: '/javascript/trivia/sse-vs-websocket-real-time',
  },
  {
    label: 'AI UX integration challenges',
    route: ['/javascript', 'trivia', 'ai-ux-integration-challenges'],
    path: '/javascript/trivia/ai-ux-integration-challenges',
  },
  {
    label: 'ReadableStream to text',
    route: ['/javascript', 'coding', 'js-stream-to-text'],
    path: '/javascript/coding/js-stream-to-text',
  },
  {
    label: 'takeLatest request handling',
    route: ['/javascript', 'coding', 'js-take-latest'],
    path: '/javascript/coding/js-take-latest',
  },
];

const OPENAI_PRACTICE_PROMPTS: OpenAiPracticePrompt[] = [
  {
    id: 'streaming-chat-composer',
    title: 'Streaming chat composer',
    intent:
      'Build a composer that accepts a user message, renders the user bubble immediately, and appends an assistant response as streamed chunks arrive.',
    rubric: [
      'Readable state shape for messages, draft input, pending request id, and stream status.',
      'Incremental text rendering without blocking typing, selection, or scroll position.',
      'Error and retry states that preserve the user prompt and partial assistant text.',
      'Clear separation between transport code and rendering logic.',
    ],
  },
  {
    id: 'stop-regenerate-stale-stream-handling',
    title: 'Stop/regenerate and stale stream handling',
    intent:
      'Add stop and regenerate controls while ensuring old chunks cannot mutate the latest assistant message after cancellation or a second request.',
    rubric: [
      'AbortController or equivalent cancellation path for active stream work.',
      'A request token, generation id, or takeLatest guard before every state write.',
      'Predictable UI states for stopping, stopped, regenerating, failed, and complete.',
      'Cleanup for readers, timers, event listeners, and pending promises.',
    ],
  },
  {
    id: 'react-state-optimistic-messages',
    title: 'React state + optimistic messages',
    intent:
      'Model optimistic user messages and assistant placeholders in React without duplicating messages or losing order when network responses resolve late.',
    rubric: [
      'Immutable message updates keyed by stable ids instead of array index assumptions.',
      'Optimistic user bubble creation before the network call completes.',
      'Rollback or retry behavior for failed sends without deleting the draft context.',
      'Derived rendering for pending, partial, and final assistant messages.',
    ],
  },
  {
    id: 'accessibility-keyboard-interaction',
    title: 'Accessibility/keyboard interaction',
    intent:
      'Make the chat input, send button, stop control, regenerate action, and message list usable from keyboard and assistive technology.',
    rubric: [
      'Correct textarea behavior for Enter, Shift+Enter, focus restoration, and disabled states.',
      'Accessible button names that change with send, stop, and regenerate modes.',
      'Live region strategy for streamed assistant output without excessive announcements.',
      'Visible focus states and logical tab order across composer and message actions.',
      'Respect for reduced motion and high-contrast reading needs.',
    ],
  },
  {
    id: 'frontend-system-design-conversation-history',
    title: 'Frontend system design/conversation history',
    intent:
      'Design the frontend architecture for conversation history, message virtualization, search, local recovery, and sync with server-side threads.',
    rubric: [
      'Data model for threads, messages, streaming drafts, attachments, and pagination cursors.',
      'Cache and persistence plan for recent conversations, offline recovery, and invalidation.',
      'Virtualized rendering and scroll anchoring for long conversations.',
      'Privacy, retention, and redaction considerations for sensitive chat content.',
      'Observability for latency, stream failures, and client-side rendering errors.',
    ],
  },
];

const OPENAI_PREP_SEQUENCE: OpenAiPrepDay[] = [
  {
    day: 'Day 1',
    focus: 'Review streaming fundamentals: ReadableStream, SSE/WebSocket trade-offs, cancellation, and how partial text becomes UI state.',
  },
  {
    day: 'Day 2',
    focus: 'Implement a small stream-to-text utility and write tests for chunk order, decoding, cancellation, and error paths.',
  },
  {
    day: 'Day 3',
    focus: 'Build the chat composer shell with draft state, optimistic user messages, assistant placeholders, loading states, and retry copy.',
  },
  {
    day: 'Day 4',
    focus: 'Add stop, regenerate, and stale-stream guards. Force slow responses locally and prove old chunks cannot update the newest request.',
  },
  {
    day: 'Day 5',
    focus: 'Audit accessibility: keyboard flow, button names, focus restoration, live announcements, visible focus, and reduced-motion behavior.',
  },
  {
    day: 'Day 6',
    focus: 'Design conversation history: thread model, pagination, virtualization, local recovery, privacy constraints, and cache invalidation.',
  },
  {
    day: 'Day 7',
    focus: 'Run a timed mock: explain trade-offs first, code the smallest reliable slice, then review edge cases and testing strategy aloud.',
  },
];

@Component({
  standalone: true,
  selector: 'app-company-preview',
  imports: [CommonModule, RouterModule, FaQuestionRowComponent],
  templateUrl: './company-preview.component.html',
  styleUrls: ['./company-preview.component.css'],
})
export class CompanyPreviewComponent implements OnInit {
  readonly companyPracticeDisclaimer = COMPANY_PRACTICE_DISCLAIMER;
  slug = '';
  label = '';
  isOpenAiPreview = false;
  isGooglePreview = false;
  isNetflixPreview = false;
  readonly openAiTitle = OPENAI_PREVIEW_TITLE;
  readonly openAiH1 = OPENAI_PREVIEW_H1;
  readonly openAiTrustNote = OPENAI_TRUST_NOTE;
  readonly openAiPracticePrompts = OPENAI_PRACTICE_PROMPTS;
  readonly openAiPrepSequence = OPENAI_PREP_SEQUENCE;
  readonly openAiResourceLinks = OPENAI_RESOURCE_LINKS;
  readonly googleH1 = GOOGLE_PREVIEW_H1;
  readonly googleTrustNote = GOOGLE_PREVIEW_TRUST_NOTE;
  readonly googleProcessNote = GOOGLE_PROCESS_NOTE;
  readonly googlePracticePrompts = GOOGLE_PRACTICE_PROMPTS;
  readonly googlePrepSequence = GOOGLE_PREP_SEQUENCE;
  readonly googleFaqs = GOOGLE_PREVIEW_FAQS;
  readonly googleResourceLinks = GOOGLE_RESOURCE_LINKS;
  readonly netflixH1 = NETFLIX_PREVIEW_H1;
  readonly netflixTrustNote = NETFLIX_PREVIEW_TRUST_NOTE;
  readonly netflixRoleLenses = NETFLIX_ROLE_LENSES;
  readonly netflixPracticePrompts = NETFLIX_PRACTICE_PROMPTS;
  readonly netflixWalkthroughSteps = NETFLIX_WALKTHROUGH_STEPS;
  readonly netflixPrepSequence = NETFLIX_PREP_SEQUENCE;
  readonly netflixFaqs = NETFLIX_PREVIEW_FAQS;
  readonly netflixResourceLinks = NETFLIX_RESOURCE_LINKS;
  readonly netflixOfficialSources = NETFLIX_OFFICIAL_SOURCES;
  data: CompanyPreviewResolved = {
    slug: '',
    mode: 'catalog',
    counts: { all: 0, coding: 0, trivia: 0, system: 0 },
    samples: [],
  };
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private seo: SeoService,
  ) { }

  ngOnInit(): void {
    this.route.data.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((data) => {
      const resolved = data['companyPreview'] as CompanyPreviewResolved | undefined;
      this.applyResolvedPreview(resolved);
    });
  }

  private applyResolvedPreview(resolved: CompanyPreviewResolved | undefined): void {
    this.slug = (resolved?.slug ?? this.route.snapshot.paramMap.get('slug') ?? '').trim().toLowerCase();
    if (!this.slug) {
      this.router.navigateByUrl('/404').catch(() => void 0);
      return;
    }

    this.label = this.prettyCompany(this.slug);
    this.isOpenAiPreview = this.slug === 'openai';
    this.isGooglePreview = this.slug === 'google';
    this.isNetflixPreview = this.slug === 'netflix';
    this.data = resolved ?? {
      slug: this.slug,
      mode: 'catalog',
      counts: { all: 0, coding: 0, trivia: 0, system: 0 },
      samples: [],
    };

    if (this.isOpenAiPreview) {
      this.publishOpenAiSeo();
      return;
    }

    if (this.isGooglePreview) {
      this.publishGoogleSeo();
      return;
    }

    if (this.isNetflixPreview) {
      this.publishNetflixSeo();
      return;
    }

    this.seo.updateTags({
      title: `${this.label} Frontend Interview Questions Preview`,
      description: `Preview the FrontendAtlas editorial ${this.label} practice grouping across coding, concept prompts, and system design. It does not claim official question provenance or endorsement.`,
      canonical: `/companies/${this.slug}/preview`,
    });
  }

  freeCount(items: CompanyPreviewQuestion[]): number {
    return items.filter((item) => item.access === 'free').length;
  }

  premiumCount(items: CompanyPreviewQuestion[]): number {
    return items.filter((item) => item.access === 'premium').length;
  }

  promptCountLabel(count: number): string {
    return `${count} editorial practice ${count === 1 ? 'prompt' : 'prompts'}`;
  }

  displayKind(kind: CompanyPreviewQuestion['kind']): string {
    if (kind === 'system-design') return 'System design';
    return kind === 'coding' ? 'Coding' : 'Concept question';
  }

  sampleDescription(item: CompanyPreviewQuestion): string {
    return item.access === 'free'
      ? 'Available from the public Question Library.'
      : 'Previewed here; the full practice set requires Premium.';
  }

  sampleMetaChips(item: CompanyPreviewQuestion): FaQuestionRowMetaChip[] {
    const chips: FaQuestionRowMetaChip[] = [
      {
        label: item.access === 'free' ? 'Free now' : 'Premium',
        ariaLabel: item.access === 'free' ? 'Access: free now' : 'Access: premium in full set',
        tone: item.access === 'free' ? 'tier' : 'access',
      },
      {
        label: this.displayKind(item.kind),
        ariaLabel: `Kind: ${this.displayKind(item.kind)}`,
        tone: 'neutral',
        priority: 'secondary',
      },
      {
        label: this.difficultyLabel(item.difficulty),
        ariaLabel: `Difficulty: ${this.difficultyLabel(item.difficulty)}`,
        tone: 'difficulty',
      },
    ];

    if (item.tech) {
      chips.push({
        label: this.techLabel(item.tech),
        ariaLabel: `Technology: ${this.techLabel(item.tech)}`,
        tone: 'tech',
      });
    }

    return chips;
  }

  difficultyLabel(difficulty: Difficulty): string {
    if (difficulty === 'easy') return 'Easy';
    if (difficulty === 'hard') return 'Hard';
    return 'Intermediate';
  }

  techLabel(tech: Tech): string {
    switch (tech) {
      case 'javascript':
        return 'JavaScript';
      case 'react':
        return 'React';
      case 'angular':
        return 'Angular';
      case 'vue':
        return 'Vue';
      case 'html':
        return 'HTML';
      case 'css':
        return 'CSS';
      default:
        return 'Frontend';
    }
  }

  private publishOpenAiSeo(): void {
    const canonicalUrl = this.seo.buildCanonicalUrl(OPENAI_PREVIEW_CANONICAL_PATH);
    const collectionPage = {
      '@type': 'CollectionPage',
      '@id': `${canonicalUrl}#collection`,
      url: canonicalUrl,
      name: OPENAI_PREVIEW_TITLE,
      headline: OPENAI_PREVIEW_H1,
      description: OPENAI_PREVIEW_DESCRIPTION,
      disambiguatingDescription: COMPANY_PRACTICE_DISCLAIMER,
      inLanguage: 'en',
      dateModified: OPENAI_PREVIEW_DATE_MODIFIED,
      about: [
        { '@type': 'Thing', name: 'OpenAI frontend interview practice' },
        { '@type': 'Thing', name: 'Streaming chat frontend practice' },
        { '@type': 'Thing', name: 'Frontend system design for conversation history' },
      ],
      mentions: OPENAI_RESOURCE_LINKS.map((link) => ({
        '@type': 'WebPage',
        name: link.label,
        url: this.seo.buildCanonicalUrl(link.path),
      })),
      mainEntity: {
        '@type': 'ItemList',
        description: COMPANY_PRACTICE_DISCLAIMER,
        itemListElement: OPENAI_PRACTICE_PROMPTS.map((prompt, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: prompt.title,
          url: `${canonicalUrl}#${prompt.id}`,
        })),
      },
    };

    const breadcrumb = {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'FrontendAtlas',
          item: this.seo.buildCanonicalUrl('/'),
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Company Frontend Interview Questions',
          item: this.seo.buildCanonicalUrl('/companies'),
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: OPENAI_PREVIEW_H1,
          item: canonicalUrl,
        },
      ],
    };

    this.seo.updateTags({
      title: OPENAI_PREVIEW_TITLE,
      description: OPENAI_PREVIEW_DESCRIPTION,
      robots: 'index,follow',
      canonical: OPENAI_PREVIEW_CANONICAL_PATH,
      jsonLd: [collectionPage, breadcrumb],
    });
  }

  private publishGoogleSeo(): void {
    const canonicalUrl = this.seo.buildCanonicalUrl(GOOGLE_PREVIEW_CANONICAL_PATH);
    const itemListId = `${canonicalUrl}#practice-prompts`;
    const itemList = {
      '@type': 'ItemList',
      '@id': itemListId,
      name: 'Seven Google frontend interview practice questions',
      description: COMPANY_PRACTICE_DISCLAIMER,
      numberOfItems: GOOGLE_PRACTICE_PROMPTS.length,
      itemListElement: GOOGLE_PRACTICE_PROMPTS.map((prompt, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: prompt.title,
        url: `${canonicalUrl}#${prompt.id}`,
      })),
    };

    const collectionPage = {
      '@type': 'CollectionPage',
      '@id': `${canonicalUrl}#collection`,
      url: canonicalUrl,
      name: GOOGLE_PREVIEW_TITLE,
      headline: GOOGLE_PREVIEW_H1,
      description: GOOGLE_PREVIEW_DESCRIPTION,
      disambiguatingDescription: COMPANY_PRACTICE_DISCLAIMER,
      inLanguage: 'en',
      dateModified: GOOGLE_PREVIEW_DATE_MODIFIED,
      isAccessibleForFree: true,
      about: [
        { '@type': 'Thing', name: 'Google frontend interview preparation' },
        { '@type': 'Thing', name: 'JavaScript and browser APIs' },
        { '@type': 'Thing', name: 'Accessible UI implementation' },
        { '@type': 'Thing', name: 'Frontend system design' },
      ],
      mentions: GOOGLE_RESOURCE_LINKS.map((link) => ({
        '@type': 'WebPage',
        name: link.label,
        url: this.seo.buildCanonicalUrl(link.path),
      })),
      mainEntity: { '@id': itemListId },
    };

    const breadcrumb = {
      '@type': 'BreadcrumbList',
      '@id': `${canonicalUrl}#breadcrumb`,
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'FrontendAtlas',
          item: this.seo.buildCanonicalUrl('/'),
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Company Frontend Interview Questions',
          item: this.seo.buildCanonicalUrl('/companies'),
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: GOOGLE_PREVIEW_H1,
          item: canonicalUrl,
        },
      ],
    };

    this.seo.updateTags({
      title: GOOGLE_PREVIEW_TITLE,
      description: GOOGLE_PREVIEW_DESCRIPTION,
      robots: 'index,follow',
      canonical: GOOGLE_PREVIEW_CANONICAL_PATH,
      jsonLd: [collectionPage, itemList, breadcrumb],
    });
  }

  private publishNetflixSeo(): void {
    const canonicalUrl = this.seo.buildCanonicalUrl(NETFLIX_PREVIEW_CANONICAL_PATH);
    const itemListId = `${canonicalUrl}#practice-prompts`;
    const itemList = {
      '@type': 'ItemList',
      '@id': itemListId,
      name: 'Six Netflix frontend interview practice prompts',
      description: COMPANY_PRACTICE_DISCLAIMER,
      numberOfItems: NETFLIX_PRACTICE_PROMPTS.length,
      itemListElement: NETFLIX_PRACTICE_PROMPTS.map((prompt, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: prompt.title,
        url: `${canonicalUrl}#${prompt.id}`,
      })),
    };

    const collectionPage = {
      '@type': 'CollectionPage',
      '@id': `${canonicalUrl}#collection`,
      url: canonicalUrl,
      name: NETFLIX_PREVIEW_TITLE,
      headline: NETFLIX_PREVIEW_H1,
      description: NETFLIX_PREVIEW_DESCRIPTION,
      disambiguatingDescription: NETFLIX_PREVIEW_TRUST_NOTE,
      inLanguage: 'en',
      dateModified: NETFLIX_PREVIEW_DATE_MODIFIED,
      isAccessibleForFree: true,
      about: [
        { '@type': 'Thing', name: 'Netflix frontend interview preparation' },
        { '@type': 'Thing', name: 'JavaScript and React user interfaces' },
        { '@type': 'Thing', name: 'Streaming UI performance and accessibility' },
        { '@type': 'Thing', name: 'Frontend system design' },
      ],
      mentions: NETFLIX_RESOURCE_LINKS.map((link) => ({
        '@type': 'WebPage',
        name: link.label,
        url: this.seo.buildCanonicalUrl(link.path),
      })),
      mainEntity: { '@id': itemListId },
    };

    const breadcrumb = {
      '@type': 'BreadcrumbList',
      '@id': `${canonicalUrl}#breadcrumb`,
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'FrontendAtlas',
          item: this.seo.buildCanonicalUrl('/'),
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Company Frontend Interview Questions',
          item: this.seo.buildCanonicalUrl('/companies'),
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: NETFLIX_PREVIEW_H1,
          item: canonicalUrl,
        },
      ],
    };

    this.seo.updateTags({
      title: NETFLIX_PREVIEW_TITLE,
      description: NETFLIX_PREVIEW_DESCRIPTION,
      robots: 'index,follow',
      canonical: NETFLIX_PREVIEW_CANONICAL_PATH,
      jsonLd: [collectionPage, itemList, breadcrumb],
    });
  }

  private prettyCompany(slug: string): string {
    return companyBrandFor(slug)?.label ?? slug;
  }
}
