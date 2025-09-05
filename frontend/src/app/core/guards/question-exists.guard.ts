import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { QuestionService } from '../services/question.service';
import { Tech } from '../models/user.model';

type Kind = 'coding' | 'trivia' | 'debug';

export const questionExistsGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
    const router = inject(Router);
    const qs = inject(QuestionService);

    const tech = (route.parent?.paramMap.get('tech') ?? 'javascript') as Tech;
    const kind = (route.data?.['kind'] as Kind) ?? 'coding';
    const id = route.paramMap.get('id') || '';

    return qs.loadQuestions(tech, kind).pipe(
        take(1),
        map(list => list.some(q => q.id === id) ? true : router.parseUrl('/404'))
    );
};
