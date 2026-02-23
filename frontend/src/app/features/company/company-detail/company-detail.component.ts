// src/app/features/company/company-detail/company-detail.component.ts
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterModule, RouterOutlet } from '@angular/router';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { QuestionService } from '../../../core/services/question.service';
import { FaChipComponent } from '../../../shared/components/chip/fa-chip.component';
import { collectCompanyCounts, CompanyCountBucket } from '../../../shared/company-counts.util';

@Component({
  standalone: true,
  selector: 'app-company-detail',
  imports: [CommonModule, RouterModule, RouterOutlet, RouterLink, FaChipComponent],
  templateUrl: './company-detail.component.html',
  styleUrls: ['./company-detail.component.css']
})
export class CompanyDetailComponent {
  slug = this.route.paramMap.pipe(map(pm => (pm.get('slug') || '').toLowerCase()));
  label = this.slug.pipe(map(s => this.pretty(s)));
  counts$ = combineLatest([
    this.slug,
    this.qs.loadAllQuestionSummaries('coding', { transferState: false }),
    this.qs.loadAllQuestionSummaries('trivia', { transferState: false }),
    this.qs.loadSystemDesign({ transferState: false })
  ]).pipe(
    map(([slug, coding, trivia, system]) => {
      const counts = collectCompanyCounts({ coding, trivia, system });
      const bucket: CompanyCountBucket = counts[slug] ?? { all: 0, coding: 0, trivia: 0, system: 0 };
      return bucket;
    })
  );

  constructor(private route: ActivatedRoute, private qs: QuestionService) { }

  pretty(slug: string) {
    const map: Record<string, string> = { google: 'Google', amazon: 'Amazon', apple: 'Apple', meta: 'Meta', microsoft: 'Microsoft', uber: 'Uber', airbnb: 'Airbnb', netflix: 'Netflix' };
    return map[slug] ?? slug.replace(/-/g, ' ').replace(/\b\w/g, m => m.toUpperCase());
  }
}
