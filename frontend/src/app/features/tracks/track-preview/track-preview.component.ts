import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { combineLatest, Observable, of } from 'rxjs';
import { map, shareReplay, tap } from 'rxjs/operators';
import { AccessLevel, Difficulty } from '../../../core/models/question.model';
import { Tech } from '../../../core/models/user.model';
import { QuestionService } from '../../../core/services/question.service';
import { SeoService } from '../../../core/services/seo.service';
import { TRACK_LOOKUP, TrackConfig, TrackQuestionRef } from '../track.data';
import { FaCardComponent } from '../../../shared/ui/card/fa-card.component';

type PreviewQuestion = {
  id: string;
  title: string;
  kind: 'coding' | 'trivia' | 'system-design';
  tech?: Tech;
  difficulty: Difficulty;
  access: AccessLevel;
};

type PreviewLink = {
  label: string;
  route: any[];
  path: string;
  queryParams?: Record<string, string | number | boolean>;
};

type PreviewNarrative = {
  audience: string;
  purpose: string;
  sequence: string[];
  supportLinks: PreviewLink[];
  faq: Array<{ question: string; answer: string }>;
  primaryCta: PreviewLink;
};

const TRACK_PREVIEW_CONTENT: Record<string, PreviewNarrative> = {
  'crash-7d': {
    audience: 'Built for short timelines when you need one high-yield week instead of a long curriculum.',
    purpose: 'This study plan compresses the highest-signal JavaScript, UI, and frontend system design drills into a repeatable 7-day sprint.',
    sequence: [
      'Start with the Question Library to identify the concepts you still miss under time pressure.',
      'Run this 7-day plan in order so implementation drills, concept checks, and system design prompts reinforce each other.',
      'Finish with Company Prep once your timing and explanation quality are stable.',
    ],
    supportLinks: [
      { label: 'JavaScript interview questions', route: ['/javascript/interview-questions'], path: '/javascript/interview-questions' },
      { label: 'Question Library', route: ['/coding'], path: '/coding', queryParams: { reset: 1 } },
      { label: 'Company Prep', route: ['/companies'], path: '/companies' },
    ],
    faq: [
      {
        question: 'Who should use the 7-day crash track?',
        answer: 'Use it when interviews are close and you need one focused week of high-yield frontend preparation.',
      },
      {
        question: 'What should I do after the crash track?',
        answer: 'Move into Company Prep and targeted guides so your final practice mirrors the teams you are interviewing with.',
      },
    ],
    primaryCta: { label: 'Open Question Library', route: ['/coding'], path: '/coding', queryParams: { reset: 1 } },
  },
  'foundations-30d': {
    audience: 'Built for candidates who want a full-month sequence across fundamentals, frameworks, and architecture communication.',
    purpose: 'This study plan gives you a 30-day foundations runway so you can improve implementation speed, concept clarity, and system design coverage together.',
    sequence: [
      'Use the Question Library to identify weak spots before you start the month.',
      'Work through the 30-day plan in order so fundamentals, framework drills, and architecture prompts build on each other.',
      'Add Company Prep in the final week to rehearse target-specific patterns without losing structure.',
    ],
    supportLinks: [
      { label: 'Question Library', route: ['/coding'], path: '/coding', queryParams: { reset: 1 } },
      { label: 'Framework Prep Guide', route: ['/guides/framework-prep'], path: '/guides/framework-prep' },
      { label: 'Company Prep', route: ['/companies'], path: '/companies' },
    ],
    faq: [
      {
        question: 'Who should use the 30-day foundations track?',
        answer: 'Use it when you have enough runway to rebuild fundamentals before layering on framework depth and system design.',
      },
      {
        question: 'Does this plan replace the Question Library?',
        answer: 'No. The Question Library helps you diagnose what to practice, and the 30-day plan gives you the execution order.',
      },
    ],
    primaryCta: { label: 'Open Question Library', route: ['/coding'], path: '/coding', queryParams: { reset: 1 } },
  },
};

@Component({
  standalone: true,
  selector: 'app-track-preview',
  imports: [CommonModule, RouterModule, FaCardComponent],
  templateUrl: './track-preview.component.html',
  styleUrls: ['./track-preview.component.css'],
})
export class TrackPreviewComponent implements OnInit {
  track: TrackConfig | null = null;
  narrative: PreviewNarrative | null = null;
  previewQuestions$: Observable<PreviewQuestion[]> = of([]);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private questionService: QuestionService,
    private seo: SeoService,
  ) { }

  ngOnInit(): void {
    const slug = (this.route.snapshot.paramMap.get('slug') || '').toLowerCase();
    const track = TRACK_LOOKUP.get(slug) ?? null;
    if (!track) {
      this.router.navigateByUrl('/404').catch(() => void 0);
      return;
    }

    this.track = track;
    this.narrative = this.resolveNarrative(track);
    this.publishSeo(track, []);

    this.previewQuestions$ = combineLatest([
      this.questionService.loadAllQuestionSummaries('coding', { transferState: false }),
      this.questionService.loadAllQuestionSummaries('trivia', { transferState: false }),
      this.questionService.loadSystemDesign({ transferState: false }),
    ]).pipe(
      map(([coding, trivia, system]) => this.buildPreviewQuestions(track, coding, trivia, system)),
      tap((questions) => this.publishSeo(track, questions)),
      shareReplay(1),
    );
  }

  freeCount(items: PreviewQuestion[]): number {
    return items.filter((item) => item.access === 'free').length;
  }

  premiumCount(items: PreviewQuestion[]): number {
    return items.filter((item) => item.access === 'premium').length;
  }

  displayKind(kind: PreviewQuestion['kind']): string {
    if (kind === 'system-design') return 'System design';
    return kind === 'coding' ? 'Coding' : 'Concept question';
  }

  questionRoute(item: PreviewQuestion): any[] {
    if (item.kind === 'system-design') return ['/system-design', item.id];
    const tech = item.tech || 'javascript';
    return ['/', tech, item.kind === 'trivia' ? 'trivia' : 'coding', item.id];
  }

  primaryCtaQueryParams(trackSlug: string): Record<string, string | number | boolean> {
    return {
      ...(this.narrative?.primaryCta?.queryParams ?? {}),
      src: `track_preview_${trackSlug}`,
    };
  }

  private buildPreviewQuestions(
    track: TrackConfig,
    coding: Array<any>,
    trivia: Array<any>,
    system: Array<any>,
  ): PreviewQuestion[] {
    const out: PreviewQuestion[] = [];
    const seen = new Set<string>();

    for (const ref of track.featured) {
      const question = this.resolveQuestion(ref, coding, trivia, system);
      if (!question) continue;
      const key = `${question.kind}:${question.tech || 'none'}:${question.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(question);
      if (out.length >= 8) break;
    }

    return out;
  }

  private resolveQuestion(
    ref: TrackQuestionRef,
    coding: Array<any>,
    trivia: Array<any>,
    system: Array<any>,
  ): PreviewQuestion | null {
    if (ref.kind === 'system-design') {
      const sys = system.find((q) => q?.id === ref.id);
      return {
        id: ref.id,
        title: String(sys?.title || this.humanize(ref.id)),
        kind: 'system-design',
        difficulty: this.normalizeDifficulty(sys?.difficulty),
        access: this.normalizeAccess(sys?.access),
      };
    }

    const bucket = ref.kind === 'coding' ? coding : trivia;
    const exact = ref.tech
      ? bucket.find((q) => q?.id === ref.id && q?.tech === ref.tech)
      : null;
    const fallback = bucket.find((q) => q?.id === ref.id);
    const hit = exact || fallback;

    return {
      id: ref.id,
      title: String(hit?.title || this.humanize(ref.id)),
      kind: ref.kind,
      tech: (hit?.tech || ref.tech) as Tech | undefined,
      difficulty: this.normalizeDifficulty(hit?.difficulty),
      access: this.normalizeAccess(hit?.access),
    };
  }

  private normalizeDifficulty(value: unknown): Difficulty {
    const raw = String(value || '').toLowerCase();
    if (raw === 'easy' || raw === 'hard' || raw === 'intermediate') return raw;
    return 'intermediate';
  }

  private normalizeAccess(value: unknown): AccessLevel {
    return String(value || '').toLowerCase() === 'free' ? 'free' : 'premium';
  }

  private resolveNarrative(track: TrackConfig): PreviewNarrative {
    return TRACK_PREVIEW_CONTENT[track.slug] || {
      audience: 'Built for candidates who want a structured route instead of random frontend interview practice.',
      purpose: 'This preview shows how the study plan connects coding drills, concept questions, and system design prompts in one sequence.',
      sequence: [
        'Start from the Question Library to identify your weak areas.',
        'Run the study plan in order so implementation and explanation practice stay connected.',
        'Use guides and Company Prep after the plan to sharpen the final rounds you care about.',
      ],
      supportLinks: [
        { label: 'Question Library', route: ['/coding'], path: '/coding', queryParams: { reset: 1 } },
        { label: 'Framework Prep Guide', route: ['/guides/framework-prep'], path: '/guides/framework-prep' },
        { label: 'Company Prep', route: ['/companies'], path: '/companies' },
      ],
      faq: [
        {
          question: 'What is the role of a study-plan preview?',
          answer: 'It lets you evaluate the plan scope, sequence, and sample questions before you unlock the full route.',
        },
      ],
      primaryCta: { label: 'Open Question Library', route: ['/coding'], path: '/coding', queryParams: { reset: 1 } },
    };
  }

  private publishSeo(track: TrackConfig, questions: PreviewQuestion[]): void {
    const canonicalPath = `/tracks/${track.slug}/preview`;
    const canonicalUrl = this.seo.buildCanonicalUrl(canonicalPath);
    const narrative = this.narrative || this.resolveNarrative(track);
    const description = `${track.title} study plan preview for frontend interviews. ${narrative.purpose}`;
    const collectionPage: Record<string, any> = {
      '@type': 'CollectionPage',
      '@id': canonicalUrl,
      url: canonicalUrl,
      name: `${track.title} Study Plan Preview`,
      description,
      inLanguage: 'en',
      about: [
        { '@type': 'Thing', name: 'Frontend interview study plan' },
        { '@type': 'Thing', name: track.title },
      ],
      mentions: narrative.supportLinks.map((link) => ({
        '@type': 'WebPage',
        name: link.label,
        url: this.seo.buildCanonicalUrl(link.path),
      })),
    };

    if (questions.length) {
      collectionPage['mainEntity'] = {
        '@type': 'ItemList',
        itemListElement: questions.map((question, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: question.title,
          url: this.seo.buildCanonicalUrl(this.questionPath(question)),
        })),
      };
    }

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
          name: 'Frontend Interview Study Plans and Tracks',
          item: this.seo.buildCanonicalUrl('/tracks'),
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: `${track.title} Study Plan Preview`,
          item: canonicalUrl,
        },
      ],
    };

    const faqPage = {
      '@type': 'FAQPage',
      mainEntity: narrative.faq.map((entry) => ({
        '@type': 'Question',
        name: entry.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: entry.answer,
        },
      })),
    };

    this.seo.updateTags({
      title: `${track.title} Study Plan Preview`,
      description,
      canonical: canonicalPath,
      jsonLd: [collectionPage, breadcrumb, faqPage],
    });
  }

  private questionPath(item: PreviewQuestion): string {
    if (item.kind === 'system-design') return `/system-design/${item.id}`;
    const tech = item.tech || 'javascript';
    return `/${tech}/${item.kind === 'trivia' ? 'trivia' : 'coding'}/${item.id}`;
  }

  private humanize(id: string): string {
    return id
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (ch) => ch.toUpperCase());
  }
}
