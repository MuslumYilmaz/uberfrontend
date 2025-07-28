import { Component, OnInit, signal }     from '@angular/core';
import { CommonModule }                   from '@angular/common';
import { ActivatedRoute, RouterModule }   from '@angular/router';
import { ButtonModule }                   from 'primeng/button';
import { AccordionModule }                from 'primeng/accordion';
import { QuestionService }                from '../../../core/services/question.service';
import type { Question }                  from '../../../core/models/question.model';
import { MonacoEditorComponent } from '../../../monaco-editor.component';

@Component({
  selector: 'app-coding-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AccordionModule,
    ButtonModule,
    MonacoEditorComponent
  ],
  templateUrl: './coding-detail.component.html',
  styleUrls: ['./coding-detail.component.scss']
})
export class CodingDetailComponent implements OnInit {
  tech!: string;
  question      = signal<Question|null>(null);
  editorContent = signal<string>('');
  // control which panel is open: 0 = description, 1 = explanation, 2 = tests
  activePanel   = signal<number>(0);

  allQuestions: Question[] = [];
  currentIndex = 0;

  constructor(
    private route: ActivatedRoute,
    private qs: QuestionService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(pm => {
      this.tech = pm.get('tech')! || 'javascript';
      this.qs.loadQuestions(this.tech, 'coding')
        .subscribe(list => {
          this.allQuestions = list;
          const id = pm.get('id')!;
          this.loadQuestion(id);
        });
    });
  }

  private loadQuestion(id: string) {
    const idx = this.allQuestions.findIndex(q => q.id === id);
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
    // TODO: wire up your test runner here
    console.log('Run:', this.editorContent());
  }

  submitCode() {
    // TODO: submission logic
    console.log('Submit:', this.editorContent());
  }

  get progressText() {
    return `${this.currentIndex + 1} / ${this.allQuestions.length}`;
  }
}