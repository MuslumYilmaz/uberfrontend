/* ========================= trivia-detail.component.ts ========================= */
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, PLATFORM_ID, ViewChild, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import 'prismjs/plugins/line-numbers/prism-line-numbers.js';
import { Subscription, combineLatest, map, of, switchMap, tap } from 'rxjs';
import { PrismHighlightDirective } from '../../../core/directives/prism-highlight.directive';
import { Question, isQuestionLockedForTier } from '../../../core/models/question.model';
import { Tech } from '../../../core/models/user.model';
import { QuestionDetailResolved } from '../../../core/resolvers/question-detail.resolver';
import { QuestionService } from '../../../core/services/question.service';
import { SEO_SUPPRESS_TOKEN } from '../../../core/services/seo-context';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { SeoService } from '../../../core/services/seo.service';
import { UserProgressService } from '../../../core/services/user-progress.service';
import { AuthService } from '../../../core/services/auth.service';
import { DialogModule } from 'primeng/dialog';
import { LoginRequiredDialogComponent } from '../../../shared/components/login-required-dialog/login-required-dialog.component';
import { SafeHtmlPipe } from '../../../core/pipes/safe-html.pipe';
import tagRegistry from '../../../../assets/questions/tag-registry.json';
import topicRegistry from '../../../../assets/questions/topic-registry.json';

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
type SimilarItem = { question: Question; difficulty: string };
type TagMatcher = { tag: string; re: RegExp };

const TAG_MATCHERS: TagMatcher[] = buildTagMatchers([
  ...(Array.isArray(tagRegistry?.tags) ? tagRegistry.tags : []),
  ...((Array.isArray(topicRegistry?.topics) ? topicRegistry.topics : [])
    .flatMap((topic: any) => Array.isArray(topic?.tags) ? topic.tags : [])),
]);

function buildTagMatchers(rawTags: unknown[]): TagMatcher[] {
  const unique = new Set<string>();
  const matchers: TagMatcher[] = [];

  for (const raw of rawTags) {
    if (typeof raw !== 'string') continue;
    const tag = raw.trim().toLowerCase();
    if (!tag || unique.has(tag)) continue;
    unique.add(tag);
    matchers.push({ tag, re: buildTagRegex(tag) });
  }

  return matchers;
}

function buildTagRegex(tag: string): RegExp {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = escaped.replace(/\\-/g, '[\\s-]+');
  return new RegExp(`\\b${pattern}\\b`);
}

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
    SafeHtmlPipe,
  ],
  templateUrl: './trivia-detail.component.html',
  styleUrls: ['./trivia-detail.component.css'],
})
export class TriviaDetailComponent implements OnInit, OnDestroy {
  @ViewChild('mainScroll') mainScroll?: ElementRef<HTMLElement>;
  tech!: Tech;

  questionsList: Question[] = [];
  question = signal<Question | null>(null);
  copiedIndex = signal<number | null>(null);
  solved = signal(false);
  loadState = signal<'loading' | 'loaded' | 'notFound'>('loading');
  loginPromptOpen = false;
  similarOpen = signal(true);

  private sub?: Subscription;
  private readonly suppressSeo = inject(SEO_SUPPRESS_TOKEN);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private dataLoaded = false;

  // practice session
  private practice: PracticeSession = null;
  returnTo: any[] | null = null;
  private returnToUrl: string | null = null;
  private returnLabel = signal<string | null>(null);
  locked = computed(() => {
    const q = this.question();
    const user = this.auth.user();
    return q ? isQuestionLockedForTier(q, user) : false;
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
  extraHelp = computed<string | null>(() => {
    if (!this.answerIsRich()) return null;
    const q = this.question();
    const blocks = (q?.answer as RichAnswer)?.blocks ?? [];
    const hit = blocks.find(b => this.isExtraHelpBlock(b)) as BlockText | undefined;
    if (!hit) return null;
    const bodyOnly = this.stripLeadHeading(hit.text || '');
    return this.md(bodyOnly);
  });

  /** The “Summary” HTML (or null) */
  summaryHelp = computed<string | null>(() => {
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

  /** Similar questions based on shared tags (top 3). */
  similarItems = computed<SimilarItem[]>(() => {
    const current = this.question();
    if (!current) return [];

    const baseTags = this.getQuestionTags(current);
    if (!baseTags.length) return [];

    const baseSet = new Set(baseTags);
    const scored = this.questionsList
      .filter((q) => q.id !== current.id)
      .map((q) => {
        const tags = this.getQuestionTags(q);
        if (!tags.length) return null;
        let score = 0;
        for (const tag of tags) {
          if (baseSet.has(tag)) score += 1;
        }
        if (!score) return null;
        return { question: q, score, importance: q.importance ?? 0 };
      })
      .filter(Boolean) as Array<{ question: Question; score: number; importance: number }>;

    scored.sort((a, b) =>
      b.score - a.score
      || b.importance - a.importance
      || (a.question.title || '').localeCompare(b.question.title || '')
    );

    return scored.slice(0, 3).map((item) => ({
      question: item.question,
      difficulty: this.difficultyLabel(item.question.difficulty),
    }));
  });

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private qs: QuestionService,
    private seo: SeoService,
    private progress: UserProgressService,
    public auth: AuthService
  ) { }

  ngOnInit() {
    this.hydrateState();

    this.sub = this.route.data
      .pipe(
        switchMap((data) => {
          const resolved = data['questionDetail'] as QuestionDetailResolved | undefined;
          if (resolved) {
            this.applyResolved(resolved);
            return of(null);
          }

          return combineLatest([this.route.parent!.paramMap, this.route.paramMap]).pipe(
            map(([parentPm, childPm]) => ({
              tech: parentPm.get('tech')! as Tech,
              id: childPm.get('id')!,
            })),
            tap(({ tech }) => (this.tech = tech)),
            switchMap(({ tech, id }) =>
              this.qs.loadQuestions(tech, 'trivia').pipe(
                tap((all) => {
                  this.questionsList = all;
                  this.dataLoaded = true;
                  this.selectQuestion(id);
                  this.syncPracticeIndexById(id);
                })
              )
            )
          );
        })
      )
      .subscribe();
  }

  ngOnDestroy() { this.sub?.unsubscribe(); }

  private applyResolved(resolved: QuestionDetailResolved) {
    this.tech = resolved.tech;
    this.questionsList = resolved.list ?? [];
    this.dataLoaded = true;
    this.selectQuestion(resolved.id);
    this.syncPracticeIndexById(resolved.id);
  }

  private hydrateState() {
    const navState = this.router.getCurrentNavigation()?.extras?.state;
    const browserState = this.isBrowser ? history.state : null;
    const s = (navState ?? browserState) as any;
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
    } else if (this.isBrowser && window.history.length > 1) {
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
    this.setLoadState(found);
    this.updateSeo(found);
    this.scrollMainToTop();
  }

  private setLoadState(found: Question | null) {
    if (found) {
      this.loadState.set('loaded');
      return;
    }
    if (this.isBrowser && this.dataLoaded) {
      this.loadState.set('notFound');
      return;
    }
    this.loadState.set('loading');
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
    if (this.suppressSeo) return;
    if (!q) {
      this.seo.updateTags({
        title: 'Front-end trivia question',
        description: 'Quick front-end trivia with concise explanations.',
      });
      return;
    }

    const canonical = this.seo.buildCanonicalUrl(`/${this.tech}/trivia/${q.id}`);
    const description = this.questionDescription(q);
    const keywords = this.questionKeywords(q);

    const breadcrumb = {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'FrontendAtlas',
          item: this.seo.buildCanonicalUrl('/'),
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Practice',
          item: this.seo.buildCanonicalUrl('/coding'),
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: q.title,
          item: canonical,
        },
      ],
    };

    const article = {
      '@type': 'TechArticle',
      '@id': canonical,
      headline: q.title,
      description,
      mainEntityOfPage: canonical,
      inLanguage: 'en',
      author: { '@type': 'Organization', name: 'FrontendAtlas' },
      isAccessibleForFree: q.access !== 'premium',
      keywords: keywords.join(', '),
    };

    this.seo.updateTags({
      title: q.title,
      description,
      keywords,
      canonical,
      ogType: 'article',
      jsonLd: [breadcrumb, article],
    });
  }

  onSelect(q: Question) {
    this.ensurePracticeBuilt(q.id);
    this.router.navigate(['/', this.tech, 'trivia', q.id], {
      state: this.buildNavState(q.id),
    });
  }

  similarNavState(q: Question) {
    return this.buildNavState(q.id);
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
    if (!this.isBrowser) return;
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

  private buildNavState(targetId: string) {
    const session = this.practice ?? this.buildSessionFromList();
    const index = session
      ? Math.max(0, session.items.findIndex((item) => item.id === targetId))
      : 0;
    const normalizedSession = session ? { items: session.items, index } : undefined;

    return {
      session: normalizedSession,
      returnTo: this.returnTo ?? undefined,
      returnToUrl: this.returnToUrl ?? undefined,
      returnLabel: this.returnLabel() ?? undefined,
    };
  }

  private buildSessionFromList(): PracticeSession | null {
    if (!this.questionsList.length) return null;
    const items: PracticeItem[] = this.questionsList.map(q => ({
      tech: this.tech, kind: 'trivia', id: q.id
    }));
    const index = Math.max(0, items.findIndex((item) => item.id === this.question()?.id));
    return { items, index };
  }

  private normalizeTags(tags: unknown): string[] {
    if (!Array.isArray(tags)) return [];
    const normalized = tags
      .map((tag) => String(tag || '').trim().toLowerCase())
      .filter(Boolean);
    return Array.from(new Set(normalized));
  }

  private getQuestionTags(q: Question): string[] {
    const explicit = this.normalizeTags(q.tags);
    if (explicit.length) return explicit;
    return this.deriveTagsFromText(q);
  }

  private deriveTagsFromText(q: Question): string[] {
    const text = this.questionTextForTags(q);
    if (!text) return [];
    const matched: string[] = [];
    for (const matcher of TAG_MATCHERS) {
      if (matcher.re.test(text)) matched.push(matcher.tag);
    }
    return matched;
  }

  private questionTextForTags(q: Question): string {
    const description = this.descriptionTextForTags(q.description);
    return `${q.title || ''} ${description || ''}`
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  private descriptionTextForTags(desc: unknown): string {
    if (typeof desc === 'string') return desc;
    const obj = desc as any;
    if (obj && typeof obj.summary === 'string') return obj.summary;
    if (obj && typeof obj.text === 'string') return obj.text;
    return '';
  }

  private decodeHtmlEntities(s: string): string {
    // Fast path for common entities (also fixes double-escaped cases like "&amp;lt;")
    return (s ?? '')
      .replace(/&amp;(?=lt;|gt;|amp;|quot;|#39;)/g, '&') // &amp;lt; -> &lt; (etc.)
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&');
  }

  private scrollMainToTop() {
    if (!this.isBrowser) return;
    const el = this.mainScroll?.nativeElement;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTo({ top: 0 });
    });
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
  md(src: unknown): string {
    let raw = typeof src === 'string'
      ? src
      : (src && (src as any).toString ? (src as any).toString() : '');

    // Fix legacy content that contains HTML entities like "&lt;div /&gt;"
    raw = this.decodeHtmlEntities(raw);

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

    return html;
  }

}
