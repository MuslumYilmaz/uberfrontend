import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { companyPlanReturnLink, companyReturnLink } from './company-plan-return.util';

describe('companyPlanReturnLink', () => {
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    router = TestBed.inject(Router);
  });

  it('keeps the answers in the address, so the way back opens the same plan', () => {
    expect(companyPlanReturnLink(router, '/companies/preview?companies=agoda,meta&lists=agoda:gurgaon&when=tomorrow', 'Back to plan')).toEqual({
      label: 'Back to plan',
      route: ['/companies/preview'],
      queryParams: { companies: 'agoda,meta', lists: 'agoda:gurgaon', when: 'tomorrow' },
    });
    expect(companyPlanReturnLink(router, '/companies/plan', 'Back to plan')).toEqual({
      label: 'Back to plan',
      route: ['/companies/plan'],
      queryParams: {},
    });
  });

  it('leaves every other list on the usual footer link', () => {
    for (const url of ['/coding?tech=javascript', '/companies/google/all', '/companies/preview-old', '/companies', '/guides/framework-prep']) {
      expect(companyPlanReturnLink(router, url, 'Back')).withContext(url).toBeNull();
    }
    expect(companyPlanReturnLink(router, null, 'Back to plan')).toBeNull();
    expect(companyPlanReturnLink(router, '/companies/plan', null)).toBeNull();
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
