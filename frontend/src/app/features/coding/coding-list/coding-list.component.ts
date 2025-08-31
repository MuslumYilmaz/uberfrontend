import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SliderModule } from 'primeng/slider';

import { BehaviorSubject, combineLatest, forkJoin } from 'rxjs';
import { map, startWith, switchMap, tap } from 'rxjs/operators';
import { Difficulty, Question } from '../../../core/models/question.model';
import { MixedQuestion, QuestionService } from '../../../core/services/question.service';

type StructuredDescription = { text: string; examples?: string[] };
type ListSource = 'tech' | 'company';
type Kind = 'coding' | 'trivia' | 'debug' | 'all';
type Tech = 'javascript' | 'angular' | 'html' | 'css';

type Row = Question & {
  tech?: Tech;              // attached in company mode or derived from route
  __kind: 'coding' | 'trivia' | 'debug';
  companies?: string[];
};

type PracticeItem = { tech: Tech; kind: 'coding' | 'trivia' | 'debug'; id: string };
type PracticeSession = { items: PracticeItem[]; index: number };

@Component({
  selector: 'app-coding-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    MultiSelectModule,
    SliderModule,
    ProgressSpinnerModule,
    InputTextModule,
    ChipModule,
    FormsModule
  ],
  templateUrl: './coding-list.component.html',
  styleUrls: ['./coding-list.component.scss']
})
export class CodingListComponent {
  // ----- filter UI state -----
  searchTerm = '';
  sliderValue = 5;

  search$ = new BehaviorSubject<string>('');
  diffs$ = new BehaviorSubject<Difficulty[]>([]);
  maxImp$ = new BehaviorSubject<number>(5);

  // ----- context from routing -----
  tech!: Tech; // used on tech pages
  source: ListSource = 'tech';
  kind: Kind = 'coding';

  // company slug from parent param (:slug) OR ?c=
  companySlug$ = (this.route.parent
    ? combineLatest([
      this.route.parent.paramMap.pipe(map(pm => pm.get('slug') || '')),
      this.route.queryParamMap.pipe(map(qp => qp.get('c') || ''))
    ]).pipe(map(([a, b]) => (b || a).toLowerCase()))
    : this.route.queryParamMap.pipe(map(qp => (qp.get('c') || '').toLowerCase()))
  ).pipe(startWith(''));

  // ---------- base load ----------
  rawQuestions$ = this.route.data.pipe(
    tap(d => {
      this.source = (d['source'] as ListSource) ?? 'tech';
      this.kind = (d['kind'] as Kind) ?? 'coding';
    }),
    switchMap(() => {
      if (this.source === 'tech') {
        // path: /:tech/(coding|trivia|debug|all)
        return this.route.parent!.paramMap.pipe(
          map(pm => (pm.get('tech') ?? 'javascript') as Tech),
          tap(t => (this.tech = t)),
          switchMap(t => {
            if (this.kind === 'all') {
              // Not linked today for /:tech, but safe to support
              return forkJoin([
                this.qs.loadQuestions(t, 'coding')
                  .pipe(map((list: Question[]) => list.map<Row>(q => ({ ...q, __kind: 'coding' })))),
                this.qs.loadQuestions(t, 'trivia')
                  .pipe(map((list: Question[]) => list.map<Row>(q => ({ ...q, __kind: 'trivia' })))),
                this.qs.loadQuestions(t, 'debug')
                  .pipe(map((list: Question[]) => list.map<Row>(q => ({ ...q, __kind: 'debug' }))))
              ]).pipe(map(([a, b, c]) => [...a, ...b, ...c]));
            }
            const k = this.kind as Exclude<Kind, 'all'>;
            return this.qs.loadQuestions(t, k)
              .pipe(map((list: Question[]) => list.map<Row>(q => ({ ...q, __kind: k }))));
          }),
          startWith<Row[]>([])
        );
      }

      // source === 'company'
      // Company pages intentionally have only coding/trivia/all (no debug)
      if (this.kind === 'all') {
        return forkJoin([
          this.qs.loadAllQuestions('coding')
            .pipe(map((list: MixedQuestion[]) => list.map<Row>(q => ({ ...q, __kind: 'coding', tech: q.tech })))),
          this.qs.loadAllQuestions('trivia')
            .pipe(map((list: MixedQuestion[]) => list.map<Row>(q => ({ ...q, __kind: 'trivia', tech: q.tech }))))
        ]).pipe(map(([a, b]) => [...a, ...b]), startWith<Row[]>([]));
      } else {
        const k: Exclude<Kind, 'all'> = this.kind as Exclude<Kind, 'all'>;
        return this.qs.loadAllQuestions(k as any) // (k will never be 'debug' here)
          .pipe(
            map((list: MixedQuestion[]) => list.map<Row>(q => ({ ...q, __kind: k as any, tech: q.tech }))),
            startWith<Row[]>([])
          );
      }
    })
  );

  // ---------- final filtered list ----------
  filtered$ = combineLatest([
    this.rawQuestions$,
    this.search$,
    this.diffs$,
    this.maxImp$,
    this.companySlug$
  ]).pipe(
    map(([questions, term, diffs, maxImp, companySlug]) => {
      const t = (term || '').toLowerCase();
      return (questions ?? [])
        .filter(q =>
          (q.title?.toLowerCase()?.includes(t) ?? false) &&
          (diffs.length === 0 || diffs.includes(q.difficulty)) &&
          (q.importance ?? 0) <= maxImp &&
          (!companySlug || ((q as any).companies ?? []).includes(companySlug))
        )
        .sort((a, b) => {
          if (a.importance !== b.importance) return (b.importance ?? 0) - (a.importance ?? 0);
          return (a.title || '').localeCompare(b.title || '');
        });
    })
  );

  difficultyOptions = [
    { label: 'Beginner', value: 'easy' as Difficulty },
    { label: 'Intermediate', value: 'intermediate' as Difficulty },
    { label: 'Advanced', value: 'hard' as Difficulty }
  ];

  constructor(public route: ActivatedRoute, public qs: QuestionService) { }

  // ---------- helpers used by template ----------
  descriptionText(q: Question): string {
    const desc: any = (q as any).description;
    if (desc && typeof desc === 'object') return (desc as StructuredDescription).text || '';
    return q.description || '';
  }

  linkTo(q: Row): any[] {
    const tech = (q as any).tech ?? this.tech ?? 'javascript';
    if (q.__kind === 'trivia') return ['/', tech, 'trivia', q.id];
    if (q.__kind === 'debug') return ['/', tech, 'debug', q.id];
    return ['/', tech, 'coding', q.id];
  }

  /** Build router state carrying a practice session (ordered items from the *filtered* list). */
  stateForNav(list: Row[], current: Row, companySlug: string | null) {
    const items: PracticeItem[] = list.map((r) => ({
      tech: (r.tech ?? this.tech ?? 'javascript') as Tech,
      kind: r.__kind,
      id: r.id
    }));
    const index = Math.max(0, list.findIndex(r => r.id === current.id));

    const ret = this.detailStateForCompany(companySlug);
    const session: PracticeSession = { items, index };
    return { ...(ret || {}), session };
  }

  // (unchanged) company return state
  detailStateForCompany(companySlug: string | null): { [k: string]: any } | undefined {
    if (this.source !== 'company') return undefined;
    return {
      returnTo: ['/companies', this.kind === 'all' ? 'all' : this.kind],
      returnLabel: this.companyLabel(companySlug)
    };
  }

  heading(): string {
    const t = this.tech ?? 'javascript';
    const what =
      this.kind === 'coding' ? 'Coding Challenges'
        : this.kind === 'trivia' ? 'Trivia Questions'
          : this.kind === 'debug' ? 'Debug Tasks'
            : 'All Questions';
    return `${this.capitalize(t)} ${what}`;
  }
  private capitalize(s: string | null | undefined) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

  techName(q: Row) {
    const tech = (q.tech ?? 'javascript') as Tech;
    switch (tech) {
      case 'angular': return 'Angular';
      case 'html': return 'HTML';
      case 'css': return 'CSS';
      default: return 'JavaScript';
    }
  }

  companyLabel(slug?: string | null) {
    if (!slug) return 'Companies';
    const map: Record<string, string> = {
      google: 'Google', amazon: 'Amazon', apple: 'Apple', meta: 'Meta',
      microsoft: 'Microsoft', uber: 'Uber', airbnb: 'Airbnb', netflix: 'Netflix',
      faang: 'FAANG'
    };
    return map[slug] ?? slug.replace(/-/g, ' ').replace(/\b\w/g, m => m.toUpperCase());
  }
}