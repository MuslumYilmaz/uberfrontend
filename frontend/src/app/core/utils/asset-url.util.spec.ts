import { normalizeAssetPath } from './asset-url.util';

describe('asset-url util', () => {
    it('normalizes question paths to assets', () => {
        expect(normalizeAssetPath('questions/javascript/coding.json'))
            .toBe('assets/questions/javascript/coding.json');
    });

    it('keeps asset paths and absolute urls as they are', () => {
        expect(normalizeAssetPath('/assets/sb/react/solution.json')).toBe('assets/sb/react/solution.json');
        expect(normalizeAssetPath('https://example.com/x.json')).toBe('https://example.com/x.json');
    });
});
