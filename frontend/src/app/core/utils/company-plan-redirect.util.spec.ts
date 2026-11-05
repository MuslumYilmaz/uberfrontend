import { companyPlanNameFromRedirect } from './company-plan-redirect.util';

describe('companyPlanNameFromRedirect', () => {
  it('names the plan a sign-up or sign-in leads back to', () => {
    expect(companyPlanNameFromRedirect('/companies/preview?companies=agoda&when=tomorrow&level=junior')).toBe('Agoda');
    expect(companyPlanNameFromRedirect('/companies/preview?companies=booking-com,capital-one&when=later&level=mid')).toBe('Booking.com and Capital One');
    expect(companyPlanNameFromRedirect('/companies/preview?companies=netflix,openai,spotify&when=this-week&level=senior')).toBe('Netflix, OpenAI and Spotify');
  });

  it('names nothing for any other address', () => {
    for (const target of ['/dashboard', '/companies/preview', '/companies/preview?when=tomorrow', '/companies/agoda/preview', '/javascript/coding/two-sum', '', null, undefined]) {
      expect(companyPlanNameFromRedirect(target)).withContext(String(target)).toBeNull();
    }
  });
});
