import { expect, test } from '@playwright/test';

// These assertions inspect the locally prerendered editorial contract. Keeping
// hydration disabled prevents the browser from replacing that HTML with data
// from an independently running API environment.
test.use({ javaScriptEnabled: false });

const publicCopyCases = [
  {
    path: '/',
    expected: 'Use these focus areas to move from a broad plan into the skill you need to strengthen next.',
  },
  {
    path: '/machine-coding',
    expected: 'company preparation that matches your next interview round',
  },
  {
    path: '/coding',
    expected: 'Focused paths for implementation and debugging practice.',
  },
  {
    path: '/tracks',
    expected: 'deep enough to build durable skills',
  },
  {
    path: '/companies/google/preview',
    expected: 'These free practice pages reinforce the same transferable skills.',
  },
  {
    path: '/system-design',
    expected: 'Practice the system-design prompts interviewers recognize',
  },
  {
    path: '/interview-questions/essential',
    expected: 'direct access to focused practice',
  },
  {
    path: '/interview-questions',
    expected: 'selected through editorial review',
  },
] as const;

const forbiddenInternalCopy = [
  'crawlable focus links',
  'thin keyword pages',
  'crawlable entry points',
  'search-engine quality content',
  'free, indexable pages',
  'use these crawlable routes',
  'long-tail prompts',
  'internal prompt paths',
  'preview pages stay indexable',
  'FrontendAtlas metadata',
  'importance signals',
  'shipped FrontendAtlas practice routes',
] as const;

for (const entry of publicCopyCases) {
  test(`public copy stays learner-facing on ${entry.path}`, async ({ page }) => {
    await page.goto(entry.path);
    const body = page.locator('body');
    await expect(body).toContainText(entry.expected);
    for (const forbidden of forbiddenInternalCopy) {
      await expect(body).not.toContainText(forbidden, { ignoreCase: true });
    }
  });
}

const legalRoutes = [
  '/legal',
  '/legal/editorial-policy',
  '/legal/terms',
  '/legal/privacy',
  '/legal/refund',
  '/legal/cookies',
] as const;

const forbiddenLegalPlaceholders = [
  'Add a',
  'TODO',
  'TBD',
  '[insert',
  'placeholder',
  'your company',
  'your jurisdiction',
] as const;

for (const path of legalRoutes) {
  test(`legal copy has no unfinished template language on ${path}`, async ({ page }) => {
    await page.goto(path);
    const body = page.locator('body');

    for (const forbidden of forbiddenLegalPlaceholders) {
      await expect(body).not.toContainText(forbidden, { ignoreCase: true });
    }
  });
}

test('refund policy states the support channel and limited-usage review clearly', async ({ page }) => {
  await page.goto('/legal/refund');
  const body = page.locator('body');

  await expect(body).toContainText('Refund requests: support@frontendatlas.com');
  await expect(body).toContainText(
    'By limited usage, we mean the paid library has not been substantially consumed. ' +
      'We assess this case by case based on request timing and available account records.',
  );
  await expect(body).toContainText('This policy does not limit mandatory consumer rights');
  await expect(body).toContainText('Effective date: 2025-12-31');
});

const correctedRouteCases: ReadonlyArray<{
  path: string;
  expected: readonly string[];
  forbidden?: readonly string[];
}> = [
  {
    path: '/javascript/coding/js-sanitize-href-url',
    expected: ['ASCII controls', 'trusted origin', 'Reject dangerous input instead of repairing it'],
  },
  {
    path: '/javascript/coding/js-poll-until',
    expected: ['real deadline', 'settles the returned Promise exactly once'],
  },
  {
    path: '/angular/coding/angular-snake-game',
    expected: ['at most one valid perpendicular turn per tick', 'full board'],
  },
  {
    path: '/react/coding/react-snake-game',
    expected: ['React Snake Game', 'Support keyboard controls, food spawning, score updates'],
    forbidden: ['Buffer at most one valid perpendicular turn per tick'],
  },
  {
    path: '/vue/coding/vue-snake-game',
    expected: ['Vue Snake Game', 'Support keyboard controls, food spawning, score updates'],
    forbidden: ['Buffer at most one valid perpendicular turn per tick'],
  },
  {
    path: '/react/coding/react-use-effect-once',
    expected: ['setup → cleanup → setup', 'one active resource in steady state'],
    forbidden: ['effect callback must run only once', 'cleanup exactly once'],
  },
  {
    path: '/javascript/coding/js-implement-new',
    expected: ['ECMAScript constructable targets', 'classes and bound constructors'],
    forbidden: ['exactly like native new in all cases'],
  },
  {
    path: '/javascript/coding/js-promise-any',
    expected: ['synchronous iterables', 'Sparse array holes are iterated as undefined'],
    forbidden: ['accepts an array of Promises'],
  },
  {
    path: '/angular/coding/angular-todo-list-starter',
    expected: ['modern `@for (...; track ...)` control flow'],
    forbidden: ['*ngFor="let todo of todos; trackBy: trackById"'],
  },
  {
    path: '/css/coding/css-theme-variables-dark-mode',
    expected: [':root:where(.theme-dark)', 'equal specificity'],
    forbidden: ['html.theme-dark'],
  },
  {
    path: '/css/trivia/css-custom-properties',
    expected: [':root:where(.theme-dark)', 'later source order wins'],
    forbidden: ['manual html.theme-dark override'],
  },
  {
    path: '/react/trivia/react-useeffect-vs-uselayouteffect',
    expected: ['does not provide a pre-paint guarantee', 'interaction-caused effect before paint'],
    forbidden: ['useEffect runs after paint and is non-blocking'],
  },
  {
    path: '/vue/trivia/vue-watch-vs-watcheffect-differences-infinite-loops',
    expected: ['suppresses a direct synchronous self-trigger', 'watch(count'],
    forbidden: ['This mutation retriggers the effect'],
  },
  {
    path: '/angular/trivia/angular-template-driven-vs-reactive-forms-which-scales',
    expected: ['Signal Forms are stable', 'production option'],
    forbidden: ['experimental modern forms direction'],
  },
  {
    path: '/react/interview-questions',
    expected: ['does not provide a pre-paint guarantee'],
    forbidden: ['useEffect runs after the browser has painted the committed UI'],
  },
  {
    path: '/vue/interview-questions',
    expected: ['suppresses a direct synchronous self-trigger', 'Why can this watch callback recurse forever?'],
    forbidden: ['Why can this watcher loop forever?'],
  },
  {
    path: '/angular/interview-questions',
    expected: ['stable and production-ready in Angular 22', '@for (user of users; track user.id)'],
    forbidden: ['experimental modern forms direction', '*ngFor="let user of users; trackBy: trackUser"'],
  },
  {
    path: '/html/trivia/html-clickable-image',
    expected: ['anchor without href is not a hyperlink', 'rel="noopener noreferrer"'],
    forbidden: ['The <a> tag defines a hyperlink'],
  },
  {
    path: '/html/coding/html-links-and-images',
    expected: ['anchor without href is not a hyperlink', 'anchor with a real href and a clear accessible name'],
  },
  {
    path: '/html/interview-questions',
    expected: ['anchor without href is not a hyperlink', '<a href="/pricing"><img alt="arrow"></a>'],
    forbidden: ['<a><img alt="arrow"></a>'],
  },
  {
    path: '/html-css/interview-questions',
    expected: ['anchor without href is not a hyperlink', '<a href="/pricing">'],
  },
  {
    path: '/javascript/coding/js-shallow-clone',
    expected: ['custom own enumerable string properties', 'own enumerable symbol properties'],
  },
  {
    path: '/javascript/coding/js-escape-html',
    expected: ['assign `textContent` instead', 'not a sanitizer'],
    forbidden: ['safe for any HTML context'],
  },
  {
    path: '/javascript/coding/js-implement-bind',
    expected: ['detected with `new.target`', 'not a complete `Function.prototype.bind` polyfill'],
    forbidden: ['exactly like native bind'],
  },
  {
    path: '/javascript/coding/js-implement-instanceof',
    expected: ['Invalid ordinary constructor inputs throw TypeError', 'Custom `Symbol.hasInstance`'],
  },
  {
    path: '/javascript/coding/js-create-deferred-promise',
    expected: ['const adopted = createDeferred()', "await adopted.promise; // 'ok'"],
  },
  {
    path: '/javascript/coding/js-debounce',
    expected: ['const sayHello = debounce', 'sayHello()'],
  },
  {
    path: '/javascript/coding/js-take-latest',
    expected: ['identity-guarded', 'Completed calls are therefore not aborted later'],
  },
  {
    path: '/javascript/coding/js-stream-to-text',
    expected: ['releaseLock()', 'finally'],
  },
  {
    path: '/javascript/coding/js-fetch-json-timeout',
    expected: ['embedded fetch mock handles an already-aborted signal', 'let timerId'],
  },
  {
    path: '/react/coding/react-autocomplete-search-starter',
    expected: ['Clear old options immediately', 'outside pointer interaction', 'explicit accessible name', 'mouse, pen, and touch'],
    forbidden: ['Close the dropdown on outside click'],
  },
  {
    path: '/guides/framework-prep/angular-prep-path',
    expected: ['template-driven, Reactive Forms, and stable Signal Forms', 'Angular 22 form'],
  },
] as const;

for (const entry of correctedRouteCases) {
  test(`technical model is corrected on ${entry.path}`, async ({ page }) => {
    await page.goto(entry.path);
    const body = page.locator('body');
    for (const expected of entry.expected) {
      await expect(body).toContainText(expected, { ignoreCase: true });
    }
    for (const forbidden of entry.forbidden ?? []) {
      await expect(body).not.toContainText(forbidden, { ignoreCase: true });
    }
  });
}

test('premium React progress preview renders literal threshold expressions', async ({ page }) => {
  await page.goto('/react/coding/react-progress-bar-thresholds');
  const body = page.locator('body');
  await expect(body).toContainText('red <34, orange 34–66, green >66');
  await expect(body).not.toContainText('Functional state updates to avoid stale reads.');
});
