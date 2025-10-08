import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import 'prismjs/plugins/line-numbers/prism-line-numbers.css';
import 'prismjs/plugins/line-numbers/prism-line-numbers.js';
import { Subscription, combineLatest, map, switchMap, tap } from 'rxjs';
import { PrismHighlightDirective } from '../../../core/directives/prism-highlight.directive';
import { Question } from '../../../core/models/question.model';
import { Tech } from '../../../core/models/user.model';
import { QuestionService } from '../../../core/services/question.service';
import { FooterComponent } from '../../../shared/components/footer/footer.component';

/** ============== Rich Answer Format ============== */
type BlockText = { type: 'text'; text: string };
type BlockCode = { type: 'code'; language?: string; code: string };
type BlockImage = {
  type: 'image';
  src: string;
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
  priority?: boolean;
};
type AnswerBlock = BlockText | BlockCode | BlockImage;
type RichAnswer = { blocks: AnswerBlock[] } | null | undefined;

type PracticeItem = { tech: Tech; kind: 'trivia' | 'coding'; id: string };
type PracticeSession = { items: PracticeItem[]; index: number } | null;

@Component({
  selector: 'app-trivia-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CardModule,
    ButtonModule,
    FooterComponent,
    PrismHighlightDirective,
  ],
  templateUrl: './trivia-detail.component.html',
  styleUrls: ['./trivia-detail.component.scss'],
})
export class TriviaDetailComponent implements OnInit, OnDestroy {
  tech!: Tech;

  questionsList: Question[] = [];
  question = signal<Question | null>(null);
  copiedIndex = signal<number | null>(null);

  private sub?: Subscription;

  // practice session
  private practice: PracticeSession = null;
  returnTo: any[] | null = null;
  private returnLabel = signal<string | null>(null);

  // footer helpers
  readonly progressText = computed(() =>
    this.practice ? `${this.practice.index + 1} / ${this.practice.items.length}` : '—'
  );
  hasPrev() { return !!this.practice && this.practice.index > 0; }
  hasNext() { return !!this.practice && this.practice.index + 1 < this.practice.items.length; }

  /** ============== Derived UI helpers ============== */
  answerIsRich = computed<boolean>(() => {
    const q = this.question();
    const a: any = q?.answer;
    return !!(a && typeof a === 'object' && Array.isArray(a.blocks));
  });

  answerBlocks = computed<AnswerBlock[]>(() => {
    const q = this.question();
    const a = q?.answer as RichAnswer;
    if (a && a.blocks) return a.blocks;
    return [];
  });

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private qs: QuestionService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit() {
    this.hydrateState();

    this.sub = combineLatest([this.route.parent!.paramMap, this.route.paramMap])
      .pipe(
        map(([parentPm, childPm]) => ({
          tech: parentPm.get('tech')! as Tech,
          id: childPm.get('id')!,
        })),
        tap(({ tech }) => (this.tech = tech)),
        switchMap(({ tech, id }) =>
          this.qs.loadQuestions(tech, 'trivia').pipe(
            tap((all) => {
              this.questionsList = all;
              this.selectQuestion(id);
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
  }

  isActive(q: Question) { return this.question()?.id === q.id; }

  onSelect(q: Question) {
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

  // ======= label helpers used by the template =======
  importanceLabel(n?: number): 'Low' | 'Medium' | 'High' {
    if (typeof n !== 'number') return 'Low';
    if (n >= 4) return 'High';
    if (n === 3) return 'Medium';
    return 'Low';
  }

  difficultyLabel(d?: string): 'Easy' | 'Intermediate' | 'Hard' {
    switch ((d || '').toLowerCase()) {
      case 'easy': return 'Easy';
      case 'intermediate': return 'Intermediate';
      case 'hard': return 'Hard';
      default: return 'Easy';
    }
  }

  /** ============== UI: interactions ============== */
  copy(code: string, idx: number) {
    navigator.clipboard.writeText(code ?? '').catch(() => { });
    this.copiedIndex.set(idx);

    // announce (off-screen, fixed live region)
    const el = document.getElementById('sr-announcer');
    if (el) el.textContent = 'Copied to clipboard';

    setTimeout(() => this.copiedIndex.set(null), 1200);
  }

  descText(desc: unknown): string {
    if (typeof desc === 'string') return desc;
    const obj = desc as any;
    if (obj && typeof obj.text === 'string') return obj.text;
    return '';
  }

  dedent(source: string = ''): string {
    const s = (source ?? '').replace(/^\n+|\n+$/g, '');
    const lines = s.split('\n');
    const indents = lines
      .filter(l => l.trim().length)
      .map(l => (l.match(/^[ \t]*/)?.[0].length ?? 0));
    const pad = indents.length ? Math.min(...indents) : 0;
    return lines.map(l => l.slice(pad)).join('\n');
  }

  // very small markdown-to-HTML for bold, inline code, lists, quotes, headings
  md(src: unknown): SafeHtml {
    const s = typeof src === 'string' ? src : (src && (src as any).toString ? (src as any).toString() : '');
    const escaped = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    let html = escaped.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html
      .replace(/^###\s?(.*)$/gm, '<h4 class="md-h md-h4">$1</h4>')
      .replace(/^##\s?(.*)$/gm, '<h3 class="md-h md-h3">$1</h3>')
      .replace(/^#\s?(.*)$/gm, '<h2 class="md-h md-h2">$1</h2>');
    html = html.replace(/^(?:-|\*)\s+(.*)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)(\s*(<li>.*<\/li>))+/gms, (m: string) => `<ul class="md-ul">${m}</ul>`);
    html = html.replace(/^\d+\.\s+(.*)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)(\s*(<li>.*<\/li>))+/gms, (m: string) => `<ol class="md-ol">${m}</ol>`);
    html = html.replace(/^\>\s?(.*)$/gm, '<blockquote class="md-quote">$1</blockquote>');
    html = html
      .split(/\n{2,}/)
      .map((chunk: string) => (/^\s*<(h\d|ul|ol|li|blockquote)/.test(chunk) ? chunk : `<p>${chunk.replace(/\n/g, '<br/>')}</p>`))
      .join('');

    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
