import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Observable, combineLatest, of } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { AccessLevel, Difficulty } from '../../../core/models/question.model';
import { Tech } from '../../../core/models/user.model';
import { QuestionService } from '../../../core/services/question.service';
import { SeoService } from '../../../core/services/seo.service';
import { CompanyCountBucket, collectCompanyCounts } from '../../../shared/company-counts.util';

type CompanyPreviewQuestion = {
  id: string;
  title: string;
  kind: 'coding' | 'trivia' | 'system-design';
  tech?: Tech;
  difficulty: Difficulty;
  access: AccessLevel;
};

type CompanyPreviewData = {
  counts: CompanyCountBucket;
  samples: CompanyPreviewQuestion[];
};

@Component({
  standalone: true,
  selector: 'app-company-preview',
  imports: [CommonModule, RouterModule],
  templateUrl: './company-preview.component.html',
  styleUrls: ['./company-preview.component.css'],
})
export class CompanyPreviewComponent implements OnInit {
  slug = '';
  label = '';
  data$: Observable<CompanyPreviewData> = of({
    counts: { all: 0, coding: 0, trivia: 0, system: 0 },
    samples: [],
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private questionService: QuestionService,
    private seo: SeoService,
  ) { }

  ngOnInit(): void {
    this.slug = (this.route.snapshot.paramMap.get('slug') || '').trim().toLowerCase();
    if (!this.slug) {
      this.router.navigateByUrl('/404').catch(() => void 0);
      return;
    }

    this.label = this.prettyCompany(this.slug);
    this.seo.updateTags({
      title: `${this.label} Frontend Interview Preview`,
      description: `Preview ${this.label} interview question coverage, sample prompts, and premium unlocks.`,
      canonical: undefined,
    });

    this.data$ = combineLatest([
      this.questionService.loadAllQuestionSummaries('coding', { transferState: false }),
      this.questionService.loadAllQuestionSummaries('trivia', { transferState: false }),
      this.questionService.loadSystemDesign({ transferState: false }),
    ]).pipe(
      map(([coding, trivia, system]) => {
        const counts = collectCompanyCounts({ coding, trivia, system })[this.slug]
          ?? { all: 0, coding: 0, trivia: 0, system: 0 };
        const samples = this.buildSamples(this.slug, coding, trivia, system);
        return { counts, samples };
      }),
      shareReplay(1),
    );
  }

  freeCount(items: CompanyPreviewQuestion[]): number {
    return items.filter((item) => item.access === 'free').length;
  }

  premiumCount(items: CompanyPreviewQuestion[]): number {
    return items.filter((item) => item.access === 'premium').length;
  }

  displayKind(kind: CompanyPreviewQuestion['kind']): string {
    if (kind === 'system-design') return 'System design';
    return kind === 'coding' ? 'Coding' : 'Trivia';
  }

  private buildSamples(
    slug: string,
    coding: Array<any>,
    trivia: Array<any>,
    system: Array<any>,
  ): CompanyPreviewQuestion[] {
    const codingHits = coding
      .filter((q) => this.hasCompany(q, slug))
      .slice(0, 3)
      .map((q) => this.toPreviewQuestion(q, 'coding'));

    const triviaHits = trivia
      .filter((q) => this.hasCompany(q, slug))
      .slice(0, 3)
      .map((q) => this.toPreviewQuestion(q, 'trivia'));

    const systemHits = system
      .filter((q) => this.hasCompany(q, slug))
      .slice(0, 2)
      .map((q) => this.toPreviewQuestion(q, 'system-design'));

    const merged = [...codingHits, ...triviaHits, ...systemHits];

    if (merged.length >= 8) return merged.slice(0, 8);

    const extras = [...coding, ...trivia, ...system]
      .filter((q) => this.hasCompany(q, slug))
      .map((q) => this.toPreviewQuestion(q, this.detectKind(q)))
      .slice(0, 8);

    const out: CompanyPreviewQuestion[] = [];
    const seen = new Set<string>();
    for (const item of [...merged, ...extras]) {
      const key = `${item.kind}:${item.tech || 'none'}:${item.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(item);
      if (out.length >= 8) break;
    }
    return out;
  }

  private detectKind(q: any): CompanyPreviewQuestion['kind'] {
    if (String(q?.type || '').toLowerCase() === 'system-design') return 'system-design';
    if (String(q?.type || '').toLowerCase() === 'trivia') return 'trivia';
    return 'coding';
  }

  private toPreviewQuestion(q: any, kind: CompanyPreviewQuestion['kind']): CompanyPreviewQuestion {
    return {
      id: String(q?.id || ''),
      title: String(q?.title || this.prettyCompany(String(q?.id || 'question'))),
      kind,
      tech: q?.tech,
      difficulty: this.normalizeDifficulty(q?.difficulty),
      access: this.normalizeAccess(q?.access),
    };
  }

  private normalizeDifficulty(value: unknown): Difficulty {
    const raw = String(value || '').toLowerCase();
    if (raw === 'easy' || raw === 'hard' || raw === 'intermediate') return raw;
    return 'intermediate';
  }

  private normalizeAccess(value: unknown): AccessLevel {
    return String(value || '').toLowerCase() === 'free' ? 'free' : 'premium';
  }

  private hasCompany(q: any, slug: string): boolean {
    if (!Array.isArray(q?.companies)) return false;
    return q.companies.some((company: unknown) => String(company || '').trim().toLowerCase() === slug);
  }

  private prettyCompany(slug: string): string {
    const names: Record<string, string> = {
      google: 'Google',
      amazon: 'Amazon',
      apple: 'Apple',
      meta: 'Meta',
      microsoft: 'Microsoft',
      uber: 'Uber',
      airbnb: 'Airbnb',
      netflix: 'Netflix',
    };
    return names[slug] || slug.replace(/-/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
  }
}
