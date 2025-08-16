import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { QuestionService } from '../../core/services/question.service';

type SysDesign = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  type: 'system-design';
};

@Component({
  standalone: true,
  selector: 'app-system-design-list',
  imports: [
    CommonModule, RouterModule, FormsModule,
    InputTextModule, MultiSelectModule, ProgressSpinnerModule, ChipModule, ButtonModule
  ],
  templateUrl: './system-design-list.component.html',
  styleUrls: ['./system-design-list.component.css']
})
export class SystemDesignListComponent {
  searchTerm = '';
  search$ = new BehaviorSubject<string>('');
  tags$ = new BehaviorSubject<string[]>([]);

  rawQuestions$ = this.qs.loadSystemDesign().pipe(startWith<SysDesign[]>([]));

  tagOptions$ = this.rawQuestions$.pipe(
    map(qs => Array.from(new Set(qs.flatMap(q => q.tags))).sort()),
    map(tags => tags.map(t => ({ label: t, value: t })))
  );

  filtered$ = combineLatest([this.rawQuestions$, this.search$, this.tags$]).pipe(
    map(([questions, term, pickedTags]) => {
      const q = term.trim().toLowerCase();
      const hasTags = (arr: string[]) => pickedTags.length === 0 || pickedTags.every(t => arr.includes(t));
      return questions
        .filter(x =>
          (x.title.toLowerCase().includes(q) || x.tags.some(t => t.toLowerCase().includes(q))) &&
          hasTags(x.tags)
        )
        .sort((a, b) => a.title.localeCompare(b.title));
    })
  );

  constructor(public qs: QuestionService) { }

  trackById = (_: number, q: SysDesign) => q.id;
}
