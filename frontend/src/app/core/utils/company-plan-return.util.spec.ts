import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { companyPlanReturnLink } from './company-plan-return.util';

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
