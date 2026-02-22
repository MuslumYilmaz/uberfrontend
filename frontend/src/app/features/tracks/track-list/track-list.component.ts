import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TRACKS } from '../track.data';
import { PrepSignalGridComponent, PrepSignalItem } from '../../../shared/components/prep-signal-grid/prep-signal-grid.component';

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
  imports: [CommonModule, RouterModule, PrepSignalGridComponent],
  templateUrl: './track-list.component.html',
  styleUrls: ['./track-list.component.css'],
})
export class TrackListComponent {
  tracks = TRACKS.filter((t) => !t.hidden);
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
}
