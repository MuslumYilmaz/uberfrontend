import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, WritableSignal, computed, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AccordionModule } from 'primeng/accordion';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { Question } from '../../../core/models/question.model';
import { QuestionService } from '../../../core/services/question.service';
import { MonacoEditorComponent } from '../../../monaco-editor.component';

type Block =
  | { type: 'text'; text: string }
  | { type: 'code'; language?: string; code: string; height?: number }
  | { type: 'image'; src: string; alt?: string; caption?: string; width?: number };

type RadioSection = {
  key: string;
  title: string;
  content?: string;
  blocks?: Block[];
};

type SDQuestion = Question & {
  radio?: RadioSection[];
  reflect?: string;
  assumptions?: string;
  diagram?: string;
  interface?: string;
  operations?: string;
};

@Component({
  selector: 'app-system-design-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, AccordionModule, ButtonModule, ChipModule, MonacoEditorComponent],
  templateUrl: './system-design-detail.component.html',
  styleUrls: ['./system-design-detail.component.css']
})
export class SystemDesignDetailComponent implements OnInit, OnDestroy {
  q: WritableSignal<SDQuestion | null> = signal(null);
  all: SDQuestion[] = [];
  idx = 0;

  // left pane width
  leftRatio = signal(0.35);

  // accordion state (multiple open)
  activeIndexes = signal<number[]>([0]);

  // quick computed helpers
  title = computed(() => this.q()?.title ?? '');
  description = computed(() => this.q()?.description ?? '');
  tags = computed(() => this.q()?.tags ?? []);

  // resolve RADIO sections from question structure
  sections = computed<Required<RadioSection>[]>(() => {
    const item = this.q();
    if (!item) return [];

    const normalize = (s: RadioSection): Required<RadioSection> => ({
      key: s.key,
      title: s.title,
      content: s.content ?? '',
      blocks: s.blocks && s.blocks.length
        ? s.blocks
        : s.content
          ? [{ type: 'text', text: s.content }]
          : []
    });

    if (item.radio?.length) return item.radio.map(normalize);

    // fallback from individual string fields (if you ever use them)
    const out: RadioSection[] = [];
    if (item.reflect) out.push({ key: 'R', title: 'Reflect & Requirements', content: item.reflect });
    if (item.assumptions) out.push({ key: 'A', title: 'Assumptions & Constraints', content: item.assumptions });
    if (item.diagram) out.push({ key: 'D', title: 'Diagram / Architecture', content: item.diagram });
    if (item.interface) out.push({ key: 'I', title: 'Interfaces & APIs', content: item.interface });
    if (item.operations) out.push({ key: 'O', title: 'Operations & Trade-offs', content: item.operations });
    return out.map(normalize);
  });

  // tiny helper so we can write short paths in JSON
  asset(path: string) {
    if (!path) return '';
    return path.startsWith('http') ? path : `assets/${path.replace(/^\/+/, '')}`;
  }


  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private qs: QuestionService
  ) { }

  ngOnInit(): void {
    // load all SD questions once, then select by id
    this.qs.loadQuestions('system-design', 'system-design').subscribe((list) => {
      this.all = list as SDQuestion[];
      const id = this.route.snapshot.paramMap.get('id')!;
      this.setCurrentById(id);
    });

    // respond to id changes (when navigating next/prev within the same component)
    this.route.paramMap.subscribe(pm => {
      const id = pm.get('id');
      if (id) this.setCurrentById(id);
    });
  }

  ngOnDestroy(): void { }

  private setCurrentById(id: string) {
    const pos = this.all.findIndex(x => x.id === id);
    if (pos >= 0) {
      this.idx = pos;
      this.q.set(this.all[pos]);
      this.activeIndexes.set([0]); // reset accordion to first section
      // responsive tweak: narrower left pane on small screens
      this.leftRatio.set(window.innerWidth < 1024 ? 1 : 0.35);
    }
  }

  onActiveIndexChange(evt: number | number[]) {        // ← OK to accept union
    this.activeIndexes.set(Array.isArray(evt) ? evt : [evt]);
  }
  expandAll() {                                        // ← new
    this.activeIndexes.set(this.sections().map((_, i) => i));
  }

  collapseAll() {                                      // ← new
    this.activeIndexes.set([]);
  }

  prev() {
    if (this.idx > 0) {
      const prevId = this.all[this.idx - 1].id;
      this.router.navigate(['/system-design', prevId]);
    }
  }

  next() {
    if (this.idx + 1 < this.all.length) {
      const nextId = this.all[this.idx + 1].id;
      this.router.navigate(['/system-design', nextId]);
    }
  }
}
