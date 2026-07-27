'use strict';

const { isPhoneUserAgent } = require('../services/interview/user-agent');

describe('Interview phone user-agent detection', () => {
  test.each([
    [
      'desktop Chrome',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/126 Safari/537.36',
      false,
    ],
    [
      'Android tablet',
      'Mozilla/5.0 (Linux; Android 14; Pixel C) AppleWebKit/537.36 Chrome/126 Safari/537.36',
      false,
    ],
    [
      'iPhone',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)',
      true,
    ],
    [
      'iPod',
      'Mozilla/5.0 (iPod touch; CPU iPhone OS 17_5 like Mac OS X)',
      true,
    ],
    [
      'Windows Phone',
      'mozilla/5.0 (windows phone 10.0; android 6.0.1)',
      true,
    ],
    [
      'Android phone',
      'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Mobile Safari/537.36',
      true,
    ],
    [
      'adjacent Android and Mobile tokens',
      'AndroidMobile',
      false,
    ],
  ])('classifies a %s user agent', (_label, userAgent, expected) => {
    expect(isPhoneUserAgent(userAgent)).toBe(expected);
  });

  test('handles repeated Android tokens without a polynomial regular-expression path', () => {
    const repeatedAndroid = 'android'.repeat(100_000);

    expect(isPhoneUserAgent(repeatedAndroid)).toBe(false);
    expect(isPhoneUserAgent(`${repeatedAndroid} mobile`)).toBe(true);
  });
});
