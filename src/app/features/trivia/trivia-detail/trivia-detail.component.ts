import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  OnDestroy,
  signal,
} from '@angular/core';
import {
  ActivatedRoute,
  RouterModule,
} from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { Question } from '../../../core/models/question.model';
import { QuestionService } from '../../../core/services/question.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-trivia-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CardModule,
    ButtonModule,
  ],
  templateUrl: './trivia-detail.component.html',
  styleUrls: ['./trivia-detail.component.scss'],
})
export class TriviaDetailComponent implements OnInit, OnDestroy {
  tech!: string;

  // full list of questions for this tech/trivia
  questionsList: Question[] = [];

  // currently selected question
  question = signal<Question | null>(null);

  // drawer open state for answer
  showAnswer = signal(false);

  private sub!: Subscription;

  constructor(
    private route: ActivatedRoute,
    private qs: QuestionService
  ) {}

  ngOnInit() {
    this.sub = this.route.paramMap.subscribe((params) => {
      this.tech = params.get('tech') || 'javascript';
      const id = params.get('id')!;

      // load all trivia questions for this tech
      this.qs.loadQuestions(this.tech, 'trivia').subscribe((all) => {
        this.questionsList = all;
        this.selectQuestion(id);
      });
    });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  /** pick out and signal the current question by id */
  private selectQuestion(id: string) {
    const found = this.questionsList.find((q) => q.id === id) ?? null;
    this.question.set(found);
    this.showAnswer.set(false);
  }

  toggleAnswer() {
    this.showAnswer.update((v) => !v);
  }
}