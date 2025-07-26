import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import {
  DomSanitizer,
  SafeResourceUrl,
} from '@angular/platform-browser';
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
  drawerOpen = signal(false);
  tech!: string;
  question = signal<Question | null>(null);
  editorUrl = signal<SafeResourceUrl | null>(null);

  constructor(
    private route: ActivatedRoute,
    private qs: QuestionService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const tech = params.get('tech') || 'javascript';
      const id = params.get('id')!;
      this.tech = tech;

      this.qs.loadQuestions(tech, 'coding').subscribe(all => {
        const q = all.find(x => x.id === id) || null;
        this.question.set(q);

        if (q?.stackblitzEmbedUrl) {
          // build a proper URL object so we never double-up on "?"
          const ext = tech === 'angular' ? 'ts' : 'js';
          const u = new URL(q.stackblitzEmbedUrl);
          // force embed=1, file=index.<ext>
          u.searchParams.set('embed', '1');
          u.searchParams.set('file', `index.${ext}`);
          this.editorUrl.set(
            this.sanitizer.bypassSecurityTrustResourceUrl(u.toString())
          );
        }
      });
    });
  }

  toggleExplanation() {
    this.drawerOpen.update(o => !o);
  }

  openSolution() {
    const url = this.question()?.stackblitzSolutionUrl;
    if (url) window.open(url, '_blank');
  }
}
