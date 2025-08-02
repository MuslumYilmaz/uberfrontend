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
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map, startWith, switchMap, tap } from 'rxjs/operators';
import { Difficulty, Question } from '../../../core/models/question.model';
import { QuestionService } from '../../../core/services/question.service';

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
  // filter subjects
  public search$ = new BehaviorSubject<string>('');
  public diffs$ = new BehaviorSubject<Difficulty[]>([]);
  public maxImp$ = new BehaviorSubject<number>(5);
  sliderValue = 5;

  tech!: string;

  // raw questions stream
  public rawQuestions$ = this.route.parent!.paramMap.pipe(
    map(p => p.get('tech') ?? 'javascript'),
    tap(t => (this.tech = t)),
    switchMap(t => this.qs.loadQuestions(t, 'coding')),
    startWith<Question[]>([])
  );

  // filtered questions
  filtered$ = combineLatest([
    this.rawQuestions$,
    this.search$,
    this.diffs$,
    this.maxImp$
  ]).pipe(
    map(([questions, term, diffs, maxImp]) =>
      questions
        .filter(q =>
          q.title.toLowerCase().includes(term.toLowerCase()) &&
          (diffs.length === 0 || diffs.includes(q.difficulty)) &&
          q.importance <= maxImp
        )
        .sort((a, b) => {
          // optional: sort by importance desc then title
          if (a.importance !== b.importance) return b.importance - a.importance;
          return a.title.localeCompare(b.title);
        })
    )
  );

  difficultyOptions = [
    { label: 'Beginner', value: 'beginner' as Difficulty },
    { label: 'Intermediate', value: 'intermediate' as Difficulty },
    { label: 'Advanced', value: 'advanced' as Difficulty }
  ];

  constructor(
    public route: ActivatedRoute,
    public qs: QuestionService
  ) { }
}
