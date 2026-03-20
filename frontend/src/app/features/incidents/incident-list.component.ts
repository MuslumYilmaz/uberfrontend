import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { IncidentListItem, IncidentTech } from '../../core/models/incident.model';
import { IncidentListResolved } from '../../core/resolvers/incident.resolver';
import { IncidentProgressService } from '../../core/services/incident-progress.service';

type IncidentFilterValue = 'all' | IncidentTech;
type IncidentFilterOption = {
  value: IncidentFilterValue;
  label: string;
  count: number;
};

const INCIDENT_TECH_LABELS: Record<IncidentTech, string> = {
  javascript: 'JavaScript',
  react: 'React',
  angular: 'Angular',
  vue: 'Vue',
};

const INCIDENT_TECH_ORDER: IncidentTech[] = ['javascript', 'react', 'angular', 'vue'];

@Component({
  standalone: true,
  selector: 'app-incident-list',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './incident-list.component.html',
  styleUrls: ['./incident-list.component.css'],
})
export class IncidentListComponent {
  private readonly route = inject(ActivatedRoute);
  readonly progress = inject(IncidentProgressService);

  readonly items = signal<IncidentListItem[]>(
    ((this.route.snapshot.data['incidentList'] as IncidentListResolved | undefined)?.items ?? []),
  );
  readonly searchTerm = signal('');
  readonly techFilter = signal<IncidentFilterValue>('all');

  readonly techFilters = computed<IncidentFilterOption[]>(() => {
    const counts = new Map<IncidentTech, number>();

    for (const item of this.items()) {
      counts.set(item.tech, (counts.get(item.tech) ?? 0) + 1);
    }

    const visibleTechs = INCIDENT_TECH_ORDER.filter((tech) => counts.has(tech));
    return [
      { value: 'all', label: 'All stacks', count: this.items().length },
      ...visibleTechs.map((tech) => ({
        value: tech,
        label: INCIDENT_TECH_LABELS[tech],
        count: counts.get(tech) ?? 0,
      })),
    ];
  });

  readonly filteredItems = computed(() => {
    const search = this.searchTerm().trim().toLowerCase();
    const tech = this.techFilter();

    return this.items().filter((item) => {
      const matchesTech = tech === 'all' || item.tech === tech;
      if (!matchesTech) return false;
      if (!search) return true;

      const haystack = [
        item.title,
        item.summary,
        ...item.tags,
        ...item.signals,
      ].join(' ').toLowerCase();

      return haystack.includes(search);
    });
  });

  readonly startedCount = computed(() =>
    this.items().filter((item) => this.progress.getRecord(item.id).started).length,
  );

  readonly passedCount = computed(() =>
    this.items().filter((item) => this.progress.getRecord(item.id).passed).length,
  );

  readonly passRate = computed(() => {
    const total = this.items().length;
    if (!total) return 0;
    return Math.round((this.passedCount() / total) * 100);
  });

  setSearchTerm(value: string): void {
    this.searchTerm.set(value);
  }

  setTechFilter(value: IncidentFilterValue): void {
    this.techFilter.set(value);
  }

  recordFor(id: string) {
    return this.progress.getRecord(id);
  }

  statusLabel(id: string): string {
    const record = this.recordFor(id);
    if (record.passed) return 'Passed';
    if (record.completed) return 'Review again';
    if (record.started) return 'In progress';
    return 'Not started';
  }

  techLabel(item: IncidentListItem): string {
    return INCIDENT_TECH_LABELS[item.tech] ?? item.tech;
  }

  trackById(_: number, item: IncidentListItem): string {
    return item.id;
  }
}
