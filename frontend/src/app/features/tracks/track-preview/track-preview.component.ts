import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { combineLatest, Observable, of } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
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

@Component({
  standalone: true,
  selector: 'app-track-preview',
  imports: [CommonModule, RouterModule, FaCardComponent],
  templateUrl: './track-preview.component.html',
  styleUrls: ['./track-preview.component.css'],
})
export class TrackPreviewComponent implements OnInit {
  track: TrackConfig | null = null;
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
    this.seo.updateTags({
      title: `${track.title} Preview`,
      description: `${track.subtitle} Preview outcomes, sample questions, and what unlocks with premium.`,
      canonical: undefined,
    });

    this.previewQuestions$ = combineLatest([
      this.questionService.loadAllQuestions('coding'),
      this.questionService.loadAllQuestions('trivia'),
      this.questionService.loadSystemDesign(),
    ]).pipe(
      map(([coding, trivia, system]) => this.buildPreviewQuestions(track, coding, trivia, system)),
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
    return kind === 'coding' ? 'Coding' : 'Trivia';
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

  private humanize(id: string): string {
    return id
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (ch) => ch.toUpperCase());
  }
}
