/* ========================= trivia-detail.component.ts ========================= */
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
import { Question, isQuestionLockedForTier } from '../../../core/models/question.model';
import { Tech } from '../../../core/models/user.model';
import { QuestionService } from '../../../core/services/question.service';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { SeoService } from '../../../core/services/seo.service';
import { UserProgressService } from '../../../core/services/user-progress.service';
import { AuthService } from '../../../core/services/auth.service';
import { DialogModule } from 'primeng/dialog';
import { LoginRequiredDialogComponent } from '../../../shared/components/login-required-dialog/login-required-dialog.component';

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
type BlockList = {
  type: 'list';
  columns: string[];
  rows: string[][];
  caption?: string;
};

type AnswerBlock = BlockText | BlockCode | BlockImage | BlockList;
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
    DialogModule,
    LoginRequiredDialogComponent,
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
  solved = signal(false);
  loginPromptOpen = false;

  private sub?: Subscription;

  // practice session
  private practice: PracticeSession = null;
  returnTo: any[] | null = null;
  private returnToUrl: string | null = null;
  private returnLabel = signal<string | null>(null);
  locked = computed(() => {
    const q = this.question();
    const tier = this.auth.user()?.accessTier ?? 'free';
    return q ? isQuestionLockedForTier(q, tier) : false;
  });

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

  /** Does a block look like the “Still so complicated?” one? */
  private isExtraHelpBlock(b: AnswerBlock): b is BlockText {
    return (b as any)?.type === 'text'
      && typeof (b as any).text === 'string'
      && /still\s+so\s+complicated\?/i.test((b as any).text);
  }

  /** Does a block look like the “Summary” one? */
  private isSummaryBlock(b: AnswerBlock): b is BlockText {
    return (b as any)?.type === 'text'
      && typeof (b as any).text === 'string'
      && /<strong>\s*summary\s*<\/strong>|^#{1,6}\s*summary/i.test((b as any).text);
  }

  /** Strip heading/icon from a help/summary text so only body remains */
  private stripLeadHeading(s: string): string {
    return s.replace(
      /^\s*(?:<i[^>]*>\s*<\/i>\s*)?(?:<strong>.*?<\/strong>|#{1,6}\s.*)\s*(?:\n|<br\s*\/?>)+/i,
      ''
    );
  }


  /** The “Still so complicated?” HTML (or null) */
  extraHelp = computed<SafeHtml | null>(() => {
    if (!this.answerIsRich()) return null;
    const q = this.question();
    const blocks = (q?.answer as RichAnswer)?.blocks ?? [];
    const hit = blocks.find(b => this.isExtraHelpBlock(b)) as BlockText | undefined;
    if (!hit) return null;
    const bodyOnly = this.stripLeadHeading(hit.text || '');
    return this.md(bodyOnly);
  });

  /** The “Summary” HTML (or null) */
  summaryHelp = computed<SafeHtml | null>(() => {
    if (!this.answerIsRich()) return null;
    const q = this.question();
    const blocks = (q?.answer as RichAnswer)?.blocks ?? [];
    const hit = blocks.find(b => this.isSummaryBlock(b)) as BlockText | undefined;
    if (!hit) return null;
    const bodyOnly = this.stripLeadHeading(hit.text || '');
    return this.md(bodyOnly);
  });

  /** Blocks for the main Answer card (exclude summary and extra-help) */
  answerBlocks = computed<AnswerBlock[]>(() => {
    const q = this.question();
    const a = q?.answer as RichAnswer;
    if (!a?.blocks) return [];
    return a.blocks.filter(b => !this.isExtraHelpBlock(b) && !this.isSummaryBlock(b));
  });

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private qs: QuestionService,
    private sanitizer: DomSanitizer,
    private seo: SeoService,
    private progress: UserProgressService,
    public auth: AuthService
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
    this.returnToUrl = typeof s?.returnToUrl === 'string' ? s.returnToUrl : null;
    this.returnLabel.set(s?.returnLabel ?? null);
  }

  backToReturn() {
    if (this.returnTo) {
      this.router.navigate(this.returnTo);
    } else if (this.returnToUrl) {
      this.router.navigateByUrl(this.returnToUrl);
    } else if (window.history.length > 1) {
      window.history.back();
    } else {
      this.router.navigate(['/coding']);
    }
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
        returnToUrl: this.returnToUrl ?? undefined,
        returnLabel: this.returnLabel() ?? undefined
      }
    });
  }

  private selectQuestion(id: string) {
    const found = this.questionsList.find((q) => q.id === id) ?? null;
    this.question.set(found);
    this.solved.set(found ? this.progress.isSolved(found.id) : false);
    this.updateSeo(found);
  }

  isActive(q: Question) { return this.question()?.id === q.id; }

  private questionDescription(q: Question): string {
    const raw = this.descText(q.description || '');
    const plain = raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (plain) return plain;
    return `Front-end trivia question for ${this.tech}.`;
  }

  private questionKeywords(q: Question): string[] {
    const tags = Array.isArray(q.tags) ? q.tags : [];
    const companies: string[] = (q as any).companies ?? (q as any).companyTags ?? [];
    const base = ['front end trivia', `${this.tech} interview trivia`];

    return Array.from(
      new Set([...base, ...tags, ...companies].map(k => String(k || '').trim()).filter(Boolean))
    );
  }

  private updateSeo(q: Question | null): void {
    if (!q) {
      this.seo.updateTags({
        title: 'Front-end trivia question',
        description: 'Quick front-end trivia with concise explanations.',
      });
      return;
    }

    this.seo.updateTags({
      title: q.title,
      description: this.questionDescription(q),
      keywords: this.questionKeywords(q),
    });
  }

  onSelect(q: Question) {
    this.ensurePracticeBuilt(q.id);
    this.router.navigate(['/', this.tech, 'trivia', q.id], {
      state: {
        session: this.practice!,
        returnTo: this.returnTo ?? undefined,
        returnToUrl: this.returnToUrl ?? undefined,
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
  async markComplete() {
    const q = this.question();
    if (!q) return;
    if (!this.auth.isLoggedIn()) {
      this.loginPromptOpen = true;
      return;
    }
    const wasSolved = this.solved();
    if (wasSolved) {
      await this.progress.unmarkSolved(q.id);
      this.solved.set(false);
    } else {
      await this.progress.markSolved(q.id);
      this.solved.set(true);
    }
  }

  submitLabel(): string {
    return this.solved() ? 'Mark as incomplete' : 'Mark as complete';
  }

  goToLogin() {
    this.loginPromptOpen = false;
    this.router.navigate(['/auth/login']);
  }

  goToPricing() {
    this.router.navigate(['/pricing']);
  }

  copy(code: string, idx: number) {
    navigator.clipboard.writeText(code ?? '').catch(() => { });
    this.copiedIndex.set(idx);

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

  // ================== Markdown -> HTML with a tiny HTML whitelist ==================
  // 2) Full, corrected md()
  md(src: unknown): SafeHtml {
    const raw = typeof src === 'string'
      ? src
      : (src && (src as any).toString ? (src as any).toString() : '');

    // Normalize CRLF
    let text = raw.replace(/\r\n?/g, '\n');

    // Ensure list/heading/quote starters begin a new paragraph
    text = text.replace(
      /([^\n])\n(?=([ \t]{0,3}(?:\d+\.\s|[-*]\s|#{1,3}\s|>\s)))/g,
      '$1\n\n'
    );

    // -------- 1) Extract fenced code blocks into placeholders --------
    const blocks: string[] = [];
    text = text.replace(/```(\w+)?\n([\s\S]*?)\n```/g, (_m: any, lang: string | undefined, body: string) => {
      const esc = body
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      const langClass = lang ? ` class="language-${lang}"` : '';
      const html = `<pre class="md-pre"><code${langClass}>${esc}</code></pre>`;
      const token = `__FENCE_BLOCK_${blocks.length}__`;
      blocks.push(html);
      return `\n${token}\n`;
    });

    // -------- 2) Escape everything else --------
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // -------- 3) Font Awesome <i class="..."></i> — handle first --------
    html = html.replace(
      /&lt;i\s+class=(?:"|')([^"'&]+)(?:"|')\s*&gt;(?:&lt;\/i&gt;|<\/i>)/g,
      (_m: any, cls: string) => {
        const classes = cls.split(/\s+/).filter(Boolean);
        const isAllowed = classes.every(c =>
          /^(fa|fa-solid|fa-regular|fa-brands)$/i.test(c) || /^fa-[a-z0-9-]+$/i.test(c)
        );
        return isAllowed ? `<i class="${classes.join(' ')}"></i>` : '';
      }
    );

    // -------- 4) Unescape a tiny whitelist of real tags (NO <i> here) --------
    html = html.replace(
      /&lt;(\/?)(strong|em|code|ul|li|ol|br|b|table|thead|tbody|tr|th|td|blockquote|h[1-6])&gt;/g,
      '<$1$2>'
    );

    // -------- 4b) Any remaining escaped tag *names* => show as literal code --------
    // (Happens in prose like: "Here, &lt;b&gt; is only used…")
    html = html.replace(
      /&lt;\/?(?:strong|b|em|i|u|small|mark|del|code|br|span|div|p|h[1-6])&gt;/g,
      (m: string) => `<code>${m}</code>`
    );

    // Inline backticks + **bold**
    html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Allow <pre class="md-pre">…</pre> explicitly present in JSON
    html = html.replace(
      /&lt;pre\s+class=(?:"|')md-pre(?:"|')&gt;([\s\S]*?)&lt;\/pre&gt;/g,
      (_m: any, inner: string) => `<pre class="md-pre">${inner}</pre>`
    );

    // Headings
    html = html
      .replace(/^###\s?(.*)$/gm, '<h4 class="md-h md-h4">$1</h4>')
      .replace(/^##\s?(.*)$/gm, '<h3 class="md-h md-h3">$1</h3>')
      .replace(/^#\s?(.*)$/gm, '<h2 class="md-h md-h2">$1</h2>');

    // Ordered lists
    html = html.replace(/^[ \t]{0,3}\d+\.\s+(.+)$/gm, '<li>$1</li>');
    html = html.replace(/(?:\s*<li>.*?<\/li>)+/gms, (m: string) => `<ol class="md-ol">${m}</ol>`);

    // Unordered lists
    html = html.replace(/^[ \t]{0,3}[-*]\s+(.+)$/gm, '<li>$1</li>');
    html = html.replace(/(?:\s*<li>.*?<\/li>)+/gms, (m: string) => `<ul class="md-ul">${m}</ul>`);

    // Blockquotes (already whitelisted above too)
    html = html.replace(/^\>\s?(.*)$/gm, '<blockquote class="md-quote">$1</blockquote>');

    // -------- 5) Restore fenced code blocks --------
    blocks.forEach((blockHtml, i) => {
      const token = new RegExp(`__FENCE_BLOCK_${i}__`, 'g');
      html = html.replace(token, blockHtml);
    });

    // -------- 6) Paragraph splitting --------
    html = html
      .split(/\n{2,}/)
      .map((chunk: string) =>
        /^\s*<(h\d|ul|ol|li|blockquote|pre)/.test(chunk)
          ? chunk
          : `<p>${chunk.replace(/\n/g, '<br/>')}</p>`
      )
      .join('');

    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

}
