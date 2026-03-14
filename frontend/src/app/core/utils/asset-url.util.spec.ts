import { buildAssetUrl, normalizeAssetPath } from './asset-url.util';

describe('asset-url util', () => {
    it('normalizes question paths to assets', () => {
        expect(normalizeAssetPath('questions/javascript/coding.json'))
            .toBe('assets/questions/javascript/coding.json');
    });

    it('builds a relative asset url for questions', () => {
        expect(buildAssetUrl('questions/javascript/coding.json'))
            .toBe('assets/questions/javascript/coding.json');
    });

    it('builds a trusted remote asset url for configured CDN origins', () => {
        expect(buildAssetUrl('questions/javascript/coding.json', {
            preferBase: 'https://frontendatlas.vercel.app',
        })).toBe('https://frontendatlas.vercel.app/assets/questions/javascript/coding.json');
    });
});
