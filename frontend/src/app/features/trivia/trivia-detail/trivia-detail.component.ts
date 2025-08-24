import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { Subscription, combineLatest, map, switchMap, tap } from 'rxjs';
import { Question } from '../../../core/models/question.model';
import { QuestionService } from '../../../core/services/question.service';
import { FooterComponent } from '../../../shared/components/footer/footer.component';

type Tech = 'javascript' | 'angular';
type PracticeItem = { tech: Tech; kind: 'trivia' | 'coding'; id: string };
type PracticeSession = { items: PracticeItem[]; index: number } | null;

@Component({
  selector: 'app-trivia-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, CardModule, ButtonModule, FooterComponent],
  templateUrl: './trivia-detail.component.html',
  styleUrls: ['./trivia-detail.component.scss'],
})
export class TriviaDetailComponent implements OnInit, OnDestroy {
  tech!: Tech;

  questionsList: Question[] = [];
  question = signal<Question | null>(null);
  showAnswer = signal(false);

  private sub?: Subscription;

  // practice session (passed from the list page)
  private practice: PracticeSession = null;
  returnTo: any[] | null = null;
  private returnLabel = signal<string | null>(null);

  // footer helpers
  readonly progressText = computed(() =>
    this.practice ? `${this.practice.index + 1} / ${this.practice.items.length}` : '—'
  );
  hasPrev() { return !!this.practice && this.practice.index > 0; }
  hasNext() { return !!this.practice && this.practice.index + 1 < this.practice.items.length; }

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private qs: QuestionService
  ) { }

  ngOnInit() {
    this.hydrateState();

    this.sub = combineLatest([this.route.parent!.paramMap, this.route.paramMap])
      .pipe(
        map(([parentPm, childPm]) => ({
          tech: (parentPm.get('tech')! as Tech),
          id: childPm.get('id')!,
        })),
        tap(({ tech }) => (this.tech = tech)),
        switchMap(({ tech, id }) =>
          this.qs.loadQuestions(tech, 'trivia').pipe(
            tap((all) => {
              this.questionsList = all;
              this.selectQuestion(id);
              // keep the practice index in sync with the URL
              this.syncPracticeIndexById(id);
            })
          )
        )
      )
      .subscribe();
  }

  ngOnDestroy() { this.sub?.unsubscribe(); }

  private hydrateState() {
    const s = (this.router.getCurrentNavigation()?.extras?.state ?? history.state) as any;
    this.practice = (s?.session ?? null) as PracticeSession;
    this.returnTo = s?.returnTo ?? null;
    this.returnLabel.set(s?.returnLabel ?? null);
  }

  private ensurePracticeBuilt(currentId: string) {
    if (!this.practice) {
      const items: PracticeItem[] = this.questionsList.map(q => ({
        tech: this.tech, kind: 'trivia', id: q.id
      }));
      const index = Math.max(0, items.findIndex(i => i.id === currentId));
      this.practice = { items, index };
    }
  }

  private syncPracticeIndexById(id: string) {
    this.ensurePracticeBuilt(id);
    if (!this.practice) return;
    const i = this.practice.items.findIndex(it => it.id === id);
    if (i >= 0) this.practice = { ...this.practice, index: i };
  }

  private navToPracticeIndex(newIndex: number) {
    if (!this.practice) return;
    const it = this.practice.items[newIndex];
    this.router.navigate(['/', it.tech, it.kind, it.id], {
      state: {
        session: { items: this.practice.items, index: newIndex },
        returnTo: this.returnTo ?? undefined,
        returnLabel: this.returnLabel() ?? undefined
      }
    });
  }

  private selectQuestion(id: string) {
    const found = this.questionsList.find((q) => q.id === id) ?? null;
    this.question.set(found);
    this.showAnswer.set(false);
  }

  toggleAnswer() { this.showAnswer.update((v) => !v); }
  isActive(q: Question) { return this.question()?.id === q.id; }

  onSelect(q: Question) {
    // keep the session when switching via the sidebar
    this.ensurePracticeBuilt(q.id);
    this.router.navigate(['/', this.tech, 'trivia', q.id], {
      state: {
        session: this.practice!,
        returnTo: this.returnTo ?? undefined,
        returnLabel: this.returnLabel() ?? undefined
      }
    });
  }

  // footer actions
  prev() { if (this.hasPrev()) this.navToPracticeIndex(this.practice!.index - 1); }
  next() { if (this.hasNext()) this.navToPracticeIndex(this.practice!.index + 1); }
}
