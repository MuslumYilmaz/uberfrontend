// src/app/features/company/company-index/company-index.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { QuestionService } from '../../../core/services/question.service';
import { SeoService } from '../../../core/services/seo.service';
import { collectCompanyCounts } from '../../../shared/company-counts.util';
import { CompanyLogoMarkComponent } from '../../../shared/components/company-logo-mark/company-logo-mark.component';
import { PrepSignalGridComponent, PrepSignalItem } from '../../../shared/components/prep-signal-grid/prep-signal-grid.component';

type CompanyCard = { slug: string; label: string; count: number };

// Always show these, even if data lacks explicit "companies" tags.
const SEED: ReadonlyArray<Pick<CompanyCard, 'slug' | 'label'>> = [
  { slug: 'google', label: 'Google' },
  { slug: 'amazon', label: 'Amazon' },
  { slug: 'apple', label: 'Apple' },
  { slug: 'meta', label: 'Meta' },
  { slug: 'microsoft', label: 'Microsoft' },
  { slug: 'uber', label: 'Uber' },
  { slug: 'airbnb', label: 'Airbnb' },
  { slug: 'netflix', label: 'Netflix' },
];

const COMPANY_INDEX_TITLE = 'Company Frontend Interview Sets';
const COMPANY_INDEX_DESCRIPTION =
  'Use company-specific frontend interview sets after your baseline prep is stable, then compare prompt style and round emphasis before final interviews.';

@Component({
  standalone: true,
  selector: 'app-company-index',
  imports: [CommonModule, RouterModule, ProgressSpinnerModule, PrepSignalGridComponent, CompanyLogoMarkComponent],
  templateUrl: './company-index.component.html',
  styleUrls: ['./company-index.component.css']
})
export class CompanyIndexComponent implements OnInit {
  companies: CompanyCard[] = [];
  loading = true;
  private qs = inject(QuestionService);
  private seo = inject(SeoService);

  companyPrepOutcomes: PrepSignalItem[] = [
    'Compare interview style differences after your baseline prep is stable.',
    'Use Company Prep to rehearse the final week, not to discover fundamentals.',
  ];

  companyPrepMistakes: PrepSignalItem[] = [
    'Starting with Company Prep before identifying your weak topics.',
    'Treating company prompts as a full prep system instead of a targeting layer.',
  ];

  companyPrepSequence: PrepSignalItem[] = [
    { text: 'Question Library', route: ['/coding'], queryParams: { reset: 1 } },
    { text: 'Focus Areas', route: ['/focus-areas'] },
    { text: 'Study Plans', route: ['/tracks'] },
    { text: 'Company Prep', route: ['/companies'] },
  ];

  ngOnInit() {
    this.loading = true;
    forkJoin([
      this.qs.loadAllQuestionSummaries('coding', { transferState: false }),
      this.qs.loadAllQuestionSummaries('trivia', { transferState: false }),
      this.qs.loadSystemDesign({ transferState: false })
    ])
      .pipe(
        map(([coding, trivia, system]) => {
          const counts = collectCompanyCounts({ coding, trivia, system });

          // Start with the seed list so the page isn’t empty
          const list: CompanyCard[] = SEED.map(s => ({
            ...s,
            count: counts[s.slug]?.all ?? 0
          })).filter(c => c.count > 0);

          // Add any extra slugs found in data that aren’t in the seed
          Object.entries(counts).forEach(([slug, bucket]) => {
            if (bucket.all <= 0) return;
            if (!SEED.find(s => s.slug === slug)) {
              list.push({
                slug,
                label: slug.replace(/-/g, ' ').replace(/\b\w/g, m => m.toUpperCase()),
                count: bucket.all
              });
            }
          });

          // Sort nicely
          return list.sort((a, b) => a.label.localeCompare(b.label));
        })
      )
      .subscribe(list => {
        this.companies = list;
        this.loading = false;
        this.publishSeo(list);
      });
  }

  private publishSeo(companies: CompanyCard[]): void {
    const canonicalPath = '/companies';
    const canonicalUrl = this.seo.buildCanonicalUrl(canonicalPath);
    const collectionPage: Record<string, any> = {
      '@type': 'CollectionPage',
      '@id': canonicalUrl,
      url: canonicalUrl,
      name: COMPANY_INDEX_TITLE,
      description: COMPANY_INDEX_DESCRIPTION,
      inLanguage: 'en',
      about: [
        { '@type': 'Thing', name: 'Company frontend interview sets' },
        { '@type': 'Thing', name: 'Frontend interview preparation' },
      ],
      mentions: [
        { '@type': 'WebPage', name: 'Question Library', url: this.seo.buildCanonicalUrl('/coding') },
        { '@type': 'WebPage', name: 'Study Plans', url: this.seo.buildCanonicalUrl('/tracks') },
        { '@type': 'WebPage', name: 'Framework Prep Guide', url: this.seo.buildCanonicalUrl('/guides/framework-prep') },
      ],
    };

    if (companies.length) {
      collectionPage['mainEntity'] = {
        '@type': 'ItemList',
        itemListElement: companies.slice(0, 24).map((company, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: company.label,
          url: this.seo.buildCanonicalUrl(`/companies/${company.slug}/preview`),
        })),
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
          name: COMPANY_INDEX_TITLE,
          item: canonicalUrl,
        },
      ],
    };

    this.seo.updateTags({
      title: COMPANY_INDEX_TITLE,
      description: COMPANY_INDEX_DESCRIPTION,
      canonical: canonicalPath,
      jsonLd: [collectionPage, breadcrumb],
    });
  }
}
