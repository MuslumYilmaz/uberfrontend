import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { CookiesComponent } from './cookies/cookies.component';
import { RefundComponent } from './refund/refund.component';
import { TermsComponent } from './terms/terms.component';

describe('legal page build determinism', () => {
  const renderText = (component: Type<unknown>): string => {
    const fixture = TestBed.createComponent(component);
    fixture.detectChanges();
    return (fixture.nativeElement as HTMLElement).textContent?.replace(/\s+/g, ' ').trim() || '';
  };

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('keeps policy content stable when the build clock changes', async () => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date('2026-08-08T23:59:59.000Z'));

    await TestBed.configureTestingModule({
      imports: [CookiesComponent, RefundComponent, TermsComponent, RouterTestingModule],
    }).compileComponents();

    const firstBuild = {
      cookies: renderText(CookiesComponent),
      refund: renderText(RefundComponent),
      terms: renderText(TermsComponent),
    };

    jasmine.clock().mockDate(new Date('2027-01-01T00:00:01.000Z'));
    const laterBuild = {
      cookies: renderText(CookiesComponent),
      refund: renderText(RefundComponent),
      terms: renderText(TermsComponent),
    };

    expect(laterBuild).toEqual(firstBuild);
    expect(firstBuild.cookies).toContain('Last updated: 2026-03-21');
    expect(firstBuild.terms).toContain('Last updated: 2026-03-21');
    expect(firstBuild.refund).toContain('Effective date: 2025-12-31');
    for (const pageText of Object.values(firstBuild)) {
      expect(pageText).toContain('© FrontendAtlas. All rights reserved.');
    }
    expect(JSON.stringify(firstBuild)).not.toMatch(/©\s+20\d{2}/);
  });
});
