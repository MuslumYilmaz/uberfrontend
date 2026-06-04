import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TRACKS, TrackConfig } from '../track.data';
import { FaCardComponent } from '../../../shared/ui/card/fa-card.component';
import { SeoService } from '../../../core/services/seo.service';
import { SHOWCASE_STATS } from '../../../generated/content-metadata';
import { JAVASCRIPT_MASTERY_PATH } from '../../../shared/mastery/paths/javascript-mastery.path';

const TRACKS_PLATFORM_TITLE = 'Frontend Interview Study Plan and 30-Day Roadmap';
const TRACKS_PLATFORM_DESCRIPTION =
  'Use frontend interview study plans to prepare in 7 or 30 days with coding, JavaScript, UI, system design, framework Q&A, company prep, and weekly checkpoints.';

type MasteryTrackCard = {
  slug: string;
  durationLabel: string;
  questionCountLabel: string;
  title: string;
  subtitle: string;
  focus: string[];
  note: string;
  badges: string[];
  ctaLabel: string;
};

type PlanMetric = {
  label: string;
  value: string;
};

type PlanPreviewStep = {
  label: string;
  title: string;
  detail: string;
};

type HeroPlanCard = {
  slug: string;
  kicker: string;
  title: string;
  subtitle: string;
  route: any[];
  ctaLabel: string;
  toneClass: string;
  metrics: PlanMetric[];
  previewSteps: PlanPreviewStep[];
};

type HubQuickLink = {
  label: string;
  route: any[];
  queryParams?: Record<string, string | number | boolean>;
  toneClass: string;
};

type FocusLink = HubQuickLink & {
  description: string;
};

type TrustMetric = {
  value: string;
  label: string;
};

type PlatformStep = {
  kicker: string;
  title: string;
  description: string;
  route: any[];
  ctaLabel: string;
};

type PlaybookColumn = {
  title: string;
  points: string[];
};

type TrackFaqEntry = {
  question: string;
  answer: string;
};

@Component({
  selector: 'app-track-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FaCardComponent],
  templateUrl: './track-list.component.html',
  styleUrls: ['./track-list.component.css'],
})
export class TrackListComponent implements OnInit {
  private readonly seo = inject(SeoService);

  tracks = TRACKS.filter((t) => !t.hidden);
  private readonly crashTrack = this.requireVisibleTrack('crash-7d');
  private readonly foundationsTrack = this.requireVisibleTrack('foundations-30d');
  private readonly visibleTimedTracks = [this.crashTrack, this.foundationsTrack];
  readonly guidedPlanCount = this.visibleTimedTracks.length + 1;
  readonly guidedQuestionCount = this.visibleTimedTracks.reduce(
    (total, track) => total + track.featured.length,
    0,
  );
  readonly guidedSystemDesignCount = this.visibleTimedTracks.reduce(
    (total, track) => total + this.systemDesignCount(track),
    0,
  );
  readonly companyPrepSourceCount = Object.keys(SHOWCASE_STATS.companyCounts).length;
  private readonly uiFrameworks = new Set(['react', 'angular', 'vue']);
  private readonly trackCardMeta = new Map<string, { note: string; badges: string[] }>(
    this.tracks.map((track) => [track.slug, this.buildTrackCardMeta(track)]),
  );
  masteryCards: MasteryTrackCard[] = [
    {
      slug: 'javascript-prep-path',
      durationLabel: '0 to 100 roadmap',
      questionCountLabel: '40+ drills',
      title: 'JavaScript Mastery Crash Track',
      subtitle:
        'Structured module board with concept questions, output prediction, coding drills, and checkpoint gates.',
      focus: [
        'Foundations: values, coercion, control flow',
        'Functions + scope: closures, TDZ, this',
        'Async + browser APIs: event loop, debounce, fetch',
        'Mastery capstone: polyfills, LRU, reactive store',
      ],
      note: 'Direct mastery path with progress tracking and module unlock flow.',
      badges: ['JS-first mastery', 'Checkpoint-gated progression'],
      ctaLabel: 'Open mastery',
    },
  ];
  trustMetrics: TrustMetric[] = [
    {
      value: String(SHOWCASE_STATS.totalQuestions),
      label: 'Practice questions',
    },
    {
      value: String(this.companyPrepSourceCount),
      label: 'Company prep sources',
    },
    {
      value: String(this.guidedQuestionCount),
      label: 'Guided-plan questions',
    },
    {
      value: String(this.guidedSystemDesignCount),
      label: 'System-design prompts',
    },
    {
      value: 'May 2026',
      label: 'Updated',
    },
  ];
  heroPlanCards: HeroPlanCard[] = [
    {
      slug: this.crashTrack.slug,
      kicker: '7-day sprint',
      title: this.crashTrack.title,
      subtitle: this.crashTrack.subtitle,
      route: ['/tracks', this.crashTrack.slug, 'preview'],
      ctaLabel: 'Open 7-day preview',
      toneClass: 'hero-plan--crash',
      metrics: [
        { value: `0/${this.crashTrack.featured.length}`, label: 'questions' },
        { value: 'Day 1', label: 'ready' },
        { value: String(this.systemDesignCount(this.crashTrack)), label: 'system design' },
        { value: '45 min', label: 'per day' },
      ],
      previewSteps: [
        {
          label: 'Day 1',
          title: 'JavaScript timing and utilities',
          detail: 'Review debounce, throttle, Promise.all, and async output questions before UI work.',
        },
        {
          label: 'Day 2',
          title: 'UI state and data flow',
          detail: 'Practice debounced search, pagination, loading states, and stale-response handling.',
        },
        {
          label: 'Day 3',
          title: 'Framework implementation pass',
          detail: 'Translate the same UI patterns into React, Angular, or Vue.',
        },
      ],
    },
    {
      slug: this.foundationsTrack.slug,
      kicker: '30-day roadmap',
      title: this.foundationsTrack.title,
      subtitle: this.foundationsTrack.subtitle,
      route: ['/tracks', this.foundationsTrack.slug, 'preview'],
      ctaLabel: 'Open 30-day preview',
      toneClass: 'hero-plan--foundations',
      metrics: [
        { value: `0/${this.foundationsTrack.featured.length}`, label: 'questions' },
        { value: 'Day 1', label: 'ready' },
        { value: String(this.systemDesignCount(this.foundationsTrack)), label: 'system design' },
        { value: '30-45 min', label: 'per day' },
      ],
      previewSteps: [
        {
          label: 'Day 1',
          title: 'Diagnose JavaScript and target stack',
          detail: 'Open the matching hub, mark weak topics, and solve two fundamentals prompts.',
        },
        {
          label: 'Day 2',
          title: 'UI state and async flow',
          detail: 'Practice loading, error, empty, debounce, or pagination states in one timed loop.',
        },
        {
          label: 'Day 3',
          title: 'Framework and system-design setup',
          detail: 'Pick React, Angular, or Vue, solve one framework drill, then outline one FE design prompt.',
        },
      ],
    },
    {
      slug: JAVASCRIPT_MASTERY_PATH.frameworkSlug,
      kicker: '0 to 100 mastery',
      title: JAVASCRIPT_MASTERY_PATH.title,
      subtitle: JAVASCRIPT_MASTERY_PATH.subtitle,
      route: ['/tracks', JAVASCRIPT_MASTERY_PATH.frameworkSlug, 'mastery'],
      ctaLabel: 'Open mastery board',
      toneClass: 'hero-plan--mastery',
      metrics: [
        { value: `0/${JAVASCRIPT_MASTERY_PATH.items.length}`, label: 'drills' },
        { value: String(JAVASCRIPT_MASTERY_PATH.modules.length), label: 'modules' },
        { value: String(this.masteryCheckpointCount), label: 'checkpoints' },
        { value: '45-60 min', label: 'per module' },
      ],
      previewSteps: JAVASCRIPT_MASTERY_PATH.modules.slice(0, 3).map((module, index) => ({
        label: `Module ${index + 1}`,
        title: module.title,
        detail: module.summary,
      })),
    },
  ];
  interviewHubQuickLinks: HubQuickLink[] = [
    {
      label: 'Question Library',
      route: ['/coding'],
      queryParams: { reset: 1 },
      toneClass: 'hero-link--iq-master',
    },
    {
      label: 'JavaScript interview questions',
      route: ['/javascript/interview-questions'],
      toneClass: 'hero-link--iq-js',
    },
    {
      label: 'React interview questions',
      route: ['/react/interview-questions'],
      toneClass: 'hero-link--iq-react',
    },
    {
      label: 'Angular interview questions',
      route: ['/angular/interview-questions'],
      toneClass: 'hero-link--iq-angular',
    },
    {
      label: 'Vue.js interview questions',
      route: ['/vue/interview-questions'],
      toneClass: 'hero-link--iq-vue',
    },
    {
      label: 'HTML interview questions',
      route: ['/html/interview-questions'],
      toneClass: 'hero-link--iq-html',
    },
    {
      label: 'CSS interview questions',
      route: ['/css/interview-questions'],
      toneClass: 'hero-link--iq-css',
    },
    {
      label: 'HTML and CSS interview questions',
      route: ['/html-css/interview-questions'],
      toneClass: 'hero-link--iq-htmlcss',
    },
  ];
  focusLinks: FocusLink[] = [
    {
      label: 'JavaScript',
      description: 'Async, closures, output prediction, and utility drills.',
      route: ['/javascript/interview-questions'],
      toneClass: 'hero-link--iq-js',
    },
    {
      label: 'React',
      description: 'Hooks, rendering, state ownership, and UI coding.',
      route: ['/react/interview-questions'],
      toneClass: 'hero-link--iq-react',
    },
    {
      label: 'Angular',
      description: 'RxJS flows, change detection, DI, and component decisions.',
      route: ['/angular/interview-questions'],
      toneClass: 'hero-link--iq-angular',
    },
    {
      label: 'Vue',
      description: 'Reactivity, component contracts, router, and state tradeoffs.',
      route: ['/vue/interview-questions'],
      toneClass: 'hero-link--iq-vue',
    },
    {
      label: 'HTML/CSS',
      description: 'Semantics, accessibility, layout, cascade, and styling flow.',
      route: ['/html-css/interview-questions'],
      toneClass: 'hero-link--iq-htmlcss',
    },
    {
      label: 'System Design',
      description: 'Frontend architecture prompts and tradeoff practice.',
      route: ['/system-design'],
      toneClass: 'hero-link--system',
    },
    {
      label: 'Frontend machine coding questions',
      description: 'Timed UI coding rounds, widgets, async state, and framework implementation.',
      route: ['/machine-coding'],
      toneClass: 'hero-link--iq-master',
    },
    {
      label: 'Company Prep',
      description: 'Target company patterns and final-week interview loops.',
      route: ['/companies'],
      toneClass: 'hero-link--hub',
    },
    {
      label: 'Focus Areas',
      description: 'Find the weak area to drill before choosing another plan.',
      route: ['/focus-areas'],
      toneClass: 'hero-link--focus',
    },
  ];

  platformSteps: PlatformStep[] = [
    {
      kicker: 'Step 1',
      title: 'Start in the Question Library',
      description:
        'Start from the Question Library, then narrow to the stack you are interviewing for this month.',
      route: ['/coding'],
      ctaLabel: 'Open Question Library',
    },
    {
      kicker: 'Step 2',
      title: 'Run one track end-to-end',
      description:
        'Use one guided study plan to sequence coding, concept questions, and system design practice instead of switching context every day.',
      route: ['/tracks'],
      ctaLabel: 'Browse tracks',
    },
    {
      kicker: 'Step 3',
      title: 'Validate with role-focused guides',
      description:
        'After each track block, use the frontend interview preparation guide to tighten communication quality and architecture reasoning.',
      route: ['/guides/interview-blueprint/intro'],
      ctaLabel: 'Open frontend interview preparation guide',
    },
    {
      kicker: 'Step 4',
      title: 'Stress-test with Company Prep',
      description:
        'Close each prep cycle with Company Prep so your final week reflects the interview style you are targeting.',
      route: ['/companies'],
      ctaLabel: 'Open Company Prep',
    },
  ];
  playbookColumns: PlaybookColumn[] = [
    {
      title: 'Week 1: Foundation and speed',
      points: [
        'Prioritize JavaScript and browser fundamentals before framework-specific drills.',
        'Alternate implementation questions with concept explanations so speed and clarity improve together.',
        'Track missed topics and carry them into your next practice cycle.',
      ],
    },
    {
      title: 'Week 2: Framework depth',
      points: [
        'Commit to one primary framework track instead of rotating across all stacks.',
        'Solve medium coding prompts under time pressure, then review trade-offs in plain language.',
        'Use the framework prep path to verify API patterns, rendering behavior, and state decisions.',
      ],
    },
    {
      title: 'Week 3: Interview simulation',
      points: [
        'Blend track drills with system-design blueprint walkthroughs for architecture communication.',
        'Add company-specific question sets to mirror interview pacing and prompt style.',
        'Run mock sessions using only topics that still fail consistency checks.',
      ],
    },
  ];
  weeklyPracticeItems: PlaybookColumn[] = [
    {
      title: 'Week 0: diagnose the stack',
      points: [
        'Open the matching tech interview question hub and mark the topics that still fail under time pressure.',
        'Pick either the 7-day crash plan or the 30-day foundations roadmap before adding more resources.',
      ],
    },
    {
      title: 'Week 1: JavaScript and UI speed',
      points: [
        'Pair JavaScript output/concept review with small UI implementation prompts.',
        'Write one short explanation after each solved prompt so coding and communication improve together.',
      ],
    },
    {
      title: 'Week 2: framework and state depth',
      points: [
        'Practice React, Angular, or Vue prompts that expose rendering, state ownership, data fetching, and tests.',
        'Use the framework prep guide only after the tech hub shows which weak area repeats.',
      ],
    },
    {
      title: 'Week 3+: system design and company prep',
      points: [
        'Add frontend system design once implementation answers are stable.',
        'Use Company Prep in the final week so practice reflects the teams and interview loops you are targeting.',
      ],
    },
  ];
  studyPlanMistakes: PlaybookColumn[] = [
    {
      title: 'Practicing random questions',
      points: [
        'Random browsing creates shallow coverage; use one plan to decide today’s coding, concept, and review work.',
      ],
    },
    {
      title: 'Skipping explanation practice',
      points: [
        'Frontend interviews evaluate tradeoffs, accessibility, performance, and state reasoning, not just passing code.',
      ],
    },
    {
      title: 'Jumping to company prep too early',
      points: [
        'Company prompts work best after baseline JavaScript, UI, framework, and system design gaps are visible.',
      ],
    },
  ];
  faqEntries: TrackFaqEntry[] = [
    {
      question: 'What is a frontend interview study plan?',
      answer:
        'A frontend interview study plan is an ordered prep sequence that connects coding prompts, concept questions, framework review, frontend system design, and company prep so practice is not random.',
    },
    {
      question: 'Should I use Study Plans before or after the Question Library?',
      answer:
        'Start with the Question Library to identify your weak areas, then use Study Plans to execute a fixed sequence that removes random practice. Most candidates get better outcomes when tracks are used as the weekly execution layer.',
    },
    {
      question: 'How many tracks should I run at the same time?',
      answer:
        'Run one track at a time for focused improvement. Parallel tracks usually create shallow coverage and reduce retention, especially when interview timelines are short.',
    },
    {
      question: 'Do tracks cover coding and explanation rounds together?',
      answer:
        'Yes. The platform combines coding implementation practice with concept questions and system-design prompts so you can practice both delivery speed and technical depth in the same prep loop.',
    },
    {
      question: 'When should I move from tracks to company question sets?',
      answer:
        'Move to Company Prep after you complete at least one guided track cycle and can consistently explain your coding decisions. This timing gives you enough baseline skill to benefit from company-specific patterns.',
    },
    {
      question: 'Should I choose the 7-day or 30-day frontend interview preparation roadmap?',
      answer:
        'Use the 7-day frontend interview prep plan for short deadlines and repeated high-yield review. Use the 30-day frontend interview preparation roadmap when you need a full month to rebuild fundamentals, framework depth, system design, and final company practice.',
    },
  ];

  ngOnInit(): void {
    this.publishSeo();
  }

  noteFor(track: TrackConfig): string {
    return this.trackCardMeta.get(track.slug)?.note
      || 'Covers UI frameworks (React, Angular, Vue) plus HTML/CSS and JS where relevant.';
  }

  badgesFor(track: TrackConfig): string[] {
    return this.trackCardMeta.get(track.slug)?.badges
      || ['Framework coding options', 'System design included'];
  }

  private get masteryCheckpointCount(): number {
    return JAVASCRIPT_MASTERY_PATH.items.filter((item) => item.type === 'checkpoint').length;
  }

  private requireVisibleTrack(slug: string): TrackConfig {
    const track = this.tracks.find((item) => item.slug === slug);
    if (!track) {
      throw new Error(`Missing visible track: ${slug}`);
    }
    return track;
  }

  private systemDesignCount(track: TrackConfig): number {
    return track.featured.filter((item) => item.kind === 'system-design').length;
  }

  private buildTrackCardMeta(track: TrackConfig): { note: string; badges: string[] } {
    const systemDesignCount = this.systemDesignCount(track);
    const hasFrameworkCoding = track.featured.some(
      (item) => item.kind === 'coding' && !!item.tech && this.uiFrameworks.has(item.tech),
    );
    const frameworkBadge = hasFrameworkCoding ? 'Framework coding options' : 'Core web stack';
    const systemBadge = `${systemDesignCount} system design prompt${systemDesignCount === 1 ? '' : 's'}`;

    if (track.slug === 'crash-7d') {
      return {
        note: 'High-yield 7-day sprint: repeat-friendly mix of JS core, UI flows, and two must-know frontend system design prompts.',
        badges: [frameworkBadge, systemBadge],
      };
    }

    if (track.slug === 'foundations-30d') {
      return {
        note: '30-day progression from fundamentals to medium concepts, with framework coding drills and framework-agnostic concept questions.',
        badges: [frameworkBadge, systemBadge],
      };
    }

    return {
      note: 'Covers UI frameworks (React, Angular, Vue) plus HTML/CSS and JS where relevant.',
      badges: [frameworkBadge, systemBadge],
    };
  }

  private publishSeo(): void {
    const canonicalPath = '/tracks';
    const canonicalUrl = this.seo.buildCanonicalUrl(canonicalPath);
    const itemListElement = [
      ...this.tracks.map((track, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: track.title,
        url: this.seo.buildCanonicalUrl(`/tracks/${track.slug}/preview`),
      })),
      ...this.masteryCards.map((track, index) => ({
        '@type': 'ListItem',
        position: this.tracks.length + index + 1,
        name: track.title,
        url: this.seo.buildCanonicalUrl(`/tracks/${track.slug}/mastery`),
      })),
    ];

    const collectionPage: Record<string, any> = {
      '@type': 'CollectionPage',
      '@id': canonicalUrl,
      url: canonicalUrl,
      name: TRACKS_PLATFORM_TITLE,
      description: TRACKS_PLATFORM_DESCRIPTION,
      inLanguage: 'en',
      about: [
        { '@type': 'Thing', name: 'Frontend interview prep platform' },
        { '@type': 'Thing', name: 'Frontend interview guided plans' },
        { '@type': 'Thing', name: 'frontend interview study plan' },
        { '@type': 'Thing', name: 'frontend interview preparation roadmap' },
        { '@type': 'Thing', name: '30 day frontend interview preparation' },
      ],
      mentions: [...this.interviewHubQuickLinks, ...this.focusLinks].map((hub) => ({
        '@type': 'WebPage',
        name: hub.label,
        url: this.seo.buildCanonicalUrl(String(hub.route[0] || '/interview-questions')),
      })),
    };

    if (itemListElement.length) {
      collectionPage['mainEntity'] = {
        '@type': 'ItemList',
        itemListElement,
      };
    }

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
          name: 'Frontend Interview Study Plans and Guided Plans',
          item: canonicalUrl,
        },
      ],
    };

    const faqPage = {
      '@type': 'FAQPage',
      mainEntity: this.faqEntries.map((entry) => ({
        '@type': 'Question',
        name: entry.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: entry.answer,
        },
      })),
    };

    this.seo.updateTags({
      title: TRACKS_PLATFORM_TITLE,
      description: TRACKS_PLATFORM_DESCRIPTION,
      canonical: canonicalPath,
      jsonLd: [collectionPage, breadcrumb, faqPage],
    });
  }
}
