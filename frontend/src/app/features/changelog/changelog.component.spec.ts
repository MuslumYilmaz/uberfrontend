import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AnalyticsService } from '../../core/services/analytics.service';
import { PUBLIC_CHANGELOG_ENTRIES } from '../../core/content/public-changelog';
import { ChangelogComponent } from './changelog.component';

describe('ChangelogComponent', () => {
  let fixture: ComponentFixture<ChangelogComponent>;
  let analytics: jasmine.SpyObj<AnalyticsService>;

  beforeEach(async () => {
    analytics = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', ['track']);

    await TestBed.configureTestingModule({
      imports: [ChangelogComponent],
      providers: [
        provideRouter([]),
        { provide: AnalyticsService, useValue: analytics },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChangelogComponent);
    fixture.detectChanges();
  });

  it('renders a product changelog hero without stale weekly framing', () => {
    const page: HTMLElement = fixture.nativeElement;
    const text = page.textContent || '';

    expect(text).toContain('Product changelog');
    expect(text).toContain('Recent FrontendAtlas improvements');
    expect(text).not.toContain('What changed this week');
    expect(text).not.toContain('Weekly product updates');
    expect(analytics.track).toHaveBeenCalledWith('changelog_viewed', {
      page: 'changelog',
      src: 'direct',
    });
  });

  it('renders the latest update feature panel with metadata and CTA', () => {
    const page: HTMLElement = fixture.nativeElement;
    const latest = page.querySelector('[data-testid="changelog-latest"]') as HTMLElement | null;
    const latestEntry = PUBLIC_CHANGELOG_ENTRIES[0];
    const time = latest?.querySelector('time') as HTMLTimeElement | null;
    const cta = latest?.querySelector('a.btn') as HTMLAnchorElement | null;

    expect(latest).toBeTruthy();
    expect(latest?.textContent || '').toContain('Latest update');
    expect(latest?.textContent || '').toContain(latestEntry.title);
    expect(latest?.textContent || '').toContain(latestEntry.summary);
    expect(latest?.textContent || '').toContain(latestEntry.category);
    expect(latest?.textContent || '').toContain(latestEntry.area);
    expect(time?.getAttribute('datetime')).toBe(latestEntry.weekOf);
    expect(time?.textContent?.trim()).toBe('Jul 15, 2026');
    expect(cta?.getAttribute('href') || '').toContain('/react/coding/react-counter');
    expect(cta?.getAttribute('href') || '').toContain('src=changelog');
  });

  it('renders a dated anchored timeline with categories, areas, summaries, and entry CTAs', () => {
    const page: HTMLElement = fixture.nativeElement;
    const entries = Array.from(page.querySelectorAll('[data-testid="changelog-entry"]')) as HTMLElement[];

    expect(entries.length).toBe(PUBLIC_CHANGELOG_ENTRIES.length);

    const first = entries[0];
    const firstEntry = PUBLIC_CHANGELOG_ENTRIES[0];
    const anchor = first.querySelector('.entry-anchor') as HTMLAnchorElement | null;
    const time = first.querySelector('time') as HTMLTimeElement | null;
    const cta = first.querySelector('.entry-cta') as HTMLAnchorElement | null;

    expect(first.id).toBe(firstEntry.id);
    expect(first.textContent || '').toContain(firstEntry.category);
    expect(first.textContent || '').toContain(firstEntry.area);
    expect(first.textContent || '').toContain(firstEntry.summary);
    expect(time?.getAttribute('datetime')).toBe(firstEntry.weekOf);
    expect(anchor?.getAttribute('href')).toBe(`#${firstEntry.id}`);
    expect(anchor?.getAttribute('aria-label')).toBe(`Link to ${firstEntry.title}`);
    expect(cta?.textContent?.trim()).toBe(firstEntry.cta?.label);
  });

  it('keeps the validated remediation entry first and the public timeline newest-first', () => {
    const latest = PUBLIC_CHANGELOG_ENTRIES[0];
    const dates = PUBLIC_CHANGELOG_ENTRIES.map((entry) => entry.weekOf);
    const sortedDates = [...dates].sort((left, right) => right.localeCompare(left));
    const remediationText = [latest.title, latest.summary, ...latest.changes].join(' ');

    expect(latest.weekOf).toBe('2026-07-15');
    expect(dates).toEqual(sortedDates);
    expect(remediationText).toMatch(/React checks/i);
    expect(remediationText).toMatch(/Premium previews/i);
    expect(remediationText).toMatch(/Angular/i);
    expect(remediationText).toMatch(/refund/i);
    expect(remediationText).toMatch(/editorial/i);
  });
});
