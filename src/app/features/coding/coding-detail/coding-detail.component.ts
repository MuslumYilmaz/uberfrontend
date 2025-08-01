import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  signal,
  ViewChild
} from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AccordionModule } from 'primeng/accordion';
import { ButtonModule } from 'primeng/button';
import type { Question } from '../../../core/models/question.model';
import { QuestionService } from '../../../core/services/question.service';
import { MonacoEditorComponent } from '../../../monaco-editor.component';
import { ConsoleLoggerComponent } from '../console-logger/console-logger.component';

@Component({
  selector: 'app-coding-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AccordionModule,
    ButtonModule,
    MonacoEditorComponent,
    ConsoleLoggerComponent,
  ],
  templateUrl: './coding-detail.component.html',
  styleUrls: ['./coding-detail.component.scss'],
})
export class CodingDetailComponent implements OnInit {
  tech!: string;
  question = signal<Question | null>(null);
  editorContent = signal<string>('');
  activePanel = signal<number>(0);

  allQuestions: Question[] = [];
  currentIndex = 0;

  @ViewChild(ConsoleLoggerComponent) consoleLogger!: ConsoleLoggerComponent;

  constructor(
    private route: ActivatedRoute,
    private qs: QuestionService
  ) { }

  ngOnInit() {
    this.route.paramMap.subscribe((pm) => {
      this.tech = pm.get('tech')! || 'javascript';
      this.qs.loadQuestions(this.tech, 'coding').subscribe((list) => {
        this.allQuestions = list;
        const id = pm.get('id')!;
        this.loadQuestion(id);
      });
    });
  }

  private loadQuestion(id: string) {
    const idx = this.allQuestions.findIndex((q) => q.id === id);
    if (idx < 0) return;
    this.currentIndex = idx;
    const q = this.allQuestions[idx];
    this.question.set(q);
    this.editorContent.set(q.starterCode ?? '');
    this.activePanel.set(0);
  }

  showSolution() {
    const q = this.question();
    if (!q) return;
    this.editorContent.set(q.solution ?? '');
    this.activePanel.set(1);
  }

  showProblem() {
    const q = this.question();
    if (!q) return;
    this.editorContent.set(q.starterCode ?? '');
    this.activePanel.set(0);
  }

  prev() {
    if (this.currentIndex > 0) {
      const prevId = this.allQuestions[this.currentIndex - 1].id;
      location.pathname = `/${this.tech}/coding/${prevId}`;
    }
  }

  next() {
    if (this.currentIndex + 1 < this.allQuestions.length) {
      const nextId = this.allQuestions[this.currentIndex + 1].id;
      location.pathname = `/${this.tech}/coding/${nextId}`;
    }
  }

  runCode() {
    const code = this.editorContent();
    if (!this.consoleLogger || !this.consoleLogger.ready()) {
      console.warn('Console sandbox not ready yet');
      return;
    }

    // Ensure user-defined functions are invoked if they expect output manually.
    // We don't auto-call anything; it's up to their code (like hello();)
    const wrapped = `
      (async () => {
        try {
          ${code}
        } catch (e) {
          console.error('User code thrown:', e);
        }
      })();
    `;
    this.consoleLogger.runCode(wrapped);
  }

  submitCode() {
    console.log('Submit:', this.editorContent());
    // placeholder submission logic
  }

  get progressText() {
    return `${this.currentIndex + 1} / ${this.allQuestions.length}`;
  }
}