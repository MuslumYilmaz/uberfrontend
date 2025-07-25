import { Routes } from '@angular/router';
import { CodingListComponent } from './features/coding/coding-list/coding-list.component';
import { TechLayoutComponent } from './features/tech-layout/tech-layout.component';
import { TriviaListComponent } from './features/trivia/trivia-list/trivia-list.component';

export const routes: Routes = [
  { path: '', redirectTo: 'javascript', pathMatch: 'full' },
  {
    path: ':tech',
    component: TechLayoutComponent,
    children: [
      { path: '', redirectTo: 'coding', pathMatch: 'full' },
      { path: 'coding', component: CodingListComponent },
      // { path: 'coding/:id',  component: CodingDetailComponent },
      { path: 'trivia', component: TriviaListComponent },
      // { path: 'trivia/:id',  component: TriviaDetailComponent },
    ]
  },
  { path: '**', redirectTo: '' }
];

