// src/app/features/company/company-index/company-index.component.ts
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { forkJoin } from 'rxjs';
import { count, map } from 'rxjs/operators';
import { QuestionService } from '../../../core/services/question.service';

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

// Normalize -> canonical company slugs (handles aliases in data)
const ALIASES: Record<string, string> = {
  facebook: 'meta',
  alphabet: 'google', // just in case
};

function slugifyCompany(raw: string): string | null {
  if (!raw) return null;
  const s = raw.toString().trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  if (!s) return null;
  return ALIASES[s] ?? s;
}

// Extract company slugs from many possible fields in a question object
function companiesOf(q: any): string[] {
  const out = new Set<string>();

  // 1) canonical array field
  if (Array.isArray(q?.companies)) {
    q.companies.forEach((c: any) => {
      const s = slugifyCompany(c);
      if (s) out.add(s);
    });
  }

  // 2) single field variations
  ['company', 'askedAtCompany', 'employer', 'org'] // common names
    .forEach(k => {
      const s = slugifyCompany(q?.[k]);
      if (s) out.add(s);
    });

  // 3) tags may contain company names
  if (Array.isArray(q?.tags)) {
    q.tags.forEach((t: any) => {
      const s = slugifyCompany(t);
      if (s && SEED.some(seed => seed.slug === s)) out.add(s);
    });
  }

  return [...out];
}

@Component({
  standalone: true,
  selector: 'app-company-index',
  imports: [CommonModule, RouterModule, ProgressSpinnerModule],
  templateUrl: './company-index.component.html',
  styleUrls: ['./company-index.component.css']
})
export class CompanyIndexComponent {
  companies: CompanyCard[] = [];
  loading = true;
  private qs = inject(QuestionService);

  ngOnInit() {
    this.loading = true;
    forkJoin([
      this.qs.loadAllQuestions('coding'),
      this.qs.loadAllQuestions('trivia')
    ])
      .pipe(
        map(([coding, trivia]) => {
          // Build counts from whatever hints the questions provide.
          const counts = new Map<string, number>();
          [...coding, ...trivia].forEach((q: any) => {
            companiesOf(q).forEach(slug => {
              counts.set(slug, (counts.get(slug) || 0) + 1);
            });
          });

          // Start with the seed list so the page isn’t empty
          const list: CompanyCard[] = SEED.map(s => ({
            ...s,
            count: counts.get(s.slug) ?? 0
          })).filter(c => c.count > 0);

          // Add any extra slugs found in data that aren’t in the seed
          counts.forEach((count, slug) => {
            if (count <= 0) return;
            if (!SEED.find(s => s.slug === slug)) {
              list.push({
                slug,
                label: slug.replace(/-/g, ' ').replace(/\b\w/g, m => m.toUpperCase()),
                count
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
