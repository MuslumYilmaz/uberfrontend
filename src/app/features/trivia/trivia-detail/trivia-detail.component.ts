import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { Subscription, combineLatest, map, switchMap, tap } from 'rxjs';
import { Question } from '../../../core/models/question.model';
import { QuestionService } from '../../../core/services/question.service';

@Component({
  selector: 'app-trivia-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, CardModule, ButtonModule],
  templateUrl: './trivia-detail.component.html',
  styleUrls: ['./trivia-detail.component.scss'],
})
export class TriviaDetailComponent implements OnInit, OnDestroy {
  tech!: string;

  questionsList: Question[] = [];
  question = signal<Question | null>(null);
  showAnswer = signal(false);

  private sub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private qs: QuestionService
  ) { }

  ngOnInit() {
    // tech is on the parent (/:tech), id is on the child (/trivia/:id)
    this.sub = combineLatest([
      this.route.parent!.paramMap,
      this.route.paramMap
    ])
      .pipe(
        map(([parentPm, childPm]) => ({
          tech: parentPm.get('tech')!,        // e.g. 'angular'
          id: childPm.get('id')!               // current question id
        })),
        tap(({ tech }) => (this.tech = tech)),
        switchMap(({ tech, id }) =>
          this.qs.loadQuestions(tech, 'trivia').pipe(
            tap((all) => {
              this.questionsList = all;
              this.selectQuestion(id);
            })
          )
        )
      )
      .subscribe();
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  private selectQuestion(id: string) {
    const found = this.questionsList.find((q) => q.id === id) ?? null;
    this.question.set(found);
    this.showAnswer.set(false);
  }

  toggleAnswer() {
    this.showAnswer.update((v) => !v);
  }

  isActive(q: Question) {
    return this.question()?.id === q.id;
  }

  onSelect(q: Question) {
    // Navigate properly so Angular updates the route + params
    this.router.navigate(['/', this.tech, 'trivia', q.id]);
  }
}
