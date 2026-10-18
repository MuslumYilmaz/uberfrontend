import { TestBed } from '@angular/core/testing';
import { InlineCodeComponent, stripInlineMarkup } from './inline-code.component';

describe('InlineCodeComponent', () => {
  it('formats multiple single-backtick spans while preserving literal HTML, regex and whitespace', () => {
    const fixture = TestBed.createComponent(InlineCodeComponent);
    fixture.componentRef.setInput('text', 'Use `<img src=x onerror=alert(1)>` and `/[a-z]+/g` safely.');
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    expect(Array.from(element.querySelectorAll('code')).map((code) => code.textContent))
      .toEqual(['<img src=x onerror=alert(1)>', '/[a-z]+/g']);
    expect(element.textContent).toBe('Use <img src=x onerror=alert(1)> and /[a-z]+/g safely.');
    expect(element.querySelector('img')).toBeNull();
  });

  it('keeps unmatched backticks and multi-backtick delimiters literal, including on input updates', () => {
    const fixture = TestBed.createComponent(InlineCodeComponent);
    fixture.componentRef.setInput('text', 'First `paired`, then `unmatched');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toBe('First paired, then `unmatched');
    expect(fixture.nativeElement.querySelectorAll('code').length).toBe(1);
    fixture.componentRef.setInput('text', 'Keep ``double`` and `two\nlines` literal.');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toBe('Keep ``double`` and `two\nlines` literal.');
    expect(fixture.nativeElement.querySelectorAll('code').length).toBe(0);
    fixture.componentRef.setInput('text', null);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toBe('');
  });
it('renders paired ** as strong while keeping ** inside code and unpaired markers literal', () => {
    const fixture = TestBed.createComponent(InlineCodeComponent);
    fixture.componentRef.setInput('text', 'Apply **right to left**; `a ** b` stays code; 2 ** 3 is **eight');
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    expect(Array.from(element.querySelectorAll('strong')).map((node) => node.textContent)).toEqual(['right to left']);
    expect(Array.from(element.querySelectorAll('code')).map((node) => node.textContent)).toEqual(['a ** b']);
    expect(element.textContent).toBe('Apply right to left; a ** b stays code; 2 ** 3 is **eight');
  });

  it('strips only the markup the component renders, so titles that name HTML tags keep them', () => {
    expect(stripInlineMarkup('Fix async race in `fetchWithCache`')).toBe('Fix async race in fetchWithCache');
    expect(stripInlineMarkup('What is the difference between <div> and <span>?'))
      .toBe('What is the difference between <div> and <span>?');
    expect(stripInlineMarkup('Apply **right to left**; `a ** b` stays code; 2 ** 3 is **eight'))
      .toBe('Apply right to left; a ** b stays code; 2 ** 3 is **eight');
    expect(stripInlineMarkup('Keep ``double`` and `unmatched')).toBe('Keep ``double`` and `unmatched');
    expect(stripInlineMarkup(null)).toBe('');
  });
});
