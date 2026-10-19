import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FaGlyphComponent } from './fa-glyph.component';

const SVG_NS = 'http://www.w3.org/2000/svg';

@Component({
  imports: [FaGlyphComponent],
  template: `
    <app-fa-glyph class="chevron" icon="chevron-right" size="16"></app-fa-glyph>
    <app-fa-glyph class="spinner" icon="fa-solid fa-spinner"></app-fa-glyph>
    <app-fa-glyph class="fallback" icon="pi pi-unknown"></app-fa-glyph>
    <app-fa-glyph class="copy" icon="pi pi-copy"></app-fa-glyph>
  `,
})
class GlyphHostComponent {}

describe('FaGlyphComponent', () => {
  function render(): HTMLElement {
    TestBed.configureTestingModule({ imports: [GlyphHostComponent] });
    const fixture = TestBed.createComponent(GlyphHostComponent);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('renders only the matched icon shapes, in the SVG namespace', () => {
    const svg = render().querySelector('.chevron svg') as SVGSVGElement;
    const paths = svg.querySelectorAll('path');

    expect(paths.length).toBe(1);
    expect(paths[0].getAttribute('d')).toBe('m9 6 6 6-6 6');
    expect(paths[0].namespaceURI).toBe(SVG_NS);
    expect(svg.getAttribute('width')).toBe('16');
  });

  it('does not leave an anchor for every icon that did not match', () => {
    // Every app-fa-glyph is prerendered on hundreds of pages, so one anchor per
    // icon case was about 2.8 MB of empty comments across the site. The three
    // shape loops keep it at one anchor each.
    const svg = render().querySelector('.chevron svg') as SVGSVGElement;
    const comments = Array.from(svg.childNodes).filter((node) => node.nodeType === Node.COMMENT_NODE);

    expect(comments.length).toBeLessThanOrEqual(3);
  });

  it('keeps rectangles as rect elements with their corner radius', () => {
    const rects = render().querySelectorAll('.copy svg rect');

    expect(rects.length).toBe(2);
    expect(rects[0].getAttribute('rx')).toBe('2');
    expect(rects[0].namespaceURI).toBe(SVG_NS);
  });

  it('draws the spinner track and arc and keeps it spinning', () => {
    const svg = render().querySelector('.spinner svg') as SVGSVGElement;
    const track = svg.querySelector('circle');

    expect(track?.getAttribute('opacity')).toBe('0.25');
    expect(track?.namespaceURI).toBe(SVG_NS);
    expect(svg.querySelectorAll('path').length).toBe(1);
    expect(svg.classList.contains('fa-glyph__svg--spin')).toBeTrue();
  });

  it('falls back to the check icon for an unknown name', () => {
    const path = render().querySelector('.fallback svg path');

    expect(path?.getAttribute('d')).toBe('m5 12 4 4 10-10');
  });
});
