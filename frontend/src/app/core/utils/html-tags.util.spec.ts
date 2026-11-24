import { afterOpeningTag, openingTagEnd } from './html-tags.util';

describe('afterOpeningTag', () => {
  it('skips a tag named inside a comment and finds the real one', () => {
    const source = '<!-- Edit ONLY the <head>. Do NOT change <body>. -->\n<!DOCTYPE html>\n<html lang="en">\n  <head>\n  </head>';
    expect(afterOpeningTag(source, 'head', '<style>x</style>'))
      .toBe('<!-- Edit ONLY the <head>. Do NOT change <body>. -->\n<!DOCTYPE html>\n<html lang="en">\n  <head><style>x</style>\n  </head>');
    expect(afterOpeningTag(source, 'html', '!')).toBe(source.replace('<html lang="en">', '<html lang="en">!'));
  });

  it('keeps attributes, tells head from header, and says when there is no tag', () => {
    expect(afterOpeningTag('<header></header><head data-x="1"></head>', 'head', '!'))
      .toBe('<header></header><head data-x="1">!</head>');
    expect(openingTagEnd('<body><p>No head</p></body>', 'head')).toBe(-1);
    expect(openingTagEnd('<!-- <head> only in an open comment', 'head')).toBe(-1);
    expect(afterOpeningTag('<p>Fragment</p>', 'html', '!')).toBeNull();
  });
});
