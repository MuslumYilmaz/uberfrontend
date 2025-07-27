import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { Question } from '../../../core/models/question.model';
import { QuestionService } from '../../../core/services/question.service';

@Component({
  selector: 'app-trivia-detail',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule],
  templateUrl: './trivia-detail.component.html',
  styleUrls: ['./trivia-detail.component.scss']
})
export class TriviaDetailComponent implements OnInit {
  tech!: string;
  question = signal<Question | null>(null);
  showAnswer = signal(false);

  constructor(
    private route: ActivatedRoute,
    private qs: QuestionService
  ) { }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const tech = params.get('tech') || 'javascript';
      const id = params.get('id')!;
      this.tech = tech;

      this.qs.loadQuestions(tech, 'trivia')
        .subscribe(all => {
          const q = all.find(q => q.id === id) ?? null;
          this.question.set(q);
        });
    });
  }

  toggleAnswer() {
    this.showAnswer.update(v => !v);
  }
}