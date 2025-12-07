import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { forkJoin, map, Observable, of, shareReplay } from 'rxjs';
import { Question, QuestionKind } from '../../../core/models/question.model';
import { Tech } from '../../../core/models/user.model';
import { QuestionService } from '../../../core/services/question.service';
import { SeoService } from '../../../core/services/seo.service';
import {
  FRAMEWORK_FAMILY_BY_ID,
  FrameworkVariant,
  frameworkLabel,
} from '../../../shared/framework-families';
import {
  TrackConfig,
  TRACK_LOOKUP,
  TrackQuestionKind,
  TrackQuestionRef,
} from '../track.data';

type PracticeItem = { tech: Tech; kind: QuestionKind; id: string };
type TrackItem = {
  id: string;
  title: string;
  kind: TrackQuestionKind;
  tech?: Tech;
  description?: string;
  difficulty?: string;
  importance?: number;
  tags?: string[];
  category?: string;
};

@Component({
  selector: 'app-track-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './track-detail.component.html',
  styleUrls: ['./track-detail.component.css'],
})
export class TrackDetailComponent implements OnInit {
  track: TrackConfig | null = null;
  featured$?: Observable<TrackItem[]>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private qs: QuestionService,
    private seo: SeoService,
  ) { }

  ngOnInit(): void {
    const slug = (this.route.snapshot.paramMap.get('slug') || '').toLowerCase();
    const track = TRACK_LOOKUP.get(slug as any) ?? null;

    if (!track) {
      this.router.navigateByUrl('/404');
      return;
    }

    this.track = track;
    this.featured$ = this.loadFeatured(track).pipe(shareReplay(1));

    this.seo.updateTags({
      title: `${track.title} track`,
      description: track.subtitle,
      keywords: [track.title, 'front end interview track', 'coding practice', 'system design'],
      canonical: undefined,
    });
  }

  startPractice(items: TrackItem[]): void {
    const practice = this.toPracticeItems(items);
    if (!practice.length) {
      const first = items[0];
      if (first) {
        this.router.navigate(this.linkFor(first));
      }
      return;
    }

    const first = practice[0];
    const returnToUrl = `/tracks/${this.track?.slug}`;

    this.router.navigate(
      ['/', first.tech, first.kind === 'trivia' ? 'trivia' : 'coding', first.id],
      {
        state: {
          session: { items: practice, index: 0 },
          returnToUrl,
          returnLabel: this.track?.title,
        },
      },
    );
  }

  hasPractice(items: TrackItem[]): boolean {
    return this.toPracticeItems(items).length > 0;
  }

  displayDifficulty(d?: string): string {
    const v = (d || '').toLowerCase();
    if (v === 'easy') return 'Beginner';
    if (v === 'medium' || v === 'intermediate') return 'Intermediate';
    if (v === 'hard') return 'Hard';
    return v ? v.charAt(0).toUpperCase() + v.slice(1) : '—';
  }

  linkFor(item: TrackItem): any[] {
    if (item.kind === 'system-design') {
      return ['/system-design', item.id];
    }
    const seg = item.kind === 'trivia' ? 'trivia' : 'coding';
    const tech = item.tech ?? 'javascript';
    return ['/', tech, seg, item.id];
  }

  frameworkOptions(item: TrackItem): FrameworkVariant[] {
    if (item.kind !== 'coding') return [];
    const fam = FRAMEWORK_FAMILY_BY_ID.get(item.id);
    return fam ? fam.members : [];
  }

  frameworkLabel(tech: Tech): string {
    return frameworkLabel(tech);
  }

  goToFramework(ev: Event, opt: FrameworkVariant) {
    ev.stopPropagation();
    ev.preventDefault();

    const path = ['/', opt.tech, opt.kind === 'trivia' ? 'trivia' : 'coding', opt.id];
    this.router.navigate(path, {
      state: {
        returnToUrl: this.router.url,
        returnLabel: this.track?.title ?? 'Back to track',
      },
    });
  }

  navState(items: TrackItem[], current: TrackItem) {
    if (current.kind === 'system-design') return undefined;
    const practice = this.toPracticeItems(items);
    if (!practice.length) return undefined;

    const idx = Math.max(
      0,
      practice.findIndex(
        (p) => p.id === current.id && p.kind === current.kind && p.tech === current.tech,
      ),
    );

    return {
      session: { items: practice, index: idx },
      returnToUrl: `/tracks/${this.track?.slug}`,
      returnLabel: this.track?.title,
    };
  }

  preview(text?: string, max = 140): string {
    if (!text) return '';
    const t = text.trim();
    if (t.length <= max) return t;
    return `${t.slice(0, max).trimEnd()}…`;
  }

  categoryLabel(item: TrackItem): string {
    if (item.kind === 'system-design') return 'System design';
    if (item.category) return item.category;
    return 'User interface';
  }

  categoryIcon(item: TrackItem): string {
    if (item.kind === 'system-design') return '🏗️';
    if (item.category?.toLowerCase().includes('html')) return '</>';
    if (item.category?.toLowerCase().includes('css')) return '</>';
    if (item.category?.toLowerCase().includes('javascript')) return 'JS';
    return '</>';
  }

  diffClass(d?: string): string {
    const v = (d || '').toLowerCase();
    if (v === 'easy') return 'diff-easy';
    if (v === 'hard') return 'diff-hard';
    return 'diff-mid';
  }

  private inferCategory(tech?: Tech | null): string {
    if (!tech) return 'User interface';
    if (tech === 'html' || tech === 'css') return 'HTML & CSS';
    if (tech === 'javascript') return 'JavaScript';
    if (tech === 'react' || tech === 'angular' || tech === 'vue') return 'User interface';
    return 'User interface';
  }

  private loadFeatured(track: TrackConfig): Observable<TrackItem[]> {
    const system$ = this.qs.loadSystemDesign().pipe(shareReplay(1));

    const loaders = track.featured.map((ref) => {
      if (ref.kind === 'system-design') {
        return system$.pipe(
          map((list: any[]) => {
            const hit = (list || []).find((it) => it.id === ref.id);
            return hit ? this.toSystemItem(hit) : null;
          }),
        );
      }

      if (!ref.tech) {
        return of(null);
      }

      return this.qs.getById(ref.tech, ref.kind as QuestionKind, ref.id).pipe(
        map((q) => (q ? this.toTrackItem(ref, q) : null)),
      );
    });

    if (!loaders.length) return of([]);

    return forkJoin(loaders).pipe(
      map((items) => items.filter(Boolean) as TrackItem[]),
    );
  }

  private toTrackItem(ref: TrackQuestionRef, q: Question): TrackItem {
    return {
      id: q.id,
      kind: ref.kind,
      tech: ref.tech,
      title: q.title,
      description: this.descriptionText(q),
      difficulty: q.difficulty,
      importance: q.importance,
      tags: q.tags || [],
      category: this.inferCategory(ref.tech),
    };
  }

  private toSystemItem(meta: any): TrackItem {
    return {
      id: meta.id,
      kind: 'system-design',
      title: meta.title,
      description: typeof meta.description === 'string' ? meta.description : '',
      difficulty: 'intermediate',
      importance: 4,
      tags: meta.tags || [],
      category: 'System design',
    };
  }

  private descriptionText(q: Question): string {
    const d: any = (q as any).description;
    if (typeof d === 'string') return d;
    if (d && typeof d === 'object') {
      return (d.summary || d.text || '') as string;
    }
    return '';
  }

  private toPracticeItems(items: TrackItem[]): PracticeItem[] {
    return items
      .filter((it) => it.kind !== 'system-design' && !!it.tech)
      .map((it) => ({
        tech: it.tech as Tech,
        kind: it.kind as QuestionKind,
        id: it.id,
      }));
  }
}
