import { convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { TrackDetailComponent } from './track-detail.component';

describe('TrackDetailComponent SEO', () => {
  it('keeps a locked track noindexable with a self-canonical URL', () => {
    const route = {
      paramMap: of(convertToParamMap({ slug: 'crash-7d' })),
      snapshot: { queryParamMap: convertToParamMap({}) },
    };
    const router = jasmine.createSpyObj('Router', ['navigate', 'navigateByUrl']);
    const questions = jasmine.createSpyObj('QuestionService', ['getById', 'loadSystemDesign']);
    questions.getById.and.returnValue(of(null));
    questions.loadSystemDesign.and.returnValue(of([]));
    const seo = jasmine.createSpyObj('SeoService', ['updateTags']);
    const location = jasmine.createSpyObj('Location', ['path', 'replaceState']);
    const trackState = jasmine.createSpyObj('TrackDetailStateService', ['get', 'set']);
    const progress = jasmine.createSpyObj('UserProgressService', ['isSolved']);

    const component = new TrackDetailComponent(
      route as any,
      router,
      questions,
      seo,
      location,
      trackState,
      progress,
    );

    component.ngOnInit();

    expect(seo.updateTags).toHaveBeenCalledWith(jasmine.objectContaining({
      robots: 'noindex,follow',
      canonical: '/tracks/crash-7d',
    }));

    component.ngOnDestroy();
  });
});
