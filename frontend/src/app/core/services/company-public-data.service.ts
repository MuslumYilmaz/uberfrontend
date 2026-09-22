import { isPlatformServer } from '@angular/common';
import { Injectable, PLATFORM_ID, TransferState, inject, makeStateKey } from '@angular/core';
import { Observable, defer, forkJoin, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { companyBrandFor } from '../../shared/company-branding';
import { collectCompanyCounts } from '../../shared/company-counts.util';
import { CompanyIndexResolved, CompanyPreviewQuestion, CompanyPreviewResolved } from '../models/company-public.model';
import { SystemDesignListItem } from '../models/system-design.model';
import { MixedQuestionListItem, QuestionService } from './question.service';

type CompanyCatalog = {
  coding: MixedQuestionListItem[];
  trivia: MixedQuestionListItem[];
  system: SystemDesignListItem[];
};
type CompanyQuestion = MixedQuestionListItem | SystemDesignListItem;

const EDITORIAL_COMPANIES = new Set(['google', 'openai', 'netflix']);
const emptyCounts = () => ({ all: 0, coding: 0, trivia: 0, system: 0 });

@Injectable({ providedIn: 'root' })
export class CompanyPublicDataService {
  private readonly questions = inject(QuestionService);
  private readonly transferState = inject(TransferState);
  private readonly isServer = isPlatformServer(inject(PLATFORM_ID));

  loadIndex(): Observable<CompanyIndexResolved> {
    return this.resolveWithTransferState('company-public:index', { companies: [] }, () =>
      this.loadCatalog().pipe(map((catalog) => ({
        companies: Object.entries(collectCompanyCounts(catalog))
          .filter(([, counts]) => counts.all > 0)
          .map(([slug, counts]) => ({
            slug,
            label: companyBrandFor(slug)?.label ?? slug,
            count: counts.all,
          }))
          .sort((a, b) => a.label.localeCompare(b.label)),
      }))),
    );
  }

  loadPreview(rawSlug: string): Observable<CompanyPreviewResolved> {
    const slug = rawSlug.trim().toLowerCase();
    const fallback: CompanyPreviewResolved = {
      slug,
      mode: EDITORIAL_COMPANIES.has(slug) ? 'editorial' : 'catalog',
      counts: emptyCounts(),
      samples: [],
    };
    // Authored guides are already complete public pages and need no question bank.
    if (fallback.mode === 'editorial' || !slug) return of(fallback);

    return this.resolveWithTransferState(`company-public:preview:${slug}`, fallback, () =>
      this.loadCatalog().pipe(map((catalog) => ({
        ...fallback,
        counts: collectCompanyCounts(catalog)[slug] ?? emptyCounts(),
        samples: this.buildSamples(slug, catalog),
      }))),
    );
  }

  private loadCatalog(): Observable<CompanyCatalog> {
    return forkJoin({
      coding: this.questions.loadAllQuestionSummaries('coding', { transferState: false }),
      trivia: this.questions.loadAllQuestionSummaries('trivia', { transferState: false }),
      system: this.questions.loadSystemDesign({ transferState: false }),
    });
  }

  private resolveWithTransferState<T>(name: string, fallback: T, load: () => Observable<T>): Observable<T> {
    const key = makeStateKey<T>(name);
    if (!this.isServer && this.transferState.hasKey(key)) {
      const resolved = this.transferState.get(key, fallback);
      this.transferState.remove(key);
      return of(resolved);
    }

    return defer(load).pipe(
      catchError(() => of(fallback)),
      // Transfer only cards/counts/sample metadata, never the full catalog or answers.
      tap((resolved) => {
        if (this.isServer) this.transferState.set(key, resolved);
      }),
    );
  }

  private buildSamples(slug: string, { coding, trivia, system }: CompanyCatalog): CompanyPreviewQuestion[] {
    const matches = (question: CompanyQuestion) => (question.companies ?? [])
      .some((company) => String(company).trim().toLowerCase() === slug);
    const primary = [
      ...coding.filter(matches).slice(0, 3).map((question) => this.toSample(question, 'coding')),
      ...trivia.filter(matches).slice(0, 3).map((question) => this.toSample(question, 'trivia')),
      ...system.filter(matches).slice(0, 2).map((question) => this.toSample(question, 'system-design')),
    ];
    const extras = [...coding, ...trivia, ...system].filter(matches).slice(0, 8)
      .map((question) => this.toSample(question, question.type));
    const samples: CompanyPreviewQuestion[] = [];
    const seen = new Set<string>();
    for (const sample of [...primary, ...extras]) {
      const key = `${sample.kind}:${sample.tech || 'none'}:${sample.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      samples.push(sample);
      if (samples.length === 8) break;
    }
    return samples;
  }

  private toSample(question: CompanyQuestion, kind: CompanyPreviewQuestion['kind']): CompanyPreviewQuestion {
    const id = String(question.id || '');
    return {
      id,
      title: String(question.title || companyBrandFor(id)?.label || id || 'question'),
      kind,
      ...('tech' in question ? { tech: question.tech } : {}),
      difficulty: question.difficulty === 'easy' || question.difficulty === 'hard'
        ? question.difficulty : 'intermediate',
      access: question.access === 'free' ? 'free' : 'premium',
    };
  }
}
