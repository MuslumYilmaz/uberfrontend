import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { EssentialQuestionsResolved, EssentialResolvedItem, EssentialSection, EssentialTier } from '../../core/models/essential-questions.model';
import { isQuestionLockedForTier } from '../../core/models/question.model';
import { AuthService } from '../../core/services/auth.service';
import { SeoMeta, SeoService } from '../../core/services/seo.service';
import { UserProgressService } from '../../core/services/user-progress.service';
import {
  FaQuestionRowComponent,
  FaQuestionRowMetaChip,
  FaQuestionRowVariant,
} from '../../shared/ui/question-row/fa-question-row.component';

type SectionOption = {
  key: EssentialSection | 'all';
  label: string;
};

type TierOption = {
  key: EssentialTier | 'all';
  label: string;
};

type EssentialEditorialSignal = {
  reviewedLabel: string;
  reviewer: string;
  coverage: string;
  dateModified: string;
};

type EssentialInfoCard = {
  title: string;
  detail: string;
  meta?: string;
};

type EssentialFaqItem = {
  q: string;
  a: string;
};

const ESSENTIAL_EDITORIAL_SIGNAL: EssentialEditorialSignal = {
  reviewedLabel: 'Reviewed May 21, 2026',
  reviewer: 'FrontendAtlas Editor',
  coverage: '60 ranked frontend interview prompts across JavaScript utilities, UI coding, system design, and concepts',
  dateModified: '2026-05-21T00:00:00.000Z',
};

const ESSENTIAL_VALUE_PROP =
  'Essential 60 is a compact ranked practice list, not the full question bank. It prioritizes prompts by interview leverage, repeated patterns, coverage balance, useful variants, and shipped FrontendAtlas practice routes.';

const ESSENTIAL_WHY_CARDS: EssentialInfoCard[] = [
  {
    title: 'Ranked by interview leverage',
    detail:
      'Each prompt gets an importance score based on how often the pattern appears, how many follow-ups it unlocks, and how much signal it gives in a short round.',
  },
  {
    title: 'Balanced by round format',
    detail:
      'The shortlist mixes JavaScript utilities, UI coding, system design, and core concepts so practice does not overfit to one interview style.',
  },
  {
    title: 'Framework variants where useful',
    detail:
      'React, Angular, and Vue variants appear when the same UI pattern changes meaningfully across frameworks, instead of duplicating every prompt mechanically.',
  },
  {
    title: 'Mapped to practice routes with progress',
    detail:
      'Items point to shipped FrontendAtlas routes, so you can open a prompt, solve it, and keep progress attached to the ranked list.',
  },
];

const ESSENTIAL_USAGE_PLANS: EssentialInfoCard[] = [
  {
    title: '7-day refresh',
    meta: 'Use Must know filters first',
    detail:
      'Start with must-know JavaScript utilities and one UI coding prompt per day. The goal is to restore speed on common patterns before broad review.',
  },
  {
    title: '14-day practice loop',
    meta: 'Rotate every section',
    detail:
      'Alternate JavaScript, UI coding, system design, and concepts. Revisit misses after two days so the loop builds repeatable recall, not one-pass familiarity.',
  },
  {
    title: '30-day baseline',
    meta: 'Finish all 60 prompts',
    detail:
      'Complete the full list, repeat high-leverage misses, and add at least two system design sessions. The outcome is a mock-ready frontend interview baseline.',
  },
];

const ESSENTIAL_FAQ_ITEMS: EssentialFaqItem[] = [
  {
    q: 'What is FrontendAtlas Essential 60?',
    a: 'FrontendAtlas Essential 60 is a ranked shortlist of must-know frontend interview prompts. It is designed for focused practice across JavaScript utilities, UI coding, frontend system design, and core concepts rather than browsing a full question bank.',
  },
  {
    q: 'How were the Essential 60 questions selected?',
    a: 'Questions were selected by interview leverage, repeated frontend interview patterns, coverage balance, useful framework variants, and availability as shipped FrontendAtlas practice routes. The ranking favors prompts that expose trade-offs, edge cases, or implementation skill quickly.',
  },
  {
    q: 'How should I use Essential 60 in 7, 14, or 30 days?',
    a: 'For 7 days, filter to must-know prompts and focus on speed. For 14 days, rotate through every section and repeat missed prompts. For 30 days, finish all 60 and use the high-leverage misses as your mock interview checklist.',
  },
  {
    q: 'Is Essential 60 different from the full frontend interview questions hub?',
    a: 'Yes. The full hub gives broader answers, topic clusters, and paths into each technology. Essential 60 is a compact practice shortlist for deciding what to solve first.',
  },
  {
    q: 'Does Essential 60 include UI coding, JavaScript utilities, concepts, and system design?',
    a: 'Yes. The collection is intentionally split across JavaScript utilities, UI coding prompts, frontend concepts, and system design problems so it reflects the main frontend interview round formats.',
  },
];

const ESSENTIAL_SCHEMA_ENTITIES = [
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
];

@Component({
  standalone: true,
  selector: 'app-essential-questions',
  imports: [CommonModule, RouterModule, FaQuestionRowComponent],
  templateUrl: './essential-questions.component.html',
  styleUrls: ['./essential-questions.component.scss'],
})
export class EssentialQuestionsComponent implements OnInit {
  readonly section = signal<EssentialSection | 'all'>('all');
  readonly tier = signal<EssentialTier | 'all'>('all');

  readonly solvedIds = this.progress.solvedIds;
  readonly solvedSet = computed(() => new Set(this.progress.solvedIds()));

  data: EssentialQuestionsResolved = {
    collection: {
      id: 'frontend-essential-60',
      title: 'FrontendAtlas Essential 60',
      description: '',
      updatedAt: '',
      benchmarkSources: [],
      items: [],
    },
    items: [],
  };

  readonly sectionOptions: SectionOption[] = [
    { key: 'all', label: 'All 60' },
    { key: 'javascript-functions', label: 'JavaScript functions' },
    { key: 'ui-coding', label: 'UI coding' },
    { key: 'system-design', label: 'System design' },
    { key: 'concepts', label: 'Concepts' },
  ];

  readonly tierOptions: TierOption[] = [
    { key: 'all', label: 'All tiers' },
    { key: 'must-know', label: 'Must know' },
    { key: 'high-leverage', label: 'High leverage' },
  ];

  readonly filteredItems = computed(() => {
    return this.data.items.filter((item) => {
      const section = this.section();
      const tier = this.tier();
      return (section === 'all' || item.section === section)
        && (tier === 'all' || item.tier === tier);
    });
  });

  readonly mustKnowCount = computed(() => this.data.items.filter((item) => item.tier === 'must-know').length);
  readonly premiumCount = computed(() => this.data.items.filter((item) => item.access === 'premium').length);

  constructor(
    private readonly route: ActivatedRoute,
    public readonly auth: AuthService,
    private readonly progress: UserProgressService,
    private readonly seo: SeoService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    const resolved = this.route.snapshot.data['essentialQuestions'] as EssentialQuestionsResolved | undefined;
    if (resolved) {
      this.data = resolved;
    }

    this.updateSeo();
  }

  selectSection(section: EssentialSection | 'all'): void {
    this.section.set(section);
  }

  selectTier(tier: EssentialTier | 'all'): void {
    this.tier.set(tier);
  }

  sectionCount(section: EssentialSection | 'all'): number {
    if (section === 'all') return this.data.items.length;
    return this.data.items.filter((item) => item.section === section).length;
  }

  isSolved(item: EssentialResolvedItem): boolean {
    if (item.isSystemDesign) return false;
    return this.solvedSet().has(item.primary.id);
  }

  isLocked(item: EssentialResolvedItem): boolean {
    return isQuestionLockedForTier({ access: item.access }, this.auth.user());
  }

  tierLabel(item: EssentialResolvedItem): string {
    return item.tier === 'must-know' ? 'Must know' : 'High leverage';
  }

  sectionLabel(section: EssentialSection): string {
    switch (section) {
      case 'javascript-functions':
        return 'JavaScript functions';
      case 'ui-coding':
        return 'UI coding';
      case 'system-design':
        return 'System design';
      case 'concepts':
        return 'Concepts';
      default:
        return 'Frontend';
    }
  }

  sectionMetaLabel(section: EssentialSection): string {
    return section === 'javascript-functions' ? 'JS functions' : this.sectionLabel(section);
  }

  editorialSignal(): EssentialEditorialSignal {
    return ESSENTIAL_EDITORIAL_SIGNAL;
  }

  valuePropCopy(): string {
    return ESSENTIAL_VALUE_PROP;
  }

  whyCards(): EssentialInfoCard[] {
    return ESSENTIAL_WHY_CARDS;
  }

  usagePlans(): EssentialInfoCard[] {
    return ESSENTIAL_USAGE_PLANS;
  }

  faqItems(): EssentialFaqItem[] {
    return ESSENTIAL_FAQ_ITEMS;
  }

  benchmarkSurfaceCount(): number {
    return this.data.collection.benchmarkSources.length || 5;
  }

  difficultyLabel(item: EssentialResolvedItem): string {
    return item.difficulty === 'easy'
      ? 'Easy'
      : item.difficulty === 'hard'
        ? 'Hard'
        : 'Intermediate';
  }

  scoreLabel(item: EssentialResolvedItem): string {
    return `${item.score}/100`;
  }

  importanceTooltip(_item: EssentialResolvedItem): string {
    return 'Importance score: how strongly this question is prioritized in the Essential 60 list.';
  }

  importanceAriaLabel(item: EssentialResolvedItem): string {
    return `Importance score ${item.score} out of 100`;
  }

  descriptionTooltip(item: EssentialResolvedItem): string {
    return item.rationale;
  }

  rowMetaChips(item: EssentialResolvedItem): FaQuestionRowMetaChip[] {
    const sectionLabel = this.sectionLabel(item.section);
    const sectionMetaLabel = this.sectionMetaLabel(item.section);
    const techLabel = this.techSummary(item);
    const techAriaLabel = this.techAriaSummary(item);
    const chips: FaQuestionRowMetaChip[] = [
      {
        label: sectionMetaLabel,
        ariaLabel: `Section: ${sectionLabel}`,
        tone: 'neutral',
        priority: 'secondary',
      },
      {
        label: this.tierLabel(item),
        ariaLabel: `Tier: ${this.tierLabel(item)}`,
        tone: 'tier',
        priority: 'secondary',
      },
      {
        label: this.scoreLabel(item),
        ariaLabel: this.importanceAriaLabel(item),
        tone: 'score',
      },
      {
        label: this.difficultyLabel(item),
        ariaLabel: `Difficulty: ${this.difficultyLabel(item)}`,
        tone: 'difficulty',
      },
      {
        label: techLabel,
        ariaLabel: `Technology: ${techAriaLabel}`,
        tone: 'tech',
        priority: 'secondary',
      },
    ];

    if (this.isLocked(item)) {
      chips.push({
        label: 'Premium',
        ariaLabel: 'Premium question',
        tone: 'access',
      });
    }

    return chips;
  }

  rowVariants(item: EssentialResolvedItem): FaQuestionRowVariant[] {
    return item.variants.map((variant) => ({
      id: variant.id,
      label: variant.techLabel,
      active: variant.id === item.primary.id,
      ariaLabel: `Open ${variant.techLabel} version`,
    }));
  }

  openVariant(variant: FaQuestionRowVariant, item: EssentialResolvedItem): void {
    const target = item.variants.find((candidate) => candidate.id === variant.id);
    if (!target) return;
    this.router.navigate(target.route);
  }

  techSummary(item: EssentialResolvedItem): string {
    if (item.isSystemDesign) return 'Frontend';
    if (item.technologies.length === 0) return 'Frontend';
    if (item.technologies.length === 1) return item.variants[0]?.techLabel || 'Frontend';
    const primary = item.variants.find((variant) => variant.id === item.primary.id) ?? item.variants[0];
    return `${primary?.techLabel || 'Frontend'} +${Math.max(0, item.variants.length - 1)}`;
  }

  techAriaSummary(item: EssentialResolvedItem): string {
    if (item.isSystemDesign) return 'Frontend';
    if (item.technologies.length === 0) return 'Frontend';
    return item.variants.map((variant) => variant.techLabel).join(', ');
  }

  private updateSeo(): void {
    const seoData = (this.route.snapshot.data['seo'] as SeoMeta | undefined) || {};
    const canonical = this.seo.buildCanonicalUrl('/interview-questions/essential');
    const itemList = {
      '@type': 'ItemList',
      itemListElement: this.data.items.slice(0, 60).map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.title,
        url: this.seo.buildCanonicalUrl(item.path),
      })),
    };
    const faqPage = {
      '@type': 'FAQPage',
      '@id': `${canonical}#essential-faq`,
      url: canonical,
      name: 'FrontendAtlas Essential 60 FAQ',
      mainEntity: this.faqItems().map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.a,
        },
      })),
    };
    const schemaEntities = ESSENTIAL_SCHEMA_ENTITIES.map((name) => ({ '@type': 'Thing', name }));

    this.seo.updateTags({
      ...seoData,
      canonical,
      jsonLd: [
        {
          '@type': 'CollectionPage',
          '@id': canonical,
          url: canonical,
          name: this.data.collection.title,
          description: this.data.collection.description,
          dateModified: this.collectionDateModified(),
          reviewedBy: {
            '@type': 'Organization',
            name: ESSENTIAL_EDITORIAL_SIGNAL.reviewer,
          },
          about: schemaEntities,
          mentions: [
            ...schemaEntities,
            { '@type': 'Thing', name: 'importance score' },
            { '@type': 'Thing', name: 'framework variants' },
            { '@type': 'Thing', name: 'practice routes' },
          ],
          mainEntity: itemList,
        },
        itemList,
        faqPage,
      ],
    });
  }

  private collectionDateModified(): string {
    const updatedAt = this.data.collection.updatedAt;
    if (/^\d{4}-\d{2}-\d{2}$/.test(updatedAt)) {
      return `${updatedAt}T00:00:00.000Z`;
    }
    return ESSENTIAL_EDITORIAL_SIGNAL.dateModified;
  }
}
