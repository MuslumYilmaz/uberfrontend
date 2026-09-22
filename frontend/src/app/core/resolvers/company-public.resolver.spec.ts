import { Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Subject, of } from 'rxjs';
import { CompanyIndexResolved } from '../models/company-public.model';
import { CompanyPublicDataService } from '../services/company-public-data.service';
import { companyIndexResolver, companyPreviewResolver } from './company-public.resolver';

@Component({ selector: 'test-resolved-company-index', standalone: true, template: '{{ resolved.companies.length }}' })
class ResolvedCompanyIndexTestComponent {
  readonly resolved = inject(ActivatedRoute).snapshot.data['companyIndex'] as CompanyIndexResolved;
}

@Component({ selector: 'test-resolved-company-preview', standalone: true, template: '{{ slug }}' })
class ResolvedCompanyPreviewTestComponent {
  readonly slug = inject(ActivatedRoute).snapshot.data['companyPreview'].slug as string;
}

describe('company public resolvers', () => {
  it('waits before activating the directory and supplies the preview route slug', async () => {
    const index = new Subject<CompanyIndexResolved>();
    const service = jasmine.createSpyObj<CompanyPublicDataService>('CompanyPublicDataService', ['loadIndex', 'loadPreview']);
    service.loadIndex.and.returnValue(index);
    service.loadPreview.and.callFake((slug) => of({
      slug, mode: 'catalog', counts: { all: 0, coding: 0, trivia: 0, system: 0 }, samples: [],
    }));
    TestBed.configureTestingModule({ providers: [
      { provide: CompanyPublicDataService, useValue: service },
      provideRouter([
        { path: 'companies', component: ResolvedCompanyIndexTestComponent, resolve: { companyIndex: companyIndexResolver } },
        { path: 'companies/:slug/preview', component: ResolvedCompanyPreviewTestComponent, resolve: { companyPreview: companyPreviewResolver } },
      ]),
    ] });
    const harness = await RouterTestingHarness.create();
    const navigation = harness.navigateByUrl('/companies', ResolvedCompanyIndexTestComponent);
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    expect(service.loadIndex).toHaveBeenCalled();
    expect(harness.routeNativeElement).toBeNull();
    index.next({ companies: [{ slug: 'amazon', label: 'Amazon', count: 2 }] });
    index.complete();
    const component = await navigation;
    expect(component.resolved.companies.length).toBe(1);
    expect(harness.routeNativeElement?.textContent).toBe('1');

    const preview = await harness.navigateByUrl('/companies/bytedance/preview', ResolvedCompanyPreviewTestComponent);
    expect(service.loadPreview).toHaveBeenCalledWith('bytedance');
    expect(preview.slug).toBe('bytedance');
  });
});
