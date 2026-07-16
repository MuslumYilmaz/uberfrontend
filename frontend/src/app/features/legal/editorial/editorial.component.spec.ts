import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { EditorialPolicyComponent } from './editorial.component';

describe('EditorialPolicyComponent', () => {
  it('states the neutral attribution and evidence-backed maintenance workflow', async () => {
    await TestBed.configureTestingModule({
      imports: [EditorialPolicyComponent, RouterTestingModule],
    }).compileComponents();

    const fixture = TestBed.createComponent(EditorialPolicyComponent);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent?.replace(/\s+/g, ' ').trim() || '';

    expect(text).toContain('FrontendAtlas Editorial');
    expect(text).toContain('Built and maintained as an independent frontend interview-prep project');
    expect(text).toContain('runnable examples');
    expect(text).toContain('regression tests');
    expect(text).toContain('Official-source checks');
    expect(text).toContain('Correction reports');
    expect(text).toContain('dated updates');
    expect(text).toContain('Last updated: 2026-07-15');
    expect(text).not.toContain('FrontendAtlas Team');
    expect(text).not.toContain('internal review');
  });
});
