import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TRACKS, TrackConfig } from '../track.data';
import { PrepSignalGridComponent, PrepSignalItem } from '../../../shared/components/prep-signal-grid/prep-signal-grid.component';
import { FaCardComponent } from '../../../shared/ui/card/fa-card.component';

type MasteryTrackCard = {
  slug: string;
  durationLabel: string;
  questionCountLabel: string;
  title: string;
  subtitle: string;
  focus: string[];
  note: string;
  badges: string[];
  ctaLabel: string;
};

@Component({
  selector: 'app-track-list',
  standalone: true,
  imports: [CommonModule, RouterModule, PrepSignalGridComponent, FaCardComponent],
  templateUrl: './track-list.component.html',
  styleUrls: ['./track-list.component.css'],
})
export class TrackListComponent {
  tracks = TRACKS.filter((t) => !t.hidden);
  private readonly uiFrameworks = new Set(['react', 'angular', 'vue']);
  private readonly trackCardMeta = new Map<string, { note: string; badges: string[] }>(
    this.tracks.map((track) => [track.slug, this.buildTrackCardMeta(track)]),
  );
  masteryCards: MasteryTrackCard[] = [
    {
      slug: 'javascript-prep-path',
      durationLabel: '0 to 100 roadmap',
      questionCountLabel: '40+ drills',
      title: 'JavaScript Mastery Crash Track',
      subtitle:
        'Structured module board with trivia, output prediction, coding drills, and checkpoint gates.',
      focus: [
        'Foundations: values, coercion, control flow',
        'Functions + scope: closures, TDZ, this',
        'Async + browser APIs: event loop, debounce, fetch',
        'Mastery capstone: polyfills, LRU, reactive store',
      ],
      note: 'Direct mastery path with progress tracking and module unlock flow.',
      badges: ['JS-first mastery', 'Checkpoint-gated progression'],
      ctaLabel: 'Open mastery',
    },
  ];
  allTrackCardsCount = this.tracks.length + this.masteryCards.length;

  trackPrepOutcomes: PrepSignalItem[] = [
    'Follow a clear interview roadmap instead of random practice.',
    'Connect framework drills to system design and behavioral rounds.',
  ];

  trackPrepMistakes: PrepSignalItem[] = [
    'Switching between stacks every day without finishing one path.',
    'Focusing only on trivia instead of mixed interview signal areas.',
  ];

  trackPrepSequence: PrepSignalItem[] = [
    { text: 'Interview blueprint', route: ['/guides/interview-blueprint'] },
    { text: 'Framework prep path', route: ['/guides/framework-prep'] },
    { text: 'Guided tracks', route: ['/tracks'] },
    { text: 'Company question sets', route: ['/companies'] },
  ];

  noteFor(track: TrackConfig): string {
    return this.trackCardMeta.get(track.slug)?.note
      || 'Covers UI frameworks (React, Angular, Vue) plus HTML/CSS and JS where relevant.';
  }

  badgesFor(track: TrackConfig): string[] {
    return this.trackCardMeta.get(track.slug)?.badges
      || ['Framework coding options', 'System design included'];
  }

  private buildTrackCardMeta(track: TrackConfig): { note: string; badges: string[] } {
    const systemDesignCount = track.featured.filter((item) => item.kind === 'system-design').length;
    const hasFrameworkCoding = track.featured.some(
      (item) => item.kind === 'coding' && !!item.tech && this.uiFrameworks.has(item.tech),
    );
    const frameworkBadge = hasFrameworkCoding ? 'Framework coding options' : 'Core web stack';
    const systemBadge = `${systemDesignCount} system design prompt${systemDesignCount === 1 ? '' : 's'}`;

    if (track.slug === 'crash-7d') {
      return {
        note: 'High-yield 7-day sprint: repeat-friendly mix of JS core, UI flows, and two must-know frontend system design prompts.',
        badges: [frameworkBadge, systemBadge],
      };
    }

    if (track.slug === 'foundations-30d') {
      return {
        note: '30-day progression from fundamentals to medium concepts, with framework coding drills and framework-agnostic trivia.',
        badges: [frameworkBadge, systemBadge],
      };
    }

    return {
      note: 'Covers UI frameworks (React, Angular, Vue) plus HTML/CSS and JS where relevant.',
      badges: [frameworkBadge, systemBadge],
    };
  }
}
