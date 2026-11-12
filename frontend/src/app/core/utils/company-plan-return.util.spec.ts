import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { companyReturnLink, planReturnLink } from './company-plan-return.util';

describe('planReturnLink', () => {
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    router = TestBed.inject(Router);
  });

  it('keeps the answers in the address, so the way back opens the same plan', () => {
    expect(planReturnLink(router, '/companies/preview?companies=agoda,meta&lists=agoda:gurgaon&when=tomorrow', 'Back to plan')).toEqual({
      label: 'Back to plan',
      route: ['/companies/preview'],
      queryParams: { companies: 'agoda,meta', lists: 'agoda:gurgaon', when: 'tomorrow' },
    });
    expect(planReturnLink(router, '/companies/plan', 'Back to plan')).toEqual({
      label: 'Back to plan',
      route: ['/companies/plan'],
      queryParams: {},
    });
  });

  it('leads a task opened from a track, or its public preview, back to that plan', () => {
    expect(planReturnLink(router, '/tracks/foundations-30d/preview', 'Back to plan')).toEqual({
      label: 'Back to plan',
      route: ['/tracks/foundations-30d/preview'],
      queryParams: {},
    });
    expect(planReturnLink(router, '/tracks/crash-7d', 'Crash track')?.route).toEqual(['/tracks/crash-7d']);
  });

  it('leaves every other list on the usual footer link', () => {
    for (const url of ['/coding?tech=javascript', '/companies/google/all', '/companies/preview-old', '/companies', '/guides/framework-prep', '/tracks', '/tracks/crash-7d/mastery']) {
      expect(planReturnLink(router, url, 'Back')).withContext(url).toBeNull();
    }
    expect(planReturnLink(router, null, 'Back to plan')).toBeNull();
    expect(planReturnLink(router, '/companies/plan', null)).toBeNull();
  });
});

describe('companyReturnLink', () => {
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    router = TestBed.inject(Router);
  });

  it('leads a locked task back to the plan or the guide it was opened from', () => {
    expect(companyReturnLink(router, '/companies/preview?companies=agoda&when=tomorrow', 'Back to plan')).toEqual({
      label: 'Back to plan',
      route: ['/companies/preview'],
      queryParams: { companies: 'agoda', when: 'tomorrow' },
    });
    expect(companyReturnLink(router, '/companies/jpmorgan/preview', 'Back to the JPMorgan guide')).toEqual({
      label: 'Back to the JPMorgan guide',
      route: ['/companies/jpmorgan/preview'],
      queryParams: {},
    });
  });

  it('offers no link for any other list', () => {
    for (const url of ['/coding?tech=javascript', '/companies/google/all', '/companies', '/companies/preview-old', '/guides/framework-prep']) {
      expect(companyReturnLink(router, url, 'Back')).withContext(url).toBeNull();
    }
    expect(companyReturnLink(router, '/companies/jpmorgan/preview', null)).toBeNull();
  });
});
