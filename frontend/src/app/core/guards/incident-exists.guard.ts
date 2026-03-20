import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { IncidentService } from '../services/incident.service';

export const incidentExistsGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const incidents = inject(IncidentService);
  const id = route.paramMap.get('id') || '';

  return incidents.loadIncidentIndex({ transferState: false }).pipe(
    take(1),
    map((list) => (list.some((incident) => incident.id === id) ? true : router.parseUrl('/404'))),
  );
};
