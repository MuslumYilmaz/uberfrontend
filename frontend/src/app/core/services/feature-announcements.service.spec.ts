import { Component, PLATFORM_ID, inject } from '@angular/core';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { announcementIsActive, announcementReleaseTime } from '../content/feature-announcements';
import { FEATURE_ANNOUNCEMENT_CONFIG, FeatureAnnouncementsService } from './feature-announcements.service';

@Component({ standalone: true, template: '{{ announcements.badgeFor("incidents") }}' })
class AnnouncementHost {
  readonly announcements = inject(FeatureAnnouncementsService);
}

describe('feature announcement lifetime', () => {
  it('uses a strict UTC release date and a half-open 30-day window', () => {
    expect(announcementReleaseTime('2026-02-31')).toBeNull();
    for (const date of ['', 'bad', '2026-1-1', '2026-10-01T00:00:00Z']) {
      expect(announcementIsActive(date, Date.parse('2026-10-15T00:00:00Z'))).toBeFalse();
    }
    expect(announcementIsActive('2026-10-01', Date.parse('2026-09-30T23:59:59.999Z'))).toBeFalse();
    expect(announcementIsActive('2026-10-01', Date.parse('2026-10-01T00:00:00Z'))).toBeTrue();
    expect(announcementIsActive('2026-10-01', Date.parse('2026-10-30T23:59:59.999Z'))).toBeTrue();
    expect(announcementIsActive('2026-10-01', Date.parse('2026-10-31T00:00:00Z'))).toBeFalse();
  });

  function setup(releasedAt = '2026-10-01', platform = 'browser') {
    TestBed.configureTestingModule({
      imports: [AnnouncementHost],
      providers: [
        { provide: PLATFORM_ID, useValue: platform },
        { provide: FEATURE_ANNOUNCEMENT_CONFIG, useValue: [{ featureKey: 'incidents', releasedAt }] },
      ],
    });
    const service = TestBed.inject(FeatureAnnouncementsService);
    const beforeRender = service.badgeFor('incidents');
    const fixture = TestBed.createComponent(AnnouncementHost);
    return { fixture, service, beforeRender };
  }

  it('starts after rendering and expires while a tab stays open', fakeAsync(() => {
    spyOn(Date, 'now').and.returnValue(Date.parse('2026-10-30T23:59:59Z'));
    const { fixture, service, beforeRender } = setup();
    expect(beforeRender).toBeNull();
    fixture.detectChanges();
    fixture.detectChanges();
    expect(service.badgeFor('incidents')).toBe('New');
    expect(service.badgeFor('unknown')).toBeNull();
    (Date.now as jasmine.Spy).and.returnValue(Date.parse('2026-10-31T00:00:00Z'));
    tick(1000);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toBe('');
    fixture.destroy();
  }));

  it('activates a future announcement at release and refreshes when returning to a suspended tab', fakeAsync(() => {
    spyOn(Date, 'now').and.returnValue(Date.parse('2026-10-31T23:59:59Z'));
    const { fixture, service } = setup('2026-11-01');
    fixture.detectChanges();
    expect(service.badgeFor('incidents')).toBeNull();
    (Date.now as jasmine.Spy).and.returnValue(Date.parse('2026-11-01T00:00:00Z'));
    tick(1000);
    expect(service.badgeFor('incidents')).toBe('New');
    (Date.now as jasmine.Spy).and.returnValue(Date.parse('2026-12-01T00:00:00Z'));
    spyOnProperty(document, 'hidden', 'get').and.returnValue(false);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(service.badgeFor('incidents')).toBeNull();
    fixture.destroy();
    tick(2_147_483_647);
  }));

  it('never emits transient badges in server renders', () => {
    spyOn(Date, 'now').and.returnValue(Date.parse('2026-10-02T00:00:00Z'));
    const { fixture, service } = setup('2026-10-01', 'server');
    fixture.detectChanges();
    expect(service.badgeFor('incidents')).toBeNull();
    expect(fixture.nativeElement.textContent).toBe('');
    fixture.destroy();
  });
});
