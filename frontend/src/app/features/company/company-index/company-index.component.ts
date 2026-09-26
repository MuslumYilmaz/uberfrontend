// src/app/features/company/company-index/company-index.component.ts
import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CompanyCard, CompanyIndexResolved } from '../../../core/models/company-public.model';
import { SeoService } from '../../../core/services/seo.service';
import { COMPANY_PRACTICE_DISCLAIMER } from '../../../core/content/public-editorial-facts';
import { CompanyLogoMarkComponent } from '../../../shared/components/company-logo-mark/company-logo-mark.component';
import { PrepSignalGridComponent, PrepSignalItem } from '../../../shared/components/prep-signal-grid/prep-signal-grid.component';

type CompanyHubLink = { label: string; route: string[]; path: string };

const COMPANY_INDEX_TITLE = 'Company Frontend Interview Questions';
const COMPANY_INDEX_DESCRIPTION =
  'Practice company-style frontend coding, concept, and system design questions. Explore editorial prep sets, not verified employer question banks.';

@Component({
  standalone: true,
  selector: 'app-company-index',
  imports: [CommonModule, RouterModule, PrepSignalGridComponent, CompanyLogoMarkComponent],
  templateUrl: './company-index.component.html',
  styleUrls: ['./company-index.component.css']
})
export class CompanyIndexComponent implements OnInit {
  readonly companyPracticeDisclaimer = COMPANY_PRACTICE_DISCLAIMER;
  companies: CompanyCard[] = [];
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
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
    { text: 'Question Library', route: ['/coding'] },
    { text: 'Focus Areas', route: ['/focus-areas'] },
    { text: 'Study Plans', route: ['/tracks'] },
    { text: 'Company Prep', route: ['/companies'] },
  ];

  baselineInterviewHubLinks: CompanyHubLink[] = [
    { label: 'JavaScript interview questions', route: ['/javascript/interview-questions'], path: '/javascript/interview-questions' },
    { label: 'React interview questions', route: ['/react/interview-questions'], path: '/react/interview-questions' },
    { label: 'Angular interview questions', route: ['/angular/interview-questions'], path: '/angular/interview-questions' },
    { label: 'Vue.js interview questions', route: ['/vue/interview-questions'], path: '/vue/interview-questions' },
    { label: 'HTML interview questions', route: ['/html/interview-questions'], path: '/html/interview-questions' },
    { label: 'CSS interview questions', route: ['/css/interview-questions'], path: '/css/interview-questions' },
    { label: 'HTML and CSS interview questions', route: ['/html-css/interview-questions'], path: '/html-css/interview-questions' },
    { label: 'Frontend machine coding questions', route: ['/machine-coding'], path: '/machine-coding' },
    { label: 'Frontend system design interview questions', route: ['/system-design'], path: '/system-design' },
  ];

  promptCountLabel(count: number): string {
    return `${count} editorial practice ${count === 1 ? 'prompt' : 'prompts'}`;
  }

  ngOnInit() {
    this.route.data.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((data) => {
      const resolved = data['companyIndex'] as CompanyIndexResolved | undefined;
      this.companies = resolved?.companies ?? [];
      this.publishSeo(this.companies);
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
      disambiguatingDescription: COMPANY_PRACTICE_DISCLAIMER,
      inLanguage: 'en',
      about: [
        { '@type': 'Thing', name: 'Company frontend interview questions' },
        { '@type': 'Thing', name: 'Frontend interview preparation' },
      ],
      mentions: [
        { '@type': 'WebPage', name: 'Question Library', url: this.seo.buildCanonicalUrl('/coding') },
        { '@type': 'WebPage', name: 'Study Plans', url: this.seo.buildCanonicalUrl('/tracks') },
        { '@type': 'WebPage', name: 'Framework Prep Guide', url: this.seo.buildCanonicalUrl('/guides/framework-prep') },
        ...this.baselineInterviewHubLinks.map((link) => ({
          '@type': 'WebPage',
          name: link.label,
          url: this.seo.buildCanonicalUrl(link.path),
        })),
      ],
    };

    if (companies.length) {
      collectionPage['mainEntity'] = {
        '@type': 'ItemList',
        description: COMPANY_PRACTICE_DISCLAIMER,
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
