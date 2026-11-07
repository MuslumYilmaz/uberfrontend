import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { ReviewModeService } from './review-mode.service';

export const REVIEW_PAYLOAD = {
  schemaVersion: '1.0.0',
  id: 'issues-review-v1',
  title: 'Issue list review',
  access: 'premium',
  sessionMinutes: 90,
  supportedQuestions: { vue: 'vue-issue-list-review' },
  mergeRequest: {
    title: 'Add the issue list',
    description: 'Lists open issues and filters them by label.',
    issue: { title: 'Issue list', requirements: ['Load the issues once.', 'Filter by label.'] },
    files: [
      { path: 'src/App.vue', before: '<template></template>\n', after: '<template>\n  <ul></ul>\n</template>\n' },
      { path: 'src/App.spec.js', before: '', after: "it('renders', () => {});\n" },
    ],
  },
  sampleReview: {
    summary: 'Block on the repeated request.',
    comments: [
      { path: 'src/App.vue', line: 2, severity: 'blocker', title: 'Loads on every click', body: 'Load once on mount.', checked: true },
      { path: 'src/App.spec.js', line: 1, severity: 'minor', title: 'Empty test', body: 'Assert the list renders.' },
    ],
  },
};

describe('ReviewModeService', () => {
  let service: ReviewModeService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ReviewModeService);
  });

  it('keeps a complete scenario, with the files in order and unchecked comments marked as such', () => {
    const scenario = service.normalize(REVIEW_PAYLOAD);
    expect(scenario?.mergeRequest.files.map((file) => file.path)).toEqual(['src/App.vue', 'src/App.spec.js']);
    expect(scenario?.sampleReview.comments.map((comment) => comment.checked)).toEqual([true, false]);
    expect(scenario?.supportedQuestions).toEqual({ vue: 'vue-issue-list-review' });
  });

  it('drops a scenario that would render half a review', () => {
    // App.vue has three lines; the newline that ends the file is not a fourth.
    const pastTheEnd = { ...REVIEW_PAYLOAD, sampleReview: { ...REVIEW_PAYLOAD.sampleReview, comments: [{ ...REVIEW_PAYLOAD.sampleReview.comments[0], line: 4 }] } };
    expect(service.normalize(pastTheEnd)).toBeNull();
    const unknownFile = { ...REVIEW_PAYLOAD, sampleReview: { ...REVIEW_PAYLOAD.sampleReview, comments: [{ ...REVIEW_PAYLOAD.sampleReview.comments[0], path: 'src/Other.vue' }] } };
    expect(service.normalize(unknownFile)).toBeNull();
    const unchanged = { ...REVIEW_PAYLOAD, mergeRequest: { ...REVIEW_PAYLOAD.mergeRequest, files: [{ path: 'src/App.vue', before: 'x', after: 'x' }] } };
    expect(service.normalize(unchanged)).toBeNull();
    expect(service.normalize({ ...REVIEW_PAYLOAD, sessionMinutes: 0 })).toBeNull();
  });

  it('keeps the written review\'s own clock when the scenario gives one', () => {
    expect(service.normalize({ ...REVIEW_PAYLOAD, reviewMinutes: 60 })?.reviewMinutes).toBe(60);
    expect(service.normalize(REVIEW_PAYLOAD)?.reviewMinutes).toBeUndefined();
    expect(service.normalize({ ...REVIEW_PAYLOAD, reviewMinutes: 0 })).toBeNull();
    expect(service.normalize({ ...REVIEW_PAYLOAD, reviewMinutes: 'an hour' })).toBeNull();
  });

  it('only loads files from the review-mode folder', async () => {
    expect(await firstValueFrom(service.load('assets/questions/pressure-modes/counter.v1.json'))).toBeNull();
  });
});
