// src/app/features/company/company-detail/company-detail.component.ts
import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink, RouterModule, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { QuestionService } from '../../../core/services/question.service';
import { COMPANY_PRACTICE_DISCLAIMER } from '../../../core/content/public-editorial-facts';
import { companyBrandFor } from '../../../shared/company-branding';
import { FaChipComponent } from '../../../shared/components/chip/fa-chip.component';
import { collectCompanyCounts, CompanyCountBucket, emptyCompanyCounts } from '../../../shared/company-counts.util';

@Component({
    selector: 'app-company-detail',
    imports: [CommonModule, RouterModule, RouterOutlet, RouterLink, FaChipComponent],
    templateUrl: './company-detail.component.html',
    styleUrls: ['./company-detail.component.css']
})
export class CompanyDetailComponent {
  readonly companyPracticeDisclaimer = COMPANY_PRACTICE_DISCLAIMER;
  slug = this.route.paramMap.pipe(map(pm => (pm.get('slug') || '').toLowerCase()));
  label = this.slug.pipe(map(s => this.pretty(s)));
  counts$ = combineLatest([
    this.slug,
    this.qs.loadAllQuestionSummaries('coding', { transferState: false }),
    this.qs.loadAllQuestionSummaries('trivia', { transferState: false }),
    this.qs.loadSystemDesign({ transferState: false }),
    this.qs.loadAllDebugSummaries({ transferState: false }),
  ]).pipe(
    map(([slug, coding, trivia, system, debug]) => {
      const counts = collectCompanyCounts({ coding, trivia, system, debug });
      const bucket: CompanyCountBucket = counts[slug] ?? emptyCompanyCounts();
      return bucket;
    })
  );

  private readonly auth = inject(AuthService);
  private readonly currentSlug = toSignal(this.slug, { initialValue: '' });
  /** The member's plan covers this company, so the page offers the way back to it. */
  readonly planCovers = computed(() => {
    const slug = this.currentSlug();
    return Boolean(slug && this.auth.user()?.companyPlan?.companies.some((company) => company.slug === slug));
  });

  constructor(private route: ActivatedRoute, private qs: QuestionService) { }

  promptCountLabel(count: number | null | undefined): string {
    const value = Number.isFinite(count) ? Number(count) : 0;
    return `${value} editorial practice ${value === 1 ? 'prompt' : 'prompts'}`;
  }

  pretty(slug: string) {
    return companyBrandFor(slug)?.label ?? slug;
  }
}
