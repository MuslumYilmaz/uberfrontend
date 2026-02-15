import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TRACKS } from '../track.data';
import { PrepSignalGridComponent, PrepSignalItem } from '../../../shared/components/prep-signal-grid/prep-signal-grid.component';

@Component({
  selector: 'app-track-list',
  standalone: true,
  imports: [CommonModule, RouterModule, PrepSignalGridComponent],
  templateUrl: './track-list.component.html',
  styleUrls: ['./track-list.component.css'],
})
export class TrackListComponent {
  tracks = TRACKS.filter((t) => !t.hidden);

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
