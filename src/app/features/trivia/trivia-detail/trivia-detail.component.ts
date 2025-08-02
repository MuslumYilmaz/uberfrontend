import { CommonModule } from '@angular/common';
import {
  Component,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import {
  ActivatedRoute,
  RouterModule,
} from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { Subscription } from 'rxjs';
import { Question } from '../../../core/models/question.model';
import { QuestionService } from '../../../core/services/question.service';

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

  questionsList: Question[] = [];
  question = signal<Question | null>(null);
  showAnswer = signal(false);

  private sub!: Subscription;

  constructor(
    private route: ActivatedRoute,
    private qs: QuestionService
  ) { }

  ngOnInit() {
    this.sub = this.route.paramMap.subscribe((params) => {
      this.tech = params.get('tech') || 'javascript';
      const id = params.get('id')!;

      this.qs.loadQuestions(this.tech, 'trivia').subscribe((all) => {
        this.questionsList = all;
        this.selectQuestion(id);
      });
    });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  private selectQuestion(id: string) {
    const found = this.questionsList.find((q) => q.id === id) ?? null;
    this.question.set(found);
    this.showAnswer.set(false);
  }

  toggleAnswer() {
    this.showAnswer.update(v => !v);
  }

  // convenience to determine if a question is currently active
  isActive(q: Question) {
    return this.question()?.id === q.id;
  }

  // navigate by clicking row
  onSelect(q: Question) {
    // assuming router outlet path structure: /{tech}/trivia/{id}
    window.history.pushState(null, '', `/${this.tech}/trivia/${q.id}`);
    this.selectQuestion(q.id);
  }
}
