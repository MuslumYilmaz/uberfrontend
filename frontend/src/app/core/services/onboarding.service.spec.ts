import { OnboardingService } from './onboarding.service';

describe('OnboardingService', () => {
  afterEach(() => localStorage.removeItem('fa:onboarding:v1'));

  it('keeps a junior or mid-level answer and drops a role it does not know', () => {
    const service = new OnboardingService();
    service.complete({ timeline: '1_week', framework: 'react', targetRole: 'junior_frontend' });
    expect(service.getProfile()?.targetRole).toBe('junior_frontend');

    localStorage.setItem('fa:onboarding:v1', JSON.stringify({
      completed: true,
      profile: { timeline: '1_week', framework: 'react', targetRole: 'intern' },
    }));
    expect(service.getProfile()).toBeNull();
  });
});
