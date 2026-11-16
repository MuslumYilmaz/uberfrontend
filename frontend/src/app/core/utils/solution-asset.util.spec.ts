import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
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

  it('fetches the asset from the page origin', async () => {
    const pending = fetchSdkAsset(http, 'sb/react/react-counter/solution/files.json');

    httpMock.expectOne('assets/sb/react/react-counter/solution/files.json').flush({ files: {} });

    expect(await pending).toEqual({ files: {} });
  });
});
