#!/usr/bin/env node
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const frontendRoot = path.resolve(__dirname, '..');
export const repoRoot = path.resolve(frontendRoot, '..');
export const contentReviewsDir = path.join(repoRoot, 'content-reviews');

export const srcDir = path.join(frontendRoot, 'src');
export const srcAssetsDir = path.join(srcDir, 'assets');
export const generatedAppDir = path.join(srcDir, 'app', 'generated');

export const cdnRoot = path.join(repoRoot, 'cdn');
export const cdnQuestionsDir = path.join(cdnRoot, 'questions');
export const cdnIncidentsDir = path.join(cdnRoot, 'incidents');
export const cdnTradeoffBattlesDir = path.join(cdnRoot, 'tradeoff-battles');
export const cdnPracticeDir = path.join(cdnRoot, 'practice');

export const cdnDataVersionPath = path.join(cdnRoot, 'data-version.json');
export const cdnQuestionTrackRegistryPath = path.join(cdnQuestionsDir, 'track-registry.json');
export const cdnQuestionTopicRegistryPath = path.join(cdnQuestionsDir, 'topic-registry.json');
export const cdnQuestionTagRegistryPath = path.join(cdnQuestionsDir, 'tag-registry.json');
export const cdnQuestionShowcaseStatsPath = path.join(cdnQuestionsDir, 'showcase-stats.json');
export const cdnSystemDesignIndexPath = path.join(cdnQuestionsDir, 'system-design', 'index.json');
export const cdnIncidentsIndexPath = path.join(cdnIncidentsDir, 'index.json');
export const cdnTradeoffBattlesIndexPath = path.join(cdnTradeoffBattlesDir, 'index.json');
export const cdnPracticeRegistryPath = path.join(cdnPracticeDir, 'registry.json');

export const srcSitemapPath = path.join(srcDir, 'sitemap.xml');
export const srcSitemapIndexPath = path.join(srcDir, 'sitemap-index.xml');
export const srcPrerenderRoutesPath = path.join(srcDir, 'prerender.routes.txt');
export const guideRegistryPath = path.join(srcDir, 'app', 'shared', 'guides', 'guide.registry.ts');
export const masteryPathsDir = path.join(srcDir, 'app', 'shared', 'mastery', 'paths');
export const companyIndexComponentPath = path.join(
  srcDir,
  'app',
  'features',
  'company',
  'company-index',
  'company-index.component.ts',
);

export function relFromFrontend(filePath) {
  return path.relative(frontendRoot, filePath);
}
