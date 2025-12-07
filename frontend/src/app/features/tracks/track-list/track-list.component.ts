import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TRACKS } from '../track.data';

@Component({
  selector: 'app-track-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './track-list.component.html',
  styleUrls: ['./track-list.component.css'],
})
export class TrackListComponent {
  tracks = TRACKS;
}
