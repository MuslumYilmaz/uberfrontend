import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TRACKS, TrackConfig } from '../track.data';
import { PrepSignalGridComponent, PrepSignalItem } from '../../../shared/components/prep-signal-grid/prep-signal-grid.component';
import { FaCardComponent } from '../../../shared/ui/card/fa-card.component';
import { SeoService } from '../../../core/services/seo.service';

const TRACKS_PLATFORM_TITLE = 'Frontend Interview Study Plans and Tracks';
const TRACKS_PLATFORM_DESCRIPTION =
  'Use frontend interview study plans to run structured coding, concept, and system design practice, then connect each plan with the Question Library by technology.';

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

type HubQuickLink = {
  label: string;
  route: any[];
  queryParams?: Record<string, string | number | boolean>;
  toneClass: string;
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
  imports: [CommonModule, RouterModule, PrepSignalGridComponent, FaCardComponent],
  templateUrl: './track-list.component.html',
  styleUrls: ['./track-list.component.css'],
})
export class TrackListComponent implements OnInit {
  private readonly seo = inject(SeoService);

  tracks = TRACKS.filter((t) => !t.hidden);
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
  allTrackCardsCount = this.tracks.length + this.masteryCards.length;
  routeRolePrimary = {
    label: 'Start guided plan now',
    route: ['/tracks', 'javascript-prep-path', 'mastery'] as any[],
    queryParams: { entry: 'tracks_role_contract' } as Record<string, string>,
  };
  routeRoleSecondary = {
    label: 'Open Question Library',
    route: ['/coding'] as any[],
    queryParams: { reset: 1, entry: 'tracks_role_contract' } as Record<string, string | number>,
  };
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
      label: 'Vue interview questions',
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
      label: 'HTML CSS interview questions',
      route: ['/html-css/interview-questions'],
      toneClass: 'hero-link--iq-htmlcss',
    },
  ];

  trackPrepOutcomes: PrepSignalItem[] = [
    'Follow a clear interview roadmap instead of random practice.',
    'Connect framework drills to system design and behavioral rounds.',
  ];

  trackPrepMistakes: PrepSignalItem[] = [
    'Switching between stacks every day without finishing one path.',
    'Focusing only on concept recall instead of mixed interview signal areas.',
  ];

  trackPrepSequence: PrepSignalItem[] = [
    { text: 'Interview blueprint', route: ['/guides/interview-blueprint'] },
    { text: 'Question Library', route: ['/coding'], queryParams: { reset: 1 } },
    { text: 'Framework Prep Guide', route: ['/guides/framework-prep'] },
    { text: 'Study Plans', route: ['/tracks'] },
    { text: 'Company Prep', route: ['/companies'] },
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
        'After each track block, use blueprint guides to tighten communication quality and architecture reasoning.',
      route: ['/guides/interview-blueprint'],
      ctaLabel: 'Open interview blueprint',
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
  faqEntries: TrackFaqEntry[] = [
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

  private buildTrackCardMeta(track: TrackConfig): { note: string; badges: string[] } {
    const systemDesignCount = track.featured.filter((item) => item.kind === 'system-design').length;
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
      ...this.masteryCards.map((track, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: track.title,
        url: this.seo.buildCanonicalUrl(`/tracks/${track.slug}/mastery`),
      })),
      ...this.tracks.map((track, index) => ({
        '@type': 'ListItem',
        position: this.masteryCards.length + index + 1,
        name: track.title,
        url: this.seo.buildCanonicalUrl(`/tracks/${track.slug}/preview`),
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
        { '@type': 'Thing', name: 'Frontend interview tracks' },
      ],
      mentions: this.interviewHubQuickLinks.map((hub) => ({
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
          name: 'Frontend Interview Study Plans and Tracks',
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
