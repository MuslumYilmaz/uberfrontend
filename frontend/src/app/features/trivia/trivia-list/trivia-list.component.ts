import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ChipModule } from 'primeng/chip';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SliderModule } from 'primeng/slider';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map, shareReplay, startWith, switchMap, tap } from 'rxjs/operators';

import { Difficulty, Question } from '../../../core/models/question.model';
import { QuestionService } from '../../../core/services/question.service';

@Component({
  selector: 'app-trivia-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    InputTextModule,
    MultiSelectModule,
    SliderModule,
    CardModule,
    ChipModule,
    ProgressSpinnerModule,
    ButtonModule,
    FormsModule
  ],
  templateUrl: './trivia-list.component.html',
  styleUrls: ['./trivia-list.component.css']
})
export class TriviaListComponent {
  // filter state
  search$ = new BehaviorSubject<string>('');
  diffs$ = new BehaviorSubject<Difficulty[]>([]);
  sliderValue = 5;
  maxImp$ = new BehaviorSubject<number>(5);

  tech!: string;

  // raw questions stream
  rawQuestions$ = this.route.parent!.paramMap.pipe(
    map(pm => pm.get('tech') ?? 'javascript'),
    tap(t => (this.tech = t)),
    switchMap(t => this.questionService.loadQuestions(t, 'trivia').pipe(
      startWith<Question[] | null>(null),
    )),
    shareReplay(1),
  );

  filtered$ = combineLatest([
    this.rawQuestions$,
    this.search$,
    this.diffs$,
    this.maxImp$
  ]).pipe(
    map(([qs, term, diffs, maxImp]) =>
      (qs ?? [])
        .filter(q =>
          q.title.toLowerCase().includes(term.toLowerCase()) &&
          (diffs.length === 0 || diffs.includes(q.difficulty)) &&
          q.importance <= maxImp
        )
        .sort((a, b) => {
          if (a.importance !== b.importance) return b.importance - a.importance;
          return a.title.localeCompare(b.title);
        })
    )
  );

  difficultyOptions = [
    { label: 'Beginner', value: 'easy' as Difficulty },
    { label: 'Intermediate', value: 'intermediate' as Difficulty },
    { label: 'Advanced', value: 'hard' as Difficulty }
  ];

  constructor(
    private route: ActivatedRoute,
    private questionService: QuestionService,
    private router: Router
  ) { }

  descriptionText(q: Question): string {
    const desc: any = (q as any).description;
    if (typeof desc === 'object' && desc !== null) {
      return (desc.text || '').toString();
    }
    return q.description || '';
  }

  navigateTo(q: Question) {
    this.router.navigate([q.id], { relativeTo: this.route });
  }
}
