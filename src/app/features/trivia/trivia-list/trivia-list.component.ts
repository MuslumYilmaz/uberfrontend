import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterModule } from '@angular/router';
import { map, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { Question } from '../../../core/models/question.model';
import { QuestionService } from '../../../core/services/question.service';

@Component({
  selector: 'app-trivia-list',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink],
  templateUrl: './trivia-list.component.html',
  styleUrls: ['./trivia-list.component.scss']
})
export class TriviaListComponent implements OnInit {
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
      switchMap(tech => this.questionService.loadQuestions(tech, 'trivia')),
      takeUntil(this.destroy$)
    )
      .subscribe(qs => (this.questions = qs));
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

}
