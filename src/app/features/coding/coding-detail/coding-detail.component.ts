import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { Question } from '../../../core/models/question.model';
import { QuestionService } from '../../../core/services/question.service';

@Component({
  selector: 'app-coding-detail',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './coding-detail.component.html',
  styleUrls: ['./coding-detail.component.scss']
})
export class CodingDetailComponent implements OnInit {
  // Drawer open state
  drawerOpen = signal(false);
  // View mode: false=problem, true=solution
  isSolutionView = signal(false);

  tech!: string;
  question = signal<Question | null>(null);

  // URLs for problem and solution
  private problemEditorUrl = signal<SafeResourceUrl | null>(null);
  private solutionEditorUrl = signal<SafeResourceUrl | null>(null);
  editorUrl = signal<SafeResourceUrl | null>(null);

  constructor(
    private route: ActivatedRoute,
    private qs: QuestionService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const tech = params.get('tech') || 'javascript';
      const id   = params.get('id')!;
      this.tech = tech;

      this.qs.loadQuestions(tech, 'coding').subscribe(all => {
        const q = all.find(x => x.id === id) || null;
        this.question.set(q);

        // Build and store problem embed URL
        if (q?.stackblitzEmbedUrl) {
          const ext = tech === 'angular' ? 'ts' : 'js';
          const u = new URL(q.stackblitzEmbedUrl);
          u.searchParams.set('embed', '1');
          u.searchParams.set('file', `index.${ext}`);
          const prob = this.sanitizer.bypassSecurityTrustResourceUrl(u.toString());
          this.problemEditorUrl.set(prob);
          this.editorUrl.set(prob);
        } else {
          this.problemEditorUrl.set(null);
          this.editorUrl.set(null);
        }

        // Build and store solution embed URL
        if (q?.stackblitzSolutionUrl) {
          const ext = tech === 'angular' ? 'ts' : 'js';
          const s = new URL(q.stackblitzSolutionUrl);
          s.searchParams.set('embed', '1');
          s.searchParams.set('file', `index.${ext}`);
          const sol = this.sanitizer.bypassSecurityTrustResourceUrl(s.toString());
          this.solutionEditorUrl.set(sol);
        } else {
          this.solutionEditorUrl.set(null);
        }
      });
    });
  }

  toggleExplanation() {
    this.drawerOpen.update(o => !o);
  }

  toggleSolution() {
    if (this.isSolutionView()) {
      // back to problem
      this.editorUrl.set(this.problemEditorUrl());
    } else {
      // switch to solution
      this.editorUrl.set(this.solutionEditorUrl());
    }
    this.isSolutionView.update(v => !v);
  }
}