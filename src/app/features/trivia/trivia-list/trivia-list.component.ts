import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { SliderModule } from 'primeng/slider';
import { CardModule } from 'primeng/card';
import { ChipModule } from 'primeng/chip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';

import { ActivatedRoute } from '@angular/router';
import { QuestionService } from '../../../core/services/question.service';
import { Question, Difficulty } from '../../../core/models/question.model';

import { BehaviorSubject, combineLatest } from 'rxjs';
import { map, switchMap, tap, startWith } from 'rxjs/operators';

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
  styleUrls: ['./trivia-list.component.scss']
})
export class TriviaListComponent {
  // --- filter state subjects ---
  search$ = new BehaviorSubject<string>('');
  diffs$ = new BehaviorSubject<Difficulty[]>([]);
  sliderValue = 5;
  maxImp$ = new BehaviorSubject<number>(5);

  // --- load raw questions when :tech changes ---
  rawQuestions$ = this.route.parent!.paramMap.pipe(
    map(pm => pm.get('tech') ?? 'javascript'),
    tap(t => (this.tech = t)),
    switchMap(t => this.questionService.loadQuestions(t, 'trivia')),
    startWith<Question[]>([])
  );

  // --- combine filters + rawQuestions into final list ---
  filtered$ = combineLatest([
    this.rawQuestions$,
    this.search$,
    this.diffs$,
    this.maxImp$
  ]).pipe(
    map(([qs, term, diffs, maxImp]) =>
      qs.filter(q =>
        q.title.toLowerCase().includes(term.toLowerCase()) &&
        (diffs.length === 0 || diffs.includes(q.difficulty)) &&
        q.importance <= maxImp
      )
    )
  );

  // Exposed for template
  tech!: string;
  difficultyOptions = [
    { label: 'Beginner',     value: 'beginner'     as Difficulty },
    { label: 'Intermediate', value: 'intermediate' as Difficulty },
    { label: 'Advanced',     value: 'advanced'     as Difficulty }
  ];

  constructor(
    private route: ActivatedRoute,
    private questionService: QuestionService
  ) {}
}