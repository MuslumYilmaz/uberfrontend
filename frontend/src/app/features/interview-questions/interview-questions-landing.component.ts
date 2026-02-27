import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import type { InterviewQuestionsHubResolved } from '../../core/resolvers/interview-questions.resolver';
import { QuestionListItem, QuestionService } from '../../core/services/question.service';
import { SeoService, type SeoMeta } from '../../core/services/seo.service';
import { Tech } from '../../core/models/user.model';

type InterviewQuestionsLandingConfig = {
  keyword: string;
  title: string;
  techs: Tech[];
  isMasterHub: boolean;
};

type Kind = 'coding' | 'trivia';
type HubLink = { label: string; route: any[]; path: string };

type QuestionSummaryRow = {
  id: string;
  title: string;
  tech: Tech;
  kind: Kind;
  difficulty: string;
  description: string;
  link: any[];
};

type RawQuestionSummaryRow = QuestionListItem & { tech: Tech };
type SchemaQuestionLink = { title: string; path: string };

const DEFAULT_CONFIG: InterviewQuestionsLandingConfig = {
  keyword: 'javascript interview questions',
  title: 'JavaScript Interview Questions',
  techs: ['javascript'],
  isMasterHub: false,
};

const INTERVIEW_HUB_LINKS: HubLink[] = [
  {
    label: 'Frontend interview questions',
    route: ['/interview-questions'],
    path: '/interview-questions',
  },
  {
    label: 'JavaScript interview questions',
    route: ['/javascript/interview-questions'],
    path: '/javascript/interview-questions',
  },
  {
    label: 'React interview questions',
    route: ['/react/interview-questions'],
    path: '/react/interview-questions',
  },
  {
    label: 'Angular interview questions',
    route: ['/angular/interview-questions'],
    path: '/angular/interview-questions',
  },
  {
    label: 'Vue interview questions',
    route: ['/vue/interview-questions'],
    path: '/vue/interview-questions',
  },
  {
    label: 'HTML interview questions',
    route: ['/html/interview-questions'],
    path: '/html/interview-questions',
  },
  {
    label: 'CSS interview questions',
    route: ['/css/interview-questions'],
    path: '/css/interview-questions',
  },
  {
    label: 'HTML CSS interview questions',
    route: ['/html-css/interview-questions'],
    path: '/html-css/interview-questions',
  },
];

const PRIMARY_TECH_HUB_PATHS = new Set<string>([
  '/javascript/interview-questions',
  '/react/interview-questions',
  '/angular/interview-questions',
  '/vue/interview-questions',
  '/html/interview-questions',
  '/css/interview-questions',
]);

const DIFFICULTY_RANK: Record<string, number> = {
  easy: 0,
  intermediate: 1,
  hard: 2,
};

@Component({
  standalone: true,
  selector: 'app-interview-questions-landing',
  imports: [CommonModule, RouterModule],
  templateUrl: './interview-questions-landing.component.html',
  styleUrls: ['./interview-questions-landing.component.css'],
})
export class InterviewQuestionsLandingComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly questionService = inject(QuestionService);
  private readonly seo = inject(SeoService);

  config: InterviewQuestionsLandingConfig = DEFAULT_CONFIG;
  loading = true;
  codingQuestions: QuestionSummaryRow[] = [];
  triviaQuestions: QuestionSummaryRow[] = [];
  relatedHubLinks: HubLink[] = [];

  ngOnInit(): void {
    const incoming = this.route.snapshot.data['interviewQuestions'] as Partial<InterviewQuestionsLandingConfig> | undefined;
    const techs = Array.isArray(incoming?.techs)
      ? incoming!.techs.filter((tech): tech is Tech =>
        ['javascript', 'react', 'angular', 'vue', 'html', 'css'].includes(String(tech)),
      )
      : [];

    this.config = {
      keyword: String(incoming?.keyword || DEFAULT_CONFIG.keyword),
      title: String(incoming?.title || DEFAULT_CONFIG.title),
      techs: techs.length ? techs : DEFAULT_CONFIG.techs,
      isMasterHub: Boolean(incoming?.isMasterHub),
    };

    this.relatedHubLinks = this.buildRelatedHubLinks();
    const resolved = this.route.snapshot.data['interviewQuestionsList'] as InterviewQuestionsHubResolved | undefined;
    if (resolved && this.hasResolvedRows(resolved)) {
      this.applyResolvedRows(resolved);
      this.loading = false;
      this.updateSchema();
      return;
    }

    this.loadLists();
  }

  keywordSentenceCase(): string {
    return this.config.keyword.charAt(0).toUpperCase() + this.config.keyword.slice(1);
  }

  introLead(): string {
    if (this.isMasterHub()) {
      return 'Use this frontend interview questions library to pick a technology hub, open coding and trivia leaves, and keep weekly prep consistent.';
    }

    return `Use this ${this.keywordSentenceCase()} hub to practice coding and trivia leaves, then return to the master library and interview practice platform.`;
  }

  listIntentItems(): string[] {
    if (this.isMasterHub()) {
      return [
        'Choose a technology hub based on your current interview pipeline.',
        'Mix coding implementation drills with trivia explanation checks.',
        'Move from question libraries to structured interview practice tracks.',
      ];
    }

    const techName = this.currentHubTechLabel();
    return [
      `Prioritize high-impact ${techName} coding prompts first.`,
      `Use ${techName} trivia rounds to sharpen explanation speed.`,
      'Escalate into the frontend interview prep platform for guided sequencing.',
    ];
  }

  masterTechHubLinks(): HubLink[] {
    return INTERVIEW_HUB_LINKS.filter((hub) => PRIMARY_TECH_HUB_PATHS.has(hub.path));
  }

  supportsMultipleTechs(): boolean {
    return this.config.techs.length > 1;
  }

  isMasterHub(): boolean {
    return this.config.isMasterHub;
  }

  techLabel(tech: Tech): string {
    switch (tech) {
      case 'javascript':
        return 'JavaScript';
      case 'react':
        return 'React';
      case 'angular':
        return 'Angular';
      case 'vue':
        return 'Vue';
      case 'html':
        return 'HTML';
      case 'css':
        return 'CSS';
      default:
        return tech;
    }
  }

  private loadLists(): void {
    this.loading = true;

    forkJoin({
      coding: this.loadKindRows('coding'),
      trivia: this.loadKindRows('trivia'),
    }).subscribe({
      next: ({ coding, trivia }) => {
        this.codingQuestions = coding
          .map((row) => this.toRow(row, 'coding'))
          .slice(0, 12);
        this.triviaQuestions = trivia
          .map((row) => this.toRow(row, 'trivia'))
          .slice(0, 12);
        this.loading = false;
        this.updateSchema();
      },
      error: () => {
        this.codingQuestions = [];
        this.triviaQuestions = [];
        this.loading = false;
        this.updateSchema();
      },
    });
  }

  private loadKindRows(kind: Kind) {
    return forkJoin(
      this.config.techs.map((tech) =>
        this.questionService.loadQuestionSummaries(tech, kind, { transferState: false }).pipe(
          map((rows) => rows.map((row) => ({ ...row, tech } as RawQuestionSummaryRow))),
          catchError(() => of([] as RawQuestionSummaryRow[])),
        ),
      ),
    ).pipe(
      map((buckets) => buckets.flat()),
      map((rows) =>
        rows
          .filter((row) => !!row.id && !!row.title && this.config.techs.includes(row.tech))
          .sort((a, b) => this.compareRows(a, b)),
      ),
    );
  }

  private hasResolvedRows(resolved: InterviewQuestionsHubResolved): boolean {
    return Array.isArray(resolved.coding) && Array.isArray(resolved.trivia);
  }

  private applyResolvedRows(resolved: InterviewQuestionsHubResolved): void {
    const codingRows = this.filterRowsForCurrentHub(resolved.coding);
    const triviaRows = this.filterRowsForCurrentHub(resolved.trivia);

    this.codingQuestions = codingRows
      .map((row) => this.toRow(row, 'coding'))
      .slice(0, 12);
    this.triviaQuestions = triviaRows
      .map((row) => this.toRow(row, 'trivia'))
      .slice(0, 12);
  }

  private filterRowsForCurrentHub(rows: RawQuestionSummaryRow[]): RawQuestionSummaryRow[] {
    return rows
      .filter((row) => !!row.id && !!row.title && this.config.techs.includes(row.tech))
      .sort((a, b) => this.compareRows(a, b));
  }

  private compareRows(a: RawQuestionSummaryRow, b: RawQuestionSummaryRow): number {
    const aImportance = Number(a.importance || 0);
    const bImportance = Number(b.importance || 0);
    if (aImportance !== bImportance) return bImportance - aImportance;

    const aDifficulty = DIFFICULTY_RANK[String(a.difficulty || '').toLowerCase()] ?? 99;
    const bDifficulty = DIFFICULTY_RANK[String(b.difficulty || '').toLowerCase()] ?? 99;
    if (aDifficulty !== bDifficulty) return aDifficulty - bDifficulty;

    return String(a.title || '').localeCompare(String(b.title || ''));
  }

  private toRow(row: RawQuestionSummaryRow, kind: Kind): QuestionSummaryRow {
    return {
      id: String(row.id || ''),
      title: String(row.title || ''),
      tech: row.tech,
      kind,
      difficulty: String(row.difficulty || 'intermediate'),
      description: this.toShortDescription(row),
      link: ['/', row.tech, kind, row.id],
    };
  }

  private toShortDescription(row: QuestionListItem): string {
    const direct = this.cleanText(String(row.shortDescription || ''));
    if (direct) return direct;

    if (typeof row.description === 'string') {
      return this.cleanText(row.description);
    }

    const structured = row.description && typeof row.description === 'object'
      ? (row.description as { summary?: string; text?: string })
      : null;
    return this.cleanText(structured?.summary || structured?.text || '');
  }

  private cleanText(value: string): string {
    return String(value || '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private updateSchema(): void {
    const routeSeo = (this.route.snapshot.data['seo'] as SeoMeta | undefined) || {};
    const currentPath = this.currentRoutePath();
    const canonicalUrl = this.seo.buildCanonicalUrl(currentPath);
    const masterHubUrl = this.seo.buildCanonicalUrl('/interview-questions');
    const tracksUrl = this.seo.buildCanonicalUrl('/tracks');
    const companiesUrl = this.seo.buildCanonicalUrl('/companies');
    const description = String(
      routeSeo.description
      || `${this.config.title} with coding and trivia prompts for frontend interview preparation.`,
    );

    const schemaLinks = this.schemaQuestionLinks();
    const itemListElement = schemaLinks.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.title,
      url: this.seo.buildCanonicalUrl(item.path),
    }));

    const collectionPage: Record<string, any> = {
      '@type': 'CollectionPage',
      '@id': canonicalUrl,
      url: canonicalUrl,
      name: this.config.title,
      description,
      inLanguage: 'en',
      about: [
        { '@type': 'Thing', name: this.keywordSentenceCase() },
        { '@type': 'Thing', name: 'Frontend interview questions' },
      ],
      mentions: [
        { '@type': 'WebPage', name: 'Frontend interview prep platform', url: tracksUrl },
        { '@type': 'WebPage', name: 'Company frontend interview questions', url: companiesUrl },
      ],
    };

    if (!this.isMasterHub()) {
      collectionPage['isPartOf'] = {
        '@type': 'CollectionPage',
        '@id': masterHubUrl,
        url: masterHubUrl,
        name: 'Frontend Interview Questions',
      };
      collectionPage['mentions'] = [
        { '@type': 'WebPage', name: 'Frontend interview questions library', url: masterHubUrl },
        { '@type': 'WebPage', name: 'Frontend interview prep platform', url: tracksUrl },
        { '@type': 'WebPage', name: 'Company frontend interview questions', url: companiesUrl },
      ];
    } else {
      collectionPage['hasPart'] = this.masterTechHubLinks().map((hub) => ({
        '@type': 'WebPage',
        name: hub.label,
        url: this.seo.buildCanonicalUrl(hub.path),
      }));
      collectionPage['mentions'] = [
        { '@type': 'WebPage', name: 'Frontend interview prep platform', url: tracksUrl },
        { '@type': 'WebPage', name: 'Company frontend interview questions', url: companiesUrl },
      ];
    }

    if (itemListElement.length) {
      collectionPage['mainEntity'] = {
        '@type': 'ItemList',
        itemListElement,
      };
    }

    const breadcrumbList = {
      '@type': 'BreadcrumbList',
      itemListElement: this.breadcrumbItems(canonicalUrl, masterHubUrl),
    };

    this.seo.updateTags({
      ...routeSeo,
      canonical: currentPath,
      jsonLd: [collectionPage, breadcrumbList],
    });
  }

  private schemaQuestionLinks(): SchemaQuestionLink[] {
    const seen = new Set<string>();
    const out: SchemaQuestionLink[] = [];
    const combined = [...this.codingQuestions, ...this.triviaQuestions];

    for (const row of combined) {
      const path = `/${row.tech}/${row.kind}/${row.id}`;
      if (seen.has(path)) continue;
      seen.add(path);
      out.push({ title: row.title, path });
      if (out.length >= 20) break;
    }

    return out;
  }

  private breadcrumbItems(canonicalUrl: string, masterHubUrl: string): Array<Record<string, any>> {
    const items: Array<Record<string, any>> = [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'FrontendAtlas',
        item: this.seo.buildCanonicalUrl('/'),
      },
    ];

    if (!this.isMasterHub()) {
      items.push({
        '@type': 'ListItem',
        position: 2,
        name: 'Frontend Interview Questions',
        item: masterHubUrl,
      });
      items.push({
        '@type': 'ListItem',
        position: 3,
        name: this.config.title,
        item: canonicalUrl,
      });
      return items;
    }

    items.push({
      '@type': 'ListItem',
      position: 2,
      name: this.config.title,
      item: canonicalUrl,
    });
    return items;
  }

  private currentRoutePath(): string {
    const segments = this.route.snapshot.pathFromRoot
      .flatMap((entry) => entry.url || [])
      .map((segment) => segment.path)
      .filter((segment) => !!segment);

    return segments.length ? `/${segments.join('/')}` : '/';
  }

  private buildRelatedHubLinks(): HubLink[] {
    const currentPath = this.currentHubPath();
    return INTERVIEW_HUB_LINKS.filter((hub) => hub.path !== currentPath);
  }

  private currentHubPath(): string {
    if (this.config.isMasterHub) return '/interview-questions';
    if (this.config.techs.length === 1) {
      const tech = this.config.techs[0];
      if (
        tech === 'javascript'
        || tech === 'react'
        || tech === 'angular'
        || tech === 'vue'
        || tech === 'html'
        || tech === 'css'
      ) {
        return `/${tech}/interview-questions`;
      }
    }

    if (this.config.techs.includes('html') && this.config.techs.includes('css')) {
      return '/html-css/interview-questions';
    }

    return '/interview-questions';
  }

  private currentHubTechLabel(): string {
    if (!this.config.techs.length) return 'frontend';
    return this.techLabel(this.config.techs[0]).toLowerCase();
  }
}
