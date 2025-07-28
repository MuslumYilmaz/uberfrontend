// src/app/features/coding/coding-detail.component.ts
import { CommonModule }                from '@angular/common';
import { Component, OnInit, signal }   from '@angular/core';
import { ActivatedRoute }              from '@angular/router';
import { ButtonModule }                from 'primeng/button';
import { Question }                    from '../../../core/models/question.model';
import { QuestionService }             from '../../../core/services/question.service';
import { MonacoEditorComponent } from '../../../monaco-editor.component';

@Component({
  selector: 'app-coding-detail',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    MonacoEditorComponent
  ],
  templateUrl: './coding-detail.component.html',
  styleUrls: ['./coding-detail.component.scss']
})
export class CodingDetailComponent implements OnInit {
  drawerOpen     = signal(false);
  isSolutionView = signal(false);

  tech!: string;
  question       = signal<Question|null>(null);
  editorContent  = signal<string>('');

  constructor(
    private route: ActivatedRoute,
    private qs: QuestionService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.tech = params.get('tech') ?? 'javascript';
      const id = params.get('id')!;
      this.qs.loadQuestions(this.tech, 'coding').subscribe(all => {
        const q = all.find(x => x.id === id) ?? null;
        this.question.set(q);
        // show starter code by default
        this.editorContent.set(q?.starterCode ?? '');
      });
    });
  }

  toggleExplanation() {
    this.drawerOpen.update(v => !v);
  }

  toggleSolution() {
    this.isSolutionView.update(v => !v);
    const q = this.question();
    this.editorContent.set(
      this.isSolutionView() ? q?.solution ?? '' : q?.starterCode ?? ''
    );
  }
}