import { PUBLIC_QUESTION_NAVIGATION } from '../../generated/public-question-navigation';
import { publicQuestionHref } from './public-question-link.util';

describe('publicQuestionHref', () => {
  it('uses the indexable catalog across trivia, coding and debug destinations', () => {
    for (const kind of ['trivia', 'coding', 'debug']) {
      const item = PUBLIC_QUESTION_NAVIGATION.find((entry) => entry.kind === kind)!;
      expect(publicQuestionHref({ ...item, id: item.route.split('/').pop()! })).toBe(item.route);
    }
  });

  it('does not turn missing, private, premium or unlisted destinations into crawlable links', () => {
    expect(publicQuestionHref(null)).toBeNull();
    expect(publicQuestionHref({ tech: 'javascript', kind: 'coding', id: 'unlisted-premium-question' })).toBeNull();
    expect(publicQuestionHref({ tech: '..', kind: 'admin', id: 'users' })).toBeNull();
  });
});
