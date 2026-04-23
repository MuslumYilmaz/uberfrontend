import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { EssentialQuestionsResolved, EssentialResolvedItem, EssentialSection, EssentialTier } from '../../core/models/essential-questions.model';
import { isQuestionLockedForTier } from '../../core/models/question.model';
import { AuthService } from '../../core/services/auth.service';
import { SeoMeta, SeoService } from '../../core/services/seo.service';
import { UserProgressService } from '../../core/services/user-progress.service';
import { FaCardComponent } from '../../shared/ui/card/fa-card.component';
import { FaGlyphComponent } from '../../shared/ui/icon/fa-glyph.component';

type SectionOption = {
  key: EssentialSection | 'all';
  label: string;
};

type TierOption = {
  key: EssentialTier | 'all';
  label: string;
};

@Component({
  standalone: true,
  selector: 'app-essential-questions',
  imports: [CommonModule, RouterModule, FaCardComponent, FaGlyphComponent],
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

  techSummary(item: EssentialResolvedItem): string {
    if (item.isSystemDesign) return 'Frontend';
    if (item.technologies.length === 0) return 'Frontend';
    if (item.technologies.length === 1) return item.variants[0]?.techLabel || 'Frontend';
    return item.variants.map((variant) => variant.techLabel).join(' / ');
  }

  companySummary(item: EssentialResolvedItem): string {
    if (!item.companies.length) return '';
    return item.companies.slice(0, 2).join(', ');
  }

  openLabel(item: EssentialResolvedItem): string {
    return item.isSystemDesign ? 'Open prompt' : 'Open question';
  }

  private updateSeo(): void {
    const seoData = (this.route.snapshot.data['seo'] as SeoMeta | undefined) || {};
    const itemList = {
      '@type': 'ItemList',
      itemListElement: this.data.items.slice(0, 60).map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.title,
        url: this.seo.buildCanonicalUrl(item.path),
      })),
    };

    this.seo.updateTags({
      ...seoData,
      canonical: this.seo.buildCanonicalUrl('/interview-questions/essential'),
      jsonLd: [
        {
          '@type': 'CollectionPage',
          '@id': this.seo.buildCanonicalUrl('/interview-questions/essential'),
          url: this.seo.buildCanonicalUrl('/interview-questions/essential'),
          name: this.data.collection.title,
          description: this.data.collection.description,
          mainEntity: itemList,
        },
        itemList,
      ],
    });
  }
}
