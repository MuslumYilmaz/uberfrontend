import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { fetchSdkAsset } from './solution-asset.util';

describe('fetchSdkAsset', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('falls back to the same-origin asset when the CDN copy fails', async () => {
    const env = environment as any;
    const saved = { cdnBaseUrl: env.cdnBaseUrl, cdnEnabled: env.cdnEnabled };
    env.cdnBaseUrl = 'https://frontendatlas.vercel.app';
    env.cdnEnabled = true;
    localStorage.removeItem('fa:cdn:enabled');
    try {
      const pending = fetchSdkAsset(http, 'sb/react/react-counter/solution/files.json');

      httpMock
        .expectOne('https://frontendatlas.vercel.app/assets/sb/react/react-counter/solution/files.json')
        .flush('Not found', { status: 404, statusText: 'Not Found' });
      await new Promise((resolve) => setTimeout(resolve, 0));
      httpMock.expectOne('assets/sb/react/react-counter/solution/files.json').flush({ files: {} });

      expect(await pending).toEqual({ files: {} });
    } finally {
      env.cdnBaseUrl = saved.cdnBaseUrl;
      env.cdnEnabled = saved.cdnEnabled;
    }
  });
});
