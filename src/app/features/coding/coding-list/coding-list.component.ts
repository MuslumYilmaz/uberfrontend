import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { SliderModule } from 'primeng/slider';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map, switchMap, tap, startWith } from 'rxjs/operators';
import { Difficulty, Question } from '../../../core/models/question.model';
import { QuestionService } from '../../../core/services/question.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-coding-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CardModule,
    ButtonModule,
    ChipModule,
    FormsModule,
    InputTextModule,
    MultiSelectModule,
    SliderModule,
    ProgressSpinnerModule
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
      questions.filter(q =>
        q.title.toLowerCase().includes(term.toLowerCase()) &&
        (diffs.length === 0 || diffs.includes(q.difficulty)) &&
        q.importance <= maxImp
      )
    )
  );

  tech!: string;
  difficultyOptions = [
    { label: 'Beginner', value: 'beginner' },
    { label: 'Intermediate', value: 'intermediate' },
    { label: 'Advanced', value: 'advanced' }
  ];

  constructor(
    public route: ActivatedRoute,
    public qs: QuestionService
  ) {}
}
