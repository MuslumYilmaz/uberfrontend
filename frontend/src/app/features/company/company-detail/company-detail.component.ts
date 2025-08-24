// src/app/features/company/company-detail/company-detail.component.ts
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterModule, RouterOutlet } from '@angular/router';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { QuestionService } from '../../../core/services/question.service';

@Component({
  standalone: true,
  selector: 'app-company-detail',
  imports: [CommonModule, RouterModule, RouterOutlet, RouterLink],
  templateUrl: './company-detail.component.html',
  styleUrls: ['./company-detail.component.scss']
})
export class CompanyDetailComponent {
  slug = this.route.paramMap.pipe(map(pm => (pm.get('slug') || '').toLowerCase()));
  label = this.slug.pipe(map(s => this.pretty(s)));
  counts$ = combineLatest([
    this.slug,
    this.qs.loadAllQuestions('coding'),
    this.qs.loadAllQuestions('trivia')
  ]).pipe(
    map(([slug, coding, trivia]: any[]) => {
      const all = [...coding, ...trivia].filter(q => (q.companies ?? []).includes(slug)).length;
      const c = coding.filter((q: any) => (q.companies ?? []).includes(slug)).length;
      const t = trivia.filter((q: any) => (q.companies ?? []).includes(slug)).length;
      return { all, coding: c, trivia: t };
    })
  );

  constructor(private route: ActivatedRoute, private qs: QuestionService) { }

  pretty(slug: string) {
    const map: Record<string, string> = { google: 'Google', amazon: 'Amazon', apple: 'Apple', meta: 'Meta', microsoft: 'Microsoft', uber: 'Uber', airbnb: 'Airbnb', netflix: 'Netflix' };
    return map[slug] ?? slug.replace(/-/g, ' ').replace(/\b\w/g, m => m.toUpperCase());
  }
}
