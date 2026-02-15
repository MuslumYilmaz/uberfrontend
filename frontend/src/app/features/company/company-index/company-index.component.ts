// src/app/features/company/company-index/company-index.component.ts
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { QuestionService } from '../../../core/services/question.service';
import { collectCompanyCounts } from '../../../shared/company-counts.util';
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


@Component({
  standalone: true,
  selector: 'app-company-index',
  imports: [CommonModule, RouterModule, ProgressSpinnerModule, PrepSignalGridComponent],
  templateUrl: './company-index.component.html',
  styleUrls: ['./company-index.component.css']
})
export class CompanyIndexComponent {
  companies: CompanyCard[] = [];
  loading = true;
  private qs = inject(QuestionService);

  companyPrepOutcomes: PrepSignalItem[] = [
    'Understand interview style differences across companies.',
    'Use framework prep paths before company-specific drills.',
  ];

  companyPrepMistakes: PrepSignalItem[] = [
    'Jumping into company sets without a baseline interview roadmap.',
    'Practicing one question type only and missing full-round readiness.',
  ];

  companyPrepSequence: PrepSignalItem[] = [
    { text: 'Interview blueprint', route: ['/guides/interview-blueprint'] },
    { text: 'Framework path', route: ['/guides/framework-prep'] },
    { text: 'Guided tracks', route: ['/tracks'] },
    { text: 'Company-specific practice', route: ['/companies'] },
  ];

  ngOnInit() {
    this.loading = true;
    forkJoin([
      this.qs.loadAllQuestions('coding'),
      this.qs.loadAllQuestions('trivia'),
      this.qs.loadSystemDesign()
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
      });
  }
}
