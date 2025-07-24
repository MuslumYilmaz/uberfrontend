import { Routes } from '@angular/router';
import { CodingListComponent } from './features/coding/coding-list/coding-list.component';
import { TriviaListComponent } from './features/trivia/trivia-list/trivia-list.component';

export const routes: Routes = [
  { path: '', redirectTo: 'coding/javascript', pathMatch: 'full' },
  { path: 'coding/:tech', component: CodingListComponent },
  { path: 'trivia/:tech', component: TriviaListComponent },
  // future: { path: 'coding/:tech/:id', component: CodingPlaygroundComponent },
  // future: { path: 'trivia/:tech/:id', component: TriviaDetailComponent },
  { path: '**', redirectTo: '' },
];
