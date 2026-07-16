import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PUBLIC_EDITORIAL_FACTS, publicEditorialAuthorSchema } from '../../core/content/public-editorial-facts';
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
  author: string;
  coverage: string;
};

type EssentialSectionGroup = {
  section: EssentialSection;
  label: string;
  items: EssentialResolvedItem[];
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
  author: PUBLIC_EDITORIAL_FACTS.author.name,
  coverage: '60 curated frontend interview prompts across JavaScript utilities, UI coding, system design, and concepts',
};

const ESSENTIAL_VALUE_PROP =
  'Essential 60 is a compact, curated practice list, not the full question bank. Prompts are grouped by round format, paired with a selection rationale, and linked directly to focused practice.';

const ESSENTIAL_WHY_CARDS: EssentialInfoCard[] = [
  {
    title: 'A transparent selection rationale',
    detail:
      'Each prompt includes a concise editorial rationale explaining the skill, behavior, or trade-off it is meant to exercise.',
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
    title: 'Connected to practice with progress',
    detail:
      'Each item opens a focused prompt, so you can solve it and keep progress attached to the curated list.',
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
    a: 'FrontendAtlas Essential 60 is a curated shortlist of frontend interview prompts. It is designed for focused practice across JavaScript utilities, UI coding, frontend system design, and core concepts rather than browsing a full question bank.',
  },
  {
    q: 'How were the Essential 60 questions selected?',
    a: 'Questions were selected to balance JavaScript utilities, UI coding, system design, and concepts while keeping useful framework variants together. Each row shows the editorial rationale for including that prompt, and the coverage references describe topic coverage only.',
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
  'curated frontend interview questions',
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

  readonly filteredGroups = computed<EssentialSectionGroup[]>(() => {
    const items = this.filteredItems();
    return this.sectionOptions
      .filter((option): option is SectionOption & { key: EssentialSection } => option.key !== 'all')
      .map((option) => ({
        section: option.key,
        label: option.label,
        items: items.filter((item) => item.section === option.key),
      }))
      .filter((group) => group.items.length > 0);
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

  editorialSignal(): EssentialEditorialSignal {
    return ESSENTIAL_EDITORIAL_SIGNAL;
  }

  collectionUpdatedLabel(): string {
    const updatedAt = this.data.collection.updatedAt;
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(updatedAt);
    if (!match) return '';

    const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
    const formatted = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    }).format(date);
    return `Updated ${formatted}`;
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

  difficultyLabel(item: EssentialResolvedItem): string {
    return item.difficulty === 'easy'
      ? 'Easy'
      : item.difficulty === 'hard'
        ? 'Hard'
        : 'Intermediate';
  }

  descriptionTooltip(item: EssentialResolvedItem): string {
    return item.rationale;
  }

  rowMetaChips(item: EssentialResolvedItem): FaQuestionRowMetaChip[] {
    const techLabel = this.techSummary(item);
    const techAriaLabel = this.techAriaSummary(item);
    const chips: FaQuestionRowMetaChip[] = [
      {
        label: this.tierLabel(item),
        ariaLabel: `Tier: ${this.tierLabel(item)}`,
        tone: 'tier',
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
          author: publicEditorialAuthorSchema(),
          about: schemaEntities,
          mentions: [
            ...schemaEntities,
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

  private collectionDateModified(): string | undefined {
    const updatedAt = this.data.collection.updatedAt;
    if (/^\d{4}-\d{2}-\d{2}$/.test(updatedAt)) {
      return `${updatedAt}T00:00:00.000Z`;
    }
    return undefined;
  }
}
