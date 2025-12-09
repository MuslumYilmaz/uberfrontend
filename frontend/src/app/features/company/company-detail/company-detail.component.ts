// src/app/features/company/company-detail/company-detail.component.ts
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterModule, RouterOutlet } from '@angular/router';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { QuestionService } from '../../../core/services/question.service';
import { FaChipComponent } from '../../../shared/components/chip/fa-chip.component';

@Component({
  standalone: true,
  selector: 'app-company-detail',
  imports: [CommonModule, RouterModule, RouterOutlet, RouterLink, FaChipComponent],
  templateUrl: './company-detail.component.html',
  styleUrls: ['./company-detail.component.scss']
})
export class CompanyDetailComponent {
  slug = this.route.paramMap.pipe(map(pm => (pm.get('slug') || '').toLowerCase()));
  label = this.slug.pipe(map(s => this.pretty(s)));
  counts$ = combineLatest([
    this.slug,
    this.qs.loadAllQuestions('coding'),
    this.qs.loadAllQuestions('trivia'),
    this.qs.loadSystemDesign()
  ]).pipe(
    map(([slug, coding, trivia, system]) => {
      const filterCompany = (q: any) => (q.companies ?? []).includes(slug);

      return {
        all: [...coding, ...trivia, ...system].filter(filterCompany).length,
        coding: coding.filter(filterCompany).length,
        trivia: trivia.filter(filterCompany).length,
        system: system.filter(filterCompany).length
      };
    })
  );

  constructor(private route: ActivatedRoute, private qs: QuestionService) { }

  pretty(slug: string) {
    const map: Record<string, string> = { google: 'Google', amazon: 'Amazon', apple: 'Apple', meta: 'Meta', microsoft: 'Microsoft', uber: 'Uber', airbnb: 'Airbnb', netflix: 'Netflix' };
    return map[slug] ?? slug.replace(/-/g, ' ').replace(/\b\w/g, m => m.toUpperCase());
  }
}
