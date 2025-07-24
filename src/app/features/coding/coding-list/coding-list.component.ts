import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterModule } from '@angular/router';
import { map, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { Question } from '../../../core/models/question.model';
import { QuestionService } from '../../../core/services/question.service';

@Component({
  selector: 'app-coding-list',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink],
  templateUrl: './coding-list.component.html',
  styleUrls: ['./coding-list.component.scss']
})
export class CodingListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  questions: Question[] = [];
  tech!: string;

  constructor(
    private route: ActivatedRoute,
    private questionService: QuestionService
  ) { }

  ngOnInit() {
    this.route.paramMap.pipe(
      map(params => params.get('tech') ?? 'javascript'),
      tap(tech => (this.tech = tech)),
      switchMap(tech => this.questionService.loadQuestions(tech, 'coding')),
      takeUntil(this.destroy$)
    )
      .subscribe(qs => (this.questions = qs));
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
