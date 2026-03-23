import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { IncidentListItem, IncidentScenario } from '../models/incident.model';
import { IncidentService } from '../services/incident.service';
import { SeoMeta, SeoService } from '../services/seo.service';
import { buildIncidentSeoMeta, INCIDENT_DETAIL_FALLBACK_SEO } from '../utils/incident-seo.util';

export interface IncidentListResolved {
  items: IncidentListItem[];
}

export interface IncidentDetailResolved {
  id: string;
  list: IncidentListItem[];
  incident: IncidentScenario | null;
  prev: IncidentListItem | null;
  next: IncidentListItem | null;
}

export const incidentSeoResolver: ResolveFn<SeoMeta> = (route) => {
  const incidents = inject(IncidentService);
  const seo = inject(SeoService);
  const id = route.paramMap.get('id') || '';
  const fallbackCanonical = id ? `/incidents/${id}` : '/incidents';

  return incidents.loadIncidentScenario(id, { transferState: false }).pipe(
    map((scenario) => scenario
      ? buildIncidentSeoMeta(scenario, (value) => seo.buildCanonicalUrl(value))
      : { ...INCIDENT_DETAIL_FALLBACK_SEO, canonical: fallbackCanonical }),
    catchError(() => of({ ...INCIDENT_DETAIL_FALLBACK_SEO, canonical: fallbackCanonical })),
  );
};

export const incidentListResolver: ResolveFn<IncidentListResolved> = () => {
  const incidents = inject(IncidentService);
  return incidents.loadIncidentIndex({ transferState: false }).pipe(
    map((items) => ({ items })),
  );
};

export const incidentDetailResolver: ResolveFn<IncidentDetailResolved> = (route) => {
  const incidents = inject(IncidentService);
  const id = route.paramMap.get('id') || '';

  return forkJoin({
    list: incidents.loadIncidentIndex({ transferState: false }),
    incident: incidents.loadIncidentScenario(id, { transferState: false }),
  }).pipe(
    map(({ list, incident }) => {
      const currentIndex = list.findIndex((item) => item.id === id);
      return {
        id,
        list,
        incident,
        prev: currentIndex > 0 ? list[currentIndex - 1] ?? null : null,
        next: currentIndex >= 0 ? list[currentIndex + 1] ?? null : null,
      };
    }),
    catchError(() =>
      of({
        id,
        list: [],
        incident: null,
        prev: null,
        next: null,
      }),
    ),
  );
};
