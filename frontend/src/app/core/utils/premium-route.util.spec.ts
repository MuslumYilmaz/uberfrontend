import { PREMIUM_QUESTION_ROUTES } from '../../generated/premium-question-routes';
import { isPremiumRoute } from './premium-route.util';

describe('isPremiumRoute', () => {
  it('knows Premium questions and system design walkthroughs from the generated list', () => {
    expect(PREMIUM_QUESTION_ROUTES.length).toBeGreaterThan(100);
    expect(isPremiumRoute('/react/coding/react-chips-input-autocomplete')).toBeTrue();
    expect(isPremiumRoute('/system-design/realtime-search-debounce-cache')).toBeTrue();
  });

  it('reads a path with a fragment, a trailing slash or router commands, and leaves free pages and guides open', () => {
    expect(isPremiumRoute('/react/coding/react-chips-input-autocomplete#tests')).toBeTrue();
    expect(isPremiumRoute('/react/coding/react-chips-input-autocomplete/')).toBeTrue();
    expect(isPremiumRoute(['/react', 'coding', 'react-chips-input-autocomplete'])).toBeTrue();
    expect(isPremiumRoute('/javascript/trivia/js-closures')).toBeFalse();
    expect(isPremiumRoute('/guides/behavioral')).toBeFalse();
    expect(isPremiumRoute('')).toBeFalse();
    expect(isPremiumRoute(undefined)).toBeFalse();
  });
});
